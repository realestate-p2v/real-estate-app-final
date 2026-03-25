"use client";

import { useEffect, useRef } from "react";
import { hasConsent } from "@/components/cookie-consent";

// TODO: Replace with actual Google Ads conversion ID from Matt's Google Ads account
const GOOGLE_ADS_CONVERSION_ID = "AW-REPLACE_ME/REPLACE_ME";

export function LensConversionTracker() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") !== "true") return;

    firedRef.current = true;
    const value = 27.95;
    const transactionId = `lens_${Date.now()}`;

    // Google Ads + GA4
    if (hasConsent("analytics") && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "conversion", {
        send_to: GOOGLE_ADS_CONVERSION_ID,
        value: value,
        currency: "USD",
        transaction_id: transactionId,
      });

      (window as any).gtag("event", "purchase", {
        transaction_id: transactionId,
        value: value,
        currency: "USD",
        items: [
          {
            item_name: "P2V Lens Subscription",
            price: value,
            quantity: 1,
          },
        ],
      });
    }

    // Meta Pixel
    if (hasConsent("marketing") && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Subscribe", {
        value: value,
        currency: "USD",
        predicted_ltv: value * 12,
      });
    }

    // Clean URL so it doesn't re-fire on refresh
    window.history.replaceState({}, "", "/dashboard/lens");
  }, []);

  return null;
}
