"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleOneTap() {
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // ONLY show for users who are NOT logged in
      if (user) return;

      // 24-hour cooldown after user dismisses the popup
      const dismissed = localStorage.getItem("p2v_onetap_dismissed");
      if (dismissed && (Date.now() - parseInt(dismissed)) < 86400000) return;

      const waitForGoogle = () => {
        const google = (window as any).google;
        if (!google?.accounts?.id) {
          setTimeout(waitForGoogle, 100);
          return;
        }

        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: any) => {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });
            if (!error) window.location.reload();
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        google.accounts.id.prompt((notification: any) => {
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
