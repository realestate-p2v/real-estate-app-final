import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/mongodb";
import {
  sendOrderConfirmationEmails,
  sendOrderTemplateEmail,
  sendCustomerReceiptEmail,
} from "@/lib/mailersend";
import type { Order } from "@/lib/types/order";
import type Stripe from "stripe";

// Helper function to safely stringify errors
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ""}`;
  }
  return String(error);
}

export async function POST(request: Request) {
  console.log("[v0] Stripe webhook received at:", new Date().toISOString());

  // Step 1: Get raw body for signature verification
  let body: string;
  try {
    body = await request.text();
    console.log("[v0] Webhook body length:", body.length);
  } catch (err) {
    console.error("[v0] Failed to read request body:", getErrorMessage(err));
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 }
    );
  }

  // Step 2: Get headers
  let signature: string | null;
  try {
    const headersList = await headers();
    signature = headersList.get("stripe-signature");
    console.log("[v0] Stripe signature present:", !!signature);
  } catch (err) {
    console.error("[v0] Failed to get headers:", getErrorMessage(err));
    return NextResponse.json(
      { error: "Failed to read headers" },
      { status: 400 }
    );
  }

  if (!signature) {
    console.error("[v0] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // Step 3: Verify webhook signature
  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[v0] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("[v0] Webhook signature verified successfully");
    console.log("[v0] Event type:", event.type);
    console.log("[v0] Event ID:", event.id);
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", getErrorMessage(err));
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Step 4: Handle event types
  // Note: Database and email operations are now independent - emails will attempt to send
  // even if database operations fail
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        console.log("[v0] Processing checkout.session.completed");
        console.log("[v0] Session ID:", session.id);
        console.log("[v0] Order ID from metadata:", orderId);
        console.log("[v0] Payment Intent:", session.payment_intent);
        console.log("[v0] Customer Email:", session.customer_details?.email);

        if (!orderId) {
          console.warn("[v0] No orderId in session metadata - skipping");
          break;
        }

        // Try to connect to database (non-blocking for emails)
        let db = null;
        let order: Order | null = null;
        let dbConnectionSucceeded = false;

        try {
          db = await getDatabase();
          dbConnectionSucceeded = true;
          console.log("[v0] Database connection established");
        } catch (dbConnErr) {
          console.error("[v0] Database connection failed (will still attempt emails):", getErrorMessage(dbConnErr));
        }

        // Update order status in database (if connected)
        if (db && dbConnectionSucceeded) {
          try {
            const updateResult = await db.collection<Order>("orders").updateOne(
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
            console.log("[v0] Order update result:", {
              matchedCount: updateResult.matchedCount,
              modifiedCount: updateResult.modifiedCount,
            });

            if (updateResult.matchedCount === 0) {
              console.error("[v0] Order not found in database:", orderId);
            }
          } catch (dbErr) {
            console.error("[v0] Failed to update order:", getErrorMessage(dbErr));
          }

          // Fetch the complete order to send emails
          try {
            order = await db.collection<Order>("orders").findOne({ orderId });
            console.log("[v0] Order fetched:", order ? "success" : "not found");
            if (order) {
              console.log("[v0] Order details:", {
                orderId: order.orderId,
                customerEmail: order.customer?.email,
                customerName: order.customer?.name,
                totalPrice: order.totalPrice,
                photoCount: order.photoCount,
              });
            }
          } catch (fetchErr) {
            console.error("[v0] Failed to fetch order:", getErrorMessage(fetchErr));
          }
        }

        // If we couldn't get the order from DB but have session data, construct a minimal order for emails
        // This ensures emails can still be sent even if DB is down
        if (!order && session.customer_details?.email) {
          console.log("[v0] Constructing fallback order from Stripe session data for emails");
          
          // Parse metadata to reconstruct order details
          const metadata = session.metadata || {};
          order = {
            orderId: orderId,
            customer: {
              name: session.customer_details?.name || metadata.customerName || "Customer",
              email: session.customer_details?.email,
              phone: metadata.customerPhone || "",
            },
            photos: [], // We don't have photo URLs in session
            photoCount: parseInt(metadata.photoCount || "0", 10),
            musicSelection: metadata.musicSelection || "Unknown",
            branding: {
              type: (metadata.brandingType as "unbranded" | "basic" | "custom") || "unbranded",
              agentName: metadata.agentName,
              companyName: metadata.companyName,
              phone: metadata.brandingPhone,
              email: metadata.brandingEmail,
              website: metadata.brandingWebsite,
              logoUrl: metadata.logoUrl,
            },
            voiceover: metadata.voiceover === "true",
            voiceoverScript: metadata.voiceoverScript,
            specialInstructions: metadata.specialInstructions,
            basePrice: parseFloat(metadata.basePrice || "0"),
            brandingFee: parseFloat(metadata.brandingFee || "0"),
            voiceoverFee: parseFloat(metadata.voiceoverFee || "0"),
            totalPrice: (session.amount_total || 0) / 100,
            paymentStatus: "paid",
            status: "processing",
            stripePaymentIntentId: session.payment_intent as string,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Order;
          
          console.log("[v0] Fallback order constructed:", {
            orderId: order.orderId,
            customerEmail: order.customer?.email,
            totalPrice: order.totalPrice,
          });
        }

        // Send emails independently - each email attempt is isolated
        if (order) {
          // Send customer receipt email (template-based receipt)
          try {
            console.log("[v0] Sending customer receipt email...");
            const receiptResult = await sendCustomerReceiptEmail(order);
            console.log("[v0] Customer receipt email result:", receiptResult);
          } catch (receiptError) {
            console.error(
              "[v0] Failed to send customer receipt email:",
              getErrorMessage(receiptError)
            );
          }

          // Send confirmation emails to customer and business (HTML emails)
          try {
            console.log("[v0] Sending confirmation emails...");
            const emailResults = await sendOrderConfirmationEmails(order);
            console.log("[v0] Confirmation emails result:", emailResults);
          } catch (emailError) {
            console.error(
              "[v0] Failed to send confirmation emails:",
              getErrorMessage(emailError)
            );
          }

          // Send order details via template email to business
          try {
            console.log("[v0] Sending business template email...");
            const templateEmailResult = await sendOrderTemplateEmail(order);
            console.log("[v0] Business template email result:", templateEmailResult);
          } catch (templateError) {
            console.error(
              "[v0] Failed to send template email:",
              getErrorMessage(templateError)
            );
          }
        } else {
          console.warn("[v0] No order data available, skipping email notifications");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        console.log("[v0] Processing payment_intent.payment_failed");
        console.log("[v0] Payment Intent ID:", paymentIntent.id);
        console.log("[v0] Order ID from metadata:", orderId);
        console.log("[v0] Failure reason:", paymentIntent.last_payment_error?.message);

        if (orderId) {
          // Try to connect to database for updating failed status
          let db = null;
          try {
            db = await getDatabase();
          } catch (dbConnErr) {
            console.error("[v0] Database connection failed for payment_failed event:", getErrorMessage(dbConnErr));
          }

          if (db) {
            try {
              const updateResult = await db.collection<Order>("orders").updateOne(
                { orderId },
                {
                  $set: {
                    paymentStatus: "failed",
                    paymentFailureReason: paymentIntent.last_payment_error?.message || "Unknown",
                    updatedAt: new Date(),
                  },
                }
              );
              console.log("[v0] Order marked as failed:", {
                matchedCount: updateResult.matchedCount,
                modifiedCount: updateResult.modifiedCount,
              });
            } catch (dbErr) {
              console.error("[v0] Failed to update order status:", getErrorMessage(dbErr));
            }
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[v0] Payment intent succeeded:", paymentIntent.id);
        console.log("[v0] Amount:", paymentIntent.amount / 100, paymentIntent.currency);
        // This is handled by checkout.session.completed, just log for debugging
        break;
      }

      default:
        console.log("[v0] Unhandled event type:", event.type);
    }
  } catch (err) {
    console.error("[v0] Error processing webhook event:", getErrorMessage(err));
    // Still return 200 to prevent Stripe from retrying
    // The error is logged for debugging
  }

  console.log("[v0] Webhook processing complete");
  return NextResponse.json({ received: true });
}
