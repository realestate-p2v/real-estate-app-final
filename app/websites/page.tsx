"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/upgrade-modal";
import {
  ArrowLeft,
  Globe,
  Plus,
  Eye,
  Settings,
  Trash2,
  ExternalLink,
  Loader2,
  Home,
  User,
  BarChart3,
  Users,
  MousePointer,
  Copy,
  CheckCircle,
  Crown,
  Zap,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Website {
  id: string;
  name: string;
  site_type: "property" | "agent";
  status: "draft" | "published" | "suspended";
  slug: string | null;
  custom_domain: string | null;
  template: string;
  billing_type: "included" | "addon" | "owned";
  view_count: number;
  lead_count: number;
  last_viewed_at: string | null;
  owned_at: string | null;
  owned_expires_pro_at: string | null;
  created_at: string;
  updated_at: string;
  property_id: string | null;
}

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-gray-100 text-gray-600" },
  published: { label: "Live", classes: "bg-green-100 text-green-700" },
  suspended: { label: "Suspended", classes: "bg-red-100 text-red-600" },
};

const BILLING_LABELS: Record<string, { label: string; classes: string }> = {
  included: { label: "Included", classes: "bg-cyan-100 text-cyan-700" },
  addon: { label: "Add-on", classes: "bg-blue-100 text-blue-700" },
  owned: { label: "Owned", classes: "bg-amber-100 text-amber-700" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

export default function WebsitesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<"none" | "lens" | "pro">("none");
  const [includedSiteUsed, setIncludedSiteUsed] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/dashboard/websites");
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email || "");

    // Get subscription info
    if (isAdmin) {
      setSubscriptionTier("pro");
    } else {
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber, subscription_tier, included_website_used")
        .eq("user_id", user.id)
        .single();

      if (usage?.subscription_tier === "pro") {
        setSubscriptionTier("pro");
      } else if (usage?.subscription_tier === "lens" || usage?.is_subscriber) {
        setSubscriptionTier("lens");
      }
      if (usage?.included_website_used) setIncludedSiteUsed(true);
    }

    // Fetch websites
    const { data: sites } = await supabase
      .from("websites")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setWebsites(sites || []);

    // Check if included site is used based on actual data
    if (sites && sites.length > 0) {
      const hasIncluded = sites.some((s) => s.billing_type === "included");
      if (hasIncluded) setIncludedSiteUsed(true);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (site: Website) => {
    if (!confirm(`Delete "${site.name}"? This cannot be undone.`)) return;
    setDeleting(site.id);
    const { error } = await supabase.from("websites").delete().eq("id", site.id);
    if (!error) {
      setWebsites((prev) => prev.filter((s) => s.id !== site.id));
    } else {
      alert("Failed to delete: " + error.message);
    }
    setDeleting(null);
  };

  const handleCreateClick = () => {
    if (subscriptionTier !== "pro") {
      setShowUpgradeModal(true);
      return;
    }
    if (includedSiteUsed) {
      // They need to pay for an additional site
      setShowUpgradeModal(true);
      return;
    }
    router.push("/dashboard/websites/new");
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`https://${slug}.p2v.homes`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Count sites by type
  const includedCount = websites.filter((s) => s.billing_type === "included").length;
  const addonCount = websites.filter((s) => s.billing_type === "addon").length;
  const ownedCount = websites.filter((s) => s.billing_type === "owned").length;
  const totalViews = websites.reduce((sum, s) => sum + (s.view_count || 0), 0);
  const totalLeads = websites.reduce((sum, s) => sum + (s.lead_count || 0), 0);

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

  // If not Pro and no existing sites, show full-page upgrade
  if (subscriptionTier !== "pro" && websites.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentTier={subscriptionTier}
          includedSiteUsed={includedSiteUsed}
        />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Websites</h1>
              <p className="text-muted-foreground mt-1">Create and manage your property and portfolio websites</p>
            </div>
          </div>

          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Globe className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-3">Build Your Real Estate Website</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Create stunning property listing pages and agent portfolio websites. Own them forever for $399 or subscribe to Lens Pro.
            </p>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-3"
            >
              <Globe className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>

          {/* Two type cards */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-4">
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                <Home className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Property Website</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Showcase a single listing with photos, videos, virtual staging, descriptions, and lead capture.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Agent Portfolio</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Build your brand with a multi-page website featuring all your listings, bio, and neighborhood tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={subscriptionTier}
        includedSiteUsed={includedSiteUsed}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Websites</h1>
              <p className="text-muted-foreground mt-1">Create and manage your property and portfolio websites</p>
            </div>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Website
          </Button>
        </div>

        {/* Site count indicator */}
        <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{websites.length} website{websites.length !== 1 ? "s" : ""}</span>
          <span className="text-border">·</span>
          {includedCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              {includedCount} included
            </span>
          )}
          {addonCount > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {addonCount} add-on{addonCount !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {ownedCount > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {ownedCount} owned
              </span>
            </>
          )}
        </div>

        {/* Stats bar */}
        {websites.length > 0 && (totalViews > 0 || totalLeads > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Total Sites</p>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{websites.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Total Views</p>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{totalViews.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Total Leads</p>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{totalLeads.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Published</p>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {websites.filter((s) => s.status === "published").length}
              </p>
            </div>
          </div>
        )}

        {/* Add-on banner */}
        {includedSiteUsed && subscriptionTier === "pro" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                You&apos;ve used your included website
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Additional sites are $29.95/mo each, or own one outright for $399.
              </p>
            </div>
          </div>
        )}

        {/* Site cards */}
        {websites.length === 0 ? (
          /* Empty state for Pro users with no sites yet */
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <Globe className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground mb-2">Create your first website</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
              Choose between a single-listing property page or a full agent portfolio with multiple pages.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={() => router.push("/dashboard/websites/new?type=property")}
                className="bg-card rounded-2xl border-2 border-border hover:border-accent/40 hover:shadow-lg transition-all p-6 text-left group"
              >
                <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4 group-hover:bg-cyan-100 transition-colors">
                  <Home className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Property Website</h3>
                <p className="text-sm text-muted-foreground">
                  Showcase a single listing with photos, videos, staging, and lead capture.
                </p>
                <p className="text-xs font-semibold text-accent mt-3">Get Started →</p>
              </button>
              <button
                onClick={() => router.push("/dashboard/websites/new?type=agent")}
                className="bg-card rounded-2xl border-2 border-border hover:border-accent/40 hover:shadow-lg transition-all p-6 text-left group"
              >
                <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                  <User className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Agent Portfolio</h3>
                <p className="text-sm text-muted-foreground">
                  Multi-page brand site with listings, bio, about, contact, and neighborhood tools.
                </p>
                <p className="text-xs font-semibold text-accent mt-3">Get Started →</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {websites.map((site) => {
              const statusStyle = STATUS_STYLES[site.status] || STATUS_STYLES.draft;
              const billingStyle = BILLING_LABELS[site.billing_type] || BILLING_LABELS.included;
              const siteUrl = site.slug ? `https://${site.slug}.p2v.homes` : null;
              const isCopied = copiedSlug === site.slug;

              return (
                <div
                  key={site.id}
                  className="bg-card rounded-2xl border border-border p-5 sm:p-6 hover:border-accent/40 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      site.site_type === "property" ? "bg-cyan-50" : "bg-violet-50"
                    }`}>
                      {site.site_type === "property" ? (
                        <Home className="h-6 w-6 text-cyan-600" />
                      ) : (
                        <User className="h-6 w-6 text-violet-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-foreground truncate">{site.name}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.classes}`}>
                          {statusStyle.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          site.site_type === "property"
                            ? "bg-cyan-50 text-cyan-700"
                            : "bg-violet-50 text-violet-700"
                        }`}>
                          {site.site_type === "property" ? "Property" : "Portfolio"}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${billingStyle.classes}`}>
                          {billingStyle.label}
                        </span>
                      </div>

                      {/* Domain */}
                      {siteUrl && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-xs text-muted-foreground truncate">{site.slug}.p2v.homes</p>
                          <button
                            onClick={() => copyUrl(site.slug!)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isCopied ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-4 mt-2.5">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {(site.view_count || 0).toLocaleString()} views
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {(site.lead_count || 0).toLocaleString()} leads
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Updated {timeAgo(site.updated_at)}
                        </span>
                      </div>

                      {/* Owned expiry warning */}
                      {site.billing_type === "owned" && site.owned_expires_pro_at && (
                        (() => {
                          const expiresAt = new Date(site.owned_expires_pro_at);
                          const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (daysLeft <= 0) {
                            return (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700">
                                <AlertCircle className="h-3 w-3" />
                                AI tools expired — site is still live
                              </div>
                            );
                          }
                          if (daysLeft <= 30) {
                            return (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                                <AlertCircle className="h-3 w-3" />
                                AI tools expire in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {site.status === "published" && siteUrl && (
                        <a
                          href={siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs px-4 py-2 rounded-full transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </a>
                      )}
                      <Link
                        href={`/dashboard/websites/${site.id}`}
                        className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs px-4 py-2 rounded-full transition-colors"
                      >
                        <Settings className="h-3 w-3" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(site)}
                        disabled={deleting === site.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        {deleting === site.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/dashboard/properties" className="hover:text-foreground transition-colors">Properties</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
