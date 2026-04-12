"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
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
  LogIn,
  PenTool,
  Film,
  Globe,
  FileText,
  MapPin,
  DollarSign,
  BookOpen,
  Crosshair,
  Download,
  Share2,
  Monitor,
  Play,
  Shield,
} from "lucide-react";

export default function LensPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subscribingTools, setSubscribingTools] = useState(false);
  const [subscribingPro, setSubscribingPro] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        const { data: usage } = await supabase.from("lens_usage").select("is_subscriber").eq("user_id", session.user.id).single();
        if (usage?.is_subscriber) setIsSubscriber(true);
      }
      setLoadingUser(false);
    };
    init();
  }, []);

  const handleSubscribe = async (plan: string) => {
    if (!user) { router.push("/login?redirect=/lens"); return; }
    const setter = plan.startsWith("pro") ? setSubscribingPro : setSubscribingTools;
    setter(true);
    try {
      const res = await fetch("/api/lens/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, user_id: user.id, user_email: user.email }) });
      const data = await res.json();
      if (data.success && data.url) { window.location.href = data.url; } else { alert(data.error || "Something went wrong."); }
    } catch { alert("Something went wrong."); } finally { setter(false); }
  };

  const faqs = [
    { q: "What happens when I order a video?", a: "Upload your listing photos, add your branding, and we produce a cinematic walkthrough video. You own every clip. After purchase, you get Video Remix access forever — recut your clips into social content, add music, change branding, unlimited times." },
    { q: "What's the 10-day trial?", a: "After your first video purchase, every AI tool unlocks for 10 days — free, no credit card needed for the trial. Design marketing graphics, write descriptions, stage empty rooms, optimize photos for MLS. Everything you create is yours to keep. After 10 days, subscribe to keep access." },
    { q: "What's the difference between Lens Tools and Lens Pro?", a: "Lens Tools ($27/mo) gives you all the AI marketing tools — Photo Coach, Design Studio, Description Writer, Virtual Staging, Drone Mark, Photo Optimizer, Reports, and more. Export and download everything, push to CRMs. Lens Pro ($49/mo) adds your own professional agent website hosted on our platform — we handle domain, hosting, SSL, updates, everything." },
    { q: "Can I buy the website outright?", a: "Yes — $399 one-time gets you a full website export with all backend editing features, plus 3 months of Lens Pro included. After that you handle your own hosting and domain, but you can still use the one-click export tool to push content updates from P2V to your site." },
    { q: "How does the AI Photo Coach work?", a: "Open a session for a property, and AI scores every photo on a 1-10 scale with specific feedback — 'move left 3 feet, open the blinds on the east wall.' Use it during your shoot to coach yourself room by room. Approved photos flow directly into your video orders and marketing tools." },
    { q: "Do I keep my content if I cancel?", a: "Your videos, clips, and property profile stay accessible. Marketing content you've exported or downloaded is yours forever. Tools lock until you resubscribe, but nothing gets deleted." },
    { q: "How does brokerage pricing work?", a: "Custom pricing for teams of 10+ agents. Each agent gets their own login and full tool access. Contact us for a quote." },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.07] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.05] rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-cyan-400 text-sm font-bold tracking-wider uppercase mb-6">
              <Sparkles className="w-4 h-4" />
              Listing Photos Make Unlimited Content
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
              Listing Photos Become<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Your Entire Marketing Engine</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Order a listing video. Get 10 days of every AI marketing tool — free.
              Build descriptions, flyers, staged rooms, drone annotations, and reports.
              Then keep it all on your own branded agent website.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {isSubscriber ? (
                <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold h-14 px-8 text-lg rounded-xl">
                  <Link href="/dashboard/lens">Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              ) : (
                <>
                  <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold h-14 px-8 text-lg rounded-xl shadow-lg shadow-cyan-500/20">
                    <Link href="/order">Order a Video — from $79 <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold h-14 px-8 text-lg rounded-xl">
                    See Plans
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — Warm & Inviting ═══ */}
      <section className="py-20 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Here&apos;s How It Works</h2>
            <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">From photos to a full marketing suite in four simple steps — and you get to try everything before you commit.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: "1", icon: Camera, title: "Upload Your Photos", desc: "Send us your listing photos and we'll turn them into a cinematic walkthrough video.", color: "text-cyan-400", bg: "bg-cyan-400/10", ring: "ring-cyan-400/20", border: "border-cyan-400/15" },
              { step: "2", icon: Film, title: "Get Your Video & Clips", desc: "You own every clip. Remix them into social content forever — that's included, always free.", color: "text-purple-400", bg: "bg-purple-400/10", ring: "ring-purple-400/20", border: "border-purple-400/15" },
              { step: "3", icon: Zap, title: "Explore Every Tool Free", desc: "All AI tools unlock for 10 days. Write descriptions, stage rooms, design flyers — go wild.", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20", border: "border-amber-400/15" },
              { step: "4", icon: Globe, title: "Keep Growing", desc: "Love it? Stay on Lens Tools for $27/mo — or add your own agent website for $49/mo.", color: "text-green-400", bg: "bg-green-400/10", ring: "ring-green-400/20", border: "border-green-400/15" },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl border ${s.border} bg-white/[0.02] p-6 text-center`}>
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${s.bg} ring-1 ${s.ring} mb-4`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${s.bg} ${s.color} text-xs font-bold mb-3`}>{s.step}</div>
                <h3 className="text-base font-bold text-white/90 mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="border-y border-white/[0.04] bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          <div className="flex items-center gap-2"><Play className="h-4 w-4 text-cyan-400" /><span className="text-sm font-semibold text-white/60">Listings with video get <span className="text-cyan-400">403% more inquiries</span></span></div>
          <div className="hidden sm:block h-5 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-cyan-400" /><span className="text-sm font-semibold text-white/60">Professional photos sell <span className="text-cyan-400">32% faster</span></span></div>
          <div className="hidden sm:block h-5 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2"><Star className="h-4 w-4 text-cyan-400" /><span className="text-sm font-semibold text-white/60"><span className="text-cyan-400">10+ AI tools</span> built for real estate</span></div>
        </div>
      </section>

      {/* ═══ QUICK VIDEOS CTA ═══ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/[0.06] to-indigo-400/[0.04] p-8 sm:p-10 text-center">
            <div className="inline-flex items-center gap-2 bg-cyan-400/10 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-400/20 mb-5">
              <Film className="h-3.5 w-3.5" />
              SUBSCRIBER EXCLUSIVE
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Quick Videos — $4.95 per clip</h3>
            <p className="text-white/50 max-w-xl mx-auto mb-6">Need a fast social teaser or an open house highlight? Lens subscribers get short-form videos starting at just $4.95 per clip. Pick 5–14 clips, add branding and music, delivered in under 12 hours.</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
              {[
                { clips: "5 clips", price: "$24.75", label: "Social Teaser" },
                { clips: "8 clips", price: "$39.60", label: "Listing Refresh" },
                { clips: "12 clips", price: "$59.40", label: "Open House" },
              ].map(p => (
                <div key={p.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3 text-center">
                  <p className="text-lg font-extrabold text-cyan-400">{p.price}</p>
                  <p className="text-xs text-white/40">{p.label} · {p.clips}</p>
                </div>
              ))}
            </div>
            <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold px-8 py-5 text-base rounded-xl shadow-lg shadow-cyan-500/20">
              <Link href="/order">Order Quick Videos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ VIDEO REMIX — The Free Hook ═══ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-purple-400/20 bg-purple-400/[0.04] p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-purple-400/10 ring-1 ring-purple-400/20 flex items-center justify-center"><Film className="h-6 w-6 text-purple-400" /></div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Video Remix — Free Forever</h3>
                <p className="text-sm text-white/40">Included with every video purchase</p>
              </div>
            </div>
            <p className="text-white/50 leading-relaxed mb-6">Buy your clips once. Remix them forever. Recut into social teasers, add music, swap branding, create landscape, portrait, and square versions — unlimited. Every time you come back to Remix, you see what else the platform can do.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
              {["Unlimited remixes", "3 aspect ratios", "Music library", "Custom branding", "No watermarks"].map(p => (
                <span key={p} className="flex items-center gap-1.5 text-sm text-white/60"><CheckCircle className="h-3.5 w-3.5 text-purple-400" />{p}</span>
              ))}
            </div>
            <Link href="/order" className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">Order a Video to Unlock <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* ═══ AI TOOLS SHOWCASE ═══ */}
      <section id="features" className="py-20 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Every Tool Your Listing Needs</h2>
            <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">Each one is purpose-built for real estate — not a generic AI wrapper. Try them all free for 10 days after your first video order.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Camera, title: "AI Photo Coach", desc: "Instant 1-10 scoring with room-by-room feedback during your shoot. Approved photos flow into every other tool.", color: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/20" },
              { icon: PenTool, title: "Design Studio", desc: "Just Listed, Open House, Price Reduced graphics. 11 templates. Your branding auto-fills. PNG + PDF export.", color: "text-indigo-400", bg: "bg-indigo-400/10", ring: "ring-indigo-400/20" },
              { icon: MessageSquare, title: "Description Writer", desc: "AI analyzes your photos and writes MLS-ready listing copy. 4 writing styles. Property details auto-fill.", color: "text-sky-400", bg: "bg-sky-400/10", ring: "ring-sky-400/20" },
              { icon: Sofa, title: "Virtual Staging", desc: "Furnish empty rooms with AI. 8 design styles x 8 room types. Before/after slider. Pennies per room.", color: "text-violet-400", bg: "bg-violet-400/10", ring: "ring-violet-400/20" },
              { icon: Crosshair, title: "Drone Mark", desc: "Annotate aerial photos with lot lines, measurement labels, branded pins. 8 drawing tools. JPEG export.", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20" },
              { icon: ImageIcon, title: "Photo Optimizer", desc: "Batch compress for MLS, Zillow, and social. Hard cap: 1920px, under 290KB. One-click for the whole set.", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
              { icon: FileText, title: "Reports", desc: "Branded buyer & seller guides with AI-written content. Color swatches. Agent branding. PDF export.", color: "text-rose-400", bg: "bg-rose-400/10", ring: "ring-rose-400/20" },
              { icon: DollarSign, title: "Value Boost Report", desc: "Room-by-room DIY improvements with cost, time, and ROI estimates. Amazon affiliate links included.", color: "text-orange-400", bg: "bg-orange-400/10", ring: "ring-orange-400/20" },
              { icon: MapPin, title: "Location Value Score", desc: "1-100 composite neighborhood score. Amenities, trends, growth, infrastructure. Branded PDF export.", color: "text-teal-400", bg: "bg-teal-400/10", ring: "ring-teal-400/20", badge: "PRO" },
            ].map((tool, i) => (
              <div key={i} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]">
                {tool.badge && <span className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">{tool.badge}</span>}
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} mb-4 transition-transform group-hover:scale-110`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <h4 className="text-lg font-bold text-white/90 mb-2 group-hover:text-cyan-300 transition-colors">{tool.title}</h4>
                <p className="text-sm text-white/40 leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU DO WITH IT — Export / CRM / Website ═══ */}
      <section className="py-20 sm:py-24 border-t border-white/[0.04] bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Your Content. Your Way.</h2>
            <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">Everything you create in P2V is yours. Use it however you want.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-400/20 mb-5"><Download className="h-6 w-6 text-cyan-400" /></div>
              <h4 className="text-lg font-bold text-white/90 mb-2">Download & Export</h4>
              <p className="text-sm text-white/40 leading-relaxed">PNG, PDF, JPEG, MP4. Download everything to your computer. Use it on MLS, Zillow, social, print — anywhere.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-400/10 ring-1 ring-green-400/20 mb-5"><Share2 className="h-6 w-6 text-green-400" /></div>
              <h4 className="text-lg font-bold text-white/90 mb-2">Push to Your CRM</h4>
              <p className="text-sm text-white/40 leading-relaxed">Direct integrations with Salesforce, Follow Up Boss, HubSpot, Wise Agent, KVCore. One-click sync.</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-400/20 mb-5"><Globe className="h-6 w-6 text-cyan-400" /></div>
              <h4 className="text-lg font-bold text-white/90 mb-2">Your Agent Website</h4>
              <p className="text-sm text-white/40 leading-relaxed">Everything you build lives on your own branded site. Custom domain. We handle hosting, SSL, and updates. <span className="text-cyan-400 font-semibold">$49/mo</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AGENT WEBSITE PREVIEW ═══ */}
      <section className="py-20 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-b from-cyan-400/[0.06] to-transparent p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20 flex items-center justify-center"><Monitor className="h-6 w-6 text-cyan-400" /></div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Your A+ Agent Website</h3>
                <p className="text-sm text-white/40">The reason every tool exists</p>
              </div>
            </div>
            <p className="text-white/50 leading-relaxed mb-8 max-w-2xl">Every description you write, every room you stage, every flyer you design, every report you generate — it all feeds your professional agent website. One platform builds your entire online presence.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[
                "Professional homepage with your branding",
                "Property listing pages with lead capture",
                "AI-generated SEO blog posts",
                "Virtual tours & staged room galleries",
                "Neighborhood scores & market data",
                "Contact forms that go directly to you",
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-2.5"><CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" /><span className="text-sm text-white/60">{f}</span></div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-6 py-3 rounded-xl">
                Get Your Website — $49/mo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <span className="text-sm text-white/30">or <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="text-cyan-400/70 hover:text-cyan-400 font-semibold transition-colors">buy outright for $399</button> — includes 3 months of Lens Pro</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 sm:py-24 border-t border-white/[0.04] bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Simple Pricing. No Surprises.</h2>
            <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">Start with a video. Try everything free for 10 days. Then pick the plan that fits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Start Here */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Start here</p>
              <h3 className="text-xl font-bold text-white mb-1">Order a Video</h3>
              <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-extrabold text-white">$79</span><span className="text-white/40 text-sm">one-time</span></div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Cinematic listing walkthrough",
                  "You own every clip",
                  "Video Remix — free forever",
                  "10-day trial of all AI tools",
                  "Property profile with your media",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/60"><CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
              <Button asChild className="w-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-bold py-5 rounded-xl">
                <Link href="/order">Order a Video <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            {/* Lens Tools */}
            <div className="rounded-2xl border-2 border-cyan-400/30 bg-cyan-400/[0.04] p-7 relative">
              <span className="absolute -top-3 left-6 bg-cyan-400/20 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-400/30">MOST POPULAR</span>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400/50 mb-3">All tools</p>
              <h3 className="text-xl font-bold text-white mb-1">Lens Tools</h3>
              <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-extrabold text-white">$27</span><span className="text-white/40 text-sm">/month</span></div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Every AI marketing tool",
                  "Photo Coach, Design Studio, Staging",
                  "Description Writer, Drone Mark",
                  "Photo Optimizer, Reports",
                  "Export & download everything",
                  "CRM integrations (Salesforce, etc.)",
                  "10% off every video order",
                  "Priority processing",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70"><CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
              {isSubscriber ? (
                <Button asChild className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-5 rounded-xl">
                  <Link href="/dashboard/lens"><CheckCircle className="mr-2 h-4 w-4" />Go to Dashboard</Link>
                </Button>
              ) : (
                <Button onClick={() => handleSubscribe("monthly")} disabled={subscribingTools || loadingUser} className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-5 rounded-xl">
                  {subscribingTools ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting...</> : !user && !loadingUser ? <><LogIn className="mr-2 h-4 w-4" />Log In to Subscribe</> : <>Subscribe — $27/mo<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              )}
            </div>

            {/* Lens Pro */}
            <div className="rounded-2xl border-2 border-purple-400/30 bg-purple-400/[0.04] p-7 relative">
              <span className="absolute -top-3 left-6 bg-purple-400/20 text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-400/30">FULL PLATFORM</span>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400/50 mb-3">Tools + website</p>
              <h3 className="text-xl font-bold text-white mb-1">Lens Pro</h3>
              <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-extrabold text-white">$49</span><span className="text-white/40 text-sm">/month</span></div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Everything in Lens Tools",
                  "A+ agent website on your domain",
                  "Property pages with lead capture",
                  "AI blog — auto SEO content",
                  "Location Value Score",
                  "We handle hosting, SSL, updates",
                  "Custom domain setup",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70"><CheckCircle className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
              <Button onClick={() => handleSubscribe("pro_monthly")} disabled={subscribingPro || loadingUser} className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-5 rounded-xl">
                {subscribingPro ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting...</> : !user && !loadingUser ? <><LogIn className="mr-2 h-4 w-4" />Log In to Subscribe</> : <>Subscribe — $49/mo<ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          </div>

          {/* Buy-Out + Brokerage */}
          <div className="grid sm:grid-cols-2 gap-6 mt-8 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 ring-1 ring-amber-400/20 flex items-center justify-center flex-shrink-0"><Shield className="h-5 w-5 text-amber-400" /></div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">Website Buy-Out — $399</h4>
                <p className="text-sm text-white/40 leading-relaxed">Full website export to your own domain. Includes 3 months of Lens Pro. One-click content updates from P2V. You handle hosting after that.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08] flex items-center justify-center flex-shrink-0"><Building2 className="h-5 w-5 text-white/40" /></div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">Brokerage Plans</h4>
                <p className="text-sm text-white/40 leading-relaxed">Custom pricing for teams of 10+ agents. Each agent gets their own login and full access. <Link href="mailto:support@realestatephoto2video.com?subject=Brokerage%20Pricing" className="text-cyan-400/70 hover:text-cyan-400 font-semibold transition-colors">Contact us →</Link></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><h2 className="text-3xl font-extrabold">Frequently Asked Questions</h2></div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors">
                  <span className="font-semibold text-white/80 text-sm sm:text-base">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-6 pb-4"><p className="text-sm text-white/40 leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-16 sm:py-20 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Start With a Video. Build Your Empire.</h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8">One listing video unlocks 10 days of every marketing tool. No credit card for the trial. No commitment.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSubscriber ? (
              <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold px-8 py-6 text-lg rounded-xl">
                <Link href="/dashboard/lens">Go to Your Dashboard <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            ) : (
              <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/20">
                <Link href="/order">Order Your First Video — $79 <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
