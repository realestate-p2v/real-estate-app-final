import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const WEBHOOK_SECRET = process.env.STRIPE_LENS_WEBHOOK_SECRET!;

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[Lens Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      /* ─── Checkout completed → activate subscription ─── */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only handle Lens subscriptions
        if (session.metadata?.product !== "lens") break;

        const userId = session.metadata?.user_id || session.client_reference_id;
        const userEmail = session.metadata?.user_email;
        const plan = session.metadata?.plan || "monthly";
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("[Lens Webhook] No user_id in session metadata");
          break;
        }

        // Get subscription details for renewal date
        let renewsAt: string | null = null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          renewsAt = new Date(subscription.current_period_end * 1000).toISOString();
        }

        // Upsert lens_usage — activate subscription
        const { error } = await supabase
          .from("lens_usage")
          .upsert(
            {
              user_id: userId,
              is_subscriber: true,
              subscription_tier: "Individual",
              subscription_plan: plan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_started_at: new Date().toISOString(),
              subscription_renews_at: renewsAt,
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("[Lens Webhook] Supabase upsert error:", error);
        } else {
          console.log(`[Lens Webhook] ✅ Subscription activated for user ${userId} (${userEmail}) — ${plan}`);
        }

        break;
      }

      /* ─── Subscription created (new sub confirmed) ─── */
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.metadata?.product !== "lens") break;

        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const renewsAt = new Date(subscription.current_period_end * 1000).toISOString();

        await supabase
          .from("lens_usage")
          .upsert(
            {
              user_id: userId,
              is_subscriber: true,
              subscription_renews_at: renewsAt,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
            },
            { onConflict: "user_id" }
          );

        console.log(`[Lens Webhook] ✅ Subscription created for ${userId}`);
        break;
      }

      /* ─── Subscription deleted → deactivate ─── */
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.metadata?.product !== "lens") break;

        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const { error } = await supabase
          .from("lens_usage")
          .update({
            is_subscriber: false,
            subscription_renews_at: null,
            stripe_subscription_id: null,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("[Lens Webhook] Deactivation error:", error);
        } else {
          console.log(`[Lens Webhook] ❌ Subscription cancelled for user ${userId}`);
        }

        break;
      }

      /* ─── Payment failed — log warning, don't deactivate yet ─── */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.metadata?.product !== "lens") break;

        const userId = subscription.metadata?.user_id;
        console.warn(`[Lens Webhook] ⚠️ Payment failed for user ${userId}, subscription ${subscriptionId}`);
        // Stripe will retry. If all retries fail, customer.subscription.deleted fires.
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Lens Webhook] Processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
