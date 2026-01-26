import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { amount, customerName, customerEmail, photoCount } =
      await request.json();

    if (!amount || !customerName || !customerEmail || !photoCount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine tier based on photo count
    let tierName = "Standard";
    if (photoCount > 25) {
      tierName = "Professional";
    } else if (photoCount > 15) {
      tierName = "Premium";
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Real Estate Photo 2 Video - ${tierName}`,
              description: `${photoCount} photos - AI-enhanced walkthrough video`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        customerName,
        photoCount: photoCount.toString(),
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
