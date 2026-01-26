import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import type { Order } from "@/lib/types/order";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order from database
    const db = await getDatabase();
    const order = await db.collection<Order>("orders").findOne({ orderId });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Real Estate Video - ${order.photoCount} Photos`,
              description: `Professional walkthrough video with ${order.photoCount} photos${order.voiceover ? ", voiceover" : ""}${order.branding.type === "custom" ? ", custom branding" : ""}`,
            },
            unit_amount: order.totalPrice * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin")}/order/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/order?cancelled=true`,
      customer_email: order.customer.email,
      metadata: {
        orderId: order.orderId,
      },
    });

    // Update order with Stripe session ID
    await db.collection<Order>("orders").updateOne(
      { orderId },
      {
        $set: {
          stripeSessionId: session.id,
          updatedAt: new Date(),
        },
      }
    );

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
