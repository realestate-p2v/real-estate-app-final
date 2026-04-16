// ============================================================
// FILE: app/site/[handle]/edit-site-button.tsx
// ============================================================
"use client";

import { useEffect, useState } from "react";

export default function EditSiteButton({ siteUserId }: { siteUserId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    // Only on p2v.homes subdomains
    if (!host.endsWith(".p2v.homes") || host === "p2v.homes" || host === "www.p2v.homes") return;

    // Check if the logged-in user owns this site
    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === siteUserId) {
          setShow(true);
        }
      } catch {
        // Not logged in or error — don't show
      }
    })();
  }, [siteUserId]);

  if (!show) return null;

  return (
    <a
      href="/editor"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 13,
        fontWeight: 600,
        color: "#fff",
        textDecoration: "none",
        padding: "10px 18px",
        borderRadius: 12,
        backgroundColor: "#4f46e5",
        boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4), 0 1px 3px rgba(0,0,0,0.1)",
        zIndex: 9999,
        transition: "transform 0.15s, box-shadow 0.15s",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(79, 70, 229, 0.5), 0 2px 4px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(79, 70, 229, 0.4), 0 1px 3px rgba(0,0,0,0.1)";
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Edit Site
    </a>
  );
}
