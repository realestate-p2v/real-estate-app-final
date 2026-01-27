import { NextResponse } from "next/server";
import type { Order, OrderPhoto } from "@/lib/types/order";
import { createAdminClient } from "@/lib/supabase/admin";

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `P2V-${timestamp}-${random}`;
}

function calculateBasePrice(photoCount: number): number {
  if (photoCount <= 12) return 99;
  if (photoCount <= 25) return 149;
  if (photoCount <= 35) return 199;
  return 199 + Math.ceil((photoCount - 35) / 10) * 50;
}

export async function POST(request: Request) {
  console.log("[v0] Orders API - POST request received");
  
  try {
    const input = await request.json();
    console.log("[v0] Order input received:", JSON.stringify({
      customer: input.customer,
      photoCount: input.uploadedPhotos?.length,
      musicSelection: input.musicSelection,
      branding: input.branding,
      voiceover: input.voiceover,
      specialInstructions: input.specialInstructions,
    }));

    // Validate required fields (phone is optional)
    if (!input.customer?.name || !input.customer?.email) {
      return NextResponse.json(
        { success: false, error: "Customer name and email are required" },
        { status: 400 }
      );
    }

    // Photos should already be uploaded from client
    const uploadedPhotos: OrderPhoto[] = input.uploadedPhotos || [];
    
    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one photo is required" },
        { status: 400 }
      );
    }

    // Handle custom audio
    let customAudio = undefined;
    if (input.customAudioUrl && input.customAudioFilename) {
      customAudio = {
        public_id: "",
        secure_url: input.customAudioUrl,
        filename: input.customAudioFilename,
      };
    }

    // Calculate pricing
    const basePrice = calculateBasePrice(uploadedPhotos.length);
    const brandingFee = input.branding.type === "custom" ? 25 : 0;
    const voiceoverFee = input.voiceover ? 25 : 0;
    const editedPhotosFee = input.includeEditedPhotos ? 15 : 0;
    const totalPrice = basePrice + brandingFee + voiceoverFee + editedPhotosFee;

    const orderId = generateOrderId();

    // Create order document for Supabase
    const orderData = {
      order_id: orderId,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone || null,
      photos: uploadedPhotos.sort((a: OrderPhoto, b: OrderPhoto) => a.order - b.order),
      photo_count: uploadedPhotos.length,
      music_selection: input.musicSelection,
      custom_audio: customAudio || null,
      branding: input.branding,
      voiceover: input.voiceover || false,
      voiceover_script: input.voiceoverScript || null,
      special_instructions: input.specialInstructions || null,
      include_edited_photos: input.includeEditedPhotos || false,
      base_price: basePrice,
      branding_fee: brandingFee,
      voiceover_fee: voiceoverFee,
      edited_photos_fee: editedPhotosFee,
      total_price: totalPrice,
      payment_status: "pending",
    };

    console.log("[v0] Saving order to Supabase:", orderId);
    console.log("[v0] Order data:", JSON.stringify(orderData, null, 2));

    // Save to Supabase using admin client (bypasses RLS)
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error("[v0] Supabase insert error:", error.message, error.code, error.details);
      // Don't fail the order - return data anyway so payment can proceed
      return NextResponse.json({
        success: true,
        data: {
          orderId: orderId,
          totalPrice,
          photoCount: uploadedPhotos.length,
          photos: uploadedPhotos,
          customer: input.customer,
          dbError: error.message,
        },
      });
    }

    console.log("[v0] Order saved successfully to Supabase:", data?.id);

    // Build the Order object for response
    const order: Order = {
      orderId: orderId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: input.customer,
      photos: uploadedPhotos.sort((a: OrderPhoto, b: OrderPhoto) => a.order - b.order),
      photoCount: uploadedPhotos.length,
      musicSelection: input.musicSelection,
      customAudio,
      branding: input.branding,
      voiceover: input.voiceover,
      voiceoverScript: input.voiceoverScript,
      specialInstructions: input.specialInstructions,
      includeEditedPhotos: input.includeEditedPhotos || false,
      basePrice,
      brandingFee,
      voiceoverFee,
      editedPhotosFee,
      totalPrice,
      paymentStatus: "pending",
    };

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
        _id: data?.id,
        totalPrice,
        photoCount: uploadedPhotos.length,
        photos: uploadedPhotos,
        customer: order.customer,
      },
    });
  } catch (error) {
    console.error("[Orders API] Create order error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Map Supabase data back to Order format
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
      basePrice: parseFloat(data.base_price),
      brandingFee: parseFloat(data.branding_fee),
      voiceoverFee: parseFloat(data.voiceover_fee),
      editedPhotosFee: parseFloat(data.edited_photos_fee),
      totalPrice: parseFloat(data.total_price),
      paymentStatus: data.payment_status,
    };

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to get order" },
      { status: 500 }
    );
  }
}
