"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2, Plus, Trash2, Users, Video, Film, DollarSign,
  ChevronDown, ChevronUp, ExternalLink, ArrowLeft, Loader2,
  CheckCircle, XCircle, UserPlus, Receipt, ToggleLeft, ToggleRight,
  TrendingUp, Zap,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/* TYPES                                      */
/* ═══════════════════════════════════════════ */

interface BrokerageMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
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

interface Brokerage {
  id: string;
  company: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier: string;
  per_clip_rate: number;
  min_monthly_spend: number;
  status: string;
  notes: string | null;
  created_at: string;
  members: BrokerageMember[];
  orders: BrokerageOrder[];
  stats: {
    totalVideos: number;
    completedVideos: number;
    totalClips: number;
    estimatedCost: number;
    totalDue: number;
  };
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

function getMonthlyListings(orders: BrokerageOrder[]) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return orders.filter((o) => new Date(o.created_at) >= start && o.status !== "error").length;
}

function getMonthlyClips(orders: BrokerageOrder[]) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return orders
    .filter((o) => new Date(o.created_at) >= start && o.status !== "error")
    .reduce((sum, o) => sum + (o.photos?.length || 0), 0);
}

/* ═══════════════════════════════════════════ */
/* TIER PROGRESS BAR                          */
/* ═══════════════════════════════════════════ */

