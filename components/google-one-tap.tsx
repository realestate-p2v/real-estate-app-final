"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleOneTap() {
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      
      // ONLY show for users who are NOT logged in
      if (user) return;

      // 24-hour cooldown after user dismisses the popup
      const dismissed = localStorage.getItem("p2v_onetap_dismissed");
      if (dismissed && (Date.now() - parseInt(dismissed)) < 86400000) return;

      // Generate nonce: Google embeds the SHA-256 hash in the JWT,
      // Supabase needs the raw nonce to hash and compare
      const generateNonce = async () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const raw = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
        // Hash for Google — must match what Supabase will compute from raw
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
        const hashArray = new Uint8Array(hashBuffer);
        const hashed = Array.from(hashArray, (b) => b.toString(16).padStart(2, "0")).join("");
        return { raw, hashed };
      };

      const waitForGoogle = async () => {
        const g = window["google"];
        if (!g || !g.accounts || !g.accounts.id) {
          setTimeout(waitForGoogle, 100);
          return;
        }

        const { raw, hashed } = await generateNonce();

        g.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          nonce: hashed,
          callback: async (response) => {
            console.log("[OneTap] Got credential, signing in...");
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: raw,
            });
            if (error) {
              console.error("[OneTap] Supabase error:", error.message);
            } else {
              console.log("[OneTap] Success! User:", data?.user?.email);
              window.location.href = "/dashboard";
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        g.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            localStorage.setItem("p2v_onetap_dismissed", Date.now().toString());
          }
        });
      };

      // Delay 2 seconds so it doesn't compete with page load
      setTimeout(waitForGoogle, 2000);
    };

    init();
  }, []);

  return null;
}
