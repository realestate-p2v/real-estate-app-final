"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Clock,
  RefreshCw,
  Monitor,
  Shield,
  Upload,
  Wand2,
  Share2,
  Play,
  CheckCircle,
  ArrowRight,
  Music,
  Palette,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasConsent } from "@/components/cookie-consent";

export default function VideoLandingPage() {
  const [orderUrl, setOrderUrl] = useState("/order");

  // Preserve UTM params on CTA links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmString = params.toString();
    setOrderUrl(utmString ? `/order?${utmString}` : "/order");

    // Fire ViewContent for ad tracking
    if (hasConsent("marketing") && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "ViewContent", { content_name: "Video Landing Page" });
    }
  }, []);

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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Turn Your Listing Photos Into
            <br />
            <span className="text-accent">Professional Videos</span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-muted-foreground">
              — Under 12 Hours
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Upload your photos. We deliver a cinematic walkthrough video. No videographer needed. No editing skills required.
          </p>

          {/* CTA */}
          <div className="mt-8">
            <Button
              asChild
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-lg sm:text-xl px-10 py-7 rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all hover:scale-[1.02]"
            >
              <Link href={orderUrl}>
                Create My Listing Video — $79
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Trust Points */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-green-600" />
              Under 12h delivery
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-green-600" />
              1 free revision
            </span>
            <span className="flex items-center gap-1.5">
              <Monitor className="h-4 w-4 text-green-600" />
              MLS, Zillow, social ready
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-600" />
              Satisfaction guarantee
            </span>
          </div>
        </div>
      </section>

      {/* ── Sample Video ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl aspect-video bg-black">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="https://res.cloudinary.com/dh6ztnoue/video/upload/so_0,w_1280,q_auto,f_jpg/v1774477216/p2v-demo-720HD_zop75m.jpg"
              className="w-full h-full object-cover"
            >
              <source
                src="https://res.cloudinary.com/dh6ztnoue/video/upload/q_auto,f_auto,sp_auto/v1774477216/p2v-demo-720HD_zop75m.mp4"
                type="video/mp4"
              />
            </video>
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Sample listing video
            </div>
          </div>
        </div>
      </section>

      {/* ── What's Included ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-3">
            Everything Included — No Hidden Fees
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Every video order comes with these features at no extra charge.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Palette, label: "Custom Branding", desc: "Your name, logo, and contact info on intro & outro cards" },
              { icon: Music, label: "Licensed Music", desc: "Choose from our royalty-free music library" },
              { icon: Wand2, label: "AI Camera Motion", desc: "Cinematic pan, zoom, and dolly effects on every photo" },
              { icon: Users, label: "Human-Reviewed", desc: "A real editor reviews every clip before delivery" },
              { icon: RefreshCw, label: "1 Free Revision", desc: "Flag any clips you want regenerated within 5 days" },
              { icon: Monitor, label: "All Platforms", desc: "Landscape for MLS & Zillow, or vertical for Reels & TikTok" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-4 text-center">
                <div className="mx-auto h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              {
                icon: Upload,
                step: "1",
                title: "Upload Photos",
                desc: "Drag and drop your listing photos. Choose your music and branding.",
              },
              {
                icon: Wand2,
                step: "2",
                title: "We Edit",
                desc: "Our AI pipeline generates cinematic motion. A real editor reviews every clip.",
              },
              {
                icon: Share2,
                step: "3",
                title: "You Share",
                desc: "Download your video and post it everywhere — MLS, Zillow, Instagram, TikTok.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-3 sm:mb-4">
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
                </div>
                <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">
                  Step {step}
                </div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-3">
            Simple Pricing
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            One video per listing. Pick the package that fits your photo count.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {[
              { photos: "Up to 15", price: 79, popular: false },
              { photos: "Up to 25", price: 129, popular: true },
              { photos: "Up to 35", price: 179, popular: false },
            ].map(({ photos, price, popular }) => (
              <Link
                key={price}
                href={orderUrl}
                className={`relative block rounded-2xl border-2 p-5 sm:p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1 ${
                  popular
                    ? "border-accent bg-accent/5 shadow-md"
                    : "border-border hover:border-accent/40"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="text-3xl sm:text-4xl font-black text-foreground">${price}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{photos} Photos</div>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" /> Under 12h delivery
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" /> Free branding cards
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" /> Licensed music
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" /> 1 free revision
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" /> HD video
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-muted/50 rounded-2xl border border-border p-8 sm:p-10">
            <p className="text-lg sm:text-xl font-bold text-foreground italic leading-relaxed">
              &ldquo;Listings with video receive 403% more inquiries than those without.&rdquo;
            </p>
            <p className="mt-3 text-sm text-muted-foreground font-medium">
              — National Association of Realtors
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
            Ready to Stand Out?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Upload your listing photos now and get a professional walkthrough video delivered to your inbox in under 12 hours.
          </p>
          <Button
            asChild
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-lg sm:text-xl px-10 py-7 rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all hover:scale-[1.02]"
          >
            <Link href={orderUrl}>
              Create My Listing Video — $79
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
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
