// app/components/HeroSection.tsx (or wherever this file lives — keep the existing path)

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  Camera,
  PenTool,
  FileText,
  Video,
  ArrowRight,
  Repeat,
  Zap,
  ChevronDown,
} from "lucide-react";

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
`;

export function HeroSection() {
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);

      if (isAdmin) {
        setIsSubscriber(true);
      } else {
        const { data: usage } = await supabase
          .from("lens_usage")
          .select("is_subscriber")
          .eq("user_id", user.id)
          .single();
        if (usage?.is_subscriber) setIsSubscriber(true);
      }

      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: heroStyles }} />
        <section className="min-h-[60svh] bg-gray-950" />
      </>
    );
  }

  if (isLoggedIn) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: heroStyles }} />
        <section className="min-h-[60svh] bg-gray-950 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </section>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: heroStyles }} />
      <MarketingHero videoRef={videoRef} />
    </>
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
  ];

  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-gray-950"
      style={{ "--hero-accent-rgb": "34, 197, 94" } as React.CSSProperties}
    >
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} autoPlay loop muted playsInline preload="auto" className="h-full w-full object-cover opacity-[0.55] sm:opacity-100">
          <source src="/p2v-lens-bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950/85" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(3,7,18,0.4) 100%)" }} />
      </div>

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_380px] lg:gap-12 xl:grid-cols-[1fr_420px]">
              {/* LEFT */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Headline */}
                <h1 className="hero-animate max-w-2xl text-[2.25rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.75rem]" style={{ animationDelay: "0.15s" }}>
                  Listing photos in. <span className="text-green-400">Cinematic video</span> and endless marketing out.
                </h1>

                {/* Subhead */}
                <p className="hero-animate mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg sm:leading-relaxed" style={{ animationDelay: "0.3s" }}>
                  Flyers, Reels, social posts. No design skills needed.
                </p>

                {/* Tool chips */}
                <div className="hero-animate mt-6 flex flex-wrap justify-center gap-2 lg:justify-start" style={{ animationDelay: "0.45s" }}>
                  {tools.map((tool, i) => (
                    <span key={tool.label} className={`hero-chip-animate inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm sm:text-sm ${tool.featured ? "border-green-400/30 bg-green-400/10 text-green-300" : "border-white/15 bg-white/[0.07] text-white/80"}`} style={{ animationDelay: `${0.5 + i * 0.07}s` }}>
                      <tool.icon className={`h-3.5 w-3.5 ${tool.featured ? "text-green-400" : "text-white/60"}`} />
                      {tool.label}
                    </span>
                  ))}
                  <span className="hero-chip-animate inline-flex items-center rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm sm:text-sm" style={{ animationDelay: `${0.5 + tools.length * 0.07}s` }}>+11 more</span>
                </div>

                {/* CTAs */}
                <div className="hero-animate mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-5 lg:items-start" style={{ animationDelay: "0.75s" }}>
                  <Link href="/order" passHref>
                    <Button size="lg" className="hero-glow-btn group h-auto rounded-xl bg-green-500 px-8 py-4 text-base font-extrabold text-white transition-all hover:bg-green-400 sm:text-lg">
                      Create a Video — $79
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/lens" passHref>
                    <Button variant="outline" size="lg" className="h-auto rounded-xl border-white/15 bg-white/[0.05] px-6 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 sm:text-lg">
                      P2V Lens — 15 AI Tools, $27/mo
                    </Button>
                  </Link>
                </div>

                {/* Perks — 2 only */}
                <div className="hero-animate-fade mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-white/60 sm:text-sm lg:justify-start" style={{ animationDelay: "0.95s" }}>
                  <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-green-400/80" />Ready in minutes</span>
                  <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-green-400/80" />Human quality-checked</span>
                </div>
              </div>

              {/* RIGHT — 2 cards */}
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Stats */}
                <div className="hero-animate rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6" style={{ animationDelay: "0.5s" }}>
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70">Why Video</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.04] p-3.5 text-center">
                      <p className="text-2xl font-extrabold text-green-400 sm:text-3xl">403%</p>
                      <p className="mt-0.5 text-[11px] leading-tight text-white/60 sm:text-xs">more inquiries</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3.5 text-center">
                      <p className="text-2xl font-extrabold text-green-400 sm:text-3xl">32%</p>
                      <p className="mt-0.5 text-[11px] leading-tight text-white/60 sm:text-xs">faster sales</p>
                    </div>
                  </div>
                </div>

                {/* Remix */}
                <div className="hero-animate rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6" style={{ animationDelay: "0.65s" }}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-400/10 ring-1 ring-green-400/20">
                      <Repeat className="h-4.5 w-4.5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white sm:text-[0.95rem]">One listing. A month of content.</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/60 sm:text-sm sm:leading-relaxed">Remix clips into Reels, socials, and teasers — unlimited, no extra cost.</p>
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

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/[0.06] bg-gray-950/80 px-6 py-3 backdrop-blur-sm">
        <p className="text-center text-sm font-medium text-white/60 sm:text-base">
          Built by a real estate photographer. <span className="font-bold text-white/90">Made in the USA.</span>
        </p>
      </div>
    </section>
  );
}
