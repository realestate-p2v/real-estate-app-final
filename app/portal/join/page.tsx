import Link from "next/link";
import {
  Film,
  Sparkles,
  Palette,
  TrendingUp,
  Camera,
  FileText,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle2,
  PenTool,
  CalendarDays,
  MessageSquare,
  Upload,
} from "lucide-react";

export default function JoinPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.07] via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">
              For Real Estate Agents
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-white">Your Professional</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                Agent Website
              </span>
            </h1>
            <p className="mt-5 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              A fully-featured real estate website with listings, blog, contact forms, and booking calendar. Add your own content or let AI do the heavy lifting.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://realestatephoto2video.com/signup"
                className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all flex items-center gap-2"
              >
                Create Your Website
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://realestatephoto2video.com/lens"
                className="px-6 py-3.5 rounded-xl border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white font-medium text-sm transition-all"
              >
                See Plans & Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-4">
          Everything Your Website Includes
        </h2>
        <p className="text-white/40 text-center max-w-lg mx-auto mb-12">
          A complete agent website — set it up in minutes, update it anytime.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {[
            { icon: Globe, title: "Custom Domain", desc: "Your subdomain or your own domain" },
            { icon: Upload, title: "Listing Pages", desc: "Upload your own photos & details" },
            { icon: PenTool, title: "Blog", desc: "Write posts manually or with AI" },
            { icon: MessageSquare, title: "Contact Forms", desc: "Leads go straight to your inbox" },
            { icon: CalendarDays, title: "Booking Calendar", desc: "Let clients book showings" },
            { icon: FileText, title: "About Page", desc: "Your bio, headshot & company info" },
            { icon: Palette, title: "3 Templates", desc: "Classic, Modern, or Bold" },
            { icon: TrendingUp, title: "Portal Listing", desc: "Appear on P2V Homes directory" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
            >
              <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-2.5">
                <item.icon className="h-4.5 w-4.5 text-cyan-400" />
              </div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-white/40 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two paths */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
            Two Ways to Get Started
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Path 1: Website only */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="h-11 w-11 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <Globe className="h-5.5 w-5.5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Start With a Website
              </h3>
              <p className="text-sm text-white/40 mt-2 leading-relaxed">
                Subscribe to Lens Pro ($49/mo) or buy your site outright ($399). Upload your own photos, write your own descriptions and blog posts, and manage everything yourself.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Upload your own photos & content",
                  "Write blog posts manually",
                  "Manage listings yourself",
                  "Add AI tools anytime",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400/60 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://realestatephoto2video.com/signup"
                className="block mt-5 text-center py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold transition-all"
              >
                Create Your Website
              </a>
            </div>

            {/* Path 2: Video → website */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="h-11 w-11 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <Film className="h-5.5 w-5.5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Start With a Listing Video
              </h3>
              <p className="text-sm text-white/40 mt-2 leading-relaxed">
                Order a cinematic listing video from $79. You get a 10-day free trial of all AI tools, and your content auto-fills your website when you subscribe.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Professional video from your photos",
                  "10-day trial of all AI tools",
                  "Content auto-populates your site",
                  "You own every clip forever",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400/60 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://realestatephoto2video.com/order"
                className="block mt-5 text-center py-2.5 rounded-lg border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-sm font-medium transition-all"
              >
                Order a Video
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Optional AI tools upsell */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
              Optional
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Supercharge Your Site With AI Tools
            </h2>
            <p className="mt-4 text-white/40 leading-relaxed">
              Don&apos;t want to write everything yourself? Subscribe to Lens Tools and let AI generate descriptions, virtual staging, blog posts, flyers, and more — all of which auto-populate your website.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                icon: FileText,
                title: "AI Description Writer",
                desc: "MLS-ready listing descriptions generated from your photos in seconds.",
              },
              {
                icon: Palette,
                title: "Virtual Staging",
                desc: "AI-powered staging fills empty rooms with furniture and decor.",
              },
              {
                icon: Camera,
                title: "Photo Coach",
                desc: "Get AI feedback on your listing photos before uploading.",
              },
              {
                icon: Zap,
                title: "Design Studio",
                desc: "Create branded flyers, social posts, and marketing materials.",
              },
              {
                icon: PenTool,
                title: "AI Blog Generator",
                desc: "Generate SEO-optimized blog posts about your market in one click.",
              },
              {
                icon: TrendingUp,
                title: "Location Reports",
                desc: "Generate neighborhood value reports for your sellers.",
              },
            ].map((tool) => (
              <div
                key={tool.title}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-cyan-400/10 transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                  <tool.icon className="h-4.5 w-4.5 text-cyan-400" />
                </div>
                <p className="text-sm font-bold text-white">{tool.title}</p>
                <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
            Simple Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Lens Tools */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                Lens Tools
              </p>
              <p className="text-3xl font-extrabold text-white">
                $27<span className="text-base font-medium text-white/40">/mo</span>
              </p>
              <p className="text-xs text-white/30 mt-1">AI tools only, no website</p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "All AI marketing tools",
                  "Property pages at P2V",
                  "Listing portal opt-in",
                  "Unlimited descriptions",
                  "Virtual staging",
                  "Design Studio access",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-white/50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400/60 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://realestatephoto2video.com/lens"
                className="block mt-6 text-center py-2.5 rounded-lg border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-sm font-medium transition-all"
              >
                Learn More
              </a>
            </div>

            {/* Lens Pro */}
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.04] p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white uppercase tracking-wider">
                Most Popular
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
                Lens Pro
              </p>
              <p className="text-3xl font-extrabold text-white">
                $49<span className="text-base font-medium text-white/40">/mo</span>
              </p>
              <p className="text-xs text-white/30 mt-1">Website + AI tools</p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Everything in Lens Tools",
                  "Full agent website",
                  "Custom subdomain or domain",
                  "AI blog generator",
                  "Booking calendar",
                  "Contact forms → your inbox",
                  "Upload your own content too",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-white/50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://realestatephoto2video.com/signup"
                className="block mt-6 text-center py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold transition-all"
              >
                Get Started
              </a>
            </div>

            {/* Buy-Out */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                Buy-Out
              </p>
              <p className="text-3xl font-extrabold text-white">
                $399<span className="text-base font-medium text-white/40"> once</span>
              </p>
              <p className="text-xs text-white/30 mt-1">Own your site forever</p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Own your website permanently",
                  "3 months Lens Pro included",
                  "Custom domain support",
                  "Export & download your site",
                  "Keep editing after sub ends",
                  "Re-subscribe for AI anytime",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-white/50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400/60 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://realestatephoto2video.com/signup"
                className="block mt-6 text-center py-2.5 rounded-lg border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-sm font-medium transition-all"
              >
                Get Started
              </a>
            </div>
          </div>

          {/* Video add-on note */}
          <p className="text-center text-xs text-white/30 mt-6 max-w-md mx-auto">
            Listing videos are available as a separate service from $79 — no subscription required. They integrate automatically with your website if you have one.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Build Your Site?
            </h2>
            <p className="mt-4 text-white/40 leading-relaxed">
              Sign up, choose a template, add your listings and content. Your professional agent website can be live today.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://realestatephoto2video.com/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition-all"
              >
                Create Your Website
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://realestatephoto2video.com/order"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white font-medium transition-all"
              >
                Or Order a Video First
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
