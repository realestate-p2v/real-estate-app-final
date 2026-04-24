"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { VideoPlayer, getDownloadUrl, isCloudinaryUrl, getVideoThumbnail } from "@/components/video-player";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Video, Download, RefreshCw, Clock, CheckCircle, Loader2, AlertCircle, Play, ExternalLink, Check, ThumbsUp } from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  status: string;
  customer_name: string;
  property_address: string;
  property_city: string;
  property_state: string;
  photo_count: number;
  resolution: string;
  orientation: string;
  delivery_url: string;
  edited_photos_url: string;
  total_price: number;
  created_at: string;
  include_edited_photos: boolean;
  clip_urls: any[];
  photos: any[];
  revision_count: number;
  revisions_allowed: number;
}

/* ─────────────────────────────────────────────
   Styles — matches the dashboard aesthetic
   ───────────────────────────────────────────── */
const mvStyles = `
  @keyframes mv-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mv-chip-in {
    from { opacity: 0; transform: translateY(10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .mv-animate {
    opacity: 0;
    animation: mv-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .mv-chip-animate {
    opacity: 0;
    animation: mv-chip-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* ── Font size bump — matches dashboard ── */
  .mv-root .text-\\[9px\\]  { font-size: 11px !important; }
  .mv-root .text-\\[10px\\] { font-size: 12px !important; }
  .mv-root .text-\\[11px\\] { font-size: 13px !important; }
  .mv-root .text-xs  { font-size: 14px !important; line-height: 1.55 !important; }
  .mv-root .text-sm  { font-size: 16px !important; line-height: 1.55 !important; }
  .mv-root .text-base { font-size: 18px !important; }
  .mv-root .text-lg  { font-size: 20px !important; }
  .mv-root .text-xl  { font-size: 23px !important; }
  .mv-root .text-2xl { font-size: 28px !important; }
  .mv-root .text-3xl { font-size: 34px !important; }
`;

