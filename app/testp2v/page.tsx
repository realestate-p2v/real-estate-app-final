"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
  Sparkles,
  Camera,
  PenTool,
  FileText,
  Sofa,
  Globe,
  Search,
  Video,
} from "lucide-react";

export default function TestP2VPage() {
  return (
    <section className="relative min-h-[85vh] flex flex-col overflow-hidden">
      {/* Shared Background Video — same as current hero */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/p2v-website-her-vid.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Split Container */}
      <div className="relative z-10 flex flex-col lg:flex-row flex-1 min-h-[85vh]">
        {/* ═══════════════════════════════════════════
            LEFT — Photo 2 Video
            Dark warm overlay, green accents
            ═══════════════════════════════════════════ */}
        <div className="relative flex-1 flex items-center justify-center px-6 lg:px-12 py-16 lg:py-20">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 max-w-xl w-full text-center lg:text-left">
            {/* Label */}
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <Video className="w-4 h-4 text-green-400" />
              LISTING VIDEOS
            </div>

            {/* Headline — matching site gradient */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-yellow-300 to-cyan-400">
                Listing Photos to
              </span>
              <br />
              Cinematic Video
            </h2>

            {/* Stat callout — matching site style */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-2.5 text-center lg:text-left max-w-md mx-auto lg:mx-0 mt-4 mb-6">
              <p className="text-base font-bold text-white">
                Listings with video get{" "}
                <span className="text-green-300">400% more inquiries</span>
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                — National Association of Realtors
              </p>
            </div>

            <p className="text-white/80 text-base lg:text-lg mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
              Upload your photos, pick your music, add your branding — professional walkthrough video delivered in under 12 hours. No videographer needed.
            </p>

            {/* CTA — matching exact green button style */}
            <div className="flex flex-col items-center lg:items-start gap-6">
              <Link href="/order" passHref>
                <Button
                  size="lg"
                  className="group text-lg px-8 py-7 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
                >
                  <span className="text-[10px] uppercase tracking-widest opacity-90 mb-0.5 font-black">
                    Limited Time Offer
                  </span>
                  <div className="flex items-center gap-3">
                    <span>Create My Listing Video</span>
                    <span className="flex items-center">
                      <span className="line-through text-white/50 text-sm mr-2 font-medium">
                        $119
                      </span>
                      <span className="text-xl">$79</span>
                    </span>
                  </div>
                </Button>
              </Link>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-white/70">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Satisfaction Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span>Under 12h Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Lock className="w-4 h-4 text-green-400" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            DIVIDER
            ═══════════════════════════════════════════ */}
        <div className="lg:hidden relative z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="hidden lg:block relative z-10 w-0">
          <div className="absolute -left-[2px] top-0 bottom-0 w-[4px] bg-gradient-to-b from-green-500/40 via-white/10 to-cyan-500/40 blur-[1px]" />
        </div>

        {/* ═══════════════════════════════════════════
            RIGHT — P2V Lens
            Darker/cooler overlay, cyan tool icons
            ═══════════════════════════════════════════ */}
        <div className="relative flex-1 flex items-center justify-center px-6 lg:px-12 py-16 lg:py-20">
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-cyan-950/20" />

          <div className="relative z-10 max-w-xl w-full text-center lg:text-left">
            {/* Label */}
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-300 text-sm font-bold px-4 py-1.5 rounded-full mb-6 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
              AI MARKETING SUITE
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-yellow-300 to-cyan-400">
                P2V Lens
              </span>
              <br />
              Your Entire Marketing Team
            </h2>

            {/* Stat callout */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-2.5 text-center lg:text-left max-w-md mx-auto lg:mx-0 mt-4 mb-6">
              <p className="text-base font-bold text-white">
                Professional photos sell{" "}
                <span className="text-green-300">32% faster</span>
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                — Real Estate Staging Association
              </p>
            </div>

            {/* Tool grid — uses same circular icon style as current hero */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-8 max-w-md mx-auto lg:mx-0">
              {[
                { icon: Camera, label: "AI Photo Coach" },
                { icon: PenTool, label: "Design Studio" },
                { icon: FileText, label: "Description Writer" },
                { icon: Sofa, label: "Virtual Staging" },
                { icon: Globe, label: "Website Builder" },
                { icon: Search, label: "Lead Finder" },
              ].map((tool) => (
                <div
                  key={tool.label}
                  className="flex items-center gap-2 text-white/90 text-sm font-medium"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20 flex-shrink-0">
                    <tool.icon className="w-3.5 h-3.5 text-cyan-400" />
                  </span>
                  {tool.label}
                </div>
              ))}
            </div>

            {/* CTA — same green button for brand consistency */}
            <div className="flex flex-col items-center lg:items-start gap-6">
              <Link href="/lens" passHref>
                <Button
                  size="lg"
                  className="group text-lg px-8 py-7 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
                >
                  <span className="text-[10px] uppercase tracking-widest opacity-90 mb-0.5 font-black">
                    Built for Real Estate Agents
                  </span>
                  <div className="flex items-center gap-3">
                    <span>Explore P2V Lens</span>
                    <span className="text-xl">$27.95/mo</span>
                  </div>
                </Button>
              </Link>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-white/70">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Camera className="w-4 h-4 text-green-400" />
                  <span>200 Analyses/Month</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom credibility bar */}
      <div className="relative z-10 bg-black/50 backdrop-blur-sm border-t border-white/10 px-6 py-2.5">
        <p className="text-center text-sm text-white/60 font-medium">
          Built for real estate agents by marketers with{" "}
          <span className="text-white font-bold">20+ years of experience</span>
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-50 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-0" />
    </section>
  );
}
