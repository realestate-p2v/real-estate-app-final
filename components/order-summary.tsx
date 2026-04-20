// components/order-summary.tsx
// Phase 1A refactor — preserves all working modes (URL, Quick Video, 1080P).
// Removes voiceover (spec Section 4). Swaps legacy branding/custom-branding line.
// Adds free-first-video credit handling (zeroes the first FREE_FIRST_VIDEO_MAX_CLIPS
// Quick Video clips). Removes retired "48-hour delivery" language (master doc Part 1).
//
// v1.2 changes:
//   - "Both Orientations" is no longer a $15 paid add-on. Pipeline renders
//     landscape once and crops vertical at zero Minimax cost; both orientations
//     are delivered free on every order. Add-on line item removed; features
//     list now states both orientations as baseline inclusion.
//   - Free-first-video banner copy fixed: trial activates at account creation
//     (or claim), NOT at delivery. Prior copy misrepresented the product.

"use client";

import { Check, Phone, Sparkles } from "lucide-react";
import {
  QUICK_VIDEO_RATE,
  FREE_FIRST_VIDEO_MAX_CLIPS,
  computeQuickVideoPricing,
} from "@/lib/subscription-state";

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
  /** Active free-first-video credit — zeros the first N Quick Video clips. */
  hasFreeFirstVideoCredit?: boolean;
}

export function OrderSummary({
  photoCount,
  brandingOption = "unbranded",
  includeEditedPhotos = false,
  resolution = "768P",
  // `orientation` is kept in the props for back-compat with callers that still
  // pass it, but it no longer affects pricing. Both orientations are always
  // delivered free.
  orientation = "both",
  isUrlMode = false,
  isQuickVideo = false,
  isSubscriber = false,
  hasFreeFirstVideoCredit = false,
}: OrderSummaryProps) {
  const getPricing = () => {
    if (isQuickVideo && photoCount > 0) {
      const qv = computeQuickVideoPricing(photoCount, hasFreeFirstVideoCredit);
      return {
        price: qv.displayPrice,
        chargedPrice: qv.chargedPrice,
        originalPrice: 0,
        tier: `Quick Video (${photoCount} clips)`,
        freeClips: qv.freeClips,
        paidClips: qv.paidClips,
      };
    }
    if (photoCount === 0) {
      return {
        price: 0,
        chargedPrice: 0,
        originalPrice: 0,
        tier: "Select photos to see price",
        freeClips: 0,
        paidClips: 0,
      };
    }
    if (photoCount <= 15) {
      return {
        price: 79,
        chargedPrice: 79,
        originalPrice: 119,
        tier: "Standard (up to 15 photos)",
        freeClips: 0,
        paidClips: photoCount,
      };
    }
    if (photoCount <= 25) {
      return {
        price: 99,
        chargedPrice: 99,
        originalPrice: 149,
        tier: "Professional (16-25 photos)",
        freeClips: 0,
        paidClips: photoCount,
      };
    }
    if (photoCount <= 35) {
      return {
        price: 109,
        chargedPrice: 109,
        originalPrice: 179,
        tier: "Premium (26-35 photos)",
        freeClips: 0,
        paidClips: photoCount,
      };
    }
    return {
      price: 0,
      chargedPrice: 0,
      originalPrice: 0,
      tier: "Contact us",
      freeClips: 0,
      paidClips: 0,
    };
  };

  const { price, chargedPrice, originalPrice, tier, freeClips, paidClips } = getPricing();
  const showContactUs = photoCount > 35 && !isQuickVideo;

  // ── Add-on pricing (voiceover removed; orientation retired as a paid
  //    add-on — both orientations are delivered on every order for free) ──
  const editedPhotosPrice = includeEditedPhotos
    ? isSubscriber
      ? 0 // free for subscribers + active-trial users
      : photoCount * 2.99
    : 0;
  const resolutionPrice = resolution === "1080P" ? 10 : 0;
  const urlServicePrice = isUrlMode ? 25 : 0;
  const totalAddons = editedPhotosPrice + resolutionPrice + urlServicePrice;

  // Display total — what user sees as they build the order (before free credit).
  const totalPrice = price + totalAddons;
  // Charged total — what Stripe bills (after free credit; add-ons still chargeable per Matt).
  const chargedTotal = chargedPrice + totalAddons;

  const features: string[] = [];
  features.push(resolution === "1080P" ? "1080P Full HD video" : "768P HD video");
  // Both orientations are always delivered — not a toggleable add-on.
  features.push("Landscape + Vertical videos (both included)");
  if (includeEditedPhotos) {
    features.push(
      isSubscriber ? "Professional photo editing (included with Lens)" : "Professional photo editing"
    );
  }
  features.push("Cinematic motion clips");
  features.push("Choice of music");
  features.push("Delivery in minutes"); // replaces "48-hour delivery"
  if (isQuickVideo) {
    features.push("Paid revisions available");
  } else {
    features.push("1 revision included");
  }

  const freeVideoActive = hasFreeFirstVideoCredit && isQuickVideo && photoCount > 0;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 sticky top-24">
      <h3 className="text-xl font-bold text-foreground mb-4">Order Summary</h3>

      {/* ── Free-first-video banner ── */}
      {freeVideoActive && (
        <div className="mb-4 rounded-xl border border-green-300 bg-green-50 p-3 flex items-start gap-2">
          <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">First video on us</p>
            <p className="text-xs text-green-700 mt-0.5">
              Up to {FREE_FIRST_VIDEO_MAX_CLIPS} clips free. Additional clips are $
              {QUICK_VIDEO_RATE.toFixed(2)} each. Your Lens Pro trial is active.
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
                  {freeVideoActive && (
                    <div className="flex justify-between items-center text-xs text-green-700 pt-1">
                      <span>Free-first-video credit ({freeClips} clip{freeClips !== 1 ? "s" : ""})</span>
                      <span className="font-semibold">− ${(price - chargedPrice).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
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
              {freeVideoActive ? (
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
            {isQuickVideo && !freeVideoActive && (
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
