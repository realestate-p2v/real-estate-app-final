"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ArrowLeft, DollarSign, Gift, Copy, CheckCircle, Loader2,
  ExternalLink, TrendingUp, Clock, CreditCard,
} from "lucide-react";

export default function ReferralEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [hasCode, setHasCode] = useState(false);
  const [referralCode, setReferralCode] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalEarned: 0, totalPaid: 0, totalPending: 0, totalOrders: 0 });
  const [earnings, setEarnings] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [editingPayout, setEditingPayout] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/referral");
      const data = await res.json();
      if (data.success) {
        setHasCode(data.hasCode);
        if (data.hasCode) {
          setReferralCode(data.referralCode);
          setStats(data.stats);
          setEarnings(data.earnings || []);
          setPayoutMethod(data.referralCode.payout_method || "");
          setPayoutDetails(data.referralCode.payout_details || "");
        }
      }
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_code",
          payout_method: payoutMethod || null,
          payout_details: payoutDetails || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert("Error: " + (data.error || "Failed to create code"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSavePayout = async () => {
    setSavingPayout(true);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_payout",
          payout_method: payoutMethod,
          payout_details: payoutDetails,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingPayout(false);
        fetchData();
      }
    } catch {} finally {
      setSavingPayout(false);
    }
  };

  const copyLink = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(`https://realestatephoto2video.com/order?ref=${referralCode.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Signup flow — no code yet
  if (!hasCode) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Join the Referral Program</h1>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Earn 20% on Every Referral</h2>
              <p className="text-muted-foreground">
                Get your unique referral link. When agents order through your link, you earn 20% commission. Payouts are sent monthly.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-primary">$15.80</p>
                <p className="text-xs text-muted-foreground">per $79 order</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-primary">$25.80</p>
                <p className="text-xs text-muted-foreground">per $129 order</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-primary">$35.80</p>
                <p className="text-xs text-muted-foreground">per $179 order</p>
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-semibold text-foreground">Payout Information (optional — you can add this later)</h3>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  <option value="paypal">PayPal</option>
                  <option value="venmo">Venmo</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  {payoutMethod === "paypal" ? "PayPal Email" : payoutMethod === "venmo" ? "Venmo Username or Phone" : payoutMethod === "zelle" ? "Zelle Email or Phone" : "Account Details"}
                </label>
                <Input
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={payoutMethod === "paypal" ? "you@email.com" : payoutMethod === "venmo" ? "@username or phone" : payoutMethod === "zelle" ? "Email or phone number" : "Select a method first"}
                />
              </div>
            </div>

            <Button
              onClick={handleCreateCode}
              disabled={creating}
              className="w-full bg-accent hover:bg-accent/90 py-6 text-lg font-bold"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Gift className="h-5 w-5 mr-2" />}
              Get My Referral Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard — has code
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Referral Earnings</h1>
            <p className="text-sm text-muted-foreground">Track your commissions and referred orders</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-bold text-foreground mb-3">Your Referral Link</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-sm text-foreground truncate">
              realestatephoto2video.com/order?ref={referralCode.code}
            </div>
            <Button onClick={copyLink} variant="outline" size="sm" className="flex-shrink-0">
              {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this link with agents. You earn 20% on every order they place.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">${stats.totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">${stats.totalPending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Pending Payout</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">${stats.totalPaid.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">Referred Orders</p>
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payout Information
            </h2>
            {!editingPayout && (
              <Button variant="outline" size="sm" onClick={() => setEditingPayout(true)}>
                {referralCode.payout_method ? "Edit" : "Add Payout Info"}
              </Button>
            )}
          </div>

          {editingPayout ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  <option value="paypal">PayPal</option>
                  <option value="venmo">Venmo</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  {payoutMethod === "paypal" ? "PayPal Email" : payoutMethod === "venmo" ? "Venmo Username or Phone" : payoutMethod === "zelle" ? "Zelle Email or Phone" : "Account Details"}
                </label>
                <Input
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={payoutMethod === "paypal" ? "you@email.com" : payoutMethod === "venmo" ? "@username or phone" : "Email or phone"}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSavePayout} disabled={savingPayout} size="sm" className="bg-accent hover:bg-accent/90">
                  {savingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingPayout(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              {referralCode.payout_method ? (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-medium text-foreground capitalize">{referralCode.payout_method}</span>
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-medium text-foreground">{referralCode.payout_details}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No payout info added yet. Add your PayPal, Venmo, or Zelle to receive monthly payouts.</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">Payouts are sent the 1st week of each month for the previous month's earnings.</p>
            </div>
          )}
        </div>

        {/* Earnings List */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4">Referred Orders ({earnings.length})</h2>
          {earnings.length === 0 ? (
            <div className="text-center py-10">
              <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No referred orders yet.</p>
              <p className="text-sm text-muted-foreground">Share your referral link with agents to start earning.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Order #{e.order_id?.slice(0, 8) || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}Order total: ${(e.order_total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+${(e.commission_amount || 0).toFixed(2)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      e.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {e.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
