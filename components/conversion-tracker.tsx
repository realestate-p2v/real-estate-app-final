"use client";

import { useEffect, useRef } from "react";
import { hasConsent } from "@/components/cookie-consent";

// TODO: Replace with actual Google Ads conversion ID from Matt's Google Ads account
const GOOGLE_ADS_CONVERSION_ID = "AW-REPLACE_ME/REPLACE_ME";

interface ConversionTrackerProps {
  orderId: string | null;
  totalPrice: number | null;
  type: "video" | "lens";
}

export function ConversionTracker({ orderId, totalPrice, type }: ConversionTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    // Only fire once per mount
    if (firedRef.current) return;
    if (!orderId) return;
    firedRef.current = true;

    const value = totalPrice || (type === "lens" ? 27.95 : 79);
    const itemName = type === "lens" ? "P2V Lens Subscription" : "Listing Video";

    // Google Ads + GA4 (requires analytics consent)
    if (hasConsent("analytics") && typeof (window as any).gtag === "function") {
      // Google Ads conversion
      (window as any).gtag("event", "conversion", {
        send_to: GOOGLE_ADS_CONVERSION_ID,
        value: value,
        currency: "USD",
        transaction_id: orderId,
      });

      // GA4 purchase event
      (window as any).gtag("event", "purchase", {
        transaction_id: orderId,
        value: value,
        currency: "USD",
        items: [
          {
            item_name: itemName,
            price: value,
            quantity: 1,
          },
        ],
      });
    }

    // Meta Pixel (requires marketing consent)
    if (hasConsent("marketing") && typeof (window as any).fbq === "function") {
      if (type === "lens") {
        (window as any).fbq("track", "Subscribe", {
          value: value,
          currency: "USD",
          predicted_ltv: value * 12,
        });
      } else {
        (window as any).fbq("track", "Purchase", {
          value: value,
          currency: "USD",
          content_type: "product",
          content_ids: [orderId],
        });
      }
    }
  }, [orderId, totalPrice, type]);

  return null;
}
