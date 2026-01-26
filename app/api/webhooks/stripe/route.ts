import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/mongodb";
import type { Order } from "@/lib/types/order";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // For now, we'll parse without webhook secret verification
    // In production, add STRIPE_WEBHOOK_SECRET env var
    event = JSON.parse(body) as Stripe.Event;
  } catch (err) {
    console.error("Webhook parsing error:", err);
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const db = await getDatabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db.collection<Order>("orders").updateOne(
          { orderId },
          {
            $set: {
              paymentStatus: "paid",
              stripePaymentIntentId: session.payment_intent as string,
              status: "processing",
              updatedAt: new Date(),
            },
          }
        );
        console.log(`Order ${orderId} marked as paid`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        await db.collection<Order>("orders").updateOne(
          { orderId },
          {
            $set: {
              paymentStatus: "failed",
              updatedAt: new Date(),
            },
          }
        );
        console.log(`Order ${orderId} payment failed`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
