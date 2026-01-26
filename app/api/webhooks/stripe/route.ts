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
 * MONGODB FIX: Build a properly encoded MongoDB URI
 * Handles special characters in the password using encodeURIComponent
 */
function buildMongoUri(): string | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    // Parse the URI to extract components
    // Format: mongodb+srv://username:password@cluster.mongodb.net/database?options
    const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);
    
    if (match) {
      const [, protocol, username, password, rest] = match;
      // Encode the password to handle special characters like @, $, #, etc.
      const encodedPassword = encodeURIComponent(password);
      const encodedUri = `${protocol}${encodeURIComponent(username)}:${encodedPassword}@${rest}`;
      console.log("[Webhook] MongoDB URI rebuilt with encoded credentials");
      return encodedUri;
    }
    
    // If URI doesn't match expected format, return as-is
    console.log("[Webhook] MongoDB URI format not matched, using as-is");
    return uri;
  } catch (error) {
    console.error("[Webhook] Error parsing MongoDB URI:", getErrorMessage(error));
    return uri;
  }
}

/**
 * DATABASE FETCH: Robust try/catch wrapper
 * - Extracts orderId from Stripe metadata
 * - Fetches order document from MongoDB
 * - Handles special characters in MONGODB_URI
 * - Logs exact error if DB fails but does NOT stop the script
 * - Returns null for order if DB connection fails
 */
async function getOrderFromDatabase(orderId: string): Promise<{ order: Order | null; dbError: string | null }> {
  console.log("[Webhook] ========================================");
  console.log("[Webhook] DATABASE: Attempting to fetch order");
  console.log("[Webhook] Order ID:", orderId);
  console.log("[Webhook] ========================================");

  // Build URI with encoded credentials
  const uri = buildMongoUri();

  if (!uri) {
    const error = "MONGODB_URI environment variable is not set";
    console.error("[Webhook] DATABASE ERROR:", error);
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
    console.log("[Webhook] Fetching order document...");

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
      console.log("[Webhook]   - specialInstructions:", order.specialInstructions || "None");

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
      }

      return { order, dbError: null };
    } else {
      const error = `Order not found with orderId: ${orderId}`;
      console.warn("[Webhook] DATABASE WARNING:", error);
      return { order: null, dbError: error };
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("[Webhook] ========================================");
    console.error("[Webhook] DATABASE ERROR - EXACT MESSAGE:");
    console.error("[Webhook]", errorMessage);
    console.error("[Webhook] ========================================");

    // Specific diagnosis for common errors
    if (errorMessage.includes("bad auth") || errorMessage.includes("Authentication failed")) {
      console.error("[Webhook] DIAGNOSIS: Bad Authentication");
      console.error("[Webhook]   - Password may contain special characters");
      console.error("[Webhook]   - encodeURIComponent should handle: @ $ # : / ? etc.");
      console.error("[Webhook]   - Verify username/password in MongoDB Atlas");
      console.error("[Webhook]   - Check database user has readWrite permissions");
    }

    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
      console.error("[Webhook] DIAGNOSIS: DNS Resolution Failed");
      console.error("[Webhook]   - Cluster hostname could not be resolved");
    }

    if (errorMessage.includes("ETIMEDOUT") || errorMessage.includes("timeout")) {
      console.error("[Webhook] DIAGNOSIS: Connection Timeout");
      console.error("[Webhook]   - Check MongoDB Atlas IP allowlist (add 0.0.0.0/0 for Vercel)");
    }

    console.error("[Webhook] ========================================");
    console.error("[Webhook] CONTINUING WITHOUT DATABASE DATA");
    console.error("[Webhook] Emails will use Stripe data + 'Unknown' for DB fields");
    console.error("[Webhook] ========================================");

    return { order: null, dbError: errorMessage };
  } finally {
    if (client) {
      try {
        await client.close();
        console.log("[Webhook] MongoDB connection closed");
      } catch (closeError) {
        console.error("[Webhook] Error closing MongoDB:", getErrorMessage(closeError));
      }
    }
  }
}

