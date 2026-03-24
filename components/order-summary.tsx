"use client";

import { Check, Phone } from "lucide-react";

interface OrderSummaryProps {
  photoCount: number;
  brandingOption?: string;
  voiceoverOption?: string;
  includeEditedPhotos?: boolean;
  resolution?: string;
  orientation?: string;
  isUrlMode?: boolean;
}

export function OrderSummary({
  photoCount,
  brandingOption = "unbranded",
  voiceoverOption = "none",
  includeEditedPhotos = false,
  resolution = "768P",
  orientation = "landscape",
  isUrlMode = false,
}: OrderSummaryProps) {
  const getPricing = () => {
    if (photoCount === 0) {
      return { price: 0, originalPrice: 0, tier: "Select photos to see price" };
    }
    if (photoCount <= 15) {
      return { price: 79, originalPrice: 149, tier: "Standard (up to 15 photos)" };
    }
    if (photoCount <= 25) {
      return { price: 129, originalPrice: 199, tier: "Premium (16-25 photos)" };
    }
    if (photoCount <= 35) {
      return { price: 179, originalPrice: 249, tier: "Professional (26-35 photos)" };
    }
    return { price: 0, originalPrice: 0, tier: "Contact us" };
  };

  const { price, originalPrice, tier } = getPricing();
  const showContactUs = photoCount > 35;

  const brandingPrice = brandingOption === "custom" ? 0 : 0;
  const voiceoverPrice = voiceoverOption === "voiceover" ? 25 : 0;
  const editedPhotosPrice = includeEditedPhotos ? photoCount * 2.99 : 0;
  const resolutionPrice = resolution === "1080P" ? 10 : 0;
  const orientationPrice = orientation === "both" ? 15 : 0;
  const urlServicePrice = isUrlMode ? 25 : 0;
  const totalAddons = brandingPrice + voiceoverPrice + editedPhotosPrice + resolutionPrice + orientationPrice + urlServicePrice;
  const totalPrice = price + totalAddons;

  const features: string[] = [];
  features.push(resolution === "1080P" ? "1080P Full HD video" : "768P HD video");
  features.push(orientation === "both" ? "Landscape + Vertical videos" : orientation === "vertical" ? "Vertical (9:16) video" : "Landscape (16:9) video");
  if (brandingOption === "custom") {
    features.push("Custom branded intro & outro");
  }
  if (voiceoverOption === "voiceover") {
    features.push("Professional AI voiceover");
  }
  if (includeEditedPhotos) {
    features.push("Professional photo editing");
  }
  features.push("AI-enhanced motion clips");
  features.push("Choice of music");
  features.push("48-hour delivery");
  features.push("1 revision included");

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
            {(brandingPrice > 0 || voiceoverPrice > 0 || editedPhotosPrice > 0 || resolutionPrice > 0 || orientationPrice > 0 || urlServicePrice > 0) && (
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
                    <span className="text-sm text-foreground">Photo Editing ({photoCount} × $2.99)</span>
                    <span className="font-semibold text-foreground">+${editedPhotosPrice.toFixed(2)}</span>
                  </div>
                )}
                {resolutionPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">1080P HD Upgrade</span>
                    <span className="font-semibold text-foreground">+$10</span>
                  </div>
                )}
                {orientationPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Both Orientations</span>
                    <span className="font-semibold text-foreground">+$15</span>
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
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-3xl font-bold text-foreground">
                  {totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "--"}
                </span>
              </div>
              {price > 0 && originalPrice > price && (
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
