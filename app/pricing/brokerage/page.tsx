"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoPlayer } from "@/components/video-player";
import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  TrendingUp,
  CheckCircle,
  Mail,
  Calculator,
  Play,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Camera,
  ArrowRight,
  FileText,
  Download,
} from "lucide-react";

const TIERS = [
  {
    name: "Standard",
    volume: "10+ listings/mo",
    perClip: 3.79,
    highlight: false,
    features: [
      "768P video quality",
      "Landscape or vertical",
      "24-hour delivery",
      "1 free revision per listing",
      "Google Drive delivery",
      "Email support",
    ],
  },
  {
    name: "Growth",
    volume: "25+ listings/mo",
    perClip: 3.29,
    highlight: true,
    features: [
      "768P video quality",
      "Landscape or vertical",
      "24-hour delivery",
      "1 free revision per listing",
      "Google Drive delivery",
      "Dedicated account support",
      "Tier upgrades automatically",
    ],
  },
  {
    name: "Enterprise",
    volume: "50+ listings/mo",
    perClip: 2.99,
    highlight: false,
    features: [
      "768P video quality",
      "Landscape or vertical",
      "Priority delivery",
      "1 free revision per listing",
      "Google Drive delivery",
      "Dedicated account support",
      "Custom branding templates",
      "Tier upgrades automatically",
    ],
  },
];

const ADDONS = [
  { name: "1080P upgrade", price: "+$0.50/clip" },
  { name: "Both orientations", price: "+$1.50/video" },
  { name: "AI voiceover", price: "+$25/video" },
  { name: "Photo editing", price: "$2.99/photo" },
];

const FAQS = [
  {
    q: "How does billing work?",
    a: "You're invoiced monthly based on actual usage. At the end of each month, we count your total listings — if you've hit a higher tier, the better rate applies retroactively to all clips that month. You always get the best rate you've earned.",
  },
  {
    q: "What counts as a clip?",
    a: "Each photo you upload becomes one video clip. A listing with 15 photos = 15 clips. The clips are assembled into a single cinematic walkthrough video with music, branding, and transitions.",
  },
  {
    q: "How do tier upgrades work?",
    a: "Your tier is based on total listings per month across all agents. Start at Standard (10+), and if your team hits 25 listings in a month, every clip that month is billed at the Growth rate. Hit 50 and you get Enterprise pricing on everything. A progress bar in your brokerage dashboard shows how close you are to the next tier.",
  },
  {
    q: "Can different agents in our brokerage use the account?",
    a: "Yes. We set up a single brokerage account and all orders from your agents count toward your monthly volume tier. Each agent can customize branding per listing.",
  },
  {
    q: "How do revisions work?",
    a: "The first revision on every listing is free. Additional revisions are available at a 10% discount off standard revision rates. Most revisions are completed within 24 hours.",
  },
  {
    q: "What if we need custom terms?",
    a: "For 100+ listings per month or special requirements (white-label, API integration, custom branding), contact us directly and we'll build a custom plan.",
  },
  {
    q: "Is there a minimum commitment?",
    a: "The minimum is 10 listings per month to qualify for brokerage pricing. No long-term contracts — your rate is simply based on how many listings your team processes that month.",
  },
];