export async function POST(request: Request) {
  console.log("[Webhook] ========================================");
  console.log("[Webhook] STRIPE WEBHOOK RECEIVED");
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
        
        // EXTRACT ORDER ID FROM STRIPE METADATA
        const orderId = session.metadata?.orderId || "Unknown";

        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] EVENT: checkout.session.completed");
        console.log("[Webhook] Session ID:", session.id);
        console.log("[Webhook] Order ID (from metadata):", orderId);
        console.log("[Webhook] Payment Intent:", session.payment_intent);
        console.log("[Webhook] ----------------------------------------");

        // STRIPE SESSION DATA (always available)
        const customerName = session.customer_details?.name || "Customer";
        const customerEmail = session.customer_details?.email || "";
        const customerPhone = session.customer_details?.phone || "Not provided";
        const amountTotal = session.amount_total || 0;
        const price = `$${(amountTotal / 100).toFixed(2)}`;

        console.log("[Webhook] Stripe Session Data:");
        console.log("[Webhook]   - customer_name:", customerName);
        console.log("[Webhook]   - customer_email:", customerEmail);
        console.log("[Webhook]   - customer_phone:", customerPhone);
        console.log("[Webhook]   - price:", price);

        // DATABASE: Fetch order (wrapped in try/catch)
        let order: Order | null = null;
        let dbError: string | null = null;

        // TRY/CATCH BLOCK 1: Database fetch
        try {
          if (orderId && orderId !== "Unknown") {
            const dbResult = await getOrderFromDatabase(orderId);
            order = dbResult.order;
            dbError = dbResult.dbError;
          } else {
            dbError = "No orderId in session metadata";
            console.warn("[Webhook]", dbError);
          }
        } catch (dbFetchError) {
          dbError = getErrorMessage(dbFetchError);
          console.error("[Webhook] Database fetch exception:", dbError);
        }

        // BUILD PERSONALIZATION DATA
        // If database fails, use "Unknown" for DB fields
        const personalizationData = {
          order_id: orderId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          price: price,
          music_choice: order?.musicSelection || "Unknown",
          video_titles: order?.branding ? buildVideoTitles(order.branding) : "Unknown",
          special_requests: order?.specialInstructions || "None",
          image_urls: order?.photos ? buildImageUrls(order.photos) : "Unknown (database connection failed)",
        };

        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] PERSONALIZATION DATA:");
        console.log("[Webhook]   - order_id:", personalizationData.order_id);
        console.log("[Webhook]   - customer_name:", personalizationData.customer_name);
        console.log("[Webhook]   - customer_email:", personalizationData.customer_email);
        console.log("[Webhook]   - customer_phone:", personalizationData.customer_phone);
        console.log("[Webhook]   - price:", personalizationData.price);
        console.log("[Webhook]   - music_choice:", personalizationData.music_choice);
        console.log("[Webhook]   - video_titles:", personalizationData.video_titles);
        console.log("[Webhook]   - special_requests:", personalizationData.special_requests);
        console.log("[Webhook]   - image_urls length:", personalizationData.image_urls.length);
        console.log("[Webhook] ----------------------------------------");

        // Check MailerSend environment
        const mailersendApiKey = process.env.MAILERSEND_API_KEY;
        const mailersendSenderEmail = process.env.MAILERSEND_SENDER_EMAIL;
        console.log("[Webhook] MAILERSEND_API_KEY set:", !!mailersendApiKey);
        console.log("[Webhook] MAILERSEND_SENDER_EMAIL:", mailersendSenderEmail || "NOT SET");

        // TWO SEPARATE EMAIL CALLS
        console.log("[Webhook] ========================================");
        console.log("[Webhook] SENDING EMAILS");
        console.log("[Webhook] ========================================");

        // TRY/CATCH BLOCK 2: Customer Email
        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] EMAIL 1: Customer Receipt");
        console.log("[Webhook] Recipient:", customerEmail);
        console.log("[Webhook] Subject: Order Confirmation - #" + orderId);
        console.log("[Webhook] ----------------------------------------");

        if (customerEmail) {
          try {
            const customerResult = await sendCustomerEmail(personalizationData);
            if (customerResult.success) {
              console.log("[Webhook] Customer email: SUCCESS");
            } else {
              console.error("[Webhook] Customer email: FAILED -", customerResult.error);
            }
          } catch (customerEmailError) {
            console.error("[Webhook] Customer email: EXCEPTION -", getErrorMessage(customerEmailError));
          }
        } else {
          console.warn("[Webhook] Customer email: SKIPPED - No email address");
        }

        // TRY/CATCH BLOCK 3: Admin Email
        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] EMAIL 2: Admin Full Report");
        console.log("[Webhook] Recipient: realestatephoto2video@gmail.com");
        console.log("[Webhook] Subject: NEW ORDER:", customerName, "- #" + orderId);
        console.log("[Webhook] ----------------------------------------");

        try {
          const adminResult = await sendAdminEmail(personalizationData);
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
        console.log("[Webhook] EVENT: payment_intent.payment_failed");
        console.log("[Webhook] Payment Intent ID:", paymentIntent.id);
        console.log("[Webhook] Failure reason:", paymentIntent.last_payment_error?.message);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] EVENT: payment_intent.succeeded");
        console.log("[Webhook] Payment Intent ID:", paymentIntent.id);
        break;
      }

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }
  } catch (err) {
    console.error("[Webhook] Error processing event:", getErrorMessage(err));
  }

  console.log("[Webhook] Processing complete - returning 200");
  return NextResponse.json({ received: true });
}

// Helper: Build video titles string from branding
function buildVideoTitles(branding: Order["branding"]): string {
  if (!branding) return "Unbranded";
  if (branding.type === "unbranded") return "Unbranded";

  const parts: string[] = [];
  if (branding.agentName) parts.push(`Agent: ${branding.agentName}`);
  if (branding.companyName) parts.push(`Company: ${branding.companyName}`);
  if (branding.phone) parts.push(`Phone: ${branding.phone}`);
  if (branding.email) parts.push(`Email: ${branding.email}`);
  if (branding.website) parts.push(`Website: ${branding.website}`);

  return parts.length > 0 ? parts.join(" | ") : branding.type;
}

// Helper: Build image URLs string from photos array
function buildImageUrls(photos: Order["photos"]): string {
  if (!photos || photos.length === 0) return "No images uploaded";
  return photos.map((photo, index) => `Photo ${index + 1}: ${photo.secure_url}`).join("\n");
}
