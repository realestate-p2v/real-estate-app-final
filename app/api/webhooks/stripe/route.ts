import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail, sendAdminNotificationEmail, type PersonalizationData } from "@/lib/mailersend";
import type { Order } from "@/lib/types/order";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * STRIPE WEBHOOK HANDLER - Production Grade
 * 
 * REQUIREMENTS IMPLEMENTED:
 * 1. Deep Data Extraction: orderId from event.data.object.metadata.orderId, fallback to client_reference_id
 * 2. Race Condition Fix: 5 retry attempts with 2000ms delay for Supabase
 * 3. Forced Blocking: Response ONLY after MailerSend await completes
 * 4. BCC hardcoded to realestatephoto2video@gmail.com
 * 5. MailerSend Template ID: zr6ke4n6kzelon12
 * 6. image_urls passed as array from Supabase photos field
 * 7. Error logging with error.body for MailerSend validation failures
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_RETRY_ATTEMPTS = 5;
const SUPABASE_RETRY_DELAY_MS = 2000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error("[WEBHOOK] Supabase not configured");
    return null;
  }
  
  return createClient(url, key);
}

/**
 * DEEP DATA EXTRACTION
 * Priority order:
 * 1. event.data.object.metadata.orderId (primary)
 * 2. event.data.object.client_reference_id (fallback)
 */
function extractOrderId(session: Stripe.Checkout.Session): string | null {
  console.log("[WEBHOOK] === DEEP DATA EXTRACTION ===");
  console.log("[WEBHOOK] Checking metadata:", JSON.stringify(session.metadata));
  console.log("[WEBHOOK] Checking client_reference_id:", session.client_reference_id);
  
  // 1. PRIMARY: metadata.orderId
  if (session.metadata?.orderId) {
    console.log("[WEBHOOK] SUCCESS: Found orderId in metadata.orderId:", session.metadata.orderId);
    return session.metadata.orderId;
  }
  
  // 2. FALLBACK: client_reference_id
  if (session.client_reference_id) {
    console.log("[WEBHOOK] SUCCESS: Found orderId in client_reference_id:", session.client_reference_id);
    return session.client_reference_id;
  }
  
  console.error("[WEBHOOK] FAILED: No orderId found in metadata or client_reference_id");
  return null;
}

function getVoiceName(voiceId: string | undefined): string {
  if (!voiceId) return "";
  const map: Record<string, string> = {
    "male-1": "Matt (Male)",
    "male-2": "Blake (Male)",
    "female-1": "Maya (Female)",
    "female-2": "Amara (Female)",
  };
  return map[voiceId] || voiceId;
}

/**
 * Build image_urls as ARRAY of strings from photos column
 */
function buildImageUrlsArray(photos: Order["photos"]): string[] {
  if (!photos || photos.length === 0) return [];
  return photos.map((p) => p.secure_url);
}

/**
 * Build image_urls as STRING (newline separated) for template
 */
function buildImageUrlsString(photos: Order["photos"]): string {
  if (!photos || photos.length === 0) return "No images uploaded";
  return photos.map((p, i) => `Photo ${i + 1}: ${p.secure_url}`).join("\n");
}

// ============================================================================
// SUPABASE ORDER FETCH WITH RETRY (Supabase Race Fix)
// ============================================================================

/**
 * RACE CONDITION FIX
 * Stripe often hits the webhook before Supabase finishes saving the order.
 * Retry loop: 5 attempts with 2000ms delay between each.
 */
