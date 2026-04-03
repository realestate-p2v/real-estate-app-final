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
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function TestP2VPage() {
  return (
    <section className="relative min-h-[85vh] flex flex-col overflow-hidden bg-gray-50">
      {/* Background pattern — subtle grid */}
      <div
        className="absolute inset-0 z-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(209 213 219) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Large ambient blurs behind everything */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-green-200/30 rounded-full blur-[150px] z-0" />
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[150px] z-0" />
      <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-emerald-100/40 rounded-full blur-[120px] z-0" />

      {/* Split Container — tighter gap */}
      <div className="relative z-10 flex flex-col lg:flex-row flex-1 min-h-[85vh] gap-3 lg:gap-4 px-3 lg:px-5 py-4 lg:py-6">

        {/* ═══════════════════════════════════════════
            LEFT — Photo 2 Video
            Warm white / soft gray, green accents
            ═══════════════════════════════════════════ */}
        <div className="relative flex-1 flex items-center justify-center px-4 lg:px-10 py-10 lg:py-16">

          <div className="relative z-10 max-w-xl w-full">
            {/* Card */}
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-7 lg:p-9 shadow-2xl shadow-gray-300/40 text-center lg:text-left">
              {/* Label pill */}
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 border border-green-200">
                <Video className="w-3.5 h-3.5" />
                LISTING VIDEOS
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight mb-4 text-gray-900 leading-tight">
                Listing Photos to
                <br />
                <span className="text-green-600">Cinematic Video</span>
              </h2>

              <p className="text-gray-600 text-base lg:text-lg mb-6 leading-relaxed max-w-md mx-auto lg:mx-0">
                Upload your photos, pick your music, add your branding — professional walkthrough video delivered in under 12 hours. No videographer needed.
              </p>

              {/* Mini video preview */}
              <div className="relative aspect-video max-w-sm mx-auto lg:mx-0 rounded-2xl overflow-hidden mb-6 border border-gray-200 shadow-lg">
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
                  <div className="h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                    <Play className="h-4 w-4 text-gray-900 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Stat callout */}
              <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-2.5 text-center lg:text-left max-w-sm mx-auto lg:mx-0 mb-7">
                <p className="text-sm font-bold text-gray-900">
                  Listings with video get{" "}
                  <span className="text-green-600">400% more inquiries</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  — National Association of Realtors
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center lg:items-start gap-5">
                <Link href="/order" passHref>
                  <Button
                    size="lg"
                    className="group text-lg px-8 py-7 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg shadow-green-500/25 transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
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
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-gray-500">
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
            Cool white / slight blue tint, cyan accents
            ═══════════════════════════════════════════ */}
        <div className="relative flex-1 flex items-center justify-center px-4 lg:px-10 py-10 lg:py-16">

          <div className="relative z-10 max-w-xl w-full">
            {/* Card */}
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-7 lg:p-9 shadow-2xl shadow-gray-300/40 text-center lg:text-left">
              {/* Label pill */}
              <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 border border-cyan-200">
                <Sparkles className="w-3.5 h-3.5" />
                AI MARKETING SUITE
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight mb-4 text-gray-900 leading-tight">
                P2V Lens
                <br />
                <span className="text-cyan-600">Your Entire Marketing Team</span>
              </h2>

              <p className="text-gray-600 text-base lg:text-lg mb-6 leading-relaxed max-w-md mx-auto lg:mx-0">
                Replace your graphic designer, copywriter, stager, and web developer. One subscription, every tool an agent needs.
              </p>

              {/* Tool grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-6 max-w-sm mx-auto lg:mx-0">
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
                    className="flex items-center gap-2.5 text-gray-700 text-sm font-medium bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 hover:border-cyan-200 hover:bg-cyan-50/50 transition-colors"
                  >
                    <tool.icon className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    {tool.label}
                  </div>
                ))}
              </div>

              {/* Benefits list */}
              <div className="flex flex-col gap-1.5 mb-7 max-w-sm mx-auto lg:mx-0">
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
              <div className="flex flex-col items-center lg:items-start gap-5">
                <Link href="/lens" passHref>
                  <Button
                    size="lg"
                    className="group text-lg px-8 py-7 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg shadow-green-500/25 transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
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
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-gray-500">
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
      <div className="relative z-10 bg-gray-900 px-6 py-3">
        <p className="text-center text-sm text-gray-400 font-medium">
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
