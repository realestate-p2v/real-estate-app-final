"use client";

import { useState } from "react";
import {
  Video,
  Camera,
  Palette,
  FileText,
  Sofa,
  Clock,
  Shield,
  Sparkles,
  ChevronDown,
  Play,
  ArrowRight,
  Star,
  Zap,
  Globe,
  Search,
  MousePointerClick,
} from "lucide-react";

/* ─────────────────────────────────────────────
   OPTION 1 — SPLIT SCREEN
   Left = Video (dark cinematic), Right = Lens (cyan tech)
   ───────────────────────────────────────────── */
function HeroOption1() {
  return (
    <section className="relative w-full min-h-[600px] lg:min-h-[700px] overflow-hidden">
      <div className="flex flex-col lg:flex-row w-full min-h-[600px] lg:min-h-[700px]">
        {/* LEFT — Photo 2 Video */}
        <div className="relative flex-1 flex flex-col justify-center px-8 lg:px-16 py-16 lg:py-24 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
          {/* Subtle animated bg shapes */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-green-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 right-10 w-56 h-56 bg-blue-500 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Video className="h-4 w-4 text-green-400" />
              </div>
              <span className="text-green-400 text-sm font-bold tracking-wider uppercase">
                Listing Videos
              </span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-4">
              Listing Photos to
              <br />
              <span className="text-green-400">Cinematic Video</span>
            </h2>

            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              Upload your photos, pick your music, add your branding. Professional walkthrough video delivered in under 12 hours. No videographer needed.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Clock className="h-4 w-4 text-green-400" />
                Under 12h Delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Shield className="h-4 w-4 text-green-400" />
                Free Revision
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/order"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black px-7 py-3.5 rounded-full text-base transition-all hover:scale-105 shadow-lg shadow-green-500/25"
              >
                Order Video
                <ArrowRight className="h-4 w-4" />
              </a>
              <div className="text-white">
                <span className="text-gray-500 line-through text-sm mr-2">$119</span>
                <span className="text-2xl font-black">$79</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagonal Divider — desktop only */}
        <div className="hidden lg:block relative w-0">
          <div
            className="absolute -left-12 top-0 bottom-0 w-24 z-20"
            style={{
              background: "linear-gradient(105deg, #030712 0%, #030712 45%, transparent 45.5%, transparent 54.5%, #0e1a2d 55%, #0e1a2d 100%)",
            }}
          />
        </div>

        {/* RIGHT — P2V Lens */}
        <div className="relative flex-1 flex flex-col justify-center px-8 lg:px-16 py-16 lg:py-24 bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-10 left-20 w-56 h-56 bg-teal-500 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="text-cyan-400 text-sm font-bold tracking-wider uppercase">
                P2V Lens
              </span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-4">
              Your Complete
              <br />
              <span className="text-cyan-400">AI Marketing Suite</span>
            </h2>

            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              Photo coaching, marketing design, listing descriptions, virtual staging, website builder, lead finder — everything an agent needs. One subscription.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: Camera, label: "Photo Coach" },
                { icon: Palette, label: "Design Studio" },
                { icon: FileText, label: "Description Writer" },
                { icon: Sofa, label: "Virtual Staging" },
                { icon: Globe, label: "Website Builder" },
                { icon: Search, label: "Lead Finder" },
              ].map((tool) => (
                <div key={tool.label} className="flex items-center gap-2 text-sm text-gray-300">
                  <tool.icon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  {tool.label}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/lens"
                className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-black px-7 py-3.5 rounded-full text-base transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
              >
                Try Lens Free
                <ArrowRight className="h-4 w-4" />
              </a>
              <span className="text-gray-300 text-sm">
                $27.95/mo — cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom credibility bar */}
      <div className="bg-black/60 backdrop-blur-sm border-t border-white/10 px-8 py-3">
        <p className="text-center text-sm text-gray-400">
          Built for real estate agents by marketers with <span className="text-white font-semibold">20+ years of experience</span>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   OPTION 2 — TABBED HERO
   Two tabs, user picks, no auto-rotation
   ───────────────────────────────────────────── */
function HeroOption2() {
  const [activeTab, setActiveTab] = useState<"video" | "lens">("video");

  return (
    <section className="relative w-full min-h-[650px] lg:min-h-[700px] overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 transition-all duration-700">
        {activeTab === "video" ? (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/8 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950/30 to-slate-950">
            <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[120px]" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex justify-center pt-8 lg:pt-10">
        <div className="inline-flex bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === "video"
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Video className="h-4 w-4" />
            Listing Videos
          </button>
          <button
            onClick={() => setActiveTab("lens")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === "lens"
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Marketing Tools
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8 pt-12 lg:pt-16 pb-16">
        {activeTab === "video" ? (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-5">
                Turn Listing Photos Into
                <br />
                <span className="text-green-400">Professional Video</span>
              </h1>
              <p className="text-gray-300 text-lg lg:text-xl mb-8 leading-relaxed max-w-xl">
                Upload your photos, pick your music, add your branding — get back a cinematic walkthrough video in under 12 hours. A fraction of what a videographer costs.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-10">
                {[
                  { icon: Clock, label: "Under 12h Delivery" },
                  { icon: Shield, label: "Free Revision Included" },
                  { icon: Star, label: "HD & 4K Options" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-gray-300">
                    <item.icon className="h-4 w-4 text-green-400" />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
                <a
                  href="/order"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black px-8 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/25"
                >
                  Order Your Video
                  <ArrowRight className="h-5 w-5" />
                </a>
                <div className="text-white">
                  <span className="text-gray-500 line-through text-base mr-2">$119</span>
                  <span className="text-3xl font-black">$79</span>
                </div>
              </div>
            </div>

            {/* Right side — video preview mockup */}
            <div className="flex-1 w-full max-w-md lg:max-w-lg">
              <div className="relative aspect-video bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-green-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 to-gray-900/30 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/90 flex items-center justify-center shadow-lg shadow-green-500/40 hover:scale-110 transition-transform cursor-pointer">
                    <Play className="h-7 w-7 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                  <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-green-400 rounded-full" />
                  </div>
                  <span className="text-white/60 text-xs font-mono">0:42</span>
                </div>
              </div>
              <p className="text-center text-gray-500 text-sm mt-3">
                Example P2V listing video
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-5">
                Your Complete
                <br />
                <span className="text-cyan-400">AI Marketing Suite</span>
              </h1>
              <p className="text-gray-300 text-lg lg:text-xl mb-8 leading-relaxed max-w-xl">
                The marketing firepower of a full team — photo coaching, graphic design, copywriting, staging, websites, and lead generation — for less than what most agents spend on a single flyer.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-5 mb-10">
                <a
                  href="/lens"
                  className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-black px-8 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
                >
                  Try Lens Free
                  <ArrowRight className="h-5 w-5" />
                </a>
                <span className="flex items-center text-gray-300 text-base">
                  $27.95/mo — cancel anytime
                </span>
              </div>
            </div>

            {/* Right side — tool grid */}
            <div className="flex-1 w-full max-w-md lg:max-w-lg">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Camera, label: "AI Photo Coach", desc: "Score shots in real time" },
                  { icon: Palette, label: "Design Studio", desc: "Marketing graphics in 60s" },
                  { icon: FileText, label: "Description Writer", desc: "MLS copy from photos" },
                  { icon: Sofa, label: "Virtual Staging", desc: "Furnish empty rooms" },
                  { icon: Globe, label: "Website Builder", desc: "Agent sites & property pages" },
                  { icon: Search, label: "Lead Finder", desc: "Public records + skip trace" },
                ].map((tool) => (
                  <div
                    key={tool.label}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group"
                  >
                    <tool.icon className="h-5 w-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-white text-sm font-bold">{tool.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom credibility bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm border-t border-white/10 px-8 py-3">
        <p className="text-center text-sm text-gray-400">
          Built for real estate agents by marketers with <span className="text-white font-semibold">20+ years of experience</span>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   OPTION 3 — UNIFIED HERO WITH PRODUCT CARDS
   One headline, two product cards below
   ───────────────────────────────────────────── */
function HeroOption3() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient bg */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8 pt-16 lg:pt-24 pb-16">
        {/* Unified headline */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-gray-300 text-sm font-medium">
              20+ Years of Real Estate Marketing Experience
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-5 max-w-4xl mx-auto">
            AI-Powered <span className="text-green-400">Listing Videos</span> &{" "}
            <span className="text-cyan-400">Marketing Tools</span>
          </h1>

          <p className="text-gray-400 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            Everything a real estate agent needs to market listings — from cinematic video production to a complete AI-powered marketing suite. One platform.
          </p>
        </div>

        {/* Two product cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Card 1 — Videos */}
          <div className="group relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-10 hover:border-green-500/30 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-green-500 to-emerald-500" />

            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-green-500/15 flex items-center justify-center">
                <Video className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Photo 2 Video</h3>
                <p className="text-gray-500 text-sm">Listing video production</p>
              </div>
            </div>

            <p className="text-gray-300 text-base mb-6 leading-relaxed">
              Upload your listing photos, choose your music and branding, and get a professional cinematic walkthrough video delivered in under 12 hours. No videographer. No editing software. No waiting.
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8">
              {["Under 12h delivery", "Free revision", "HD quality", "Branded or unbranded"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-1.5 text-sm text-gray-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {item}
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-between">
              <a
                href="/order"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black px-7 py-3.5 rounded-full text-base transition-all hover:scale-105 shadow-lg shadow-green-500/20"
              >
                Order Video
                <ArrowRight className="h-4 w-4" />
              </a>
              <div className="text-right">
                <span className="text-gray-600 line-through text-sm block">$119</span>
                <span className="text-white text-2xl font-black">$79</span>
              </div>
            </div>
          </div>

          {/* Card 2 — Lens */}
          <div className="group relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-10 hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-cyan-500 to-teal-500" />

            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">P2V Lens</h3>
                <p className="text-gray-500 text-sm">AI marketing suite</p>
              </div>
            </div>

            <p className="text-gray-300 text-base mb-6 leading-relaxed">
              Replace your graphic designer, copywriter, stager, and web developer. AI Photo Coach, Design Studio, Description Writer, Virtual Staging, Website Builder, and Lead Finder — all in one subscription.
            </p>

            <div className="grid grid-cols-2 gap-x-5 gap-y-2 mb-8">
              {[
                { icon: Camera, label: "Photo Coach" },
                { icon: Palette, label: "Design Studio" },
                { icon: FileText, label: "Description Writer" },
                { icon: Sofa, label: "Virtual Staging" },
                { icon: Globe, label: "Website Builder" },
                { icon: Search, label: "Lead Finder" },
              ].map((tool) => (
                <div key={tool.label} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <tool.icon className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                  {tool.label}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <a
                href="/lens"
                className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-black px-7 py-3.5 rounded-full text-base transition-all hover:scale-105 shadow-lg shadow-cyan-500/20"
              >
                Try Lens Free
                <ArrowRight className="h-4 w-4" />
              </a>
              <div className="text-right">
                <span className="text-gray-500 text-sm block">Starting at</span>
                <span className="text-white text-2xl font-black">$27.95<span className="text-base font-medium text-gray-400">/mo</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-benefits bar */}
        <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          {[
            { icon: MousePointerClick, label: "No contracts — cancel anytime" },
            { icon: Zap, label: "Subscribers save 10% on every video" },
            { icon: Clock, label: "Priority processing for Lens members" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-gray-600" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TEST PAGE — All 3 stacked
   ───────────────────────────────────────────── */
export default function TestP2VPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-950 border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-white font-black text-lg">P2V Hero Test Page</h1>
          <div className="flex gap-4">
            <a href="#option1" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              Split Screen
            </a>
            <a href="#option2" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              Tabbed
            </a>
            <a href="#option3" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              Unified Cards
            </a>
          </div>
        </div>
      </div>

      {/* Option 1 */}
      <div id="option1" className="scroll-mt-16">
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3">
          <p className="text-center text-yellow-400 font-bold text-sm uppercase tracking-wider">
            Option 1 — Split Screen
          </p>
        </div>
        <HeroOption1 />
      </div>

      {/* Spacer */}
      <div className="h-20 bg-black flex items-center justify-center">
        <ChevronDown className="h-8 w-8 text-gray-700 animate-bounce" />
      </div>

      {/* Option 2 */}
      <div id="option2" className="scroll-mt-16">
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3">
          <p className="text-center text-yellow-400 font-bold text-sm uppercase tracking-wider">
            Option 2 — Tabbed Hero
          </p>
        </div>
        <HeroOption2 />
      </div>

      {/* Spacer */}
      <div className="h-20 bg-black flex items-center justify-center">
        <ChevronDown className="h-8 w-8 text-gray-700 animate-bounce" />
      </div>

      {/* Option 3 */}
      <div id="option3" className="scroll-mt-16">
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3">
          <p className="text-center text-yellow-400 font-bold text-sm uppercase tracking-wider">
            Option 3 — Unified Hero with Product Cards
          </p>
        </div>
        <HeroOption3 />
      </div>

      {/* Footer */}
      <div className="h-32 bg-black flex items-center justify-center">
        <p className="text-gray-700 text-sm">End of hero tests</p>
      </div>
    </div>
  );
}
