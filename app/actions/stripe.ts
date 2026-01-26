"use server";

import { stripe } from "@/lib/stripe";
import { getProduct } from "@/lib/products";

export async function createCheckoutSession(productId: string) {
  const product = getProduct(productId);

  if (!product) {
    return { error: "Product not found" };
  }

  const orderId = `product-${productId}-${Date.now()}`;
  
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Real Estate Photo 2 Video - ${product.name}`,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      orderId: orderId,
      productId: productId,
      productName: product.name,
    },
  });

  return { clientSecret: session.client_secret };
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    status: session.status,
    customerEmail: session.customer_details?.email,
  };
}
