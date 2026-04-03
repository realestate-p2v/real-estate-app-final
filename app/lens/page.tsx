"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Sparkles,
  Zap,
  Sofa,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Star,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ImageIcon,
  TrendingUp,
  LogIn,
  PenTool,
  Percent,
  Clock,
  Gift,
  Film,
} from "lucide-react";

export default function LensPage() {
  const router = useRouter();
  const [billingToggle, setBillingToggle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

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

        if (usage?.is_subscriber) {
          setIsSubscriber(true);
        }
      }
      setLoadingUser(false);
    };
    init();
  }, []);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!user) {
      router.push("/login?redirect=/lens");
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch("/api/lens/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          user_id: user.id,
          user_email: user.email,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const toolLink = (path: string) => (user ? path : `/login?redirect=${path}`);

  const faqs = [
    {
      q: "How does the AI Photo Coach work?",
      a: "Upload any listing photo and our AI (powered by Claude Vision) analyzes it instantly. You get specific, actionable feedback — not vague tips, but exactly what to fix: \"The kitchen is underexposed. Open the blinds on the east wall, turn on the overhead light, and retake from the doorway at chest height.\" Use it during your photo shoot to coach yourself room by room.",
    },
    {
      q: "How is P2V Lens different from other AI tools?",
      a: "P2V Lens is built specifically for real estate listing marketing — not repurposed from a generic AI platform. Every tool understands MLS requirements, listing photography standards, and what actually sells homes. The Photo Coach scores photos based on real estate criteria. The Description Writer knows MLS formatting rules. The Design Studio has templates for Just Listed, Open House, and Price Reduced — not generic flyer makers. This is the difference between a tool built by real estate marketers and one built by a tech company.",
    },
    {
      q: "What counts as one \"analysis\"?",
      a: "Each photo you upload for AI feedback counts as one analysis. You get 200 per month — enough for about 2 full listing shoots with coaching on every single photo (25 photos × 4 attempts each = 100 analyses per listing).",
    },
    {
      q: "How does Quick Video pricing work?",
      a: "Subscribers can order short-form videos with 5–14 clips at $4.95 per clip. This rate already includes your 10% subscriber savings. Quick Videos include branding and music but do not include a free revision — paid revisions are available at standard rates. Upload 15+ photos and you'll automatically get the Standard package ($79) with your 10% subscriber discount at checkout.",
    },
    {
      q: "Do I need to be a P2V video customer to use Lens?",
      a: "No — P2V Lens works as a standalone subscription. The AI Photo Coach helps you take better photos regardless of whether you order videos from us. But if you do order videos, your subscription includes free photo enhancement, 10% off every order, priority processing, and per-clip Quick Video pricing.",
    },
    {
      q: "What's included in Free Photo Enhancement?",
      a: "When you order a video with an active P2V Lens subscription, we professionally enhance every photo before generating your video — AI color correction, brightness, white balance, and vertical line straightening. This is automatically included at no extra charge.",
    },
    {
      q: "How does the 10% video discount work?",
      a: "When you place a video order while subscribed to P2V Lens, the 10% discount is applied automatically at checkout. No coupon code needed — the system detects your active subscription and applies the savings. Note: Quick Video orders already have subscriber pricing built in, so the 10% coupon doesn't apply on top.",
    },
    {
      q: "How does Virtual Staging work?",
      a: "Upload a photo of an empty room, choose a furniture style (Modern, Traditional, Farmhouse, etc.), and AI adds realistic furniture while preserving the actual room architecture — walls, windows, floors stay exactly as they are. You get a before/after comparison you can use in your listing.",
    },
    {
      q: "How does brokerage pricing work?",
      a: "Brokerage plans are $19.95 per agent per month with a minimum of 10 agents. Each agent gets their own login and 200 analyses per month. Contact us to set up your brokerage account.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes — cancel anytime from your Account Settings. Your subscription stays active through the end of your current billing period. No contracts, no cancellation fees.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border-[80px] border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[50px] border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border-[30px] border-white" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight tracking-tight">
              Your AI-Powered
              <br />
              <span className="text-accent">Real Estate Marketing Suite</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Photo coaching, marketing design, listing descriptions, virtual staging, and short-form videos from $4.95/clip — purpose-built for real estate agents, not a generic AI tool.
            </p>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-primary-foreground/60 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent" /> 7 AI Tools
              </span>
              <span className="hidden sm:block">·</span>
              <span className="flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-accent" /> 200 Analyses/Month
              </span>
              <span className="hidden sm:block">·</span>
              <span className="flex items-center gap-1.5">
                <Film className="h-4 w-4 text-accent" /> Videos from $24.75
              </span>
              <span className="hidden sm:block">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-accent" /> Cancel Anytime
              </span>
            </div>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {isSubscriber ? (
                <Button
                  asChild
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-14 px-8 text-lg"
                >
                  <Link href="/dashboard/lens">
                    Go to Your Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-14 px-8 text-lg"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button
                onClick={() =>
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg font-bold"
              >
                See Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SOCIAL PROOF BAR */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-muted/30 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Listings with video get <span className="text-accent">403% more inquiries</span>
            </span>
          </div>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Professional photos sell <span className="text-accent">32% faster</span>
            </span>
          </div>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-foreground">
              7 AI tools · <span className="text-accent">one subscription</span>
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* QUICK VIDEO SECTION — NEW */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-cyan-50/50 to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              <Film className="h-3.5 w-3.5" />
              Subscriber Exclusive
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Short-Form Videos Starting at $24.75
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Subscribers unlock per-clip video ordering. Order 5–14 clip videos at just $4.95/clip — already includes your subscriber savings.
            </p>
          </div>

          {/* Use Case Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Film className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Social Media Teaser</h3>
              <p className="text-2xl font-extrabold text-cyan-700 mb-2">5–7 clips · $24.75–$34.65</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                30-second highlight reel perfect for Instagram Reels and TikTok. Hook buyers with the best angles of your listing.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Listing Refresher</h3>
              <p className="text-2xl font-extrabold text-cyan-700 mb-2">8–10 clips · $39.60–$49.50</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Re-shoot a few rooms, get a fresh video for stale listings. New energy without the full order price.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Open House Promo</h3>
              <p className="text-2xl font-extrabold text-cyan-700 mb-2">10–12 clips · $49.50–$59.40</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Promote your open house with a video walkthrough. Share on social media and MLS the day before.
              </p>
            </div>
          </div>

          {/* What's included + CTA */}
          <div className="bg-card rounded-2xl border border-cyan-200 p-6 sm:p-8 max-w-2xl mx-auto text-center">
            <p className="text-sm font-semibold text-foreground mb-4">Every Quick Video includes:</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
              {["Custom branding", "Choice of music", "12h delivery", "HD quality"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-cyan-600" />
                  {item}
                </span>
              ))}
            </div>
            {isSubscriber ? (
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base"
              >
                <Link href="/order">
                  Order a Quick Video
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() =>
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base"
              >
                Subscribe &amp; Start Creating — $27.95/mo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURES DEEP DIVE */}
      {/* ═══════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Everything You Need to Market Your Listings
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Seven AI tools built specifically for listing marketing — all included in your subscription. No add-on fees.
            </p>
          </div>

          {/* Feature 1: AI Photo Coach */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Live
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Never Miss a Shot</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Open a session per property, and the smart checklist makes sure you never forget a room. Snap a photo and get instant AI scoring with specific feedback — &ldquo;move 3 feet left, turn on the overhead light&rdquo; — then reshoot on the spot until it&apos;s perfect. Approved photos save to your gallery, ready to order a video.
              </p>
              <div className="space-y-2 mb-5">
                {["Room-by-room checklist so you never miss a shot", "Instant 1-10 scoring with specific actionable feedback", "AI Edit: auto brightness, color, contrast correction", "HDR detection and horizon straightening", "Gallery management — approved photos ready for video orders"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
              <Link
                href={toolLink("/dashboard/lens/coach")}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
              >
                Try Photo Coach Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">AI Photo Coach — Sample Feedback</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-foreground">
                    <strong>Lighting:</strong> The kitchen is underexposed. Open the blinds on the east-facing window and turn on the overhead recessed lights.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs font-bold">~</span>
                  </div>
                  <p className="text-sm text-foreground">
                    <strong>Angle:</strong> Step back 3 feet and shoot from the doorway at chest height to show full room depth.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <p className="text-sm text-foreground">
                    <strong>Composition:</strong> Good framing with the island as a leading line. Keep this angle after fixing the lighting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Design Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <p className="text-sm font-semibold text-foreground mb-2">Template Types:</p>
                {["Just Listed", "Open House", "Price Reduced", "Just Sold", "Yard Signs", "Property PDF Sheets", "Video Branding Cards"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-muted/50">
                    <PenTool className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-sm font-medium text-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <PenTool className="h-6 w-6 text-orange-600" />
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Live
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Professional Marketing in 60 Seconds</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Just Listed, Open House, Price Reduced, Just Sold graphics. Yard signs for print shops. Property PDF sheets. Video branding cards. Upload your headshot and logo once — they&apos;re saved for next time. Pick your brokerage colors. Download print-ready PNGs and PDFs.
              </p>
              <div className="space-y-2 mb-5">
                {["7 template types for every listing stage", "Brokerage brand colors built in", "Saved headshot & logo auto-populate", "PNG + PDF export for print and social", "Video branding card designer for your orders"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
              <Link
                href={toolLink("/dashboard/lens/design-studio")}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
              >
                Open Design Studio <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Feature 3: Description Writer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-teal-600" />
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Live
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">MLS Descriptions That Sell</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Upload listing photos, enter property details, pick a writing style. AI analyzes every room — features, finishes, condition — then writes a polished, MLS-ready description. Four styles to match your voice.
              </p>
              <div className="space-y-2 mb-5">
                {["Claude Vision photo analysis — sees what's in every room", "4 styles: Professional, Luxury, Conversational, Concise", "Edit in-place, then copy to clipboard", "Works with Photo Coach gallery photos"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
              <Link
                href={toolLink("/dashboard/lens/descriptions")}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
              >
                Write a Description <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <p className="text-sm font-semibold text-foreground mb-3">Writing Styles:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { style: "Professional", desc: "Clean, MLS-standard tone" },
                  { style: "Luxury", desc: "Elevated, high-end language" },
                  { style: "Conversational", desc: "Warm, relatable voice" },
                  { style: "Concise", desc: "Tight, punchy, no fluff" },
                ].map((s, i) => (
                  <div key={i} className="bg-muted/50 rounded-xl p-3">
                    <p className="font-bold text-foreground text-sm">{s.style}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 4: Virtual Staging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-2xl border border-border p-6">
                <p className="text-sm font-semibold text-foreground mb-3">8 Design Styles:</p>
                <div className="flex flex-wrap gap-2">
                  {["Modern", "Traditional", "Minimalist", "Coastal", "Farmhouse", "Mid-Century", "Scandinavian", "Industrial"].map((s, i) => (
                    <span key={i} className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-semibold text-foreground mt-4 mb-2">8 Room Types:</p>
                <div className="flex flex-wrap gap-2">
                  {["Living Room", "Bedroom", "Kitchen", "Dining Room", "Office", "Bathroom", "Nursery", "Patio"].map((r, i) => (
                    <span key={i} className="text-xs font-medium bg-muted text-foreground px-3 py-1.5 rounded-lg">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Sofa className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Live
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Furnish Empty Rooms Instantly</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Upload a photo of an empty room, choose a style, and AI adds furniture while preserving the actual room architecture — walls, windows, floors stay exactly as they are. Before/after comparison slider. 8 design styles from Modern to Farmhouse.
              </p>
              <div className="space-y-2 mb-5">
                {["Preserves real room structure (not text-to-image)", "8 furniture styles × 8 room types", "Before/after comparison slider", "~$0.07 per staging — pennies per room"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
              <Link
                href={toolLink("/dashboard/lens/staging")}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
              >
                Stage a Room <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Features 5-8: Subscriber Perks (cards) */}
          <div className="text-center mb-10">
            <h3 className="text-2xl font-extrabold text-foreground">Subscriber Perks on Every Video Order</h3>
            <p className="mt-2 text-muted-foreground">Automatic benefits when you order listing videos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Film className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-bold text-foreground">Quick Videos</h4>
                <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded-full">NEW</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Order 5–14 clip videos at $4.95/clip. Perfect for social teasers, stale listings, and open house promos. Starting at just $24.75.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Free Photo Enhancement</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every video order includes professional AI corrections on all photos — brightness, color balance, contrast, white balance. Normally $2.99/photo, free with your subscription.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Priority Processing</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lens subscribers go first in the processing queue. Your orders are processed before non-subscribers, so you get your video back faster every time.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <Percent className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">10% Off Every Video</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automatic 10% discount on all Photo 2 Video orders, applied at checkout. No coupon code needed — the system detects your subscription automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Subscribe once, use everything — on every listing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Subscribe",
                description: "Instant access to all 7 AI tools. No setup, no onboarding — just log in and start using them.",
                icon: <Sparkles className="h-8 w-8" />,
              },
              {
                step: "2",
                title: "Use the Tools",
                description: "Photo Coach during shoots, Design Studio for marketing graphics, Description Writer for MLS, Virtual Staging for empty rooms.",
                icon: <Camera className="h-8 w-8" />,
              },
              {
                step: "3",
                title: "Order Videos",
                description: "Quick Videos from $24.75, or full listings with priority processing, free photo editing, and 10% off — automatically.",
                icon: <Zap className="h-8 w-8" />,
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-5">
                  {s.icon}
                </div>
                <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-accent text-accent-foreground text-sm font-bold mb-3">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PRICING SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section id="pricing" className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Less than a dollar a day for an AI marketing suite that pays for itself on your first listing.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setBillingToggle("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingToggle === "monthly"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingToggle("yearly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingToggle === "yearly"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-1.5 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                Save 2 months
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Individual Plan */}
            <div className="bg-card rounded-2xl border-2 border-accent/40 p-8 relative">
              <span className="absolute -top-3 left-6 bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
              <h3 className="text-lg font-bold text-foreground mb-1">Individual</h3>
              <p className="text-sm text-muted-foreground mb-5">For agents who want an edge</p>
              <div className="mb-6">
                {billingToggle === "monthly" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">$27.95</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">$279</span>
                      <span className="text-muted-foreground text-sm">/year</span>
                    </div>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      $23.25/month — save $55.40
                    </p>
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "200 photo analyses / month",
                  "AI Photo Coach with instant feedback",
                  "Marketing Design Studio (7 templates)",
                  "AI Listing Description Writer",
                  "Virtual Staging (8 styles)",
                  "Free photo enhancement on video orders",
                  "10% off all Photo 2 Video orders",
                  "Priority processing — first in queue",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Per-clip video ordering ($4.95/clip, 5–14 clips)
                    <span className="ml-1.5 text-[10px] bg-cyan-100 text-cyan-700 font-bold px-1.5 py-0.5 rounded-full align-middle">NEW</span>
                  </span>
                </li>
              </ul>

              {isSubscriber ? (
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-6 text-base"
                >
                  <Link href="/dashboard/lens">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    You&apos;re Subscribed — Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubscribe(billingToggle)}
                  disabled={subscribing || loadingUser}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-base"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : !user && !loadingUser ? (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Log In to Subscribe
                    </>
                  ) : (
                    <>
                      Subscribe Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}

              {!isSubscriber && (
                <p className="text-center mt-3 text-xs text-muted-foreground">
                  Try free — 3 photo analyses, 1 description, 1 staging, 3 design exports
                </p>
              )}
            </div>

            {/* Brokerage Plan */}
            <div className="bg-card rounded-2xl border border-border p-8">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-bold text-foreground">Brokerage</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Equip your entire team</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$19.95</span>
                  <span className="text-muted-foreground text-sm">/agent/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Minimum 10 agents</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Individual",
                  "200 analyses per agent / month",
                  "Centralized brokerage dashboard",
                  "Exclusive bulk video pricing (from $1.99/clip)",
                  "Branded videos for every agent",
                  "Dedicated account support",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full py-6 text-base font-bold">
                <Link href="mailto:support@realestatephoto2video.com?subject=Brokerage%20Pricing%20Inquiry">
                  Contact for Brokerage Pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-center mt-3">
                <Link
                  href="/P2V_Brokerage_Presentation.pdf"
                  target="_blank"
                  className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  Download Brokerage PDF
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <span className="font-semibold text-foreground text-sm sm:text-base">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FINAL CTA */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            3 free photo analyses, 1 listing description, 1 virtual staging, 3 design exports — no credit card required to try.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSubscriber ? (
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg"
              >
                <Link href="/dashboard/lens">
                  Go to Your Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => handleSubscribe(billingToggle)}
                disabled={subscribing}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Subscribe to P2V Lens
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
            <Button asChild variant="outline" className="px-8 py-6 text-lg font-bold">
              <Link href="/order">Create a Listing Video</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
