"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Camera,
  PenTool,
  MessageSquare,
  Sofa,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  ImageIcon,
  Shield,
  DollarSign,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasConsent } from "@/components/cookie-consent";

export default function LensLandingPage() {
  const [ctaUrl, setCtaUrl] = useState("/login?redirect=/dashboard/lens");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmString = params.toString();

    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          setCtaUrl(utmString ? `/dashboard/lens?${utmString}` : "/dashboard/lens");
        } else {
          const redirect = encodeURIComponent(
            utmString ? `/dashboard/lens?${utmString}` : "/dashboard/lens"
          );
          setCtaUrl(`/login?redirect=${redirect}`);
        }
      } catch {
        const redirect = encodeURIComponent("/dashboard/lens");
        setCtaUrl(`/login?redirect=${redirect}`);
      }
    };
    checkAuth();

    // Fire ViewContent for ad tracking
    if (hasConsent("marketing") && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "ViewContent", { content_name: "Lens Landing Page" });
    }
  }, []);

  const features = [
    {
      icon: Camera,
      title: "AI Photo Coach",
      desc: "Snap a photo on-site, get instant AI feedback. Fix lighting, angles, and composition issues before you leave the property.",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: PenTool,
      title: "Design Studio",
      desc: "Just Listed, Open House, Price Reduced, yard signs, flyers — professional marketing graphics ready in 60 seconds.",
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      icon: MessageSquare,
      title: "Description Writer",
      desc: "AI analyzes your listing photos and writes MLS-ready descriptions. Choose Professional, Luxury, Conversational, or Concise.",
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      icon: Sofa,
      title: "Virtual Staging",
      desc: "Furnish empty rooms with AI. 8 design styles from Modern to Farmhouse. Preserves room architecture and lighting.",
      color: "bg-green-500/10 text-green-600",
    },
    {
      icon: DollarSign,
      title: "10% Off Video Orders",
      desc: "Save 10% on every Photo 2 Video order, applied automatically at checkout. Subscribers pay less on every listing video.",
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      icon: Zap,
      title: "Priority Video Processing",
      desc: "Subscribers go first in the production queue. Your listing videos are prioritized ahead of standard orders.",
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      icon: Film,
      title: "Quick Videos — $4.95/clip",
      desc: "Order 5-14 clip videos for social media, listing refreshers, and open house promos. Full HD, branded, delivered in 12 hours.",
      color: "bg-pink-500/10 text-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Minimal Header ── */}
      <header className="bg-primary py-4 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={150}
              height={60}
              className="h-9 sm:h-10 w-auto"
            />
          </Link>
          <a
            href="tel:+18455366954"
            className="text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">(845) 536-6954</span>
            <span className="sm:hidden">Call Us</span>
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Marketing Suite
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Every AI Tool a
            <br />
            Listing Agent Needs
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-muted-foreground">
              — $27.95/month
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Photo coaching, design studio, listing descriptions, virtual staging, and short-form videos from $4.95/clip — all in one subscription.
          </p>

          {/* CTA */}
          <div className="mt-8">
            <Button
              asChild
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-lg sm:text-xl px-10 py-7 rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all hover:scale-[1.02]"
            >
              <Link href={ctaUrl}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Trust Points */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-green-600" />
              Photo coaching, staging, descriptions &amp; more
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-600" />
              Try free — no credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-card rounded-2xl border border-border p-6 hover:border-accent/30 hover:shadow-md transition-all"
              >
                <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's Included ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-2xl mx-auto">
          <div className="bg-muted/50 rounded-2xl border border-border p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-6">
              Everything in Your Subscription
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-left max-w-md mx-auto">
              {[
                "200 photo analyses/month",
                "25 virtual stagings/month",
                "Unlimited design exports",
                "Unlimited descriptions",
                "AI photo coaching on-site",
                "8 staging design styles",
                "4 description writing tones",
                "Priority video processing",
                "Free photo editing on orders",
                "10% off all video orders",
                "Per-clip video ordering (5-14 clips @ $4.95)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-3xl font-black text-foreground">$27.95<span className="text-base font-medium text-muted-foreground">/mo</span></div>
              <p className="text-xs text-muted-foreground mt-1">or $279/year (save 17%)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Free Trial Details ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            Try It Free — No Risk
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Your free trial includes access to every tool so you can see the value before you commit.
          </p>
          <div className="inline-grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { count: "3", label: "Photo Analyses" },
              { count: "1", label: "Description" },
              { count: "1", label: "Virtual Staging" },
              { count: "3", label: "Design Exports" },
            ].map(({ count, label }) => (
              <div key={label} className="bg-card rounded-xl border border-border px-4 py-3">
                <div className="text-2xl font-black text-foreground">{count}</div>
                <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
            Market Listings Like a Pro
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join agents who use AI to create better listings, faster. Start your free trial today.
          </p>
          <Button
            asChild
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-lg sm:text-xl px-10 py-7 rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all hover:scale-[1.02]"
          >
            <Link href={ctaUrl}>
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Minimal Footer ── */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
