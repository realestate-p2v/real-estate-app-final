"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  Sparkles,
  Camera,
  PenTool,
  FileText,
  Sofa,
  Video,
  ArrowRight,
  Repeat,
  Film,
  Percent,
  ImageIcon,
  ChevronDown,
  Plus,
  Home,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Keyframe styles — shared by both hero modes
   ───────────────────────────────────────────── */
const heroStyles = `
  @keyframes hero-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hero-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes hero-glow-pulse {
    0%, 100% { box-shadow: 0 0 24px rgba(var(--hero-accent-rgb), 0.35), 0 0 64px rgba(var(--hero-accent-rgb), 0.15); }
    50%      { box-shadow: 0 0 32px rgba(var(--hero-accent-rgb), 0.5),  0 0 80px rgba(var(--hero-accent-rgb), 0.25); }
  }
  @keyframes hero-scroll-hint {
    0%, 100% { transform: translateY(0); opacity: 0.5; }
    50%      { transform: translateY(6px); opacity: 0.9; }
  }
  @keyframes hero-chip-in {
    from { opacity: 0; transform: translateY(10px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes mc-tool-glow {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50%      { box-shadow: 0 0 20px rgba(56, 189, 248, 0.15); }
  }

  .hero-animate {
    opacity: 0;
    animation: hero-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .hero-animate-fade {
    opacity: 0;
    animation: hero-fade-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .hero-chip-animate {
    opacity: 0;
    animation: hero-chip-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .hero-glow-btn {
    animation: hero-glow-pulse 3s ease-in-out infinite;
  }
  .hero-scroll-hint {
    animation: hero-scroll-hint 2.2s ease-in-out infinite;
  }
  .mc-tool-hover:hover {
    animation: mc-tool-glow 1.5s ease-in-out infinite;
  }
`;

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface RecentProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════ */
export function HeroSection() {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser({
          id: user.id,
          email: user.email || "",
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "",
        });

        const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
        let isSub = false;

        if (isAdmin) {
          isSub = true;
        } else {
          const { data: usage } = await supabase
            .from("lens_usage")
            .select("is_subscriber")
            .eq("user_id", user.id)
            .single();
          if (usage?.is_subscriber) isSub = true;
        }

        if (isSub) {
          setIsSubscriber(true);

          // Fetch recent properties for Mission Control
          const { data: properties } = await supabase
            .from("agent_properties")
            .select("id, address, city, state, status, created_at, updated_at")
            .eq("user_id", user.id)
            .is("merged_into_id", null)
            .order("updated_at", { ascending: false })
            .limit(4);

          if (properties) setRecentProperties(properties);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Show nothing while checking auth to avoid flash
  if (isLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: heroStyles }} />
        <section className="min-h-[60svh] bg-gray-950" />
      </>
    );
  }

  // ── Branch: Subscriber gets Mission Control ──
  if (isSubscriber && user) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: heroStyles }} />
        <MissionControl user={user} recentProperties={recentProperties} />
      </>
    );
  }

  // ── Branch: Non-subscriber gets marketing hero ──
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: heroStyles }} />
      <MarketingHero videoRef={videoRef} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   MISSION CONTROL — Subscriber dashboard hero
   ═══════════════════════════════════════════════ */
