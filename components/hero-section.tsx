"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Play,
  Pause,
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
  CheckCircle2,
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
      {/* Subtle dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {/* Stat ribbon */}
        <div className="mb-6 flex justify-center lg:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            Listings with video get 403% more inquiries
            <span className="text-muted-foreground/50">— NAR</span>
          </span>
        </div>

        {/* Asymmetric grid */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-10 xl:grid-cols-[1fr_440px]">
          {/* ──────────────────────────────────────────
              LEFT — Headline, tools, subscribe CTA
              ────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Headline — Lens is the product */}
            <h1 className="max-w-2xl text-[2rem] font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              Every Marketing Tool
              <br className="hidden sm:block" /> a Real Estate Agent Needs.{" "}
              <span className="text-accent-foreground">One&nbsp;Subscription.</span>
            </h1>

            {/* Subheadline — video is the hook */}
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cinematic listing videos, AI photo coaching, marketing design,
              listing descriptions, virtual staging, and more — starting at
              $27.95/mo.
            </p>

            {/* Tool chips — headliner first */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {[
                { icon: Video, label: "Listing Videos", featured: true },
                { icon: Camera, label: "Photo Coach", featured: false },
                { icon: PenTool, label: "Design Studio", featured: false },
                { icon: FileText, label: "Description Writer", featured: false },
                { icon: Sofa, label: "Virtual Staging", featured: false },
                { icon: Film, label: "Quick Videos", featured: false },
              ].map((tool) => (
                <span
                  key={tool.label}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold sm:text-sm ${
                    tool.featured
                      ? "border-accent/30 bg-accent/10 text-accent-foreground"
                      : "border-border bg-card text-foreground/70"
                  }`}
                >
                  <tool.icon className={`h-3.5 w-3.5 ${tool.featured ? "text-accent-foreground" : "text-muted-foreground"}`} />
                  {tool.label}
                </span>
              ))}
              <span className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
                +10 more
              </span>
            </div>

            {/* Primary CTA — Subscribe */}
            <div className="mt-7 flex flex-col items-center gap-2.5 sm:mt-8 lg:items-start">
              {isSubscriber ? (
                <Link href="/dashboard/lens" passHref>
                  <Button
                    size="lg"
                    className="group h-auto rounded-xl bg-accent px-7 py-3.5 text-base font-extrabold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-110 sm:px-9 sm:py-4 sm:text-lg"
                  >
                    Go to Your Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/lens" passHref>
                  <Button
                    size="lg"
                    className="group h-auto rounded-xl bg-accent px-7 py-3.5 text-base font-extrabold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-110 sm:px-9 sm:py-4 sm:text-lg"
                  >
                    Explore P2V Lens — $27.95/mo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              )}

              {/* Secondary CTA — one-off video */}
              <Link
                href="/order"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Or order a single video
                <span className="text-muted-foreground/50 line-through">$119</span>
                <span className="font-bold text-foreground">$79</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Subscriber perks row */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:text-sm lg:justify-start">
              <span className="inline-flex items-center gap-1">
                <Percent className="h-3.5 w-3.5 text-accent-foreground/70" />
                10% off every video
              </span>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-accent-foreground/70" />
                Free photo enhancement
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-accent-foreground/70" />
                Priority processing
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-foreground/70" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* ──────────────────────────────────────────
              RIGHT — Video preview + remix callout
              ────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Video preview — the headliner tool in action */}
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
                {/* "Included" badge */}
                <div className="absolute left-3 top-3 rounded-full bg-accent/90 px-2.5 py-1 text-[10px] font-black tracking-wide text-accent-foreground shadow-md backdrop-blur sm:text-xs">
                  ★ HEADLINER TOOL
                </div>
              </div>
              {/* Caption bar */}
              <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground sm:text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <Video className="h-3.5 w-3.5 text-accent-foreground" />
                  Listing Photos → Cinematic Video
                </span>
                <span className="text-muted-foreground/60">Under 12h</span>
              </div>
            </div>

            {/* Unlimited Remixes callout */}
            <div className="rounded-xl border border-border bg-card/70 p-3.5 shadow-sm backdrop-blur-sm sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Repeat className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground sm:text-[0.925rem]">
                    Buy the clips once. Remix them forever.
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Recut clips into Just Listed, Open House, Just Sold, social
                    teasers — unlimited times in Design Studio, no extra cost.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6 sm:text-sm">
              <span>
                Videos get{" "}
                <span className="font-semibold text-foreground">403%</span> more
                inquiries
              </span>
              <span className="text-border">|</span>
              <span>
                Photos sell{" "}
                <span className="font-semibold text-foreground">32%</span> faster
              </span>
            </div>
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
