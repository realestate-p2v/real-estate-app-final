"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
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
  revision_count: number;
  revisions_allowed: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "Queued", color: "bg-blue-100 text-blue-700", icon: Clock },
  pending_payment: { label: "Awaiting Payment", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  processing: { label: "In Production", color: "bg-purple-100 text-purple-700", icon: Loader2 },
  awaiting_approval: { label: "In Review", color: "bg-indigo-100 text-indigo-700", icon: Clock },
  approved: { label: "Delivered", color: "bg-green-100 text-green-700", icon: CheckCircle },
  complete: { label: "Complete", color: "bg-green-100 text-green-700", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: Check },
  revision_requested: { label: "Revision In Progress", color: "bg-amber-100 text-amber-700", icon: RefreshCw },
  client_revision_requested: { label: "Revision Submitted", color: "bg-amber-100 text-amber-700", icon: RefreshCw },
  error: { label: "Issue — Contact Support", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

function getFileIdFromUrl(url: string): string | null {
  const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
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
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Videos</h1>
            <p className="text-muted-foreground mt-1">All your orders and delivered videos</p>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/order">
              <Play className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-4">
            <Video className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
            <p className="text-muted-foreground">
              When you place your first order, your videos will appear here.
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90 mt-4">
              <Link href="/order">Create My Listing Video</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  In Progress ({activeOrders.length})
                </h2>
                <div className="space-y-4">
                  {activeOrders.map((order) => {
                    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                    const StatusIcon = status.icon;
                    return (
                      <div key={order.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Video className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{getOrderName(order)}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
                              <span>{order.photo_count || 0} photos</span>
                              <span className="text-muted-foreground/30">|</span>
                              <span>{order.resolution || "768P"}</span>
                              <span className="text-muted-foreground/30">|</span>
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${status.color}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${order.status === "processing" ? "animate-spin" : ""}`} />
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivered Videos */}
            {deliveredOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Delivered ({deliveredOrders.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {deliveredOrders.map((order) => {
                    const fileId = getFileIdFromUrl(order.delivery_url);
                    const hasClips = order.clip_urls && order.clip_urls.length > 0;
                    const revCount = order.revision_count || 0;
                    const revAllowed = order.revisions_allowed || 1;
                    const freeRevisionsLeft = Math.max(0, revAllowed - revCount);

                    return (
                      <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                        {fileId ? (
                          <div className="aspect-video bg-black">
                            <iframe
                              src={`https://drive.google.com/file/d/${fileId}/preview`}
                              className="w-full h-full border-0"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <Video className="h-10 w-10 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="p-5 space-y-3">
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{getOrderName(order)}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                              <span>{order.photo_count || 0} photos</span>
                              <span className="text-muted-foreground/30">|</span>
                              <span>{order.resolution || "768P"}</span>
                              <span className="text-muted-foreground/30">|</span>
                              <span className="capitalize">{order.orientation || "landscape"}</span>
                              <span className="text-muted-foreground/30">|</span>
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                            {freeRevisionsLeft > 0 && (
                              <p className="text-xs text-green-600 font-medium mt-1">
                                {freeRevisionsLeft} free revision{freeRevisionsLeft !== 1 ? "s" : ""} remaining
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {order.delivery_url && (
                              <Button asChild size="sm" variant="outline">
                                <a href={order.delivery_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                  Open in Drive
                                </a>
                              </Button>
                            )}
                            {fileId && (
                              <Button asChild size="sm" variant="outline">
                                <a href={`https://drive.google.com/uc?export=download&id=${fileId}`}>
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Download Video
                                </a>
                              </Button>
                            )}
                            {order.edited_photos_url && (
                              <Button asChild size="sm" variant="outline">
                                <a href={order.edited_photos_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Edited Photos
                                </a>
                              </Button>
                            )}
                          </div>
                          {/* Revision + Accept buttons */}
                          {canRevise(order) && (
                            <div className="flex gap-2 pt-2 border-t border-border">
                              {hasClips ? (
                                <Button asChild size="sm" variant="outline" className="flex-1">
                                  <Link href={`/dashboard/video/${order.id}/revise`}>
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                    Request Revision
                                  </Link>
                                </Button>
                              ) : (
                                <Button asChild size="sm" variant="outline" className="flex-1">
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
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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

            {/* Closed Orders */}
            {closedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-gray-500" />
                  Closed ({closedOrders.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {closedOrders.map((order) => {
                    const fileId = getFileIdFromUrl(order.delivery_url);
                    return (
                      <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden opacity-75">
                        {fileId ? (
                          <div className="aspect-video bg-black">
                            <iframe
                              src={`https://drive.google.com/file/d/${fileId}/preview`}
                              className="w-full h-full border-0"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <Video className="h-10 w-10 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-foreground">{getOrderName(order)}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                            <span>{formatDate(order.created_at)}</span>
                            <span className="text-muted-foreground/30">|</span>
                            <span className="text-green-600 font-medium">Accepted & Closed</span>
                          </div>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {order.delivery_url && (
                              <Button asChild size="sm" variant="outline">
                                <a href={order.delivery_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                  Open in Drive
                                </a>
                              </Button>
                            )}
                            {fileId && (
                              <Button asChild size="sm" variant="outline">
                                <a href={`https://drive.google.com/uc?export=download&id=${fileId}`}>
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Download Video
                                </a>
                              </Button>
                            )}
                          </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending Payment */}
            {pendingOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Awaiting Payment ({pendingOrders.length})
                </h2>
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="bg-card rounded-xl border border-amber-200 p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{getOrderName(order)}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{formatDate(order.created_at)} — ${order.total_price}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex-shrink-0">
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
      </div>

      <Footer />
    </div>
  );
}
