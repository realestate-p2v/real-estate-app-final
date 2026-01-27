import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail, sendAdminNotificationEmail, type PersonalizationData } from "@/lib/mailersend";
import type { Order } from "@/lib/types/order";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * STRIPE WEBHOOK HANDLER
 * 
 * Requirements implemented:
 * 1. NO EARLY RETURN - Response to Stripe only after email operations complete
 * 2. SUPABASE RACE RETRY - 4 attempts, 2.5s delay between each
 * 3. MAILERSEND VALIDATION - Correct BCC format, template ID, image_urls as string
 * 4. EMERGENCY LOGGING - MAILERSEND_CRITICAL_FAILURE with detailed error body
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_RETRY_ATTEMPTS = 4;
const SUPABASE_RETRY_DELAY_MS = 2500;

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
    console.error("[WEBHOOK] Supabase not configured - missing URL or service key");
    return null;
  }
  
  return createClient(url, key);
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

function buildImageUrls(photos: Order["photos"]): string {
  if (!photos || photos.length === 0) return "No images uploaded";
  return photos.map((p, i) => `Photo ${i + 1}: ${p.secure_url}`).join("\n");
}

// ============================================================================
// SUPABASE ORDER FETCH WITH RETRY
// ============================================================================

async function fetchOrderWithRetry(orderId: string): Promise<Order> {
  console.log(`[WEBHOOK] Starting Supabase fetch for order: ${orderId}`);
  console.log(`[WEBHOOK] Will attempt ${SUPABASE_RETRY_ATTEMPTS} times with ${SUPABASE_RETRY_DELAY_MS}ms delay`);

  const supabase = getSupabaseAdmin();
  
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED: Missing environment variables");
  }

  for (let attempt = 1; attempt <= SUPABASE_RETRY_ATTEMPTS; attempt++) {
    console.log(`[WEBHOOK] Supabase attempt ${attempt}/${SUPABASE_RETRY_ATTEMPTS}`);
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error) {
      console.log(`[WEBHOOK] Attempt ${attempt} error: ${error.message}`);
      
      if (attempt < SUPABASE_RETRY_ATTEMPTS) {
        console.log(`[WEBHOOK] Waiting ${SUPABASE_RETRY_DELAY_MS}ms before retry...`);
        await sleep(SUPABASE_RETRY_DELAY_MS);
        continue;
      }
      
      throw new Error(`SUPABASE_FETCH_FAILED: ${error.message} after ${SUPABASE_RETRY_ATTEMPTS} attempts`);
    }

    if (!data) {
      console.log(`[WEBHOOK] Attempt ${attempt}: Order not found yet`);
      
      if (attempt < SUPABASE_RETRY_ATTEMPTS) {
        console.log(`[WEBHOOK] Waiting ${SUPABASE_RETRY_DELAY_MS}ms before retry...`);
        await sleep(SUPABASE_RETRY_DELAY_MS);
        continue;
      }
      
      throw new Error(`ORDER_NOT_FOUND: Order ${orderId} not in database after ${SUPABASE_RETRY_ATTEMPTS} attempts`);
    }

    console.log(`[WEBHOOK] Order found on attempt ${attempt}`);

    // Update payment status to paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        payment_status: "paid", 
        updated_at: new Date().toISOString() 
      })
      .eq("order_id", orderId);

    if (updateError) {
      console.warn(`[WEBHOOK] Failed to update payment status: ${updateError.message}`);
    } else {
      console.log(`[WEBHOOK] Payment status updated to 'paid'`);
    }

    // Map database row to Order type
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

  // This should never be reached due to throws above, but TypeScript needs it
  throw new Error(`ORDER_NOT_FOUND: Order ${orderId} not found after all retries`);
}

// ============================================================================
// BUILD PERSONALIZATION DATA
// ============================================================================

