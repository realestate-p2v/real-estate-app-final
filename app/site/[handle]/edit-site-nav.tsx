// ============================================================
// FILE: app/site/[handle]/edit-site-nav.tsx
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function EditSiteNav() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <a
      href="/editor"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        fontWeight: 600,
        color: "#6366f1",
        textDecoration: "none",
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid #e0e7ff",
        backgroundColor: "#f5f3ff",
        transition: "background-color 0.2s",
        marginLeft: 4,
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
