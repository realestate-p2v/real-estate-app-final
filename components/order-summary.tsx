// components/order-summary.tsx
// Phase 1A refactor — preserves all working modes (URL, Quick Video, 1080P).
// Removes voiceover (spec Section 4). Swaps legacy branding/custom-branding line.
//
// v2.0 changes — flat per-clip pricing:
//   - All videos priced at $4/clip (PER_CLIP_PRICE). Standard "from $60"
//     marketing anchor at 15 clips. Replaces the old $79/$99/$109 tiers.
//   - Removed fake-discount $119/$149/$179 strikethroughs.
//   - URL mode adds a flat $25 curation fee on top of per-clip math
//     (manual photo curation by Matt).
//   - Single "Listing Video" label — no more Standard/Professional/Premium.
//
// v1.3 (retained):
//   - "Add a vertical version" is a $15 paid add-on. Default orders deliver
//     both orientations (landscape rendered at Minimax; vertical cropped by
//     ffmpeg). Paying $15 unlocks a separately-framed Minimax render.
//
// v1.2 (retained):
//   - Free-first-video credit applies as a flat dollar amount equal to
//     FREE_FIRST_VIDEO_MAX_CLIPS × PER_CLIP_PRICE. Mirrors order-form.tsx.
//   - Credit-eligible users see Total = $0 from photo 1 through
//     FREE_FIRST_VIDEO_MAX_CLIPS, then per-clip charge for 11+.

"use client";

import { Check, Phone, Sparkles } from "lucide-react";
import {
  PER_CLIP_PRICE,
  STANDARD_VIDEO_PRICE,
  URL_CURATION_FEE,
  QUICK_VIDEO_RATE,
  FREE_FIRST_VIDEO_MAX_CLIPS,
  FREE_FIRST_VIDEO_MIN_CLIPS,
} from "@/lib/subscription-state";

/**
 * Vertical add-on price. Kept in sync with the same constant in
 * components/order-form.tsx — if you change one, change the other.
 */
const VERTICAL_ADDON_PRICE = 15;

interface OrderSummaryProps {
  photoCount: number;
  brandingOption?: string;
  includeEditedPhotos?: boolean;
  resolution?: string;
  orientation?: string;
  /** Paid upgrade: separately-framed vertical render at Minimax (+$15). */
  verticalAddon?: boolean;
  isUrlMode?: boolean;
  isQuickVideo?: boolean;
  /** Subscriber state drives photo-editing pricing (free vs $2.99/photo). */
  isSubscriber?: boolean;
  /** Active free-first-video credit — landing-page claim, unused. */
  hasFreeFirstVideoCredit?: boolean;
}

