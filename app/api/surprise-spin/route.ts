import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { percent } = await request.json();

    // Validate percent is one of the allowed values
    if (![5, 8, 10].includes(percent)) {
      return NextResponse.json({ error: "Invalid prize" }, { status: 400 });
    }

    // Verify user is a subscriber
    const { data: lensCheck } = await supabase
      .from("lens_usage")
      .select("is_subscriber")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!lensCheck?.is_subscriber) {
      return NextResponse.json({ error: "Not a subscriber" }, { status: 403 });
    }

    // Create Stripe coupon and promo code
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: "once",
      name: `Surprise - ${percent}% Off Video`,
    });

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "SURPRISE";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: 1,
    });

    // Send email with the promo code (non-blocking)
    if (user.email && process.env.SENDGRID_API_KEY) {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || "no-reply@realestatephoto2video.com";

      fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: user.email }] }],
          from: { email: fromEmail, name: "Real Estate Photo 2 Video" },
          subject: `🎉 You won ${percent}% off your next video order!`,
          content: [
            {
              type: "text/html",
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
                  <h1 style="font-size: 28px; font-weight: 800; color: #111; margin-bottom: 8px;">🎉 Surprise Discount!</h1>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    You just won <strong style="color: #22c55e; font-size: 20px;">${percent}% off</strong> your next listing video order!
                  </p>
                  <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                    <p style="color: #888; font-size: 12px; margin: 0 0 6px 0;">Your promo code:</p>
                    <p style="font-family: monospace; font-size: 32px; font-weight: 900; color: #111; letter-spacing: 3px; margin: 0;">${code}</p>
                  </div>
                  <p style="color: #888; font-size: 13px;">Use this code at checkout. Valid for one use on any video order.</p>
                  <a href="https://realestatephoto2video.com/order" style="display: inline-block; background: #22c55e; color: white; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 50px; text-decoration: none; margin-top: 16px;">Order a Video Now</a>
                  <p style="color: #ccc; font-size: 11px; margin-top: 32px;">Real Estate Photo 2 Video · realestatephoto2video.com</p>
                </div>
              `,
            },
          ],
        }),
      }).catch((err) => {
        console.error("[Surprise Spin] Email send error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      percent,
      code,
    });
  } catch (error) {
    console.error("[Surprise Spin] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
