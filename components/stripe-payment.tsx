//
import { stripePromise } from "@/lib/stripe";

const handlePayment = async () => {
  setIsLoading(true);
  try {
    const stripe = await stripePromise; // Wait for Stripe to load
    
    if (!stripe) {
      throw new Error("Stripe failed to initialize.");
    }

    const response = await fetch("/api/orders/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const data = await response.json();

    // Redirect to Stripe using the session ID from your API
    const { error } = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (error) throw error;
  } catch (err) {
    console.error("Payment error:", err);
  } finally {
    setIsLoading(false);
  }
};