export function OrderSummary({
  photoCount,
  brandingOption = "unbranded",
  includeEditedPhotos = false,
  resolution = "768P",
  // `orientation` kept in props for back-compat; no longer affects pricing.
  orientation = "both",
  verticalAddon = false,
  isUrlMode = false,
  isQuickVideo = false,
  isSubscriber = false,
  hasFreeFirstVideoCredit = false,
}: OrderSummaryProps) {
  // ── Base price (before credit) ────────────────────────────────────────
  // Flat per-clip pricing for all videos. URL mode is the same per-clip
  // rate but adds a $25 curation fee as a separate add-on line.
  const getBaseBeforeCredit = (): {
    price: number;
    label: string;
  } => {
    if (photoCount === 0) {
      return { price: 0, label: "Select photos to see price" };
    }
    return {
      price: round2(photoCount * PER_CLIP_PRICE),
      label: `Listing Video (${photoCount} clips × $${PER_CLIP_PRICE})`,
    };
  };

  const base = getBaseBeforeCredit();
  const { price } = base;

  // Tier label swap: when the credit covers the entire base, show
  // "Your Free Video" instead of the package name.
  const label =
    hasFreeFirstVideoCredit && photoCount > 0 && photoCount <= FREE_FIRST_VIDEO_MAX_CLIPS
      ? "Your Free Video"
      : base.label;

  // ── Free-first-video credit ───────────────────────────────────────────
  //
  // Credit covers up to FREE_FIRST_VIDEO_MAX_CLIPS clips at PER_CLIP_PRICE.
  // Past that, additional clips are charged at the same per-clip rate.
  // The credit value is a flat dollar amount, never exceeds the base.
  const creditValue = (() => {
    if (!hasFreeFirstVideoCredit || photoCount === 0) return 0;
    const maxCredit = round2(FREE_FIRST_VIDEO_MAX_CLIPS * PER_CLIP_PRICE);
    return Math.min(price, maxCredit);
  })();

  const chargedPrice = Math.max(0, round2(price - creditValue));
  const freeClips = hasFreeFirstVideoCredit
    ? Math.min(photoCount, FREE_FIRST_VIDEO_MAX_CLIPS)
    : 0;
  const paidClips = hasFreeFirstVideoCredit
    ? Math.max(0, photoCount - FREE_FIRST_VIDEO_MAX_CLIPS)
    : 0;

  // 35-photo cap removed — pricing now scales linearly. The order form
  // still enforces an upper bound via NON_SUBSCRIBER_MIN_PHOTOS / hard cap.
  const showContactUs = false;

  // ── Add-ons (URL curation fee, photo editing, 1080P, vertical) ───────
  const editedPhotosPrice = includeEditedPhotos
    ? isSubscriber
      ? 0
      : photoCount * 2.99
    : 0;
  const resolutionPrice = resolution === "1080P" ? 10 : 0;
  const urlServicePrice = isUrlMode ? URL_CURATION_FEE : 0;
  const verticalAddonPrice = verticalAddon ? VERTICAL_ADDON_PRICE : 0;
  const totalAddons =
    editedPhotosPrice + resolutionPrice + urlServicePrice + verticalAddonPrice;

  const totalPrice = round2(price + totalAddons); // display (pre-credit)
  const chargedTotal = round2(chargedPrice + totalAddons); // post-credit

  const features: string[] = [];
  features.push(resolution === "1080P" ? "1080P Full HD video" : "768P HD video");
  features.push(
    verticalAddon
      ? "Landscape + separately-optimized Vertical (upgraded)"
      : "Landscape + Vertical (smart-cropped) videos"
  );
  if (includeEditedPhotos) {
    features.push(
      isSubscriber ? "Professional photo editing (included with Lens)" : "Professional photo editing"
    );
  }
  features.push("Cinematic motion clips");
  features.push("Choice of music");
  features.push("Delivery in minutes");
  features.push("1 free revision");
  features.push("Clips unlock the P2V Lens marketing suite");

  // Banner is visible for anyone with an unused free-first-video credit.
  // `creditActive` drives the "You pay today" display — it kicks in any
  // time the credit has nonzero value, so the sidebar shows $0 all the way
  // from photo 1 and stays coherent with the "First video on us" banner.
  const bannerVisible = hasFreeFirstVideoCredit;
  const creditActive = hasFreeFirstVideoCredit && creditValue > 0;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 sticky top-24">
      <h3 className="text-xl font-bold text-foreground mb-4">Order Summary</h3>

      {/* Free-first-video banner */}
      {bannerVisible && (
        <div className="mb-4 rounded-xl border border-green-300 bg-green-50 p-3 flex items-start gap-2">
          <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">First video on us</p>
            <p className="text-xs text-green-700 mt-0.5">
              {photoCount < FREE_FIRST_VIDEO_MIN_CLIPS
                ? `Upload at least ${FREE_FIRST_VIDEO_MIN_CLIPS} photos to claim your free video (up to ${FREE_FIRST_VIDEO_MAX_CLIPS} clips free). Your Lens Pro trial is active.`
                : `Up to ${FREE_FIRST_VIDEO_MAX_CLIPS} clips free. Additional clips are $${PER_CLIP_PRICE} each. Your Lens Pro trial is active.`}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <span className="text-muted-foreground">Photos</span>
          <span className="font-semibold text-foreground">{photoCount}</span>
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-border">
          <span className="text-muted-foreground">Package</span>
          <span className="font-semibold text-foreground text-right text-sm">{label}</span>
        </div>

        {showContactUs ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-3">
              For orders with more than 35 photos, please contact us:
            </p>
            <a
              href="tel:+18455366954"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-lg"
            >
              <Phone className="h-5 w-5" />
              {"1 (845) 536-6954"}
            </a>
          </div>
        ) : (
          <>
            {/* Base Price */}
            <div className="py-4 border-b border-border">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {photoCount > 0
                      ? `${photoCount} clip${photoCount !== 1 ? "s" : ""} × $${PER_CLIP_PRICE}`
                      : "Base price"}
                  </span>
                  <span className="font-semibold text-foreground">
                    {price > 0 ? `$${price.toFixed(2)}` : "--"}
                  </span>
                </div>
                {creditActive && (
                  <div className="flex justify-between items-center text-xs text-green-700 pt-1">
                    <span>
                      Free-first-video credit ({freeClips} clip{freeClips !== 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold">− ${creditValue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add-ons */}
            {(editedPhotosPrice > 0 ||
              resolutionPrice > 0 ||
              urlServicePrice > 0 ||
              verticalAddonPrice > 0 ||
              (includeEditedPhotos && isSubscriber)) && (
              <div className="py-4 border-b border-border space-y-3">
                <span className="text-sm font-medium text-muted-foreground">Add-ons:</span>
                {editedPhotosPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">
                      Photo Editing ({photoCount} × $2.99)
                    </span>
                    <span className="font-semibold text-foreground">
                      +${editedPhotosPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                {includeEditedPhotos && isSubscriber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Photo Editing</span>
                    <span className="font-semibold text-green-600">Included</span>
                  </div>
                )}
                {resolutionPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">1080P HD Upgrade</span>
                    <span className="font-semibold text-foreground">+$10</span>
                  </div>
                )}
                {verticalAddonPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Vertical Version</span>
                    <span className="font-semibold text-foreground">
                      +${VERTICAL_ADDON_PRICE}
                    </span>
                  </div>
                )}
                {urlServicePrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">URL Curation Service</span>
                    <span className="font-semibold text-foreground">+${URL_CURATION_FEE}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="py-4">
              {creditActive ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground line-through">Subtotal</span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-semibold text-foreground">You pay today</span>
                    <span className="text-3xl font-bold text-green-600">
                      ${chargedTotal.toFixed(2)}
                    </span>
                  </div>
                  {paidClips > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {paidClips} clip{paidClips !== 1 ? "s" : ""} past the free {FREE_FIRST_VIDEO_MAX_CLIPS}-clip limit at ${PER_CLIP_PRICE} each
                    </p>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-3xl font-bold text-foreground">
                    {totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "--"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground">Includes:</p>
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
