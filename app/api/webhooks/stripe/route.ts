import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/mongodb";
import { sendOrderConfirmationEmails, sendOrderTemplateEmail } from "@/lib/mailersend";
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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (webhookSecret) {
      // Verify the webhook signature using the secret
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback: parse without verification (not recommended for production)
      console.warn("STRIPE_WEBHOOK_SECRET not configured - parsing without verification");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const db = await getDatabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        // Update order status
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

        // Fetch the complete order to send emails
        const order = await db.collection<Order>("orders").findOne({ orderId });
        
        if (order) {
          // Send confirmation emails to customer and business
          try {
            const emailResults = await sendOrderConfirmationEmails(order);
            console.log(`Order ${orderId} confirmation emails sent:`, emailResults);
          } catch (emailError) {
            console.error(`Failed to send confirmation emails for order ${orderId}:`, emailError);
            // Don't fail the webhook if emails fail - order is still valid
          }

          // Send order details via template email to business
          try {
            const templateEmailResult = await sendOrderTemplateEmail(order);
            console.log(`Order ${orderId} template email sent:`, templateEmailResult);
          } catch (templateError) {
            console.error(`Failed to send template email for order ${orderId}:`, templateError);
            // Don't fail the webhook if template email fails
          }
        }
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
