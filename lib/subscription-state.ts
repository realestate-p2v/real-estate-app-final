// lib/subscription-state.ts
// Centralized subscriber / trial / branding-gate state check.
// Used by the order form, order-summary, and any gated tool.
// Reads from lens_usage — same source of truth as the existing webhook
// and the current inline checks inside order-form.tsx.

import type { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

export interface SubscriptionState {
  /** User is authenticated */
  isLoggedIn: boolean;
  /** User is an admin (always treated as fully branded + subscribed) */
  isAdmin: boolean;
  /** Active paid Lens or Lens Pro subscription */
  isSubscriber: boolean;
  /** Inside the 10-day post-first-video trial window */
  isInActiveTrial: boolean;
  /**
   * Branding is unlocked: subscriber OR active trial OR admin.
   * This is the single flag the order form + summary read.
   */
  isBranded: boolean;
  /** Subscription tier when isSubscriber is true: 'tools' | 'pro' | null */
  subscriptionTier: string | null;
  /** Trial expiry timestamp (for countdown UI) */
  trialExpiresAt: string | null;
  /** User ID (null when not logged in) */
  userId: string | null;
  /** User email (null when not logged in) */
  userEmail: string | null;
}

export const UNAUTHENTICATED_STATE: SubscriptionState = {
  isLoggedIn: false,
  isAdmin: false,
  isSubscriber: false,
  isInActiveTrial: false,
  isBranded: false,
  subscriptionTier: null,
  trialExpiresAt: null,
  userId: null,
  userEmail: null,
};

/**
 * Fetch subscription state for the current authenticated user.
 * Safe to call from client components — uses the browser Supabase client.
 * Returns UNAUTHENTICATED_STATE for any failure, never throws.
 */
export async function getSubscriptionState(
  supabase: SupabaseClient
): Promise<SubscriptionState> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return UNAUTHENTICATED_STATE;

    const isAdmin = ADMIN_EMAILS.includes(user.email || "");

    const { data } = await supabase
      .from("lens_usage")
      .select(
        "is_subscriber, subscription_tier, trial_activated_at, trial_expires_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const now = Date.now();
    const trialExpiresAt = data?.trial_expires_at || null;
    const isInActiveTrial =
      !!trialExpiresAt && new Date(trialExpiresAt).getTime() > now;

    const isSubscriber = isAdmin || !!data?.is_subscriber;
    const isBranded = isAdmin || isSubscriber || isInActiveTrial;

    return {
      isLoggedIn: true,
      isAdmin,
      isSubscriber,
      isInActiveTrial,
      isBranded,
      subscriptionTier: data?.subscription_tier || (isAdmin ? "pro" : null),
      trialExpiresAt,
      userId: user.id,
      userEmail: user.email || null,
    };
  } catch (err) {
    console.error("[subscription-state] fetch failed:", err);
    return UNAUTHENTICATED_STATE;
  }
}

/**
 * Server-side variant. Pass a server Supabase client
 * (e.g. from @supabase/ssr or the service-role admin client).
 * Same contract as getSubscriptionState.
 */
export async function getSubscriptionStateServer(
  supabase: SupabaseClient,
  userId: string | null
): Promise<SubscriptionState> {
  try {
    if (!userId) return UNAUTHENTICATED_STATE;

    const { data: userRes } = await supabase.auth.admin.getUserById(userId);
    const email = userRes?.user?.email || "";
    const isAdmin = ADMIN_EMAILS.includes(email);

    const { data } = await supabase
      .from("lens_usage")
      .select(
        "is_subscriber, subscription_tier, trial_activated_at, trial_expires_at"
      )
      .eq("user_id", userId)
      .maybeSingle();

    const now = Date.now();
    const trialExpiresAt = data?.trial_expires_at || null;
    const isInActiveTrial =
      !!trialExpiresAt && new Date(trialExpiresAt).getTime() > now;

    const isSubscriber = isAdmin || !!data?.is_subscriber;
    const isBranded = isAdmin || isSubscriber || isInActiveTrial;

    return {
      isLoggedIn: true,
      isAdmin,
      isSubscriber,
      isInActiveTrial,
      isBranded,
      subscriptionTier: data?.subscription_tier || (isAdmin ? "pro" : null),
      trialExpiresAt,
      userId,
      userEmail: email || null,
    };
  } catch (err) {
    console.error("[subscription-state] server fetch failed:", err);
    return UNAUTHENTICATED_STATE;
  }
}
