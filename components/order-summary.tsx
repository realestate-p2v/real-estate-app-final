// components/order-summary.tsx
// Phase 1A refactor — preserves all working modes (URL, Quick Video, 1080P).
// Removes voiceover (spec Section 4). Swaps legacy branding/custom-branding line.
//
// v1.2 changes:
//   - "Both Orientations" is no longer a $15 paid add-on. Pipeline renders
//     landscape once and crops vertical at zero Minimax cost; both orientations
//     are delivered free on every order. Add-on line item removed; features
//     list now states both orientations as baseline inclusion.
//   - Free-first-video banner copy fixed: trial activates at account creation
//     (or claim), NOT at delivery. Prior copy misrepresented the product.
//   - Free-first-video credit now applies to tier-priced orders (15+ photos)
//     as a flat $49.50 off, clamped to ≥ $0. Mirrors the pricing logic in
//     order-form.tsx so the sidebar and submit math never disagree.

"use client";

import { Check, Phone, Sparkles } from "lucide-react";
import {
  QUICK_VIDEO_RATE,
  FREE_FIRST_VIDEO_MAX_CLIPS,
  FREE_FIRST_VIDEO_MIN_CLIPS,
} from "@/lib/subscription-state";

/**
 * Dollar value of the free-first-video credit when it's applied to a
 * tier-priced order (15+ photos). Kept in sync with the same constant in
 * components/order-form.tsx — if you change one, change the other.
 */
const FREE_FIRST_VIDEO_TIER_CREDIT = 49.5;

