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
 * RESILIENT MONGODB CONNECTION
 * Handles special characters and provides detailed error logging without crashing
 */
async function getOrderFromDatabase(orderId: string): Promise<{ order: Order | null; error: string | null }> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("[v0] MONGODB_URI environment variable is not set");
    return { order: null, error: "MONGODB_URI not configured" };
  }

  // Log sanitized URI for debugging
  const sanitizedUri = uri.replace(/:([^:@]+)@/, ":***@");
  console.log("[v0] Attempting MongoDB connection with URI:", sanitizedUri);

  let client: MongoClient | null = null;

  try {
    // Create client with options optimized for serverless
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

    console.log("[v0] Connecting to MongoDB...");
    await client.connect();
    console.log("[v0] MongoDB connected successfully");

    const db: Db = client.db("photo2video");
    console.log("[v0] Fetching order with orderId:", orderId);

    // FULL DATA RETRIEVAL: Use findOne with orderId from Stripe metadata
    const order = await db.collection<Order>("orders").findOne({ orderId });

    if (order) {
      console.log("[v0] Order found successfully");
      console.log("[v0] Order details:", {
        orderId: order.orderId,
        customerEmail: order.customer?.email,
        customerName: order.customer?.name,
        photoCount: order.photoCount,
        totalPrice: order.totalPrice,
        musicSelection: order.musicSelection,
        brandingType: order.branding?.type,
      });

      // Update payment status while we have the connection
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
      console.log("[v0] Order status updated to paid/processing");

      return { order, error: null };
    } else {
      console.warn("[v0] Order not found in database:", orderId);
      return { order: null, error: `Order not found: ${orderId}` };
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("[v0] MongoDB operation failed:", errorMessage);

    // Provide specific guidance for common errors
    if (errorMessage.includes("bad auth") || errorMessage.includes("Authentication failed")) {
      console.error("[v0] BAD AUTH ERROR - Common causes:");
      console.error("[v0]   1. Password contains special characters that need URL encoding");
      console.error("[v0]   2. Example: @ -> %40, $ -> %24, # -> %23");
      console.error("[v0]   3. Username or password is incorrect");
      console.error("[v0]   4. Database user lacks proper permissions");
    }

    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
      console.error("[v0] DNS ERROR - The cluster hostname could not be resolved");
    }

    if (errorMessage.includes("ETIMEDOUT") || errorMessage.includes("timeout")) {
      console.error("[v0] TIMEOUT ERROR - Connection took too long. Check network/firewall settings.");
    }

    return { order: null, error: errorMessage };
  } finally {
    // Always close the connection in serverless environment
    if (client) {
      try {
        await client.close();
        console.log("[v0] MongoDB connection closed");
      } catch (closeError) {
        console.error("[v0] Error closing MongoDB connection:", getErrorMessage(closeError));
      }
    }
  }
}