function MissionControl({
  user,
  recentProperties,
}: {
  user: { id: string; email: string; name?: string };
  recentProperties: RecentProperty[];
}) {
  const firstName = user.name?.split(" ")[0] || "there";

  const tools = [
    {
      icon: Video,
      label: "Order a Video",
      desc: "Cinematic listing walkthrough",
      href: "/order",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      ring: "ring-cyan-400/20",
    },
    {
      icon: Camera,
      label: "Photo Coach",
      desc: "AI-powered photo feedback",
      href: "/dashboard/lens/coach",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      ring: "ring-blue-400/20",
    },
    {
      icon: PenTool,
      label: "Design Studio",
      desc: "Marketing graphics & remixes",
      href: "/dashboard/lens/design-studio",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      ring: "ring-indigo-400/20",
    },
    {
      icon: FileText,
      label: "Description Writer",
      desc: "MLS-ready listing copy",
      href: "/dashboard/lens/descriptions",
      color: "text-sky-400",
      bg: "bg-sky-400/10",
      ring: "ring-sky-400/20",
    },
    {
      icon: Sofa,
      label: "Virtual Staging",
      desc: "Furnish empty rooms with AI",
      href: "/dashboard/lens/staging",
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      ring: "ring-violet-400/20",
    },
    {
      icon: Film,
      label: "Quick Videos",
      desc: "Short clips from $4.95/clip",
      href: "/order",
      color: "text-teal-400",
      bg: "bg-teal-400/10",
      ring: "ring-teal-400/20",
    },
  ];

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <section
      className="relative overflow-hidden bg-gray-950"
      style={{ "--hero-accent-rgb": "56, 189, 248" } as React.CSSProperties}
    >
      {/* Subtle gradient mesh — cool blue tones */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 15% 20%, rgba(56, 189, 248, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 85% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse 80% 40% at 50% 100%, rgba(56, 189, 248, 0.04) 0%, transparent 50%)
          `,
        }}
      />
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Greeting */}
        <div className="hero-animate mb-8" style={{ animationDelay: "0.05s" }}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                {getTimeOfDay()},{" "}
                <span className="text-cyan-400">{firstName}</span>
              </h1>
              <p className="mt-1 text-sm text-white/50 sm:text-base">
                P2V Lens · Mission Control
              </p>
            </div>
            <Link href="/dashboard/lens" passHref>
              <Button
                variant="outline"
                className="mt-3 h-9 rounded-lg border-white/10 bg-white/[0.05] text-sm font-semibold text-white/70 backdrop-blur-sm hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-300 sm:mt-0"
              >
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                Full Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Tool hot buttons */}
        <div
          className="hero-animate mb-8"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Quick Launch
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
            {tools.map((tool, i) => (
              <Link
                key={tool.label}
                href={tool.href}
                className={`mc-tool-hover hero-chip-animate group flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-white/[0.06] sm:p-5`}
                style={{ animationDelay: `${0.25 + i * 0.06}s` }}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} transition-transform group-hover:scale-110`}
                >
                  <tool.icon className={`h-5 w-5 ${tool.color}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/90 group-hover:text-cyan-300 transition-colors">
                    {tool.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-white/35 hidden sm:block">
                    {tool.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom row: Recent Properties + Quick Actions */}
        <div
          className="hero-animate grid gap-4 lg:grid-cols-[1fr_340px]"
          style={{ animationDelay: "0.55s" }}
        >
          {/* Recent Properties */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-cyan-400" />
                <p className="text-sm font-bold text-white/80">
                  Recent Properties
                </p>
              </div>
              <Link
                href="/dashboard/properties"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400/70 transition-colors hover:text-cyan-300"
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {recentProperties.length > 0 ? (
              <div className="space-y-2">
                {recentProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/dashboard/properties/${property.id}`}
                    className="group flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all hover:border-cyan-400/15 hover:bg-white/[0.05]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/80 group-hover:text-cyan-300 transition-colors">
                        {property.address}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/30">
                        {[property.city, property.state]
                          .filter(Boolean)
                          .join(", ") || ""}
                        {property.city || property.state ? " · " : ""}
                        {new Date(
                          property.updated_at || property.created_at
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        <span
                          className={`ml-1.5 inline-block rounded-full px-1.5 py-px text-[9px] font-semibold capitalize ${
                            property.status === "active"
                              ? "bg-green-400/20 text-green-300"
                              : property.status === "sold"
                              ? "bg-blue-400/20 text-blue-300"
                              : property.status === "pending"
                              ? "bg-amber-400/20 text-amber-300"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {property.status}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition-colors group-hover:text-cyan-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-8 text-center">
                <Home className="mb-2 h-8 w-8 text-white/15" />
                <p className="text-sm font-medium text-white/40">
                  No properties yet
                </p>
                <p className="mt-0.5 text-xs text-white/25">
                  Start a photo coaching session or order a video
                </p>
              </div>
            )}

            {/* Add property */}
            <Link
              href="/dashboard/lens/coach"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-semibold text-white/40 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/[0.03] hover:text-cyan-400"
            >
              <Plus className="h-3.5 w-3.5" />
              New Property Session
            </Link>
          </div>

          {/* Quick Actions sidebar */}
          <div className="flex flex-col gap-3">
            {/* Order video card */}
            <Link
              href="/order"
              className="group flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4 transition-all hover:border-cyan-400/25 hover:bg-cyan-400/[0.08] sm:p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
                <Video className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Order a Listing Video
                </p>
                <p className="mt-0.5 text-xs text-white/40">
                  <span className="text-white/30 line-through">$119</span>{" "}
                  <span className="font-bold text-cyan-400">$71.10</span>
                  <span className="text-white/30"> · your 10% discount</span>
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-400" />
            </Link>

            {/* Remix clips card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 ring-1 ring-indigo-400/20">
                  <Repeat className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/90">
                    Remix Your Clips
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/40">
                    Recut video clips into Just Listed, Open House, Just Sold,
                    and social teasers in Design Studio.
                  </p>
                  <Link
                    href="/dashboard/lens/design-studio"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400/70 transition-colors hover:text-cyan-300"
                  >
                    Open Design Studio
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Subscriber perks */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                Your Subscriber Perks
              </p>
              <div className="space-y-2">
                {[
                  { icon: Percent, text: "10% off every video order" },
                  { icon: ImageIcon, text: "Free photo enhancement" },
                  { icon: Clock, text: "Priority processing" },
                  { icon: Film, text: "Quick Videos from $4.95/clip" },
                ].map((perk) => (
                  <div
                    key={perk.text}
                    className="flex items-center gap-2 text-xs text-white/50"
                  >
                    <perk.icon className="h-3 w-3 text-cyan-400/60" />
                    {perk.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   MARKETING HERO — Non-subscriber / logged out
   ═══════════════════════════════════════════════ */
function MarketingHero({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const tools = [
    { icon: Video, label: "Listing Videos", featured: true },
    { icon: Camera, label: "Photo Coach", featured: false },
    { icon: PenTool, label: "Design Studio", featured: false },
    { icon: FileText, label: "Descriptions", featured: false },
    { icon: Sofa, label: "Virtual Staging", featured: false },
    { icon: Film, label: "Quick Videos", featured: false },
  ];

  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-gray-950"
      style={{ "--hero-accent-rgb": "34, 197, 94" } as React.CSSProperties}
    >
      {/* ── LAYER 1: Full-bleed background video ── */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover opacity-[0.55] sm:opacity-100"
        >
          <source src="/p2v-lens-bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950/85" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(3,7,18,0.4) 100%)",
          }}
        />
      </div>

      {/* ── LAYER 2: Grain texture ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── LAYER 3: Content ── */}
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_380px] lg:gap-12 xl:grid-cols-[1fr_420px]">
              {/* LEFT — Copy, tools, CTA */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Eyebrow */}
                <div
                  className="hero-animate mb-5"
                  style={{ animationDelay: "0.1s" }}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/85 backdrop-blur-md sm:text-sm">
                    <Sparkles className="h-3.5 w-3.5 text-green-400" />
                    AI-Powered Real Estate Marketing
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className="hero-animate max-w-2xl text-[2.25rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.75rem]"
                  style={{ animationDelay: "0.25s" }}
                >
                  Listing Videos.
                  <br />
                  Photo Coaching.
                  <br />
                  <span className="text-green-400">
                    Your Entire Marketing Team.
                  </span>
                </h1>

                {/* Subheadline */}
                <p
                  className="hero-animate mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg sm:leading-relaxed"
                  style={{ animationDelay: "0.4s" }}
                >
                  With P2V Lens access, 10% off cinematic walkthrough videos,
                  AI photo coaching, marketing design, listing descriptions,
                  virtual staging — everything you need to market your
                  listings, in one subscription.
                </p>

                {/* Tool chips */}
                <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {tools.map((tool, i) => (
                    <span
                      key={tool.label}
                      className={`hero-chip-animate inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm sm:text-sm ${
                        tool.featured
                          ? "border-green-400/30 bg-green-400/10 text-green-300"
                          : "border-white/15 bg-white/[0.07] text-white/80"
                      }`}
                      style={{ animationDelay: `${0.5 + i * 0.07}s` }}
                    >
                      <tool.icon
                        className={`h-3.5 w-3.5 ${
                          tool.featured ? "text-green-400" : "text-white/60"
                        }`}
                      />
                      {tool.label}
                    </span>
                  ))}
                  <span
                    className="hero-chip-animate inline-flex items-center rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm sm:text-sm"
                    style={{
                      animationDelay: `${0.5 + tools.length * 0.07}s`,
                    }}
                  >
                    +10 more
                  </span>
                </div>

                {/* CTA cluster */}
                <div
                  className="hero-animate mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-5 lg:items-start"
                  style={{ animationDelay: "0.95s" }}
                >
                  <Link href="/lens" passHref>
                    <Button
                      size="lg"
                      className="hero-glow-btn group h-auto rounded-xl bg-green-500 px-8 py-4 text-base font-extrabold text-white transition-all hover:bg-green-400 sm:text-lg"
                    >
                      Explore P2V Lens — $27.95/mo
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>

                  <Link href="/order" passHref>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-auto rounded-xl border-white/15 bg-white/[0.05] px-6 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 sm:text-lg"
                    >
                      Create a Listing Video —{" "}
                      <span className="ml-1 text-white/40 line-through">
                        $119
                      </span>
                      <span className="ml-1.5 text-green-400">$79</span>
                    </Button>
                  </Link>
                </div>

                {/* Subscriber perks */}
                <div
                  className="hero-animate-fade mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-white/60 sm:text-sm lg:justify-start"
                  style={{ animationDelay: "1.15s" }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-green-400/80" />
                    10% off every video
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-green-400/80" />
                    Free photo enhancement
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-green-400/80" />
                    Quick Videos starting at $24
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-green-400/80" />
                    Access to 14 AI powered tools
                  </span>
                </div>
              </div>

              {/* RIGHT — Frosted glass info cards */}
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Stats */}
                <div
                  className="hero-animate rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6"
                  style={{ animationDelay: "0.6s" }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Why Video Works
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.04] p-3.5 text-center">
                      <p className="text-2xl font-extrabold text-green-400 sm:text-3xl">
                        403%
                      </p>
                      <p className="mt-0.5 text-[11px] leading-tight text-white/60 sm:text-xs">
                        more inquiries
                        <br />
                        with video — NAR
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3.5 text-center">
                      <p className="text-2xl font-extrabold text-green-400 sm:text-3xl">
                        32%
                      </p>
                      <p className="mt-0.5 text-[11px] leading-tight text-white/60 sm:text-xs">
                        faster sales with
                        <br />
                        pro photos — RESA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unlimited Remixes */}
                <div
                  className="hero-animate rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6"
                  style={{ animationDelay: "0.75s" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-400/10 ring-1 ring-green-400/20">
                      <Repeat className="h-4.5 w-4.5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white sm:text-[0.95rem]">
                        Buy the clips once. Remix them forever.
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-white/60 sm:text-sm sm:leading-relaxed">
                        Recut clips into Just Listed, Open House, Just Sold,
                        social teasers — unlimited times in Design Studio, no
                        extra cost.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust */}
                <div
                  className="hero-animate rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl sm:p-5"
                  style={{ animationDelay: "0.9s" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 sm:text-sm">
                      <Clock className="h-3.5 w-3.5 text-green-400/90" />
                      Under 12h delivery
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 sm:text-sm">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-400/90" />
                      Satisfaction guarantee
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-hint flex justify-center pb-6">
          <ChevronDown className="h-6 w-6 text-white/30" />
        </div>
      </div>

      {/* Bottom credibility bar */}
      <div className="relative z-10 border-t border-white/[0.06] bg-gray-950/80 px-6 py-3 backdrop-blur-sm">
        <p className="text-center text-sm font-medium text-white/60 sm:text-base">
          Built by real estate marketers with{" "}
          <span className="font-bold text-white/90">
            20+ years of experience
          </span>
        </p>
      </div>
    </section>
  );
}
