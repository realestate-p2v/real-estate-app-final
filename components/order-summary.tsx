"use client";

import { Check, Phone } from "lucide-react";

interface OrderSummaryProps {
  photoCount: number;
  brandingOption?: string;
  voiceoverOption?: string;
  includeEditedPhotos?: boolean;
}

export function OrderSummary({
  photoCount,
  brandingOption = "unbranded",
  voiceoverOption = "none",
  includeEditedPhotos = false,
}: OrderSummaryProps) {
  const getPricing = () => {
    if (photoCount === 0) {
      return { price: 0, originalPrice: 0, tier: "Select photos to see price" };
    }
    if (photoCount === 1) {
      return { price: 1, originalPrice: 1, tier: "Test Product (1 photo)" };
    }
    if (photoCount <= 12) {
      return { price: 99, originalPrice: 149, tier: "Standard (up to 12 photos)" };
    }
    if (photoCount <= 25) {
      return { price: 149, originalPrice: 199, tier: "Premium (13-25 photos)" };
    }
    if (photoCount <= 35) {
      return { price: 199, originalPrice: 249, tier: "Professional (26-35 photos)" };
    }
    return { price: 0, originalPrice: 0, tier: "Contact us" };
  };

  const { price, originalPrice, tier } = getPricing();
  const showContactUs = photoCount > 35;

  const brandingPrice = brandingOption === "custom" ? 25 : 0;
  const voiceoverPrice = voiceoverOption === "voiceover" ? 25 : 0;
  const editedPhotosPrice = includeEditedPhotos ? 15 : 0;
  const totalAddons = brandingPrice + voiceoverPrice + editedPhotosPrice;
  const totalPrice = price + totalAddons;

  const features = [
    "HD 1080p video quality",
    "Manual photo enhancement",
    "AI perspective correction",
    "72-hour delivery",
    "Revisions included",
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 sticky top-24">
      <h3 className="text-xl font-bold text-foreground mb-4">Order Summary</h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <span className="text-muted-foreground">Photos</span>
          <span className="font-semibold text-foreground">{photoCount}</span>
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-border">
          <span className="text-muted-foreground">Package</span>
          <span className="font-semibold text-foreground text-right text-sm">
            {tier}
          </span>
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
              <Phone className="h-5 w-5" />1 (845) 536-6954
            </a>
          </div>
        ) : (
          <>
            {/* Base Price */}
            <div className="py-4 border-b border-border">
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
            </div>

            {/* Add-ons */}
            {(brandingPrice > 0 || voiceoverPrice > 0 || editedPhotosPrice > 0) && (
              <div className="py-4 border-b border-border space-y-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Add-ons:
                </span>
                {brandingPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Custom Branding</span>
                    <span className="font-semibold text-foreground">+$25</span>
                  </div>
                )}
                {voiceoverPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Professional Voiceover</span>
                    <span className="font-semibold text-foreground">+$25</span>
                  </div>
                )}
                {editedPhotosPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Edited Photos Package</span>
                    <span className="font-semibold text-foreground">+$15</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="py-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-3xl font-bold text-foreground">
                  {totalPrice > 0 ? `$${totalPrice}` : "--"}
                </span>
              </div>
              {price > 0 && (
                <div className="text-right mt-2">
                  <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-semibold">
                    Save ${originalPrice - price}
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
