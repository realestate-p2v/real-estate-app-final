import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const PRICE_IDS: Record<string, string> = {
  monthly: "price_1TEF6yI0vU9PjDcwOMm8pBOn",
  yearly: "price_1TEF6yI0vU9PjDcwsQhNGU3a",
};

export async function POST(request: Request) {
  try {
    const { plan, user_id, user_email } = await request.json();

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json(
        { success: false, error: "Invalid plan. Must be 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    if (!user_id || !user_email) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to subscribe." },
        { status: 401 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: usage } = await supabase
      .from("lens_usage")
      .select("is_subscriber, stripe_customer_id")
      .eq("user_id", user_id)
      .single();

    if (usage?.is_subscriber) {
      return NextResponse.json(
        { success: false, error: "You already have an active P2V Lens subscription." },
        { status: 400 }
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://realestatephoto2video.com"}/dashboard/lens?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://realestatephoto2video.com"}/lens`,
      client_reference_id: user_id,
      metadata: {
        user_id,
        user_email,
        plan,
        product: "lens",
      },
      subscription_data: {
        metadata: {
          user_id,
          user_email,
          plan,
          product: "lens",
        },
      },
    };

    if (usage?.stripe_customer_id) {
      sessionParams.customer = usage.stripe_customer_id;
    } else {
      sessionParams.customer_email = user_email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("[Lens Checkout] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