function buildPersonalizationData(order: Order, session: Stripe.Checkout.Session, productName: string): PersonalizationData {
  const price = `$${(order.totalPrice || 0).toFixed(2)}`;

  return {
    order_id: order.orderId,
    order_date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    customer_name: order.customer.name || session.customer_details?.name || "Customer",
    customer_email: order.customer.email || session.customer_details?.email || "",
    customer_phone: order.customer.phone || session.customer_details?.phone || "Not provided",
    product_name: productName || "Video Package",
    photo_count: String(order.photoCount || order.photos?.length || 0),
    base_price: `$${(order.basePrice || 0).toFixed(2)}`,
    branding_fee: `$${(order.brandingFee || 0).toFixed(2)}`,
    voiceover_fee: `$${(order.voiceoverFee || 0).toFixed(2)}`,
    edited_photos_fee: `$${(order.editedPhotosFee || 0).toFixed(2)}`,
    total_price: price,
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
    // CRITICAL: image_urls MUST be a string for the template
    image_urls: buildImageUrls(order.photos),
  };
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request: Request) {
  console.log("========================================");
  console.log("[WEBHOOK] STRIPE WEBHOOK RECEIVED");
  console.log("[WEBHOOK] Timestamp:", new Date().toISOString());
  console.log("========================================");

  // Track overall result for final response
  let webhookSuccess = true;
  let webhookError: string | null = null;

  try {
    // ========================================================================
    // STEP 1: Parse and verify webhook
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
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[WEBHOOK] Signature verification failed:", message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[WEBHOOK] Event type:", event.type);
    console.log("[WEBHOOK] Event ID:", event.id);

    // ========================================================================
    // STEP 2: Process checkout.session.completed
    // ========================================================================

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      console.log("========================================");
      console.log("[WEBHOOK] CHECKOUT SESSION COMPLETED");
      console.log("[WEBHOOK] Session ID:", session.id);
      console.log("[WEBHOOK] Order ID:", orderId);
      console.log("[WEBHOOK] Amount:", session.amount_total);
      console.log("========================================");

      if (!orderId) {
        console.error("[WEBHOOK] CRITICAL: No orderId in session metadata or client_reference_id");
        webhookSuccess = false;
        webhookError = "No orderId found";
      } else {
        // ====================================================================
        // STEP 3: Fetch order from Supabase WITH RETRY
        // This implements the "Supabase Race" retry logic
        // ====================================================================

        let order: Order;
        try {
          order = await fetchOrderWithRetry(orderId);
          console.log("[WEBHOOK] Order fetched successfully from database");
        } catch (dbError) {
          const message = dbError instanceof Error ? dbError.message : String(dbError);
          console.error("[WEBHOOK] CRITICAL: Failed to fetch order from database");
          console.error("[WEBHOOK] Error:", message);
          
          // DO NOT send email if we can't get order data
          webhookSuccess = false;
          webhookError = message;
          
          // Still return 200 to Stripe so it doesn't retry, but log the failure
          console.error("MAILERSEND_CRITICAL_FAILURE", {
            reason: "DATABASE_FETCH_FAILED",
            order_id: orderId,
            error: message
          });
          
          // Jump to finally block - no email will be sent
          throw new Error(`Cannot proceed without order data: ${message}`);
        }

        // ====================================================================
        // STEP 4: Get product name from Stripe
        // ====================================================================

        let productName = session.metadata?.productName || "";
        if (!productName) {
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
            productName = lineItems.data[0]?.description || "Video Package";
          } catch {
            productName = "Video Package";
          }
        }
        console.log("[WEBHOOK] Product name:", productName);

        // ====================================================================
        // STEP 5: Build personalization data
        // ====================================================================

        const personalizationData = buildPersonalizationData(order, session, productName);

        console.log("[WEBHOOK] Customer email:", personalizationData.customer_email);
        console.log("[WEBHOOK] Photo count:", personalizationData.photo_count);
        console.log("[WEBHOOK] Total price:", personalizationData.total_price);

        if (!personalizationData.customer_email) {
          console.error("[WEBHOOK] CRITICAL: No customer email available");
          console.error("MAILERSEND_CRITICAL_FAILURE", {
            reason: "NO_CUSTOMER_EMAIL",
            order_id: orderId,
            session_customer_details: session.customer_details,
            session_metadata: session.metadata,
            order_customer: order.customer
          });
          
          webhookSuccess = false;
          webhookError = "No customer email";
        } else {
          // ==================================================================
          // STEP 6: Send emails via MailerSend
          // CRITICAL: We await both calls before returning to Stripe
          // ==================================================================

          console.log("========================================");
          console.log("[WEBHOOK] SENDING EMAILS VIA MAILERSEND");
          console.log("========================================");

          // Send customer email
          let customerEmailResult: { success: boolean; error?: string };
          try {
            console.log("[WEBHOOK] Sending customer email...");
            customerEmailResult = await sendCustomerEmail(personalizationData);
            
            if (customerEmailResult.success) {
              console.log("[WEBHOOK] Customer email: SUCCESS");
            } else {
              console.error("[WEBHOOK] Customer email: FAILED");
              console.error("MAILERSEND_CRITICAL_FAILURE", {
                type: "CUSTOMER_EMAIL",
                order_id: orderId,
                error: customerEmailResult.error
              });
              webhookSuccess = false;
              webhookError = customerEmailResult.error || "Customer email failed";
            }
          } catch (emailError) {
            const message = emailError instanceof Error ? emailError.message : String(emailError);
            console.error("MAILERSEND_CRITICAL_FAILURE", {
              type: "CUSTOMER_EMAIL_EXCEPTION",
              order_id: orderId,
              error: message
            });
            webhookSuccess = false;
            webhookError = message;
          }

          // Send admin notification email
          let adminEmailResult: { success: boolean; error?: string };
          try {
            console.log("[WEBHOOK] Sending admin notification...");
            adminEmailResult = await sendAdminNotificationEmail(personalizationData);
            
            if (adminEmailResult.success) {
              console.log("[WEBHOOK] Admin email: SUCCESS");
            } else {
              console.error("[WEBHOOK] Admin email: FAILED");
              console.error("MAILERSEND_CRITICAL_FAILURE", {
                type: "ADMIN_EMAIL",
                order_id: orderId,
                error: adminEmailResult.error
              });
              // Don't fail the whole webhook for admin email failure
            }
          } catch (emailError) {
            const message = emailError instanceof Error ? emailError.message : String(emailError);
            console.error("MAILERSEND_CRITICAL_FAILURE", {
              type: "ADMIN_EMAIL_EXCEPTION",
              order_id: orderId,
              error: message
            });
            // Don't fail the whole webhook for admin email failure
          }
        }
      }
    }

    // ========================================================================
    // STEP 7: Return response to Stripe
    // This is the ABSOLUTE LAST LINE - all email operations have completed
    // ========================================================================

    console.log("========================================");
    console.log("[WEBHOOK] PROCESSING COMPLETE");
    console.log("[WEBHOOK] Success:", webhookSuccess);
    if (webhookError) {
      console.log("[WEBHOOK] Error:", webhookError);
    }
    console.log("========================================");

    // Always return 200 to Stripe to prevent retries
    // But include our internal status for debugging
    return NextResponse.json({ 
      received: true,
      processed: webhookSuccess,
      error: webhookError
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[WEBHOOK] UNHANDLED ERROR:", message);
    
    // Still return 200 to Stripe to prevent infinite retries
    // The error is logged for debugging
    return NextResponse.json({ 
      received: true, 
      processed: false,
      error: message
    });
  }
}
