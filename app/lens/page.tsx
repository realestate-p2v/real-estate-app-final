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
      router.push("/auth/login?redirect=/lens");
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

  const features = [
    {
      icon: <Camera className="h-6 w-6" />,
      title: "AI Photo Coach",
      description:
        'Snap a listing photo and hit Analyze. AI tells you exactly what to fix — "Turn on the overhead lights, move two feet left, and reshoot from chest height." Fix it on the spot, re-analyze, and leave every room with a perfect shot.',
      color: "bg-blue-500/10 text-blue-600",
      tryHref: "/dashboard/lens/coach",
      tryLabel: "Try Free →",
    },
    {
      icon: <ImageIcon className="h-6 w-6" />,
      title: "Free Photo Enhancement",
      description:
        "Every video order includes professional AI enhancement — brightness, color correction, white balance, and vertical line straightening at no extra charge.",
      color: "bg-emerald-500/10 text-emerald-600",
      tryHref: "/order",
      tryLabel: "Order a Video →",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI Suggest",
      description:
        "When ordering a video, AI auto-fills optimal camera directions for each photo based on room type and composition. Skip the guesswork.",
      color: "bg-purple-500/10 text-purple-600",
      tryHref: "/order",
      tryLabel: "Order a Video →",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Priority Delivery",
      description:
        "Get your listing videos in 12 hours instead of the standard 24. When time is money, P2V Lens subscribers go first.",
      color: "bg-amber-500/10 text-amber-600",
      tryHref: "/order",
      tryLabel: "Order a Video →",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Listing Description Writer",
      description:
        "AI analyzes your approved listing photos, notes room details and finishes, then combines them with your property data to write a polished, MLS-ready listing description. Multiple styles available.",
      color: "bg-teal-500/10 text-teal-600",
      tryHref: "/dashboard/lens/descriptions",
      tryLabel: "Try Free →",
    },
    {
      icon: <ImageIcon className="h-6 w-6" />,
      title: "Marketing Design Studio",
      description:
        "Premade templates for Just Listed, Just Sold, Open House, Price Reduced, and more. Upload your headshot + home photo — download print-ready and social-ready formats in seconds.",
      color: "bg-orange-500/10 text-orange-600",
      tryHref: "/dashboard/lens/design-studio",
      tryLabel: "Open Design Studio →",
    },
    {
      icon: <Sofa className="h-6 w-6" />,
      title: "Virtual Staging",
      description:
        "Upload photos of empty rooms, and AI generates beautifully furnished versions in multiple styles — modern, traditional, minimalist, and more.",
      color: "bg-indigo-500/10 text-indigo-600",
      tryHref: "/dashboard/lens/staging",
      tryLabel: "Stage a Room →",
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
      description:
        'Think a photo looks good? Upload it and tap Analyze. AI spots what your eye missed — "Too dark, open the blinds and reshoot from the doorway."',
      icon: <MessageSquare className="h-8 w-8" />,
    },
    {
      step: "3",
      title: "Reshoot or Keep",
      description:
        "Fix issues on the spot. Move on when it's perfect. Leave with professional-quality photos every time.",
      icon: <CheckCircle className="h-8 w-8" />,
    },
  ];

  const faqs = [
    {
      q: "How does the AI Photo Coach work?",
      a: 'Upload any listing photo and our AI (powered by Claude Vision) analyzes it instantly. You\'ll get specific, actionable feedback — not vague tips, but exactly what to fix: "The kitchen is underexposed. Open the blinds on the east wall, turn on the overhead light, and retake from the doorway at chest height." Use it during your photo shoot to coach yourself room by room.',
    },
    {
      q: 'What counts as one "analysis"?',
      a: "Each photo you upload for AI feedback counts as one analysis. You get 200 per month — enough for about 2 full listing shoots with coaching on every single photo (25 photos × 4 attempts each = 100 analyses per listing).",
    },
    {
      q: "Do I need to be a P2V video customer to use Lens?",
      a: "No — P2V Lens works as a standalone subscription. The AI Photo Coach helps you take better photos regardless of whether you order videos from us. But if you do order videos, your subscription includes free photo enhancement, 10% off every order, and priority 12-hour delivery.",
    },
    {
      q: "What's included in Free Photo Enhancement?",
      a: "When you order a video with an active P2V Lens subscription, we professionally enhance every photo before generating your video — AI color correction, brightness, white balance, and vertical line straightening. This is automatically included at no extra charge.",
    },
    {
      q: "How does the 10% video discount work?",
      a: "When you place a video order while subscribed to P2V Lens, the 10% discount is applied automatically at checkout. No coupon code needed — the system detects your active subscription and applies the savings.",
    },
    {
      q: "How does brokerage pricing work?",
      a: "Brokerage plans are $19.95 per agent per month with a minimum of 10 agents. Each agent gets their own login and 200 analyses per month. Seats are tied to email addresses to prevent sharing. Contact us to set up your brokerage account.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes — cancel anytime from your dashboard. Your subscription stays active through the end of your current billing period. No contracts, no cancellation fees.",
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
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                LIVE
              </span>
              <span className="text-primary-foreground/80 text-sm font-medium">
                P2V Lens — 7 AI Tools for Real Estate Agents
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight tracking-tight">
              Your AI-Powered
              <br />
              <span className="text-accent">Listing Marketing Suite</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Photo coaching, virtual staging, listing descriptions, marketing graphics, photo enhancement, priority delivery, and 10% off every video order — all in one subscription.
            </p>

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
                  onClick={() => {
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-14 px-8 text-lg"
                >
                  Subscribe Now — $27.95/mo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button
                asChild
                className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg font-bold"
              >
                <Link href="/dashboard/lens/coach">Try Photo Coach Free</Link>
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
              7 AI tools <span className="text-accent">included free</span>
            </span>
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
              Everything You Need to Market Your Listings
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Seven powerful features — all included in your subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${feature.color}`}
                  >
                    {feature.icon}
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Available
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                {feature.tryHref && (
                  <Link
                    href={feature.tryHref}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent/80 transition-colors mt-3"
                  >
                    {feature.tryLabel}
                  </Link>
                )}
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
              <p className="text-sm font-semibold text-foreground">
                AI Photo Coach — Sample Feedback
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-foreground">
                  <strong>Lighting:</strong> The kitchen is underexposed. Open the blinds on the
                  east-facing window and turn on the overhead recessed lights. Avoid the fluorescent
                  above the island — it creates a yellow cast.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-600 text-xs font-bold">~</span>
                </div>
                <p className="text-sm text-foreground">
                  <strong>Angle:</strong> You&apos;re too close to the counter. Step back 3 feet and
                  shoot from the doorway at chest height to show the full room depth.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                <p className="text-sm text-foreground">
                  <strong>Composition:</strong> Good framing with the island as a leading line. Keep
                  this angle after fixing the lighting.
                </p>
              </div>
            </div>
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
              Less than a dollar a day for an AI marketing suite that pays for itself on your first
              listing.
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
                  "Marketing Design Studio",
                  "AI Listing Description Writer",
                  "Virtual Staging",
                  "Free photo enhancement on all video orders",
                  "10% off all Photo 2 Video orders",
                  "AI Suggest camera directions",
                  "Priority 12-hour video delivery",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
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
                <p className="text-center mt-3">
                  <Link
                    href="/dashboard/lens/coach"
                    className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                  >
                    Try the Photo Coach free first →
                  </Link>
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
              <Button asChild variant="outline" className="w-full py-6 text-base font-bold">
                <Link href="mailto:support@realestatephoto2video.com?subject=Brokerage%20Pricing%20Inquiry">
                  Contact for Brokerage Pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-center mt-3">
                <Link
                  href="/dashboard/lens/coach"
                  className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  Try the Photo Coach free first →
                </Link>
              </p>
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
            Give every agent AI photography coaching for less than a dollar a day. Combined with
            brokerage video pricing, your team gets a complete listing media solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg"
            >
              <Link href="mailto:support@realestatephoto2video.com?subject=Brokerage%20Pricing%20Inquiry">
                Get Brokerage Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:text-white px-8 py-6 text-lg font-bold"
            >
              <Link href="/P2V_Brokerage_Presentation.pdf" target="_blank">
                Download Brokerage PDF
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-foreground">Frequently Asked Questions</h2>
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
      {/* BOTTOM CTA */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Ready to Level Up Your Listings?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            P2V Lens + Photo 2 Video = your complete listing media solution. Better photos in,
            better videos out.
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
