import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

// Admin check helper
async function isAdmin(supabase: any): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e: string) => e.trim().toLowerCase());
  return adminEmails.includes(user.email?.toLowerCase() || "");
}

// GET — list all reviews for admin
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const adminDb = createAdminClient();
    const { data: reviews } = await adminDb
      .from("review_rewards")
      .select("*")
      .order("submitted_at", { ascending: false });

    // Enrich with user emails
    const userIds = [...new Set((reviews || []).map((r: any) => r.user_id))];
    let emailMap: Record<string, string> = {};

    if (userIds.length > 0) {
      // Try to get emails from auth.users via admin client
      for (const uid of userIds) {
        try {
          const { data } = await adminDb
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
    }

    const enrichedReviews = (reviews || []).map((r: any) => ({
      ...r,
      user_email: emailMap[r.user_id] || null,
    }));

    return NextResponse.json({ success: true, reviews: enrichedReviews });
  } catch (error) {
    console.error("Admin reviews fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// PATCH — approve or reject a review
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { reviewId, status } = await request.json();
    if (!reviewId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    // Get the review
    const { data: review } = await adminDb
      .from("review_rewards")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (status === "rejected") {
      await adminDb
        .from("review_rewards")
        .update({
          verification_status: "rejected",
          verified_at: new Date().toISOString(),
          verified_by: adminUser?.email || "admin",
        })
        .eq("id", reviewId);

      return NextResponse.json({ success: true });
    }

    // ── Approving — generate Stripe promo code ──

    // Count total verified reviews for this user (including this one)
    const { data: allReviews } = await adminDb
      .from("review_rewards")
      .select("id, verification_status")
      .eq("user_id", review.user_id);

    const currentVerifiedCount =
      (allReviews || []).filter(
        (r: any) => r.verification_status === "approved" && r.id !== reviewId
      ).length + 1; // +1 for the one we're approving now

    // Determine discount percentage
    // 1 review = 10%, 2 reviews = 15%, 3 reviews = random 20-30% (spin wheel)
    let discountPercent: number;
    if (currentVerifiedCount >= 3) {
      // Random between 20-30 for the spin wheel
      const wheelOptions = [20, 21, 22, 23, 25, 26, 28, 30];
      discountPercent = wheelOptions[Math.floor(Math.random() * wheelOptions.length)];
    } else if (currentVerifiedCount >= 2) {
      discountPercent = 15;
    } else {
      discountPercent = 10;
    }

    // Generate Stripe coupon + promo code
    let promoCodeString = "";
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

      promoCodeString = promoCode.code;
    } catch (stripeError) {
      console.error("Stripe promo code error:", stripeError);
      return NextResponse.json({ error: "Failed to generate promo code" }, { status: 500 });
    }

    // Update review record
    await adminDb
      .from("review_rewards")
      .update({
        verification_status: "approved",
        discount_code: promoCodeString,
        discount_percent: discountPercent,
        verified_at: new Date().toISOString(),
        verified_by: adminUser?.email || "admin",
      })
      .eq("id", reviewId);

    // Get user email for notification
    let userEmail = "";
    try {
      const { data: orderData } = await adminDb
        .from("orders")
        .select("customer_email")
        .eq("user_id", review.user_id)
        .limit(1)
        .single();
      userEmail = orderData?.customer_email || "";
    } catch {}

    // Send email notification via SendGrid (if email available)
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
            subject: `Your ${discountPercent}% Review Discount is Ready! 🎉`,
            content: [
              {
                type: "text/html",
                value: `
                  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #1a1a1a;">Thanks for your ${review.platform} review! 🌟</h2>
                    <p style="color: #555;">Your review has been verified. Here's your discount code for your next order:</p>
                    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                      <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0;">Your discount code:</p>
                      <p style="font-family: monospace; font-size: 28px; font-weight: bold; color: #166534; margin: 0; letter-spacing: 2px;">${promoCodeString}</p>
                      <p style="color: #166534; font-size: 18px; font-weight: bold; margin: 8px 0 0 0;">${discountPercent}% off your next order</p>
                    </div>
                    <p style="color: #555; font-size: 14px;">Use this code at checkout on your next listing video order. Code is valid for one use.</p>
                    ${currentVerifiedCount < 3 ? `<p style="color: #555; font-size: 14px;"><strong>Leave more reviews to unlock bigger discounts!</strong> ${currentVerifiedCount === 1 ? "2 reviews = 15% off · 3 reviews = spin the wheel for 20-30% off!" : "One more review = spin the wheel for 20-30% off!"}</p>` : `<p style="color: #555; font-size: 14px;"><strong>You unlocked the spin wheel!</strong> Visit your delivery page to spin and reveal your ${discountPercent}% discount.</p>`}
                    <a href="https://realestatephoto2video.com/order" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; margin-top: 16px;">Create Your Next Video</a>
                  </div>
                `,
              },
            ],
          }),
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      promoCode: promoCodeString,
      discountPercent,
    });
  } catch (error) {
    console.error("Admin review verify error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
