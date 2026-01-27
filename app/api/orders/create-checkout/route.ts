import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  console.log("[v0] POST /api/orders/create-checkout - Starting");
  try {
    const { orderId } = await request.json();
    console.log("[v0] Creating checkout for orderId:", orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order from Supabase using admin client
    console.log("[v0] Fetching order from Supabase...");
    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    console.log("[v0] Order fetch result - found:", !!order, "error:", error?.message || "none");

    if (error || !order) {
      console.error("[v0] Order not found in database for checkout");
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Build photo URLs for metadata (chunked due to Stripe's 500 char limit per value)
    const photos = order.photos || [];
    const photoUrlsChunks: Record<string, string> = {};
    let currentChunk = "";
    let chunkIndex = 0;
    
    for (let i = 0; i < photos.length; i++) {
      const photoEntry = `${i + 1}:${photos[i].secure_url}|`;
      if ((currentChunk + photoEntry).length > 450) {
        photoUrlsChunks[`photoUrls_${chunkIndex}`] = currentChunk;
        currentChunk = photoEntry;
        chunkIndex++;
      } else {
        currentChunk += photoEntry;
      }
    }
    if (currentChunk) {
      photoUrlsChunks[`photoUrls_${chunkIndex}`] = currentChunk;
    }

    // Determine product name based on photo count
    const photoCount = order.photo_count || 0;
    let productName = "Real Estate Video";
    if (photoCount === 1) {
      productName = "Test Product";
    } else if (photoCount <= 12) {
      productName = "Standard Video";
    } else if (photoCount <= 25) {
      productName = "Premium Video";
    } else if (photoCount <= 35) {
      productName = "Professional Video";
    } else {
      productName = "Agency Pack";
    }

    // Create Stripe checkout session with full metadata fallback
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: `Professional walkthrough video with ${order.photo_count} photos${order.voiceover ? ", voiceover" : ""}${order.branding?.type === "custom" ? ", custom branding" : ""}`,
            },
            unit_amount: Math.round(parseFloat(order.total_price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin")}/order/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/order?cancelled=true`,
      customer_email: order.customer_email,
      metadata: {
        orderId: order.order_id,
        productName: productName,
        customerName: order.customer_name || "",
        customerEmail: order.customer_email || "",
        customerPhone: order.customer_phone || "",
        photoCount: String(order.photo_count || 0),
        musicSelection: order.music_selection || "",
        brandingType: order.branding?.type || "unbranded",
        voiceoverIncluded: order.voiceover ? "Yes" : "No",
        includeEditedPhotos: order.include_edited_photos ? "Yes" : "No",
        specialInstructions: (order.special_instructions || "").substring(0, 450),
        ...photoUrlsChunks,
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
