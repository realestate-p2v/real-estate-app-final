import { NextResponse } from "next/server";
import type { Order, OrderPhoto } from "@/lib/types/order";
import { createAdminClient } from "@/lib/supabase/admin";

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `P2V-${timestamp}-${random}`;
}

function calculateBasePrice(photoCount: number): number {
  if (photoCount <= 1) return 1; // Test price
  if (photoCount <= 15) return 79;
  if (photoCount <= 25) return 129;
  if (photoCount <= 35) return 179;
  return 199;
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    
    // 1. Validate required customer fields
    if (!input.customer?.name || !input.customer?.email) {
      return NextResponse.json(
        { success: false, error: "Customer name and email are required" },
        { status: 400 }
      );
    }

    const uploadedPhotos: OrderPhoto[] = input.uploadedPhotos || [];
    const listingUrl = input.listingUrl || null;
    const urlInstructions = input.urlInstructions || null;

    // 2. FIXED VALIDATION: Allow empty photos IF listingUrl exists
    if (uploadedPhotos.length === 0 && !listingUrl) {
      return NextResponse.json(
        { success: false, error: "Please upload photos or provide a listing URL" },
        { status: 400 }
      );
    }

    // 3. Determine photo count for pricing (Manual count vs URL package choice)
    // If user provided a URL, we treat the count as the package they selected (defaulting to 15)
    const pricingPhotoCount = listingUrl ? (input.photoCount || 15) : uploadedPhotos.length;

    // 4. Calculate pricing
    const basePrice = calculateBasePrice(pricingPhotoCount);
    const brandingFee = input.branding?.type === "custom" ? 25 : 0;
    const voiceoverFee = input.voiceover ? 25 : 0;
    const editedPhotosFee = input.includeEditedPhotos ? 15 : 0;
    const totalPrice = basePrice + brandingFee + voiceoverFee + editedPhotosFee;

    const orderId = generateOrderId();

    // 5. Prepare Supabase Data
    const orderData = {
      order_id: orderId,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone || null,
      listing_url: listingUrl, // NEW FIELD
      url_instructions: urlInstructions, // NEW FIELD
      photos: uploadedPhotos.sort((a: OrderPhoto, b: OrderPhoto) => a.order - b.order),
      photo_count: pricingPhotoCount,
      music_selection: input.musicSelection,
      branding: input.branding,
      voiceover: input.voiceover || false,
      voiceover_script: input.voiceoverScript || null,
      voiceover_voice: input.voiceoverVoice || null,
      special_instructions: input.specialInstructions || null,
      include_edited_photos: input.includeEditedPhotos || false,
      base_price: basePrice,
      branding_fee: brandingFee,
      voiceover_fee: voiceoverFee,
      edited_photos_fee: editedPhotosFee,
      total_price: totalPrice,
      payment_status: "pending",
      status: "New",
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error.message);
      return NextResponse.json({
        success: false, 
        error: `Database Error: ${error.message}. Ensure listing_url and url_instructions columns exist in Supabase.`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderId,
        totalPrice,
        customer: input.customer,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        orderId: data.order_id,
        status: data.status,
        customer: { name: data.customer_name, email: data.customer_email, phone: data.customer_phone },
        listingUrl: data.listing_url,
        photoCount: data.photo_count,
        totalPrice: data.total_price,
        paymentStatus: data.payment_status
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get order" }, { status: 500 });
  }
}
