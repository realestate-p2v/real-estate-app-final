import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Support both form payload (items, customerDetails, orderData) and legacy (amount, customerName, ...)
    const orderId = body.orderData?.orderId ?? body.orderId;
    const amountCents = body.items?.[0]?.amount ?? (body.amount != null ? Math.round(Number(body.amount) * 100) : null);
    const customerName = body.customerDetails?.name ?? body.customerName;
    const customerEmail = body.customerDetails?.email ?? body.customerEmail;
    const photoCount = body.orderData?.photoCount ?? body.photoCount ?? 0;

    if (!amountCents || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "Amount and email are required" },
        { status: 400 }
      );
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || "https://realestatephoto2video.com";

    // Fetch order from Supabase to include all details in metadata
    let photoUrls = "";
    let musicSelection = "Not specified";
    let specialInstructions = "None";
    let customerPhone = "Not provided";
    let brandingType = "unbranded";
    let voiceoverIncluded = "No";
    let includeEditedPhotos = "No";

    if (orderId && orderId !== "direct") {
      try {
        const supabase = createAdminClient();
        const { data: orderData, error } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .single();
        
        if (!error && orderData) {
          console.log("[Checkout] Found order in Supabase:", orderId);
          
          // Extract all order details
          musicSelection = orderData.music_selection || "Not specified";
          specialInstructions = orderData.special_instructions || "None";
          customerPhone = orderData.customer_phone || "Not provided";
          brandingType = orderData.branding?.type || "unbranded";
          voiceoverIncluded = orderData.voiceover ? "Yes" : "No";
          includeEditedPhotos = orderData.include_edited_photos ? "Yes" : "No";
          
          // Build photo URLs string (truncated to fit Stripe's 500 char limit per key)
          if (orderData.photos && orderData.photos.length > 0) {
            photoUrls = orderData.photos
              .map((p: { secure_url: string }, i: number) => `${i + 1}:${p.secure_url}`)
              .join("|");
          }
        }
      } catch (dbError) {
        console.error("[Checkout] Failed to fetch order from Supabase:", dbError);
      }
    }

    // Stripe metadata has a 500 character limit per value
    // Split photo URLs into multiple keys if needed
    const photoUrlChunks: Record<string, string> = {};
    if (photoUrls.length > 0) {
      const chunkSize = 490;
      let chunkIndex = 0;
      for (let i = 0; i < photoUrls.length; i += chunkSize) {
        photoUrlChunks[`photoUrls_${chunkIndex}`] = photoUrls.slice(i, i + chunkSize);
        chunkIndex++;
        if (chunkIndex >= 10) break;
      }
    }

    // Create Stripe checkout session with all order details in metadata
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Real Estate Walkthrough Video`,
              description: `Professional HD walkthrough video with ${photoCount} photos`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/order/success?orderId=${orderId || "direct"}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order?cancelled=true`,
      customer_email: customerEmail,
      phone_number_collection: { enabled: true },
      metadata: {
        orderId: orderId || "direct",
        customerName,
        customerPhone,
        photoCount: String(photoCount),
        musicSelection,
        specialInstructions: specialInstructions.slice(0, 490),
        brandingType,
        voiceoverIncluded,
        includeEditedPhotos,
        ...photoUrlChunks,
      },
    });

    return NextResponse.json({
      success: true,
      id: session.id,
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
