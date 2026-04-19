"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Film,
  PenTool,
  Sparkles,
  ArrowRight,
  Video,
  Sofa,
  Crosshair,
  ImageIcon,
  MessageSquare,
  Globe,
  FileText,
  Camera,
  MapPin,
  TrendingUp,
  Star,
  Share2,
  Check,
  Zap,
  Wand2,
  Calendar,
  Award,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Accent palette — static class strings so Tailwind JIT picks them up
// ──────────────────────────────────────────────────────────────

type AccentKey =
  | "cyan"
  | "indigo"
  | "emerald"
  | "amber"
  | "violet"
  | "orange"
  | "teal"
  | "sky"
  | "rose"
  | "blue";

type AccentStyles = {
  text: string;
  textLight: string;
  bg10: string;
  bg15: string;
  bg20: string;
  ring30: string;
  ring40: string;
  border20: string;
  border30: string;
  border40: string;
  gradFrom: string;
  numGrad: string;
  fill: string;
};

const A: Record<AccentKey, AccentStyles> = {
  cyan: {
    text: "text-cyan-400", textLight: "text-cyan-300",
    bg10: "bg-cyan-400/10", bg15: "bg-cyan-400/15", bg20: "bg-cyan-400/20",
    ring30: "ring-cyan-400/30", ring40: "ring-cyan-400/40",
    border20: "border-cyan-400/20", border30: "border-cyan-400/30", border40: "border-cyan-400/40",
    gradFrom: "from-cyan-500/10", numGrad: "from-cyan-300 to-cyan-600", fill: "fill-cyan-400",
  },
  indigo: {
    text: "text-indigo-400", textLight: "text-indigo-300",
    bg10: "bg-indigo-400/10", bg15: "bg-indigo-400/15", bg20: "bg-indigo-400/20",
    ring30: "ring-indigo-400/30", ring40: "ring-indigo-400/40",
    border20: "border-indigo-400/20", border30: "border-indigo-400/30", border40: "border-indigo-400/40",
    gradFrom: "from-indigo-500/10", numGrad: "from-indigo-300 to-indigo-600", fill: "fill-indigo-400",
  },
  emerald: {
    text: "text-emerald-400", textLight: "text-emerald-300",
    bg10: "bg-emerald-400/10", bg15: "bg-emerald-400/15", bg20: "bg-emerald-400/20",
    ring30: "ring-emerald-400/30", ring40: "ring-emerald-400/40",
    border20: "border-emerald-400/20", border30: "border-emerald-400/30", border40: "border-emerald-400/40",
    gradFrom: "from-emerald-500/10", numGrad: "from-emerald-300 to-emerald-600", fill: "fill-emerald-400",
  },
  amber: {
    text: "text-amber-400", textLight: "text-amber-300",
    bg10: "bg-amber-400/10", bg15: "bg-amber-400/15", bg20: "bg-amber-400/20",
    ring30: "ring-amber-400/30", ring40: "ring-amber-400/40",
    border20: "border-amber-400/20", border30: "border-amber-400/30", border40: "border-amber-400/40",
    gradFrom: "from-amber-500/10", numGrad: "from-amber-300 to-amber-600", fill: "fill-amber-400",
  },
  violet: {
    text: "text-violet-400", textLight: "text-violet-300",
    bg10: "bg-violet-400/10", bg15: "bg-violet-400/15", bg20: "bg-violet-400/20",
    ring30: "ring-violet-400/30", ring40: "ring-violet-400/40",
    border20: "border-violet-400/20", border30: "border-violet-400/30", border40: "border-violet-400/40",
    gradFrom: "from-violet-500/10", numGrad: "from-violet-300 to-violet-600", fill: "fill-violet-400",
  },
  orange: {
    text: "text-orange-400", textLight: "text-orange-300",
    bg10: "bg-orange-400/10", bg15: "bg-orange-400/15", bg20: "bg-orange-400/20",
    ring30: "ring-orange-400/30", ring40: "ring-orange-400/40",
    border20: "border-orange-400/20", border30: "border-orange-400/30", border40: "border-orange-400/40",
    gradFrom: "from-orange-500/10", numGrad: "from-orange-300 to-orange-600", fill: "fill-orange-400",
  },
  teal: {
    text: "text-teal-400", textLight: "text-teal-300",
    bg10: "bg-teal-400/10", bg15: "bg-teal-400/15", bg20: "bg-teal-400/20",
    ring30: "ring-teal-400/30", ring40: "ring-teal-400/40",
    border20: "border-teal-400/20", border30: "border-teal-400/30", border40: "border-teal-400/40",
    gradFrom: "from-teal-500/10", numGrad: "from-teal-300 to-teal-600", fill: "fill-teal-400",
  },
  sky: {
    text: "text-sky-400", textLight: "text-sky-300",
    bg10: "bg-sky-400/10", bg15: "bg-sky-400/15", bg20: "bg-sky-400/20",
    ring30: "ring-sky-400/30", ring40: "ring-sky-400/40",
    border20: "border-sky-400/20", border30: "border-sky-400/30", border40: "border-sky-400/40",
    gradFrom: "from-sky-500/10", numGrad: "from-sky-300 to-sky-600", fill: "fill-sky-400",
  },
  rose: {
    text: "text-rose-400", textLight: "text-rose-300",
    bg10: "bg-rose-400/10", bg15: "bg-rose-400/15", bg20: "bg-rose-400/20",
    ring30: "ring-rose-400/30", ring40: "ring-rose-400/40",
    border20: "border-rose-400/20", border30: "border-rose-400/30", border40: "border-rose-400/40",
    gradFrom: "from-rose-500/10", numGrad: "from-rose-300 to-rose-600", fill: "fill-rose-400",
  },
  blue: {
    text: "text-blue-400", textLight: "text-blue-300",
    bg10: "bg-blue-400/10", bg15: "bg-blue-400/15", bg20: "bg-blue-400/20",
    ring30: "ring-blue-400/30", ring40: "ring-blue-400/40",
    border20: "border-blue-400/20", border30: "border-blue-400/30", border40: "border-blue-400/40",
    gradFrom: "from-blue-500/10", numGrad: "from-blue-300 to-blue-600", fill: "fill-blue-400",
  },
};

