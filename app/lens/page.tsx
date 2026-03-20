"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  Sparkles,
  Zap,
  Clock,
  Sofa,
  CheckCircle,
  ArrowRight,
  Upload,
  MessageSquare,
  RefreshCw,
  Star,
  Building2,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Users,
  ImageIcon,
  TrendingUp,
} from "lucide-react";

export default function LensPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [interest, setInterest] = useState<"individual" | "brokerage">("individual");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [billingToggle, setBillingToggle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/lens/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, interest, company }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Camera className="h-6 w-6" />,
      title: "AI Photo Coach",
      description: "Snap a listing photo and hit Analyze. AI tells you exactly what to fix — \"Turn on the overhead lights, move two feet left, and reshoot from chest height.\" Fix it on the spot, re-analyze, and leave every room with a perfect shot.",
      color: "bg-blue-500/10 text-blue-600",
      status: "live" as const,
    },
    {
      icon: <ImageIcon className="h-6 w-6" />,
      title: "Free Photo Editing",
      description: "Every video order includes professional AI color correction, brightness, and white balance adjustments at no extra charge. Normally $2.99/photo.",
      color: "bg-emerald-500/10 text-emerald-600",
      status: "live" as const,
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI Suggest",
      description: "When ordering a video, AI auto-fills optimal camera directions for each photo based on room type and composition. Skip the guesswork.",
      color: "bg-purple-500/10 text-purple-600",
      status: "live" as const,
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Priority Delivery",
      description: "Get your listing videos in 12 hours instead of the standard 24. When time is money, P2V Lens subscribers go first.",
      color: "bg-amber-500/10 text-amber-600",
      status: "live" as const,
    },
    {
      icon: <ImageIcon className="h-6 w-6" />,
      title: "Marketing Design Studio",
      description: "Premade templates for Just Listed, Just Sold, Open House, Price Reduced, Market Reports, and more. Upload your headshot + home photo — AI assembles a polished, print-ready flyer in seconds.",
      color: "bg-orange-500/10 text-orange-600",
      status: "coming" as const,
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Listing Description Writer",
      description: "AI analyzes your approved listing photos, notes room details and finishes, then combines them with your property data to write a polished, MLS-ready listing description. Multiple styles available.",
      color: "bg-teal-500/10 text-teal-600",
      status: "coming" as const,
    },
    {
      icon: <Sofa className="h-6 w-6" />,
      title: "Virtual Staging",
      description: "Upload photos of empty rooms, and AI generates beautifully furnished versions in multiple styles — modern, traditional, minimalist.",
      color: "bg-indigo-500/10 text-indigo-600",
      status: "coming" as const,
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Take a Photo",
      description: "Snap a photo of any room during your listing shoot.",
      icon: <Camera className="h-8 w-8" />,
    },
    {
      step: "2",
      title: "Hit Analyze",
      description: "Think a photo looks good? Upload it and tap Analyze. AI spots what your eye missed — \"Too dark, open the blinds and reshoot from the doorway.\"",
      icon: <MessageSquare className="h-8 w-8" />,
    },
    {
      step: "3",
      title: "Reshoot or Keep",
      description: "Fix issues on the spot. Move on when it's perfect. Leave with professional-quality photos every time.",
      icon: <CheckCircle className="h-8 w-8" />,
    },
  ];

  const faqs = [
    {
      q: "How does the AI Photo Coach work?",
      a: "Upload any listing photo and our AI (powered by Claude Vision) analyzes it instantly. You'll get specific, actionable feedback — not vague tips, but exactly what to fix: \"The kitchen is underexposed. Open the blinds on the east wall, turn on the overhead light, and retake from the doorway at chest height.\" Use it during your photo shoot to coach yourself room by room.",
    },
    {
      q: "What counts as one \"analysis\"?",
      a: "Each photo you upload for AI feedback counts as one analysis. You get 200 per month — enough for about 2 full listing shoots with coaching on every single photo (25 photos × 4 attempts each = 100 analyses per listing).",
    },
    {
      q: "Do I need to be a P2V video customer to use Lens?",
      a: "No — P2V Lens works as a standalone subscription. The AI Photo Coach helps you take better photos regardless of whether you order videos from us. But if you do order videos, your subscription includes free photo editing and priority 12-hour delivery on every order.",
    },
    {
      q: "What's included in Free Photo Editing?",
      a: "When you order a video with an active P2V Lens subscription, we professionally correct every photo before generating your video — AI color correction, brightness, white balance, and exposure adjustments. This normally costs $2.99 per photo as an add-on.",
    },
    {
      q: "How does brokerage pricing work?",
      a: "Brokerage plans are $19.95 per agent per month with a minimum of 10 agents. Each agent gets their own login and 200 analyses per month. Seats are tied to email addresses to prevent sharing. Contact us to set up your brokerage account.",
    },
    {
      q: "When are the other features launching?",
      a: "Marketing Design Studio, AI Listing Description Writer, and Virtual Staging are all in active development and expected to roll out through 2026. P2V Lens subscribers will get access to each at no additional cost as they launch.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-primary">
        {/* Subtle camera aperture pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border-[80px] border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[50px] border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border-[30px] border-white" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
              <span className="text-primary-foreground/80 text-sm font-medium">Introducing P2V Lens</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight tracking-tight">
              Your AI Photography
              <br />
              <span className="text-accent">Coach for Real Estate</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Take professional-quality listing photos without hiring a photographer.
              Upload a photo, get instant AI feedback, reshoot on the spot — perfect photos every time.
            </p>

            {/* Hero Email Capture */}
            {!submitted ? (
              <form onSubmit={handleWaitlist} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 h-12 text-base"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-12 px-6 text-base whitespace-nowrap"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Get Early Access
                </Button>
              </form>
            ) : (
              <div className="mt-8 inline-flex items-center gap-2 bg-green-500/20 text-green-200 rounded-full px-6 py-3 font-semibold">
                <Check className="h-5 w-5" />
                You&apos;re on the list! We&apos;ll be in touch soon.
              </div>
            )}
            {error && (
              <p className="mt-3 text-red-300 text-sm">{error}</p>
            )}

            <p className="mt-4 text-primary-foreground/40 text-sm">
              Join the waitlist — launching soon. No credit card required.
            </p>
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
            <span className="text-sm font-semibold text-foreground">Listings with video get <span className="text-accent">403% more inquiries</span></span>
          </div>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-foreground">Professional photos sell <span className="text-accent">32% faster</span></span>
          </div>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-foreground">200 AI analyses <span className="text-accent">per month</span></span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURES SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Everything You Need to Shoot Like a Pro
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Four powerful features available now, plus three game-changers coming soon — all included in your subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300 ${
                  feature.status === "coming" ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                    {feature.icon}
                  </div>
                  {feature.status === "coming" ? (
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Available
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
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
              How AI Photo Coach Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Use it during your listing shoot. Leave with professional photos — every time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-5">
                  {step.icon}
                </div>
                <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-accent text-accent-foreground text-sm font-bold mb-3">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Example feedback mockup */}
          <div className="mt-14 bg-card rounded-2xl border border-border p-6 sm:p-8 max-w-2xl mx-auto">
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
                <p className="text-sm text-foreground"><strong>Lighting:</strong> The kitchen is underexposed. Open the blinds on the east-facing window and turn on the overhead recessed lights. Avoid the fluorescent above the island — it creates a yellow cast.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-600 text-xs font-bold">~</span>
                </div>
                <p className="text-sm text-foreground"><strong>Angle:</strong> You&apos;re too close to the counter. Step back 3 feet and shoot from the doorway at chest height to show the full room depth.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                <p className="text-sm text-foreground"><strong>Composition:</strong> Good framing with the island as a leading line. Keep this angle after fixing the lighting.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PRICING SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Less than a dollar a day for AI photography coaching that pays for itself on your first listing.
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
              <span className="ml-1.5 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-bold">Save 2 months</span>
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
                    <p className="text-sm text-green-600 font-medium mt-1">$23.25/month — save $55.40</p>
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "200 photo analyses / month",
                  "AI Photo Coach with instant feedback",
                  "Free photo editing on all video orders",
                  "AI Suggest camera directions",
                  "Priority 12-hour video delivery",
                  "10% off all Photo 2 Video orders",
                  "Early access to new features",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => {
                  setInterest("individual");
                  document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-base"
              >
                Join the Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
                  "Exclusive bulk video pricing (from $2.99/clip)",
                  "Branded videos for every agent",
                  "Dedicated account support",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => {
                  setInterest("brokerage");
                  document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" });
                }}
                variant="outline"
                className="w-full py-6 text-base font-bold"
              >
                Contact for Brokerage Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* BROKERAGE CTA */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-16 bg-primary">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Building2 className="h-4 w-4 text-primary-foreground/70" />
            <span className="text-primary-foreground/80 text-sm font-medium">For Brokerages</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground mb-4">
            Equip Your Entire Team
          </h2>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            Give every agent AI photography coaching for less than a dollar a day.
            Combined with brokerage video pricing, your team gets a complete listing media solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                setInterest("brokerage");
                document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg"
            >
              Get Brokerage Pricing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button asChild className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:text-white px-8 py-6 text-lg font-bold">
              <Link href="/P2V_Brokerage_Presentation.pdf" target="_blank">
                Download Brokerage PDF
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* EMAIL CAPTURE / WAITLIST FORM */}
      {/* ═══════════════════════════════════════════ */}
      <section id="waitlist-form" className="py-20 sm:py-24">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-foreground">
              {submitted ? "You're on the List!" : "Get Early Access"}
            </h2>
            {!submitted && (
              <p className="mt-3 text-muted-foreground">
                Be the first to know when P2V Lens launches. No spam, just one email when we&apos;re live.
              </p>
            )}
          </div>

          {submitted ? (
            <div className="bg-card rounded-2xl border border-green-200 p-8 text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Welcome aboard!</h3>
              <p className="text-muted-foreground">
                We&apos;ll send you an email when P2V Lens is ready. In the meantime, check out our video service.
              </p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                <Link href="/order">Create a Listing Video</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-5">
              {/* Interest toggle */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">I&apos;m interested as...</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterest("individual")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      interest === "individual"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    Individual Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterest("brokerage")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      interest === "brokerage"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    Brokerage
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="waitlist-name" className="text-sm font-semibold text-foreground mb-1.5 block">Name</label>
                <Input
                  id="waitlist-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div>
                <label htmlFor="waitlist-email" className="text-sm font-semibold text-foreground mb-1.5 block">Email *</label>
                <Input
                  id="waitlist-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {interest === "brokerage" && (
                <div>
                  <label htmlFor="waitlist-company" className="text-sm font-semibold text-foreground mb-1.5 block">Brokerage Name</label>
                  <Input
                    id="waitlist-company"
                    type="text"
                    placeholder="Your brokerage"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-base"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {interest === "brokerage" ? "Request Brokerage Info" : "Join the Waitlist"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">No spam. One email when we launch.</p>
            </form>
          )}
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
                  <span className="font-semibold text-foreground text-sm sm:text-base">{faq.q}</span>
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
      {/* BOTTOM CTA */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Ready to Take Better Listing Photos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            P2V Lens + Photo 2 Video = your complete listing media solution.
            Better photos in, better videos out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg"
            >
              Join the P2V Lens Waitlist
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button asChild variant="outline" className="px-8 py-6 text-lg font-bold">
              <Link href="/order">
                Create a Listing Video
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
