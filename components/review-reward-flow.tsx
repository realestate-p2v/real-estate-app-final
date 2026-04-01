"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Star,
  ExternalLink,
  Upload,
  Clock,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpinWheel } from "@/components/spin-wheel";
import type { WheelSegment } from "@/components/spin-wheel";

interface ReviewRewardFlowProps {
  orderId: string;
  userEmail: string;
  userId: string;
}

type PlatformStatus = "not_started" | "review_opened" | "uploading" | "pending" | "verified" | "rejected";

interface PlatformState {
  status: PlatformStatus;
  screenshotUrl?: string;
  discountCode?: string;
  discountPercent?: number;
  isJackpot?: boolean;
  wheelSeen?: boolean;
}

const PLATFORMS = [
  {
    key: "google",
    label: "Google",
    icon: "⭐",
    url: "https://g.page/r/CX6ne0m0RmqtEBM/review",
    colors: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    pendingColors: "bg-amber-50 border-amber-200",
    verifiedColors: "bg-green-50 border-green-200",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "👍",
    url: "https://www.facebook.com/profile.php?id=61587039633673&sk=reviews",
    colors: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
    pendingColors: "bg-amber-50 border-amber-200",
    verifiedColors: "bg-green-50 border-green-200",
  },
  {
    key: "trustpilot",
    label: "Trustpilot",
    icon: "⭐",
    url: "https://www.trustpilot.com/review/realestatephoto2video.com",
    colors: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
    pendingColors: "bg-amber-50 border-amber-200",
    verifiedColors: "bg-green-50 border-green-200",
  },
];

