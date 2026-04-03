import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

// Prize weights match wheel segment angles (total = 360°)
const PRIZES = [
  { value: 10, label: "10% Off 1st Month", angle: 90, type: "coupon" as const },
  { value: 15, label: "15% Off 1st Month", angle: 80, type: "coupon" as const },
  { value: 20, label: "20% Off 1st Month", angle: 70, type: "coupon" as const },
  { value: 25, label: "25% Off 1st Month", angle: 50, type: "coupon" as const },
  { value: "free_lens", label: "1 Month Free", angle: 40, type: "free_lens" as const },
  { value: 50, label: "50% Off 1st Month", angle: 30, type: "coupon" as const },
];

function pickWeightedPrize() {
  const totalWeight = PRIZES.reduce((sum, p) => sum + p.angle, 0);
  let random = Math.random() * totalWeight;
  for (const prize of PRIZES) {
    random -= prize.angle;
    if (random <= 0) return prize;
  }
  return PRIZES[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: "user_id is required" }, { status: 400 });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // 1. Check user exists and get lens_usage
    const { data: usage, error: usageError } = await supabase
      .from("lens_usage")
      .select("is_subscriber, trial_spin_used")
      .eq("user_id", user_id)
      .single();

    if (usageError || !usage) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 2. Must NOT be a subscriber
    if (usage.is_subscriber) {
      return NextResponse.json({ success: false, error: "Subscribers cannot use the trial spin" }, { status: 400 });
    }

    // 3. Must NOT have already spun
    if (usage.trial_spin_used) {
      return NextResponse.json({ success: false, error: "You have already used your trial spin" }, { status: 400 });
    }

    // 4. Verify all 4 features tried
    const [coachResult, descResult, designResult, stagingResult] = await Promise.all([
      supabase.from("lens_sessions").select("id", { count: "exact", head: true }).eq("user_id", user_id),
      supabase.from("lens_descriptions").select("id", { count: "exact", head: true }).eq("user_id", user_id),
      supabase.from("lens_usage").select("free_design_exports_used").eq("user_id", user_id).single(),
      supabase.from("lens_staging").select("id", { count: "exact", head: true }).eq("user_id", user_id),
    ]);

    const coachTried = (coachResult.count || 0) > 0;
    const descTried = (descResult.count || 0) > 0;
    const designTried = (designResult.data?.free_design_exports_used || 0) > 0;
    const stagingTried = (stagingResult.count || 0) > 0;

    if (!coachTried || !descTried || !designTried || !stagingTried) {
      return NextResponse.json({ success: false, error: "You must try all 4 features before spinning" }, { status: 400 });
    }

    // 5. Pick prize
    const prize = pickWeightedPrize();

    // 6. Process prize
    let prizeResult: { type: string; label: string; value: number | string; code?: string };

    if (prize.type === "free_lens") {
      // Grant 30-day free Lens access
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await supabase.from("lens_usage").update({
        trial_spin_used: true,
        is_subscriber: true,
        subscription_tier: "free_prize",
        free_lens_started_at: now.toISOString(),
        free_lens_expires_at: expires.toISOString(),
      }).eq("user_id", user_id);

      prizeResult = {
        type: "free_lens",
        label: "1 Month Free P2V Lens",
        value: "free_lens",
      };
    } else {
      // Create a single-use Stripe coupon + promotion code
      const percentOff = prize.value as number;

      const coupon = await stripe.coupons.create({
        percent_off: percentOff,
        duration: "once",
        name: `Trial Spin: ${percentOff}% Off 1st Month`,
        max_redemptions: 1,
      });

      const promoCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        max_redemptions: 1,
        code: `TRIAL${percentOff}-${user_id.substring(0, 6).toUpperCase()}`,
      });

      // Mark spin as used
      await supabase.from("lens_usage").update({
        trial_spin_used: true,
      }).eq("user_id", user_id);

      prizeResult = {
        type: "coupon",
        label: `${percentOff}% Off 1st Month`,
        value: percentOff,
        code: promoCode.code,
      };
    }

    return NextResponse.json({ success: true, prize: prizeResult });
  } catch (err: any) {
    console.error("Trial spin error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process trial spin" },
      { status: 500 }
    );
  }
}
