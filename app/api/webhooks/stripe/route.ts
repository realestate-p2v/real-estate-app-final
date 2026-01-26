import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail, sendAdminNotificationEmail } from "@/lib/mailersend";
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
 * Uses encodeURIComponent on the password to handle special characters like @, $, #, etc.
 * 
 * IMPORTANT: If you're getting "bad auth" errors, your password likely contains special characters.
 * MongoDB connection strings require URL-encoding for passwords with: @ : / ? # [ ] $ & + , ; = %
 * 
 * This function automatically handles encoding, but if issues persist:
 * 1. Go to MongoDB Atlas and reset your database user password to something simpler (letters/numbers only)
 * 2. Or manually URL-encode your password in the MONGODB_URI environment variable
 */
function buildMongoUri(): string | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    // Parse the URI to extract components
    // Format: mongodb+srv://username:password@cluster.mongodb.net/database?options
    // Note: Password may contain special characters including @, so we need careful parsing
    
    // First, check if URI starts with valid protocol
    const protocolMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)/);
    if (!protocolMatch) {
      console.log("[Webhook] MongoDB URI doesn't have valid protocol, using as-is");
      return uri;
    }
    
    const protocol = protocolMatch[1];
    const rest = uri.slice(protocol.length);
    
    // Find the @ that separates credentials from host (it's the LAST @ before the first . or /)
    // This handles passwords that contain @
    const atIndex = rest.lastIndexOf("@");
    if (atIndex === -1) {
      console.log("[Webhook] MongoDB URI has no credentials, using as-is");
      return uri;
    }
    
    const credentials = rest.slice(0, atIndex);
    const hostAndRest = rest.slice(atIndex + 1);
    
    // Split credentials into username and password at the FIRST colon
    const colonIndex = credentials.indexOf(":");
    if (colonIndex === -1) {
      console.log("[Webhook] MongoDB URI has no password, using as-is");
      return uri;
    }
    
    const username = credentials.slice(0, colonIndex);
    const password = credentials.slice(colonIndex + 1);
    
    // Check if already encoded (contains %XX patterns)
    const isAlreadyEncoded = /%[0-9A-Fa-f]{2}/.test(password);
    
    if (isAlreadyEncoded) {
      console.log("[Webhook] MongoDB password appears already encoded, using as-is");
      return uri;
    }
    
    // AUTH FIX: Encode BOTH username and password to handle special characters
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    const encodedUri = `${protocol}${encodedUsername}:${encodedPassword}@${hostAndRest}`;
    
    console.log("[Webhook] MongoDB URI rebuilt with encodeURIComponent on credentials");
    console.log("[Webhook] Original password length:", password.length, "Encoded length:", encodedPassword.length);
    
    return encodedUri;
  } catch (error) {
    console.error("[Webhook] Error parsing MongoDB URI:", getErrorMessage(error));
    return uri;
  }
}

/**
 * DATABASE FETCH: Robust try/catch wrapper with detailed error logging
 * - Extracts orderId from Stripe metadata
 * - Fetches order document from MongoDB
 * - Uses encodeURIComponent on password to handle special characters
 * - Logs EXACT error.message to Vercel console for debugging
 * - Returns null for order if DB connection fails (does NOT stop the script)
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
    // DEBUGGING: Log the EXACT error.message for Vercel console
    const errorMessage = getErrorMessage(error);
    console.error("[Webhook] ========================================");
    console.error("[Webhook] DATABASE ERROR - EXACT MESSAGE:");
    console.error("[Webhook]", errorMessage);
    
    // Log raw error properties for maximum debugging info
    if (error instanceof Error) {
      console.error("[Webhook] Error name:", error.name);
      console.error("[Webhook] Error message:", error.message);
      console.error("[Webhook] Error stack:", error.stack);
    }
    console.error("[Webhook] ========================================");

    // Specific diagnosis for common errors
    if (errorMessage.toLowerCase().includes("bad auth") || errorMessage.includes("Authentication failed") || errorMessage.includes("authentication failed")) {
      console.error("[Webhook] DIAGNOSIS: Bad Authentication");
      console.error("[Webhook]   - Password may contain special characters that need encoding");
      console.error("[Webhook]   - encodeURIComponent should handle: @ $ # : / ? etc.");
      console.error("[Webhook]   - Verify username/password in MongoDB Atlas");
      console.error("[Webhook]   - Check database user has readWrite permissions on 'photo2video' database");
    }

    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
      console.error("[Webhook] DIAGNOSIS: DNS Resolution Failed");
      console.error("[Webhook]   - Cluster hostname could not be resolved");
      console.error("[Webhook]   - Check the cluster name in MONGODB_URI is correct");
    }

    if (errorMessage.includes("ETIMEDOUT") || errorMessage.toLowerCase().includes("timeout")) {
      console.error("[Webhook] DIAGNOSIS: Connection Timeout");
      console.error("[Webhook]   - Check MongoDB Atlas IP allowlist (add 0.0.0.0/0 for Vercel)");
      console.error("[Webhook]   - Network may be blocking the connection");
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

/**
 * DATA MAPPING: Build image URLs string from photos array
 * Maps order.photos (with secure_url property) to a formatted string
 */
