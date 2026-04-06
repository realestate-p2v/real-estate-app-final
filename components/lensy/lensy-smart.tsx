"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import LensySales from "./lensy-sales";
import LensySupport from "./lensy-support";

// ============================================================
// LENSY SMART
// Auto-detects auth + subscription status and renders:
//   - LensySupport (sky blue) for subscribers
//   - LensySales (orange) for non-subscribers / guests
//
// Drop this on any page: <LensySmart />
// ============================================================

interface LensySmartProps {
  position?: "bottom-right" | "bottom-left";
}

export default function LensySmart({ position = "bottom-right" }: LensySmartProps) {
  const [status, setStatus] = useState<"loading" | "subscriber" | "guest">("loading");

  useEffect(() => {
    async function checkSubscription() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setStatus("guest");
          return;
        }

        // Check if subscriber or admin
        const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
        if (ADMIN_EMAILS.includes(user.email || "")) {
          setStatus("subscriber");
          return;
        }

        const { data: lensUsage } = await supabase
          .from("lens_usage")
          .select("is_subscriber")
          .eq("user_id", user.id)
          .single();

        if (lensUsage?.is_subscriber) {
          setStatus("subscriber");
        } else {
          setStatus("guest");
        }
      } catch {
        setStatus("guest");
      }
    }

    checkSubscription();
  }, []);

  // Don't render anything while checking (avoids flash)
  if (status === "loading") return null;

  if (status === "subscriber") {
    return <LensySupport position={position} />;
  }

  return <LensySales position={position} />;
}
