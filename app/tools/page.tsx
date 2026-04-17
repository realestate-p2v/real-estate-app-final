import Link from "next/link";
import { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Film,
  PenTool,
  Sparkles,
  ArrowRight,
  Video,
  Sofa,
  Crosshair,
  ImageIcon,
  MessageSquare,
  Globe,
  FileText,
  Camera,
  MapPin,
  TrendingUp,
  Star,
  Share2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — 15 AI Marketing Tools for Real Estate | P2V",
  description: "See how Real Estate Photo 2 Video turns your listing photos into videos, flyers, staged rooms, descriptions, social content, and a full agent website. 15 AI tools built for real estate agents.",
  openGraph: {
    title: "How It Works — Real Estate Photo 2 Video",
    description: "One set of listing photos. 15 AI tools. Unlimited marketing content.",
    type: "website",
  },
};

export default function ToolsPage() {
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
              15 AI Tools Built for Real Estate
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
              How It Works
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              P2V helps agents develop, repurpose, and deploy highly visual marketing content — all from listing photos they already have. One set of photos feeds an entire marketing system.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ JOURNEY OVERVIEW ═══ */}
      <section className="border-y border-white/[0.04] bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Film, label: "The Video", anchor: "the-video", desc: "Your photos become a cinematic walkthrough", color: "text-cyan-400", bg: "bg-cyan-400/10", ring: "ring-cyan-400/20" },
              { icon: PenTool, label: "Create", anchor: "create", desc: "Turn photos into unlimited marketing content", color: "text-indigo-400", bg: "bg-indigo-400/10", ring: "ring-indigo-400/20" },
              { icon: Share2, label: "Publish & Deploy", anchor: "publish-deploy", desc: "Put your content to work everywhere", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
              { icon: Star, label: "Client Tools", anchor: "client-tools", desc: "Impress sellers and win listings", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20" },
            ].map((phase) => (
              <a
                key={phase.label}
                href={`#${phase.anchor}`}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-center transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]"
              >
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${phase.bg} ring-1 ${phase.ring} mb-3 transition-transform group-hover:scale-110`}>
                  <phase.icon className={`h-5 w-5 ${phase.color}`} />
                </div>
                <p className="text-sm font-bold text-white/90 mb-1">{phase.label}</p>
                <p className="text-xs text-white/40">{phase.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE VIDEO ═══ */}
      <section id="the-video" className="py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-3">
              <Film className="w-3.5 h-3.5" /> Phase 1
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">The Video</h2>
            <p className="text-lg text-white/40 max-w-2xl">This is where it starts. Your listing photos become a cinematic walkthrough video — and every clip you get back is yours to remix forever.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Order a Video */}
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20 flex items-center justify-center">
                  <Video className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Order a Video</h3>
                  <p className="text-sm text-white/40">From $79 · One-time</p>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-4">
                Upload your listing photos and we produce a cinematic walkthrough video. You own every clip. A real human editor hand-finishes every video — AI speeds us up, but a person makes it perfect.
              </p>
              <p className="text-sm text-white/50 leading-relaxed mb-4">
                <span className="text-white/70 font-semibold">What you walk away with:</span> A polished listing video, individual clips for each room, and a property profile that auto-fills every other tool on the platform.
              </p>
              <p className="text-sm text-white/50 leading-relaxed">
                <span className="text-white/70 font-semibold">Bonus:</span> Your first video order unlocks a 10-day free trial of every AI marketing tool. No credit card required.
              </p>
            </div>

            {/* Video Remix */}
            <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.04] p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-400/10 ring-1 ring-purple-400/20 flex items-center justify-center">
                  <Film className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Video Remix</h3>
                  <p className="text-sm text-white/40">Free forever with any video purchase</p>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-4">
                Buy your clips once. Remix them unlimited times. Recut into social teasers, add music, swap branding, create landscape, portrait, and square versions. Every time you come back, the platform shows you what else you can do with your photos.
              </p>
              <p className="text-sm text-white/50 leading-relaxed">
                <span className="text-white/70 font-semibold">What you walk away with:</span> Unlimited social-ready video content from the clips you already own. Three aspect ratios, music library, custom branding, no watermarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CREATE ═══ */}
      <section id="create" className="py-20 sm:py-24 border-t border-white/[0.04] scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-3">
              <PenTool className="w-3.5 h-3.5" /> Phase 2
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Create</h2>
            <p className="text-lg text-white/40 max-w-2xl">The same photos that made your video now become flyers, staged rooms, branded graphics, enhanced images, and annotated aerials. This is where one shoot turns into unlimited content.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: PenTool, title: "Design Studio", desc: "Just Listed, Open House, Price Reduced graphics. 11 templates with your branding auto-filled. Swap photos, edit text, export in seconds.", deliverable: "PNG + PDF marketing graphics ready for social, print, and MLS.", color: "text-indigo-400", bg: "bg-indigo-400/10", ring: "ring-indigo-400/20" },
              { icon: ImageIcon, title: "Listing Flyer", desc: "Print-ready property flyers generated from your listing photos and details. Professional layouts with your branding.", deliverable: "Downloadable PDF flyers for open houses, mailers, and broker tours.", color: "text-orange-400", bg: "bg-orange-400/10", ring: "ring-orange-400/20" },
              { icon: Sofa, title: "Virtual Staging", desc: "Furnish empty rooms with AI. Choose from 8 design styles across 8 room types. Before/after comparison slider shows the transformation.", deliverable: "Staged room photos at pennies per room. Before/after pairs for listings.", color: "text-violet-400", bg: "bg-violet-400/10", ring: "ring-violet-400/20" },
              { icon: Crosshair, title: "Drone Mark", desc: "Annotate aerial photos with lot lines, measurement labels, and branded pins. 8 drawing tools for property boundaries, setbacks, and points of interest.", deliverable: "Annotated aerial JPEG exports for listings, presentations, and print.", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20" },
              { icon: ImageIcon, title: "Photo Optimizer", desc: "Batch compress your listing photos for MLS, Zillow, and social. Hard cap at 1920px and under 290KB. One click for the whole set.", deliverable: "Optimized photos that meet every platform's upload requirements.", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
              { icon: ImageIcon, title: "Photo Enhancement", desc: "AI-powered brightness, color, and white balance correction. Fix dark interiors, warm up cold lighting, and balance tricky exposures.", deliverable: "Enhanced photos with professional-grade color correction.", color: "text-teal-400", bg: "bg-teal-400/10", ring: "ring-teal-400/20" },
            ].map((tool, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} mb-4`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <h4 className="text-lg font-bold text-white/90 mb-2">{tool.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed mb-3">{tool.desc}</p>
                <p className="text-xs text-white/30"><span className="text-white/50 font-semibold">You get:</span> {tool.deliverable}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PUBLISH & DEPLOY ═══ */}
      <section id="publish-deploy" className="py-20 sm:py-24 border-t border-white/[0.04] bg-white/[0.02] scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-3">
              <Share2 className="w-3.5 h-3.5" /> Phase 3
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Publish &amp; Deploy</h2>
            <p className="text-lg text-white/40 max-w-2xl">Content sitting on your hard drive doesn&apos;t sell houses. These tools get your marketing in front of buyers — on social, on MLS, and on your own branded website.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: "Marketing Planner", desc: "AI plans what you should post, when, and where. 30-day content sprints with weighted property rotation, 10 post types, and a weekly calendar. Select a property, pick media, get a caption, and share — all in one flow.", deliverable: "A 30-day posting schedule with captions, media selections, and deep-links to every platform.", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
              { icon: MessageSquare, title: "Description Writer", desc: "AI analyzes your listing photos and writes MLS-ready copy. 4 writing styles (Professional, Luxury, Conversational, Concise). Property details auto-fill from your profile. Descriptions get published on flyers, your website, social, and MLS.", deliverable: "Polished listing descriptions ready to paste into MLS, print on flyers, or publish on your website.", color: "text-sky-400", bg: "bg-sky-400/10", ring: "ring-sky-400/20" },
              { icon: Globe, title: "My Agent Website", desc: "A full professional agent website hosted on p2v.homes or your custom domain. Every description you write, every room you stage, every flyer you design — it all feeds your website automatically. Property pages with lead capture, AI blog, SEO, and contact forms.", deliverable: "A live agent website with your listings, branding, and content — we handle hosting, SSL, and updates. Lens Pro ($49/mo) or buy outright ($399).", color: "text-sky-400", bg: "bg-sky-400/10", ring: "ring-sky-400/20" },
            ].map((tool, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} mb-4`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <h4 className="text-lg font-bold text-white/90 mb-2">{tool.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed mb-3">{tool.desc}</p>
                <p className="text-xs text-white/30"><span className="text-white/50 font-semibold">You get:</span> {tool.deliverable}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CLIENT TOOLS ═══ */}
      <section id="client-tools" className="py-20 sm:py-24 border-t border-white/[0.04] scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
              <Star className="w-3.5 h-3.5" /> Phase 4
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Client Tools</h2>
            <p className="text-lg text-white/40 max-w-2xl">These aren&apos;t marketing tools — they&apos;re credibility tools. Use them in listing presentations, send them to sellers, hand them to buyers. They make you look like the most prepared agent in the room.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: FileText, title: "Reports", desc: "Branded buyer and seller guides with AI-written content. Your branding, your colors, your headshot on the cover. Professional reports that position you as the expert.", deliverable: "Downloadable PDF reports branded to your business — ready to email, print, or present.", color: "text-rose-400", bg: "bg-rose-400/10", ring: "ring-rose-400/20" },
              { icon: Camera, title: "Photo Coach", desc: "AI scores every photo 1-10 with specific, actionable feedback — \"move left 3 feet, open the blinds on the east wall.\" Use it during your shoot to coach yourself room by room. Show sellers you take their listing seriously.", deliverable: "Better listing photos for every property, plus a professional process that impresses sellers during the listing appointment.", color: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/20" },
              { icon: MapPin, title: "Location Value Score", desc: "A 1-100 composite neighborhood score covering amenities, trends, growth, and infrastructure. Branded PDF that you hand to buyers or include in listing presentations.", deliverable: "A branded neighborhood insights report that demonstrates local expertise.", color: "text-teal-400", bg: "bg-teal-400/10", ring: "ring-teal-400/20" },
              { icon: TrendingUp, title: "Value Boost Report", desc: "Room-by-room DIY improvement suggestions with cost, time, and ROI estimates. Help sellers understand which upgrades are worth doing before listing.", deliverable: "A branded improvement report with actionable recommendations and ROI projections.", color: "text-rose-400", bg: "bg-rose-400/10", ring: "ring-rose-400/20" },
            ].map((tool, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} mb-4`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <h4 className="text-lg font-bold text-white/90 mb-2">{tool.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed mb-3">{tool.desc}</p>
                <p className="text-xs text-white/30"><span className="text-white/50 font-semibold">You get:</span> {tool.deliverable}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="py-16 sm:py-20 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Start With a Video. Build a Content Machine.</h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8">One listing video unlocks 10 days of every marketing tool. No credit card for the trial. No commitment. Your photos have more to give.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/20">
              <Link href="/order">Order Your First Video — $79 <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold px-8 py-6 text-lg rounded-xl">
              <Link href="/lens#pricing">See Pricing Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
