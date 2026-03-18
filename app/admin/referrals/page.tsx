"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  DollarSign, ArrowLeft, Loader2, CheckCircle, Clock, Users,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, CreditCard,
  Copy, ExternalLink,
} from "lucide-react";

interface Earning {
  id: string;
  order_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface ReferralCode {
  id: string;
  code: string;
  user_name: string;
  user_email: string;
  payout_method: string | null;
  payout_details: string | null;
  status: string;
  created_at: string;
  earnings: Earning[];
  stats: {
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
    totalOrders: number;
    pendingCount: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function PartnerCard({ code, onRefresh }: { code: ReferralCode; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);

  const handleMarkAllPaid = async () => {
    if (!confirm(`Mark $${code.stats.totalPending.toFixed(2)} as paid to ${code.user_name}?`)) return;
    setPaying(true);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_paid", code_id: code.id }),
      });
      const data = await res.json();
      if (data.success) onRefresh();
    } catch {} finally {
      setPaying(false);
    }
  };

  const handleMarkOnePaid = async (earningId: string) => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", earning_id: earningId }),
      });
      const data = await res.json();
      if (data.success) onRefresh();
    } catch {}
  };

  const handleToggleStatus = async () => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", code_id: code.id }),
      });
      const data = await res.json();
      if (data.success) onRefresh();
    } catch {}
  };

  const pendingEarnings = code.earnings.filter((e) => e.status === "pending");
  const paidEarnings = code.earnings.filter((e) => e.status === "paid");

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-foreground">{code.user_name}</h3>
              <StatusBadge status={code.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{code.user_email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{code.code}</span>
              {code.payout_method && (
                <span className="text-xs text-muted-foreground capitalize">{code.payout_method}: {code.payout_details}</span>
              )}
              {!code.payout_method && (
                <span className="text-xs text-red-500 italic">No payout info</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{code.stats.totalOrders}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">${code.stats.totalEarned.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Earned</p>
              </div>
              {code.stats.totalPending > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-600">${code.stats.totalPending.toFixed(2)}</p>
                  <p className="text-[10px] text-amber-600 uppercase font-semibold">Pending</p>
                </div>
              )}
            </div>
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>

        {/* Mobile stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 sm:hidden">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-foreground">{code.stats.totalOrders}</p>
            <p className="text-[10px] text-muted-foreground">Orders</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-foreground">${code.stats.totalEarned.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </div>
          {code.stats.totalPending > 0 && (
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-amber-600">${code.stats.totalPending.toFixed(2)}</p>
              <p className="text-[10px] text-amber-600">Pending</p>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {/* Actions */}
          <div className="p-4 bg-muted/20 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={handleToggleStatus}>
              {code.status === "active" ? (
                <><ToggleRight className="h-4 w-4 mr-1.5 text-green-600" /> Active</>
              ) : (
                <><ToggleLeft className="h-4 w-4 mr-1.5 text-amber-600" /> Paused</>
              )}
            </Button>
            {code.stats.totalPending > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPaid}
                disabled={paying}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                Mark All Paid (${code.stats.totalPending.toFixed(2)})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`https://realestatephoto2video.com/order?ref=${code.code}`);
                alert("Referral link copied!");
              }}
            >
              <Copy className="h-4 w-4 mr-1.5" /> Copy Link
            </Button>
          </div>

          {/* Pending Earnings */}
          {pendingEarnings.length > 0 && (
            <div className="p-4 border-t border-border">
              <h4 className="text-sm font-semibold text-amber-700 mb-3">Pending Payouts ({pendingEarnings.length})</h4>
              <div className="space-y-2">
                {pendingEarnings.map((e) => (
                  <div key={e.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">Order #{e.order_id?.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ${(e.order_total || 0).toFixed(2)} × {(e.commission_rate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-700">${(e.commission_amount || 0).toFixed(2)}</span>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); handleMarkOnePaid(e.id); }}
                        className="text-green-600 hover:text-green-800 transition-colors p-1"
                        title="Mark as paid"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paid Earnings */}
          {paidEarnings.length > 0 && (
            <div className="p-4 border-t border-border">
              <h4 className="text-sm font-semibold text-green-700 mb-3">Paid ({paidEarnings.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {paidEarnings.map((e) => (
                  <div key={e.id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">Order #{e.order_id?.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-700">${(e.commission_amount || 0).toFixed(2)}</span>
                      <span className="text-xs text-green-600">
                        Paid {e.paid_at ? new Date(e.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No earnings */}
          {code.earnings.length === 0 && (
            <div className="p-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground italic">No referred orders yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminReferralsPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/referrals");
      const data = await res.json();
      if (data.success) {
        setCodes(data.codes);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Referral Management</h1>
            <p className="text-sm text-muted-foreground">Track partners, earnings, and payouts</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 mb-8">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{summary.activePartners || 0}</p>
            <p className="text-xs text-muted-foreground">Active Partners</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{summary.totalPendingCount || 0}</p>
            <p className="text-xs text-muted-foreground">Pending Payouts</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">${(summary.totalPendingPayouts || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Pending</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{summary.partnersWithPending || 0}</p>
            <p className="text-xs text-muted-foreground">Partners to Pay</p>
          </div>
        </div>

        {/* Partner List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : codes.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Referral Partners Yet</h3>
            <p className="text-muted-foreground">Partners will appear here when they create referral codes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {codes.map((c) => (
              <PartnerCard key={c.id} code={c} onRefresh={fetchData} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
