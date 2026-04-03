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
  Play,
  CheckCircle2,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex flex-col overflow-hidden bg-white">
      {/* Animated mesh gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 20%, rgba(167, 243, 208, 0.35) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 90% 15%, rgba(165, 220, 255, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 50% 90%, rgba(253, 224, 138, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 80% 70%, rgba(196, 181, 253, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 20% 70%, rgba(110, 231, 183, 0.25) 0%, transparent 50%),
            linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f0fdfa 100%)
          `,
        }}
      />

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-[3px] border-green-200/40 opacity-60" />
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border-[2px] border-cyan-200/30 opacity-50" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full border-[3px] border-emerald-200/40 opacity-50" />
        <div className="absolute top-[15%] left-[8%] w-3 h-3 rounded-full bg-green-300/50" />
        <div className="absolute top-[25%] right-[12%] w-2 h-2 rounded-full bg-cyan-300/60" />
        <div className="absolute top-[60%] left-[15%] w-2.5 h-2.5 rounded-full bg-emerald-300/40" />
        <div className="absolute top-[45%] right-[8%] w-2 h-2 rounded-full bg-teal-300/50" />
        <div className="absolute bottom-[20%] left-[40%] w-3 h-3 rounded-full bg-green-200/50" />
        <div className="absolute top-[35%] left-[48%] w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
        <div className="absolute top-0 left-[45%] w-px h-[30%] bg-gradient-to-b from-transparent via-green-200/30 to-transparent rotate-12 origin-top" />
        <div className="absolute bottom-0 right-[40%] w-px h-[25%] bg-gradient-to-t from-transparent via-cyan-200/30 to-transparent -rotate-12 origin-bottom" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-40 h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-40 w-px bg-gradient-to-b from-transparent via-gray-200/50 to-transparent" />
      </div>

      {/* Split Container */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start flex-1 min-h-[85vh] gap-3 lg:gap-4 px-2 lg:px-4 py-4 lg:py-6">

        {/* ═══════════════════════════════════════════
            LEFT — Photo 2 Video
            ═══════════════════════════════════════════ */}
        <div className="relative flex-1 flex items-center justify-center px-2 lg:px-6 py-10 lg:py-16">
          <div className="relative z-10 max-w-[680px] w-full">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-gray-300/40">
              <div className="flex flex-col items-center text-center">
                {/* Label pill */}
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 border border-green-200">
                  <Video className="w-3.5 h-3.5" />
                  LISTING VIDEOS
                </div>

                {/* Headline */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 leading-tight">
                  Listing Photos to
                  <br />
                  <span className="text-green-600">Cinematic Video</span>
                </h2>

                <p className="text-gray-600 text-lg lg:text-xl mb-6 leading-relaxed max-w-lg">
                  Upload your photos, pick your music, add your branding — professional walkthrough video delivered in under 12 hours. No videographer needed.
                </p>

                {/* Mini video preview */}
                <div className="relative aspect-video w-full max-w-md rounded-2xl overflow-hidden mb-6 border border-gray-200 shadow-lg">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/p2v-website-her-vid.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                      <Play className="h-5 w-5 text-gray-900 ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Stat callout */}
                <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-3 max-w-md w-full mb-8">
                  <p className="text-sm font-bold text-gray-900">
                    Listings with video get{" "}
                    <span className="text-green-600">400% more inquiries</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    — National Association of Realtors
                  </p>
                </div>

                {/* CTA */}
                <Link href="/order" passHref>
                  <Button
                    size="lg"
                    className="group text-xl px-10 py-9 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
                  >
                    <span className="text-[10px] uppercase tracking-widest opacity-90 mb-1 font-black">
                      Limited Time Offer
                    </span>
                    <div className="flex items-center gap-3">
                      <span>Create My Listing Video</span>
                      <span className="flex items-center">
                        <span className="line-through text-white/50 text-base mr-2 font-medium">
                          $119
                        </span>
                        <span className="text-2xl">$79</span>
                      </span>
                    </div>
                  </Button>
                </Link>

                {/* Trust badges */}
                <div className="flex flex-wrap justify-center items-center gap-5 text-gray-500 mt-5">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Satisfaction Guarantee</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span>Under 12h Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Lock className="w-4 h-4 text-green-500" />
                    <span>Secure Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            RIGHT — P2V Lens
            ═══════════════════════════════════════════ */}
        <div className="relative flex-1 flex items-center justify-center px-2 lg:px-6 py-10 lg:py-16">
          <div className="relative z-10 max-w-[680px] w-full">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-gray-300/40">
              <div className="flex flex-col items-center text-center">
                {/* Label pill */}
                <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 border border-cyan-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI MARKETING SUITE
                </div>

                {/* Headline */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 leading-tight">
                  P2V Lens
                  <br />
                  <span className="text-cyan-600">Your Entire Marketing Team</span>
                </h2>

                <p className="text-gray-600 text-lg lg:text-xl mb-6 leading-relaxed max-w-lg">
                  Replace expensive design services, copywriting fees, staging costs, and web development bills. One subscription, every marketing tool an agent needs.
                </p>

                {/* Tool grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 w-full max-w-md">
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
                      className="flex items-center gap-2 text-gray-700 text-sm font-medium bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 hover:border-cyan-200 hover:bg-cyan-50/50 transition-colors justify-center"
                    >
                      <tool.icon className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      {tool.label}
                    </div>
                  ))}
                </div>

                {/* Stat callout — matches video card height */}
                <div className="bg-cyan-50 border border-cyan-100 rounded-xl px-5 py-3 max-w-md w-full mb-6">
                  <p className="text-sm font-bold text-gray-900">
                    Professional photos sell homes{" "}
                    <span className="text-cyan-600">32% faster</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    — Real Estate Staging Association
                  </p>
                </div>

                {/* Benefits list */}
                <div className="flex flex-col gap-1.5 mb-8 items-center">
                  {[
                    "10% off every video order",
                    "Priority processing — first in queue",
                    "Per-clip Quick Videos from $4.95",
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link href="/lens" passHref>
                  <Button
                    size="lg"
                    className="group text-xl px-10 py-9 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
                  >
                    <span className="text-[10px] uppercase tracking-widest opacity-90 mb-1 font-black">
                      Built for Real Estate Agents
                    </span>
                    <div className="flex items-center gap-3">
                      <span>Explore P2V Lens</span>
                      <span className="text-2xl">$27.95/mo</span>
                    </div>
                  </Button>
                </Link>

                {/* Trust badges */}
                <div className="flex flex-wrap justify-center items-center gap-5 text-gray-500 mt-5">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Camera className="w-4 h-4 text-cyan-500" />
                    <span>200 Analyses/Month</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <ShieldCheck className="w-4 h-4 text-cyan-500" />
                    <span>Cancel Anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom credibility bar */}
      <div className="relative z-10 bg-blue-900 px-6 py-3">
        <p className="text-center text-md text-gray-300 font-medium">
          Built for real estate agents by marketers with{" "}
          <span className="text-white font-bold">20+ years of experience</span>
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-40 animate-bounce">
        <ChevronDown className="w-6 h-6 text-gray-400" />
      </div>
    </section>
  );
}