async function fetchOrderWithRetry(orderId: string): Promise<Order> {
  console.log("[WEBHOOK] === RACE CONDITION FIX: SUPABASE RETRY LOOP ===");
  console.log(`[WEBHOOK] Order ID: ${orderId}`);
  console.log(`[WEBHOOK] Max attempts: ${SUPABASE_RETRY_ATTEMPTS}`);
  console.log(`[WEBHOOK] Delay between attempts: ${SUPABASE_RETRY_DELAY_MS}ms`);

  const supabase = getSupabaseAdmin();
  
  if (!supabase) {
    console.error("[WEBHOOK] FATAL: Supabase not configured");
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  for (let attempt = 1; attempt <= SUPABASE_RETRY_ATTEMPTS; attempt++) {
    console.log(`[WEBHOOK] Attempt ${attempt} of ${SUPABASE_RETRY_ATTEMPTS}...`);
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error(`[WEBHOOK] Attempt ${attempt} - Database error: ${error.message} (code: ${error.code})`);
    }

    if (data) {
      console.log(`[WEBHOOK] SUCCESS: Order found on attempt ${attempt}`);
      console.log(`[WEBHOOK] Photos in order: ${data.photos?.length || 0}`);

      // Update payment status to paid
      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_status: "paid", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);
      
      if (updateError) {
        console.error("[WEBHOOK] Warning: Failed to update payment_status:", updateError.message);
      }

      // Map to Order type
      const order: Order = {
        orderId: data.order_id,
        status: "processing",
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        customer: {
          name: data.customer_name,
          email: data.customer_email,
          phone: data.customer_phone,
        },
        photos: data.photos || [],
        photoCount: data.photo_count,
        musicSelection: data.music_selection,
        customAudio: data.custom_audio,
        branding: data.branding,
        voiceover: data.voiceover,
        voiceoverScript: data.voiceover_script,
        voiceoverVoice: data.voiceover_voice,
        specialInstructions: data.special_instructions,
        includeEditedPhotos: data.include_edited_photos,
        basePrice: parseFloat(data.base_price) || 0,
        brandingFee: parseFloat(data.branding_fee) || 0,
        voiceoverFee: parseFloat(data.voiceover_fee) || 0,
        editedPhotosFee: parseFloat(data.edited_photos_fee) || 0,
        totalPrice: parseFloat(data.total_price) || 0,
        paymentStatus: "paid",
      };

      return order;
    }

    // Order not found yet - wait before retry (except on last attempt)
    if (attempt < SUPABASE_RETRY_ATTEMPTS) {
      console.log(`[WEBHOOK] Order not found. Waiting ${SUPABASE_RETRY_DELAY_MS}ms before attempt ${attempt + 1}...`);
      await sleep(SUPABASE_RETRY_DELAY_MS);
    }
  }

  // CRITICAL: All 5 attempts exhausted - log error and exit
  const totalWaitTime = (SUPABASE_RETRY_ATTEMPTS - 1) * SUPABASE_RETRY_DELAY_MS / 1000;
  console.error("[WEBHOOK] === FATAL: ORDER NOT FOUND AFTER ALL RETRIES ===");
  console.error(`[WEBHOOK] Order ID: ${orderId}`);
  console.error(`[WEBHOOK] Attempts: ${SUPABASE_RETRY_ATTEMPTS}`);
  console.error(`[WEBHOOK] Total wait time: ${totalWaitTime}s`);
  
  throw new Error(`ORDER_NOT_FOUND: Order ${orderId} not in database after ${SUPABASE_RETRY_ATTEMPTS} attempts (${totalWaitTime}s total wait)`);
}

// ============================================================================
// BUILD PERSONALIZATION DATA
// ============================================================================