interface OrderSummaryProps {
  photoCount: number;
  brandingOption?: string;
  includeEditedPhotos?: boolean;
  resolution?: string;
  orientation?: string;
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
  isUrlMode = false,
  isQuickVideo = false,
  isSubscriber = false,
  hasFreeFirstVideoCredit = false,
}: OrderSummaryProps) {
  // ── Base price (before credit) ────────────────────────────────────────
  const getBaseBeforeCredit = (): {
    price: number;
    originalPrice: number;
    tier: string;
  } => {
    if (isQuickVideo && photoCount > 0) {
      return {
        price: round2(photoCount * QUICK_VIDEO_RATE),
        originalPrice: 0,
        tier: `Quick Video (${photoCount} clips)`,
      };
    }
    if (photoCount === 0) {
      return { price: 0, originalPrice: 0, tier: "Select photos to see price" };
    }
    if (photoCount <= 15) {
      return { price: 79, originalPrice: 119, tier: "Standard (up to 15 photos)" };
    }
    if (photoCount <= 25) {
      return { price: 99, originalPrice: 149, tier: "Professional (16-25 photos)" };
    }
    if (photoCount <= 35) {
      return { price: 109, originalPrice: 179, tier: "Premium (26-35 photos)" };
    }
    return { price: 0, originalPrice: 0, tier: "Contact us" };
  };

  const { price, originalPrice, tier } = getBaseBeforeCredit();

  // ── Free-first-video credit (mirror of order-form.tsx logic) ──────────
  //
  // For credit holders below the 5-photo minimum, we still show the credit
  // as covering the full base price — so the user sees "$0.00 total" and
  // "First video on us" matching, not a confusing $79 with a banner. The
  // 5-photo minimum is enforced at submit time (effectiveMinPhotos in
  // order-form.tsx), not at pricing time.
  const creditValue = (() => {
    if (!hasFreeFirstVideoCredit) return 0;
    if (isQuickVideo) {
      const freeClipsCount = Math.min(photoCount, FREE_FIRST_VIDEO_MAX_CLIPS);
      return Math.min(price, round2(freeClipsCount * QUICK_VIDEO_RATE));
    }
    // Tier-priced branch — covers both 15+ orders AND the under-5-photo
    // "about to become a Quick Video" transition state. Flat $49.50 credit
    // covers the full $79 tier, zeroing the total below the minimum too.
    return Math.min(price, FREE_FIRST_VIDEO_TIER_CREDIT);
  })();

  const chargedPrice = Math.max(0, round2(price - creditValue));
  const freeClips =
    hasFreeFirstVideoCredit && isQuickVideo
      ? Math.min(photoCount, FREE_FIRST_VIDEO_MAX_CLIPS)
      : 0;
  const paidClips =
    isQuickVideo ? Math.max(0, photoCount - freeClips) : 0;

  const showContactUs = photoCount > 35 && !isQuickVideo;

  // ── Add-ons (voiceover removed; orientation always free) ──────────────
  const editedPhotosPrice = includeEditedPhotos
    ? isSubscriber
      ? 0
      : photoCount * 2.99
    : 0;
  const resolutionPrice = resolution === "1080P" ? 10 : 0;
  const urlServicePrice = isUrlMode ? 25 : 0;
  const totalAddons = editedPhotosPrice + resolutionPrice + urlServicePrice;

  const totalPrice = round2(price + totalAddons); // display (pre-credit)
  const chargedTotal = round2(chargedPrice + totalAddons); // post-credit

  const features: string[] = [];
  features.push(resolution === "1080P" ? "1080P Full HD video" : "768P HD video");
  features.push("Landscape + Vertical videos (both included)");
  if (includeEditedPhotos) {
    features.push(
      isSubscriber ? "Professional photo editing (included with Lens)" : "Professional photo editing"
    );
  }
  features.push("Cinematic motion clips");
  features.push("Choice of music");
  features.push("Delivery in minutes");
  if (isQuickVideo) {
    features.push("Paid revisions available");
  } else {
    features.push("1 revision included");
  }

  // Show the banner for anyone with an unused free-first-video credit,
  // regardless of photo count — so the user sees the promise from the first
  // photo (or zero photos) and isn't bait-and-switched by a $79 tier price.
  // Credit line items (discount row, "you pay today") still only appear when
  // the credit actually applies (photoCount >= FREE_FIRST_VIDEO_MIN_CLIPS).
  const bannerVisible = hasFreeFirstVideoCredit;
  const creditActive =
    hasFreeFirstVideoCredit &&
    photoCount >= FREE_FIRST_VIDEO_MIN_CLIPS &&
    creditValue > 0;

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
                : `Up to ${FREE_FIRST_VIDEO_MAX_CLIPS} clips free. Additional clips are $${QUICK_VIDEO_RATE.toFixed(2)} each. Your Lens Pro trial is active.`}
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
          <span className="font-semibold text-foreground text-right text-sm">{tier}</span>
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
              {isQuickVideo ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Quick Video ({photoCount} clips × ${QUICK_VIDEO_RATE})
                    </span>
                    <span className="font-semibold text-foreground">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded-full">
                      LENS SUBSCRIBER
                    </span>
                  </div>
                  {creditActive && (
                    <div className="flex justify-between items-center text-xs text-green-700 pt-1">
                      <span>Free-first-video credit ({freeClips} clip{freeClips !== 1 ? "s" : ""})</span>
                      <span className="font-semibold">− ${creditValue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base price</span>
                    <div className="text-right">
                      {originalPrice > 0 && (
                        <span className="text-muted-foreground line-through text-sm mr-2">
                          ${originalPrice}
                        </span>
                      )}
                      <span className="font-semibold text-foreground">
                        {price > 0 ? `$${price}` : "--"}
                      </span>
                    </div>
                  </div>
                  {creditActive && (
                    <div className="flex justify-between items-center text-xs text-green-700 pt-1">
                      <span>Free-first-video credit</span>
                      <span className="font-semibold">− ${creditValue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add-ons (orientation no longer listed — always free) */}
            {(editedPhotosPrice > 0 ||
              resolutionPrice > 0 ||
              urlServicePrice > 0) && (
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
                {urlServicePrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Listing URL Service</span>
                    <span className="font-semibold text-foreground">+$25</span>
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
                  {isQuickVideo && paidClips > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {paidClips} clip{paidClips !== 1 ? "s" : ""} past the free {FREE_FIRST_VIDEO_MAX_CLIPS}-clip limit
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-3xl font-bold text-foreground">
                      {totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "--"}
                    </span>
                  </div>
                  {!isQuickVideo && price > 0 && originalPrice > price && (
                    <div className="text-right mt-2">
                      <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-semibold">
                        Save ${originalPrice - price}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Video note */}
            {isQuickVideo && !creditActive && (
              <p className="text-xs text-muted-foreground">
                Quick Videos include branding and music. Paid revisions available after delivery.
              </p>
            )}

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
