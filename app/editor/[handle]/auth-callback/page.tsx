// app/editor/[handle]/auth-callback/page.tsx
// Repo: p2v.homes app
//
// PURPOSE: Receives access_token + refresh_token as query params
// from the main app's OAuth callback, calls setSession() to
// establish a Supabase session on the p2v.homes domain, then
// redirects to the editor.
//
// IMPORTANT: This is a client component because setSession()
// needs to set cookies in the browser context.

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams, useParams, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function establishSession() {
      // Read tokens from query params (NOT from URL hash)
      const access_token = searchParams.get("access_token");
      const refresh_token = searchParams.get("refresh_token");

      if (!access_token || !refresh_token) {
        setStatus("error");
        setErrorMsg("Missing authentication tokens. Please try logging in again.");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error("setSession error:", error.message);
        setStatus("error");
        setErrorMsg(`Authentication failed: ${error.message}`);
        return;
      }

      // Session established — redirect to the editor
      const handle = params.handle as string;
      router.replace(`/editor`);
    }

    establishSession();
  }, [searchParams, params.handle, router]);

  if (status === "error") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p style={{ color: "#ef4444", fontSize: "1rem", marginBottom: "1rem" }}>
            {errorMsg}
          </p>
          <a
            href={`https://${params.handle}.p2v.homes/editor`}
            style={{
              color: "#3b82f6",
              textDecoration: "underline",
              fontSize: "0.875rem",
            }}
          >
            ← Back to editor
          </a>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
        Signing you in…
      </p>
    </div>
  );
}
