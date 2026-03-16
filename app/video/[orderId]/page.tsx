"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Download,
  RefreshCw,
  Share2,
  Mail,
  MessageCircle,
  Camera,
  Play,
  CheckCircle,
  Clock,
  BookOpen,
  Loader2,
  Copy,
  Check,
  Star,
  ExternalLink,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  status: string;
  customer_name: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_bedrooms: string;
  property_bathrooms: string;
  photo_count: number;
  resolution: string;
  orientation: string;
  delivery_url: string;
  edited_photos_url: string;
  created_at: string;
  delivered_at: string;
  include_edited_photos: boolean;
  revision_count: number;
  revisions_allowed: number;
}

function getFileIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

const REVIEW_PLATFORMS = [
  {
    key: "google",
    label: "Google",
    icon: "⭐",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "👍",
    color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    textColor: "text-indigo-700",
  },
  {
    key: "zillow",
    label: "Zillow",
    icon: "🏠",
    color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    textColor: "text-emerald-700",
  },
];

const REVISION_IN_PROGRESS_STATUSES = [
  "revision_requested",
  "client_revision_requested",
  "processing",
  "awaiting_approval",
];

const DELIVERED_STATUSES = ["delivered", "complete", "approved", "closed"];

const STATUS_DISPLAY: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  revision_requested: {
    label: "Revision In Progress",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    description: "Your revision is being processed. We're regenerating the clips you requested. You'll receive an email when your updated video is ready — typically within 24 hours.",
  },
  client_revision_requested: {
    label: "Revision Submitted",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    description: "Your revision has been submitted and is queued for processing. You'll receive an email when your updated video is ready — typically within 24 hours.",
  },
  processing: {
    label: "In Production",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Your video is currently being produced. You'll receive an email when it's ready — typically within 24 hours.",
  },
  awaiting_approval: {
    label: "In Review",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
    description: "Your video is being reviewed for quality before delivery. This usually takes just a few hours.",
  },
  new: {
    label: "Queued",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Your order is in the queue and will begin processing shortly.",
  },
};

const REVIEW_WINDOW_DAYS = 5;

function getTimeRemaining(deliveredAt: string): { days: number; hours: number; minutes: number; expired: boolean; totalMs: number } {
  const deliveredDate = new Date(deliveredAt);
  const expiryDate = new Date(deliveredDate.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true, totalMs: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, expired: false, totalMs: diff };
}

