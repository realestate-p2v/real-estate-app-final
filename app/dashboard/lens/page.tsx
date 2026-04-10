"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { LensConversionTracker } from "@/components/lens-conversion-tracker";
import { LensTrialBanner } from "@/components/lens-trial-banner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  Clock,
  Sofa,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  BookOpen,
  Lock,
  PenTool,
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
} from "lucide-react";

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */
const PROPERTY_SITE_BASE = "/p"; // Change to "https://" + slug + ".p2v.homes" when DNS is live

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

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface PublishedWebsite {
  id: string;
  address: string;
  website_slug: string;
  website_published: boolean;
  website_curated: any;
}

export default function DashboardLensPage() {
  const [user, setUser] = useState<any>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [freeLensExpired, setFreeLensExpired] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [publishedWebsites, setPublishedWebsites] = useState<PublishedWebsite[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setIsLoading(false); return; }
      setUser(authUser);

      const isAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email);
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber, subscription_tier, free_lens_expires_at, saved_agent_name")
        .eq("user_id", authUser.id)
        .single();

      if (usage?.saved_agent_name) setAgentName(usage.saved_agent_name);

      if (isAdmin) {
        setIsSubscriber(true);
      } else if (usage?.is_subscriber) {
        if (usage.subscription_tier === "free_prize" && usage.free_lens_expires_at) {
          const daysLeft = Math.ceil((new Date(usage.free_lens_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            setFreeLensExpired(true);
            await supabase.from("lens_usage").update({ is_subscriber: false, subscription_tier: null }).eq("user_id", authUser.id);
          } else {
            setIsSubscriber(true);
          }
        } else {
          setIsSubscriber(true);
        }
      }

      // Published property websites
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

      setIsLoading(false);
    };
    init();
  }, []);

  /* ─── Copy link handler ─── */
  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  /* ─── Get hero image from website_curated ─── */
  const getHeroImage = (curated: any): string | null => {
    if (!curated) return null;
    if (Array.isArray(curated) && curated.length > 0) return typeof curated[0] === "string" ? curated[0] : curated[0]?.url || null;
    if (curated.photos && Array.isArray(curated.photos) && curated.photos.length > 0) return typeof curated.photos[0] === "string" ? curated.photos[0] : curated.photos[0]?.url || null;
    if (curated.hero && Array.isArray(curated.hero) && curated.hero.length > 0) return typeof curated.hero[0] === "string" ? curated.hero[0] : curated.hero[0]?.url || null;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
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

  if (!isSubscriber) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <LensConversionTracker />
        <NonSubscriberLensPage freeLensExpired={freeLensExpired} />
      </div>
    );
  }

  // ── Subscriber: Clean tool launcher ──
  const tools = [
    {
      icon: Camera,
      label: "Photo Coach",
      desc: "AI scoring & feedback for your listing photos",
      href: "/dashboard/lens/coach",
      iconColor: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: PenTool,
      label: "Design Studio",
      desc: "Listing graphics, video remixes, flyers, yard signs",
      href: "/dashboard/lens/design-studio",
      iconColor: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      icon: MessageSquare,
      label: "Description Writer",
      desc: "MLS-ready listing copy from photos & details",
      href: "/dashboard/lens/descriptions",
      iconColor: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      icon: Sofa,
      label: "Virtual Staging",
      desc: "Furnish empty rooms with AI — 6 design styles",
      href: "/dashboard/lens/staging",
      iconColor: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: FileText,
      label: "Reports",
      desc: "Branded buyer & seller guides with AI content",
      href: "/dashboard/lens/reports",
      iconColor: "text-amber-400",
      bg: "bg-amber-500/10",
      badge: "PRO",
    },
    {
      icon: Film,
      label: "Order a Video",
      desc: "Cinematic listing walkthrough from $4.95/clip",
      href: "/order",
      iconColor: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
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
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <style dangerouslySetInnerHTML={{ __html: launcherStyles }} />

      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 30% 20%, rgba(56,189,248,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 80%, rgba(99,102,241,0.03) 0%, transparent 60%)" }} />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="launcher-item flex items-center justify-between mb-10" style={{ animationDelay: "0.05s" }}>
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

        {/* Tool Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {tools.map((tool, i) => (
            <Link
              key={tool.label}
              href={tool.href}
              className="launcher-item group relative flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/[0.06] hover:translate-y-[-2px] hover:shadow-lg hover:shadow-cyan-400/5"
              style={{ animationDelay: `${0.1 + i * 0.06}s` }}
            >
              {"badge" in tool && tool.badge && (
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {tool.badge}
                </span>
              )}
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

        {/* Quick Links */}
        <div className="launcher-item" style={{ animationDelay: "0.5s" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/25 mb-3">Quick Links</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] py-4 px-3 text-center transition-all hover:border-cyan-400/15 hover:bg-white/[0.05]"
              >
                <link.icon className="h-4 w-4 text-white/30 group-hover:text-cyan-400/70 transition-colors" />
                <span className="text-[11px] font-semibold text-white/50 group-hover:text-white/80 transition-colors">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══ PROPERTY WEBSITES ═══ */}
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
                  <div
                    key={site.id}
                    className="launcher-item rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]"
                    style={{ animationDelay: `${0.65 + i * 0.06}s` }}
                  >
                    {/* Hero image */}
                    <div className="relative h-40 w-full overflow-hidden">
                      {heroUrl ? (
                        <img src={heroUrl} alt={site.address} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(99,102,241,0.2) 50%, rgba(168,85,247,0.15) 100%)" }} />
                      )}
                      {/* Live badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-400">Live</span>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Your Property Website</p>
                      <p className="text-sm font-bold text-white/90 truncate">{site.address}</p>
                      <p className="text-[11px] text-cyan-400/60 truncate mt-0.5">{site.website_slug}.p2v.homes</p>
                    </div>
                    {/* Actions */}
                    <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-3">
                      <a
                        href={siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-white text-[11px] font-bold rounded-full px-3.5 py-1.5 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        View Live Page
                      </a>
                      <button
                        onClick={() => handleCopyLink(site.website_slug)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors"
                      >
                        {copiedSlug === site.website_slug ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied!</span></> : <><Copy className="h-3 w-3" />Copy Link</>}
                      </button>
                      <Link
                        href={`/dashboard/properties/${site.id}`}
                        className="ml-auto text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
                      >
                        Edit Settings →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 border-t border-white/[0.04] pt-6 pb-8 text-center">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NON-SUBSCRIBER — Upsell page
   ═══════════════════════════════════════════════ */
function NonSubscriberLensPage({ freeLensExpired }: { freeLensExpired: boolean }) {
  const features = [
    { icon: Camera, title: "AI Photo Coach", description: "AI-powered photo scoring & instant feedback during shoots.", actionLabel: "Start a Shoot", actionHref: "/dashboard/lens/coach" },
    { icon: PenTool, title: "Design Studio", description: "Listing graphics, video remixes, flyers, yard signs, branding cards.", actionLabel: "Open Design Studio", actionHref: "/dashboard/lens/design-studio" },
    { icon: MessageSquare, title: "Description Writer", description: "MLS-ready listing copy generated from your photos & details.", actionLabel: "Write a Description", actionHref: "/dashboard/lens/descriptions" },
    { icon: Sofa, title: "Virtual Staging", description: "Furnish empty rooms with AI — 6 design styles, before/after.", actionLabel: "Stage a Room", actionHref: "/dashboard/lens/staging" },
    { icon: FileText, title: "Reports", description: "Branded buyer & seller guides with AI-written content.", actionLabel: "Create Report", actionHref: "/dashboard/lens/reports", badge: "PRO" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">P2V Lens</h1>
          <p className="text-muted-foreground mt-1">Your AI-powered real estate marketing suite</p>
        </div>
      </div>

      <div className="mt-8"><LensTrialBanner /></div>

      {freeLensExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><Clock className="h-5 w-5 text-red-600" /></div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800">Your free month has ended</h3>
              <p className="text-sm text-red-700 mt-1">Subscribe to continue using all features.</p>
              <Button asChild size="sm" className="mt-3 bg-accent hover:bg-accent/90 text-accent-foreground font-black"><Link href="/lens">Subscribe — $27.95/mo</Link></Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 mt-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"><Lock className="h-6 w-6 text-muted-foreground" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">Unlock P2V Lens</h2>
            <p className="text-sm text-muted-foreground mt-1">AI photo coaching, design studio, listing descriptions, virtual staging, reports, and priority delivery.</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black"><Link href="/lens">Subscribe — $27.95/mo<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1.5 bg-accent rounded-full" />
          <h2 className="text-2xl font-bold text-foreground">What You Get</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description, actionLabel, actionHref, badge }, i) => (
            <Link key={i} href={actionHref} className="relative bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 block group">
              {badge && <span className="absolute top-3 right-3 text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{badge}</span>}
              {!badge && <span className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">With Subscription</span>}
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Icon className="h-5 w-5 text-accent" /></div>
              <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent pt-1">{actionLabel}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-5">
        <h2 className="text-2xl font-bold text-foreground">Your Complete Marketing Suite</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">Everything you need to market your listings — $27.95/month.</p>
        <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold"><Link href="/lens"><Sparkles className="mr-2 h-5 w-5" />Get P2V Lens</Link></Button>
      </div>

      <footer className="border-t py-8 mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video.</p>
      </footer>
    </div>
  );
}
