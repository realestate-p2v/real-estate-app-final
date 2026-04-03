"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Sparkles,
  PenTool,
  FileText,
  Sofa,
  ImagePlus,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "AI Photo Coach",
    description:
      "Get instant feedback on every listing photo. Fix lighting, composition, and staging issues while you're still on-site.",
  },
  {
    icon: ImagePlus,
    title: "Free Photo Editing",
    description:
      "Professional corrections included — brightness, color, perspective, and sky replacement on every photo.",
  },
  {
    icon: PenTool,
    title: "AI Design Studio",
    description:
      "Create Just Listed flyers, Open House announcements, and social graphics in under a minute.",
  },
  {
    icon: FileText,
    title: "AI Description Writer",
    description:
      "Upload listing photos and get MLS-ready descriptions instantly. Four writing styles to match your brand.",
  },
  {
    icon: Sofa,
    title: "Virtual Staging",
    description:
      "Stage empty rooms with AI in seconds. Modern, traditional, coastal — any style, a fraction of the cost.",
  },
  {
    icon: Sparkles,
    title: "Priority Delivery",
    description:
      "Lens subscribers jump the queue. Your video orders are processed first and delivered in under 12 hours.",
  },
];

export function LensIntroSection() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            NEW
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Introducing P2V Lens
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            The AI Marketing Suite Built for Real Estate Agents
          </p>
          <p className="text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Built by real estate marketing professionals — not a generic AI company. Every tool understands listings, MLS requirements, and what sells homes. Better photos, better descriptions, stunning marketing materials — purpose-built for how agents actually work.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing + CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            Everything included in one subscription
          </p>
          <p className="text-3xl font-extrabold text-foreground mb-6">
            Starting at{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-400 to-cyan-400">
              $27.95/month
            </span>
          </p>
          <Link href="/lens" passHref>
            <Button
              size="lg"
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all hover:scale-105 rounded-full font-bold text-lg px-10 py-7 border-none"
            >
              Learn More About P2V Lens
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Brokerage pricing available — $19.95/agent/month for teams of 10+
          </p>
        </div>
      </div>
    </section>
  );
}
