// lib/subscription-state.ts
// Centralized subscriber / trial / branding-gate / free-first-video state.
// Used by the order form, order-summary, and any gated tool.
// Reads from lens_usage — same source of truth as the Stripe webhook.

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
  /**
   * Quick Video ($4.95/clip, 5–14 clips) unlocked:
   * subscriber OR active trial OR admin.
   * Same rule as branding — subscriber perks travel together.
   */
  isQuickVideoEligible: boolean;
  /**
   * User has an unused free-first-video credit from the promo funnel.
   * When true, checkout applies a $0 adjustment to cover up to 10 clips.
   * Clips 11+ are charged at the Quick Video rate.
   */
  hasFreeFirstVideoCredit: boolean;
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
  isQuickVideoEligible: false,
  hasFreeFirstVideoCredit: false,
  subscriptionTier: null,
  trialExpiresAt: null,
  userId: null,
  userEmail: null,
};

/**
 * Maximum number of clips covered by the free-first-video promo.
 * Clips past this threshold are charged at QUICK_VIDEO_RATE.
 */
export const FREE_FIRST_VIDEO_MAX_CLIPS = 10;

/**
 * Minimum number of clips required to place a free-first-video order.
 */
export const FREE_FIRST_VIDEO_MIN_CLIPS = 5;

/**
 * Quick Video per-clip rate (keep in sync with order-summary + order-form).
 */
export const QUICK_VIDEO_RATE = 4.95;

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
        "is_subscriber, subscription_tier, trial_activated_at, trial_expires_at, free_first_video_available, free_first_video_used"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const now = Date.now();
    const trialExpiresAt = data?.trial_expires_at || null;
    const isInActiveTrial =
      !!trialExpiresAt && new Date(trialExpiresAt).getTime() > now;

    const isSubscriber = isAdmin || !!data?.is_subscriber;
    const isBranded = isAdmin || isSubscriber || isInActiveTrial;
    const isQuickVideoEligible = isBranded; // same rule

    const hasFreeFirstVideoCredit =
      !!data?.free_first_video_available && !data?.free_first_video_used;

    return {
      isLoggedIn: true,
      isAdmin,
      isSubscriber,
      isInActiveTrial,
      isBranded,
      isQuickVideoEligible,
      hasFreeFirstVideoCredit,
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
        "is_subscriber, subscription_tier, trial_activated_at, trial_expires_at, free_first_video_available, free_first_video_used"
      )
      .eq("user_id", userId)
      .maybeSingle();

    const now = Date.now();
    const trialExpiresAt = data?.trial_expires_at || null;
    const isInActiveTrial =
      !!trialExpiresAt && new Date(trialExpiresAt).getTime() > now;

    const isSubscriber = isAdmin || !!data?.is_subscriber;
    const isBranded = isAdmin || isSubscriber || isInActiveTrial;
    const isQuickVideoEligible = isBranded;

    const hasFreeFirstVideoCredit =
      !!data?.free_first_video_available && !data?.free_first_video_used;

    return {
      isLoggedIn: true,
      isAdmin,
      isSubscriber,
      isInActiveTrial,
      isBranded,
      isQuickVideoEligible,
      hasFreeFirstVideoCredit,
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

/**
 * Compute the charge for a Quick Video order, accounting for the free-first-video
 * credit when applicable. Returns both the display price (what the user sees
 * as they upload) and the charged price (what gets billed at checkout).
 *
 * Pricing rules:
 *   - Without credit: photoCount × QUICK_VIDEO_RATE
 *   - With credit:    max(0, photoCount - FREE_FIRST_VIDEO_MAX_CLIPS) × QUICK_VIDEO_RATE
 */
export function computeQuickVideoPricing(
  photoCount: number,
  hasFreeFirstVideoCredit: boolean
): { displayPrice: number; chargedPrice: number; freeClips: number; paidClips: number } {
  const displayPrice = round2(photoCount * QUICK_VIDEO_RATE);

  if (!hasFreeFirstVideoCredit || photoCount === 0) {
    return {
      displayPrice,
      chargedPrice: displayPrice,
      freeClips: 0,
      paidClips: photoCount,
    };
  }

  const freeClips = Math.min(photoCount, FREE_FIRST_VIDEO_MAX_CLIPS);
  const paidClips = Math.max(0, photoCount - FREE_FIRST_VIDEO_MAX_CLIPS);
  const chargedPrice = round2(paidClips * QUICK_VIDEO_RATE);

  return { displayPrice, chargedPrice, freeClips, paidClips };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
