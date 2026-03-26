import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/create-notification";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = getSupabase();

    const { data: reviews, error } = await supabase
      .from("review_rewards")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Enrich with user emails from orders table
    const userIds = [...new Set((reviews || []).map((r: any) => r.user_id).filter(Boolean))];
    const emailMap: Record<string, string> = {};

    for (const uid of userIds) {
      try {
        const { data } = await supabase
          .from("orders")
          .select("customer_email")
          .eq("user_id", uid)
          .limit(1)
          .single();
        if (data?.customer_email) {
          emailMap[uid as string] = data.customer_email;
        }
      } catch {}
    }

    const enrichedReviews = (reviews || []).map((r: any) => ({
      ...r,
      user_email: emailMap[r.user_id] || null,
    }));

    return NextResponse.json({ success: true, reviews: enrichedReviews });
  } catch (error) {
    console.error("[Admin Reviews] GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { isAdmin: admin, user: adminUser } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { reviewId, status } = await request.json();

    if (!reviewId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Update review status with verification metadata
    const { data: review, error: updateError } = await supabase
      .from("review_rewards")
      .update({
        verification_status: status,
        verified_at: new Date().toISOString(),
        verified_by: adminUser?.email || "admin",
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // If approved, generate discount code
    if (status === "approved" && review) {
      const { data: allApproved } = await supabase
        .from("review_rewards")
        .select("id")
        .eq("user_id", review.user_id)
        .eq("verification_status", "approved");

      const approvedCount = allApproved?.length || 0;

      // Determine discount tier
      // 1 review = 10%, 2 reviews = 15%, 3 reviews = random 20-30% (spin wheel)
      let discountPercent = 0;
      if (approvedCount >= 3) {
        const wheelOptions = [20, 21, 22, 23, 25, 26, 28, 30];
        discountPercent = wheelOptions[Math.floor(Math.random() * wheelOptions.length)];
      } else if (approvedCount >= 2) {
        discountPercent = 15;
      } else if (approvedCount >= 1) {
        discountPercent = 10;
      }

      if (discountPercent > 0) {
        // Generate Stripe coupon + promotion code
        let stripePromoCode = "";
        try {
          const coupon = await stripe.coupons.create({
            percent_off: discountPercent,
            duration: "once",
            name: `Review Reward - ${review.platform} (${discountPercent}% off)`,
          });

          const code = `REVIEW${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const promoCode = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code,
            max_redemptions: 1,
          });

          stripePromoCode = promoCode.code;
        } catch (stripeError) {
          console.error("[Admin Reviews] Stripe promo code error:", stripeError);
          // Fall back to internal code if Stripe fails
          stripePromoCode = `REVIEW${discountPercent}-${review.user_id.slice(0, 6).toUpperCase()}`;
        }

        // Upsert to promo_codes table
        const { data: existingCode } = await supabase
          .from("promo_codes")
          .select("id")
          .eq("user_id", review.user_id)
          .eq("source", "review")
          .single();

        if (existingCode) {
          await supabase
            .from("promo_codes")
            .update({ discount_percent: discountPercent, code: stripePromoCode })
            .eq("id", existingCode.id);
        } else {
          await supabase
            .from("promo_codes")
            .insert({
              code: stripePromoCode,
              discount_percent: discountPercent,
              max_uses: 3,
              user_id: review.user_id,
              source: "review",
            });
        }

        // Update the review reward with the discount info
        await supabase
          .from("review_rewards")
          .update({
            discount_code: stripePromoCode,
            discount_percent: discountPercent,
          })
          .eq("id", reviewId);

        // Notify the user
        const isSpinWheel = approvedCount >= 3;
        await createNotification({
          userId: review.user_id,
          type: "review_approved",
          title: isSpinWheel
            ? `All 3 reviews verified! Spin the wheel on your delivery page for ${discountPercent}% off!`
            : `Your review was approved! Here's your ${discountPercent}% discount code: ${stripePromoCode}`,
          message: isSpinWheel
            ? `Thanks for all 3 reviews! Visit your delivery page to spin the wheel and reveal your discount. Code: ${stripePromoCode}`
            : `Thanks for leaving a review! Use code ${stripePromoCode} on your next order for ${discountPercent}% off.`,
          link: review.order_id ? `/video/${review.order_id}` : "/dashboard/reviews",
        });

        // Send email via SendGrid if available
        let userEmail = "";
        try {
          const { data: orderData } = await supabase
            .from("orders")
            .select("customer_email")
            .eq("user_id", review.user_id)
            .limit(1)
            .single();
          userEmail = orderData?.customer_email || "";
        } catch {}

        if (userEmail && process.env.SENDGRID_API_KEY) {
          try {
            await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: userEmail }] }],
                from: {
                  email: process.env.SENDGRID_FROM_EMAIL || "no-reply@realestatephoto2video.com",
                  name: "Photo 2 Video",
                },
                subject: isSpinWheel
                  ? `🎡 Spin the Wheel — Your 3-Review Reward is Ready!`
                  : `Your ${discountPercent}% Review Discount is Ready! 🎉`,
                content: [
                  {
                    type: "text/html",
                    value: `
                      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                        <h2 style="color: #1a1a1a;">Thanks for your ${review.platform} review! 🌟</h2>
                        ${isSpinWheel
                          ? `<p style="color: #555;">All 3 of your reviews have been verified! Visit your delivery page to spin the wheel and reveal your discount (20-30% off).</p>`
                          : `<p style="color: #555;">Your review has been verified. Here's your discount code for your next order:</p>`
                        }
                        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                          <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0;">Your discount code:</p>
                          <p style="font-family: monospace; font-size: 28px; font-weight: bold; color: #166534; margin: 0; letter-spacing: 2px;">${stripePromoCode}</p>
                          <p style="color: #166534; font-size: 18px; font-weight: bold; margin: 8px 0 0 0;">${discountPercent}% off your next order</p>
                        </div>
                        <p style="color: #555; font-size: 14px;">Use this code at checkout on your next listing video order. Code is valid for one use.</p>
                        ${approvedCount < 3
                          ? `<p style="color: #555; font-size: 14px;"><strong>Leave more reviews to unlock bigger discounts!</strong> ${approvedCount === 1 ? "2 reviews = 15% off · 3 reviews = spin the wheel for 20-30% off!" : "One more review = spin the wheel for 20-30% off!"}</p>`
                          : `<p style="color: #555; font-size: 14px;"><strong>You unlocked the spin wheel!</strong> Visit your delivery page to spin and reveal your discount.</p>`
                        }
                        <a href="https://realestatephoto2video.com/order" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; margin-top: 16px;">Create Your Next Video</a>
                      </div>
                    `,
                  },
                ],
              }),
            });
          } catch (emailError) {
            console.error("[Admin Reviews] Email send error:", emailError);
          }
        }
      }
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[Admin Reviews] PATCH error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
