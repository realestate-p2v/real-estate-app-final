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

type AisoTarget = {
  id: string;
  site_name: string;
  site_url: string | null;
  article_url: string | null;
  citation_query: string | null;
  ai_platform: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_url: string | null;
  outreach_type: string;
  outreach_status: string;
  notes: string | null;
  priority: string;
  times_cited: number;
  created_at: string;
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

  // AISO state
  const [aisoTargets, setAisoTargets] = useState<AisoTarget[]>([]);
  const [aisoLoading, setAisoLoading] = useState(true);
  const [showAddAiso, setShowAddAiso] = useState(false);
  const [aisoForm, setAisoForm] = useState({
    site_name: "", site_url: "", article_url: "", citation_query: "",
    ai_platform: "chatgpt", contact_name: "", contact_email: "", contact_url: "",
    outreach_type: "guest_post", priority: "medium", notes: "", times_cited: 1,
  });

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
    fetchAisoTargets();
  }, []);

  const fetchAisoTargets = async () => {
    setAisoLoading(true);
    try {
      const res = await fetch("/api/admin/aiso");
      const data = await res.json();
      if (data.success) setAisoTargets(data.targets || []);
    } catch (err) {
      console.error("Failed to fetch AISO targets:", err);
    } finally {
      setAisoLoading(false);
    }
  };

  const addAisoTarget = async () => {
    if (!aisoForm.site_name.trim()) return;
    try {
      const res = await fetch("/api/admin/aiso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aisoForm),
      });
      const data = await res.json();
      if (data.success) {
        setAisoTargets(prev => [data.target, ...prev]);
        setShowAddAiso(false);
        setAisoForm({
          site_name: "", site_url: "", article_url: "", citation_query: "",
          ai_platform: "chatgpt", contact_name: "", contact_email: "", contact_url: "",
          outreach_type: "guest_post", priority: "medium", notes: "", times_cited: 1,
        });
      }
    } catch (err) {
      console.error("Failed to add AISO target:", err);
    }
  };

  const updateAisoStatus = async (id: string, outreach_status: string) => {
    try {
      const res = await fetch("/api/admin/aiso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, outreach_status }),
      });
      const data = await res.json();
      if (data.success) {
        setAisoTargets(prev => prev.map(t => t.id === id ? { ...t, outreach_status } : t));
      }
    } catch (err) {
      console.error("Failed to update AISO target:", err);
    }
  };

  const deleteAisoTarget = async (id: string) => {
    if (!confirm("Delete this target?")) return;
    try {
      const res = await fetch("/api/admin/aiso", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setAisoTargets(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete AISO target:", err);
    }
  };

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

        {/* ═══ AISO BACKLINK CAMPAIGN ═══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1.5 bg-amber-500 rounded-full" />
              <h2 className="text-xl font-bold text-foreground">AISO Backlink Campaign</h2>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {aisoTargets.length} targets
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddAiso(!showAddAiso)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Target
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 text-sm">AI Search Optimization</p>
                <p className="text-blue-700 text-sm mt-0.5">
                  Search ChatGPT, Gemini, and Perplexity for real estate video queries. Note which sites they cite. 
                  Get P2V mentioned on those sites through guest posts, resource page inclusion, or article updates.
                </p>
              </div>
            </div>

            {/* Add Target Form */}
            {showAddAiso && (
              <div className="bg-muted/30 rounded-xl border border-border p-5 mb-6">
                <h4 className="font-semibold text-foreground mb-4">Add New Target Site</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Site Name *</label>
                    <Input
                      placeholder="e.g. HousingWire"
                      value={aisoForm.site_name}
                      onChange={(e) => setAisoForm(p => ({ ...p, site_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Site URL</label>
                    <Input
                      placeholder="https://housingwire.com"
                      value={aisoForm.site_url}
                      onChange={(e) => setAisoForm(p => ({ ...p, site_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Cited Article URL</label>
                    <Input
                      placeholder="https://housingwire.com/article..."
                      value={aisoForm.article_url}
                      onChange={(e) => setAisoForm(p => ({ ...p, article_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Citation Query</label>
                    <Input
                      placeholder="e.g. cheap real estate listing video"
                      value={aisoForm.citation_query}
                      onChange={(e) => setAisoForm(p => ({ ...p, citation_query: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">AI Platform</label>
                    <select
                      value={aisoForm.ai_platform}
                      onChange={(e) => setAisoForm(p => ({ ...p, ai_platform: e.target.value }))}
                      className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="chatgpt">ChatGPT</option>
                      <option value="gemini">Gemini</option>
                      <option value="perplexity">Perplexity</option>
                      <option value="multiple">Multiple</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Outreach Type</label>
                    <select
                      value={aisoForm.outreach_type}
                      onChange={(e) => setAisoForm(p => ({ ...p, outreach_type: e.target.value }))}
                      className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="guest_post">Guest Post</option>
                      <option value="resource_page">Resource Page</option>
                      <option value="article_update">Article Update</option>
                      <option value="mention">Mention/Quote</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                    <select
                      value={aisoForm.priority}
                      onChange={(e) => setAisoForm(p => ({ ...p, priority: e.target.value }))}
                      className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Times Cited</label>
                    <Input
                      type="number"
                      min="1"
                      value={aisoForm.times_cited}
                      onChange={(e) => setAisoForm(p => ({ ...p, times_cited: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Contact Name</label>
                    <Input
                      placeholder="Author or editor name"
                      value={aisoForm.contact_name}
                      onChange={(e) => setAisoForm(p => ({ ...p, contact_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Contact Email</label>
                    <Input
                      placeholder="editor@site.com"
                      value={aisoForm.contact_email}
                      onChange={(e) => setAisoForm(p => ({ ...p, contact_email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                  <Textarea
                    placeholder="Write for us page URL, pitch angle, etc."
                    value={aisoForm.notes}
                    onChange={(e) => setAisoForm(p => ({ ...p, notes: e.target.value }))}
                    className="h-16"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addAisoTarget} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Add Target
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddAiso(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Total", count: aisoTargets.length, color: "text-foreground" },
                { label: "New", count: aisoTargets.filter(t => t.outreach_status === "new").length, color: "text-blue-600" },
                { label: "Contacted", count: aisoTargets.filter(t => t.outreach_status === "contacted").length, color: "text-amber-600" },
                { label: "In Progress", count: aisoTargets.filter(t => t.outreach_status === "in_progress").length, color: "text-purple-600" },
                { label: "Published", count: aisoTargets.filter(t => t.outreach_status === "published").length, color: "text-green-600" },
              ].map((s, i) => (
                <div key={i} className="bg-muted/30 rounded-lg border border-border p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Targets List */}
            {aisoLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading targets...
              </div>
            ) : aisoTargets.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No AISO targets yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search AI platforms for your keywords and add the sites they cite
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {aisoTargets.map((target) => {
                  const priorityColors: Record<string, string> = {
                    high: "bg-red-100 text-red-700",
                    medium: "bg-amber-100 text-amber-700",
                    low: "bg-gray-100 text-gray-600",
                  };
                  const statusColors: Record<string, string> = {
                    new: "bg-blue-100 text-blue-700",
                    contacted: "bg-amber-100 text-amber-700",
                    in_progress: "bg-purple-100 text-purple-700",
                    published: "bg-green-100 text-green-700",
                    rejected: "bg-red-100 text-red-700",
                  };
                  return (
                    <div key={target.id} className="bg-muted/30 rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{target.site_name}</p>
                            {target.times_cited > 1 && (
                              <span className="text-[10px] font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
                                Cited {target.times_cited}x
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityColors[target.priority] || "bg-gray-100 text-gray-600"}`}>
                              {target.priority}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[target.outreach_status] || "bg-gray-100 text-gray-600"}`}>
                              {target.outreach_status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                            {target.site_url && (
                              <a href={target.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                                <Globe className="h-3 w-3" />
                                {target.site_url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                              </a>
                            )}
                            {target.citation_query && (
                              <span className="flex items-center gap-1">
                                <Search className="h-3 w-3" />
                                "{target.citation_query}"
                              </span>
                            )}
                            {target.ai_platform && (
                              <span className="flex items-center gap-1 capitalize">
                                <MessageSquare className="h-3 w-3" />
                                {target.ai_platform}
                              </span>
                            )}
                            {target.contact_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {target.contact_email}
                              </span>
                            )}
                            {target.outreach_type && (
                              <span className="flex items-center gap-1 capitalize">
                                <Send className="h-3 w-3" />
                                {target.outreach_type.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          {target.notes && (
                            <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                              {target.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {target.outreach_status === "new" && (
                            <Button size="sm" variant="outline" onClick={() => updateAisoStatus(target.id, "contacted")} className="text-xs h-8">
                              Contacted
                            </Button>
                          )}
                          {target.outreach_status === "contacted" && (
                            <Button size="sm" variant="outline" onClick={() => updateAisoStatus(target.id, "in_progress")} className="text-xs h-8">
                              In Progress
                            </Button>
                          )}
                          {target.outreach_status === "in_progress" && (
                            <Button size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => updateAisoStatus(target.id, "published")}>
                              Published
                            </Button>
                          )}
                          {target.article_url && (
                            <a
                              href={target.article_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="View article"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteAisoTarget(target.id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
