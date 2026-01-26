import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

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

    // Create Stripe checkout session
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
      metadata: {
        orderId: orderId || "direct",
        customerName,
        photoCount: String(photoCount),
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