export async function POST(request: Request) {
  console.log("[v0] ========================================");
  console.log("[v0] Stripe webhook received at:", new Date().toISOString());
  console.log("[v0] ========================================");

  // Step 1: Get raw body for signature verification
  let body: string;
  try {
    body = await request.text();
    console.log("[v0] Webhook body length:", body.length);
  } catch (err) {
    console.error("[v0] Failed to read request body:", getErrorMessage(err));
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // Step 2: Get headers
  let signature: string | null;
  try {
    const headersList = await headers();
    signature = headersList.get("stripe-signature");
    console.log("[v0] Stripe signature present:", !!signature);
  } catch (err) {
    console.error("[v0] Failed to get headers:", getErrorMessage(err));
    return NextResponse.json({ error: "Failed to read headers" }, { status: 400 });
  }

  if (!signature) {
    console.error("[v0] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Step 3: Verify webhook signature
  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[v0] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("[v0] Webhook signature verified successfully");
    console.log("[v0] Event type:", event.type);
    console.log("[v0] Event ID:", event.id);
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", getErrorMessage(err));
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Step 4: Handle event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        console.log("[v0] ----------------------------------------");
        console.log("[v0] Processing checkout.session.completed");
        console.log("[v0] Session ID:", session.id);
        console.log("[v0] Order ID from metadata:", orderId);
        console.log("[v0] Payment Intent:", session.payment_intent);
        console.log("[v0] Customer Email:", session.customer_details?.email);
        console.log("[v0] Customer Name:", session.customer_details?.name);
        console.log("[v0] Customer Phone:", session.customer_details?.phone);
        console.log("[v0] Amount Total:", session.amount_total);
        console.log("[v0] ----------------------------------------");

        // Build Stripe session data (ALWAYS available)
        const stripeSessionData = {
          customerName: session.customer_details?.name || null,
          customerEmail: session.customer_details?.email || null,
          customerPhone: session.customer_details?.phone || null,
          amountTotal: session.amount_total,
        };

        console.log("[v0] Stripe session data:", JSON.stringify(stripeSessionData));

        // REQUIREMENT 2: Full Data Retrieval from MongoDB
        let order: Order | null = null;
        let dbError: string | null = null;

        if (orderId) {
          console.log("[v0] Attempting to fetch order from database...");
          const dbResult = await getOrderFromDatabase(orderId);
          order = dbResult.order;
          dbError = dbResult.error;

          if (dbError) {
            console.warn("[v0] Database error (will continue with Stripe data):", dbError);
          }
        } else {
          console.warn("[v0] No orderId in session metadata - cannot fetch order from DB");
        }

        // Log what data we have available
        console.log("[v0] Data availability:");
        console.log("[v0]   - Stripe session data: YES");
        console.log("[v0]   - Order from database:", order ? "YES" : "NO");
        if (order) {
          console.log("[v0]   - Photos count:", order.photos?.length || 0);
          console.log("[v0]   - Music selection:", order.musicSelection);
          console.log("[v0]   - Branding type:", order.branding?.type);
        }

        // REQUIREMENT 3: Dual-Email Logic
        console.log("[v0] ========================================");
        console.log("[v0] Starting email sends...");
        console.log("[v0] ========================================");

        // Verify MailerSend API key
        const mailersendApiKey = process.env.MAILERSEND_API_KEY;
        console.log("[v0] MAILERSEND_API_KEY configured:", !!mailersendApiKey);

        // CUSTOMER EMAIL: Send to session.customer_details.email
        if (stripeSessionData.customerEmail) {
          console.log("[v0] --- Sending CUSTOMER email ---");
          try {
            const customerResult = await sendCustomerEmail(order, stripeSessionData);
            console.log("[v0] Customer email result:", JSON.stringify(customerResult));
          } catch (customerEmailError) {
            console.error("[v0] Customer email failed:", getErrorMessage(customerEmailError));
          }
        } else {
          console.warn("[v0] No customer email available - skipping customer email");
        }

        // ADMIN EMAIL: Send to realestatephoto2video@gmail.com with ALL details
        console.log("[v0] --- Sending ADMIN email ---");
        try {
          const adminResult = await sendAdminEmail(order, stripeSessionData);
          console.log("[v0] Admin email result:", JSON.stringify(adminResult));
        } catch (adminEmailError) {
          console.error("[v0] Admin email failed:", getErrorMessage(adminEmailError));
        }

        console.log("[v0] ========================================");
        console.log("[v0] Email sends completed");
        console.log("[v0] ========================================");

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        console.log("[v0] Processing payment_intent.payment_failed");
        console.log("[v0] Payment Intent ID:", paymentIntent.id);
        console.log("[v0] Order ID:", orderId);
        console.log("[v0] Failure reason:", paymentIntent.last_payment_error?.message);

        // Log the failure but don't crash
        if (orderId) {
          console.log("[v0] Would update order status to failed for:", orderId);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[v0] Payment intent succeeded:", paymentIntent.id);
        console.log("[v0] Amount:", paymentIntent.amount / 100, paymentIntent.currency);
        // Handled by checkout.session.completed
        break;
      }

      default:
        console.log("[v0] Unhandled event type:", event.type);
    }
  } catch (err) {
    // Log error but still return 200 to prevent Stripe retries
    console.error("[v0] Error processing webhook event:", getErrorMessage(err));
  }

  console.log("[v0] Webhook processing complete - returning 200");
  return NextResponse.json({ received: true });
}