function buildImageUrls(photos: Order["photos"]): string {
  if (!photos || photos.length === 0) return "No images uploaded";
  return photos.map((photo, index) => `Photo ${index + 1}: ${photo.secure_url}`).join("\n");
}

/**
 * DATA MAPPING: Build branding info string from branding object
 */
function buildBrandingInfo(branding: Order["branding"]): string {
  if (!branding) return "Unbranded";
  if (branding.type === "unbranded") return "Unbranded";

  const parts: string[] = [`Type: ${branding.type}`];
  if (branding.agentName) parts.push(`Agent: ${branding.agentName}`);
  if (branding.companyName) parts.push(`Company: ${branding.companyName}`);
  if (branding.phone) parts.push(`Phone: ${branding.phone}`);
  if (branding.email) parts.push(`Email: ${branding.email}`);
  if (branding.website) parts.push(`Website: ${branding.website}`);
  if (branding.logoUrl) parts.push(`Logo: ${branding.logoUrl}`);

  return parts.join(" | ");
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
        const customerName = session.customer_details?.name || session.metadata?.customerName || "Customer";
        const customerEmail = session.customer_details?.email || "";
        const customerPhone = session.customer_details?.phone || session.metadata?.customerPhone || "Not provided";
        const amountTotal = session.amount_total || 0;
        const price = `$${(amountTotal / 100).toFixed(2)}`;

        // METADATA FALLBACK: Extract all order details from Stripe metadata
        // This ensures we have all info even if MongoDB fails
        const metaMusicSelection = session.metadata?.musicSelection || "";
        const metaSpecialInstructions = session.metadata?.specialInstructions || "";
        const metaBrandingType = session.metadata?.brandingType || "unbranded";
        const metaVoiceoverIncluded = session.metadata?.voiceoverIncluded || "No";
        const metaIncludeEditedPhotos = session.metadata?.includeEditedPhotos || "No";
        const metaPhotoCount = session.metadata?.photoCount || "0";

        // Reconstruct photo URLs from chunked metadata
        let metaPhotoUrls = "";
        for (let i = 0; i < 10; i++) {
          const chunk = session.metadata?.[`photoUrls_${i}`];
          if (chunk) {
            metaPhotoUrls += chunk;
          } else {
            break;
          }
        }

        console.log("[Webhook] Stripe Session Data:");
        console.log("[Webhook]   - customer_name:", customerName);
        console.log("[Webhook]   - customer_email:", customerEmail);
        console.log("[Webhook]   - customer_phone:", customerPhone);
        console.log("[Webhook]   - price:", price);
        console.log("[Webhook] Stripe Metadata Backup:");
        console.log("[Webhook]   - musicSelection:", metaMusicSelection);
        console.log("[Webhook]   - specialInstructions:", metaSpecialInstructions);
        console.log("[Webhook]   - brandingType:", metaBrandingType);
        console.log("[Webhook]   - photoUrls length:", metaPhotoUrls.length);

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

        // Helper function to build image URLs from metadata format
        function buildImageUrlsFromMetadata(metaUrls: string): string {
          if (!metaUrls) return "No images";
          // Format is: "1:url|2:url|3:url"
          const lines = metaUrls.split("|").map(item => {
            const [num, url] = item.split(":", 2);
            return url ? `Photo ${num}: ${url}` : item;
          });
          return lines.join("\n");
        }

        // DATA MAPPING: Build personalization data
        // Priority: 1) Database order, 2) Stripe metadata, 3) Default values
        const personalizationData = {
          // ORDER ID: Ensure this is passed to the template
          order_id: orderId,
          
          // Core customer info (from Stripe, fallback to DB)
          customer_name: order?.customer?.name || customerName,
          customer_email: order?.customer?.email || customerEmail,
          customer_phone: order?.customer?.phone || customerPhone,
          
          // Pricing (from Stripe amount_total, with DB breakdown if available)
          price: price,
          base_price: order?.basePrice ? `$${order.basePrice.toFixed(2)}` : "See total",
          branding_fee: order?.brandingFee ? `$${order.brandingFee.toFixed(2)}` : "$0.00",
          voiceover_fee: order?.voiceoverFee ? `$${order.voiceoverFee.toFixed(2)}` : "$0.00",
          edited_photos_fee: order?.editedPhotosFee ? `$${order.editedPhotosFee.toFixed(2)}` : "$0.00",
          
          // DATA MAPPING: Photos/Images - DB first, then metadata fallback
          photo_count: order?.photoCount?.toString() || order?.photos?.length?.toString() || metaPhotoCount,
          image_urls: order?.photos 
            ? buildImageUrls(order.photos) 
            : (metaPhotoUrls ? buildImageUrlsFromMetadata(metaPhotoUrls) : "No images available"),
          
          // DATA MAPPING: Music - DB first, then metadata fallback
          music_choice: order?.musicSelection || metaMusicSelection || "Not specified",
          custom_audio_filename: order?.customAudio?.filename || "None",
          custom_audio_url: order?.customAudio?.secure_url || "None",
          
          // DATA MAPPING: Branding - DB first, then metadata fallback
          branding_type: order?.branding?.type || metaBrandingType || "unbranded",
          branding_logo_url: order?.branding?.logoUrl || "None",
          agent_name: order?.branding?.agentName || "N/A",
          company_name: order?.branding?.companyName || "N/A",
          agent_phone: order?.branding?.phone || "N/A",
          agent_email: order?.branding?.email || "N/A",
          agent_website: order?.branding?.website || "N/A",
          branding_info: order?.branding ? buildBrandingInfo(order.branding) : (metaBrandingType || "unbranded"),
          
          // Voiceover - DB first, then metadata fallback
          voiceover_included: order?.voiceover ? "Yes" : metaVoiceoverIncluded,
          voiceover_script: order?.voiceoverScript || "None",
          
          // Extras - DB first, then metadata fallback
          include_edited_photos: order?.includeEditedPhotos ? "Yes" : metaIncludeEditedPhotos,
          special_requests: order?.specialInstructions || metaSpecialInstructions || "None",
          
          // Legacy field (for backward compatibility with templates)
          video_titles: order?.branding ? buildBrandingInfo(order.branding) : (metaBrandingType || "unbranded"),
          
          // Database status (for debugging in email)
          db_status: dbError ? `Database Error: ${dbError}` : "Connected successfully",
        };

        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] PERSONALIZATION DATA:");
        console.log("[Webhook]   - order_id:", personalizationData.order_id);
        console.log("[Webhook]   - customer_name:", personalizationData.customer_name);
        console.log("[Webhook]   - customer_email:", personalizationData.customer_email);
        console.log("[Webhook]   - customer_phone:", personalizationData.customer_phone);
        console.log("[Webhook]   - price:", personalizationData.price);
        console.log("[Webhook]   - photo_count:", personalizationData.photo_count);
        console.log("[Webhook]   - music_choice:", personalizationData.music_choice);
        console.log("[Webhook]   - branding_type:", personalizationData.branding_type);
        console.log("[Webhook]   - branding_info:", personalizationData.branding_info);
        console.log("[Webhook]   - special_requests:", personalizationData.special_requests);
        console.log("[Webhook]   - db_status:", personalizationData.db_status);
        console.log("[Webhook]   - image_urls length:", personalizationData.image_urls.length);
        console.log("[Webhook] ----------------------------------------");

        // Check MailerSend environment
        const mailersendApiKey = process.env.MAILERSEND_API_KEY;
        const mailersendSenderEmail = process.env.MAILERSEND_SENDER_EMAIL;
        console.log("[Webhook] MAILERSEND_API_KEY set:", !!mailersendApiKey);
        console.log("[Webhook] MAILERSEND_SENDER_EMAIL:", mailersendSenderEmail || "NOT SET");

        // ========================================
        // EMAIL 1: CUSTOMER RECEIPT
        // ========================================
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

        // ========================================
        // EMAIL 2: ADMIN NOTIFICATION (REQUIRED)
        // Sends ALL order data to realestatephoto2video@gmail.com
        // ========================================
        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] EMAIL 2: Admin Notification");
        console.log("[Webhook] Recipient: realestatephoto2video@gmail.com");
        console.log("[Webhook] Subject: NEW ORDER: " + customerName + " - #" + orderId);
        console.log("[Webhook] ----------------------------------------");

        try {
          const adminResult = await sendAdminNotificationEmail(personalizationData);
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
