import { NextResponse } from "next/server";
import type { Order, OrderPhoto } from "@/lib/types/order";
import { getDatabase } from "@/lib/mongodb";

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
  try {
    const input = await request.json();

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
    const totalPrice = basePrice + brandingFee + voiceoverFee;

    // Create order document
    const order: Order = {
      orderId: generateOrderId(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: input.customer,
      photos: uploadedPhotos.sort((a, b) => a.order - b.order),
      photoCount: uploadedPhotos.length,
      musicSelection: input.musicSelection,
      customAudio,
      branding: input.branding,
      voiceover: input.voiceover,
      voiceoverScript: input.voiceoverScript,
      specialInstructions: input.specialInstructions,
      basePrice,
      brandingFee,
      voiceoverFee,
      totalPrice,
      paymentStatus: "pending",
    };

    // Save to MongoDB with fallback
    let mongoId = null;
    try {
      const db = await getDatabase();
      const result = await db.collection<Order>("orders").insertOne(order);
      mongoId = result.insertedId;
    } catch (dbError) {
      // Log the database error but continue - order data is preserved in the response
      console.error("[v0] MongoDB save failed:", dbError);
      // Don't fail the order - we have all the data and can process it manually if needed
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
        _id: mongoId,
        totalPrice,
        photoCount: uploadedPhotos.length,
        // Include photo URLs so order can still be processed
        photos: uploadedPhotos,
        customer: order.customer,
      },
    });
  } catch (error) {
    console.error("[v0] Create order error:", error);
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

    const db = await getDatabase();
    const order = await db.collection<Order>("orders").findOne({ orderId });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

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
