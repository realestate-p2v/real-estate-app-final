// ============================================================
// FILE: app/admin/analytics/page.tsx
// ============================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import {
  BarChart3, ArrowLeft, Loader2, DollarSign, ShoppingCart,
  Users, Clock, TrendingUp, TrendingDown, Minus, AlertCircle,
  Film, BookOpen, ExternalLink, Zap, Globe, MapPin, Home,
  CheckCircle, XCircle, Pencil,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color || "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${color ? "text-white" : "text-primary"}`} />
        </div>
        <span className="text-xs text-muted-foreground uppercase font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-muted-foreground">—</span>;
  if (previous === 0) return <span className="text-xs text-green-600 font-semibold flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> New</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return <span className="text-xs text-green-600 font-semibold flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +{pct}%</span>;
  if (pct < 0) return <span className="text-xs text-red-600 font-semibold flex items-center gap-0.5"><TrendingDown className="h-3 w-3" /> {pct}%</span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> 0%</span>;
}

function MiniBar({ data, maxVal }: { data: { month: string; revenue: number; orders: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => {
        const height = maxVal > 0 ? Math.max((d.revenue / maxVal) * 100, 4) : 4;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">
              {d.revenue > 0 ? `$${d.revenue.toFixed(0)}` : ""}
            </span>
            <div
              className="w-full bg-primary/80 rounded-t-md transition-all"
              style={{ height: `${height}%` }}
              title={`${d.month}: $${d.revenue.toFixed(2)} (${d.orders} orders)`}
            />
            <span className="text-[10px] text-muted-foreground">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load analytics data.</p>
        </div>
      </div>
    );
  }

  const { revenue, orders, pipeline, customers, blogs, agentSites } = data;
  const maxRevenue = Math.max(...(revenue.monthlyTrend || []).map((d: any) => d.revenue), 1);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Revenue, orders, pipeline health, agent sites, and content performance</p>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" /> Revenue
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${revenue.total.toFixed(2)}`} color="bg-green-600" />
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase font-medium">This Month</span>
                <TrendBadge current={revenue.thisMonth} previous={revenue.lastMonth} />
              </div>
              <p className="text-2xl font-bold text-foreground">${revenue.thisMonth.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Last month: ${revenue.lastMonth.toFixed(2)}</p>
            </div>
            <StatCard icon={ShoppingCart} label="Avg Order Value" value={`$${revenue.avgOrderValue.toFixed(2)}`} />
            <StatCard icon={Film} label="Total Clips" value={pipeline.totalClips.toLocaleString()} sub={`${pipeline.res1080} at 1080P`} />
          </div>

          {/* Revenue Chart */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Revenue (Last 6 Months)</h3>
            <MiniBar data={revenue.monthlyTrend} maxVal={maxRevenue} />
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Orders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatCard icon={ShoppingCart} label="Total Orders" value={orders.total.toString()} />
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase font-medium">This Month</span>
                <TrendBadge current={orders.thisMonth} previous={orders.lastMonth} />
              </div>
              <p className="text-2xl font-bold text-foreground">{orders.thisMonth}</p>
              <p className="text-xs text-muted-foreground">Last month: {orders.lastMonth}</p>
            </div>
            <StatCard icon={Zap} label="In Pipeline" value={orders.inPipeline.toString()} sub={`${orders.completed} completed`} />
            <StatCard
              icon={AlertCircle}
              label="Errors"
              value={orders.errors.toString()}
              color={orders.errors > 0 ? "bg-red-600" : "bg-muted"}
            />
          </div>

          {/* Status Breakdown */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Orders by Status</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(orders.statusCounts as Record<string, number>)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([status, count]) => {
                  const colors: Record<string, string> = {
                    closed: "bg-muted text-muted-foreground",
                    complete: "bg-green-100 text-green-700",
                    delivered: "bg-green-100 text-green-700",
                    approved: "bg-green-100 text-green-700",
                    new: "bg-blue-100 text-blue-700",
                    processing: "bg-amber-100 text-amber-700",
                    awaiting_approval: "bg-purple-100 text-purple-700",
                    error: "bg-red-100 text-red-700",
                    revision_requested: "bg-amber-100 text-amber-700",
                    client_revision_requested: "bg-amber-100 text-amber-700",
                  };
                  return (
                    <div key={status} className={`px-3 py-1.5 rounded-full text-sm font-medium ${colors[status] || "bg-muted text-muted-foreground"}`}>
                      {status}: {count as number}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Pipeline Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" /> Pipeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={Clock}
              label="Avg Delivery Time"
              value={pipeline.avgDeliveryHours > 0 ? `${pipeline.avgDeliveryHours.toFixed(1)}h` : "—"}
              sub="Order to delivery"
            />
            <StatCard icon={ShoppingCart} label="Brokerage Orders" value={pipeline.brokerageOrders.toString()} />
            <StatCard icon={DollarSign} label="Referral Orders" value={pipeline.referralOrders.toString()} />
            <StatCard
              icon={Film}
              label="Resolution Split"
              value={`${pipeline.res768} / ${pipeline.res1080}`}
              sub="768P / 1080P"
            />
          </div>
        </div>

        {/* Customers Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" /> Customers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total Customers" value={customers.total.toString()} />
            <StatCard icon={TrendingUp} label="Repeat Customers" value={customers.repeat.toString()} sub={customers.total > 0 ? `${Math.round(customers.repeat / customers.total * 100)}% repeat rate` : ""} />
            <StatCard icon={Users} label="New Customers" value={customers.new.toString()} />
          </div>
        </div>

        {/* ── Agent Sites Section ──────────────────────────────────────── */}
        {agentSites && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" /> Agent Sites
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <StatCard icon={Globe} label="Total Sites" value={agentSites.total.toString()} color="bg-indigo-600" />
              <StatCard icon={CheckCircle} label="Published" value={agentSites.published.toString()} sub={`${agentSites.draft} draft`} color="bg-green-600" />
              <StatCard icon={Home} label="Total Listings" value={agentSites.totalListings.toString()} sub="Across all agents" />
              <StatCard icon={MapPin} label="Location Pages" value={agentSites.publishedLocationPages.toString()} sub={`${agentSites.totalLocationPages} total`} />
            </div>

            {/* Sites Table */}
            {agentSites.sites && agentSites.sites.length > 0 ? (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Table Header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-5 py-3 border-b border-border bg-muted/30">
                  <span className="col-span-3 text-xs font-semibold text-muted-foreground uppercase">Site</span>
                  <span className="col-span-2 text-xs font-semibold text-muted-foreground uppercase">Agent</span>
                  <span className="col-span-1 text-xs font-semibold text-muted-foreground uppercase text-center">Status</span>
                  <span className="col-span-1 text-xs font-semibold text-muted-foreground uppercase text-center">Listings</span>
                  <span className="col-span-1 text-xs font-semibold text-muted-foreground uppercase text-center">Locations</span>
                  <span className="col-span-2 text-xs font-semibold text-muted-foreground uppercase">Updated</span>
                  <span className="col-span-2 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</span>
                </div>

                {agentSites.sites.map((site: any, i: number) => (
                  <div
                    key={site.id}
                    className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center ${i !== agentSites.sites.length - 1 ? "border-b border-border" : ""} hover:bg-muted/20 transition-colors`}
                  >
                    {/* Site info */}
                    <div className="sm:col-span-3 flex items-center gap-2.5 min-w-0">
                      <div
                        className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: site.primaryColor || "#334155" }}
                      >
                        <span className="text-white text-xs font-bold">
                          {(site.handle || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {site.siteTitle || site.handle}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {site.customDomain || `${site.handle}.p2v.homes`}
                        </p>
                      </div>
                    </div>

                    {/* Agent name */}
                    <div className="sm:col-span-2 min-w-0">
                      <p className="text-sm text-foreground truncate">{site.agentName || "—"}</p>
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-1 flex justify-start sm:justify-center">
                      {site.published ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          <XCircle className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </div>

                    {/* Listing count */}
                    <div className="sm:col-span-1 text-center">
                      <span className="text-sm font-bold text-foreground">{site.listingCount}</span>
                    </div>

                    {/* Location pages */}
                    <div className="sm:col-span-1 text-center">
                      <span className="text-sm font-bold text-foreground">{site.locationPages}</span>
                      {site.locationPagesTotal > site.locationPages && (
                        <span className="text-xs text-muted-foreground"> / {site.locationPagesTotal}</span>
                      )}
                    </div>

                    {/* Updated */}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        {site.updatedAt ? timeAgo(site.updatedAt) : "—"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-2 flex items-center gap-2 justify-start sm:justify-end">
                      <a
                        href={`https://${site.customDomain || site.handle + ".p2v.homes"}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                        title="View site"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </a>
                      <a
                        href={`https://${site.handle}.p2v.homes/editor`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                        title="Open editor"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Editor</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No agent sites created yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Blog Performance */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" /> Top Blog Posts
          </h2>
          {blogs.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <p className="text-muted-foreground">No blog posts yet.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {blogs.map((blog: any, i: number) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 ${i !== blogs.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{blog.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${blog.status === "published" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {blog.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-3">
                    <span className="text-sm font-bold text-foreground">{blog.views} views</span>
                    <Link href={`/blog/${blog.slug}`} target="_blank" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
