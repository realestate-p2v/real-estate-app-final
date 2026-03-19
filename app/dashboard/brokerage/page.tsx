"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Building2, ArrowLeft, ArrowRight, Loader2, Video, CheckCircle,
  Clock, TrendingUp, Zap, ExternalLink, Play, Users, DollarSign,
  Camera,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/* TYPES                                      */
/* ═══════════════════════════════════════════ */

interface BrokerageInfo {
  id: string;
  company: string;
  tier: string;
  per_clip_rate: number;
  status: string;
}

interface BrokerageOrder {
  id: string;
  order_id: string;
  status: string;
  property_address: string | null;
  customer_email: string;
  photos: any[] | null;
  created_at: string;
  delivery_url: string | null;
}

interface BrokerageData {
  brokerage: BrokerageInfo;
  orders: BrokerageOrder[];
  memberCount: number;
}

/* ═══════════════════════════════════════════ */
/* TIER SYSTEM                                */
/* ═══════════════════════════════════════════ */

const TIERS = [
  { key: "standard", name: "Standard", min: 10, rate: 3.79, color: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
  { key: "growth", name: "Growth", min: 25, rate: 3.29, color: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  { key: "enterprise", name: "Enterprise", min: 50, rate: 2.99, color: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  { key: "custom", name: "Custom", min: 100, rate: null, color: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
];

function getEarnedTier(listingCount: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (listingCount >= TIERS[i].min) return TIERS[i];
  }
  return null;
}

function getNextTier(listingCount: number) {
  for (const tier of TIERS) {
    if (listingCount < tier.min) return tier;
  }
  return null;
}

function getMonthlyOrders(orders: BrokerageOrder[]) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return orders.filter((o) => new Date(o.created_at) >= start && o.status !== "error");
}

/* ═══════════════════════════════════════════ */
/* STATUS BADGE                               */
/* ═══════════════════════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    processing: "bg-amber-100 text-amber-700",
    complete: "bg-green-100 text-green-700",
    delivered: "bg-green-100 text-green-700",
    closed: "bg-muted text-muted-foreground",
    awaiting_approval: "bg-purple-100 text-purple-700",
    approved: "bg-green-100 text-green-700",
    revision_requested: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    new: "Queued",
    processing: "In Production",
    awaiting_approval: "In Review",
    approved: "Delivered",
    complete: "Complete",
    delivered: "Delivered",
    closed: "Closed",
    revision_requested: "Revision",
    error: "Issue",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {labels[status] || status}
    </span>
  );
}

/* ═══════════════════════════════════════════ */
/* TIER PROGRESS BAR                          */
/* ═══════════════════════════════════════════ */

function TierProgressBar({ listings, clips }: { listings: number; clips: number }) {
  const earned = getEarnedTier(listings);
  const next = getNextTier(listings);
  const pct = Math.min((listings / 100) * 100, 100);
  const earnedRate = earned?.rate || 3.79;
  const monthlyEst = clips * earnedRate;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-bold text-foreground">Monthly Tier Progress</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-4xl font-extrabold text-foreground">{listings}</span>
          <span className="text-base text-muted-foreground ml-2">listings · {clips} clips</span>
        </div>
        {earned ? (
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${earned.badge}`}>
            {earned.name}{earned.rate ? ` — $${earned.rate}/clip` : ""}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-full">
            Need 10+ listings for Standard
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-5 bg-muted rounded-full overflow-visible mt-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${earned?.color || "bg-muted-foreground/20"}`}
          style={{ width: `${pct}%` }}
        />
        {TIERS.map((t) => (
          <div
            key={t.key}
            className="absolute top-0 h-full flex items-center"
            style={{ left: `${t.min}%` }}
          >
            <div className="w-0.5 h-full bg-background/60 rounded-full" />
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="relative h-5 mt-1">
        {TIERS.map((t) => (
          <span
            key={t.key}
            className={`absolute text-[10px] -translate-x-1/2 whitespace-nowrap ${
              earned && t.min <= (earned.min) ? "text-foreground font-semibold" : "text-muted-foreground"
            }`}
            style={{ left: `${t.min}%` }}
          >
            {t.min} · {t.name}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">Current rate</p>
          <p className="text-2xl font-extrabold text-foreground">${earnedRate.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">per clip</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">Est. monthly cost</p>
          <p className="text-2xl font-extrabold text-foreground">
            ${monthlyEst.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground">{clips} clips × ${earnedRate.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-green-700">Savings vs retail</p>
          <p className="text-2xl font-extrabold text-green-700">
            {listings > 0 ? `${Math.round(((listings * 79 - monthlyEst) / (listings * 79)) * 100)}%` : "—"}
          </p>
          <p className="text-[10px] text-green-600">
            {listings > 0 ? `$${(listings * 79 - monthlyEst).toFixed(2)} saved` : ""}
          </p>
        </div>
      </div>

      {/* Next tier nudge */}
      {next && listings >= 1 && (
        <div className="mt-4 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <p className="text-sm text-foreground">
              <span className="font-bold">{next.min - listings} more listing{next.min - listings !== 1 ? "s" : ""}</span> to unlock {next.name}
              {next.rate && <span> at ${next.rate}/clip</span>}
            </p>
          </div>
          {next.rate && earned?.rate && (
            <p className="text-sm font-bold text-accent">
              Save ${(clips * (earned.rate - next.rate)).toFixed(2)}/mo
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-3">
        Billing adjusts at end of month. Hit a higher tier and the better rate applies retroactively to all clips.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* MAIN PAGE                                  */
/* ═══════════════════════════════════════════ */

export default function DashboardBrokeragePage() {
  const [data, setData] = useState<BrokerageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBrokerageData();
  }, []);

  const loadBrokerageData = async () => {
    try {
      const res = await fetch("/api/brokerage/status");
      const result = await res.json();
      if (result.success && result.brokerage) {
        setData({
          brokerage: result.brokerage,
          orders: result.orders || [],
          memberCount: result.memberCount || 0,
        });
      } else {
        setError("not_member");
      }
    } catch {
      setError("failed");
    } finally {
      setLoading(false);
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">No Brokerage Account Found</h1>
          <p className="text-muted-foreground mb-6">
            Your email is not associated with a brokerage account. If your brokerage uses Photo 2 Video, ask your admin to add your email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black">
              <Link href="/pricing/brokerage">
                Learn About Brokerage Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { brokerage, orders, memberCount } = data;
  const monthlyOrders = getMonthlyOrders(orders);
  const monthlyListings = monthlyOrders.length;
  const monthlyClips = monthlyOrders.reduce((sum, o) => sum + (o.photos?.length || 0), 0);
  const earned = getEarnedTier(monthlyListings);
  const effectiveRate = earned?.rate || brokerage.per_clip_rate;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {brokerage.company}
            </h1>
            <p className="text-muted-foreground mt-0.5">Brokerage Dashboard</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{monthlyListings}</p>
            <p className="text-xs text-muted-foreground">Listings This Month</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{monthlyClips}</p>
            <p className="text-xs text-muted-foreground">Clips This Month</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">${effectiveRate.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Per Clip Rate</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{memberCount}</p>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mb-8">
          <TierProgressBar listings={monthlyListings} clips={monthlyClips} />
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/order"
            className="group bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 block"
          >
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">Order a Video</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload listing photos and get a cinematic video in 24 hours at ${effectiveRate.toFixed(2)}/clip.
            </p>
          </Link>
          <Link
            href="/dashboard/videos"
            className="group bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 block"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">My Videos</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              View and download your delivered listing videos.
            </p>
          </Link>
          <Link
            href="/dashboard/lens"
            className="group bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 block"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">P2V Lens</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI photo coaching, free editing, and priority delivery.
            </p>
          </Link>
        </div>

        {/* Recent Team Orders */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-bold text-foreground">Team Orders This Month</h3>
            </div>
            <span className="text-sm text-muted-foreground">{monthlyOrders.length} orders</span>
          </div>

          {monthlyOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No orders this month yet.</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                <Link href="/order">
                  Order Your First Video
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {monthlyOrders.map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {o.property_address || o.order_id.slice(0, 8)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{o.photos?.length || 0} clips</span>
                      <span className="text-xs text-muted-foreground">
                        ${((o.photos?.length || 0) * effectiveRate).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">{o.customer_email}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {o.delivery_url && (
                      <a href={o.delivery_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Link href={`/video/${o.order_id}`} className="text-muted-foreground hover:text-foreground">
                      <Video className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing reference */}
        <div className="mt-8 bg-muted/30 rounded-xl border border-border p-5">
          <h4 className="text-sm font-bold text-foreground mb-3">Tier Pricing Reference</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIERS.map((t) => (
              <div
                key={t.key}
                className={`rounded-lg p-3 text-center ${
                  earned?.key === t.key ? "bg-card border-2 border-accent/40" : "bg-card border border-border"
                }`}
              >
                <p className="text-xs font-semibold text-muted-foreground">{t.name}</p>
                <p className="text-lg font-extrabold text-foreground">{t.rate ? `$${t.rate}` : "Custom"}</p>
                <p className="text-[10px] text-muted-foreground">{t.min}+ listings/mo</p>
                {earned?.key === t.key && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
