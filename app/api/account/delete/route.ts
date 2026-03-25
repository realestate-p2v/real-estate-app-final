import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  try {
    // Verify the user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;
    const adminDb = createAdminClient();

    // Delete user data from all tables (order matters — foreign keys)
    const tables = [
      { table: "lens_staging", field: "user_id" },
      { table: "lens_sessions", field: "user_id" },
      { table: "lens_descriptions", field: "user_id" },
      { table: "lens_usage", field: "user_id" },
      { table: "notifications", field: "user_id" },
      { table: "order_drafts", field: "user_id" },
      { table: "review_rewards", field: "user_id" },
      { table: "photographers", field: "user_id" },
      { table: "referral_codes", field: "user_id" },
      { table: "music_votes", field: "user_id" },
    ];

    for (const { table, field } of tables) {
      try {
        await adminDb.from(table).delete().eq(field, userId);
      } catch (e) {
        console.error(`Failed to delete from ${table}:`, e);
        // Continue — don't block deletion for non-critical tables
      }
    }

    // Delete referral earnings (linked via referral_codes)
    try {
      const { data: codes } = await adminDb
        .from("referral_codes")
        .select("id")
        .eq("user_id", userId);
      if (codes && codes.length > 0) {
        const codeIds = codes.map((c: any) => c.id);
        await adminDb.from("referral_earnings").delete().in("referral_code_id", codeIds);
      }
    } catch (e) {
      console.error("Failed to delete referral earnings:", e);
    }

    // Delete brokerage membership by email
    if (userEmail) {
      try {
        await adminDb.from("brokerage_members").delete().eq("email", userEmail);
      } catch (e) {
        console.error("Failed to delete brokerage membership:", e);
      }

      // Delete directory inquiries by email
      try {
        await adminDb.from("directory_inquiries").delete().eq("from_email", userEmail);
      } catch (e) {
        console.error("Failed to delete directory inquiries:", e);
      }
    }

    // Orders are NOT deleted — they're anonymized to preserve business records
    try {
      await adminDb
        .from("orders")
        .update({
          customer_name: "Deleted User",
          customer_email: "deleted@deleted.com",
          customer_phone: null,
        })
        .eq("user_id", userId);
    } catch (e) {
      console.error("Failed to anonymize orders:", e);
    }

    // Cancel Stripe subscription if exists
    try {
      const stripe = (await import("@/lib/stripe")).stripe;
      if (userEmail) {
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "active",
          });
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to cancel Stripe subscriptions:", e);
    }

    // Finally, delete the auth user (requires admin/service role)
    try {
      await adminDb.auth.admin.deleteUser(userId);
    } catch (e) {
      console.error("Failed to delete auth user:", e);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
