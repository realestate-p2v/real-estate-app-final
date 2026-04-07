"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Bell, ArrowLeft, Loader2, CheckCircle, Video, DollarSign,
  Users, Mail, ShoppingCart, Star, RefreshCw, ExternalLink,
  MessageSquare, X, Phone, User,
} from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  order_ready: { icon: Video, color: "bg-green-100 text-green-600" },
  order_confirmed: { icon: ShoppingCart, color: "bg-blue-100 text-blue-600" },
  order_closed: { icon: CheckCircle, color: "bg-muted text-muted-foreground" },
  revision_complete: { icon: RefreshCw, color: "bg-amber-100 text-amber-600" },
  referral_order: { icon: DollarSign, color: "bg-green-100 text-green-600" },
  referral_signup: { icon: Users, color: "bg-purple-100 text-purple-600" },
  referral_payout: { icon: DollarSign, color: "bg-green-100 text-green-600" },
  directory_inquiry: { icon: Mail, color: "bg-blue-100 text-blue-600" },
  showing_request: { icon: MessageSquare, color: "bg-emerald-100 text-emerald-600" },
  booking: { icon: Bell, color: "bg-green-100 text-green-600" },
  review_approved: { icon: Star, color: "bg-amber-100 text-amber-600" },
  welcome: { icon: Bell, color: "bg-primary/10 text-primary" },
  payment_success: { icon: ShoppingCart, color: "bg-green-100 text-green-600" },
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [modalNotification, setModalNotification] = useState<Notification | null>(null);
  
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notification_id: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {} finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

      {/* Inquiry Detail Modal */}
      {modalNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setModalNotification(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{modalNotification.title}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(modalNotification.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setModalNotification(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalNotification.message && (() => {
              const lines = modalNotification.message.split("\n");
              const contactLines = lines.filter(l => l.startsWith("From:") || l.startsWith("Email:") || l.startsWith("Phone:"));
              const messageLines = lines.filter(l => !l.startsWith("From:") && !l.startsWith("Email:") && !l.startsWith("Phone:") && l.trim() !== "");
              return (
                <div className="space-y-4">
                  {contactLines.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                      {contactLines.map((line, i) => {
                        const [label, ...rest] = line.split(":");
                        const value = rest.join(":").trim();
                        const IconEl = label === "From" ? User : label === "Email" ? Mail : label === "Phone" ? Phone : User;
                        return (
                          <div key={i} className="flex items-center gap-2.5">
                            <IconEl className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs font-semibold text-muted-foreground w-12">{label}</span>
                            {label === "Email" ? (
                              <a href={`mailto:${value}`} className="text-sm text-primary font-medium hover:underline">{value}</a>
                            ) : label === "Phone" ? (
                              <a href={`tel:${value}`} className="text-sm text-primary font-medium hover:underline">{value}</a>
                            ) : (
                              <span className="text-sm font-semibold text-foreground">{value}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {messageLines.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Message</p>
                      <div className="bg-muted/30 rounded-xl p-4 border border-border">
                        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{messageLines.join("\n")}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end mt-5">
              <Button onClick={() => setModalNotification(null)} variant="outline" className="font-bold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={markingAll}>
              {markingAll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Mark All Read
            </Button>
          )}
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Notifications Yet</h3>
            <p className="text-muted-foreground">You'll see updates here when your videos are ready, referrals come in, and more.</p>
          </div>
        ) : (
         <div className="space-y-2">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || { icon: Bell, color: "bg-muted text-muted-foreground" };
              const Icon = config.icon;
              const isInquiry = n.type === "showing_request" || n.type === "booking";

              const handleClick = () => {
                if (!n.read) markAsRead(n.id);
                if (isInquiry) {
                  setModalNotification(n);
                }
              };

              const content = (
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                    n.read ? "bg-card" : "bg-primary/5 border border-primary/10"
                  } hover:bg-muted/50 cursor-pointer`}
                  onClick={handleClick}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${n.read ? "text-foreground" : "text-foreground font-semibold"}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{formatTime(n.created_at)}</span>
                        {!n.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    {n.message && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-line">{n.message}</p>
                    )}
                    {isInquiry ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1">
                        View Full Message <ExternalLink className="h-3 w-3" />
                      </span>
                    ) : n.link ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1">
                        View <ExternalLink className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                </div>
              );

              return isInquiry ? (
                <div key={n.id}>{content}</div>
              ) : n.link ? (
                <Link key={n.id} href={n.link} onClick={() => { if (!n.read) markAsRead(n.id); }}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
