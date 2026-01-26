"use server";

import { stripe } from "@/lib/stripe";

interface CheckoutParams {
  amount: number;
  customerName: string;
  customerEmail: string;
  photoCount: number;
  orderId?: string | null;
}

export async function startCheckoutSession(params: CheckoutParams) {
  const { amount, customerName, customerEmail, photoCount, orderId } = params;

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  // Create Checkout Session with embedded UI
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Real Estate Walkthrough Video",
            description: `Professional HD walkthrough video with ${photoCount} photos`,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: customerEmail,
    metadata: {
      orderId: orderId || "direct",
      customerName,
      photoCount: String(photoCount),
    },
  });

  return session.client_secret;
}

export async function getCheckoutSessionStatus(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    status: session.status,
    customerEmail: session.customer_details?.email,
    paymentStatus: session.payment_status,
  };
}
