// components/stripe-payment.tsx

const handlePayment = async () => {
  setIsLoading(true);
  try {
    // 1. We still fetch the session from your API
    const response = await fetch("/api/orders/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        customerName,
        customerEmail,
        photoCount,
        orderId: orderId // Ensure this matches your prop name
      }),
    });

    const data = await response.json();

    // 2. We check if the server gave us a URL
    if (!data.url) {
      throw new Error("No checkout URL found in server response.");
    }

    // 3. THE FIX: Redirect the browser directly to Stripe's hosted page
    // This bypasses the deprecated stripe.redirectToCheckout function entirely
    window.location.assign(data.url);

  } catch (err: any) {
    console.error("Payment error:", err);
    toast.error(err.message || "Payment failed to initialize.");
  } finally {
    setIsLoading(false);
  }
};
