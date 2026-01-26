import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/mongodb";
import type { Order } from "@/lib/types/order";

export async function POST(request: Request) {
  try {
    const { amount, customerName, customerEmail, photoCount, orderId } = await request.json();

    if (!amount || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "Amount and email are required" },
        { status: 400 }
      );
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || "https://realestatephoto2video.com";

    // Fetch order from database to include all details in metadata
    // This ensures email receipts have all info even if webhook can't connect to DB
    let orderData: Order | null = null;
    let photoUrls = "";
    let musicSelection = "Not specified";
    let specialInstructions = "None";
    let customerPhone = "Not provided";
    let brandingType = "unbranded";
    let voiceoverIncluded = "No";
    let includeEditedPhotos = "No";

    if (orderId && orderId !== "direct") {
      try {
        const db = await getDatabase();
        orderData = await db.collection<Order>("orders").findOne({ orderId });
        
        if (orderData) {
          console.log("[Checkout] Found order in database:", orderId);
          
          // Extract all order details
          musicSelection = orderData.musicSelection || "Not specified";
          specialInstructions = orderData.specialInstructions || "None";
          customerPhone = orderData.customer?.phone || "Not provided";
          brandingType = orderData.branding?.type || "unbranded";
          voiceoverIncluded = orderData.voiceover ? "Yes" : "No";
          includeEditedPhotos = orderData.includeEditedPhotos ? "Yes" : "No";
          
          // Build photo URLs string (truncated to fit Stripe's 500 char limit per key)
          if (orderData.photos && orderData.photos.length > 0) {
            photoUrls = orderData.photos
              .map((p, i) => `${i + 1}:${p.secure_url}`)
              .join("|");
          }
        }
      } catch (dbError) {
        console.error("[Checkout] Failed to fetch order from DB:", dbError);
        // Continue without order data - we'll rely on what we have
      }
    }

    // Stripe metadata has a 500 character limit per value
    // Split photo URLs into multiple keys if needed
    const photoUrlChunks: Record<string, string> = {};
    if (photoUrls.length > 0) {
      const chunkSize = 490; // Leave some room
      let chunkIndex = 0;
      for (let i = 0; i < photoUrls.length; i += chunkSize) {
        photoUrlChunks[`photoUrls_${chunkIndex}`] = photoUrls.slice(i, i + chunkSize);
        chunkIndex++;
        if (chunkIndex >= 10) break; // Stripe has limits on metadata keys too
      }
    }

    // Create Stripe checkout session with all order details in metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Real Estate Walkthrough Video`,
              description: `Professional HD walkthrough video with ${photoCount} photos`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/order/success?orderId=${orderId || "direct"}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order?cancelled=true`,
      customer_email: customerEmail,
      phone_number_collection: { enabled: true }, // Also collect phone from Stripe
      metadata: {
        orderId: orderId || "direct",
        customerName,
        customerPhone,
        photoCount: String(photoCount),
        musicSelection,
        specialInstructions: specialInstructions.slice(0, 490), // Truncate if needed
        brandingType,
        voiceoverIncluded,
        includeEditedPhotos,
        ...photoUrlChunks, // Spread photo URL chunks
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
