"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Star,
  Upload,
  Loader2,
  CheckCircle,
  Clock,
  ExternalLink,
  Gift,
  Camera,
  X,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface ReviewReward {
  id: string;
  platform: string;
  screenshot_url: string;
  verification_status: string;
  discount_code: string;
  discount_percent: number;
  created_at: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  times_used: number;
  max_uses: number;
  expires_at: string | null;
}

const PLATFORMS = [
  {
    key: "google",
    label: "Google",
    icon: "⭐",
    reviewUrl: "https://g.page/r/realestatephoto2video/review",
    color: "border-blue-200 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-100",
    textColor: "text-blue-700",
    instructions: "1. Click the button below to open Google\n2. Sign in to your Google account\n3. Leave your star rating and review\n4. Take a screenshot showing your review\n5. Upload the screenshot here",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "👍",
    reviewUrl: "https://www.facebook.com/profile.php?id=61587039633673&sk=reviews",
    color: "border-indigo-200 bg-indigo-50",
    activeColor: "border-indigo-500 bg-indigo-100",
    textColor: "text-indigo-700",
    instructions: "1. Click the button below to open Facebook\n2. Click 'Yes' to recommend us\n3. Write your review\n4. Take a screenshot showing your review\n5. Upload the screenshot here",
  },
  {
    key: "trustpilot",
    label: "Trustpilot",
    icon: "⭐",
    color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    textColor: "text-emerald-700",
  },
];

