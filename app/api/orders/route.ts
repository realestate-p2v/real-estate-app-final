import { NextResponse } from "next/server";
import type { Order, OrderPhoto } from "@/lib/types/order";
import { createAdminClient } from "@/lib/supabase/admin";

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `P2V-${timestamp}-${random}`;
}

function calculateBasePrice(photoCount: number): number {
  if (photoCount === 1) return 1;
  if (photoCount <= 12) return 99;
  if (photoCount <= 25) return 149;
  if (photoCount <= 35) return 199;
  return 199 + Math.ceil((photoCount - 35) / 10) * 50;
}

export async function POST(request: Request) {
  try {
    const input = await request.json();

    if (!input.customer?.name || !input.customer?.email) {
      return NextResponse.json({ success: false, error: "Required fields missing" }, { status: 400 });
    }

    const uploadedPhotos: OrderPhoto[] = input.uploadedPhotos || [];
    const basePrice = calculateBasePrice(input.photoCount || uploadedPhotos.length);
    const orderId = generateOrderId();

    const orderData = {
      order_id: orderId,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone || null,
      photos: uploadedPhotos,
      photo_count: input.photoCount || uploadedPhotos.length,
      music_selection: input.musicSelection,
      branding: input.branding,
      voiceover: input.voiceover || false,
      voiceover_script: input.voiceoverScript || null,
      special_instructions: input.specialInstructions || null,
      total_price: input.totalPrice,
      payment_status: "pending",
      status: "New",
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("orders").insert(orderData).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { orderId: orderId } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Keep your original GET function below if you had one
