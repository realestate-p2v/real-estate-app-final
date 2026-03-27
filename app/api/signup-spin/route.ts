import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

function generateCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix;
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prize, emailOptIn } = await request.json();

    // Prevent double spin
    const { data: usage } = await supabase
      .from("lens_usage")
      .select("signup_spin_used")
      .eq("user_id", user.id)
      .maybeSingle();

    if (usage?.signup_spin_used) {
      return NextResponse.json({ error: "Already used" }, { status: 400 });
    }

    // ── Free Lens month — direct subscription grant, no Stripe coupon ──
    if (prize === "free_lens") {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await supabase.from("lens_usage").upsert({
        user_id: user.id,
        is_subscriber: true,
        subscription_tier: "free_prize",
        free_lens_started_at: now.toISOString(),
        free_lens_expires_at: expires.toISOString(),
        signup_spin_used: true,
        signup_prize_code: "FREE_LENS_30_DAYS",
        email_opt_in: emailOptIn ?? false,
      }, { onConflict: "user_id" });

      return NextResponse.json({
        success: true,
        prizeLabel: "1 free month of P2V Lens — all features unlocked!",
        promoCode: "FREE_LENS_30_DAYS",
        redirectTo: "/dashboard/lens",
      });
    }

    // ── All other prizes — create Stripe coupon ──
    let couponParams: any;
    let prizeLabel: string;

    if (prize === 10) {
      couponParams = { amount_off: 1000, currency: "usd", duration: "once" as const, name: "Welcome - $10 Off" };
      prizeLabel = "$10 off your first order";
    } else if (prize === 15) {
      couponParams = { percent_off: 15, duration: "once" as const, name: "Welcome - 15% Off" };
      prizeLabel = "15% off your first order";
    } else if (prize === 20) {
      couponParams = { percent_off: 20, duration: "once" as const, name: "Welcome - 20% Off" };
      prizeLabel = "20% off your first order";
    } else {
      return NextResponse.json({ error: "Invalid prize" }, { status: 400 });
    }

    // Create Stripe coupon and promo code
    const coupon = await stripe.coupons.create(couponParams);
    const codeStr = generateCode("WELCOME");
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: codeStr,
      max_redemptions: 1,
    });

    // Save to lens_usage — upsert so it works whether row exists or not
    await supabase.from("lens_usage").upsert({
      user_id: user.id,
      signup_spin_used: true,
      signup_prize_code: codeStr,
      email_opt_in: emailOptIn ?? false,
    }, { onConflict: "user_id" });

    return NextResponse.json({
      success: true,
      prizeLabel,
      promoCode: codeStr,
    });
  } catch (error) {
    console.error("[Signup Spin] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
