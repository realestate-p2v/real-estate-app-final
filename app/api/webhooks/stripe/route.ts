import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail, sendAdminNotificationEmail } from "@/lib/mailersend";
import type { Order } from "@/lib/types/order";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Helper function to safely stringify errors
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

// Create Supabase admin client for webhook (service role)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * RETRY HELPER: Sleep function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * DATABASE FETCH: Fetch order from Supabase with RETRY LOGIC (3 attempts)
 * 
 * Implements retry logic in case the database is still processing the record
 * when the webhook hits. This is critical for race conditions where the order
 * creation and Stripe webhook fire at nearly the same time.
 */
async function getOrderFromDatabase(orderId: string): Promise<{ order: Order | null; dbError: string | null }> {
  console.log("[Webhook] ========================================");
  console.log("[Webhook] DATABASE: Attempting to fetch order from Supabase");
  console.log("[Webhook] Searching Supabase for Order:", orderId);
  console.log("[Webhook] ========================================");

  const supabase = getSupabaseAdmin();
  
  if (!supabase) {
    const error = "Supabase environment variables not configured";
    console.error("[Webhook] DATABASE ERROR:", error);
    return { order: null, dbError: error };
  }

  // RETRY LOGIC: 3 attempts with exponential backoff
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
  
  let lastError: string | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[Webhook] Database fetch attempt ${attempt}/${MAX_RETRIES}`);
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (error) {
        lastError = error.message;
        console.error(`[Webhook] Supabase query error (attempt ${attempt}):`, error.message);
        
        // If not found and we have retries left, wait and try again
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt - 1];
          console.log(`[Webhook] Waiting ${delay}ms before retry...`);
          await sleep(delay);
          continue;
        }
        
        return { order: null, dbError: lastError };
      }

      if (!data) {
        lastError = `Order not found with orderId: ${orderId}`;
        console.warn(`[Webhook] DATABASE WARNING (attempt ${attempt}):`, lastError);
        
        // If not found and we have retries left, wait and try again
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt - 1];
          console.log(`[Webhook] Order not yet in database. Waiting ${delay}ms before retry...`);
          await sleep(delay);
          continue;
        }
        
        return { order: null, dbError: lastError };
      }

      // SUCCESS: Order found
      console.log(`[Webhook] Order FOUND in Supabase on attempt ${attempt}`);
      
      // Log Cloudinary URLs count
      const photos = data.photos || [];
      console.log("[Webhook] Cloudinary URLs found:", photos.length);
    
      // Map Supabase data to Order format
      const order: Order = {
        orderId: data.order_id,
        status: data.payment_status === "paid" ? "processing" : "pending",
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        customer: {
          name: data.customer_name,
          email: data.customer_email,
          phone: data.customer_phone,
        },
        photos: photos,
        photoCount: data.photo_count,
        musicSelection: data.music_selection,
        customAudio: data.custom_audio,
        branding: data.branding,
        voiceover: data.voiceover,
        voiceoverScript: data.voiceover_script,
        specialInstructions: data.special_instructions,
        includeEditedPhotos: data.include_edited_photos,
        basePrice: parseFloat(data.base_price) || 0,
        brandingFee: parseFloat(data.branding_fee) || 0,
        voiceoverFee: parseFloat(data.voiceover_fee) || 0,
        editedPhotosFee: parseFloat(data.edited_photos_fee) || 0,
        totalPrice: parseFloat(data.total_price) || 0,
        paymentStatus: data.payment_status,
      };

      console.log("[Webhook] Order details:");
      console.log("[Webhook]   - customerEmail:", order.customer?.email);
      console.log("[Webhook]   - customerName:", order.customer?.name);
      console.log("[Webhook]   - customerPhone:", order.customer?.phone);
      console.log("[Webhook]   - photoCount:", order.photoCount);
      console.log("[Webhook]   - musicSelection:", order.musicSelection);
      console.log("[Webhook]   - specialInstructions:", order.specialInstructions);

      // Update order status to paid/processing
      try {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);
        console.log("[Webhook] Order status updated to paid");
      } catch (updateError) {
        console.error("[Webhook] Failed to update order status:", getErrorMessage(updateError));
      }

      return { order, dbError: null };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(`[Webhook] DATABASE ERROR (attempt ${attempt}):`, errorMessage);
      lastError = errorMessage;
      
      // If we have retries left, wait and try again
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt - 1];
        console.log(`[Webhook] Waiting ${delay}ms before retry...`);
        await sleep(delay);
        continue;
      }
      
      return { order: null, dbError: errorMessage };
    }
  }
  
  // All retries exhausted
  console.error("[Webhook] All retry attempts exhausted");
  return { order: null, dbError: lastError || "Unknown error after retries" };
}

/**
 * DATA MAPPING: Build image URLs string from photos array
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
        
        // CRITICAL LOG: Stripe session received
        console.log("[Webhook] ========================================");
        console.log("[Webhook] Stripe session received:", session.id);
        console.log("[Webhook] ========================================");
        
        const orderId = session.metadata?.orderId || session.client_reference_id || "Unknown";

        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] EVENT: checkout.session.completed");
        console.log("[Webhook] Session ID:", session.id);
        console.log("[Webhook] Order ID (from metadata):", session.metadata?.orderId);
        console.log("[Webhook] Client Reference ID:", session.client_reference_id);
        console.log("[Webhook] Using Order ID:", orderId);
        console.log("[Webhook] ----------------------------------------");

        // STRIPE SESSION DATA (always available)
        // IMPORTANT: Check metadata first as customer_details may not be populated
        const customerName = session.customer_details?.name || session.metadata?.customerName || "Customer";
        const customerEmail = session.customer_details?.email || session.metadata?.customerEmail || "";
        const customerPhone = session.customer_details?.phone || session.metadata?.customerPhone || "Not provided";
        const amountTotal = session.amount_total || 0;
        const price = `$${(amountTotal / 100).toFixed(2)}`;

        // METADATA FALLBACK
        const metaMusicSelection = session.metadata?.musicSelection || "";
        const metaSpecialInstructions = session.metadata?.specialInstructions || "";
        const metaBrandingType = session.metadata?.brandingType || "unbranded";
        const metaVoiceoverIncluded = session.metadata?.voiceoverIncluded || "No";
        const metaIncludeEditedPhotos = session.metadata?.includeEditedPhotos || "No";
        const metaPhotoCount = session.metadata?.photoCount || "0";
        const metaProductName = session.metadata?.productName || "";

        // Get product name from Stripe line items
        let productName = metaProductName;
        if (!productName) {
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
            if (lineItems.data.length > 0 && lineItems.data[0].description) {
              productName = lineItems.data[0].description;
            } else if (lineItems.data.length > 0 && lineItems.data[0].price?.product) {
              // Try to get the product name from the price object
              const priceData = lineItems.data[0].price;
              if (typeof priceData.product === 'object' && priceData.product !== null && 'name' in priceData.product) {
                productName = (priceData.product as { name?: string }).name || "";
              }
            }
          } catch (lineItemError) {
            console.warn("[Webhook] Could not retrieve line items:", getErrorMessage(lineItemError));
          }
        }
        // Fallback: construct product name from photo count
        if (!productName) {
          const photoCount = parseInt(metaPhotoCount) || 0;
          if (photoCount <= 12) {
            productName = "Standard Video";
          } else if (photoCount <= 25) {
            productName = "Premium Video";
          } else {
            productName = "Professional Video";
          }
        }

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

        // DATABASE: Fetch order from Supabase
        let order: Order | null = null;
        let dbError: string | null = null;

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
          const lines = metaUrls.split("|").map(item => {
            const [num, url] = item.split(":", 2);
            return url ? `Photo ${num}: ${url}` : item;
          });
          return lines.join("\n");
        }

        // DATA MAPPING: Build personalization data
        const personalizationData = {
          order_id: orderId,
          product_name: productName,
          customer_name: order?.customer?.name || customerName,
          customer_email: order?.customer?.email || customerEmail,
          customer_phone: order?.customer?.phone || customerPhone,
          price: price,
          base_price: order?.basePrice ? `$${order.basePrice.toFixed(2)}` : "See total",
          branding_fee: order?.brandingFee ? `$${order.brandingFee.toFixed(2)}` : "$0.00",
          voiceover_fee: order?.voiceoverFee ? `$${order.voiceoverFee.toFixed(2)}` : "$0.00",
          edited_photos_fee: order?.editedPhotosFee ? `$${order.editedPhotosFee.toFixed(2)}` : "$0.00",
          photo_count: order?.photoCount?.toString() || order?.photos?.length?.toString() || metaPhotoCount,
          image_urls: order?.photos 
            ? buildImageUrls(order.photos) 
            : (metaPhotoUrls ? buildImageUrlsFromMetadata(metaPhotoUrls) : "No images available"),
          music_choice: order?.musicSelection || metaMusicSelection || "Not specified",
          custom_audio_filename: order?.customAudio?.filename || "None",
          custom_audio_url: order?.customAudio?.secure_url || "None",
          branding_type: order?.branding?.type || metaBrandingType || "unbranded",
          branding_logo_url: order?.branding?.logoUrl || "None",
          agent_name: order?.branding?.agentName || "N/A",
          company_name: order?.branding?.companyName || "N/A",
          agent_phone: order?.branding?.phone || "N/A",
          agent_email: order?.branding?.email || "N/A",
          agent_website: order?.branding?.website || "N/A",
          branding_info: order?.branding ? buildBrandingInfo(order.branding) : (metaBrandingType || "unbranded"),
          voiceover_included: order?.voiceover ? "Yes" : metaVoiceoverIncluded,
          voiceover_script: order?.voiceoverScript || "None",
          include_edited_photos: order?.includeEditedPhotos ? "Yes" : metaIncludeEditedPhotos,
          special_requests: order?.specialInstructions || metaSpecialInstructions || "None",
          video_titles: order?.branding ? buildBrandingInfo(order.branding) : (metaBrandingType || "unbranded"),
          db_status: dbError ? `Database Error: ${dbError}` : "Connected successfully",
        };

        console.log("[Webhook] ----------------------------------------");
        console.log("[Webhook] PERSONALIZATION DATA PREPARED");
        console.log("[Webhook] ----------------------------------------");

        // SEND EMAILS - EXECUTION SAFETY: Await all MailerSend responses before returning 200
        console.log("[Webhook] ========================================");
        console.log("[Webhook] EMAIL SENDING DEBUG");
        console.log("[Webhook] ========================================");
        console.log("[Webhook] customer_email value:", personalizationData.customer_email);
        console.log("[Webhook] customer_email type:", typeof personalizationData.customer_email);
        console.log("[Webhook] customer_email truthy?:", !!personalizationData.customer_email);
        console.log("[Webhook] session.customer_details:", JSON.stringify(session.customer_details, null, 2));
        console.log("[Webhook] session.metadata:", JSON.stringify(session.metadata, null, 2));
        console.log("[Webhook] order?.customer?.email:", order?.customer?.email);
        
        // Check environment variables for email
        console.log("[Webhook] MAILERSEND_API_KEY set?:", !!process.env.MAILERSEND_API_KEY);
        console.log("[Webhook] MAILERSEND_API_KEY length:", process.env.MAILERSEND_API_KEY?.length || 0);
        console.log("[Webhook] MAILERSEND_SENDER_EMAIL:", process.env.MAILERSEND_SENDER_EMAIL);
        console.log("[Webhook] CUSTOMER_RECEIPT_TEMPLATE_ID:", process.env.CUSTOMER_RECEIPT_TEMPLATE_ID || "zr6ke4n6kzelon12 (default)");
        console.log("[Webhook] MAILERSEND_ORDER_TEMPLATE_ID:", process.env.MAILERSEND_ORDER_TEMPLATE_ID);
        
        // Log Supabase env vars status
        console.log("[Webhook] NEXT_PUBLIC_SUPABASE_URL set?:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("[Webhook] SUPABASE_SERVICE_ROLE_KEY set?:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // Track email results for logging
        let customerEmailSuccess = false;
        let adminEmailSuccess = false;
        
        if (personalizationData.customer_email) {
          // TRY/CATCH BLOCK: Customer email
          try {
            console.log("[Webhook] Attempting MailerSend dispatch for CUSTOMER email...");
            console.log("[Webhook] Customer email address:", personalizationData.customer_email);
            const customerEmailResult = await sendCustomerEmail(personalizationData);
            customerEmailSuccess = customerEmailResult.success;
            console.log("[Webhook] Customer email result success:", customerEmailResult.success);
            if (!customerEmailResult.success) {
              console.error("[Webhook] Customer email FAILED with error:", customerEmailResult.error);
            } else {
              console.log("[Webhook] Customer email sent SUCCESSFULLY");
            }
          } catch (emailError) {
            console.error("[Webhook] Customer email EXCEPTION:", getErrorMessage(emailError));
          }

          // TRY/CATCH BLOCK: Admin email
          try {
            console.log("[Webhook] Attempting MailerSend dispatch for ADMIN email...");
            const adminEmailResult = await sendAdminNotificationEmail(personalizationData);
            adminEmailSuccess = adminEmailResult.success;
            console.log("[Webhook] Admin email result success:", adminEmailResult.success);
            if (!adminEmailResult.success) {
              console.error("[Webhook] Admin email FAILED with error:", adminEmailResult.error);
            } else {
              console.log("[Webhook] Admin email sent SUCCESSFULLY");
            }
          } catch (emailError) {
            console.error("[Webhook] Admin email EXCEPTION:", getErrorMessage(emailError));
          }
          
          // Summary of email dispatch
          console.log("[Webhook] ----------------------------------------");
          console.log("[Webhook] EMAIL DISPATCH SUMMARY:");
          console.log("[Webhook]   - Customer email:", customerEmailSuccess ? "SUCCESS" : "FAILED");
          console.log("[Webhook]   - Admin email:", adminEmailSuccess ? "SUCCESS" : "FAILED");
          console.log("[Webhook] ----------------------------------------");
        } else {
          console.error("[Webhook] NO CUSTOMER EMAIL - Skipping all emails!");
          console.error("[Webhook] This means neither Stripe session nor database had an email");
        }

        console.log("[Webhook] ========================================");
        console.log("[Webhook] WEBHOOK PROCESSING COMPLETE");
        console.log("[Webhook] ========================================");

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] Payment failed:", paymentIntent.id);
        console.log("[Webhook] Failure message:", paymentIntent.last_payment_error?.message);
        break;
      }

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", getErrorMessage(error));
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
