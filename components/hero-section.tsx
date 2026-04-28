// app/components/HeroSection.tsx (or wherever this file lives — keep the existing path)

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
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
   Conversion-optimized: single-column, one dominant CTA,
   secondary as text link, supporting cards moved below fold.
   ═══════════════════════════════════════════════ */
function MarketingHero({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  return (
    <section
      className="relative flex flex-col overflow-hidden bg-gray-950"
      style={{ "--hero-accent-rgb": "16, 185, 129" } as React.CSSProperties}
    >
      {/* ═══════════ ABOVE THE FOLD — single-column hero ═══════════ */}
      <div className="relative flex min-h-[100svh] flex-col">
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

        {/* Content — centered single column */}
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex flex-1 items-center">
            <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-center">
              {/* Headline */}
              <h1 className="hero-animate mx-auto max-w-3xl text-[2.25rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.75rem]" style={{ animationDelay: "0.15s" }}>
                Listing photos in. <span className="text-emerald-400">Cinematic video</span> plus endless marketing out.
              </h1>

              {/* Subhead */}
              <p className="hero-animate mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg sm:leading-relaxed" style={{ animationDelay: "0.3s" }}>
                Flyers, Reels, social posts. No design skills needed.
              </p>

              {/* Primary CTA — dominant, glowing */}
              <div className="hero-animate mt-10" style={{ animationDelay: "0.55s" }}>
                <Link href="/order" passHref>
                  <Button
                    size="lg"
                    className="hero-glow-btn group h-auto rounded-2xl bg-emerald-500 px-10 py-5 text-lg font-extrabold text-white transition-all hover:bg-emerald-400 hover:scale-[1.02] sm:text-xl sm:px-12 sm:py-6"
                  >
                    Create a Video — $4/clip
                    <ArrowRight className="ml-2.5 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              {/* Perks — directly under CTA for trust at conversion point */}
              <div className="hero-animate-fade mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-white/65 sm:text-sm" style={{ animationDelay: "0.7s" }}>
                <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-emerald-400/90" />Ready in minutes</span>
                <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-emerald-400/90" />Human quality-checked</span>
              </div>

              {/* Secondary CTA — text link, visually subordinate */}
              <div className="hero-animate-fade mt-8" style={{ animationDelay: "0.85s" }}>
                <Link
                  href="/lens"
                  className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors underline-offset-4 hover:underline"
                >
                  ✨ Or explore P2V Lens — 15 AI Tools for $27/mo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hero-scroll-hint flex justify-center pb-6">
            <ChevronDown className="h-6 w-6 text-white/30" />
          </div>
        </div>
      </div>

      {/* ═══════════ BELOW THE FOLD — supporting cards ═══════════ */}
      <div className="relative z-10 border-t border-white/[0.06] bg-gray-950">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-white/40 mb-6">
            What you get
          </p>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {/* Remix card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/25">
                  <Repeat className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">One listing. A month of content.</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                    Remix your clips into Reels, social posts, and YouTube Shorts — free, unlimited.
                  </p>
                </div>
              </div>
            </div>

            {/* Speed/quality card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/25">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Built specifically for real estate.</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                    Cinematic walkthroughs delivered in minutes, calibrated for listings — not generic AI video.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — trust signal */}
      <div className="relative z-10 border-t border-white/[0.06] bg-gray-950/80 px-6 py-3 backdrop-blur-sm">
        <p className="text-center text-sm font-medium text-white/60 sm:text-base">
          Built by a real estate photographer. <span className="font-bold text-white/90">Made in the USA.</span>
        </p>
      </div>
    </section>
  );
}
