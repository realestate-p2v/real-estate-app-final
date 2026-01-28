"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface StripePaymentProps {
  amount: number;
  customerName: string;
  customerEmail: string;
  photoCount: number;
  orderId: string;
}

export default function StripePayment({
  amount,
  customerName,
  customerEmail,
  photoCount,
  orderId,
}: StripePaymentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // 1. Create the Checkout Session on the server
      const response = await fetch("/api/orders/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to initialize payment session");
      }

      // 2. THE FIX: Redirect directly to the Stripe-hosted checkout URL
      // stripe.redirectToCheckout is no longer supported in the latest Stripe.js
      window.location.assign(data.url);

    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all group"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            SECURELY PROCESSING...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
            PAY ${amount.toFixed(2)} & FINISH ORDER
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium uppercase tracking-wider">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        Secured by Stripe — 256-bit Encryption
      </div>
    </div>
  );
}
