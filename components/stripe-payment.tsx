// components/stripe-payment.tsx

const handlePayment = async () => {
  setIsLoading(true);
  try {
    const response = await fetch("/api/orders/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        customerName,
        customerEmail,
        photoCount,
        orderId
      }),
    });

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error(data.error || "Failed to create checkout session");
    }

    // THE FIX: Use direct URL redirect instead of stripe.redirectToCheckout
    window.location.assign(data.url);

  } catch (err) {
    console.error("Payment error:", err);
    toast.error("Payment initialization failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
