'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Dashboard "Edit My Site" button.
 *
 * Renders only when the current user has an `agent_websites` row.
 * Links to the editor using the handle, and also exposes a "View Site"
 * link to the public subdomain.
 *
 * Drop into: app/dashboard/page.tsx AND app/dashboard/lens/page.tsx
 * (Anywhere you want the entry point to appear.)
 */
export default function EditMySiteButton() {
  const supabase = createClientComponentClient();
  const [handle, setHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setLoading(false);
          return;
        }

        // RULE 5: never .single() when zero results possible.
        const { data: sites } = await supabase
          .from('agent_websites')
          .select('handle')
          .eq('user_id', user.id)
          .limit(1);

        if (cancelled) return;

        if (sites && sites.length > 0 && sites[0].handle) {
          setHandle(sites[0].handle);
        }
      } catch {
        // silently fail — we hide the button on any error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [supabase]);

  // Hide while loading or when user has no site (per product decision).
  if (loading || !handle) return null;

  const editorUrl = `/editor/${handle}`;
  const siteUrl = `https://${handle}.p2v.homes`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={editorUrl}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit My Site
      </a>

      <a
        href={siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        View My Site
      </a>
    </div>
  );
}
