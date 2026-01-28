const handlePayment = async () => {
  setIsLoading(true);
  try {
    // 1. Call your backend to create the session
    const response = await fetch("/api/orders/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const data = await response.json();

    if (!data.url) {
      throw new Error("No checkout URL received from server.");
    }

    // 2. THE NEW WAY: Direct browser redirect
    // Instead of stripe.redirectToCheckout({ sessionId: data.sessionId })
    window.location.assign(data.url);

  } catch (err) {
    console.error("Payment error:", err);
    toast.error("Could not open checkout. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
  }
};
