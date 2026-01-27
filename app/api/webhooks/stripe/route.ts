import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail, sendAdminNotificationEmail } from "@/lib/mailersend";
import type { Order } from "@/lib/types/order";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch order from Supabase with retry logic
 */
async function getOrderFromDatabase(orderId: string): Promise<{ order: Order | null; dbError: string | null }> {
  console.log("[v0] Fetching order from Supabase:", orderId);

  const supabase = getSupabaseAdmin();
  
  if (!supabase) {
    return { order: null, dbError: "Supabase not configured" };
  }

  const MAX_RETRIES = 5;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[v0] Database fetch attempt ${attempt}/${MAX_RETRIES}`);
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (error) {
        console.log(`[v0] Attempt ${attempt} error:`, error.message);
        if (attempt < MAX_RETRIES) {
          await sleep(2000);
          continue;
        }
        return { order: null, dbError: error.message };
      }

      if (!data) {
        if (attempt < MAX_RETRIES) {
          await sleep(2000);
          continue;
        }
        return { order: null, dbError: "Order not found" };
      }

      console.log("[v0] Order found in database");
      
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
        photos: data.photos || [],
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

      // Update to paid
      await supabase
        .from("orders")
        .update({ payment_status: "paid", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);

      return { order, dbError: null };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await sleep(2000);
        continue;
      }
      return { order: null, dbError: getErrorMessage(error) };
    }
  }
  
  return { order: null, dbError: "All retries exhausted" };
}

function buildImageUrls(photos: Order["photos"]): string {
  if (!photos || photos.length === 0) return "No images uploaded";
  return photos.map((photo, index) => `Photo ${index + 1}: ${photo.secure_url}`).join("\n");
}

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
  console.log("[v0] ========================================");
  console.log("[v0] STRIPE WEBHOOK RECEIVED");
  console.log("[v0] Timestamp:", new Date().toISOString());
  console.log("[v0] ========================================");

  let body: string;
  try {
    body = await request.text();
  } catch (err) {
    console.error("[v0] Failed to read request body:", getErrorMessage(err));
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  let signature: string | null;
  try {
    const headersList = await headers();
    signature = headersList.get("stripe-signature");
  } catch (err) {
    console.error("[v0] Failed to get headers:", getErrorMessage(err));
    return NextResponse.json({ error: "Failed to read headers" }, { status: 400 });
  }

  if (!signature) {
    console.error("[v0] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[v0] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("[v0] Signature verified - Event type:", event.type);
  } catch (err) {
    console.error("[v0] Signature verification failed:", getErrorMessage(err));
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId || session.client_reference_id || "Unknown";

      console.log("[v0] ========================================");
      console.log("[v0] CHECKOUT SESSION COMPLETED");
      console.log("[v0] Session ID:", session.id);
      console.log("[v0] Order ID:", orderId);
      console.log("[v0] ========================================");

      // Get customer info from Stripe session
      const customerName = session.customer_details?.name || session.metadata?.customerName || "Customer";
      const customerEmail = session.customer_details?.email || session.metadata?.customerEmail || "";
      const customerPhone = session.customer_details?.phone || session.metadata?.customerPhone || "Not provided";
      const amountTotal = session.amount_total || 0;
      const price = `$${(amountTotal / 100).toFixed(2)}`;

      console.log("[v0] Customer Email from Stripe:", customerEmail);
      console.log("[v0] Customer Name:", customerName);

      // Get product name
      let productName = session.metadata?.productName || "";
      if (!productName) {
        try {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
          if (lineItems.data.length > 0) {
            productName = lineItems.data[0].description || "Video Package";
          }
        } catch {
          productName = "Video Package";
        }
      }

      // Fetch order from database
      const { order, dbError } = await getOrderFromDatabase(orderId);
      
      console.log("[v0] Database result - Order found:", !!order);
      if (dbError) {
        console.log("[v0] Database error:", dbError);
      }

      // Build personalization data
      const personalizationData = {
        order_id: orderId,
        product_name: productName || "Video Package",
        customer_name: order?.customer?.name || customerName,
        customer_email: order?.customer?.email || customerEmail,
        customer_phone: order?.customer?.phone || customerPhone,
        price: price,
        base_price: order?.basePrice ? `$${order.basePrice.toFixed(2)}` : price,
        branding_fee: order?.brandingFee ? `$${order.brandingFee.toFixed(2)}` : "$0.00",
        voiceover_fee: order?.voiceoverFee ? `$${order.voiceoverFee.toFixed(2)}` : "$0.00",
        edited_photos_fee: order?.editedPhotosFee ? `$${order.editedPhotosFee.toFixed(2)}` : "$0.00",
        photo_count: order?.photoCount?.toString() || order?.photos?.length?.toString() || "0",
        image_urls: order?.photos ? buildImageUrls(order.photos) : "No images available",
        music_choice: order?.musicSelection || "Not specified",
        custom_audio_filename: order?.customAudio?.filename || "None",
        custom_audio_url: order?.customAudio?.secure_url || "None",
        branding_type: order?.branding?.type || "unbranded",
        branding_logo_url: order?.branding?.logoUrl || "None",
        agent_name: order?.branding?.agentName || "N/A",
        company_name: order?.branding?.companyName || "N/A",
        agent_phone: order?.branding?.phone || "N/A",
        agent_email: order?.branding?.email || "N/A",
        agent_website: order?.branding?.website || "N/A",
        branding_info: order?.branding ? buildBrandingInfo(order.branding) : "Unbranded",
        voiceover_included: order?.voiceover ? "Yes" : "No",
        voiceover_script: order?.voiceoverScript || "None",
        include_edited_photos: order?.includeEditedPhotos ? "Yes" : "No",
        special_requests: order?.specialInstructions || "None",
        video_titles: order?.branding ? buildBrandingInfo(order.branding) : "Unbranded",
        db_status: dbError ? `Error: ${dbError}` : "Connected",
      };

      console.log("[v0] ========================================");
      console.log("[v0] SENDING EMAILS VIA MAILERSEND");
      console.log("[v0] ========================================");
      console.log("[v0] Customer email to send to:", personalizationData.customer_email);
      console.log("[v0] MAILERSEND_API_KEY set:", !!process.env.MAILERSEND_API_KEY);
      console.log("[v0] MAILERSEND_SENDER_EMAIL:", process.env.MAILERSEND_SENDER_EMAIL);

      if (personalizationData.customer_email) {
        // Send customer email
        try {
          console.log("[v0] Calling sendCustomerEmail...");
          const customerResult = await sendCustomerEmail(personalizationData);
          console.log("[v0] Customer email result:", customerResult.success ? "SUCCESS" : "FAILED");
          if (!customerResult.success) {
            console.error("[v0] Customer email error:", customerResult.error);
          }
        } catch (error) {
          console.error("[v0] Customer email exception:", getErrorMessage(error));
        }

        // Send admin email
        try {
          console.log("[v0] Calling sendAdminNotificationEmail...");
          const adminResult = await sendAdminNotificationEmail(personalizationData);
          console.log("[v0] Admin email result:", adminResult.success ? "SUCCESS" : "FAILED");
          if (!adminResult.success) {
            console.error("[v0] Admin email error:", adminResult.error);
          }
        } catch (error) {
          console.error("[v0] Admin email exception:", getErrorMessage(error));
        }
      } else {
        console.error("[v0] NO CUSTOMER EMAIL AVAILABLE - Cannot send emails");
        console.error("[v0] Stripe session customer_details:", JSON.stringify(session.customer_details));
        console.error("[v0] Stripe session metadata:", JSON.stringify(session.metadata));
        console.error("[v0] Database order customer:", JSON.stringify(order?.customer));
      }

      console.log("[v0] ========================================");
      console.log("[v0] WEBHOOK PROCESSING COMPLETE");
      console.log("[v0] ========================================");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[v0] Error processing webhook:", getErrorMessage(error));
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
