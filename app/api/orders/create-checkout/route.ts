import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order from Supabase using admin client
    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !order) {
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
              name: `Real Estate Video - ${order.photo_count} Photos`,
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
