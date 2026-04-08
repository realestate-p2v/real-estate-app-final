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
  Zap,
  Clock,
  Sofa,
  ArrowRight,
  ArrowLeft,
  ImageIcon,
  MessageSquare,
  Play,
  BookOpen,
  Lock,
  Crown,
  PenTool,
  Film,
  Gift,
  Home,
  LayoutDashboard,
  ChevronRight,
  FileText,
  Percent,
  ShieldCheck,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Keyframe styles for Mission Control
   ───────────────────────────────────────────── */
const mcStyles = `
  @keyframes mc-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mc-chip-in {
    from { opacity: 0; transform: translateY(10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .mc-animate {
    opacity: 0;
    animation: mc-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .mc-chip-animate {
    opacity: 0;
    animation: mc-chip-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface LensSubscription {
  active: boolean;
  plan: string | null;
  analysesUsed: number;
  analysesLimit: number;
  renewsAt: string | null;
}

/* ═══════════════════════════════════════════════
   MAIN PAGE EXPORT
   ═══════════════════════════════════════════════ */
export default function DashboardLensPage() {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [subscription, setSubscription] = useState<LensSubscription>({
    active: false,
    plan: null,
    analysesUsed: 0,
    analysesLimit: 200,
    renewsAt: null,
  });

  const [coachSessionCount, setCoachSessionCount] = useState(0);
  const [descriptionCount, setDescriptionCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Free Lens prize state
  const [isFreePrize, setIsFreePrize] = useState(false);
  const [freeLensDaysLeft, setFreeLensDaysLeft] = useState<number | null>(null);
  const [freeLensExpired, setFreeLensExpired] = useState(false);

  useEffect(() => {
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "",
      });

      const isAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email);

      const { data: usage } = await supabase
        .from("lens_usage")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      const { data: sessions } = await supabase
        .from("lens_sessions")
        .select("total_analyses")
        .eq("user_id", authUser.id);
      const totalFromSessions = (sessions || []).reduce((sum: number, s: { total_analyses: number | null }) => sum + (s.total_analyses || 0), 0);
      const totalAnalyses = Math.max(usage?.total_analyses || 0, totalFromSessions);

      if (isAdmin) {
        setSubscription({
          active: true,
          plan: "Admin",
          analysesUsed: totalAnalyses,
          analysesLimit: 200,
          renewsAt: null,
        });
      } else if (usage?.is_subscriber) {
        if (usage.subscription_tier === "free_prize" && usage.free_lens_expires_at) {
          const expiresAt = new Date(usage.free_lens_expires_at);
          const now = new Date();
          const msLeft = expiresAt.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

          if (daysLeft <= 0) {
            setFreeLensExpired(true);
            setIsFreePrize(false);
            await supabase.from("lens_usage").update({
              is_subscriber: false,
              subscription_tier: null,
            }).eq("user_id", authUser.id);
            setSubscription({
              active: false,
              plan: null,
              analysesUsed: totalAnalyses,
              analysesLimit: 200,
              renewsAt: null,
            });
          } else {
            setIsFreePrize(true);
            setFreeLensDaysLeft(daysLeft);
            setSubscription({
              active: true,
              plan: "Free Month",
              analysesUsed: totalAnalyses,
              analysesLimit: 200,
              renewsAt: null,
            });
          }
        } else {
          setSubscription({
            active: true,
            plan: usage.subscription_tier || "Individual",
            analysesUsed: totalAnalyses,
            analysesLimit: 200,
            renewsAt: null,
          });
        }
      }

      const { count: sessionCount } = await supabase
        .from("lens_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id);
      setCoachSessionCount(sessionCount || 0);

      const { count: descCount } = await supabase
        .from("lens_descriptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id);
      setDescriptionCount(descCount || 0);

      const { count: propCount } = await supabase
        .from("agent_properties")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id);
      setPropertyCount(propCount || 0);

      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <style dangerouslySetInnerHTML={{ __html: mcStyles }} />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  // ── Subscriber gets Mission Control ──
  if (subscription.active && user) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <style dangerouslySetInnerHTML={{ __html: mcStyles }} />
        <MissionControlDashboard
          user={user}
          subscription={subscription}
          coachSessionCount={coachSessionCount}
          descriptionCount={descriptionCount}
          propertyCount={propertyCount}
          isFreePrize={isFreePrize}
          freeLensDaysLeft={freeLensDaysLeft}
        />
      </div>
    );
  }

  // ── Non-subscriber gets light-theme upsell page ──
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <LensConversionTracker />
      <NonSubscriberPage
        freeLensExpired={freeLensExpired}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MISSION CONTROL DASHBOARD — Subscriber view
   ═══════════════════════════════════════════════ */
function MissionControlDashboard({
  user,
  subscription,
  coachSessionCount,
  descriptionCount,
  propertyCount,
  isFreePrize,
  freeLensDaysLeft,
}: {
  user: { id: string; email: string; name?: string };
  subscription: LensSubscription;
  coachSessionCount: number;
  descriptionCount: number;
  propertyCount: number;
  isFreePrize: boolean;
  freeLensDaysLeft: number | null;
}) {
  const [activeTab, setActiveTab] = useState<"tools" | "coming-soon">("tools");
  const firstName = user.name?.split(" ")[0] || "there";

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const usagePercent = subscription.analysesLimit > 0
    ? Math.round((subscription.analysesUsed / subscription.analysesLimit) * 100)
    : 0;

  const tools = [
    {
      icon: Camera,
      label: "Photo Coach",
      desc: "AI-powered photo scoring & feedback",
      href: "/dashboard/lens/coach",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      ring: "ring-blue-400/20",
      stat: coachSessionCount > 0 ? `${coachSessionCount} session${coachSessionCount !== 1 ? "s" : ""}` : null,
    },
    {
      icon: PenTool,
      label: "Design Studio",
      desc: "Marketing graphics, remix clips, listing flyers",
      href: "/dashboard/lens/design-studio",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      ring: "ring-indigo-400/20",
      stat: null,
    },
    {
      icon: MessageSquare,
      label: "Description Writer",
      desc: "MLS-ready listing copy from your photos",
      href: "/dashboard/lens/descriptions",
      color: "text-sky-400",
      bg: "bg-sky-400/10",
      ring: "ring-sky-400/20",
      stat: descriptionCount > 0 ? `${descriptionCount} description${descriptionCount !== 1 ? "s" : ""}` : null,
    },
    {
      icon: Sofa,
      label: "Virtual Staging",
      desc: "Furnish empty rooms with AI in seconds",
      href: "/dashboard/lens/staging",
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      ring: "ring-violet-400/20",
      stat: null,
    },
    {
      icon: FileText,
      label: "Reports",
      desc: "Branded buyer & seller guides",
      href: "/dashboard/lens/reports",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      ring: "ring-amber-400/20",
      stat: null,
      badge: "PRO",
    },
  ];

  const comingSoonTools = [
    {
      icon: ImageIcon,
      label: "Photo Enhancement",
      desc: "AI brightness, color, white balance, and vertical line correction on every photo",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      ring: "ring-emerald-400/20",
    },
    {
      icon: Percent,
      label: "10% Off Every Video",
      desc: "Automatic subscriber discount applied at checkout on all video orders",
      color: "text-green-400",
      bg: "bg-green-400/10",
      ring: "ring-green-400/20",
    },
    {
      icon: Zap,
      label: "Priority Delivery",
      desc: "12-hour turnaround instead of 24 hours — subscribers always go first",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      ring: "ring-yellow-400/20",
    },
    {
      icon: Sparkles,
      label: "AI Suggest",
      desc: "Auto-fill optimal camera directions when ordering videos based on room type",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      ring: "ring-cyan-400/20",
    },
  ];

  return (
    <>
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(56, 189, 248, 0.05) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 85% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 60%),
          radial-gradient(ellipse 80% 40% at 50% 100%, rgba(56, 189, 248, 0.03) 0%, transparent 50%)
        `,
      }} />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* ═══ HEADER ═══ */}
        <div className="mc-animate flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                {getTimeOfDay()},{" "}
                <span className="text-cyan-400">{firstName}</span>
              </h1>
              <p className="mt-0.5 text-sm text-white/40">P2V Lens · Mission Control</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 backdrop-blur-sm">
              <Crown className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-bold text-white/80">{subscription.plan}</span>
              <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">Active</span>
            </div>
          </div>
        </div>

        {/* ═══ FREE PRIZE COUNTDOWN ═══ */}
        {isFreePrize && freeLensDaysLeft !== null && (
          <div className={`mc-animate mt-6 rounded-2xl border p-4 sm:p-5 ${
            freeLensDaysLeft <= 5
              ? "border-amber-400/20 bg-amber-400/[0.06]"
              : "border-cyan-400/15 bg-cyan-400/[0.04]"
          }`} style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start gap-3 sm:items-center">
              <Gift className={`h-5 w-5 shrink-0 ${freeLensDaysLeft <= 5 ? "text-amber-400" : "text-cyan-400"}`} />
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-white/90">Free Lens Month</span>
                  <span className={`ml-2 text-sm font-bold ${freeLensDaysLeft <= 5 ? "text-amber-400" : "text-cyan-400"}`}>
                    {freeLensDaysLeft} day{freeLensDaysLeft !== 1 ? "s" : ""} remaining
                  </span>
                </div>
                {freeLensDaysLeft <= 5 && (
                  <Link href="/lens">
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs">
                      Subscribe Now — $27.95/mo
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STATS ROW ═══ */}
        <div className="mc-animate mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "0.12s" }}>
          {[
            { label: "Properties", value: propertyCount, icon: Home, color: "text-emerald-400" },
            { label: "Coach Sessions", value: coachSessionCount, icon: Camera, color: "text-blue-400" },
            { label: "Descriptions", value: descriptionCount, icon: MessageSquare, color: "text-sky-400" },
            { label: "Photo Analyses", value: `${subscription.analysesUsed}/${subscription.analysesLimit}`, icon: Sparkles, color: "text-cyan-400", isUsage: true },
          ].map((stat, i) => (
            <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/35">{stat.label}</span>
              </div>
              <p className="text-xl font-extrabold text-white/90 sm:text-2xl">{stat.value}</p>
              {"isUsage" in stat && stat.isUsage && (
                <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usagePercent > 95 ? "bg-red-400" : usagePercent > 80 ? "bg-amber-400" : "bg-cyan-400"
                    }`}
                    style={{ width: `${Math.max(Math.min(usagePercent, 100), 2)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ═══ QUICK ACTIONS ROW ═══ */}
        <div className="mc-animate mt-6 grid gap-3 sm:grid-cols-2" style={{ animationDelay: "0.18s" }}>
          {/* Order Video */}
          <Link href="/order" className="group flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4 sm:p-5 transition-all hover:border-cyan-400/25 hover:bg-cyan-400/[0.08]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
              <Play className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Order a Listing Video</p>
              <p className="mt-0.5 text-xs text-white/40">
                Starting at <span className="font-bold text-cyan-400">$4.95/clip</span>
                <span className="text-white/30"> · 5 clip minimum</span>
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-400" />
          </Link>

          {/* My Properties */}
          <Link href="/dashboard/properties" className="group flex items-center gap-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4 sm:p-5 transition-all hover:border-emerald-400/25 hover:bg-emerald-400/[0.08]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <Home className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">My Properties</p>
              <p className="mt-0.5 text-xs text-white/40">
                {propertyCount > 0
                  ? `${propertyCount} ${propertyCount === 1 ? "property" : "properties"} — photos, videos & marketing`
                  : "Add your first property to get started"
                }
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400" />
          </Link>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="mc-animate mt-10 flex items-center gap-1 border-b border-white/[0.06] pb-0" style={{ animationDelay: "0.22s" }}>
          <button
            onClick={() => setActiveTab("tools")}
            className={`px-4 py-2.5 text-sm font-bold transition-colors relative ${
              activeTab === "tools"
                ? "text-cyan-400"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Your Tools
            {activeTab === "tools" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("coming-soon")}
            className={`px-4 py-2.5 text-sm font-bold transition-colors relative ${
              activeTab === "coming-soon"
                ? "text-cyan-400"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Coming Soon
            {activeTab === "coming-soon" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        </div>

        {/* ═══ TOOLS GRID ═══ */}
        {activeTab === "tools" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <Link
                key={tool.label}
                href={tool.href}
                className="mc-chip-animate group relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]"
                style={{ animationDelay: `${0.28 + i * 0.06}s` }}
              >
                {"badge" in tool && tool.badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    {tool.badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} transition-transform group-hover:scale-110`}>
                    <tool.icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white/90 group-hover:text-cyan-300 transition-colors">{tool.label}</p>
                    {tool.stat && (
                      <p className="text-[11px] font-medium text-white/30">{tool.stat}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-white/40">{tool.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400/60 group-hover:text-cyan-400 transition-colors mt-auto pt-1">
                  Open
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}

            {/* Quick Videos card */}
            <Link
              href="/order"
              className="mc-chip-animate group relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]"
              style={{ animationDelay: `${0.28 + tools.length * 0.06}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 ring-1 ring-teal-400/20 transition-transform group-hover:scale-110">
                  <Film className="h-5 w-5 text-teal-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white/90 group-hover:text-cyan-300 transition-colors">Quick Videos</p>
                  <p className="text-[11px] font-medium text-white/30">From $4.95/clip</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-white/40">Short clips for social teasers, listing refreshers, and open house promos</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400/60 group-hover:text-cyan-400 transition-colors mt-auto pt-1">
                Order
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        )}

        {/* ═══ COMING SOON TAB ═══ */}
        {activeTab === "coming-soon" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {comingSoonTools.map((tool, i) => (
              <div
                key={tool.label}
                className="mc-chip-animate flex items-start gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 opacity-70"
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring}`}>
                  <tool.icon className={`h-5 w-5 ${tool.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white/70">{tool.label}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ QUICK RESOURCES ═══ */}
        <div className="mc-animate mt-10" style={{ animationDelay: "0.6s" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Resources</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/order" className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all hover:border-cyan-400/15 hover:bg-white/[0.05]">
              <Play className="h-4 w-4 text-cyan-400/60" />
              <span className="text-sm font-semibold text-white/60 group-hover:text-cyan-300 transition-colors">Order a Video</span>
              <ChevronRight className="h-3 w-3 ml-auto text-white/20" />
            </Link>
            <Link href="/tips" className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all hover:border-cyan-400/15 hover:bg-white/[0.05]">
              <BookOpen className="h-4 w-4 text-cyan-400/60" />
              <span className="text-sm font-semibold text-white/60 group-hover:text-cyan-300 transition-colors">Photo Tips</span>
              <ChevronRight className="h-3 w-3 ml-auto text-white/20" />
            </Link>
            <Link href="/resources/photography-guide" className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all hover:border-cyan-400/15 hover:bg-white/[0.05]">
              <Camera className="h-4 w-4 text-cyan-400/60" />
              <span className="text-sm font-semibold text-white/60 group-hover:text-cyan-300 transition-colors">Photography Guide</span>
              <ChevronRight className="h-3 w-3 ml-auto text-white/20" />
            </Link>
          </div>
        </div>

        {/* ═══ SUBSCRIBER PERKS ═══ */}
        <div className="mc-animate mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm" style={{ animationDelay: "0.65s" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Your Subscriber Perks</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { icon: Percent, text: "10% off every video order" },
              { icon: ImageIcon, text: "Free photo enhancement" },
              { icon: Clock, text: "Priority 12hr processing" },
              { icon: Film, text: "Quick Videos from $4.95/clip" },
              { icon: ShieldCheck, text: "Satisfaction guarantee" },
            ].map((perk) => (
              <div key={perk.text} className="flex items-center gap-2 text-xs text-white/45">
                <perk.icon className="h-3 w-3 text-cyan-400/50" />
                {perk.text}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="mt-12 border-t border-white/[0.04] pt-6 pb-8 text-center">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard" className="text-xs text-white/25 hover:text-white/50 transition-colors">Dashboard</Link>
            <Link href="/lens" className="text-xs text-white/25 hover:text-white/50 transition-colors">P2V Lens</Link>
            <Link href="/support" className="text-xs text-white/25 hover:text-white/50 transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   NON-SUBSCRIBER PAGE — Light theme upsell
   ═══════════════════════════════════════════════ */
function NonSubscriberPage({
  freeLensExpired,
}: {
  freeLensExpired: boolean;
}) {
  const features = [
    {
      icon: Camera,
      title: "AI Photo Coach",
      description: "Open a shoot session for any property. Snap a photo, get instant AI scoring — green means approved, yellow means almost there, red means reshoot.",
      actionLabel: "Start a Shoot",
      actionHref: "/dashboard/lens/coach",
    },
    {
      icon: PenTool,
      title: "Marketing Design Studio",
      description: "Create Just Listed, Open House, Price Reduced, and Just Sold graphics in under a minute. Includes branding card builder.",
      actionLabel: "Open Design Studio",
      actionHref: "/dashboard/lens/design-studio",
    },
    {
      icon: MessageSquare,
      title: "AI Listing Description Writer",
      description: "Upload listing photos and enter property details. AI writes a polished MLS-ready description in your chosen style.",
      actionLabel: "Write a Description",
      actionHref: "/dashboard/lens/descriptions",
    },
    {
      icon: Sofa,
      title: "Virtual Staging",
      description: "Upload a photo of an empty room and see it furnished in seconds. Choose from 6 design styles with before/after comparison.",
      actionLabel: "Stage a Room",
      actionHref: "/dashboard/lens/staging",
    },
    {
      icon: FileText,
      title: "Custom Reports",
      description: "Generate branded buyer and seller guides. AI writes professional content, you edit and download as a branded PDF.",
      actionLabel: "Create Report",
      actionHref: "/dashboard/lens/reports",
      badge: "PRO",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">P2V Lens</h1>
          <p className="text-muted-foreground mt-1">Your AI-powered real estate marketing suite</p>
        </div>
      </div>

      {/* Trial Banner */}
      <div className="mt-8">
        <LensTrialBanner />
      </div>

      {/* Expired Banner */}
      {freeLensExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800">Your free month has ended</h3>
              <p className="text-sm text-red-700 mt-1">
                Subscribe to P2V Lens to continue using all features — Photo Coach, Design Studio, Description Writer, Virtual Staging, and $4.95/clip video ordering.
              </p>
              <Button asChild size="sm" className="mt-3 bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                <Link href="/lens">Subscribe — $27.95/mo</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription CTA */}
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 mt-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">No Active Subscription</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Subscribe to P2V Lens to unlock AI photo coaching, design studio, listing descriptions, virtual staging, custom reports, and priority 12-hour delivery.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                <Link href="/lens">
                  Subscribe to P2V Lens
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/lens#waitlist-form">Join the Waitlist</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* My Properties CTA */}
      <Link href="/dashboard/properties" className="block mt-6">
        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Home className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">My Properties</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All your listing materials organized by property — photos, videos, descriptions, staging, and marketing materials in one place.
              </p>
              <p className="text-sm font-bold text-emerald-700 mt-2">View all properties →</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Video CTA */}
      <Link href="/lens" className="block mt-4 mb-10">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <Film className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-lg">Quick Video</h3>
                <span className="text-[10px] bg-cyan-500 text-white font-black px-2 py-0.5 rounded-full">NEW</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Order 5–14 clip videos at just $4.95/clip. Perfect for social teasers, listing refreshers, and open house promos.
              </p>
              <p className="text-sm font-bold text-cyan-700 mt-2">Subscribe to unlock per-clip pricing →</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Features */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1.5 bg-accent rounded-full" />
          <h2 className="text-2xl font-bold text-foreground">Features</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description, actionLabel, actionHref, badge }, i) => (
            <Link
              key={i}
              href={actionHref}
              className="relative bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 block group"
            >
              {badge && (
                <span className="absolute top-3 right-3 text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{badge}</span>
              )}
              <span className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {badge ? "" : "With Subscription"}
              </span>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:text-accent/80 transition-colors pt-1">
                {actionLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Complete Listing Marketing Suite</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          P2V Lens gives you AI photo coaching, a marketing design studio, listing description writer, virtual staging, custom reports, free photo editing, and priority delivery. Plans start at $27.95/month.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
            <Link href="/lens">
              <Sparkles className="mr-2 h-5 w-5" />
              Get P2V Lens
            </Link>
          </Button>
          <Button asChild variant="outline" className="px-8 py-6 text-lg">
            <Link href="/order">Create a Video Instead</Link>
          </Button>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/lens" className="hover:text-foreground transition-colors">P2V Lens</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/privacy" className="hover:text-foreground transition-colors text-xs">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors text-xs">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-foreground transition-colors text-xs">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
