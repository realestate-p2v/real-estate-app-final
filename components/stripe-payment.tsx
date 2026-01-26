"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Shield, Loader2 } from "lucide-react";

interface StripePaymentProps {
  amount: number;
  customerName: string;
  customerEmail: string;
  photoCount: number;
  orderId?: string | null;
  onBack: () => void;
}

export default function StripePayment({
  amount,
  customerName,
  customerEmail,
  photoCount,
  orderId,
  onBack,
}: StripePaymentProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Automatically redirect to Stripe checkout when orderId is available
  useEffect(() => {
    if (orderId) {
      redirectToCheckout();
    }
  }, [orderId]);

  const redirectToCheckout = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/orders/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.error || !data.success) {
        setError(data.error || "Failed to create checkout session");
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe hosted checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No checkout URL returned");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Failed to connect to payment service");
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={onBack} variant="outline" className="mt-4 bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">Order Total</span>
        </div>
        <span className="text-2xl font-bold text-foreground">${amount}</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-foreground font-medium">Redirecting to secure checkout...</p>
            <p className="text-sm text-muted-foreground">You will be redirected to Stripe to complete your payment.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Button 
              onClick={redirectToCheckout}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Proceed to Payment
            </Button>
            <p className="text-sm text-muted-foreground">
              You will be redirected to Stripe&apos;s secure checkout page.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Secure payment powered by Stripe</span>
      </div>

      <Button
        onClick={onBack}
        variant="ghost"
        className="w-full"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Order Details
      </Button>
    </div>
  );
}
