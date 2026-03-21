"use client"; 

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Play,
  Video,
  Eye,
  Send,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
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
  photo_count: number;
  resolution: string;
  orientation: string;
  delivery_url: string;
  unbranded_delivery_url: string;
  additional_video_urls: Record<string, string>;
  total_price: number;
  created_at: string;
  revision_count: number;
  revisions_allowed: number;
  revision_notes: string;
  client_revision_notes: any[];
  clip_urls: any[];
  telegram_message_id: number;
}

interface RevisionRequest {
  id: string;
  order_id: string;
  revision_number: number;
  is_paid: boolean;
  payment_amount: number;
  status: string;
  clips: any[];
  notes: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  pending: "bg-blue-100 text-blue-700",
  pending_payment: "bg-gray-100 text-gray-600",
  processing: "bg-purple-100 text-purple-700",
  awaiting_approval: "bg-indigo-100 text-indigo-700",
  approved: "bg-green-100 text-green-700",
  complete: "bg-green-100 text-green-700",
  delivered: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
  client_revision_requested: "bg-amber-100 text-amber-700",
  revision_requested: "bg-orange-100 text-orange-700",
  error: "bg-red-100 text-red-700",
};

function getFileIdFromUrl(url: string): string | null {
  const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function getAllVideos(order: Order): { label: string; url: string }[] {
  const videos: { label: string; url: string }[] = [];
  if (order.delivery_url) {
    const hasMultiple = order.additional_video_urls && Object.keys(order.additional_video_urls).length > 0;
    videos.push({ label: hasMultiple ? "Landscape (Branded)" : "Final Video", url: order.delivery_url });
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [revisions, setRevisions] = useState<RevisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("action_needed");
  const [manualDeliveryUrl, setManualDeliveryUrl] = useState<Record<string, string>>({});
  const [activeVideoIdx, setActiveVideoIdx] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, revisionsRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/orders?type=revisions"),
      ]);
      const ordersData = await ordersRes.json();
      const revisionsData = await revisionsRes.json();
      if (ordersData.orders) setOrders(ordersData.orders);
      if (revisionsData.revisions) setRevisions(revisionsData.revisions);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        // Refresh data after a short delay to catch pipeline delivery
        if (newStatus === "approved") {
          setTimeout(() => fetchData(), 5000);
        }
      }
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const getAddress = (o: Order) =>
    o.property_address || (o.property_city && o.property_state ? `${o.property_city}, ${o.property_state}` : `Order ${o.id.slice(0, 8)}`);

  const revisionRequests = orders.filter(o => o.status === "client_revision_requested");
  const awaitingApproval = orders.filter(o => o.status === "awaiting_approval");
  const newOrders = orders.filter(o => ["new", "pending"].includes(o.status));
  const inProduction = orders.filter(o => o.status === "processing");
  const delivered = orders.filter(o => ["approved", "complete", "delivered"].includes(o.status));
  const closed = orders.filter(o => o.status === "closed");
  const errors = orders.filter(o => o.status === "error");

  const actionNeededCount = revisionRequests.length + awaitingApproval.length + newOrders.length + errors.length;

  const getFilteredOrders = () => {
    switch (filter) {
      case "action_needed": return [...revisionRequests, ...awaitingApproval, ...newOrders, ...errors];
      case "in_production": return inProduction;
      case "delivered": return delivered;
      case "closed": return closed;
      case "all": return orders;
      default: return orders;
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
            <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "action_needed", label: "Action Needed", count: actionNeededCount, color: "text-red-600" },
            { key: "in_production", label: "In Production", count: inProduction.length, color: "text-purple-600" },
            { key: "delivered", label: "Delivered", count: delivered.length, color: "text-green-600" },
            { key: "closed", label: "Closed", count: closed.length, color: "text-gray-500" },
            { key: "all", label: "All", count: orders.length, color: "text-foreground" },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                filter === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {label} <span className={`ml-1 ${filter === key ? "text-primary" : color}`}>({count})</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {getFilteredOrders().length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No orders in this category</p>
            </div>
          ) : (
            getFilteredOrders().map((order) => {
              const isExpanded = expandedOrder === order.id;
              const isRevisionRequest = order.status === "client_revision_requested";
              const isAwaitingApproval = order.status === "awaiting_approval";
              const isError = order.status === "error";
              const isProcessing = actionLoading === order.id;
              const orderRevisions = revisions.filter(r => r.order_id === order.id);
              const latestRevision = orderRevisions[0];
              const allVideos = getAllVideos(order);
              const currentVideoIdx = activeVideoIdx[order.id] || 0;
              const currentVideo = allVideos[currentVideoIdx];
              const currentFileId = currentVideo ? getFileIdFromUrl(currentVideo.url) : null;

              return (
                <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      isRevisionRequest ? "bg-amber-500" :
                      isAwaitingApproval ? "bg-indigo-500" :
                      isError ? "bg-red-500" :
                      order.status === "processing" ? "bg-purple-500 animate-pulse" :
                      ["approved", "complete", "delivered"].includes(order.status) ? "bg-green-500" :
                      "bg-blue-500"
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{getAddress(order)}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {allVideos.length > 1 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {allVideos.length} versions
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{order.customer_name}</span>
                        <span>·</span>
                        <span>{order.photo_count} photos</span>
                        <span>·</span>
                        <span>{order.resolution}</span>
                        <span>·</span>
                        <span>${order.total_price}</span>
                        <span>·</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    {isRevisionRequest && (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Revision
                      </span>
                    )}
                    {isAwaitingApproval && (
                      <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Review
                      </span>
                    )}

                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Customer</p>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-muted-foreground">{order.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Order Details</p>
                          <p className="font-medium">{order.photo_count} photos · {order.resolution} · {order.orientation}</p>
                          <p className="text-muted-foreground">Revisions: {order.revision_count || 0}/{order.revisions_allowed || 1} free used</p>
                        </div>
                      </div>

                      {/* ═══ MULTI-VIDEO PREVIEW ═══ */}
                      {allVideos.length > 0 && (
                        <div className="space-y-3">
                          {/* Video version tabs */}
                          {allVideos.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                              {allVideos.map((v, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveVideoIdx({ ...activeVideoIdx, [order.id]: idx })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    currentVideoIdx === idx
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground hover:border-primary/30"
                                  }`}
                                >
                                  <Play className="inline h-3 w-3 mr-1" />
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Active video player */}
                          {currentFileId && (
                            <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-xl">
                              <iframe
                                key={currentFileId}
                                src={`https://drive.google.com/file/d/${currentFileId}/preview`}
                                className="w-full h-full border-0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                              />
                            </div>
                          )}

                          {/* Drive links for all versions */}
                          <div className="flex flex-wrap gap-2">
                            {allVideos.map((v, idx) => (
                              <a key={idx} href={v.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                <ExternalLink className="h-3 w-3" /> {v.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Revision Details */}
                      {latestRevision && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Revision #{latestRevision.revision_number} — {latestRevision.clips?.length || 0} clip(s)
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              latestRevision.status === "complete" ? "bg-green-100 text-green-700" :
                              latestRevision.status === "processing" ? "bg-purple-100 text-purple-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{latestRevision.status}</span>
                          </h4>
                          {latestRevision.notes && (
                            <p className="text-sm text-amber-700 mb-2">Customer notes: &ldquo;{latestRevision.notes}&rdquo;</p>
                          )}
                          <div className="space-y-3">
                            {(order.client_revision_notes || latestRevision.clips || []).map((clip: any, i: number) => (
                              <div key={i} className="bg-white rounded-lg p-3 text-sm">
                                <div className="flex items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-foreground">Clip {clip.position}</span>
                                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                        clip.action === "remove" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                      }`}>
                                        {clip.action}
                                      </span>
                                    </div>
                                    {clip.camera_direction && (
                                      <p className="text-xs text-muted-foreground">Requested: <span className="font-semibold text-foreground">{clip.camera_direction}</span>{clip.camera_speed ? ` · ${clip.camera_speed}` : ""}</p>
                                    )}
                                    {clip.problem_description && (
                                      <p className="text-muted-foreground italic mt-1">&ldquo;{clip.problem_description}&rdquo;</p>
                                    )}
                                    {clip.custom_motion && (
                                      <p className="text-xs text-muted-foreground mt-1">Custom motion: &ldquo;{clip.custom_motion}&rdquo;</p>
                                    )}
                                  </div>

                                  {clip.action !== "remove" && (isRevisionRequest || isAwaitingApproval) && (
                                    <div className="flex-shrink-0 w-52 space-y-2 border-l border-border pl-3">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Admin Override</p>
                                      <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Direction</p>
                                        <select
                                          value={clip.camera_direction || ""}
                                          onChange={(e) => {
                                            const source = order.client_revision_notes || latestRevision.clips || [];
                                            const updated = source.map((c: any, idx: number) => idx === i ? { ...c, camera_direction: e.target.value } : c);
                                            setOrders(orders.map(o => o.id === order.id ? { ...o, client_revision_notes: updated } : o));
                                          }}
                                          className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white"
                                        >
                                          <option value="">Auto</option>
                                          <option value="push_in">Fwd</option>
                                          <option value="pull_back">Back</option>
                                          <option value="diagonal_top_left">Fwd + L</option>
                                          <option value="diagonal_top_right">Fwd + R</option>
                                          <option value="diagonal_bottom_left">Back + L</option>
                                          <option value="diagonal_bottom_right">Back + R</option>
                                          <option value="tilt_up">Look Up</option>
                                          <option value="tilt_down">Look Down</option>
                                          <option value="orbit_left">Orbit L</option>
                                          <option value="orbit_right">Orbit R</option>
                                          <option value="rise">Rise</option>
                                          <option value="bring_to_life">Bring to Life</option>
                                        </select>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Speed</p>
                                        <select
                                          value={clip.camera_speed || ""}
                                          onChange={(e) => {
                                            const source = order.client_revision_notes || latestRevision.clips || [];
                                            const updated = source.map((c: any, idx: number) => idx === i ? { ...c, camera_speed: e.target.value } : c);
                                            setOrders(orders.map(o => o.id === order.id ? { ...o, client_revision_notes: updated } : o));
                                          }}
                                          className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white"
                                        >
                                          <option value="">Default</option>
                                          <option value="slow">Slow</option>
                                          <option value="medium">Medium</option>
                                        </select>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                                          {clip.camera_direction === "bring_to_life" ? "Action Prompt" : "Custom Motion"}
                                        </p>
                                        <input
                                          type="text"
                                          value={clip.custom_motion || ""}
                                          onChange={(e) => {
                                            const source = order.client_revision_notes || latestRevision.clips || [];
                                            const updated = source.map((c: any, idx: number) => idx === i ? { ...c, custom_motion: e.target.value } : c);
                                            setOrders(orders.map(o => o.id === order.id ? { ...o, client_revision_notes: updated } : o));
                                          }}
                                          placeholder={clip.camera_direction === "bring_to_life" ? "e.g. Dog jumps excitedly" : "e.g. Slow zoom into fireplace"}
                                          maxLength={80}
                                          className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {(isRevisionRequest || isAwaitingApproval) && (
                            <div className="mt-3 pt-3 border-t border-amber-200 flex gap-2">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  setActionLoading(order.id);
                                  try {
                                    const res = await fetch("/api/admin/orders", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        orderId: order.id,
                                        status: "revision_requested",
                                        clientRevisionNotes: order.client_revision_notes,
                                      }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setOrders(orders.map(o => o.id === order.id ? { ...o, status: "revision_requested" } : o));
                                    }
                                  } catch (err) {
                                    console.error("Failed to save:", err);
                                  } finally {
                                    setActionLoading(null);
                                  }
                                }}
                                disabled={actionLoading === order.id}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                )}
                                Save & Reprocess
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`mailto:${order.customer_email}?subject=Re: Revision for ${getAddress(order)}`)}
                              >
                                <Send className="h-4 w-4 mr-1" /> Email Customer
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {isError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm text-red-700 font-semibold">This order errored during processing.</p>
                          <p className="text-xs text-red-600 mt-1">Check the pipeline logs for details. You can retry by setting status back to &ldquo;new&rdquo;.</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {isAwaitingApproval && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, "approved")}
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                              Approve & Deliver{allVideos.length > 1 ? ` (${allVideos.length} versions)` : ""}
                            </Button>
                            <div className="flex items-center gap-2">
                              <select
                                value={(order as any).revision_orientations || "both"}
                                onChange={(e) => {
                                  setOrders(orders.map(o => o.id === order.id ? { ...o, revision_orientations: e.target.value } as any : o));
                                }}
                                className="text-xs border rounded-lg px-2 py-1.5 bg-white"
                              >
                                <option value="both">Revise Both Orientations</option>
                                <option value="landscape">Revise Landscape Only</option>
                                <option value="vertical">Revise Vertical Only</option>
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  setActionLoading(order.id);
                                  try {
                                    const res = await fetch("/api/admin/orders", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        orderId: order.id,
                                        status: "revision_requested",
                                        revisionOrientations: (order as any).revision_orientations || "both",
                                      }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setOrders(orders.map(o => o.id === order.id ? { ...o, status: "revision_requested" } : o));
                                    }
                                  } catch (err) {
                                    console.error("Failed:", err);
                                  } finally {
                                    setActionLoading(null);
                                  }
                                }}
                                disabled={isProcessing}
                                className="text-amber-600 border-amber-200"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" /> Request My Revision
                              </Button>
                            </div>
                          </>
                        )}

                        {isRevisionRequest && (
                          <>
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> Pipeline will process revision automatically
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`mailto:${order.customer_email}?subject=Re: Revision for ${getAddress(order)}`)}
                            >
                              <Send className="h-4 w-4 mr-1" /> Email Customer
                            </Button>
                          </>
                        )}

                        {isError && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, "new")}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                            Retry Order
                          </Button>
                        )}

                        {["new", "pending"].includes(order.status) && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Queued — pipeline will pick up automatically
                          </span>
                        )}

                        {order.status === "processing" && (
                          <span className="text-xs text-purple-600 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Pipeline processing...
                          </span>
                        )}
                      </div>

                      {/* Manual Delivery Override */}
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">MANUAL DELIVERY</p>
                        <p className="text-xs text-muted-foreground mb-2">Paste a Google Drive link to deliver manually (bypasses pipeline).</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualDeliveryUrl[order.id] || ""}
                            onChange={(e) => setManualDeliveryUrl({ ...manualDeliveryUrl, [order.id]: e.target.value })}
                            placeholder="https://drive.google.com/file/d/... or folder link"
                            className="flex-1 text-xs border rounded-lg px-3 py-2 bg-white"
                          />
                          <Button
                            size="sm"
                            onClick={async () => {
                              const url = manualDeliveryUrl[order.id];
                              if (!url || !url.includes("drive.google.com")) {
                                alert("Please paste a valid Google Drive link");
                                return;
                              }
                              setActionLoading(order.id);
                              try {
                                const res = await fetch("/api/admin/orders", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    orderId: order.id,
                                    status: "approved",
                                    deliveryUrl: url,
                                  }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  setOrders(orders.map(o => o.id === order.id ? { ...o, status: "approved", delivery_url: url } : o));
                                  setManualDeliveryUrl({ ...manualDeliveryUrl, [order.id]: "" });
                                }
                              } catch (err) {
                                console.error("Failed to deliver:", err);
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={actionLoading === order.id || !manualDeliveryUrl[order.id]}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {actionLoading === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><Truck className="h-4 w-4 mr-1" /> Deliver</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
