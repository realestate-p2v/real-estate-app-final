// components/EditSiteButton.tsx
// Repo: realestatephoto2video.com (main app)
//
// PURPOSE: Drop-in component for the dashboard page.
// Looks up the agent's handle from agent_websites and
// renders a button linking to their p2v.homes editor.
//
// USAGE: Import and place in app/dashboard/page.tsx:
//   import EditSiteButton from "@/components/EditSiteButton";
//   <EditSiteButton userId={user.id} />

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface EditSiteButtonProps {
  userId: string;
}

export default function EditSiteButton({ userId }: EditSiteButtonProps) {
  const [handle, setHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function lookupHandle() {
      const { data, error } = await supabase
        .from("agent_websites")
        .select("handle")
        .eq("user_id", userId)
        .limit(1);

      if (!error && data && data.length > 0) {
        setHandle(data[0].handle);
      }
      setLoading(false);
    }
    lookupHandle();
  }, [userId]);

  // Don't render anything if no site exists
  if (loading || !handle) return null;

  return (
    <a
      href={`https://${handle}.p2v.homes/editor`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.625rem 1.25rem",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        borderRadius: "0.5rem",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "background-color 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M11.5 1.5L14.5 4.5M1 15L1.94 11.18C1.97 11.07 2.03 10.97 2.1 10.9L10.5 2.5L13.5 5.5L5.1 13.9C5.03 13.97 4.93 14.03 4.82 14.06L1 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Edit My Site
    </a>
  );
}
