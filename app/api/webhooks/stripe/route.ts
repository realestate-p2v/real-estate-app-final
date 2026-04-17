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
 * HANDLES:
 * 1. Video order payments (checkout.session.completed with orderId)
 * 2. Lens subscription activations (checkout.session.completed with product: "lens")
 * 3. Lens subscription cancellations (customer.subscription.deleted)
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
  
  if (session.metadata?.orderId) {
    console.log("[WEBHOOK] SUCCESS: Found orderId in metadata.orderId:", session.metadata.orderId);
    return session.metadata.orderId;
  }
  
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

function buildImageUrlsArray(photos: Order["photos"]): string[] {
  if (!photos || photos.length === 0) return [];
  return photos.map((p) => p.secure_url);
}

function buildImageUrlsString(photos: Order["photos"]): string {
  if (!photos || photos.length === 0) return "No images uploaded";
  return photos.map((p, i) => `Photo ${i + 1}: ${p.secure_url}`).join("\n");
}

// ============================================================================
// LENS SUBSCRIPTION HANDLER
// ============================================================================

async function handleLensSubscription(session: Stripe.Checkout.Session): Promise<{ success: boolean; error?: string }> {
  console.log("========================================");
  console.log("[WEBHOOK] LENS SUBSCRIPTION ACTIVATION");
  console.log("========================================");

  const userId = session.metadata?.user_id || session.client_reference_id;
  const userEmail = session.metadata?.user_email || session.customer_details?.email;
  const plan = session.metadata?.plan || "monthly";
  const subscriptionTier = session.metadata?.subscription_tier || (plan.startsWith("pro") ? "pro" : "tools");

  if (!userId) {
    console.error("[WEBHOOK] LENS: No user_id in metadata or client_reference_id");
    return { success: false, error: "No user_id found" };
  }

  console.log("[WEBHOOK] LENS: user_id:", userId);
  console.log("[WEBHOOK] LENS: email:", userEmail);
  console.log("[WEBHOOK] LENS: plan:", plan);
  console.log("[WEBHOOK] LENS: subscription_tier:", subscriptionTier);

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  // Extract Stripe customer ID and subscription ID
  const stripeCustomerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id || null;
  const stripeSubscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : (session.subscription as any)?.id || null;

  // Update lens_usage — activate subscription
  const { error: updateError } = await supabase
    .from("lens_usage")
    .upsert({
      user_id: userId,
      is_subscriber: true,
      subscription_tier: subscriptionTier,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    }, { onConflict: "user_id" });

  if (updateError) {
    console.error("[WEBHOOK] LENS: Failed to update lens_usage:", updateError.message);
    return { success: false, error: updateError.message };
  }

  console.log("[WEBHOOK] LENS: Subscription activated successfully");
  console.log("[WEBHOOK] LENS: tier:", subscriptionTier);

  return { success: true };
}

// ============================================================================
// LENS SUBSCRIPTION CANCELLATION HANDLER
// ============================================================================

