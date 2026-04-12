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
              <span className="text-white">Build Your Agent</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                Website on P2V
              </span>
            </h1>
            <p className="mt-5 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              One platform for listing videos, AI marketing tools, and your own professional website — all auto-populated from the work you already do.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://realestatephoto2video.com/order"
                className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all flex items-center gap-2"
              >
                Get Started — Order a Video
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://realestatephoto2video.com/lens"
                className="px-6 py-3.5 rounded-xl border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white font-medium text-sm transition-all"
              >
                Learn About P2V Lens
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            {
              step: "1",
              icon: Camera,
              title: "Upload Photos",
              desc: "Upload your listing photos and order a cinematic video from $79.",
            },
            {
              step: "2",
              icon: Sparkles,
              title: "Use AI Tools",
              desc: "Generate descriptions, virtual staging, flyers, and reports instantly.",
            },
            {
              step: "3",
              icon: Globe,
              title: "Website Auto-Fills",
              desc: "Everything you create feeds your agent website automatically.",
            },
            {
              step: "4",
              icon: TrendingUp,
              title: "Grow Your Brand",
              desc: "Your listings appear on P2V Homes and your own professional site.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center relative"
            >
              <span className="absolute top-3 left-3 text-[10px] font-bold text-cyan-400/40">
                {item.step}
              </span>
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools showcase */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-4">
            AI-Powered Tools
          </h2>
          <p className="text-white/40 text-center max-w-lg mx-auto mb-12">
            Every tool feeds your website. Create once, publish everywhere.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                icon: Film,
                title: "Listing Videos",
                desc: "Cinematic walkthrough videos from your photos. You own every clip.",
              },
              {
                icon: FileText,
                title: "Description Writer",
                desc: "MLS-ready descriptions generated from your photos in seconds.",
              },
              {
                icon: Palette,
                title: "Virtual Staging",
                desc: "AI-powered staging to fill empty rooms with furniture.",
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
              <ul className="mt-5 space-y-2.5">
                {[
                  "Everything in Lens Tools",
                  "Full agent website",
                  "Custom subdomain",
                  "AI blog generator",
                  "Booking calendar",
                  "Contact forms",
                  "Location Q&A pages",
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
                href="https://realestatephoto2video.com/lens"
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
              <ul className="mt-5 space-y-2.5">
                {[
                  "Own your website forever",
                  "3 months Lens Pro included",
                  "Custom domain support",
                  "Export & download site",
                  "Keep editing after sub ends",
                  "Re-subscribe anytime for AI",
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
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-white/40 leading-relaxed">
              Order your first listing video and unlock a 10-day free trial of all AI tools. No commitment required.
            </p>
            <a
              href="https://realestatephoto2video.com/order"
              className="inline-flex items-center gap-2 mt-6 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition-all"
            >
              Order Your First Video
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
