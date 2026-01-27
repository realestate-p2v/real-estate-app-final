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

  // Determine product name based on photo count
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

  // Create Checkout Session with embedded UI
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
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
      productName,
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
