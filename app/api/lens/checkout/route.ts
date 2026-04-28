// app/api/lens/checkout/route.ts
// Repo: real-estate-app-final
//
// Creates Stripe Checkout sessions for Lens subscriptions.
//
// Two flows:
//   Path A (logged-in user): user_id provided → uses existing lens_usage,
//     reuses stripe_customer_id if any, blocks if already subscribed.
//   Path B (email-only): no user_id → creates Stripe session with email
//     in metadata. Webhook activates subscription via email lookup or
//     stores in lens_pending_subscriptions for /auth/callback to link
//     when the user signs in for the first time.
//
// Success URL routes to /lens/welcome — handles redirect to login or
// dashboard depending on auth state.

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const PRICE_IDS: Record<string, string> = {
  monthly: "price_1TEF6yI0vU9PjDcwOMm8pBOn",
  yearly: "price_1TEF6yI0vU9PjDcwsQhNGU3a",
  pro_monthly: "price_1TNAf5I0vU9PjDcw1mq4X1Io",
  pro_yearly: "price_1TNAfTI0vU9PjDcw8CTpNcV8",
};

export async function POST(request: Request) {
  try {
    const { plan, user_id, user_email } = await request.json();

    // Validate plan
    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json(
        { success: false, error: "Invalid plan." },
        { status: 400 }
      );
    }

    // Email is now required (replaces user_id requirement)
    if (!user_email || typeof user_email !== "string" || !user_email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = user_email.trim().toLowerCase();
    const subscriptionTier = plan.startsWith("pro") ? "pro" : "tools";

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ─── Path A: logged-in user (user_id provided) ────────────────────
    // Check existing subscription, use existing stripe_customer_id if any.
    if (user_id) {
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
        line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://realestatephoto2video.com"}/lens/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://realestatephoto2video.com"}/lens`,
        client_reference_id: user_id,
        metadata: {
          user_id,
          user_email: normalizedEmail,
          plan,
          product: "lens",
          subscription_tier: subscriptionTier,
        },
        subscription_data: {
          metadata: {
            user_id,
            user_email: normalizedEmail,
            plan,
            product: "lens",
            subscription_tier: subscriptionTier,
          },
        },
      };

      if (usage?.stripe_customer_id) {
        sessionParams.customer = usage.stripe_customer_id;
      } else {
        sessionParams.customer_email = normalizedEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return NextResponse.json({ success: true, url: session.url });
    }

    // ─── Path B: not logged in — email-only flow ──────────────────────
    // Webhook will look up the user by email after payment. If no user
    // exists yet, the subscription lands in lens_pending_subscriptions
    // and gets linked when the user signs in for the first time.
    //
    // We also check here if an existing user already has an active
    // subscription on this email (block fraud / double-charge).
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      const { data: existingUsage } = await supabase
        .from("lens_usage")
        .select("is_subscriber")
        .eq("user_id", existingUser.id)
        .single();

      if (existingUsage?.is_subscriber) {
        return NextResponse.json(
          { success: false, error: "An active P2V Lens subscription already exists for this email. Please sign in to manage it." },
          { status: 400 }
        );
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://realestatephoto2video.com"}/lens/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://realestatephoto2video.com"}/lens`,
      customer_email: normalizedEmail,
      metadata: {
        user_email: normalizedEmail,
        plan,
        product: "lens",
        subscription_tier: subscriptionTier,
        // user_id intentionally omitted — webhook handles via email lookup
      },
      subscription_data: {
        metadata: {
          user_email: normalizedEmail,
          plan,
          product: "lens",
          subscription_tier: subscriptionTier,
        },
      },
    };

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
