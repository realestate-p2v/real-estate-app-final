"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { VideoPlayer, getDownloadUrl, getClipPlaybackUrl, getVideoThumbnail, isCloudinaryUrl } from "@/components/video-player";
import { ReviewRewardFlow } from "@/components/review-reward-flow";
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
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_bedrooms: string;
  property_bathrooms: string;
  photo_count: number;
  resolution: string;
  orientation: string;
  delivery_url: string;
  unbranded_delivery_url: string;
  additional_video_urls: Record<string, string>;
  edited_photos_url: string;
  created_at: string;
  delivered_at: string;
  include_edited_photos: boolean;
  revision_count: number;
  revisions_allowed: number;
  clip_urls: any[];
  is_quick_video: boolean;
}

function getAllVideos(order: Order): { label: string; url: string }[] {
  const videos: { label: string; url: string }[] = [];
  if (order.delivery_url) {
    const hasMultiple = order.additional_video_urls && Object.keys(order.additional_video_urls).length > 0;
    videos.push({ label: hasMultiple ? "Landscape (Branded)" : "Your Video", url: order.delivery_url });
  }
  if (order.additional_video_urls) {
    Object.entries(order.additional_video_urls).forEach(([key, url]) => {
      const parts = key.split("_");
      const orient = (parts[0] || "").charAt(0).toUpperCase() + (parts[0] || "").slice(1);
      const brand = (parts[1] || "").charAt(0).toUpperCase() + (parts[1] || "").slice(1);
      videos.push({ label: `${orient} (${brand})`, url });
    });
  }
  return videos;
}