export function ReviewRewardFlow({ orderId, userEmail, userId }: ReviewRewardFlowProps) {
  const [platformStates, setPlatformStates] = useState<Record<string, PlatformState>>({});
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [wheelSeenDB, setWheelSeenDB] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load existing review statuses on mount
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await fetch("/api/reviews/submit");
        const data = await res.json();
        if (data.success && data.reviews) {
          const states: Record<string, PlatformState> = {};
          let anyWheelSeen = false;
          for (const review of data.reviews) {
            if (review.wheel_seen) anyWheelSeen = true;
            states[review.platform] = {
              status: review.verification_status === "verified" || review.verification_status === "approved"
                ? "verified"
                : review.verification_status === "rejected"
                ? "rejected"
                : review.screenshot_url
                ? "pending"
                : "not_started",
              screenshotUrl: review.screenshot_url || undefined,
              discountCode: review.discount_code || undefined,
              discountPercent: review.discount_percent || undefined,
              isJackpot: review.is_jackpot || false,
              wheelSeen: review.wheel_seen || false,
            };
          }
          setPlatformStates(states);
          setWheelSeenDB(anyWheelSeen);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, []);

  const handleOpenReview = (platformKey: string, url: string) => {
    window.open(url, "_blank");
    setPlatformStates((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        status: prev[platformKey]?.status === "not_started" || !prev[platformKey]
          ? "review_opened"
          : prev[platformKey].status,
      },
    }));
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const sigResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "photo2video/review-screenshots" }),
      });
      const sigData = await sigResponse.json();
      if (!sigData.success) throw new Error("Signature failed");

      const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", timestamp.toString());
      uploadData.append("signature", signature);
      uploadData.append("folder", folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: uploadData,
      });
      const result = await response.json();
      return result.secure_url || null;
    } catch (error) {
      console.error("Screenshot upload error:", error);
      return null;
    }
  };

  const handleScreenshotUpload = async (file: File, platformKey: string) => {
    setPlatformStates((prev) => ({
      ...prev,
      [platformKey]: { ...prev[platformKey], status: "uploading" },
    }));

    const url = await uploadToCloudinary(file);
    if (!url) {
      alert("Failed to upload screenshot. Please try again.");
      setPlatformStates((prev) => ({
        ...prev,
        [platformKey]: { ...prev[platformKey], status: "review_opened" },
      }));
      return;
    }

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          userId,
          platform: platformKey,
          screenshotUrl: url,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlatformStates((prev) => ({
          ...prev,
          [platformKey]: { status: "pending", screenshotUrl: url },
        }));
      } else {
        throw new Error(data.error || "Failed to submit");
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Failed to submit review. Please try again.");
      setPlatformStates((prev) => ({
        ...prev,
        [platformKey]: { ...prev[platformKey], status: "review_opened" },
      }));
    }
  };

  // Mark wheel as seen in the database — called once after spin completes
  const markWheelSeenInDB = async () => {
    setWheelSeenDB(true);
    try {
      await fetch("/api/reviews/submit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "wheel_seen" }),
      });
    } catch (err) {
      console.error("Failed to mark wheel seen:", err);
      // State is already set locally — worst case they see it once more
    }
  };

  const verifiedCount = Object.values(platformStates).filter((s) => s.status === "verified").length;
  const discountLabel =
    verifiedCount >= 3 ? "Spin result!" : verifiedCount >= 2 ? "15% off" : verifiedCount >= 1 ? "10% off" : null;

  // Spin wheel: find the 3rd-review discount data
  const verifiedStates = Object.values(platformStates).filter((s) => s.status === "verified");
  const thirdReviewState = verifiedStates.length >= 3
    ? verifiedStates.find((s) => (s.discountPercent && s.discountPercent >= 20) || s.isJackpot)
    : null;
  const [showWheelModal, setShowWheelModal] = useState(false);

  // "All prizes won" = all 3 verified AND wheel has been seen (from DB)
  const allPrizesWon = verifiedCount >= 3 && thirdReviewState && wheelSeenDB;
  // Can show wheel = 3 verified, has discount data, wheel NOT yet seen in DB
  const canShowWheel = verifiedCount >= 3 && thirdReviewState && !wheelSeenDB;

  // Auto-show the wheel modal when 3rd review is verified and user hasn't seen it
  useEffect(() => {
    if (canShowWheel && !showWheelModal) {
      const timer = setTimeout(() => setShowWheelModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [canShowWheel, showWheelModal]);

  if (dismissed) return null;
  if (loading) return null;

  // Determine SpinWheel props based on jackpot vs percent win
  const spinWinningPercent = thirdReviewState?.isJackpot
    ? undefined
    : thirdReviewState?.discountPercent;

  const getVerifiedPrizeLabel = (state: PlatformState) => {
    if (state.isJackpot) return "FREE VIDEO";
    if (state.discountPercent) return `${state.discountPercent}%`;
    return null;
  };

  return (
    <>
      {showWheelModal && thirdReviewState && (
        <SpinWheel
          winningPercent={spinWinningPercent}
          promoCode={thirdReviewState.discountCode || ""}
          onComplete={() => markWheelSeenInDB()}
          onClose={() => { setShowWheelModal(false); markWheelSeenInDB(); }}
        />
      )}

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Star className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            {allPrizesWon ? (
              <>
                <h3 className="font-bold text-foreground mb-1">🏆 You&apos;ve won every review prize!</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Thanks for reviewing us on all 3 platforms — you&apos;re amazing. But there&apos;s more...
                </p>
                <div className="bg-white/70 rounded-xl border border-amber-200 p-4 mb-3">
                  <p className="text-sm text-foreground font-semibold mb-1">
                    ✨ Unlock surprise discounts with P2V Lens
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Every time you use any P2V Lens feature — Photo Coach, Design Studio, Description Writer, Virtual Staging — you have a chance to win exclusive discounts on all of our products. Subscribers win more often.
                  </p>
                  <a
                    href="/lens"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
                  >
                    Learn more about P2V Lens →
                  </a>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold text-foreground mb-1">Love your video? Share the love!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Leave a review on any platform, upload a screenshot to verify, and earn a discount on your next order.
                </p>
              </>
            )}

            {!allPrizesWon && (
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs text-muted-foreground">
                  🎁 <strong>1 review = 10% off</strong> · <strong>2 reviews = 15% off</strong> · <strong>All 3 = spin the wheel!</strong>
                </p>
                {discountLabel && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
                    Current: {discountLabel}
                  </span>
                )}
              </div>
            )}

          {/* Platform cards */}
          <div className="space-y-3">
            {PLATFORMS.map((platform) => {
              const state = platformStates[platform.key];
              const status = state?.status || "not_started";

              if (status === "verified") {
                const prizeLabel = getVerifiedPrizeLabel(state);
                const isJackpotPrize = state?.isJackpot;

                return (
                  <div
                    key={platform.key}
                    className={`rounded-xl border-2 p-4 ${
                      isJackpotPrize
                        ? "bg-yellow-50 border-yellow-300"
                        : platform.verifiedColors
                    } flex items-center justify-between gap-3`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle className={`h-5 w-5 flex-shrink-0 ${
                        isJackpotPrize ? "text-yellow-600" : "text-green-600"
                      }`} />
                      <div className="min-w-0">
                        <span className={`font-bold block ${
                          isJackpotPrize ? "text-yellow-800" : "text-green-800"
                        }`}>
                          {platform.icon} {platform.label} — Verified ✓
                        </span>
                        {state?.discountCode && (
                          <span className={`text-xs font-mono font-bold ${
                            isJackpotPrize ? "text-yellow-600" : "text-green-600"
                          }`}>
                            {state.discountCode}
                          </span>
                        )}
                      </div>
                    </div>
                    {prizeLabel && (
                      <div className={`flex-shrink-0 text-white rounded-xl px-4 py-2 text-center shadow-md ${
                        isJackpotPrize
                          ? "bg-yellow-500 shadow-yellow-500/30"
                          : "bg-green-600 shadow-green-600/30"
                      }`}>
                        {isJackpotPrize ? (
                          <>
                            <div className="text-lg font-black leading-none">FREE</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">VIDEO</div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-black leading-none">{prizeLabel}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">OFF</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (status === "pending") {
                return (
                  <div
                    key={platform.key}
                    className={`rounded-xl border p-4 ${platform.pendingColors}`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-amber-800">
                        {platform.icon} {platform.label} — Verification Pending
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      We&apos;ll verify within 24 hours and email your discount code.
                    </p>
                  </div>
                );
              }

              if (status === "uploading") {
                return (
                  <div
                    key={platform.key}
                    className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="font-semibold text-blue-800">
                        Uploading screenshot...
                      </span>
                    </div>
                  </div>
                );
              }

              if (status === "review_opened") {
                return (
                  <div
                    key={platform.key}
                    className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3"
                  >
                    <div>
                      <p className="font-semibold text-blue-800">
                        {platform.icon} Reviewed on {platform.label}?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Upload a screenshot to verify and claim your discount.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[platform.key] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleScreenshotUpload(file, platform.key);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRefs.current[platform.key]?.click()}
                        className="bg-white"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload Screenshot
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenReview(platform.key, platform.url)}
                        className="text-blue-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Open {platform.label} Again
                      </Button>
                    </div>
                  </div>
                );
              }

              if (status === "rejected") {
                return (
                  <div
                    key={platform.key}
                    className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2"
                  >
                    <p className="font-semibold text-red-800">
                      {platform.icon} {platform.label} — Screenshot not accepted
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please try again with a clearer screenshot showing your review.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPlatformStates((prev) => ({
                            ...prev,
                            [platform.key]: { status: "review_opened" },
                          }));
                        }}
                        className="bg-white"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload New Screenshot
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={platform.key}
                  className={`w-full inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${platform.colors}`}
                  onClick={() => handleOpenReview(platform.key, platform.url)}
                >
                  <span className="text-lg">{platform.icon}</span>
                  {platform.label} — Leave a Review
                  <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-right">
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
