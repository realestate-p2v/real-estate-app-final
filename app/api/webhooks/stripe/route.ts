import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail, sendAdminEmail } from "@/lib/mailersend";
import type { Order } from "@/lib/types/order";
import type Stripe from "stripe";
import { MongoClient, type Db } from "mongodb";

// Helper function to safely stringify errors
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * MONGODB FIX: Robust try/catch wrapper
 * - Logs exact error if DB fails
 * - Does NOT stop the script - emails will still be sent with Stripe data
 * - Returns null for order if DB connection fails
 */
async function getOrderFromDatabase(orderId: string): Promise<{ order: Order | null; dbError: string | null }> {
  console.log("[Webhook] ========================================");
  console.log("[Webhook] MONGODB: Attempting to fetch order data");
  console.log("[Webhook] ========================================");

  const uri = process.env.MONGODB_URI;

  // Check if MONGODB_URI is configured
  if (!uri) {
    const error = "MONGODB_URI environment variable is not set";
    console.error("[Webhook] MONGODB ERROR:", error);
    console.error("[Webhook] Continuing without database data - emails will use Stripe session data only");
    return { order: null, dbError: error };
  }

  // Log sanitized URI for debugging (hide password)
  const sanitizedUri = uri.replace(/:([^:@]+)@/, ":***@");
  console.log("[Webhook] MongoDB URI (sanitized):", sanitizedUri);

  let client: MongoClient | null = null;

  try {
    // Create client with serverless-optimized settings
    client = new MongoClient(uri, {
      maxPoolSize: 1,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      retryReads: true,
      tls: true,
    });

    console.log("[Webhook] Connecting to MongoDB...");
    await client.connect();
    console.log("[Webhook] MongoDB connection SUCCESSFUL");

    const db: Db = client.db("photo2video");
    console.log("[Webhook] Fetching order with orderId:", orderId);

    // Fetch the order document
    const order = await db.collection<Order>("orders").findOne({ orderId });

    if (order) {
      console.log("[Webhook] Order FOUND in database");
      console.log("[Webhook] Order details:");
      console.log("[Webhook]   - orderId:", order.orderId);
      console.log("[Webhook]   - customerEmail:", order.customer?.email);
      console.log("[Webhook]   - customerName:", order.customer?.name);
      console.log("[Webhook]   - customerPhone:", order.customer?.phone);
      console.log("[Webhook]   - photoCount:", order.photoCount);
      console.log("[Webhook]   - photos array length:", order.photos?.length || 0);
      console.log("[Webhook]   - musicSelection:", order.musicSelection);
      console.log("[Webhook]   - brandingType:", order.branding?.type);
      console.log("[Webhook]   - totalPrice:", order.totalPrice);

      // Update order status to paid/processing
      try {
        await db.collection<Order>("orders").updateOne(
          { orderId },
          {
            $set: {
              paymentStatus: "paid",
              status: "processing",
              updatedAt: new Date(),
            },
          }
        );
        console.log("[Webhook] Order status updated to paid/processing");
      } catch (updateError) {
        console.error("[Webhook] Failed to update order status:", getErrorMessage(updateError));
        // Don't fail - we still have the order data
      }

      return { order, dbError: null };
    } else {
      const error = `Order not found in database: ${orderId}`;
      console.warn("[Webhook] MONGODB WARNING:", error);
      return { order: null, dbError: error };
    }
  } catch (error) {
    // LOG THE EXACT ERROR - but don't stop the script
    const errorMessage = getErrorMessage(error);
    console.error("[Webhook] ========================================");
    console.error("[Webhook] MONGODB ERROR - EXACT ERROR MESSAGE:");
    console.error("[Webhook]", errorMessage);
    console.error("[Webhook] ========================================");

    // Provide specific guidance for common errors
    if (errorMessage.includes("bad auth") || errorMessage.includes("Authentication failed")) {
      console.error("[Webhook] DIAGNOSIS: Bad Authentication");
      console.error("[Webhook]   - Password may contain special characters needing URL encoding");
      console.error("[Webhook]   - @ -> %40, $ -> %24, # -> %23, : -> %3A");
      console.error("[Webhook]   - Username or password may be incorrect");
      console.error("[Webhook]   - Database user may lack proper permissions");
    }

    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
      console.error("[Webhook] DIAGNOSIS: DNS Resolution Failed");
      console.error("[Webhook]   - The cluster hostname could not be resolved");
      console.error("[Webhook]   - Check if the cluster name is correct");
    }

    if (errorMessage.includes("ETIMEDOUT") || errorMessage.includes("timeout")) {
      console.error("[Webhook] DIAGNOSIS: Connection Timeout");
      console.error("[Webhook]   - Network/firewall may be blocking the connection");
      console.error("[Webhook]   - MongoDB Atlas IP allowlist may need updating");
    }

    console.error("[Webhook] ========================================");
    console.error("[Webhook] CONTINUING WITHOUT DB DATA");
    console.error("[Webhook] Emails will be sent using Stripe session data only");
    console.error("[Webhook] Cloudinary links and music selection will NOT be available");
    console.error("[Webhook] ========================================");

    return { order: null, dbError: errorMessage };
  } finally {
    // Always close the connection
    if (client) {
      try {
        await client.close();
        console.log("[Webhook] MongoDB connection closed");
      } catch (closeError) {
        console.error("[Webhook] Error closing MongoDB connection:", getErrorMessage(closeError));
      }
    }
  }
}