function MultiVideoPlayer({ videos, isClosed }: { videos: { label: string; url: string }[]; isClosed: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeVideo = videos[activeIdx];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        {videos.map((v, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeIdx === i
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <Play className="inline h-3.5 w-3.5 mr-1.5" />
            {v.label}
          </button>
        ))}
      </div>

      {activeVideo?.url ? (
        <VideoPlayer key={activeIdx} url={activeVideo.url} className="aspect-video" />
      ) : null}

      {isClosed && (
        <div className="flex flex-wrap gap-2">
          {videos.map((v, i) => (
            <a
              key={i}
              href={getDownloadUrl(v.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors"
            >
              <Download className="h-3 w-3" />
              Download {v.label}
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {videos.length} video versions available. Click the tabs above to preview each version.
      </p>
    </div>
  );
}

// ── Individual Clip Player for review ──
function ClipPreviewPlayer({ clip, index }: { clip: any; index: number }) {
  const playbackUrl = getClipPlaybackUrl(clip);

  if (!playbackUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <Play className="h-6 w-6 text-muted-foreground/40" />
      </div>
    );
  }

  return <VideoPlayer url={playbackUrl} className="aspect-video" />;
}

function ClipReviewSection({ clips, orderId }: { clips: any[]; orderId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  if (!clips || clips.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Camera className="h-5 w-5 text-primary" />
          <div className="text-left">
            <h3 className="font-bold text-foreground">Review Individual Clips</h3>
            <p className="text-sm text-muted-foreground">{clips.length} clips — watch each one to check for issues</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border p-5 space-y-4">
          {/* Clip selector tabs */}
          <div className="flex flex-wrap gap-1.5">
            {clips.map((clip, i) => (
              <button
                key={i}
                onClick={() => setActiveClipIndex(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeClipIndex === i
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                Clip {(clip.position || i + 1)}
              </button>
            ))}
          </div>

          {/* Active clip player */}
          <div className="max-w-3xl">
            <ClipPreviewPlayer clip={clips[activeClipIndex]} index={activeClipIndex} />
          </div>

          {/* Clip description */}
          {clips[activeClipIndex]?.description && (
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Shot {clips[activeClipIndex].position || activeClipIndex + 1}:</strong>{" "}
              {clips[activeClipIndex].description}
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveClipIndex(Math.max(0, activeClipIndex - 1))}
              disabled={activeClipIndex === 0}
            >
              ← Previous Clip
            </Button>
            <span className="text-sm text-muted-foreground">
              {activeClipIndex + 1} of {clips.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveClipIndex(Math.min(clips.length - 1, activeClipIndex + 1))}
              disabled={activeClipIndex === clips.length - 1}
            >
              Next Clip →
            </Button>
          </div>

          {/* CTA to revise */}
          <div className="pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              See something that needs fixing? Mark specific clips for revision.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/video/${orderId}/revise`}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Open Revision Tool
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [accepting, setAccepting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof getTimeRemaining> | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [isLensSubscriber, setIsLensSubscriber] = useState(false);

  // Get user ID + subscription status for review flow and upsell
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data } = await supabase
            .from("lens_usage")
            .select("is_subscriber")
            .eq("user_id", user.id)
            .single();
          if (data?.is_subscriber) setIsLensSubscriber(true);
        }
      } catch {}
    };
    getUser();
  }, []);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order?.delivered_at) return;
    if (order.status === "closed") return;

    const update = () => setTimeRemaining(getTimeRemaining(order.delivered_at));
    update();
    const interval = setInterval(update, 60000);
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

  const allVideos = getAllVideos(order);
  const hasMultipleVideos = allVideos.length > 1;
  const hasDeliveryUrl = !!order.delivery_url;
  const hasClips = order.clip_urls && order.clip_urls.length > 0;
  const isDelivered = DELIVERED_STATUSES.includes(order.status);
  const isClosed = order.status === "closed";
  const isRevisionInProgress = REVISION_IN_PROGRESS_STATUSES.includes(order.status);
  const statusInfo = STATUS_DISPLAY[order.status];
  const isQuickVideo = !!order.is_quick_video;

  const hasDeliveredAt = !!order.delivered_at;
  const reviewWindowExpired = timeRemaining?.expired ?? false;
  const freeRevisionUsed = (order.revision_count || 0) >= (order.revisions_allowed || 1);
  // Quick videos never get free revisions
  const canRequestFreeRevision = !isQuickVideo && isDelivered && !isClosed && !isRevisionInProgress && !freeRevisionUsed && !reviewWindowExpired;
  const canRequestPaidRevision = (isClosed || reviewWindowExpired || isQuickVideo) && !isRevisionInProgress;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{getOrderName()}</h1>
            <p className="text-muted-foreground mt-1">
              {isDelivered ? `Delivered ${formatDate(order.delivered_at || order.created_at)}` : `Ordered ${formatDate(order.created_at)}`}
              {hasMultipleVideos && ` · ${allVideos.length} video versions`}
              {isQuickVideo && (
                <span className="ml-2 text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded-full align-middle">QUICK VIDEO</span>
              )}
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

        {/* Revision In Progress Banner */}
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

        {/* 5-Day Review Window Countdown — NOT shown for Quick Videos */}
        {!isQuickVideo && isDelivered && !isClosed && !isRevisionInProgress && hasDeliveredAt && timeRemaining && (
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="font-bold text-foreground">Review your video</h3>
                    <span className={`text-sm font-bold flex-shrink-0 ${timeRemaining.days <= 1 ? "text-amber-700" : "text-blue-700"}`}>
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
               <div className="flex flex-col sm:flex-row gap-2 mt-3">
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

        {/* Quick Video — paid revisions only banner */}
        {isQuickVideo && isDelivered && !isClosed && !isRevisionInProgress && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">Subscriber Quick Video</h3>
                <p className="text-sm text-muted-foreground">
                  Quick Video orders include paid revisions only.
                  Request a revision anytime — pricing starts at $1.99/clip.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/video/${orderId}/revise`}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Request Paid Revision
                    </Link>
                  </Button>
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

        {/* Review Reward Flow — shows after customer has closed/accepted */}
        {isClosed && userId && (
          <ReviewRewardFlow
            orderId={orderId}
            userEmail={order.customer_email || ""}
            userId={userId}
          />
        )}

        {/* ═══ VIDEO PLAYER — single or multi-version ═══ */}
        {hasMultipleVideos ? (
          <MultiVideoPlayer videos={allVideos} isClosed={isClosed} />
        ) : hasDeliveryUrl ? (
          <div className="mb-6">
            <VideoPlayer url={order.delivery_url} className="aspect-video" />
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center mb-6">
            <div className="text-center space-y-2">
              <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">Video is being processed...</p>
            </div>
          </div>
        )}

        {/* ═══ INDIVIDUAL CLIP REVIEW ═══ */}
        {hasClips && isDelivered && (
          <ClipReviewSection clips={order.clip_urls} orderId={orderId} />
        )}

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {/* Single video download (only when no multiple versions) */}
          {isClosed && order.delivery_url && !hasMultipleVideos && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href={getDownloadUrl(order.delivery_url)} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </a>
            </Button>
          )}
          
          {/* Edited photos */}
          {isClosed && order.edited_photos_url && (
            <Button asChild variant="outline">
              <a href={order.edited_photos_url} target="_blank" rel="noopener noreferrer">
                <Camera className="mr-2 h-4 w-4" />
                Edited Photos
              </a>
            </Button>
          )}

          {/* Accept button (delivered but not closed, non-quick-video) */}
          {isDelivered && !isClosed && !isRevisionInProgress && !isQuickVideo && (
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

          {/* Free revision button — not for quick videos, not during revision processing */}
          {!isQuickVideo && !isRevisionInProgress && !isClosed && isDelivered && (
            <Button asChild variant="outline">
              <Link href={`/video/${orderId}/revise`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Request Revision
              </Link>
            </Button>
          )}

          {/* Paid revision after closing OR for quick videos */}
          {(isClosed || (isQuickVideo && isDelivered && !isRevisionInProgress)) && (
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
              {isQuickVideo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Type</span>
                  <span className="text-cyan-600 font-medium">Quick Video</span>
                </div>
              )}
              {hasMultipleVideos && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Video Versions</span>
                  <span className="text-foreground">{allVideos.length} versions</span>
                </div>
              )}
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
            ) : isQuickVideo ? (
              <>
                <p className="text-sm text-muted-foreground">
                  This is a Subscriber Quick Video. Paid revisions are available at standard rates.
                  We only regenerate the clips you flag — everything else stays the same.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/video/${orderId}/revise`}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Request Paid Revision
                  </Link>
                </Button>
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

        {/* Lens Upsell — non-subscribers only */}
        {!isLensSubscriber && isDelivered && (
          <Link href="/lens" className="block mb-8">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-lg">Save on your next video with P2V Lens</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Subscribers get 10% off every video order, per-clip Quick Videos from $24.75, AI photo coaching, marketing design tools, and priority 12-hour delivery — all for $27.95/mo.
                  </p>
                  <p className="text-sm font-bold text-cyan-700 mt-2">
                    See what&apos;s included →
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

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
