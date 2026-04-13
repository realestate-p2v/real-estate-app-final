"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// This page lives at app/editor/[handle]/auth-callback/page.tsx
// Supabase OAuth / magic link redirects here with tokens in the URL hash:
//   #access_token=...&refresh_token=...&type=...
// We call setSession() to store the session cookie on p2v.homes,
// then redirect to the editor.

export default function AuthCallback({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  useEffect(() => {
    (async () => {
      const { handle } = await params;

      // Parse tokens from the URL hash
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          // Session failed — send back to login
          window.location.href = `https://realestatephoto2video.com/login?redirect=${encodeURIComponent(
            `https://${handle}.p2v.homes/editor/auth-callback`
          )}&error=session_failed`;
          return;
        }
      }

      // Session set (or no tokens — already logged in) → go to editor
      window.location.href = `https://${handle}.p2v.homes/editor`;
    })();
  }, [params]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        background: "#f8fafc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #e2e8f0",
          borderTop: "3px solid #334155",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
        Logging you in…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
