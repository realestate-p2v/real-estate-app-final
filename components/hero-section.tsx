"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Play,
  Pause,
  Clock,
  ShieldCheck,
  Lock,
  Sparkles,
  Camera,
  PenTool,
  FileText,
  Sofa,
  Video,
  ArrowRight,
  Repeat,
  Film,
} from "lucide-react";

export function HeroSection() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || "" });
        const { data: usage } = await supabase
          .from("lens_usage")
          .select("is_subscriber")
          .eq("user_id", user.id)
          .single();
        if (usage?.is_subscriber) setIsSubscriber(true);
      }
    };
    init();
  }, []);

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Subtle dot pattern — clean texture, no gradient blobs */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main content */}
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {/* Stat ribbon */}
        <div className="mb-6 flex justify-center lg:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            Listings with video get 403% more inquiries
            <span className="text-muted-foreground/50">— NAR</span>
          </span>
        </div>

        {/* Asymmetric grid: ~60 / 40 */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-10 xl:grid-cols-[1fr_440px]">
          {/* ──────────────────────────────────────────
              LEFT — Headline, CTA, trust, remix callout
              ────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Headline */}
            <h1 className="max-w-2xl text-[2rem] font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              Turn Your Listing Photos
              <br className="hidden sm:block" /> Into{" "}
              <span className="text-accent-foreground">
                Videos That Sell
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Upload your photos, add your branding, get a cinematic walkthrough
              video delivered in hours&nbsp;— not days.
            </p>

            {/* Primary CTA cluster */}
            <div className="mt-7 flex flex-col items-center gap-2.5 sm:mt-8 lg:items-start">
              <Link href="/order" passHref>
                <Button
                  size="lg"
                  className="group relative h-auto rounded-xl bg-accent px-7 py-3.5 text-base font-extrabold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-110 sm:px-9 sm:py-4 sm:text-lg"
                >
                  Create My Listing Video
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 sm:h-5 sm:w-5" />
                  {/* Save badge */}
                  <span className="absolute -right-2.5 -top-2.5 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-black tracking-wide text-background shadow-md sm:text-xs">
                    SAVE $40
                  </span>
                </Button>
              </Link>

              {/* Price line */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="text-muted-foreground/50 line-through">
                  $119
                </span>
                <span className="font-bold text-foreground">$79</span>
                <span className="mx-0.5 text-muted-foreground/40">·</span>
                <span className="text-xs">limited time</span>
              </div>
            </div>

            {/* Trust row */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm lg:justify-start">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-accent-foreground/70" />
                Under 12h delivery
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-foreground/70" />
                Satisfaction guarantee
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-accent-foreground/70" />
                Secure checkout
              </span>
            </div>

            {/* ── Unlimited Remixes bridge ── */}
            <div className="mt-6 w-full max-w-lg rounded-xl border border-border bg-card/70 p-3.5 shadow-sm backdrop-blur-sm sm:mt-7 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Repeat className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground sm:text-[0.925rem]">
                    Buy the clips once. Remix them forever.
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Lens subscribers recut clips into Just Listed, Open House,
                    Just Sold, social teasers — unlimited times, no extra cost.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────
              RIGHT — Video preview + Lens card
              ────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Video preview */}
            <div
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-shadow hover:shadow-2xl"
              onClick={handleVideoToggle}
              role="button"
              tabIndex={0}
              aria-label={isVideoPlaying ? "Pause video" : "Play video"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleVideoToggle();
                }
              }}
            >
              <div className="relative aspect-[16/10] bg-foreground/5">
                <video
                  ref={videoRef}
                  src="/p2v-website-her-vid.mp4"
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                {/* Play / Pause overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isVideoPlaying
                      ? "bg-transparent opacity-0 group-hover:opacity-100"
                      : "bg-black/20"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur transition-transform group-hover:scale-110">
                    {isVideoPlaying ? (
                      <Pause className="h-5 w-5 text-gray-900" />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5 text-gray-900" />
                    )}
                  </div>
                </div>
              </div>
              {/* Caption bar */}
              <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground sm:text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <Video className="h-3.5 w-3.5 text-accent-foreground" />
                  Sample listing walkthrough
                </span>
                <span className="text-muted-foreground/60">0:42</span>
              </div>
            </div>

            {/* Lens subscription card — compact */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                  <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-extrabold text-foreground">
                    P2V Lens
                  </span>
                  <span className="text-xs text-muted-foreground">
                    $27.95/mo
                  </span>
                </div>
              </div>

              {/* Compact tool list */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {[
                  { icon: Camera, label: "Photo Coach" },
                  { icon: PenTool, label: "Design Studio" },
                  { icon: FileText, label: "Descriptions" },
                  { icon: Sofa, label: "Virtual Staging" },
                  { icon: Film, label: "Quick Videos" },
                ].map((tool) => (
                  <span
                    key={tool.label}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium text-foreground/70 sm:text-xs"
                  >
                    <tool.icon className="h-3 w-3 text-accent-foreground/60" />
                    {tool.label}
                  </span>
                ))}
                <span className="inline-flex items-center rounded-lg border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
                  +10 more
                </span>
              </div>

              {/* Lens CTA — adapts to auth state */}
              {isSubscriber ? (
                <Link href="/dashboard/lens" passHref>
                  <Button
                    variant="outline"
                    className="h-9 w-full rounded-lg text-sm font-bold"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/lens" passHref>
                  <Button
                    variant="outline"
                    className="h-9 w-full rounded-lg text-sm font-bold"
                  >
                    Explore P2V Lens — $27.95/mo
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}

              <p className="mt-2 text-center text-[11px] text-muted-foreground sm:text-xs">
                15+ AI marketing tools · Cancel anytime
              </p>
            </div>

            {/* Stat callout */}
            <p className="text-center text-xs text-muted-foreground">
              Professional photos sell homes{" "}
              <span className="font-semibold text-foreground">32% faster</span>{" "}
              — RESA
            </p>
          </div>
        </div>
      </div>

      {/* Bottom credibility bar */}
      <div className="relative bg-blue-900 px-6 py-3">
        <p className="text-center text-sm font-medium text-gray-300 sm:text-base">
          Built by real estate marketers with{" "}
          <span className="font-bold text-white">
            20+ years of experience
          </span>
        </p>
      </div>
    </section>
  );
}
