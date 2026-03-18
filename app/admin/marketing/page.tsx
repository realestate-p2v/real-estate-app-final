"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail, ArrowLeft, Shield, BarChart3, Users, MessageSquare,
  Send, Eye, Reply, Calendar, Globe, Instagram, Youtube,
  Facebook, Clock, CheckCircle2, AlertCircle, Loader2,
  Plus, Filter, Search, ExternalLink, TrendingUp,
  Phone, MapPin, Building2, UserPlus, Edit, Trash2,
  ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";

type Lead = {
  id: string;
  agent_name: string;
  email: string | null;
  phone: string | null;
  brokerage: string | null;
  location: string | null;
  status: string;
  created_at: string;
  notes?: string | null;
};

type SocialStat = {
  platform: string;
  icon: any;
  color: string;
  followers: number;
  posts: number;
  engagement: string;
};

export default function MarketingPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadFilter, setLeadFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Cold email stats (manual for now — Instantly.ai integration later)
  const coldEmailStats = {
    domain: "p2vmail.com",
    warmupStatus: "warming",
    warmupDay: 12,
    warmupTarget: 20,
    sent: 0,
    opened: 0,
    replied: 0,
    booked: 0,
    doNotSendUntil: "March 26, 2026 (Day 20+)",
  };

  // Social stats (manual input for now)
  const socialStats: SocialStat[] = [
    { platform: "Instagram", icon: Instagram, color: "bg-pink-500/10 text-pink-600", followers: 0, posts: 0, engagement: "0%" },
    { platform: "TikTok", icon: Globe, color: "bg-black/10 text-black", followers: 0, posts: 0, engagement: "0%" },
    { platform: "YouTube", icon: Youtube, color: "bg-red-500/10 text-red-600", followers: 0, posts: 0, engagement: "0%" },
    { platform: "Facebook", icon: Facebook, color: "bg-blue-500/10 text-blue-600", followers: 0, posts: 0, engagement: "0%" },
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLeadsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
  };

  const updateLeadNotes = async (leadId: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, notes: notesValue }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: notesValue } : l));
        setEditingNotes(null);
        setNotesValue("");
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  };

  const filteredLeads = leads
    .filter(l => leadFilter === "all" || l.status === leadFilter)
    .filter(l => {
      if (!leadSearch) return true;
      const search = leadSearch.toLowerCase();
      return (
        l.agent_name?.toLowerCase().includes(search) ||
        l.email?.toLowerCase().includes(search) ||
        l.brokerage?.toLowerCase().includes(search) ||
        l.location?.toLowerCase().includes(search)
      );
    });

  const leadCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    replied: leads.filter(l => l.status === "replied").length,
    converted: leads.filter(l => l.status === "converted").length,
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-amber-100 text-amber-700",
    replied: "bg-purple-100 text-purple-700",
    converted: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Marketing Mission Control</h1>
              <p className="text-sm text-muted-foreground">Cold email, social media, and lead pipeline</p>
            </div>
          </div>
        </div>

        {/* ═══ COLD EMAIL TRACKER ═══ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-7 w-1.5 bg-indigo-500 rounded-full" />
            <h2 className="text-xl font-bold text-foreground">Cold Email Tracker</h2>
            <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Warming
            </span>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Do NOT send cold emails yet</p>
                <p className="text-amber-700 text-sm mt-0.5">
                  Domain <span className="font-mono font-semibold">p2vmail.com</span> needs to finish warmup.
                  Earliest send date: <span className="font-semibold">{coldEmailStats.doNotSendUntil}</span>
                </p>
              </div>
            </div>

            {/* Domain Health */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">Domain Warmup Progress</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(coldEmailStats.warmupDay / coldEmailStats.warmupTarget) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Day {coldEmailStats.warmupDay} / {coldEmailStats.warmupTarget}
                </span>
              </div>
            </div>

            {/* Email Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Sent", value: coldEmailStats.sent, icon: Send, color: "text-blue-600" },
                { label: "Opened", value: coldEmailStats.opened, icon: Eye, color: "text-green-600" },
                { label: "Replied", value: coldEmailStats.replied, icon: Reply, color: "text-purple-600" },
                { label: "Booked", value: coldEmailStats.booked, icon: Calendar, color: "text-amber-600" },
              ].map((stat, i) => (
                <div key={i} className="bg-muted/30 rounded-xl border border-border p-4 text-center">
                  <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ SOCIAL MEDIA STATS ═══ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-7 w-1.5 bg-pink-500 rounded-full" />
            <h2 className="text-xl font-bold text-foreground">Social Media Stats</h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Manual tracking
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {socialStats.map((social, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 hover:border-accent/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${social.color}`}>
                    <social.icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-foreground">{social.platform}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-semibold text-foreground">{social.followers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Posts</span>
                    <span className="font-semibold text-foreground">{social.posts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-semibold text-foreground">{social.engagement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ LEAD PIPELINE ═══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1.5 bg-green-500 rounded-full" />
              <h2 className="text-xl font-bold text-foreground">Lead Pipeline</h2>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {leads.length} leads
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeads}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${leadsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(["all", "new", "contacted", "replied", "converted"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLeadFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    leadFilter === filter
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  <span className="ml-1.5 opacity-70">({leadCounts[filter]})</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, brokerage, or location..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Leads List */}
            {leadsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">
                  {leads.length === 0 ? "No leads yet" : "No leads match this filter"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {leads.length === 0
                    ? "Leads from the Lead Scanner bot will appear here"
                    : "Try a different filter or search term"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-muted/30 rounded-xl border border-border p-4 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">{lead.agent_name}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[lead.status] || "bg-gray-100 text-gray-700"}`}>
                            {lead.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.brokerage && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {lead.brokerage}
                            </span>
                          )}
                          {lead.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.location}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {editingNotes === lead.id ? (
                          <div className="mt-2 flex gap-2">
                            <Textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Add notes..."
                              className="text-sm h-16 flex-1"
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" onClick={() => updateLeadNotes(lead.id)} className="text-xs">
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)} className="text-xs">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : lead.notes ? (
                          <p
                            className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes || ""); }}
                          >
                            {lead.notes}
                          </p>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {lead.status === "new" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateLeadStatus(lead.id, "contacted")}
                            className="text-xs h-8"
                          >
                            Mark Contacted
                          </Button>
                        )}
                        {lead.status === "contacted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateLeadStatus(lead.id, "replied")}
                            className="text-xs h-8"
                          >
                            Mark Replied
                          </Button>
                        )}
                        {lead.status === "replied" && (
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateLeadStatus(lead.id, "converted")}
                          >
                            Converted
                          </Button>
                        )}
                        <button
                          onClick={() => {
                            setEditingNotes(lead.id);
                            setNotesValue(lead.notes || "");
                          }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Add notes"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Outreach Tracking */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Outreach Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-muted/30 rounded-xl border border-border p-4">
              <p className="text-muted-foreground text-xs mb-1">Instagram DMs Sent</p>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">Target: 10/day</p>
            </div>
            <div className="bg-muted/30 rounded-xl border border-border p-4">
              <p className="text-muted-foreground text-xs mb-1">Emails Sent</p>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">Target: 5/day</p>
            </div>
            <div className="bg-muted/30 rounded-xl border border-border p-4">
              <p className="text-muted-foreground text-xs mb-1">FB Group Posts</p>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">Target: 3-5 groups</p>
            </div>
            <div className="bg-muted/30 rounded-xl border border-border p-4">
              <p className="text-muted-foreground text-xs mb-1">Brokerage Pitches</p>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">Target: 5/week</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
