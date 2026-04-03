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
  Film,
  Globe,
  FileText,
  LayoutDashboard,
  MapPin,
  Lightbulb,
  TreePine,
  DollarSign,
  Search,
  BookOpen,
} from "lucide-react";

export default function LensPage() {
  const router = useRouter();
  const [billingToggle, setBillingToggle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribingPro, setSubscribingPro] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || "" });
        const { data: usage } = await supabase.from("lens_usage").select("is_subscriber").eq("user_id", user.id).single();
        if (usage?.is_subscriber) setIsSubscriber(true);
      }
      setLoadingUser(false);
    };
    init();
  }, []);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!user) { router.push("/login?redirect=/lens"); return; }
    setSubscribing(true);
    try {
      const res = await fetch("/api/lens/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, user_id: user.id, user_email: user.email }) });
      const data = await res.json();
      if (data.success && data.url) { window.location.href = data.url; } else { alert(data.error || "Something went wrong. Please try again."); }
    } catch { alert("Something went wrong. Please try again."); } finally { setSubscribing(false); }
  };

  const handleSubscribePro = async (plan: "monthly" | "yearly") => {
    if (!user) { router.push("/login?redirect=/lens"); return; }
    setSubscribingPro(true);
    try {
      const res = await fetch("/api/lens/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan === "monthly" ? "pro_monthly" : "pro_yearly", user_id: user.id, user_email: user.email }) });
      const data = await res.json();
      if (data.success && data.url) { window.location.href = data.url; } else { alert(data.error || "Something went wrong. Please try again."); }
    } catch { alert("Something went wrong. Please try again."); } finally { setSubscribingPro(false); }
  };

  const toolLink = (path: string) => (user ? path : `/login?redirect=${path}`);

  const faqs = [
    { q: "How does the AI Photo Coach work?", a: "Upload any listing photo and our AI (powered by Claude Vision) analyzes it instantly. You get specific, actionable feedback — not vague tips, but exactly what to fix: \"The kitchen is underexposed. Open the blinds on the east wall, turn on the overhead light, and retake from the doorway at chest height.\" Use it during your photo shoot to coach yourself room by room." },
    { q: "How is P2V Lens different from other AI tools?", a: "P2V Lens is built specifically for real estate listing marketing — not repurposed from a generic AI platform. Every tool understands MLS requirements, listing photography standards, and what actually sells homes. The Photo Coach scores photos based on real estate criteria. The Description Writer knows MLS formatting rules. The Design Studio has templates for Just Listed, Open House, and Price Reduced — not generic flyer makers. This is the difference between a tool built by real estate marketers and one built by a tech company." },
    { q: "What counts as one \"analysis\"?", a: "Each photo you upload for AI feedback counts as one analysis. You get 200 per month — enough for about 2 full listing shoots with coaching on every single photo (25 photos × 4 attempts each = 100 analyses per listing)." },
    { q: "How does Quick Video pricing work?", a: "Subscribers can order short-form videos with 5–14 clips at $4.95 per clip. This rate already includes your 10% subscriber savings. Quick Videos include branding and music but do not include a free revision — paid revisions are available at standard rates. Upload 15+ photos and you'll automatically get the Standard package ($79) with your 10% subscriber discount at checkout." },
    { q: "What's the difference between Lens and Lens Pro?", a: "Lens ($27.95/mo) includes all the core marketing tools: Photo Coach, Description Writer, Design Studio, Virtual Staging, Quick Videos, and subscriber perks. Lens Pro ($49.95/mo) adds everything in Lens plus your own agent website with custom domain, AI-generated blog, property portfolios, single-listing websites with lead capture, Location Value Scores, staging and landscaping ideas, Value Boost Reports, and Lead Finder with skip tracing." },
    { q: "How does the Agent Website Builder work?", a: "Connect your own domain and get a professional agent website with your branding, listings, and contact info. The AI Blog automatically generates SEO-optimized posts about your market area. Property Websites create single-listing microsites with lead capture forms — share a branded link instead of a Zillow page." },
    { q: "What is the Location Value Score?", a: "A composite 1–100 score for any property address based on five sub-scores: school quality, walkability, safety, amenities, and market trends. Use it in listing presentations to quantify neighborhood value for buyers, or in listing appointments to show sellers how their location adds value." },
    { q: "How does Lead Finder work?", a: "Search public records to find motivated sellers — pre-foreclosures, divorces, probate, tax liens, and more. Lens Pro includes 100 searches per month and 50 skip traces to get phone numbers and emails for the leads you find." },
    { q: "Do I need to be a P2V video customer to use Lens?", a: "No — P2V Lens works as a standalone subscription. The AI Photo Coach helps you take better photos regardless of whether you order videos from us. But if you do order videos, your subscription includes free photo enhancement, 10% off every order, priority processing, and per-clip Quick Video pricing." },
    { q: "How does brokerage pricing work?", a: "Brokerage plans are $19.95 per agent per month with a minimum of 10 agents. Each agent gets their own login and 200 analyses per month. Contact us to set up your brokerage account." },
    { q: "Can I cancel anytime?", a: "Yes — cancel anytime from your Account Settings. Your subscription stays active through the end of your current billing period. No contracts, no cancellation fees." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-white">
        {/* Background video — low opacity over the white/cream base */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-[0.19]"
          >
            <source src="/p2v-lens-bg-video.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Fun gradient blobs — sit on top of video */}
        <div className="absolute inset-0 overflow-hidden z-[1]">
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-red-200/40 to-orange-200/30 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-gradient-to-br from-cyan-200/30 to-blue-200/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 right-1/4 w-[350px] h-[350px] bg-gradient-to-br from-purple-200/25 to-pink-200/20 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-[2] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl p-8 sm:p-12 text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-sm font-bold px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Purpose-Built for Real Estate
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              The AI Marketing Suite<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-orange-500 to-purple-600">That Sells Homes</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Photo coaching, marketing design, listing descriptions, virtual staging, agent websites, lead generation, and short-form videos — all in one subscription.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Camera, label: "15+ AI Tools" },
                { icon: Sparkles, label: "200 Analyses/Mo" },
                { icon: Film, label: "Videos from $24.75" },
                { icon: CheckCircle, label: "Cancel Anytime" },
              ].map((badge) => (
                <span key={badge.label} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 bg-white/80 border border-border/50 rounded-full px-3 py-1.5 shadow-sm">
                  <badge.icon className="h-3.5 w-3.5 text-accent" />
                  {badge.label}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {isSubscriber ? (
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-14 px-8 text-lg rounded-full shadow-lg shadow-accent/20">
                  <Link href="/dashboard/lens">Go to Your Dashboard <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              ) : (
                <Button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-14 px-8 text-lg rounded-full shadow-lg shadow-accent/20">
                  See Plans & Pricing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="bg-white border border-border text-foreground hover:bg-muted h-14 px-8 text-lg font-bold rounded-full shadow-sm">
                See All Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-muted/30 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" /><span className="text-sm font-semibold text-foreground">Listings with video get <span className="text-accent">403% more inquiries</span></span></div>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="flex items-center gap-2"><Camera className="h-5 w-5 text-accent" /><span className="text-sm font-semibold text-foreground">Professional photos sell <span className="text-accent">32% faster</span></span></div>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="flex items-center gap-2"><Star className="h-5 w-5 text-accent" /><span className="text-sm font-semibold text-foreground">15+ AI tools · <span className="text-accent">two plans</span></span></div>
        </div>
      </section>

      {/* QUICK VIDEO — COMPACT */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-cyan-50/50 to-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl border border-cyan-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center"><Film className="h-5 w-5 text-cyan-600" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-foreground">Quick Videos</h2>
                  <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded-full">SUBSCRIBER EXCLUSIVE</span>
                </div>
                <p className="text-sm text-muted-foreground">5–14 clips at $4.95/clip · Starting at $24.75</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center p-3 bg-muted/50 rounded-xl"><p className="text-lg font-extrabold text-cyan-700">$24.75</p><p className="text-xs text-muted-foreground">Social Teaser · 5 clips</p></div>
              <div className="text-center p-3 bg-muted/50 rounded-xl"><p className="text-lg font-extrabold text-cyan-700">$39.60</p><p className="text-xs text-muted-foreground">Listing Refresh · 8 clips</p></div>
              <div className="text-center p-3 bg-muted/50 rounded-xl"><p className="text-lg font-extrabold text-cyan-700">$59.40</p><p className="text-xs text-muted-foreground">Open House · 12 clips</p></div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-5">
              {["Custom branding", "Choice of music", "Under 12h delivery", "HD quality"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground"><CheckCircle className="h-3.5 w-3.5 text-cyan-600" />{item}</span>
              ))}
            </div>
            <div className="text-center">
              {isSubscriber ? (
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-5 text-base"><Link href="/order">Order a Quick Video <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              ) : (
                <Button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-5 text-base">
                  Subscribe to Unlock Quick Videos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">Everything You Need to Market Your Listings</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Purpose-built for real estate agents by real estate marketing professionals — not a generic AI platform.</p>
          </div>

          {/* Core Tools header */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center"><Sparkles className="h-4 w-4 text-accent" /></div>
            <h3 className="text-xl font-extrabold text-foreground">Core Marketing Tools</h3>
            <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">INCLUDED IN ALL PLANS</span>
          </div>

          {/* Photo Coach */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center"><Camera className="h-6 w-6 text-blue-600" /></div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Live</span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Never Miss a Shot with <span className="text-blue-600">AI Photo Coach</span></h3>
              <p className="text-muted-foreground leading-relaxed mb-4">Open a session per property, and the smart checklist makes sure you never forget a room. Snap a photo and get instant AI scoring with specific feedback — &ldquo;move 3 feet left, turn on the overhead light&rdquo; — then reshoot on the spot until it&apos;s perfect.</p>
              <div className="space-y-2 mb-5">
                {["Room-by-room checklist so you never miss a shot", "Instant 1-10 scoring with specific actionable feedback", "AI Edit: auto brightness, color, contrast correction", "HDR detection and horizon straightening", "Gallery management — approved photos ready for video orders"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{point}</span></div>
                ))}
              </div>
              <Link href={toolLink("/dashboard/lens/coach")} className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors">Try Photo Coach <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4"><div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Sparkles className="h-4 w-4 text-blue-600" /></div><p className="text-sm font-semibold text-foreground">AI Photo Coach — Sample Feedback</p></div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3"><div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-red-600 text-xs font-bold">!</span></div><p className="text-sm text-foreground"><strong>Lighting:</strong> The kitchen is underexposed. Open the blinds on the east-facing window and turn on the overhead recessed lights.</p></div>
                <div className="flex items-start gap-3"><div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-amber-600 text-xs font-bold">~</span></div><p className="text-sm text-foreground"><strong>Angle:</strong> Step back 3 feet and shoot from the doorway at chest height to show full room depth.</p></div>
                <div className="flex items-start gap-3"><div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckCircle className="h-3.5 w-3.5 text-green-600" /></div><p className="text-sm text-foreground"><strong>Composition:</strong> Good framing with the island as a leading line. Keep this angle after fixing the lighting.</p></div>
              </div>
            </div>
          </div>

          {/* Design Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <p className="text-sm font-semibold text-foreground mb-2">Template Types:</p>
                {["Just Listed", "Open House", "Price Reduced", "Just Sold", "Yard Signs", "Property PDF Sheets", "Video Branding Cards"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-muted/50"><PenTool className="h-3.5 w-3.5 text-orange-500" /><span className="text-sm font-medium text-foreground">{t}</span></div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center"><PenTool className="h-6 w-6 text-orange-600" /></div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Live</span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Professional Marketing in 60 Seconds with <span className="text-orange-600">Design Studio</span></h3>
              <p className="text-muted-foreground leading-relaxed mb-4">Just Listed, Open House, Price Reduced, Just Sold graphics. Yard signs for print shops. Property PDF sheets. Video branding cards. Upload your headshot and logo once — they&apos;re saved for next time.</p>
              <div className="space-y-2 mb-5">
                {["7 template types for every listing stage", "Brokerage brand colors built in", "Saved headshot & logo auto-populate", "PNG + PDF export for print and social", "Video branding card designer for your orders"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{point}</span></div>
                ))}
              </div>
              <Link href={toolLink("/dashboard/lens/design-studio")} className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors">Open Design Studio <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          {/* Description Writer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center"><MessageSquare className="h-6 w-6 text-teal-600" /></div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Live</span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">MLS Descriptions That Sell with <span className="text-teal-600">Description Writer</span></h3>
              <p className="text-muted-foreground leading-relaxed mb-4">Upload listing photos, enter property details, pick a writing style. AI analyzes every room then writes a polished, MLS-ready description.</p>
              <div className="space-y-2 mb-5">
                {["Claude Vision photo analysis — sees what's in every room", "4 styles: Professional, Luxury, Conversational, Concise", "Edit in-place, then copy to clipboard", "Works with Photo Coach gallery photos"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{point}</span></div>
                ))}
              </div>
              <Link href={toolLink("/dashboard/lens/descriptions")} className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors">Write a Description <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <p className="text-sm font-semibold text-foreground mb-3">Writing Styles:</p>
              <div className="grid grid-cols-2 gap-3">
                {[{ style: "Professional", desc: "Clean, MLS-standard tone" }, { style: "Luxury", desc: "Elevated, high-end language" }, { style: "Conversational", desc: "Warm, relatable voice" }, { style: "Concise", desc: "Tight, punchy, no fluff" }].map((s, i) => (
                  <div key={i} className="bg-muted/50 rounded-xl p-3"><p className="font-bold text-foreground text-sm">{s.style}</p><p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p></div>
                ))}
              </div>
            </div>
          </div>

          {/* Virtual Staging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-2xl border border-border p-6">
                <p className="text-sm font-semibold text-foreground mb-3">8 Design Styles:</p>
                <div className="flex flex-wrap gap-2">{["Modern", "Traditional", "Minimalist", "Coastal", "Farmhouse", "Mid-Century", "Scandinavian", "Industrial"].map((s, i) => (<span key={i} className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">{s}</span>))}</div>
                <p className="text-sm font-semibold text-foreground mt-4 mb-2">8 Room Types:</p>
                <div className="flex flex-wrap gap-2">{["Living Room", "Bedroom", "Kitchen", "Dining Room", "Office", "Bathroom", "Nursery", "Patio"].map((r, i) => (<span key={i} className="text-xs font-medium bg-muted text-foreground px-3 py-1.5 rounded-lg">{r}</span>))}</div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center"><Sofa className="h-6 w-6 text-indigo-600" /></div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Live</span>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Furnish Empty Rooms Instantly with <span className="text-indigo-600">Virtual Staging</span></h3>
              <p className="text-muted-foreground leading-relaxed mb-4">Upload a photo of an empty room, choose a style, and AI adds furniture while preserving the actual room architecture. Before/after comparison slider. 8 styles from Modern to Farmhouse.</p>
              <div className="space-y-2 mb-5">
                {["Preserves real room structure (not text-to-image)", "8 furniture styles × 8 room types", "Before/after comparison slider", "~$0.07 per staging — pennies per room"].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{point}</span></div>
                ))}
              </div>
              <Link href={toolLink("/dashboard/lens/staging")} className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-colors">Stage a Room <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          {/* Subscriber Perks */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-extrabold text-foreground">Subscriber Perks on Every Video Order</h3>
            <p className="mt-2 text-muted-foreground">Automatic benefits when you order listing videos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4"><Film className="h-6 w-6 text-cyan-600" /></div>
              <h4 className="text-lg font-bold text-foreground mb-2">Quick Videos</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">5–14 clips at $4.95/clip. Starting at $24.75.</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4"><ImageIcon className="h-6 w-6 text-emerald-600" /></div>
              <h4 className="text-lg font-bold text-foreground mb-2">Free Photo Enhancement</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">AI corrections on every photo — brightness, color, white balance. Normally $2.99/photo.</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4"><Clock className="h-6 w-6 text-amber-600" /></div>
              <h4 className="text-lg font-bold text-foreground mb-2">Priority Processing</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Your orders are processed first. Faster delivery every time.</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4"><Percent className="h-6 w-6 text-purple-600" /></div>
              <h4 className="text-lg font-bold text-foreground mb-2">10% Off Every Video</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Automatic discount at checkout. No coupon needed.</p>
            </div>
          </div>

          {/* Pro Tools */}
          <div className="mt-20">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Zap className="h-4 w-4 text-purple-600" /></div>
              <h3 className="text-xl font-extrabold text-foreground">Pro Tools</h3>
              <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">LENS PRO</span>
            </div>
            <p className="text-muted-foreground mb-10 max-w-2xl">Everything in Lens, plus a full business platform — your own website, AI-generated content, lead generation, and property intelligence tools.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: "Agent Website Builder", desc: "Your own professional website with custom domain. Branded, mobile-responsive, and built for lead capture." },
                { icon: BookOpen, title: "AI Blog", desc: "Auto-generated SEO blog posts about your market area. Fresh content keeps your site ranking and builds authority." },
                { icon: LayoutDashboard, title: "Property Portfolio", desc: "Private dashboard hub linking all content by address — photos, videos, descriptions, staging, and marketing materials in one place." },
                { icon: FileText, title: "Property Websites", desc: "Single-listing microsites with lead capture. Share a branded link instead of a Zillow page. Every lead goes directly to you." },
                { icon: MapPin, title: "Location Value Score", desc: "1–100 composite score with 5 sub-scores: schools, walkability, safety, amenities, and market trends. Use in listing presentations." },
                { icon: Lightbulb, title: "Staging Ideas", desc: "Room-by-room staging suggestions powered by AI. Show sellers exactly how to prepare each room for photos and showings." },
                { icon: TreePine, title: "Landscaping Ideas", desc: "Exterior improvement suggestions to boost curb appeal. AI analyzes the property and recommends high-impact, low-cost changes." },
                { icon: DollarSign, title: "Value Boost Report", desc: "Private seller report with improvement recommendations and estimated ROI. Includes product links so sellers can take action immediately." },
                { icon: Search, title: "Lead Finder", desc: "Search public records for motivated sellers — pre-foreclosures, divorces, probate, tax liens. 100 searches/mo + 50 skip traces included." },
              ].map((tool, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center"><tool.icon className="h-6 w-6 text-purple-600" /></div>
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">{tool.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Subscribe once, use everything — on every listing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Subscribe", description: "Pick Lens or Lens Pro. Instant access to all tools — no setup, no onboarding.", icon: <Sparkles className="h-8 w-8" /> },
              { step: "2", title: "Use the Tools", description: "Photo Coach during shoots, Design Studio for marketing, Description Writer for MLS, Virtual Staging for empty rooms. Pro adds websites, leads, and more.", icon: <Camera className="h-8 w-8" /> },
              { step: "3", title: "Order Videos", description: "Quick Videos from $24.75, or full listings with priority processing, free photo editing, and 10% off — automatically.", icon: <Zap className="h-8 w-8" /> },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-5">{s.icon}</div>
                <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-accent text-accent-foreground text-sm font-bold mb-3">{s.step}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Two plans — pick the one that matches where you are in your business.</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-10">
            <button onClick={() => setBillingToggle("monthly")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${billingToggle === "monthly" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>Monthly</button>
            <button onClick={() => setBillingToggle("yearly")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${billingToggle === "yearly" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>Yearly<span className="ml-1.5 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-bold">Save 2 months</span></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Lens */}
            <div className="bg-card rounded-2xl border-2 border-accent/40 p-8 relative">
              <span className="absolute -top-3 left-6 bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
              <h3 className="text-lg font-bold text-foreground mb-1">P2V Lens</h3>
              <p className="text-sm text-muted-foreground mb-5">Core marketing tools for every agent</p>
              <div className="mb-6">
                {billingToggle === "monthly" ? (
                  <div className="flex items-baseline gap-1"><span className="text-4xl font-extrabold text-foreground">$27.95</span><span className="text-muted-foreground text-sm">/month</span></div>
                ) : (
                  <div><div className="flex items-baseline gap-1"><span className="text-4xl font-extrabold text-foreground">$279</span><span className="text-muted-foreground text-sm">/year</span></div><p className="text-sm text-green-600 font-medium mt-1">$23.25/month — save $55.40</p></div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {["200 photo analyses / month", "AI Photo Coach with instant feedback", "Marketing Design Studio (7 templates)", "AI Listing Description Writer", "Virtual Staging (8 styles)", "Quick Videos ($4.95/clip, 5–14 clips)", "Free photo enhancement on video orders", "10% off all video orders", "Priority processing — first in queue"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
              {isSubscriber ? (
                <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-6 text-base"><Link href="/dashboard/lens"><CheckCircle className="mr-2 h-4 w-4" />You&apos;re Subscribed — Go to Dashboard</Link></Button>
              ) : (
                <Button onClick={() => handleSubscribe(billingToggle)} disabled={subscribing || loadingUser} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-base">
                  {subscribing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting to checkout...</>) : !user && !loadingUser ? (<><LogIn className="mr-2 h-4 w-4" />Log In to Subscribe</>) : (<>Subscribe Now<ArrowRight className="ml-2 h-4 w-4" /></>)}
                </Button>
              )}
              {!isSubscriber && <p className="text-center mt-3 text-xs text-muted-foreground">Try free — 3 photo analyses, 1 description, 1 staging, 3 design exports</p>}
            </div>

            {/* Lens Pro */}
            <div className="bg-card rounded-2xl border-2 border-purple-400/40 p-8 relative">
              <span className="absolute -top-3 left-6 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">FULL PLATFORM</span>
              <h3 className="text-lg font-bold text-foreground mb-1">P2V Lens Pro</h3>
              <p className="text-sm text-muted-foreground mb-5">Marketing + websites + lead gen</p>
              <div className="mb-6">
                {billingToggle === "monthly" ? (
                  <div className="flex items-baseline gap-1"><span className="text-4xl font-extrabold text-foreground">$49.95</span><span className="text-muted-foreground text-sm">/month</span></div>
                ) : (
                  <div><div className="flex items-baseline gap-1"><span className="text-4xl font-extrabold text-foreground">$499</span><span className="text-muted-foreground text-sm">/year</span></div><p className="text-sm text-green-600 font-medium mt-1">$41.58/month — save $100.40</p></div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in P2V Lens", "Agent Website Builder (custom domain)", "AI Blog (auto-generated SEO posts)", "Property Portfolio dashboard", "Property Websites with lead capture", "Location Value Score (1–100)", "Staging Ideas (room-by-room)", "Landscaping Ideas (curb appeal)", "Value Boost Report for sellers", "Lead Finder (100 searches/mo)", "Skip Tracing (50 records/mo)"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground"><CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
              <Button onClick={() => handleSubscribePro(billingToggle)} disabled={subscribingPro || loadingUser} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-6 text-base">
                {subscribingPro ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting to checkout...</>) : !user && !loadingUser ? (<><LogIn className="mr-2 h-4 w-4" />Log In to Subscribe</>) : (<>Subscribe to Pro<ArrowRight className="ml-2 h-4 w-4" /></>)}
              </Button>
            </div>
          </div>

          {/* Brokerage — compact */}
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="bg-muted/50 rounded-2xl border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <Building2 className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-lg font-bold text-foreground">Brokerage Plans</h4>
                <p className="text-sm text-muted-foreground mt-1">$19.95/agent/month · Minimum 10 agents · Each agent gets their own login, 200 analyses/month, and all Lens tools.</p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button asChild variant="outline" className="font-bold"><Link href="mailto:support@realestatephoto2video.com?subject=Brokerage%20Pricing%20Inquiry">Contact Us <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Link href="/P2V_Brokerage_Presentation.pdf" target="_blank" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors text-center">Download PDF</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><h2 className="text-3xl font-extrabold text-foreground">Frequently Asked Questions</h2></div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <span className="font-semibold text-foreground text-sm sm:text-base">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-6 pb-4"><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">Start Your Free Trial Today</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">3 free photo analyses, 1 listing description, 1 virtual staging, 3 design exports — no credit card required to try.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSubscriber ? (
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg"><Link href="/dashboard/lens">Go to Your Dashboard <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
            ) : (
              <Button onClick={() => handleSubscribe(billingToggle)} disabled={subscribing} className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg">
                {subscribing ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Redirecting...</>) : (<>Subscribe to P2V Lens<ArrowRight className="ml-2 h-5 w-5" /></>)}
              </Button>
            )}
            <Button asChild variant="outline" className="px-8 py-6 text-lg font-bold"><Link href="/order">Create a Listing Video</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
