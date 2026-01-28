"use server";

import { stripe } from "@/lib/stripe";
import { getProduct } from "@/lib/products";

export async function createCheckoutSession(productId: string) {
  const product = await getProduct(productId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order/cancel`,
  });

  return { sessionId: session.id };
}