function ROICalculator() {
  const [listings, setListings] = useState(15);
  const [photosPerListing, setPhotosPerListing] = useState(15);
  const [avgSalePrice, setAvgSalePrice] = useState(450000);

  const totalClips = listings * photosPerListing;
  const tier =
    listings >= 50
      ? { name: "Enterprise", rate: 2.99 }
      : listings >= 25
      ? { name: "Growth", rate: 3.29 }
      : { name: "Standard", rate: 3.79 };

  const monthlyCost = totalClips * tier.rate;
  const retailCost = listings * 79;
  const savings = retailCost - monthlyCost;
  const savingsPercent = retailCost > 0 ? Math.round((savings / retailCost) * 100) : 0;
  const costPerListing = listings > 0 ? monthlyCost / listings : 0;
  const videoROI = avgSalePrice * 0.03;

  const nextTier =
    listings < 25
      ? { name: "Growth", threshold: 25, rate: 3.29 }
      : listings < 50
      ? { name: "Enterprise", threshold: 50, rate: 2.99 }
      : null;

  const nextTierSavings = nextTier
    ? (tier.rate - nextTier.rate) * totalClips
    : 0;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">ROI Calculator</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Listings per month
          </label>
          <Input
            type="number"
            min={1}
            max={500}
            value={listings}
            onChange={(e) => setListings(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Avg photos per listing
          </label>
          <Input
            type="number"
            min={1}
            max={35}
            value={photosPerListing}
            onChange={(e) =>
              setPhotosPerListing(Math.min(35, Math.max(1, parseInt(e.target.value) || 1)))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Avg sale price ($)
          </label>
          <Input
            type="number"
            min={0}
            step={10000}
            value={avgSalePrice}
            onChange={(e) => setAvgSalePrice(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Your tier</p>
          <p className="text-xl font-bold text-primary mt-1">{tier.name}</p>
          <p className="text-sm text-muted-foreground">${tier.rate}/clip</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Monthly cost</p>
          <p className="text-xl font-bold text-foreground mt-1">
            ${monthlyCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            ${costPerListing.toFixed(2)}/listing
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-green-700">Savings vs retail</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            {savingsPercent > 0 ? `${savingsPercent}% off` : "—"}
          </p>
          <p className="text-sm text-green-600">
            {savings > 0
              ? `$${savings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo saved`
              : ""}
          </p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Potential commission</p>
          <p className="text-xl font-bold text-foreground mt-1">
            ${(videoROI * listings).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-muted-foreground">
            if videos help close 3% more
          </p>
        </div>
      </div>

      {nextTier && listings >= 10 && (
        <div className="mt-4 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{nextTier.threshold - listings} more listings</span> to unlock {nextTier.name} pricing at ${nextTier.rate}/clip
          </p>
          <p className="text-sm font-semibold text-accent">
            Save ${nextTierSavings.toFixed(2)}/mo
          </p>
        </div>
      )}
    </div>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <span className="font-semibold text-foreground pr-4">{faq.q}</span>
            {open === i ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {open === i && (
            <div className="px-5 pb-5 -mt-1">
              <p className="text-muted-foreground">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BrokeragePricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
            <Building2 className="h-4 w-4" />
            Brokerage Plans
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Listing Videos for Your Entire Team
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Give every agent in your brokerage cinematic listing videos at bulk rates.
            Pay per clip, scale with your team, no long-term contracts.
          </p>
        </div>

        {/* Download Presentation */}
        <div className="mb-14">
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground">Download Our Brokerage Presentation</h2>
              <p className="text-muted-foreground mt-1">
                17-slide overview of Photo 2 Video + P2V Lens — pricing, ROI, features, and how to get started. Share it with your leadership team.
              </p>
            </div>
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-6 py-5 flex-shrink-0"
            >
              <a href="/P2V_Brokerage_Presentation.pdf" download>
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </a>
            </Button>
          </div>
        </div>

        {/* Why video */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">
          {[
            {
              icon: TrendingUp,
              stat: "403%",
              label: "more inquiries",
              desc: "Listings with video receive significantly more engagement than photo-only listings.",
            },
            {
              icon: Clock,
              stat: "24hr",
              label: "turnaround",
              desc: "Upload photos today, get a polished cinematic video delivered tomorrow.",
            },
            {
              icon: Zap,
              stat: "$0",
              label: "production overhead",
              desc: "No videographers, no editing software, no learning curve. Just upload listing photos.",
            },
          ].map(({ icon: Icon, stat, label, desc }, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-primary">{stat}</span>
                <span className="text-lg font-semibold text-foreground ml-1.5">{label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing tiers */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">
            Simple Per-Clip Pricing
          </h2>
          <p className="text-muted-foreground text-center mb-3">
            Each photo becomes one video clip. Your rate is based on total listings per month across all agents.
          </p>
          <p className="text-sm text-center text-muted-foreground mb-8">
            Hit a higher tier mid-month? The better rate applies retroactively to all clips that month.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TIERS.map((tier, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-6 flex flex-col ${
                  tier.highlight
                    ? "bg-card border-primary ring-2 ring-primary/20 relative"
                    : "bg-card border-border"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.volume}</p>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${tier.perClip.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground ml-1">/clip</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  15 clips from ${(tier.perClip * 15).toFixed(2)} · 25 clips from ${(tier.perClip * 25).toFixed(2)}
                </p>
                <div className="space-y-2.5 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  className={`mt-6 w-full py-5 font-bold ${
                    tier.highlight
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  <a
                    href={`mailto:matt@realestatephoto2video.com?subject=Brokerage ${tier.name} Plan Inquiry&body=Hi Matt, I'm interested in the ${tier.name} brokerage plan (${tier.volume}). Our brokerage is [company name] and we have approximately [X] agents.`}
                  >
                    Get Started
                  </a>
                </Button>
              </div>
            ))}
          </div>

          {/* Custom tier */}
          <div className="mt-6 bg-muted/50 rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-bold text-foreground">Custom Plan — 100+ listings/mo</h3>
              <p className="text-muted-foreground text-sm">
                Need white-label, API access, custom branding, or dedicated support? Let&apos;s build a custom plan.
              </p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 px-6 py-5 font-bold flex-shrink-0">
              <a href="mailto:matt@realestatephoto2video.com?subject=Custom Brokerage Plan&body=Hi Matt, we're interested in a custom brokerage plan for 100+ listings per month. Our brokerage is [company name] and we have approximately [X] agents.">
                Contact Us
              </a>
            </Button>
          </div>
        </div>

        {/* Add-ons */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-4">Optional Add-Ons</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ADDONS.map((a, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-foreground">{a.name}</span>
                <span className="text-sm font-bold text-primary">{a.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* P2V Lens for Brokerages */}
        <div className="mb-14">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 p-6 sm:p-8">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Camera className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground">P2V Lens for Your Team</h2>
                  <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  Equip every agent with AI photography coaching. Better photos in = better videos out.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  {[
                    "AI Photo Coach — snap, analyze, perfect",
                    "Free photo editing on all video orders",
                    "Priority 12-hour video delivery",
                    "Exclusive bulk video pricing included",
                    "AI Suggest — auto camera directions",
                    "Coming soon: Marketing Design Studio, AI Listing Descriptions & Virtual Staging",
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-extrabold text-foreground">$19.95</span>
                  <span className="text-muted-foreground">/agent/month</span>
                  <span className="text-sm text-muted-foreground ml-2">(min 10 agents)</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                    <Link href="/lens">
                      Learn More
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="mailto:matt@realestatephoto2video.com?subject=P2V Lens Brokerage Inquiry&body=Hi Matt, I'm interested in P2V Lens for our brokerage. We have approximately [X] agents.">
                      Contact for Brokerage Setup
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="mb-14">
          <ROICalculator />
        </div>

        {/* Sample video */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">
            See What Your Agents Get
          </h2>
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="max-w-2xl mx-auto">
              <VideoPlayer
                url="https://drive.google.com/file/d/1ikcUGNefikzELQhJ44MaFvauoLdssFyv/view"
                className="aspect-video"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Real listing video generated from standard MLS photos. No videographer needed.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              {
                num: "1",
                title: "Sign Up",
                desc: "Email us your brokerage details. We set up your account in minutes.",
              },
              {
                num: "2",
                title: "Agents Upload",
                desc: "Any agent uploads listing photos through our simple order form.",
              },
              {
                num: "3",
                title: "We Create",
                desc: "AI generates a cinematic walkthrough video with music and branding.",
              },
              {
                num: "4",
                title: "Delivered",
                desc: "Video delivered within 24 hours. Ready to share.",
              },
            ].map((s, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  {s.num}
                </div>
                <h3 className="font-bold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <FAQSection />
        </div>

        {/* CTA */}
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ready to Equip Your Brokerage?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Email us with your brokerage name and team size. We&apos;ll set up your account 
            and have your first video ready within 24 hours.
          </p>
          <Button
            asChild
            className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold"
          >
            <a href="mailto:matt@realestatephoto2video.com?subject=Brokerage Plan Inquiry&body=Hi Matt, I'm interested in brokerage pricing for listing videos. Our brokerage is [company name], we have approximately [X] agents, and we handle about [X] listings per month.">
              <Mail className="mr-2 h-5 w-5" />
              Get Brokerage Pricing
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">matt@realestatephoto2video.com</p>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/portfolio" className="hover:text-foreground transition-colors">
              Portfolio
            </Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">
              Partners
            </Link>
            <Link href="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
