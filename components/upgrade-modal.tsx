"use client";

import { useState } from "react";
import { X, Globe, Zap, Crown, Check, ArrowRight, Server, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: "none" | "lens" | "pro";
  /** True when a Pro subscriber has already used their included site */
  includedSiteUsed?: boolean;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  includedSiteUsed = false,
}: UpgradeModalProps) {
  const [purchasing, setPurchasing] = useState<"addon" | "owned" | null>(null);

  if (!isOpen) return null;

  const handleAddonPurchase = async () => {
    setPurchasing("addon");
    try {
      const res = await fetch("/api/websites/billing/addon", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else if (data.success) {
        window.location.reload();
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setPurchasing(null);
  };

  const handleOwnedPurchase = async () => {
    setPurchasing("owned");
    try {
      const res = await fetch("/api/websites/billing/purchase", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setPurchasing(null);
  };

  const isProNeedingMore = currentTier === "pro" && includedSiteUsed;
  const headerTitle = isProNeedingMore
    ? "Add Another Website"
    : "Unlock the Website Builder";
  const headerSubtitle = isProNeedingMore
    ? "You've used your included website. Choose how to add another."
    : "Create stunning property and portfolio websites — yours to keep.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-border">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Globe className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">{headerTitle}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{headerSubtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {/* ─── Buy Outright — always visible, always first ─── */}
          <button
            onClick={handleOwnedPurchase}
            disabled={purchasing !== null}
            className="w-full p-5 rounded-xl border-2 border-accent/30 bg-accent/5 hover:border-accent/50 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-foreground">Own It Forever</p>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Best Value</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your website, permanently. Includes 6 months of AI tools.
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-2xl font-extrabold text-foreground">$399</p>
                <p className="text-xs text-muted-foreground">one-time</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                "Website live forever — no monthly fees",
                "Free hosting included — no hidden costs",
                "6 months of AI tools: descriptions, staging, photo coach, design studio, blog writer",
                "Lead capture, booking calendar, Lensy chat — always active",
                "After 6 months: site stays live, AI tools available from $29/mo",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-accent">
              {purchasing === "owned" ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Purchase now →"
              )}
            </div>
          </button>

          {/* ─── Divider ─── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {isProNeedingMore ? (
            /* ─── Pro subscriber: monthly add-on option ─── */
            <button
              onClick={handleAddonPurchase}
              disabled={purchasing !== null}
              className="w-full p-5 rounded-xl border-2 border-border hover:border-accent/40 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">Monthly Add-On</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added to your Pro subscription. Full AI tools. Cancel anytime.
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-2xl font-extrabold text-foreground">$29.95</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                {purchasing === "addon" ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Add to subscription →"
                )}
              </div>
            </button>
          ) : (
            /* ─── Non-Pro: subscribe to Lens Pro ─── */
            <div className="p-5 rounded-xl border-2 border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-extrabold text-foreground">Lens Pro</p>
                  <p className="text-xs text-muted-foreground">Subscribe for ongoing access</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-foreground">$49.95</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {[
                  "1 website included (property or portfolio)",
                  "All AI tools — always active while subscribed",
                  "Photo coach, staging, descriptions, design studio",
                  "AI blog writer for your website",
                  "Lensy AI chat & neighborhood tools",
                  "Free hosting included",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                <Link href="/lens">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {currentTier === "lens" ? "Upgrade to Pro" : "Get Started with Pro"}
                </Link>
              </Button>
              {currentTier === "lens" && (
                <p className="text-[10px] text-center text-muted-foreground mt-3">
                  You&apos;re on Lens ($29/mo). Upgrade to Pro to unlock the website builder.
                </p>
              )}
            </div>
          )}

          {/* Free hosting callout */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200">
            <Server className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-800">
              <span className="font-bold">Hosting is always free.</span> No hidden fees — your site runs on our infrastructure at no cost to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