// ──────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return { ref, inView };
}

// ──────────────────────────────────────────────────────────────
// Sticky phase nav
// ──────────────────────────────────────────────────────────────

function PhaseNav() {
  const [active, setActive] = useState("phase-1");
  useEffect(() => {
    const ids = ["phase-1", "phase-2", "phase-3", "phase-4"];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const phases = [
    { id: "phase-1", num: "01", label: "Video" },
    { id: "phase-2", num: "02", label: "Create" },
    { id: "phase-3", num: "03", label: "Deploy" },
    { id: "phase-4", num: "04", label: "Win Clients" },
  ];

  return (
    <div className="sticky top-4 z-40 mx-auto mt-6 hidden w-fit md:flex">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-blue-950/80 px-2 py-2 shadow-2xl shadow-blue-950/50 backdrop-blur-xl">
        {phases.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all ${
              active === p.id
                ? "bg-cyan-400 text-gray-950"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span className={`font-mono ${active === p.id ? "opacity-60" : "opacity-40"}`}>
              {p.num}
            </span>
            <span className="uppercase">{p.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Video embed — YouTube sample walkthrough
// ──────────────────────────────────────────────────────────────

function PhotoToVideoDemo() {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-blue-900/60 bg-gray-950 shadow-2xl shadow-blue-950/50">
      <iframe
        src="https://www.youtube.com/embed/OuzDikc2M7I?si=5M0C21R5AoPG9GoZ"
        title="Real Estate Photo 2 Video — sample walkthrough"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Counter that ticks up on scroll
// ──────────────────────────────────────────────────────────────

function ContentCounter() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= 47) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [inView]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-[88px] font-black leading-none tracking-tighter text-cyan-400 sm:text-[120px]">
        {count}+
      </div>
      <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-white/50">
        Assets from one shoot
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Tool card — lean, data-forward
// ──────────────────────────────────────────────────────────────

type ToolCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  deliverable: string;
  accent: AccentKey;
  stat: { value: string; label: string };
};

function ToolCard({ icon: Icon, title, desc, deliverable, accent, stat }: ToolCardProps) {
  const a = A[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-0.5">
      {/* Corner glow */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full ${a.bg20} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
      />

      <div className="relative">
        {/* Header: icon + stat */}
        <div className="mb-5 flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg10} ring-1 ${a.ring30} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className={`h-5 w-5 ${a.text}`} />
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black leading-none ${a.textLight}`}>{stat.value}</div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/40">
              {stat.label}
            </div>
          </div>
        </div>

        <h4 className="mb-2 text-lg font-bold text-white">{title}</h4>
        <p className="mb-5 text-sm leading-relaxed text-white/60">{desc}</p>

        <div className="flex items-start gap-2 border-t border-white/5 pt-4">
          <Check className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${a.text}`} />
          <p className="text-xs leading-relaxed text-white/50">
            <span className="font-semibold text-white/80">You get:</span> {deliverable}
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PhaseSection wrapper
// ──────────────────────────────────────────────────────────────

function PhaseSection({
  id, num, accent, icon: Icon, kicker, title, children,
}: {
  id: string;
  num: string;
  accent: AccentKey;
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  const a = A[accent];
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id={id} className="relative scroll-mt-24 border-t border-white/[0.06] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="mb-10 grid items-stretch gap-4 lg:grid-cols-12 lg:gap-10"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(30px)",
            transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="lg:col-span-4">
            <div className="flex items-center gap-4">
              <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${a.bg10} ring-1 ${a.ring30}`}>
                <Icon className={`h-6 w-6 ${a.text}`} />
              </div>
              <div>
                <div className={`text-xs font-bold uppercase tracking-[0.2em] ${a.textLight}`}>
                  Phase {num}
                </div>
                <div className="text-sm text-white/40">{kicker}</div>
              </div>
            </div>
            <div
              className="mt-4 text-[100px] font-black leading-none tracking-tight sm:text-[160px]"
              aria-hidden
            >
              <span className={`bg-gradient-to-br ${a.numGrad} bg-clip-text text-transparent`}>
                {num}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-end lg:col-span-8">
            <h2 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h2>
          </div>
        </div>

        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(30px)",
            transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1) 150ms",
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// FeatureBlock — Phase 1 stacked cards
// ──────────────────────────────────────────────────────────────

function FeatureBlock({
  icon: Icon, accent, tag, title, desc, bullets,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: AccentKey;
  tag: string;
  title: string;
  desc: string;
  bullets: string[];
}) {
  const a = A[accent];
  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${a.border20} bg-gradient-to-br ${a.gradFrom} to-transparent p-6 transition-all hover:${a.border40}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.bg15} ring-1 ${a.ring30}`}>
          <Icon className={`h-5 w-5 ${a.textLight}`} />
        </div>
        <div className={`rounded-full ${a.bg10} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${a.textLight}`}>
          {tag}
        </div>
      </div>
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-white/60">{desc}</p>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-white/70">
            <Check className={`mt-0.5 h-3 w-3 flex-shrink-0 ${a.text}`} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DeployCard — Phase 3
// ──────────────────────────────────────────────────────────────

function DeployCard({
  icon: Icon, accent, title, byline, desc, deliverable, stats, featured,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: AccentKey;
  title: string;
  byline: string;
  desc: string;
  deliverable: string;
  stats: { k: string; v: string }[];
  featured?: boolean;
}) {
  const a = A[accent];
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1 ${
        featured
          ? `${a.border40} bg-gradient-to-br ${a.gradFrom} via-white/[0.03] to-transparent`
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      }`}
    >
      {featured && (
        <div className={`absolute right-4 top-4 rounded-full ${a.bg20} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${a.textLight} ring-1 ${a.ring30}`}>
          Flagship
        </div>
      )}
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${a.bg10} ring-1 ${a.ring30} transition-transform group-hover:scale-110`}>
        <Icon className={`h-5 w-5 ${a.text}`} />
      </div>
      <h4 className="text-lg font-bold text-white">{title}</h4>
      <p className={`mb-3 text-sm font-semibold ${a.textLight}`}>{byline}</p>
      <p className="mb-4 text-sm leading-relaxed text-white/60">{desc}</p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.v} className="rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
            <div className={`text-base font-black ${a.textLight}`}>{s.k}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs leading-relaxed text-white/50">
          <span className="font-semibold text-white/80">You get:</span> {deliverable}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ClientToolCard — Phase 4
// ──────────────────────────────────────────────────────────────

function ClientToolCard({
  icon: Icon, accent, title, desc, deliverable, useCase,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: AccentKey;
  title: string;
  desc: string;
  deliverable: string;
  useCase: string;
}) {
  const a = A[accent];
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:${a.border30} hover:bg-white/[0.05]`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${a.bg10} blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

      <div className="relative flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${a.bg10} ring-1 ${a.ring30} transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
          <Icon className={`h-5 w-5 ${a.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-bold text-white">{title}</h4>
          <div className={`mt-1 inline-flex items-center gap-1.5 text-xs font-bold ${a.textLight}`}>
            <Star className={`h-3 w-3 ${a.fill}`} />
            <span>{useCase}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{desc}</p>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs leading-relaxed text-white/50">
              <span className="font-semibold text-white/80">You get:</span> {deliverable}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      <Navigation />
      <PhaseNav />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-400/10 blur-[120px]" />
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles className="h-3 w-3" />
              15 Tools powered by 1 Set of Photos
            </div>

            <h1 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Your listing photos
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  are an unfair advantage.
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 2 8 Q 75 2, 150 6 T 298 4"
                    stroke="url(#underline)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="underline">
                      <stop offset="0" stopColor="#22d3ee" />
                      <stop offset="1" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base text-white/60 sm:text-lg">
              Create a video, staged rooms, flyers, social content, a full website, and
              client-winning reports — all generated, branded, and deployed from the photos you already have.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="group bg-cyan-400 px-8 py-6 text-base font-black text-gray-950 shadow-[0_0_40px_-5px_rgba(34,211,238,0.6)] hover:bg-cyan-300"
              >
                <Link href="/order">
                  Start with a video — $79
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <p className="text-xs text-white/40">
                Unlocks 10-day free trial of all 15 tools. No card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PHASE 1 — VIDEO ═══════════════ */}
      <PhaseSection
        id="phase-1"
        num="01"
        accent="cyan"
        icon={Film}
        title="It starts with a video."
        kicker="The foundation"
      >
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <PhotoToVideoDemo />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Turnaround", value: "Minutes" },
                { label: "Starting at", value: "$79" },
                { label: "Aspect ratios", value: "3" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
                >
                  <div className="text-xl font-black text-cyan-300">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <FeatureBlock
              icon={Video}
              accent="cyan"
              tag="Step 1"
              title="Order the video"
              desc="Upload photos, we produce a cinematic walkthrough. A real editor hand-finishes every frame — AI speeds us up, humans make it perfect."
              bullets={[
                "Polished listing video",
                "Individual room clips",
                "Auto-filled property profile",
              ]}
            />
            <FeatureBlock
              icon={Wand2}
              accent="violet"
              tag="Step 2 · Free forever"
              title="Remix unlimited times"
              desc="Your clips, your library. Recut into social teasers, add music, swap branding — new versions anytime you want."
              bullets={[
                "3 aspect ratios (9:16, 1:1, 16:9)",
                "Music library + custom uploads",
                "No watermarks, ever",
              ]}
            />
          </div>
        </div>
      </PhaseSection>

      {/* ═══════════════ PHASE 2 — CREATE ═══════════════ */}
      <PhaseSection
        id="phase-2"
        num="02"
        accent="indigo"
        icon={PenTool}
        title="Then one shoot becomes everything."
        kicker="The multiplier"
      >
        {/* Big stat callout */}
        <div className="mb-10 overflow-hidden rounded-3xl border border-blue-900/60 bg-gradient-to-br from-blue-950 via-blue-950/80 to-gray-950 p-8 shadow-2xl shadow-blue-950/30 sm:p-12">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <ContentCounter />
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "7", v: "Production tools" },
                { k: "1", v: "Branded profile" },
                { k: "$0", v: "Per extra asset" },
                { k: "∞", v: "Regenerations" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="text-2xl font-black text-indigo-300">{s.k}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            icon={PenTool}
            title="Design Studio"
            desc="Just Listed, Open House, Price Reduced graphics with auto-filled branding. Swap photos, edit text, export."
            deliverable="PNG + PDF graphics for social, print, and MLS."
            accent="indigo"
            stat={{ value: "11", label: "Templates" }}
          />
          <ToolCard
            icon={ImageIcon}
            title="Listing Flyer"
            desc="Print-ready property flyers generated from your photos and details. Professional layouts, your branding baked in."
            deliverable="Downloadable PDF flyers for open houses, mailers, broker tours."
            accent="orange"
            stat={{ value: "PDF", label: "Print-ready" }}
          />
          <ToolCard
            icon={Sofa}
            title="Virtual Staging"
            desc="Furnish empty rooms with AI. 8 design styles across 8 room types. Before/after comparison slider."
            deliverable="Staged room photos at pennies per room. Before/after pairs for listings."
            accent="violet"
            stat={{ value: "8×8", label: "Styles × Rooms" }}
          />
          <ToolCard
            icon={Crosshair}
            title="Drone Mark"
            desc="Annotate aerial photos with lot lines, measurement labels, and branded pins. 8 drawing tools."
            deliverable="Annotated aerial JPEGs for listings, presentations, print."
            accent="amber"
            stat={{ value: "8", label: "Draw tools" }}
          />
          <ToolCard
            icon={ImageIcon}
            title="Photo Enhancement"
            desc="AI brightness, color, and white balance correction. Fix dark interiors, warm cold light, balance tricky exposures."
            deliverable="Enhanced photos with professional-grade color correction."
            accent="teal"
            stat={{ value: "1-click", label: "AI fix" }}
          />
          <ToolCard
            icon={Zap}
            title="Photo Optimizer"
            desc="Batch compress listing photos for MLS, Zillow, and social. Hard cap at 1920px and under 290KB."
            deliverable="Optimized photos that meet every platform's upload requirements."
            accent="emerald"
            stat={{ value: "<290KB", label: "Per photo" }}
          />
          <ToolCard
            icon={Camera}
            title="Photo Coach"
            desc={'AI scores every photo 1-10 with actionable feedback — "move left 3 feet, open the blinds on the east wall."'}
            deliverable="Better photos on every listing. A process that impresses sellers at the appointment."
            accent="blue"
            stat={{ value: "1–10", label: "Live score" }}
          />
        </div>
      </PhaseSection>

      {/* ═══════════════ PHASE 3 — DEPLOY ═══════════════ */}
      <PhaseSection
        id="phase-3"
        num="03"
        accent="emerald"
        icon={Share2}
        title="Then it goes to work — everywhere."
        kicker="The distribution"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <DeployCard
            icon={Calendar}
            accent="emerald"
            title="Marketing Planner"
            byline="Tell me what to post — and do it for me."
            desc="30-day AI content sprints with weighted property rotation, 10 post types, and a weekly calendar. Select a property, pick media, get a caption, share."
            deliverable="A 30-day posting schedule with captions, media, and one-click deep-links to every platform."
            stats={[
              { k: "30-day", v: "Sprints" },
              { k: "10", v: "Post types" },
            ]}
          />
          <DeployCard
            icon={MessageSquare}
            accent="sky"
            title="Description Writer"
            byline="MLS-ready copy that actually sounds human."
            desc="AI analyzes your listing photos and writes in 4 styles: Professional, Luxury, Conversational, Concise. Feeds flyers, website, social, and MLS automatically."
            deliverable="Polished listing descriptions ready to paste into MLS, print on flyers, or publish on your website."
            stats={[
              { k: "4", v: "Voice styles" },
              { k: "∞", v: "Regenerations" },
            ]}
          />
          <DeployCard
            icon={Globe}
            accent="cyan"
            title="My Agent Website"
            byline="Your marketing has a home now."
            desc="Full professional website on p2v.homes or your custom domain. Every description, staged room, and flyer auto-feeds your site. Property pages, lead capture, AI blog, SEO."
            deliverable="A live agent website with your listings, branding, and content — we handle hosting, SSL, and updates. Lens Pro $49/mo or buy outright $399."
            stats={[
              { k: "SEO", v: "Built in" },
              { k: "SSL", v: "Included" },
            ]}
            featured
          />
        </div>
      </PhaseSection>

      {/* ═══════════════ PHASE 4 — WIN CLIENTS ═══════════════ */}
      <PhaseSection
        id="phase-4"
        num="04"
        accent="amber"
        icon={Award}
        title="And it wins you the listing appointment."
        kicker="The close"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <ClientToolCard
            icon={FileText}
            accent="rose"
            title="Reports"
            desc="Branded buyer and seller guides with AI-written content. Your colors, your headshot on the cover. Professional reports that position you as the expert."
            deliverable="Downloadable PDF reports branded to your business — ready to email, print, or present."
            useCase="Send to every lead who requests info"
          />
          <ClientToolCard
            icon={MapPin}
            accent="teal"
            title="Location Value Score"
            desc="A 1-100 composite neighborhood score covering amenities, trends, growth, and infrastructure. Branded PDF for buyers or listing presentations."
            deliverable="A branded neighborhood insights report that demonstrates local expertise."
            useCase="Attach to every buyer tour package"
          />
          <ClientToolCard
            icon={TrendingUp}
            accent="amber"
            title="Value Boost Report"
            desc="Room-by-room DIY improvement suggestions with cost, time, and ROI estimates. Help sellers understand which upgrades are worth doing before listing."
            deliverable="A branded improvement report with actionable recommendations and ROI projections."
            useCase="Your secret weapon at the listing appointment"
          />
        </div>
      </PhaseSection>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Start with a video.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Build a content machine.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/60 sm:text-lg">
            One listing video unlocks 10 days of every marketing tool. No card for the trial. No commitment. Your photos have more to give.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="group bg-cyan-400 px-8 py-7 text-base font-black text-blue-950 shadow-[0_0_60px_-5px_rgba(34,211,238,0.7)] hover:bg-cyan-300"
            >
              <Link href="/order">
                Order your first video — $79
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              className="bg-white/10 px-8 py-7 text-base font-bold text-white ring-1 ring-white/20 hover:bg-white/15"
            >
              <Link href="/lens#pricing">See pricing plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