export async function POST(request: Request) {
  console.log("[Webhook] ========================================");
  console.log("[Webhook] Stripe webhook received");
  console.log("[Webhook] Timestamp:", new Date().toISOString());
  console.log("[Webhook] ========================================");

  // Step 1: Read request body
  let body: string;
  try {
    body = await request.text();
    console.log("[Webhook] Request body length:", body.length);
  } catch (err) {
    console.error("[Webhook] Failed to read request body:", getErrorMessage(err));
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // Step 2: Get Stripe signature header
  let signature: string | null;
  try {
    const headersList = await headers();
    signature = headersList.get("stripe-signature");
    console.log("[Webhook] Stripe signature present:", !!signature);
  } catch (err) {
    console.error("[Webhook] Failed to get headers:", getErrorMessage(err));
    return NextResponse.json({ error: "Failed to read headers" }, { status: 400 });
  }

  if (!signature) {
    console.error("[Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Step 3: Verify webhook signature
  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("[Webhook] Signature verified successfully");
    console.log("[Webhook] Event type:", event.type);
    console.log("[Webhook] Event ID:", event.id);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", getErrorMessage(err));
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Step 4: Handle event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] EVENT: checkout.session.completed");
        console.log("[Webhook] Session ID:", session.id);
        console.log("[Webhook] Order ID (from metadata):", orderId);
        console.log("[Webhook] Payment Intent:", session.payment_intent);
        console.log("[Webhook] ----------------------------------------");

        // STRIPE SESSION DATA (always available)
        const stripeSessionData = {
          customerName: session.customer_details?.name || null,
          customerEmail: session.customer_details?.email || null,
          customerPhone: session.customer_details?.phone || null,
          amountTotal: session.amount_total,
        };

        console.log("[Webhook] Stripe session data:");
        console.log("[Webhook]   - customerName:", stripeSessionData.customerName);
        console.log("[Webhook]   - customerEmail:", stripeSessionData.customerEmail);
        console.log("[Webhook]   - customerPhone:", stripeSessionData.customerPhone);
        console.log("[Webhook]   - amountTotal:", stripeSessionData.amountTotal);

        // MONGODB: Fetch order (wrapped in robust try/catch)
        let order: Order | null = null;
        let dbError: string | null = null;

        if (orderId) {
          const dbResult = await getOrderFromDatabase(orderId);
          order = dbResult.order;
          dbError = dbResult.dbError;
        } else {
          dbError = "No orderId in session metadata - cannot fetch from database";
          console.warn("[Webhook]", dbError);
        }

        // Log data availability summary
        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] DATA AVAILABILITY SUMMARY:");
        console.log("[Webhook]   - Stripe session data: AVAILABLE");
        console.log("[Webhook]   - Database order data:", order ? "AVAILABLE" : "NOT AVAILABLE");
        if (dbError) {
          console.log("[Webhook]   - DB Error:", dbError);
        }
        if (order) {
          console.log("[Webhook]   - Cloudinary photos:", order.photos?.length || 0);
          console.log("[Webhook]   - Music selection:", order.musicSelection);
          console.log("[Webhook]   - Branding info:", order.branding?.type);
        }
        console.log("[Webhook] ----------------------------------------");

        // TWO SEPARATE EMAIL REQUESTS
        console.log("[Webhook] ========================================");
        console.log("[Webhook] STARTING EMAIL SENDS");
        console.log("[Webhook] ========================================");

        // Check MailerSend environment
        const mailersendApiKey = process.env.MAILERSEND_API_KEY;
        const mailersendSenderEmail = process.env.MAILERSEND_SENDER_EMAIL;
        console.log("[Webhook] MAILERSEND_API_KEY configured:", !!mailersendApiKey);
        console.log("[Webhook] MAILERSEND_SENDER_EMAIL configured:", !!mailersendSenderEmail);
        if (mailersendSenderEmail) {
          console.log("[Webhook] MAILERSEND_SENDER_EMAIL value:", mailersendSenderEmail);
        }

        // REQUEST 1: Customer Receipt Email
        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] REQUEST 1: CUSTOMER RECEIPT EMAIL");
        console.log("[Webhook] ----------------------------------------");

        if (stripeSessionData.customerEmail) {
          try {
            const customerResult = await sendCustomerEmail(order, stripeSessionData);
            if (customerResult.success) {
              console.log("[Webhook] Customer email: SUCCESS");
            } else {
              console.error("[Webhook] Customer email: FAILED -", customerResult.error);
            }
          } catch (customerEmailError) {
            console.error("[Webhook] Customer email: EXCEPTION -", getErrorMessage(customerEmailError));
          }
        } else {
          console.warn("[Webhook] Customer email: SKIPPED - No customer email available");
        }

        // REQUEST 2: Admin Full Report Email
        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] REQUEST 2: ADMIN FULL REPORT EMAIL");
        console.log("[Webhook] Recipient: realestatephoto2video@gmail.com");
        console.log("[Webhook] ----------------------------------------");

        try {
          const adminResult = await sendAdminEmail(order, stripeSessionData);
          if (adminResult.success) {
            console.log("[Webhook] Admin email: SUCCESS");
          } else {
            console.error("[Webhook] Admin email: FAILED -", adminResult.error);
          }
        } catch (adminEmailError) {
          console.error("[Webhook] Admin email: EXCEPTION -", getErrorMessage(adminEmailError));
        }

        console.log("[Webhook] ========================================");
        console.log("[Webhook] EMAIL SENDS COMPLETED");
        console.log("[Webhook] ========================================");

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        console.log("[Webhook] EVENT: payment_intent.payment_failed");
        console.log("[Webhook] Payment Intent ID:", paymentIntent.id);
        console.log("[Webhook] Order ID:", orderId);
        console.log("[Webhook] Failure reason:", paymentIntent.last_payment_error?.message);

        // Log but don't crash
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] EVENT: payment_intent.succeeded");
        console.log("[Webhook] Payment Intent ID:", paymentIntent.id);
        console.log("[Webhook] Amount:", (paymentIntent.amount / 100).toFixed(2), paymentIntent.currency.toUpperCase());
        // Main logic handled by checkout.session.completed
        break;
      }

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }
  } catch (err) {
    // Log error but return 200 to prevent Stripe retries
    console.error("[Webhook] Error processing event:", getErrorMessage(err));
  }

  console.log("[Webhook] Processing complete - returning 200");
  return NextResponse.json({ received: true });
}