function buildPersonalizationData(
  order: Order, 
  session: Stripe.Checkout.Session, 
  productName: string
): PersonalizationData {
  // CRITICAL: Extract customer_email from session.customer_details.email
  const customerEmail = session.customer_details?.email || order.customer.email || "";
  const customerName = session.customer_details?.name || order.customer.name || "Customer";
  const customerPhone = session.customer_details?.phone || order.customer.phone || "Not provided";

  return {
    order_id: order.orderId,
    order_date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    product_name: productName || "Video Package",
    photo_count: String(order.photoCount || order.photos?.length || 0),
    base_price: `$${(order.basePrice || 0).toFixed(2)}`,
    branding_fee: `$${(order.brandingFee || 0).toFixed(2)}`,
    voiceover_fee: `$${(order.voiceoverFee || 0).toFixed(2)}`,
    edited_photos_fee: `$${(order.editedPhotosFee || 0).toFixed(2)}`,
    total_price: `$${(order.totalPrice || 0).toFixed(2)}`,
    music_choice: order.musicSelection || "Not specified",
    custom_audio_url: order.customAudio?.secure_url || "",
    custom_audio_filename: order.customAudio?.filename || "",
    branding_type: order.branding?.type || "unbranded",
    branding_logo_url: order.branding?.logoUrl || "",
    branding_agent_name: order.branding?.agentName || "",
    branding_company_name: order.branding?.companyName || "",
    branding_phone: order.branding?.phone || "",
    branding_email: order.branding?.email || "",
    branding_website: order.branding?.website || "",
    voiceover_enabled: order.voiceover ? "Yes" : "No",
    voiceover_voice: getVoiceName(order.voiceoverVoice),
    voiceover_script: order.voiceoverScript || "",
    include_edited_photos: order.includeEditedPhotos ? "Yes" : "No",
    special_requests: order.specialInstructions || "",
    // image_urls as string for template (newline separated)
    image_urls: buildImageUrlsString(order.photos),
    // Also provide as array if template needs it
    image_urls_array: buildImageUrlsArray(order.photos),
  } as PersonalizationData & { image_urls_array: string[] };
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request: Request) {
  console.log("========================================");
  console.log("[WEBHOOK] STRIPE WEBHOOK RECEIVED");
  console.log("[WEBHOOK] Timestamp:", new Date().toISOString());
  console.log("========================================");

  // Variables to track state - NO early returns until the end
  let emailSent = false;
  let emailError: string | null = null;

  try {
    // ========================================================================
    // STEP 1: Parse and verify webhook signature
    // ========================================================================
    
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("[WEBHOOK] Missing stripe-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[WEBHOOK] Invalid signature:", message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[WEBHOOK] Event type:", event.type);
    console.log("[WEBHOOK] Event ID:", event.id);

    // ========================================================================
    // STEP 2: Handle checkout.session.completed
    // ========================================================================

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("========================================");
      console.log("[WEBHOOK] CHECKOUT SESSION COMPLETED");
      console.log("[WEBHOOK] Session ID:", session.id);
      console.log("[WEBHOOK] Payment Status:", session.payment_status);
      console.log("[WEBHOOK] Amount:", session.amount_total);
      console.log("========================================");

      // ======================================================================
      // CRITICAL CHECK: Only proceed if payment_status === 'paid'
      // ======================================================================
      
      if (session.payment_status !== "paid") {
        console.log("[WEBHOOK] Skipping: Session is not paid yet. Status:", session.payment_status);
        // Return 200 but don't process - Stripe may send another webhook when paid
        return NextResponse.json({ 
          received: true, 
          processed: false, 
          reason: "Payment not yet completed" 
        });
      }

      console.log("[WEBHOOK] Payment confirmed as PAID - proceeding with order processing");

      // ======================================================================
      // STEP 3: Extract orderId from metadata AND success_url
      // ======================================================================
      
      const orderId = extractOrderId(session);

      if (!orderId) {
        console.error("[WEBHOOK] CRITICAL: Could not extract orderId from session");
        console.error("[WEBHOOK] Session metadata:", JSON.stringify(session.metadata));
        console.error("[WEBHOOK] Session success_url:", session.success_url);
        console.error("[WEBHOOK] Session client_reference_id:", session.client_reference_id);
        
        emailError = "No orderId found in session";
      } else {
        console.log("[WEBHOOK] Order ID extracted:", orderId);

        // ==================================================================
        // STEP 4: Fetch order from Supabase WITH RETRY
        // ==================================================================

        let order: Order | null = null;
        
        try {
          order = await fetchOrderWithRetry(orderId);
          console.log("[WEBHOOK] Order fetched successfully");
          console.log("[WEBHOOK] Photos count:", order.photos?.length || 0);
        } catch (dbError) {
          const message = dbError instanceof Error ? dbError.message : String(dbError);
          console.error("[WEBHOOK] CRITICAL: Database fetch failed");
          console.error("MAILERSEND_CRITICAL_FAILURE", {
            reason: "DATABASE_FETCH_FAILED",
            order_id: orderId,
            error: message
          });
          emailError = message;
        }

        // ==================================================================
        // STEP 5: Send emails ONLY if we have order data
        // ==================================================================

        if (order) {
          // Get product name
          let productName = session.metadata?.productName || "";
          if (!productName) {
            try {
              const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
              productName = lineItems.data[0]?.description || "Video Package";
            } catch {
              productName = "Video Package";
            }
          }

          // Build personalization data
          // CRITICAL: customer_email from session.customer_details.email
          const personalizationData = buildPersonalizationData(order, session, productName);

          console.log("[WEBHOOK] Customer email (from session):", session.customer_details?.email);
          console.log("[WEBHOOK] Customer email (final):", personalizationData.customer_email);

          if (!personalizationData.customer_email) {
            console.error("MAILERSEND_CRITICAL_FAILURE", {
              reason: "NO_CUSTOMER_EMAIL",
              order_id: orderId,
              session_customer_details: session.customer_details
            });
            emailError = "No customer email available";
          } else {
            // ================================================================
            // STEP 6: SEND EMAILS - BLOCKING AWAIT
            // DO NOT return 200 to Stripe until these complete
            // ================================================================

            console.log("========================================");
            console.log("[WEBHOOK] SENDING EMAILS - BLOCKING");
            console.log("========================================");

            // ================================================================
            // SEND CUSTOMER EMAIL - WRAPPED IN TRY/CATCH WITH error.body LOGGING
            // ================================================================
            try {
              console.log("[WEBHOOK] === SENDING CUSTOMER EMAIL ===");
              console.log("[WEBHOOK] To:", personalizationData.customer_email);
              console.log("[WEBHOOK] Template ID: zr6ke4n6kzelon12");
              console.log("[WEBHOOK] BCC: realestatephoto2video@gmail.com");
              console.log("[WEBHOOK] Image URLs count:", buildImageUrlsArray(order.photos).length);
              
              const customerResult = await sendCustomerEmail(personalizationData);
              
              if (customerResult.success) {
                console.log("[WEBHOOK] Customer email: SUCCESS");
                emailSent = true;
              } else {
                // LOG error.body FOR VALIDATION FAILURES
                console.error("[WEBHOOK] === MAILERSEND CUSTOMER EMAIL FAILED ===");
                console.error("[WEBHOOK] error:", customerResult.error);
                console.error("[WEBHOOK] statusCode:", customerResult.statusCode);
                console.error("[WEBHOOK] error.body:", JSON.stringify(customerResult.responseBody, null, 2));
                emailError = customerResult.error || "Customer email failed";
              }
            } catch (err: unknown) {
              // LOG error.body IF AVAILABLE ON EXCEPTION
              console.error("[WEBHOOK] === MAILERSEND CUSTOMER EMAIL EXCEPTION ===");
              if (err && typeof err === 'object' && 'body' in err) {
                console.error("[WEBHOOK] error.body:", JSON.stringify((err as { body: unknown }).body, null, 2));
              }
              const msg = err instanceof Error ? err.message : String(err);
              console.error("[WEBHOOK] error.message:", msg);
              emailError = msg;
            }

            // ================================================================
            // SEND ADMIN EMAIL - WRAPPED IN TRY/CATCH WITH error.body LOGGING
            // ================================================================
            try {
              console.log("[WEBHOOK] === SENDING ADMIN EMAIL ===");
              const adminResult = await sendAdminNotificationEmail(personalizationData);
              
              if (adminResult.success) {
                console.log("[WEBHOOK] Admin email: SUCCESS");
              } else {
                console.error("[WEBHOOK] === MAILERSEND ADMIN EMAIL FAILED ===");
                console.error("[WEBHOOK] error:", adminResult.error);
                console.error("[WEBHOOK] error.body:", JSON.stringify(adminResult.responseBody, null, 2));
              }
            } catch (err: unknown) {
              console.error("[WEBHOOK] === MAILERSEND ADMIN EMAIL EXCEPTION ===");
              if (err && typeof err === 'object' && 'body' in err) {
                console.error("[WEBHOOK] error.body:", JSON.stringify((err as { body: unknown }).body, null, 2));
              }
              const msg = err instanceof Error ? err.message : String(err);
              console.error("[WEBHOOK] error.message:", msg);
            }
          }
        }
      }
    }

    // ========================================================================
    // STEP 7: FINAL RESPONSE TO STRIPE
    // This is the ABSOLUTE LAST LINE after all awaits have completed
    // ========================================================================

    console.log("========================================");
    console.log("[WEBHOOK] PROCESSING COMPLETE");
    console.log("[WEBHOOK] Email sent:", emailSent);
    console.log("[WEBHOOK] Email error:", emailError || "None");
    console.log("========================================");

    return NextResponse.json({ 
      received: true,
      emailSent,
      error: emailError
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[WEBHOOK] UNHANDLED EXCEPTION:", message);
    
    // Always return 200 to prevent Stripe retries flooding
    return NextResponse.json({ 
      received: true, 
      processed: false,
      error: message
    });
  }
}