/* ─────────────────────────────────────────────
   Status configuration — dark-mode tuned
   ───────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "Queued", color: "bg-blue-400/15 text-blue-300 border border-blue-400/25", icon: Clock },
  pending_payment: { label: "Awaiting Payment", color: "bg-amber-400/15 text-amber-300 border border-amber-400/25", icon: AlertCircle },
  processing: { label: "In Production", color: "bg-purple-400/15 text-purple-300 border border-purple-400/25", icon: Loader2 },
  awaiting_approval: { label: "In Review", color: "bg-indigo-400/15 text-indigo-300 border border-indigo-400/25", icon: Clock },
  approved: { label: "Delivered", color: "bg-green-400/15 text-green-300 border border-green-400/25", icon: CheckCircle },
  complete: { label: "Complete", color: "bg-green-400/15 text-green-300 border border-green-400/25", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-green-400/15 text-green-300 border border-green-400/25", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-white/[0.08] text-white/60 border border-white/[0.1]", icon: Check },
  revision_requested: { label: "Revision In Progress", color: "bg-amber-400/15 text-amber-300 border border-amber-400/25", icon: RefreshCw },
  client_revision_requested: { label: "Revision Submitted", color: "bg-amber-400/15 text-amber-300 border border-amber-400/25", icon: RefreshCw },
  error: { label: "Issue — Contact Support", color: "bg-red-400/15 text-red-300 border border-red-400/25", icon: AlertCircle },
};

// ── Thumbnail resolver ──
// Tries Cloudinary video thumbnail first, then falls back to first listing photo
function getOrderThumbnail(order: Order): string | null {
  // 1. Cloudinary video thumbnail
  if (order.delivery_url) {
    const cloudThumb = getVideoThumbnail(order.delivery_url);
    if (cloudThumb) return cloudThumb;
  }
  // 2. First listing photo as fallback
  if (order.photos && order.photos.length > 0) {
    const firstPhoto = order.photos[0];
    if (firstPhoto.secure_url) return firstPhoto.secure_url;
    if (firstPhoto.url) return firstPhoto.url;
  }
  return null;
}

// ── Thumbnail card component ──
function VideoThumbnail({ order }: { order: Order }) {
  const thumbnail = getOrderThumbnail(order);

  if (thumbnail) {
    return (
      <div className="aspect-video bg-black relative overflow-hidden">
        <img
          src={thumbnail}
          alt={order.property_address || "Video thumbnail"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
          <div className="h-14 w-14 rounded-full bg-[#C8202F]/90 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-[#C8202F]/30 ring-2 ring-white/20">
            <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(200,32,47,0.15) 0%, rgba(159,18,57,0.12) 50%, rgba(127,29,29,0.1) 100%)" }}>
      <Video className="h-10 w-10 text-white/25" />
    </div>
  );
}

export default function MyVideosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingOrder, setClosingOrder] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptClose = async (orderId: string) => {
    if (!confirm("Accept this video and close the order? You can still contact support after closing.")) return;
    setClosingOrder(orderId);
    try {
      await supabase
        .from("orders")
        .update({ status: "closed" })
        .eq("id", orderId);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: "closed" } : o));
    } catch (err) {
      console.error("Failed to close order:", err);
    } finally {
      setClosingOrder(null);
    }
  };

  const deliveredOrders = orders.filter(o => ["complete", "approved", "delivered"].includes(o.status));
  const closedOrders = orders.filter(o => o.status === "closed");
  const activeOrders = orders.filter(o => !["complete", "approved", "delivered", "closed", "pending_payment"].includes(o.status) && o.status !== "error");
  const pendingOrders = orders.filter(o => o.status === "pending_payment");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getOrderName = (order: Order) => {
    if (order.property_address) return order.property_address;
    if (order.property_city && order.property_state) return `${order.property_city}, ${order.property_state}`;
    return `Order ${(order.order_id || order.id).slice(0, 8)}`;
  };

  const canRevise = (order: Order) => {
    return ["complete", "approved", "delivered"].includes(order.status);
  };

  return (
    <div className="mv-root min-h-screen bg-gray-900">
      <Navigation />
      <style dangerouslySetInnerHTML={{ __html: mvStyles }} />

      {/* Background — radial gradients + grid overlay (matches dashboard) */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 15% 20%, rgba(200,32,47,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(159,18,57,0.05) 0%, transparent 60%)" }} />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(200,32,47,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(200,32,47,.15) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ═══ HEADER ═══ */}
        <div className="mv-animate mb-8" style={{ animationDelay: "0.05s" }}>
          <h1 className="text-3xl font-extrabold text-white">My Videos</h1>
          <p className="text-white/50 mt-1 text-sm">All your orders and delivered videos</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#C8202F]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="mv-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-12 text-center space-y-4" style={{ animationDelay: "0.1s" }}>
            <div className="h-16 w-16 rounded-2xl bg-[#C8202F]/10 ring-1 ring-[#C8202F]/20 flex items-center justify-center mx-auto">
              <Video className="h-8 w-8 text-[#C8202F]" />
            </div>
            <h2 className="text-xl font-bold text-white">No orders yet</h2>
            <p className="text-white/50">
              When you place your first order, your videos will appear here.
            </p>
            <Button asChild className="bg-[#C8202F] hover:bg-[#B01C29] text-white font-extrabold rounded-xl text-lg px-7 py-6 mt-4 shadow-lg shadow-[#C8202F]/25 hover:shadow-[#C8202F]/40 transition-shadow">
              <Link href="/order">Create My Listing Video</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ═══ ACTIVE ORDERS ═══ */}
            {activeOrders.length > 0 && (
              <div className="mv-animate" style={{ animationDelay: "0.1s" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#C8202F]" />
                  In Progress ({activeOrders.length})
                </h2>
                <div className="space-y-2.5">
                  {activeOrders.map((order, i) => {
                    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={order.id}
                        className="mv-chip-animate rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5 flex items-center justify-between gap-4 transition-all hover:border-[#C8202F]/20 hover:bg-white/[0.06]"
                        style={{ animationDelay: `${0.15 + i * 0.04}s` }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-11 w-11 rounded-xl bg-[#C8202F]/10 ring-1 ring-[#C8202F]/20 flex items-center justify-center flex-shrink-0">
                            <Video className="h-5 w-5 text-[#C8202F]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white truncate">{getOrderName(order)}</h3>
                            <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5 flex-wrap">
                              <span>{order.photo_count || 0} photos</span>
                              <span className="text-white/20">|</span>
                              <span>{order.resolution || "768P"}</span>
                              <span className="text-white/20">|</span>
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${status.color}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${order.status === "processing" ? "animate-spin" : ""}`} />
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ DELIVERED VIDEOS ═══ */}
            {deliveredOrders.length > 0 && (
              <div className="mv-animate" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Delivered ({deliveredOrders.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {deliveredOrders.map((order, i) => {
                    const hasUrl = !!order.delivery_url;
                    const hasClips = order.clip_urls && order.clip_urls.length > 0;
                    const revCount = order.revision_count || 0;
                    const revAllowed = order.revisions_allowed || 1;
                    const freeRevisionsLeft = Math.max(0, revAllowed - revCount);

                    return (
                      <div
                        key={order.id}
                        className="mv-chip-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all hover:border-[#C8202F]/20 hover:bg-white/[0.05]"
                        style={{ animationDelay: `${0.2 + i * 0.05}s` }}
                      >
                        <Link href={`/video/${order.order_id || order.id}`} className="block">
                          <VideoThumbnail order={order} />
                        </Link>
                        <div className="p-5 space-y-3">
                          <Link href={`/video/${order.order_id || order.id}`} className="block">
                            <h3 className="font-bold text-lg text-white hover:text-[#E84858] transition-colors">{getOrderName(order)}</h3>
                            <div className="flex items-center gap-3 text-xs text-white/50 mt-1 flex-wrap">
                              <span>{order.photo_count || 0} photos</span>
                              <span className="text-white/20">|</span>
                              <span>{order.resolution || "768P"}</span>
                              <span className="text-white/20">|</span>
                              <span className="capitalize">{order.orientation || "landscape"}</span>
                              <span className="text-white/20">|</span>
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                            {freeRevisionsLeft > 0 && (
                              <p className="text-xs text-green-400 font-semibold mt-1.5">
                                {freeRevisionsLeft} free revision{freeRevisionsLeft !== 1 ? "s" : ""} remaining
                              </p>
                            )}
                          </Link>
                          <div className="flex gap-2 flex-wrap">
                            {hasUrl && (
                              <Button asChild size="sm" className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/90 font-semibold">
                                <a href={getDownloadUrl(order.delivery_url)} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Download Video
                                </a>
                              </Button>
                            )}
                            {order.edited_photos_url && (
                              <Button asChild size="sm" className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/90 font-semibold">
                                <a href={order.edited_photos_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Edited Photos
                                </a>
                              </Button>
                            )}
                          </div>
                          {/* Revision + Accept buttons */}
                          {canRevise(order) && (
                            <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                              {hasClips ? (
                                <Button asChild size="sm" className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/90 font-semibold">
                                  <Link href={`/dashboard/video/${order.id}/revise`}>
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                    Request Revision
                                  </Link>
                                </Button>
                              ) : (
                                <Button asChild size="sm" className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/90 font-semibold">
                                  <Link href="/support">
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                    Request Revision (via Support)
                                  </Link>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleAcceptClose(order.id)}
                                disabled={closingOrder === order.id}
                                className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold"
                              >
                                {closingOrder === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                ) : (
                                  <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Accept & Close
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ CLOSED ORDERS ═══ */}
            {closedOrders.length > 0 && (
              <div className="mv-animate" style={{ animationDelay: "0.2s" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
                  <Check className="h-4 w-4 text-white/40" />
                  Closed ({closedOrders.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {closedOrders.map((order, i) => {
                    const hasUrl = !!order.delivery_url;
                    return (
                      <div
                        key={order.id}
                        className="mv-chip-animate rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm overflow-hidden opacity-75 hover:opacity-100 hover:border-[#C8202F]/20 hover:bg-white/[0.05] transition-all"
                        style={{ animationDelay: `${0.25 + i * 0.05}s` }}
                      >
                        <Link href={`/video/${order.order_id || order.id}`} className="block">
                          <VideoThumbnail order={order} />
                          <div className="p-5 pb-3">
                            <h3 className="font-bold text-lg text-white hover:text-[#E84858] transition-colors">{getOrderName(order)}</h3>
                            <div className="flex items-center gap-3 text-xs text-white/50 mt-1 flex-wrap">
                              <span>{formatDate(order.created_at)}</span>
                              <span className="text-white/20">|</span>
                              <span className="text-green-400 font-semibold">Accepted &amp; Closed</span>
                            </div>
                          </div>
                        </Link>
                        <div className="flex gap-2 px-5 pb-5 flex-wrap">
                          <Button asChild size="sm" className="bg-[#C8202F] hover:bg-[#B01C29] text-white font-bold">
                            <Link href={`/video/${order.order_id || order.id}`}>
                              <Play className="mr-1.5 h-3.5 w-3.5" />
                              View Video
                            </Link>
                          </Button>
                          {hasUrl && (
                            <Button asChild size="sm" className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/90 font-semibold">
                              <a href={getDownloadUrl(order.delivery_url)} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Download
                              </a>
                            </Button>
                          )}
                          <Button asChild size="sm" className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/90 font-semibold">
                            <Link href={`/video/${order.order_id || order.id}/revise`}>
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Paid Revision
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ PENDING PAYMENT ═══ */}
            {pendingOrders.length > 0 && (
              <div className="mv-animate" style={{ animationDelay: "0.25s" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Awaiting Payment ({pendingOrders.length})
                </h2>
                <div className="space-y-2.5">
                  {pendingOrders.map((order, i) => (
                    <div
                      key={order.id}
                      className="mv-chip-animate rounded-xl border border-amber-400/20 bg-amber-400/[0.04] backdrop-blur-sm p-5 flex items-center justify-between gap-4"
                      style={{ animationDelay: `${0.3 + i * 0.04}s` }}
                    >
                      <div className="min-w-0">
                        <h3 className="font-bold text-white truncate">{getOrderName(order)}</h3>
                        <p className="text-xs text-white/50 mt-0.5">{formatDate(order.created_at)} — ${order.total_price}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/25 flex-shrink-0">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Awaiting Payment
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-white/[0.04] pt-6 pb-8 text-center">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/lens" className="text-xs text-white/25 hover:text-white/50 transition-colors">P2V Lens</Link>
            <Link href="/support" className="text-xs text-white/25 hover:text-white/50 transition-colors">Support</Link>
            <Link href="/portfolio" className="text-xs text-white/25 hover:text-white/50 transition-colors">Portfolio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