export default function VideoDeliveryPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  // Live countdown timer
  useEffect(() => {
    if (!order?.delivered_at) return;
    if (order.status === "closed") return;

    const update = () => setTimeRemaining(getTimeRemaining(order.delivered_at));
    update();
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [order?.delivered_at, order?.status]);

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (order?.delivery_url) {
      navigator.clipboard.writeText(order.delivery_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAcceptClose = async () => {
    if (!order) return;
    if (!confirm("Accept this video and close the order? You'll be able to download the video and we'll save it in your account. You can still request paid revisions after closing.")) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, status: "closed" });
      }
    } catch (err) {
      console.error("Failed to close order:", err);
    } finally {
      setAccepting(false);
    }
  };

  const getOrderName = () => {
    if (!order) return "";
    if (order.property_address) {
      const parts = [order.property_address];
      if (order.property_city) parts.push(order.property_city);
      if (order.property_state) parts.push(order.property_state);
      return parts.join(", ");
    }
    return `Order ${(order.order_id || order.id).slice(0, 8)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

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

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Video Not Found</h1>
          <p className="text-muted-foreground">
            This video may not exist, may still be processing, or the link may be incorrect. If you just placed an order, your video will be ready within 24 hours.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/support">Contact Support</Link>
            </Button>
            <Button asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fileId = getFileIdFromUrl(order.delivery_url);
  const isDelivered = DELIVERED_STATUSES.includes(order.status);
  const isClosed = order.status === "closed";
  const isRevisionInProgress = REVISION_IN_PROGRESS_STATUSES.includes(order.status);
  const statusInfo = STATUS_DISPLAY[order.status];

  // 5-day review window logic
  const hasDeliveredAt = !!order.delivered_at;
  const reviewWindowExpired = timeRemaining?.expired ?? false;
  const freeRevisionUsed = (order.revision_count || 0) >= (order.revisions_allowed || 1);
  const canRequestFreeRevision = isDelivered && !isClosed && !isRevisionInProgress && !freeRevisionUsed && !reviewWindowExpired;
  const canRequestPaidRevision = (isClosed || reviewWindowExpired) && !isRevisionInProgress;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{getOrderName()}</h1>
            <p className="text-muted-foreground mt-1">
              {isDelivered ? `Delivered ${formatDate(order.delivered_at || order.created_at)}` : `Ordered ${formatDate(order.created_at)}`}
            </p>
          </div>
          {isRevisionInProgress && statusInfo ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color} flex-shrink-0`}>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {statusInfo.label}
            </span>
          ) : isClosed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex-shrink-0">
              <CheckCircle className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : isDelivered ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex-shrink-0">
              <CheckCircle className="h-3.5 w-3.5" />
              Delivered
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo?.bgColor || "bg-blue-100"} ${statusInfo?.color || "text-blue-700"} flex-shrink-0`}>
              <Clock className="h-3.5 w-3.5" />
              {statusInfo?.label || "Processing"}
            </span>
          )}
        </div>

        {/* ═══ REVISION IN PROGRESS BANNER ═══ */}
        {isRevisionInProgress && statusInfo && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">{statusInfo.label}</h3>
                <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ 5-DAY REVIEW WINDOW COUNTDOWN ═══ */}
        {isDelivered && !isClosed && !isRevisionInProgress && hasDeliveredAt && timeRemaining && (
          <div className={`rounded-2xl p-5 mb-6 border ${
            reviewWindowExpired
              ? "bg-red-50 border-red-200"
              : timeRemaining.days <= 1
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                reviewWindowExpired ? "bg-red-100" : timeRemaining.days <= 1 ? "bg-amber-100" : "bg-blue-100"
              }`}>
                {reviewWindowExpired ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                {reviewWindowExpired ? (
                  <>
                    <h3 className="font-bold text-red-800 mb-1">Review window has expired</h3>
                    <p className="text-sm text-red-700">
                      The 5-day review period has ended. Your order will be closed automatically.
                      You can still request paid revisions after closure.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-foreground">Review your video</h3>
                      <span className={`text-sm font-bold ${timeRemaining.days <= 1 ? "text-amber-700" : "text-blue-700"}`}>
                        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                        {timeRemaining.hours}h {timeRemaining.minutes}m remaining
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You have <strong className="text-foreground">{REVIEW_WINDOW_DAYS} days</strong> from delivery to review your video and request your free revision.
                      After the review window closes, the order will be finalized automatically.
                      {!freeRevisionUsed && " Your 1 free revision is still available."}
                    </p>
                  </>
                )}
                <div className="flex gap-2 mt-3">
                  {!reviewWindowExpired && !freeRevisionUsed && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/video/${orderId}/revise`}>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Request Free Revision
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleAcceptClose}
                    disabled={accepting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {accepting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Accept & Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ REVIEW PROMPT BANNER — only after customer has closed/accepted ═══ */}
        {isClosed && !reviewDismissed && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">Love your video? Share the love!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  A quick review helps other agents find us. Pick any platform — each review unlocks a discount on your next order.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {REVIEW_PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${platform.color} ${platform.textColor}`}
                      onClick={() => {
                        const urls: Record<string, string> = {
                          google: "https://g.page/r/realestatephoto2video/review",
                          facebook: "https://www.facebook.com/profile.php?id=61587039633673&sk=reviews",
                          zillow: "https://www.zillow.com",
                        };
                        window.open(urls[platform.key], "_blank");
                      }}
                    >
                      <span>{platform.icon}</span>
                      {platform.label}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-muted-foreground">
                    🎁 <strong>1 review = 10% off</strong> · <strong>2 reviews = 15% off</strong> · <strong>All 3 = mystery spin!</strong>
                  </p>
                  <button
                    onClick={() => setReviewDismissed(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Player */}
        {fileId ? (
          <div className="bg-black rounded-2xl overflow-hidden mb-6">
            <div className="aspect-video">
              <iframe
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center mb-6">
            <div className="text-center space-y-2">
              <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">Video is being processed...</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {/* Download + Copy only after accepting/closing */}
          {isClosed && order.delivery_url && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href={order.delivery_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </a>
            </Button>
          )}
          {isClosed && order.delivery_url && (
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy Drive Link"}
            </Button>
          )}
          {/* Edited photos available after closing */}
          {isClosed && order.edited_photos_url && (
            <Button asChild variant="outline">
              <a href={order.edited_photos_url} target="_blank" rel="noopener noreferrer">
                <Camera className="mr-2 h-4 w-4" />
                Edited Photos
              </a>
            </Button>
          )}
          {/* Accept button in action bar (delivered but not closed) */}
          {isDelivered && !isClosed && !isRevisionInProgress && (
            <Button
              onClick={handleAcceptClose}
              disabled={accepting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ThumbsUp className="h-4 w-4 mr-2" />
              )}
              Accept & Download
            </Button>
          )}
          {/* Revision button — not during revision processing */}
          {!isRevisionInProgress && !isClosed && isDelivered && (
            <Button asChild variant="outline">
              <Link href={`/video/${orderId}/revise`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Request Revision
              </Link>
            </Button>
          )}
          {/* Paid revision after closing */}
          {isClosed && (
            <Button asChild variant="outline">
              <Link href={`/video/${orderId}/revise`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Request Paid Revision
              </Link>
            </Button>
          )}
        </div>

        {/* Order Details + Revisions */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h3 className="font-bold text-foreground">Order Details</h3>
            <div className="space-y-2 text-sm">
              {order.property_bedrooms && order.property_bathrooms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property</span>
                  <span className="text-foreground">{order.property_bedrooms} BD | {order.property_bathrooms} BA</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photos</span>
                <span className="text-foreground">{order.photo_count || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolution</span>
                <span className="text-foreground">{order.resolution || "768P"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orientation</span>
                <span className="text-foreground capitalize">{order.orientation || "landscape"}</span>
              </div>
              {order.include_edited_photos && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photo Editing</span>
                  <span className="text-green-600 font-medium">Included</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h3 className="font-bold text-foreground">Revisions</h3>
            {isRevisionInProgress ? (
              <>
                <div className="flex items-center gap-2 text-amber-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p className="text-sm font-semibold">Revision in progress</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your revision is being processed. You'll receive an email when the updated video is ready.
                </p>
              </>
            ) : isClosed ? (
              <>
                <p className="text-sm text-muted-foreground">
                  This order has been accepted and closed. You can still request <strong className="text-foreground">paid revisions</strong> if you need changes.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/video/${orderId}/revise`}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Request Paid Revision
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Every order includes <strong className="text-foreground">1 free revision</strong> within {REVIEW_WINDOW_DAYS} days of delivery. Use the revision tool to pick which clips you want redone.
                </p>
                <p className="text-sm text-muted-foreground">
                  We only regenerate the clips you flag — everything else stays the same.
                </p>
                {!freeRevisionUsed && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/video/${orderId}/revise`}>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Request Revision
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-muted/30 rounded-xl border border-border p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-bold text-foreground">Share Your Video</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {isClosed
              ? "Download your video and upload it to these platforms for maximum exposure:"
              : "Once you accept your video, download and share it on these platforms:"}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {["Instagram Reels", "TikTok", "Facebook / MLS Listing", "YouTube Shorts", "Zillow / Realtor.com", "Email Campaigns"].map((platform) => (
              <div key={platform} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" /> {platform}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link href="/order" className="group bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Play className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Create Another Video</h4>
              <p className="text-sm text-muted-foreground mt-1">Got another listing? Use code PHOTO15 for 15% off.</p>
            </div>
          </Link>
          <Link href="/resources/photography-guide" className="group bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Free Photography Guide</h4>
              <p className="text-sm text-muted-foreground mt-1">32-page guide with camera settings, lighting, staging, and drone tips.</p>
            </div>
          </Link>
        </div>

        {/* Referral */}
        <div className="bg-card rounded-xl border border-border p-6 text-center space-y-3">
          <h3 className="font-bold text-foreground">Know an agent who needs listing videos?</h3>
          <p className="text-sm text-muted-foreground">Share the love — send them to realestatephoto2video.com</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" size="sm">
              <a href="mailto:?subject=Check out this listing video service&body=I just got a professional walkthrough video for my listing at realestatephoto2video.com. They turn your photos into a cinematic video in 24 hours, starting at $79. Worth checking out!">
                <Mail className="mr-2 h-4 w-4" />
                Share via Email
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://wa.me/?text=I just got a professional listing video from realestatephoto2video.com — photos to cinematic video in 24 hours, starting at $79. Check it out!" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
