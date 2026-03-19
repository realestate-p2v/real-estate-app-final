"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Camera,
  Users,
  TrendingUp,
  DollarSign,
  Mail,
  Building2,
  User,
  Eye,
  ImageIcon,
  Zap,
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
  BarChart3,
  Sparkles,
} from "lucide-react";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  interest: string;
  company: string | null;
  created_at: string;
}

interface LensData {
  waitlist: {
    total: number;
    individual: number;
    brokerage: number;
    recentSignups: number;
    todaySignups: number;
    entries: WaitlistEntry[];
  };
  subscribers: {
    total: number;
    individual: number;
    brokerage: number;
    brokerageAgents: number;
    mrr: number;
    arr: number;
  };
  analyses: {
    totalAllTime: number;
    thisMonth: number;
    today: number;
    avgPerUser: number;
  };
  revenue: {
    mtd: number;
    lastMonth: number;
    ltv: number;
    churnRate: number;
  };
}

export default function AdminLensPage() {
  const [data, setData] = useState<LensData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lens");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError("Failed to load Lens data");
      }
    } catch {
      setError("Failed to load Lens data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">P2V Lens Monitor</h1>
              <p className="text-sm text-muted-foreground">Waitlist, subscribers, usage, and revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/lens" target="_blank">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View Landing Page
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* ═══ WAITLIST STATS ═══ */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-cyan-600" />
                Waitlist
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Total Signups"
                  value={data.waitlist.total}
                  icon={<Users className="h-4 w-4" />}
                  color="bg-cyan-500/10 text-cyan-600"
                />
                <StatCard
                  label="Today"
                  value={data.waitlist.todaySignups}
                  icon={<Zap className="h-4 w-4" />}
                  color="bg-green-500/10 text-green-600"
                />
                <StatCard
                  label="Last 7 Days"
                  value={data.waitlist.recentSignups}
                  icon={<TrendingUp className="h-4 w-4" />}
                  color="bg-blue-500/10 text-blue-600"
                />
                <StatCard
                  label="Brokerage Interest"
                  value={data.waitlist.brokerage}
                  icon={<Building2 className="h-4 w-4" />}
                  color="bg-purple-500/10 text-purple-600"
                />
              </div>
            </div>

            {/* ═══ SUBSCRIBER STATS ═══ */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Subscribers
                {data.subscribers.total === 0 && (
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">Pre-Launch</span>
                )}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Active Subscribers"
                  value={data.subscribers.total}
                  icon={<Users className="h-4 w-4" />}
                  color="bg-amber-500/10 text-amber-600"
                />
                <StatCard
                  label="Individual"
                  value={data.subscribers.individual}
                  icon={<User className="h-4 w-4" />}
                  color="bg-amber-500/10 text-amber-600"
                />
                <StatCard
                  label="Brokerage Seats"
                  value={data.subscribers.brokerageAgents}
                  icon={<Building2 className="h-4 w-4" />}
                  color="bg-amber-500/10 text-amber-600"
                />
                <StatCard
                  label="MRR"
                  value={formatCurrency(data.subscribers.mrr)}
                  icon={<DollarSign className="h-4 w-4" />}
                  color="bg-green-500/10 text-green-600"
                  isString
                />
              </div>
            </div>

            {/* ═══ USAGE STATS ═══ */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Photo Analyses
                {data.analyses.totalAllTime === 0 && (
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">Pre-Launch</span>
                )}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="All Time"
                  value={data.analyses.totalAllTime.toLocaleString()}
                  icon={<ImageIcon className="h-4 w-4" />}
                  color="bg-blue-500/10 text-blue-600"
                  isString
                />
                <StatCard
                  label="This Month"
                  value={data.analyses.thisMonth.toLocaleString()}
                  icon={<BarChart3 className="h-4 w-4" />}
                  color="bg-blue-500/10 text-blue-600"
                  isString
                />
                <StatCard
                  label="Today"
                  value={data.analyses.today}
                  icon={<Zap className="h-4 w-4" />}
                  color="bg-blue-500/10 text-blue-600"
                />
                <StatCard
                  label="Avg / User / Month"
                  value={data.analyses.avgPerUser}
                  icon={<TrendingUp className="h-4 w-4" />}
                  color="bg-blue-500/10 text-blue-600"
                />
              </div>
            </div>

            {/* ═══ REVENUE STATS ═══ */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Revenue
                {data.revenue.mtd === 0 && (
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">Pre-Launch</span>
                )}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Month to Date"
                  value={formatCurrency(data.revenue.mtd)}
                  icon={<DollarSign className="h-4 w-4" />}
                  color="bg-green-500/10 text-green-600"
                  isString
                />
                <StatCard
                  label="Last Month"
                  value={formatCurrency(data.revenue.lastMonth)}
                  icon={<Clock className="h-4 w-4" />}
                  color="bg-green-500/10 text-green-600"
                  isString
                />
                <StatCard
                  label="ARR"
                  value={formatCurrency(data.subscribers.arr)}
                  icon={<TrendingUp className="h-4 w-4" />}
                  color="bg-green-500/10 text-green-600"
                  isString
                />
                <StatCard
                  label="Churn Rate"
                  value={`${data.revenue.churnRate}%`}
                  icon={<BarChart3 className="h-4 w-4" />}
                  color="bg-red-500/10 text-red-600"
                  isString
                />
              </div>
            </div>

            {/* ═══ CONVERSION FUNNEL ═══ */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Conversion Funnel
              </h2>
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <FunnelStep
                    label="Waitlist Signups"
                    value={data.waitlist.total}
                    percentage="100%"
                  />
                  <FunnelStep
                    label="Started Trial"
                    value={0}
                    percentage={data.waitlist.total > 0 ? "0%" : "—"}
                  />
                  <FunnelStep
                    label="Active Subscribers"
                    value={data.subscribers.total}
                    percentage={data.waitlist.total > 0 ? `${Math.round((data.subscribers.total / data.waitlist.total) * 100)}%` : "—"}
                  />
                  <FunnelStep
                    label="Used AI Coach"
                    value={data.analyses.totalAllTime > 0 ? data.subscribers.total : 0}
                    percentage={data.subscribers.total > 0 ? "—" : "—"}
                  />
                </div>
              </div>
            </div>

            {/* ═══ RECENT WAITLIST SIGNUPS TABLE ═══ */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-cyan-600" />
                Recent Waitlist Signups
              </h2>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {data.waitlist.entries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No waitlist signups yet. Share the landing page!</p>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link href="/lens" target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        View Landing Page
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Company</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Signed Up</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.waitlist.entries.map((entry) => (
                          <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 text-foreground font-medium">{entry.email}</td>
                            <td className="px-4 py-3 text-muted-foreground">{entry.name || "—"}</td>
                            <td className="px-4 py-3">
                              {entry.interest === "brokerage" ? (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  <Building2 className="h-3 w-3" />
                                  Brokerage
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  <User className="h-3 w-3" />
                                  Individual
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{entry.company || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(entry.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* ═══ STAT CARD COMPONENT ═══ */
function StatCard({
  label,
  value,
  icon,
  color,
  isString = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isString?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-foreground">
        {isString ? value : typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

/* ═══ FUNNEL STEP COMPONENT ═══ */
function FunnelStep({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-foreground">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{percentage}</p>
    </div>
  );
}
