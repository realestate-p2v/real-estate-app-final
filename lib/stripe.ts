import { loadStripe } from "@stripe/stripe-js";
import Stripe from "stripe";

// 1. FOR THE BROWSER (Publishable Key - Must have NEXT_PUBLIC_)
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// 2. FOR THE SERVER (Secret Key - stays hidden)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // Matches your package.json version
  typescript: true,
});
