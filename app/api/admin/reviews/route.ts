import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/create-notification";

export async function GET() {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: reviews, error } = await supabase
      .from("review_rewards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (error) {
    console.error("[Admin Reviews] GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { reviewId, status } = await request.json();

    if (!reviewId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Update review status
    const { data: review, error: updateError } = await supabase
      .from("review_rewards")
      .update({ verification_status: status })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // If approved, check how many approved reviews this user now has and generate promo code
    if (status === "approved" && review) {
      const { data: allApproved } = await supabase
        .from("review_rewards")
        .select("id")
        .eq("user_id", review.user_id)
        .eq("verification_status", "approved");

      const approvedCount = allApproved?.length || 0;

      // Determine discount tier
      let discountPercent = 0;
      if (approvedCount >= 3) discountPercent = 25;
      else if (approvedCount >= 2) discountPercent = 15;
      else if (approvedCount >= 1) discountPercent = 10;

      if (discountPercent > 0) {
        // Generate unique promo code
        const code = `REVIEW${discountPercent}-${review.user_id.slice(0, 6).toUpperCase()}`;

        // Upsert promo code (update if exists for this user+source, create if not)
        const { data: existingCode } = await supabase
          .from("promo_codes")
          .select("id")
          .eq("user_id", review.user_id)
          .eq("source", "review")
          .single();

        if (existingCode) {
          await supabase
            .from("promo_codes")
            .update({ discount_percent: discountPercent, code })
            .eq("id", existingCode.id);
        } else {
          await supabase
            .from("promo_codes")
            .insert({
              code,
              discount_percent: discountPercent,
              max_uses: 3,
              user_id: review.user_id,
              source: "review",
            });
        }

        // Update the review reward with the discount info
        await supabase
          .from("review_rewards")
          .update({ discount_code: code, discount_percent: discountPercent })
          .eq("id", reviewId);

        // Notify the user their review was approved with discount code
        await createNotification({
          userId: review.user_id,
          type: "review_approved",
          title: `Your review was approved! Here's your ${discountPercent}% discount code: ${code}`,
          message: `Thanks for leaving a review! Use code ${code} on your next order for ${discountPercent}% off.`,
          link: "/dashboard/reviews",
        });
      }
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[Admin Reviews] PATCH error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
