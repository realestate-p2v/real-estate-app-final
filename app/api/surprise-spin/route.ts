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