function TierProgressBar({ orders, compact = false }: { orders: BrokerageOrder[]; compact?: boolean }) {
  const listings = getMonthlyListings(orders);
  const clips = getMonthlyClips(orders);
  const earned = getEarnedTier(listings);
  const next = getNextTier(listings);

  // Bar fills to 100 listings max
  const pct = Math.min((listings / 100) * 100, 100);

  // Marker positions (percentage of 100-listing scale)
  const markers = TIERS.map((t) => ({ ...t, pos: t.min }));

  if (compact) {
    return (
      <div className="w-full mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-foreground">
            {listings} listing{listings !== 1 ? "s" : ""} this month
            <span className="text-muted-foreground font-normal ml-1">({clips} clips)</span>
          </span>
          {earned ? (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${earned.badge}`}>
              {earned.name}{earned.rate ? ` $${earned.rate}/clip` : ""}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">Need 10+ for Standard</span>
          )}
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-visible">
          <div
            className={`h-full rounded-full transition-all duration-700 ${earned?.color || "bg-muted-foreground/20"}`}
            style={{ width: `${pct}%` }}
          />
          {markers.map((m) => (
            <div
              key={m.key}
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-foreground/20 rounded-full"
              style={{ left: `${m.pos}%` }}
              title={`${m.name}: ${m.min}+ listings`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-muted-foreground">0</span>
          <div className="flex gap-3">
            {markers.slice(0, 3).map((m) => (
              <span key={m.key} className="text-[9px] text-muted-foreground">{m.min}</span>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">100+</span>
        </div>
        {next && listings >= 1 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{next.min - listings}</span> more to {next.name}
            {next.rate && <span> (${next.rate}/clip — save ${((earned?.rate || 3.79) - next.rate).toFixed(2)}/clip)</span>}
          </p>
        )}
      </div>
    );
  }

  // Full-size version
  const earnedRate = earned?.rate || 3.79;
  const monthlyEst = clips * earnedRate;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h4 className="text-sm font-bold text-foreground">Monthly Tier Progress</h4>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-3xl font-extrabold text-foreground">{listings}</span>
          <span className="text-sm text-muted-foreground ml-2">listings · {clips} clips</span>
        </div>
        {earned ? (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${earned.badge}`}>
            {earned.name}{earned.rate ? ` — $${earned.rate}/clip` : ""}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
            Below Standard (need 10+)
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-5 bg-muted rounded-full overflow-visible">
        <div
          className={`h-full rounded-full transition-all duration-700 ${earned?.color || "bg-muted-foreground/20"}`}
          style={{ width: `${pct}%` }}
        />
        {markers.map((m) => (
          <div key={m.key} className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${m.pos}%` }}>
            <div className="w-0.5 h-full bg-background/60 rounded-full" />
          </div>
        ))}
      </div>

      {/* Tier labels under bar */}
      <div className="relative h-5 mt-1">
        {markers.map((m) => (
          <span
            key={m.key}
            className="absolute text-[10px] text-muted-foreground -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${m.pos}%` }}
          >
            {m.min} · {m.name}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Current rate</p>
          <p className="text-lg font-bold text-foreground">${earnedRate.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">per clip</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Est. monthly</p>
          <p className="text-lg font-bold text-foreground">${monthlyEst.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">{clips} clips × ${earnedRate.toFixed(2)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">vs retail</p>
          <p className="text-lg font-bold text-green-600">
            {listings > 0 ? `${Math.round(((listings * 79 - monthlyEst) / (listings * 79)) * 100)}% off` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {listings > 0 ? `saving $${(listings * 79 - monthlyEst).toFixed(2)}` : ""}
          </p>
        </div>
      </div>

      {/* Next tier nudge */}
      {next && listings >= 1 && (
        <div className="mt-3 bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs text-foreground">
              <span className="font-bold">{next.min - listings} more listing{next.min - listings !== 1 ? "s" : ""}</span> to unlock {next.name}
              {next.rate && <span> at ${next.rate}/clip</span>}
            </p>
          </div>
          {next.rate && (
            <p className="text-xs font-bold text-accent">
              Save ${(clips * ((earned?.rate || 3.79) - next.rate)).toFixed(2)}/mo
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* HELPERS                                    */
/* ═══════════════════════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    inactive: "bg-red-100 text-red-700",
    new: "bg-blue-100 text-blue-700",
    processing: "bg-amber-100 text-amber-700",
    complete: "bg-green-100 text-green-700",
    delivered: "bg-green-100 text-green-700",
    closed: "bg-muted text-muted-foreground",
    error: "bg-red-100 text-red-700",
    awaiting_approval: "bg-purple-100 text-purple-700",
    approved: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════ */
/* ADD BROKERAGE FORM                         */
/* ═══════════════════════════════════════════ */

function AddBrokerageForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    tier: "standard",
    per_clip_rate: "3.79",
    min_monthly_spend: "0",
    notes: "",
  });

  const handleCreate = async () => {
    if (!form.company || !form.contact_email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/brokerages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_brokerage",
          ...form,
          per_clip_rate: parseFloat(form.per_clip_rate),
          min_monthly_spend: parseFloat(form.min_monthly_spend) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ company: "", contact_name: "", contact_email: "", contact_phone: "", tier: "standard", per_clip_rate: "3.79", min_monthly_spend: "0", notes: "" });
        setOpen(false);
        onCreated();
      } else {
        alert("Error: " + (data.error || "Failed to create"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-accent hover:bg-accent/90">
        <Plus className="h-4 w-4 mr-2" /> Add Brokerage
      </Button>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <h3 className="font-bold text-foreground">New Brokerage</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Company Name *</label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Keller Williams Realty" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Contact Name</label>
          <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Jane Smith" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Contact Email *</label>
          <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="jane@kwrealty.com" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Contact Phone</label>
          <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="(555) 000-0000" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Tier</label>
          <select
            value={form.tier}
            onChange={(e) => {
              const tier = e.target.value;
              const rates: Record<string, string> = { standard: "3.79", growth: "3.29", enterprise: "2.99", custom: "2.99" };
              setForm({ ...form, tier, per_clip_rate: rates[tier] || "3.79" });
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="standard">Standard — 10+ listings ($3.79/clip)</option>
            <option value="growth">Growth — 25+ listings ($3.29/clip)</option>
            <option value="enterprise">Enterprise — 50+ listings ($2.99/clip)</option>
            <option value="custom">Custom — 100+ listings (contact)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Per Clip Rate ($)</label>
          <Input type="number" step="0.01" value={form.per_clip_rate} onChange={(e) => setForm({ ...form, per_clip_rate: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Min Monthly Spend ($)</label>
          <Input type="number" step="1" value={form.min_monthly_spend} onChange={(e) => setForm({ ...form, min_monthly_spend: e.target.value })} placeholder="0" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Notes</label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special terms, billing notes, etc." rows={2} />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleCreate} disabled={saving || !form.company || !form.contact_email} className="bg-accent hover:bg-accent/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Create Brokerage
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* BROKERAGE CARD                             */
/* ═══════════════════════════════════════════ */

function BrokerageCard({ brokerage, onRefresh }: { brokerage: Brokerage; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [saving, setSaving] = useState(false);

  const totalDue = brokerage.stats.totalDue;
  const monthlyListings = getMonthlyListings(brokerage.orders);
  const earnedTier = getEarnedTier(monthlyListings);

  const handleAddMember = async () => {
    if (!memberEmail) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/brokerages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_member",
          brokerage_id: brokerage.id,
          email: memberEmail,
          name: memberName || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMemberEmail("");
        setMemberName("");
        setAddingMember(false);
        onRefresh();
      } else {
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch("/api/admin/brokerages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_member", member_id: memberId }),
      });
      const data = await res.json();
      if (data.success) onRefresh();
    } catch {}
  };

  const handleToggleStatus = async () => {
    const newStatus = brokerage.status === "active" ? "paused" : "active";
    try {
      const res = await fetch("/api/admin/brokerages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_brokerage", brokerage_id: brokerage.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) onRefresh();
    } catch {}
  };

  const handleGenerateInvoice = () => {
    const clipBreakdown = brokerage.orders
      .filter((o) => ["complete", "delivered", "closed", "approved", "awaiting_approval"].includes(o.status))
      .map((o) => `${o.property_address || o.order_id.slice(0, 8)} — ${o.photos?.length || 0} clips — $${((o.photos?.length || 0) * brokerage.per_clip_rate).toFixed(2)}`)
      .join("\n");

    const usageCost = brokerage.stats.estimatedCost;
    const minSpend = brokerage.min_monthly_spend || 0;
    const invoiceTotal = Math.max(usageCost, minSpend);

    // Show earned tier rate if better
    const earnedRate = earnedTier?.rate || brokerage.per_clip_rate;
    const effectiveRate = Math.min(earnedRate, brokerage.per_clip_rate);

    const invoiceText = `INVOICE — ${brokerage.company}
Assigned Tier: ${brokerage.tier} ($${brokerage.per_clip_rate}/clip)
Earned Tier: ${earnedTier?.name || "Below Standard"} (${monthlyListings} listings this month)
Effective Rate: $${effectiveRate.toFixed(2)}/clip
Min Monthly Spend: $${minSpend.toFixed(2)}
Period: ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}

Videos: ${brokerage.stats.completedVideos}
Total Clips: ${brokerage.stats.totalClips}
Usage Cost: $${usageCost.toFixed(2)}${minSpend > usageCost ? `\nMinimum Applies: $${minSpend.toFixed(2)}` : ""}
Total Due: $${invoiceTotal.toFixed(2)}

Breakdown:
${clipBreakdown || "No completed orders"}

Contact: ${brokerage.contact_email}`;

    navigator.clipboard.writeText(invoiceText);
    alert("Invoice summary copied to clipboard!");
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div
        className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{brokerage.company}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={brokerage.status} />
                <span className="text-xs text-muted-foreground capitalize">{brokerage.tier} — ${brokerage.per_clip_rate}/clip</span>
                {brokerage.min_monthly_spend > 0 && (
                  <span className="text-xs text-muted-foreground">• min ${brokerage.min_monthly_spend}/mo</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{brokerage.stats.totalVideos}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Videos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{brokerage.stats.totalClips}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Clips</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">${totalDue.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Owed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{brokerage.members.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Members</p>
              </div>
            </div>
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>

        {/* Mobile stats */}
        <div className="grid grid-cols-4 gap-3 mt-4 sm:hidden">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-foreground">{brokerage.stats.totalVideos}</p>
            <p className="text-[10px] text-muted-foreground">Videos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-foreground">{brokerage.stats.totalClips}</p>
            <p className="text-[10px] text-muted-foreground">Clips</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-primary">${totalDue.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Owed</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-foreground">{brokerage.members.length}</p>
            <p className="text-[10px] text-muted-foreground">Members</p>
          </div>
        </div>

        {/* Compact tier progress — always visible */}
        <div onClick={(e) => e.stopPropagation()}>
          <TierProgressBar orders={brokerage.orders} compact />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Full Tier Progress */}
          <div className="p-4">
            <TierProgressBar orders={brokerage.orders} />
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-muted/20 flex flex-wrap gap-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleToggleStatus}>
              {brokerage.status === "active" ? (
                <><ToggleRight className="h-4 w-4 mr-1.5 text-green-600" /> Active</>
              ) : (
                <><ToggleLeft className="h-4 w-4 mr-1.5 text-amber-600" /> Paused</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateInvoice}>
              <Receipt className="h-4 w-4 mr-1.5" /> Copy Invoice Summary
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAddingMember(!addingMember)}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Add Member
            </Button>
          </div>

          {/* Add Member Form */}
          {addingMember && (
            <div className="p-4 border-t border-border bg-muted/10">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="agent@email.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Name (optional)"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddMember} disabled={saving || !memberEmail} size="sm" className="bg-accent hover:bg-accent/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>
          )}

          {/* Members */}
          <div className="p-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Members ({brokerage.members.length})</h4>
            {brokerage.members.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No members yet. Add agent emails to enable brokerage ordering.</p>
            ) : (
              <div className="space-y-2">
                {brokerage.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">{m.email}</span>
                      {m.name && <span className="text-sm text-muted-foreground ml-2">({m.name})</span>}
                      <span className="text-xs text-muted-foreground ml-2 capitalize">{m.role}</span>
                    </div>
                    <button onClick={() => handleRemoveMember(m.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="p-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Orders ({brokerage.orders.length})</h4>
            {brokerage.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No orders yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {brokerage.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
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
                          ${((o.photos?.length || 0) * brokerage.per_clip_rate).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">{o.customer_email}</span>
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

          {/* Contact & Notes */}
          {(brokerage.contact_name || brokerage.contact_email || brokerage.notes) && (
            <div className="p-4 border-t border-border bg-muted/10">
              <div className="flex flex-wrap gap-4 text-sm">
                {brokerage.contact_name && (
                  <div>
                    <span className="text-muted-foreground">Contact:</span>{" "}
                    <span className="font-medium text-foreground">{brokerage.contact_name}</span>
                  </div>
                )}
                {brokerage.contact_email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <a href={`mailto:${brokerage.contact_email}`} className="font-medium text-primary hover:underline">{brokerage.contact_email}</a>
                  </div>
                )}
                {brokerage.contact_phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <span className="font-medium text-foreground">{brokerage.contact_phone}</span>
                  </div>
                )}
              </div>
              {brokerage.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">{brokerage.notes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* MAIN PAGE                                  */
/* ═══════════════════════════════════════════ */

export default function AdminBrokeragesPage() {
  const [brokerages, setBrokerages] = useState<Brokerage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrokerages = async () => {
    try {
      const res = await fetch("/api/admin/brokerages");
      const data = await res.json();
      if (data.success) setBrokerages(data.brokerages);
    } catch (err) {
      console.error("Failed to fetch brokerages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokerages();
  }, []);

  const totalVideos = brokerages.reduce((s, b) => s + b.stats.totalVideos, 0);
  const totalClips = brokerages.reduce((s, b) => s + b.stats.totalClips, 0);
  const totalOwed = brokerages.reduce((s, b) => s + b.stats.totalDue, 0);
  const activeBrokerages = brokerages.filter((b) => b.status === "active").length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Brokerage Management</h1>
            <p className="text-sm text-muted-foreground">Manage accounts, members, usage, and billing</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 mb-8">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{activeBrokerages}</p>
            <p className="text-xs text-muted-foreground">Active Brokerages</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalVideos}</p>
            <p className="text-xs text-muted-foreground">Total Videos</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalClips}</p>
            <p className="text-xs text-muted-foreground">Total Clips</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">${totalOwed.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Owed</p>
          </div>
        </div>

        {/* Add Brokerage */}
        <div className="mb-8">
          <AddBrokerageForm onCreated={fetchBrokerages} />
        </div>

        {/* Brokerage List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : brokerages.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Brokerages Yet</h3>
            <p className="text-muted-foreground">Add your first brokerage to get started with bulk pricing.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {brokerages.map((b) => (
              <BrokerageCard key={b.id} brokerage={b} onRefresh={fetchBrokerages} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
