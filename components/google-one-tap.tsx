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

      // Generate a random nonce and its SHA-256 hash
      // Google gets the hash, Supabase gets the raw nonce
      const generateNonce = async () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const raw = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
        const encoder = new TextEncoder();
        const data = encoder.encode(raw);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashed = btoa(String.fromCharCode(...hashArray))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
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
              console.error("[OneTap] Supabase signInWithIdToken error:", error.message);
              console.error("[OneTap] Full error:", JSON.stringify(error));
            } else {
              console.log("[OneTap] Success! User:", data?.user?.email);
              window.location.reload();
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

  // This component renders nothing — Google handles the UI
  return null;
}
