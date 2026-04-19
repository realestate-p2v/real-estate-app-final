// lib/lens-usage-profile.ts
// Client-side helpers for persisting Your Info profile fields to the
// `lens_usage` table. Mirrors the pattern in lib/brand-color-extraction.ts:
// authenticated user updates their own row directly via the Supabase client
// (RLS enforces ownership).

import type { SupabaseClient } from "@supabase/supabase-js";

export type LensUsageProfileFields = {
  saved_agent_name?: string | null;
  saved_phone?: string | null;
  saved_email?: string | null;
  saved_company?: string | null;
  saved_headshot_url?: string | null;
  saved_logo_url?: string | null;
};

/**
 * Upserts profile fields onto the current user's lens_usage row.
 *
 * - Only writes keys that are explicitly present in the payload (undefined
 *   keys are stripped), so partial saves never clobber existing data.
 * - Empty strings are normalized to null so "cleared field" is distinct from
 *   "field not touched."
 * - Fire-and-forget safe: returns { ok: boolean, error?: string } instead of
 *   throwing, so callers can await without a try/catch and page UX is not
 *   blocked if the save fails.
 */
export async function saveProfileFields(
  supabase: SupabaseClient,
  userId: string,
  fields: LensUsageProfileFields
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) return { ok: false, error: "no user id" };

  // Build a clean update payload: drop undefined, coerce "" → null.
  const payload: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    payload[key] = typeof value === "string" && value.trim() === "" ? null : value;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: true }; // nothing to save, not an error
  }

  const { error } = await supabase
    .from("lens_usage")
    .update(payload)
    .eq("user_id", userId);

  if (error) {
    console.error("[lens-usage-profile] save failed:", error.message, payload);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