const REWARD_TIERS = [
  { count: 1, discount: 10, label: "1 review", description: "10% off your next order" },
  { count: 2, discount: 15, label: "2 reviews", description: "15% off your next order" },
  { count: 3, discount: 25, label: "All 3 reviews", description: "25% off + mystery bonus!" },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewReward[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [reviewedPlatforms, setReviewedPlatforms] = useState<string[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Upload state
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setPromoCodes(data.promoCodes || []);
        setReviewedPlatforms(data.reviewedPlatforms || []);
        setApprovedCount(data.approvedCount || 0);
        setPendingCount(data.pendingCount || 0);
        setDiscountPercent(data.discountPercent || 0);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const sigRes = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "photo2video/review-screenshots" }),
      });
      const sigData = await sigRes.json();
      if (!sigData.success) throw new Error("Signature failed");

      const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setScreenshotUrl(uploadData.secure_url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Screenshot upload error:", err);
      setSubmitError("Failed to upload screenshot. Please try again.");
      setScreenshotPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedPlatform || !screenshotUrl) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          screenshotUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(data.message);
        setSelectedPlatform(null);
        setScreenshotPreview(null);
        setScreenshotUrl(null);
        fetchReviews(); // Refresh data
      } else {
        setSubmitError(data.error || "Failed to submit review");
      }
    } catch (err) {
      setSubmitError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
          <Star className="h-12 w-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Sign In to Leave Reviews</h1>
          <p className="text-muted-foreground">You need to be signed in to submit reviews and earn discounts.</p>
          <Button asChild>
            <Link href="/login?redirect=/dashboard/reviews">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Star className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Leave a Review, Earn Discounts</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Share your experience on Google, Facebook, or TrustPilot. Each review unlocks bigger discounts on your next order.
          </p>
        </div>

        {/* Reward Progress */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="h-5 w-5 text-amber-600" />
            <h2 className="font-bold text-foreground">Your Reward Progress</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {REWARD_TIERS.map((tier) => {
              const isReached = approvedCount >= tier.count;
              const isPending = !isReached && (approvedCount + pendingCount) >= tier.count;
              return (
                <div
                  key={tier.count}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    isReached
                      ? "border-green-400 bg-green-50"
                      : isPending
                      ? "border-amber-300 bg-amber-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className={`text-2xl font-black ${isReached ? "text-green-600" : isPending ? "text-amber-600" : "text-gray-300"}`}>
                    {tier.discount}%
                  </div>
                  <div className="text-sm font-semibold text-foreground mt-1">{tier.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{tier.description}</div>
                  {isReached && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-green-600">
                      <CheckCircle className="h-3 w-3" /> Unlocked
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-amber-600">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {discountPercent > 0 && (
            <p className="text-sm text-center text-green-700 font-semibold mt-4">
              You've unlocked {discountPercent}% off your next order!
            </p>
          )}
        </div>

        {/* Active Promo Codes */}
        {promoCodes.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-accent" />
              Your Discount Codes
            </h3>
            <div className="space-y-2">
              {promoCodes.map((code) => (
                <div key={code.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                  <div>
                    <span className="font-mono font-bold text-foreground text-lg">{code.code}</span>
                    <span className="ml-3 text-sm text-green-600 font-semibold">{code.discount_percent}% off</span>
                  </div>
                  <button
                    onClick={() => copyCode(code.code)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedCode === code.code ? (
                      <><Check className="h-4 w-4 text-green-600" /> Copied</>
                    ) : (
                      <><Copy className="h-4 w-4" /> Copy</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">{submitSuccess}</p>
              <p className="text-xs text-green-600 mt-1">We'll verify your screenshot within 24 hours and activate your discount.</p>
            </div>
            <button onClick={() => setSubmitSuccess(null)} className="ml-auto">
              <X className="h-4 w-4 text-green-400" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{submitError}</p>
            <button onClick={() => setSubmitError(null)} className="ml-auto">
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Platform Cards */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-foreground">Choose a Platform</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => {
              const isReviewed = reviewedPlatforms.includes(platform.key);
              const isSelected = selectedPlatform === platform.key;
              const review = reviews.find(r => r.platform === platform.key);

              return (
                <div key={platform.key} className="space-y-3">
                  <button
                    onClick={() => {
                      if (!isReviewed) {
                        setSelectedPlatform(isSelected ? null : platform.key);
                        setScreenshotPreview(null);
                        setScreenshotUrl(null);
                        setSubmitError(null);
                      }
                    }}
                    disabled={isReviewed}
                    className={`w-full rounded-2xl border-2 p-6 text-center transition-all ${
                      isReviewed
                        ? "border-green-300 bg-green-50 cursor-default"
                        : isSelected
                        ? platform.activeColor
                        : `${platform.color} hover:shadow-md cursor-pointer`
                    }`}
                  >
                    <div className="text-3xl mb-2">{platform.icon}</div>
                    <div className={`font-bold text-lg ${platform.textColor}`}>{platform.label}</div>
                    {isReviewed && review && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          review.verification_status === "approved"
                            ? "bg-green-100 text-green-700"
                            : review.verification_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {review.verification_status === "approved" && <><CheckCircle className="h-3 w-3" /> Approved</>}
                          {review.verification_status === "pending" && <><Clock className="h-3 w-3" /> Pending</>}
                          {review.verification_status === "rejected" && <><AlertCircle className="h-3 w-3" /> Rejected</>}
                        </span>
                      </div>
                    )}
                    {!isReviewed && (
                      <p className="text-xs text-muted-foreground mt-2">Click to review here</p>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Submission Form */}
        {selectedPlatform && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            {(() => {
              const platform = PLATFORMS.find(p => p.key === selectedPlatform)!;
              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <span className="text-xl">{platform.icon}</span>
                      Review on {platform.label}
                    </h3>
                    <button onClick={() => setSelectedPlatform(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Step 1: Leave the review */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Step 1: Leave your review</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line mb-3">{platform.instructions}</p>
                    <Button asChild size="sm">
                      <a href={platform.reviewUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Open {platform.label}
                      </a>
                    </Button>
                  </div>

                  {/* Step 2: Upload screenshot */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Step 2: Upload your screenshot</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Take a screenshot showing your review on {platform.label} and upload it below.
                      We'll verify it within 24 hours.
                    </p>

                    {screenshotPreview ? (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden border border-border">
                          <img
                            src={screenshotPreview}
                            alt="Review screenshot"
                            className="w-full max-h-64 object-contain bg-gray-50"
                          />
                          {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <p className="text-sm">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {!uploading && (
                          <button
                            onClick={() => {
                              setScreenshotPreview(null);
                              setScreenshotUrl(null);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Remove and upload a different screenshot
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                        <Camera className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                        <span className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, or WEBP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleSubmitReview}
                    disabled={!screenshotUrl || uploading || submitting}
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Submit Review for Verification</>
                    )}
                  </Button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Past Reviews */}
        {reviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Your Reviews</h2>
            <div className="space-y-3">
              {reviews.map((review) => {
                const platform = PLATFORMS.find(p => p.key === review.platform);
                return (
                  <div key={review.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                    <span className="text-2xl">{platform?.icon || "📝"}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{platform?.label || review.platform}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      review.verification_status === "approved"
                        ? "bg-green-100 text-green-700"
                        : review.verification_status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {review.verification_status === "approved" && <><CheckCircle className="h-3 w-3" /> Approved</>}
                      {review.verification_status === "pending" && <><Clock className="h-3 w-3" /> Pending Verification</>}
                      {review.verification_status === "rejected" && <><AlertCircle className="h-3 w-3" /> Rejected</>}
                    </span>
                    {review.screenshot_url && (
                      <a href={review.screenshot_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline">
                        View Screenshot
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">Ready to use your discount?</p>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/order">Create My Next Video</Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
