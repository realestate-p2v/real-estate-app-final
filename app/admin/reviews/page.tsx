"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  AlertCircle,
  Eye,
  ArrowLeft,
} from "lucide-react";

interface ReviewReward {
  id: string;
  user_id: string;
  order_id: string | null;
  platform: string;
  screenshot_url: string;
  verification_status: string;
  discount_code: string;
  discount_percent: number;
  submitted_at: string;
  created_at: string;
  verified_at: string | null;
  user_email?: string;
}

const PLATFORM_INFO: Record<string, { label: string; icon: string }> = {
  google: { label: "Google", icon: "⭐" },
  facebook: { label: "Facebook", icon: "👍" },
  trustpilot: { label: "Trustpilot", icon: "⭐" },
  zillow: { label: "Zillow", icon: "🏠" },
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.status === 401 || res.status === 403) {
        setAuthorized(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAuthorized(true);
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (reviewId: string, status: "approved" | "rejected") => {
    setProcessing(reviewId);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh reviews to get updated data (discount codes, etc.)
        await fetchReviews();
      } else {
        alert(data.error || "Failed to update review");
      }
    } catch (err) {
      console.error("Failed to update review:", err);
      alert("Failed to update review. Check console for details.");
    } finally {
      setProcessing(null);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === "all") return true;
    return r.verification_status === filter;
  });

  const pendingCount = reviews.filter(r => r.verification_status === "pending").length;
  const approvedCount = reviews.filter(r => r.verification_status === "approved").length;
  const rejectedCount = reviews.filter(r => r.verification_status === "rejected").length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

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

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">This page is restricted to administrators.</p>
          <Button asChild><Link href="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Review screenshot" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Star className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Review Verification</h1>
            <p className="text-sm text-muted-foreground">Approve or reject customer review screenshots. Approving generates a Stripe promo code automatically.</p>
          </div>
        </div>

        {/* Discount info */}
        <div className="bg-muted/50 rounded-xl border border-border p-4 mb-6 text-sm text-muted-foreground">
          <strong className="text-foreground">Discount tiers:</strong> 1 verified review = 10% off · 2 verified reviews = 15% off · 3 verified reviews = 25% off. Promo codes are generated via Stripe and emailed to the customer automatically.
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pending", count: pendingCount, color: "text-amber-600 bg-amber-50 border-amber-200", filterKey: "pending" as const },
            { label: "Approved", count: approvedCount, color: "text-green-600 bg-green-50 border-green-200", filterKey: "approved" as const },
            { label: "Rejected", count: rejectedCount, color: "text-red-600 bg-red-50 border-red-200", filterKey: "rejected" as const },
            { label: "All", count: reviews.length, color: "text-gray-600 bg-gray-50 border-gray-200", filterKey: "all" as const },
          ].map(({ label, count, color, filterKey }) => (
            <button
              key={filterKey}
              onClick={() => setFilter(filterKey)}
              className={`rounded-xl border-2 p-3 text-center transition-all ${
                filter === filterKey ? color + " ring-2 ring-offset-1 ring-current/20" : "border-border bg-card text-muted-foreground"
              }`}
            >
              <div className="text-2xl font-black">{count}</div>
              <div className="text-xs font-semibold">{label}</div>
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filter === "pending" ? "No pending reviews to verify" : `No ${filter} reviews`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const platform = PLATFORM_INFO[review.platform] || { label: review.platform, icon: "📝" };
              const isPending = review.verification_status === "pending";
              const isProcessing = processing === review.id;

              return (
                <div key={review.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Screenshot Preview */}
                    <button
                      onClick={() => setPreviewImage(review.screenshot_url)}
                      className="sm:w-48 h-32 sm:h-auto bg-gray-100 flex-shrink-0 relative group"
                    >
                      {review.screenshot_url ? (
                        <>
                          <img
                            src={review.screenshot_url}
                            alt={`${platform.label} review screenshot`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No screenshot
                        </div>
                      )}
                    </button>

                    {/* Review Info */}
                    <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{platform.icon}</span>
                          <span className="font-bold text-foreground">{platform.label}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            review.verification_status === "approved"
                              ? "bg-green-100 text-green-700"
                              : review.verification_status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {review.verification_status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          User: {review.user_email || review.user_id.slice(0, 8) + "..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {formatDate(review.submitted_at || review.created_at)}
                        </p>
                        {review.order_id && (
                          <p className="text-xs text-muted-foreground">
                            Order: <Link href={`/admin/orders/${review.order_id}`} className="text-primary hover:underline">{review.order_id.slice(0, 8)}...</Link>
                          </p>
                        )}
                        {review.discount_code && (
                          <p className="text-xs text-green-700 font-semibold mt-1">
                            Code: <span className="font-mono bg-green-50 px-1.5 py-0.5 rounded">{review.discount_code}</span>
                            {review.discount_percent && ` (${review.discount_percent}% off)`}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerify(review.id, "approved")}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(review.id, "rejected")}
                            disabled={isProcessing}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}

                      {!isPending && (
                        <div className="flex items-center gap-2">
                          {review.screenshot_url && (
                            <a
                              href={review.screenshot_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> Full Image
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
