"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  Sofa,
  ArrowRight,
  MessageSquare,
  BookOpen,
  Lock,
  PenTool,
  Crosshair,
  Film,
  Home,
  FileText,
  Loader2,
  Globe,
  Palette,
  LayoutDashboard,
  User,
  Eye,
  Copy,
  Check,
  ImageIcon,
  Zap,
  MapPin,
  TrendingUp,
  Video,
  X,
  Crown,
} from "lucide-react";

/* ─── Lazy-loaded ─── */
const LensConversionTracker = dynamic(() => import("@/components/lens-conversion-tracker").then(m => ({ default: m.LensConversionTracker })), { ssr: false });

const PROPERTY_SITE_BASE = "/p";

const launcherStyles = `
  @keyframes launcher-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .launcher-item {
    opacity: 0;
    animation: launcher-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

interface PublishedWebsite {
  id: string;
  address: string;
  website_slug: string;
  website_published: boolean;
  website_curated: any;
}

/* ─────────────────────────────────────────────
   Access gating
   ───────────────────────────────────────────── */
const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

type AccessResult = {
  allowed: boolean;
  reason: "admin" | "pro" | "tools" | "trial" | "video_only" | "free";
  tier: "admin" | "pro" | "tools" | "trial" | "video_only" | "free";
  trialDaysLeft?: number;
  hasVideo?: boolean;
};

function checkAccess(
  email: string,
  lensUsage: any,
  hasPaidOrder: boolean
): AccessResult {
  if (ADMIN_EMAILS.includes(email)) {
    return { allowed: true, reason: "admin", tier: "admin" };
  }
  if (lensUsage?.is_subscriber && lensUsage.subscription_tier === "pro") {
    return { allowed: true, reason: "pro", tier: "pro" };
  }
  if (lensUsage?.is_subscriber && lensUsage.subscription_tier === "tools") {
    return { allowed: true, reason: "tools", tier: "tools" };
  }
  if (lensUsage?.is_subscriber) {
    return { allowed: true, reason: "tools", tier: "tools" };
  }
  if (lensUsage?.trial_expires_at) {
    const expires = new Date(lensUsage.trial_expires_at);
    if (expires > new Date()) {
      const daysLeft = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { allowed: true, reason: "trial", tier: "trial", trialDaysLeft: daysLeft };
    }
  }
  if (hasPaidOrder) {
    return { allowed: false, reason: "video_only", tier: "video_only", hasVideo: true };
  }
  return { allowed: false, reason: "free", tier: "free", hasVideo: false };
}

const PRO_ONLY_TOOLS = ["location_value_score", "agent_website", "custom_reports"];

function checkToolAccess(toolKey: string, access: AccessResult): {
  canUse: boolean;
  gateType: "none" | "subscribe" | "upgrade_pro" | "buy_video";
} {
  if (access.tier === "admin") return { canUse: true, gateType: "none" };
  if (access.tier === "pro") return { canUse: true, gateType: "none" };
  if (PRO_ONLY_TOOLS.includes(toolKey)) return { canUse: false, gateType: "upgrade_pro" };
  if (access.tier === "tools" || access.tier === "trial") return { canUse: true, gateType: "none" };
  if (toolKey === "video_remix" && access.hasVideo) return { canUse: true, gateType: "none" };
  if (access.tier === "video_only") return { canUse: false, gateType: "subscribe" };
  return { canUse: false, gateType: "buy_video" };
}

export default function DashboardLensPage() {
  const [user, setUser] = useState<any>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [coreReady, setCoreReady] = useState(false);
  const [freeLensExpired, setFreeLensExpired] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [publishedWebsites, setPublishedWebsites] = useState<PublishedWebsite[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessResult>({ allowed: false, reason: "free", tier: "free", hasVideo: false });
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      // getSession reads from local token — much faster than getUser network call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setCoreReady(true); return; }
      const authUser = session.user;
      setUser(authUser);

      const isAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email);
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber, subscription_tier, free_lens_expires_at, trial_activated_at, trial_expires_at, saved_agent_name")
        .eq("user_id", authUser.id)
        .single();

      if (usage?.saved_agent_name) setAgentName(usage.saved_agent_name);

      // Check if user has any paid video orders
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .eq("payment_status", "paid");
      const hasPaidOrder = (orderCount || 0) > 0;

      // Build access result
      const accessResult = checkAccess(authUser.email || "", usage, hasPaidOrder);
      setAccess(accessResult);

      if (isAdmin) {
        setIsSubscriber(true);
      } else if (usage?.is_subscriber) {
        if (usage.subscription_tier === "free_prize" && usage.free_lens_expires_at) {
          const daysLeft = Math.ceil((new Date(usage.free_lens_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            setFreeLensExpired(true);
            supabase.from("lens_usage").update({ is_subscriber: false, subscription_tier: null }).eq("user_id", authUser.id);
          } else {
            setIsSubscriber(true);
          }
        } else {
          setIsSubscriber(true);
        }
      }

      // ═══ PHASE 1 DONE — show UI immediately ═══
      setCoreReady(true);

      // ═══ PHASE 2 — load websites in background ═══
      const { data: publishedSites } = await supabase
        .from("agent_properties")
        .select("id, address, website_slug, website_published, website_curated")
        .eq("user_id", authUser.id)
        .eq("website_published", true)
        .is("merged_into_id", null)
        .not("website_slug", "is", null)
        .order("updated_at", { ascending: false })
        .limit(3);
      if (publishedSites) setPublishedWebsites(publishedSites);
    };
    init();
  }, []);

  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getHeroImage = (curated: any): string | null => {
    if (!curated) return null;
    if (Array.isArray(curated) && curated.length > 0) return typeof curated[0] === "string" ? curated[0] : curated[0]?.url || null;
    if (curated.photos && Array.isArray(curated.photos) && curated.photos.length > 0) return typeof curated.photos[0] === "string" ? curated.photos[0] : curated.photos[0]?.url || null;
    if (curated.hero && Array.isArray(curated.hero) && curated.hero.length > 0) return typeof curated.hero[0] === "string" ? curated.hero[0] : curated.hero[0]?.url || null;
    return null;
  };

  if (!coreReady) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="bg-card rounded-2xl border border-border p-10 space-y-5">
            <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-extrabold text-foreground">Sign in to access P2V Lens</h1>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base">
              <Link href="/login?redirect=/dashboard/lens">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasAccess = access.allowed;
  const isTrial = access.tier === "trial";

  // Helper: crown tier badge (subtle visual indicator — gating is handled by GateOverlay)
  const PRO_TOOLS = ["location_value_score", "website_builder"];
  const NO_CROWN_TOOLS = ["order_video", "video_remix"];

  const gated = (toolKey: string) => {
    const ta = checkToolAccess(toolKey, access);
    const trialBadge = (isTrial && access.trialDaysLeft !== undefined)
      ? `TRIAL: ${access.trialDaysLeft}d` : undefined;

    if (NO_CROWN_TOOLS.includes(toolKey)) {
      return { badge: trialBadge, badgeColor: trialBadge ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : undefined, crown: undefined as "silver" | "gold" | undefined };
    }
    const crown = PRO_TOOLS.includes(toolKey) ? "gold" as const : "silver" as const;
    return { badge: trialBadge, badgeColor: trialBadge ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : undefined, crown };
  };

  const tools = [
    { icon: hasAccess ? Film : Video, label: "Order a Video", desc: hasAccess ? "Cinematic listing walkthrough from $4.95/clip" : "Cinematic listing walkthrough from $79", href: "/order", iconColor: "text-cyan-400", bg: "bg-cyan-500/10" },
    { icon: Film, label: "Video Remix", desc: "Remix your clips into social-ready videos with music & branding", href: "/dashboard/lens/remix", iconColor: "text-purple-400", bg: "bg-purple-500/10", ...gated("video_remix") },
    { icon: MessageSquare, label: "Description Writer", desc: "MLS-ready listing copy from photos & details", href: "/dashboard/lens/descriptions", iconColor: "text-sky-400", bg: "bg-sky-500/10", ...gated("description_writer") },
    { icon: PenTool, label: "Design Studio", desc: "Listing graphics, flyers, yard signs, branding cards", href: "/dashboard/lens/design-studio", iconColor: "text-indigo-400", bg: "bg-indigo-500/10", ...gated("design_studio") },
    { icon: Globe, label: "Website Builder", desc: "Build your full agent website with AI-powered content", href: "#", iconColor: "text-sky-400", bg: "bg-sky-500/10", ...gated("website_builder") },
    { icon: ImageIcon, label: "Photo Optimizer", desc: "Batch compress for MLS, Zillow, social — under 290KB", href: "/dashboard/lens/optimize", iconColor: "text-emerald-400", bg: "bg-emerald-500/10", ...gated("photo_optimizer") },
    { icon: Crosshair, label: "Drone Mark", desc: "Annotate aerial photos with lot lines, branded pins & labels", href: "/dashboard/lens/dronemark", iconColor: "text-amber-400", bg: "bg-amber-500/10", ...gated("drone_mark") },
    { icon: Camera, label: "Photo Coach", desc: "AI scoring & feedback for your listing photos", href: "/dashboard/lens/coach", iconColor: "text-blue-400", bg: "bg-blue-500/10", ...gated("photo_coach") },
    { icon: Sofa, label: "Virtual Staging", desc: "Furnish empty rooms with AI — 6 design styles", href: "/dashboard/lens/staging", iconColor: "text-violet-400", bg: "bg-violet-500/10", ...gated("virtual_staging") },
    { icon: FileText, label: "Reports", desc: "Branded buyer & seller guides with AI content", href: "/dashboard/lens/reports", iconColor: "text-amber-400", bg: "bg-amber-500/10", ...gated("custom_reports") },
    { icon: MapPin, label: "Location Value Score", desc: "Neighborhood insights for your listing", href: "#", iconColor: "text-emerald-400", bg: "bg-emerald-500/10", ...gated("location_value_score") },
    { icon: TrendingUp, label: "Value Boost Report", desc: "ROI-ranked improvement suggestions", href: "#", iconColor: "text-rose-400", bg: "bg-rose-500/10", ...gated("value_boost") },
  ];

  const quickLinks = [
    { icon: Home, label: "My Properties", href: "/dashboard/properties" },
    { icon: User, label: "Agent Profile", href: "/dashboard/profile" },
    { icon: Palette, label: "Brand Colors", href: "/dashboard/profile" },
    { icon: Globe, label: "Property Websites", href: "/dashboard/properties" },
    { icon: LayoutDashboard, label: "Full Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "Photo Guide", href: "/resources/photography-guide" },
  ];

  const firstName = agentName?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      {!isSubscriber && <LensConversionTracker />}
      <style dangerouslySetInnerHTML={{ __html: launcherStyles }} />

      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 30% 20%, rgba(56,189,248,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 80%, rgba(99,102,241,0.03) 0%, transparent 60%)" }} />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="launcher-item flex items-center justify-between mb-6" style={{ animationDelay: "0.05s" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400/80 uppercase tracking-wider">P2V Lens</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              What are you working on, <span className="text-cyan-400">{firstName}</span>?
            </h1>
          </div>
          <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        {/* ═══ TRIAL BANNER ═══ */}
        {access.tier === "trial" && access.trialDaysLeft !== undefined && (
          <div className={`launcher-item mb-6 rounded-xl border p-4 ${access.trialDaysLeft <= 3 ? "border-amber-400/20 bg-amber-400/[0.06]" : "border-cyan-400/15 bg-cyan-400/[0.04]"}`} style={{ animationDelay: "0.07s" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${access.trialDaysLeft <= 3 ? "text-amber-400" : "text-cyan-400"}`} />
                <span className="text-sm font-bold text-white/90">Lens Trial</span>
                <span className={`text-sm font-bold ${access.trialDaysLeft <= 3 ? "text-amber-400" : "text-cyan-400"}`}>{access.trialDaysLeft} day{access.trialDaysLeft !== 1 ? "s" : ""} remaining</span>
              </div>
              <Link href="/lens#pricing"><Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs">Subscribe now →</Button></Link>
            </div>
          </div>
        )}

        {/* ═══ FREE ACCOUNT BANNER ═══ */}
        {access.tier === "free" && !bannerDismissed && (
          <div className="launcher-item mb-6 rounded-xl border border-green-400/15 bg-green-400/[0.04] p-5 relative" style={{ animationDelay: "0.07s" }}>
            <button onClick={() => setBannerDismissed(true)} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors"><X className="h-4 w-4" /></button>
            <div className="flex items-start gap-3">
              <Film className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white/90">Order your first listing video to unlock 10 days of every AI marketing tool — free.</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Your first video order comes with a 10-day trial of all P2V Lens tools. No credit card required for the trial.</p>
                <Link href="/order" className="mt-3 inline-block"><Button size="sm" className="bg-green-500 hover:bg-green-400 text-white font-bold text-xs px-4 py-2 rounded-lg">Order a Video — from $79 <ArrowRight className="ml-1.5 h-3 w-3" /></Button></Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══ VIDEO OWNER BANNER — trial expired ═══ */}
        {access.tier === "video_only" && !bannerDismissed && (
          <div className="launcher-item mb-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5 relative" style={{ animationDelay: "0.07s" }}>
            <button onClick={() => setBannerDismissed(true)} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors"><X className="h-4 w-4" /></button>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white/90">Your trial has ended</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Subscribe to keep using all marketing tools. Your videos and Video Remix are still available.</p>
                <div className="flex items-center gap-3 mt-3">
                  <Link href="/lens#pricing"><Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs px-4 py-2 rounded-lg">Subscribe — $27/mo</Button></Link>
                  <Link href="/lens#pricing" className="text-xs font-semibold text-cyan-400/60 hover:text-cyan-400 transition-colors">See Plans</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {tools.map((tool, i) => (
            <Link
              key={tool.label}
              href={tool.href}
              className="launcher-item group relative flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/[0.06] hover:translate-y-[-2px] hover:shadow-lg hover:shadow-cyan-400/5"
              style={{ animationDelay: `${0.1 + i * 0.06}s` }}
            >
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {"badge" in tool && tool.badge && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tool.badgeColor || ""}`}>
                    {tool.badge}
                  </span>
                )}
                {"crown" in tool && tool.crown === "gold" && <Crown className="h-3.5 w-3.5 text-amber-400/50" />}
                {"crown" in tool && tool.crown === "silver" && <Crown className="h-3.5 w-3.5 text-gray-400/40" />}
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tool.bg} ring-1 ring-white/[0.08] transition-transform group-hover:scale-110`}>
                <tool.icon className={`h-6 w-6 ${tool.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-white/90 group-hover:text-cyan-300 transition-colors">{tool.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/40">{tool.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 mt-1 text-white/15 group-hover:text-cyan-400 transition-all group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        <div className="launcher-item" style={{ animationDelay: "0.5s" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/25 mb-3">Quick Links</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickLinks.map((link) => (
              <Link key={link.label} href={link.href} className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] py-4 px-3 text-center transition-all hover:border-cyan-400/15 hover:bg-white/[0.05]">
                <link.icon className="h-4 w-4 text-white/30 group-hover:text-cyan-400/70 transition-colors" />
                <span className="text-[11px] font-semibold text-white/50 group-hover:text-white/80 transition-colors">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {publishedWebsites.length > 0 && (
          <div className="launcher-item mt-10" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white/30">Your Property Websites</p>
              <Link href="/dashboard/properties" className="text-xs font-semibold text-cyan-400/60 hover:text-cyan-400 transition-colors">View all →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {publishedWebsites.map((site, i) => {
                const heroUrl = getHeroImage(site.website_curated);
                const siteUrl = `${PROPERTY_SITE_BASE}/${site.website_slug}`;
                return (
                  <div key={site.id} className="launcher-item rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]" style={{ animationDelay: `${0.65 + i * 0.06}s` }}>
                    <div className="relative h-40 w-full overflow-hidden">
                      {heroUrl ? <img src={heroUrl} alt={site.address} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(99,102,241,0.2) 50%, rgba(168,85,247,0.15) 100%)" }} />}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1"><div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-[10px] font-bold text-green-400">Live</span></div>
                    </div>
                    <div className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Your Property Website</p><p className="text-sm font-bold text-white/90 truncate">{site.address}</p><p className="text-[11px] text-cyan-400/60 truncate mt-0.5">{site.website_slug}.p2v.homes</p></div>
                    <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-3">
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-white text-[11px] font-bold rounded-full px-3.5 py-1.5 transition-colors"><Eye className="h-3 w-3" />View Live Page</a>
                      <button onClick={() => handleCopyLink(site.website_slug)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors">{copiedSlug === site.website_slug ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied!</span></> : <><Copy className="h-3 w-3" />Copy Link</>}</button>
                      <Link href={`/dashboard/properties/${site.id}`} className="ml-auto text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors">Edit Settings →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-16 border-t border-white/[0.04] pt-6 pb-8 text-center">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
