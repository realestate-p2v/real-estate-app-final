import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get or check referral code for this user
    const { data: code } = await adminSupabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!code) {
      return NextResponse.json({ success: true, hasCode: false });
    }

    // Get all earnings for this code
    const { data: earnings } = await adminSupabase
      .from("referral_earnings")
      .select("id, order_id, order_total, commission_rate, commission_amount, status, paid_at, created_at")
      .eq("referral_code_id", code.id)
      .order("created_at", { ascending: false });

    const allEarnings = earnings || [];
    const totalEarned = allEarnings.reduce((s: number, e: any) => s + (e.commission_amount || 0), 0);
    const totalPaid = allEarnings.filter((e: any) => e.status === "paid").reduce((s: number, e: any) => s + (e.commission_amount || 0), 0);
    const totalPending = totalEarned - totalPaid;
    const totalOrders = allEarnings.length;

    return NextResponse.json({
      success: true,
      hasCode: true,
      referralCode: {
        code: code.code,
        status: code.status,
        payout_method: code.payout_method,
        payout_details: code.payout_details,
        created_at: code.created_at,
      },
      stats: {
        totalEarned,
        totalPaid,
        totalPending,
        totalOrders,
      },
      earnings: allEarnings,
    });
  } catch (error) {
    console.error("Referral earnings error:", error);
    return NextResponse.json({ error: "Failed to fetch referral data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const adminSupabase = createAdminClient();

    // Create referral code
    if (body.action === "create_code") {
      // Check if user already has a code
      const { data: existing } = await adminSupabase
        .from("referral_codes")
        .select("id, code")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        return NextResponse.json({ success: true, code: existing.code, message: "You already have a referral code" });
      }

      // Generate code from name
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "user";
      const slug = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 8);
      const random = Math.floor(Math.random() * 900 + 100);
      const code = `REF-${slug}${random}`;

      const { data, error } = await adminSupabase
        .from("referral_codes")
        .insert({
          user_id: user.id,
          code,
          user_name: name,
          user_email: user.email,
          payout_method: body.payout_method || null,
          payout_details: body.payout_details || null,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, code: data.code });
    }

    // Update payout info
    if (body.action === "update_payout") {
      const { error } = await adminSupabase
        .from("referral_codes")
        .update({
          payout_method: body.payout_method,
          payout_details: body.payout_details,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Referral POST error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