async function handleLensCancel(subscription: Stripe.Subscription): Promise<{ success: boolean; error?: string }> {
  console.log("========================================");
  console.log("[WEBHOOK] LENS SUBSCRIPTION CANCELLED");
  console.log("========================================");

  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error("[WEBHOOK] LENS CANCEL: No user_id in subscription metadata");
    return { success: false, error: "No user_id in metadata" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const { error: updateError } = await supabase
    .from("lens_usage")
    .update({
      is_subscriber: false,
      subscription_tier: null,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("[WEBHOOK] LENS CANCEL: Failed to update lens_usage:", updateError.message);
    return { success: false, error: updateError.message };
  }

  console.log("[WEBHOOK] LENS CANCEL: Subscription deactivated for user:", userId);
  return { success: true };
}

// ============================================================================
// SUPABASE ORDER FETCH WITH RETRY (Supabase Race Fix)
// ============================================================================

async function fetchOrderWithRetry(orderId: string): Promise<Order> {
  console.log("[WEBHOOK] === RACE CONDITION FIX: SUPABASE RETRY LOOP ===");
  console.log(`[WEBHOOK] Order ID: ${orderId}`);

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

    if (error && error.code !== "PGRST116") {
      console.error(`[WEBHOOK] Attempt ${attempt} - Database error: ${error.message} (code: ${error.code})`);
    }

    if (data) {
      console.log(`[WEBHOOK] SUCCESS: Order found on attempt ${attempt}`);

      await supabase
        .from("orders")
        .update({ 
          payment_status: "paid", 
          status: "new",
          updated_at: new Date().toISOString() 
        })
        .eq("order_id", orderId);

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

    if (attempt < SUPABASE_RETRY_ATTEMPTS) {
      console.log(`[WEBHOOK] Order not found. Waiting ${SUPABASE_RETRY_DELAY_MS}ms...`);
      await sleep(SUPABASE_RETRY_DELAY_MS);
    }
  }

  const totalWaitTime = (SUPABASE_RETRY_ATTEMPTS - 1) * SUPABASE_RETRY_DELAY_MS / 1000;
  console.error("[WEBHOOK] === FATAL: ORDER NOT FOUND AFTER ALL RETRIES ===");
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
    image_urls: buildImageUrlsString(order.photos),
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
    // HANDLE: customer.subscription.deleted (Lens cancellation)
    // ========================================================================

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Only handle Lens subscriptions
      if (subscription.metadata?.product === "lens") {
        const result = await handleLensCancel(subscription);
        return NextResponse.json({ received: true, lens_cancel: result });
      }

      return NextResponse.json({ received: true, processed: false, reason: "Not a lens subscription" });
    }

    // ========================================================================
    // HANDLE: checkout.session.completed
    // ========================================================================

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("========================================");
      console.log("[WEBHOOK] CHECKOUT SESSION COMPLETED");
      console.log("[WEBHOOK] Session ID:", session.id);
      console.log("[WEBHOOK] Mode:", session.mode);
      console.log("[WEBHOOK] Payment Status:", session.payment_status);
      console.log("[WEBHOOK] Amount:", session.amount_total);
      console.log("[WEBHOOK] Metadata:", JSON.stringify(session.metadata));
      console.log("========================================");

      if (session.payment_status !== "paid") {
        console.log("[WEBHOOK] Skipping: Session is not paid yet. Status:", session.payment_status);
        return NextResponse.json({ 
          received: true, 
          processed: false, 
          reason: "Payment not yet completed" 
        });
      }

      // ====================================================================
      // LENS SUBSCRIPTION — handle separately from video orders
      // ====================================================================

      if (session.metadata?.product === "lens" || session.mode === "subscription") {
        console.log("[WEBHOOK] Detected LENS subscription checkout");
        const result = await handleLensSubscription(session);
        
        // Also activate 10-day trial fields if this is their first subscription
        // (trial_activated_at is used for the trial period after video purchase,
        //  but setting it here ensures the subscription is tracked)
        
        return NextResponse.json({ 
          received: true, 
          lens_subscription: result 
        });
      }

      // ====================================================================
      // VIDEO ORDER — existing logic
      // ====================================================================

      console.log("[WEBHOOK] Payment confirmed as PAID - proceeding with VIDEO ORDER processing");

      const orderId = extractOrderId(session);

      if (!orderId) {
        console.error("[WEBHOOK] CRITICAL: Could not extract orderId from session");
        emailError = "No orderId found in session";
      } else {
        console.log("[WEBHOOK] Order ID extracted:", orderId);

        let order: Order | null = null;
        
        try {
          order = await fetchOrderWithRetry(orderId);
          console.log("[WEBHOOK] Order fetched successfully");
        } catch (dbError) {
          const message = dbError instanceof Error ? dbError.message : String(dbError);
          console.error("[WEBHOOK] CRITICAL: Database fetch failed");
          emailError = message;
        }

        if (order) {
          let productName = session.metadata?.productName || "";
          if (!productName) {
            try {
              const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
              productName = lineItems.data[0]?.description || "Video Package";
            } catch {
              productName = "Video Package";
            }
          }

          const personalizationData = buildPersonalizationData(order, session, productName);

          if (!personalizationData.customer_email) {
            emailError = "No customer email available";
          } else {
            console.log("========================================");
            console.log("[WEBHOOK] SENDING EMAILS - BLOCKING");
            console.log("========================================");

            try {
              const customerResult = await sendCustomerEmail(personalizationData);
              if (customerResult.success) {
                console.log("[WEBHOOK] Customer email: SUCCESS");
                emailSent = true;
              } else {
                console.error("[WEBHOOK] Customer email FAILED:", customerResult.error);
                emailError = customerResult.error || "Customer email failed";
              }
            } catch (err: unknown) {
              if (err && typeof err === 'object' && 'body' in err) {
                console.error("[WEBHOOK] error.body:", JSON.stringify((err as { body: unknown }).body, null, 2));
              }
              const msg = err instanceof Error ? err.message : String(err);
              console.error("[WEBHOOK] Customer email exception:", msg);
              emailError = msg;
            }

            try {
              const adminResult = await sendAdminNotificationEmail(personalizationData);
              if (adminResult.success) {
                console.log("[WEBHOOK] Admin email: SUCCESS");
              } else {
                console.error("[WEBHOOK] Admin email FAILED:", adminResult.error);
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error("[WEBHOOK] Admin email exception:", msg);
            }
          }
        }
      }
    }

    // ========================================================================
    // FINAL RESPONSE
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
    
    return NextResponse.json({ 
      received: true, 
      processed: false,
      error: message
    });
  }
}
