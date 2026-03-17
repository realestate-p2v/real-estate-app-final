"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

const TIERS = [
  {
    name: "Growth",
    volume: "Up to 24 videos/mo",
    perClip: 3.29,
    highlight: true,
    features: [
      "768P video quality",
      "Landscape or vertical",
      "24-hour delivery",
      "1 free revision per video",
      "Google Drive delivery",
      "Dedicated account support",
    ],
  },
  {
    name: "Enterprise",
    volume: "25+ videos/mo",
    perClip: 2.99,
    highlight: false,
    features: [
      "768P video quality",
      "Landscape or vertical",
      "Priority delivery",
      "1 free revision per video",
      "Google Drive delivery",
      "Dedicated account support",
      "Custom branding templates",
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
    a: "You're invoiced monthly based on actual usage. No upfront commitment — your per-clip rate is based on your monthly volume. Up to 24 videos per month is Growth rate ($3.29/clip), 25+ is Enterprise rate ($2.99/clip).",
  },
  {
    q: "What counts as a clip?",
    a: "Each photo you upload becomes one video clip. A listing with 15 photos = 15 clips. The clips are assembled into a single cinematic walkthrough video with music, branding, and transitions.",
  },
  {
    q: "Can different agents in our brokerage use the account?",
    a: "Yes. We set up a single brokerage account and all orders from your agents count toward your monthly volume tier. Each agent can customize branding per listing.",
  },
  {
    q: "What if we need custom terms?",
    a: "For 50+ videos per month or special requirements (white-label, API integration, custom branding), contact us directly and we'll build a custom plan.",
  },
  {
    q: "Is there a minimum commitment?",
    a: "No contracts and no minimums. Use it for one listing or one hundred. Your rate is simply based on how many videos you order that month.",
  },
];

function ROICalculator() {
  const [listings, setListings] = useState(10);
  const [photosPerListing, setPhotosPerListing] = useState(15);
  const [avgSalePrice, setAvgSalePrice] = useState(450000);

  const totalClips = listings * photosPerListing;
  const tier =
    listings >= 25
      ? { name: "Enterprise", rate: 2.99 }
      : { name: "Growth", rate: 3.29 };

  const monthlyCost = totalClips * tier.rate;
  const retailCost = listings * 79;
  const savings = retailCost - monthlyCost;
  const savingsPercent = retailCost > 0 ? Math.round((savings / retailCost) * 100) : 0;
  const costPerListing = listings > 0 ? monthlyCost / listings : 0;
  const videoROI = avgSalePrice * 0.03;

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
            max={200}
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
            Pay per clip, scale with your team, no contracts.
          </p>
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
          <p className="text-muted-foreground text-center mb-8">
            Each photo becomes one video clip. Pay only for what you use. Max 35 clips per video.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${tier.perClip.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground ml-1">/clip</span>
                </div>
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
          <div className="mt-6 bg-muted/50 rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Custom Plan</h3>
              <p className="text-muted-foreground text-sm">
                50+ videos/month? Need white-label, API access, or custom branding? Let's talk.
              </p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 px-6 py-5 font-bold flex-shrink-0">
              <a href="mailto:matt@realestatephoto2video.com?subject=Custom Brokerage Plan&body=Hi Matt, we're interested in a custom brokerage plan. Our brokerage is [company name] and we handle approximately [X] listings per month.">
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
            <div className="aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center">
              <iframe
                src="https://drive.google.com/file/d/1ikcUGNefikzELQhJ44MaFvauoLdssFyv/preview"
                className="w-full h-full"
                allow="autoplay"
                allowFullScreen
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
                desc: "Video delivered via Google Drive within 24 hours. Ready to share.",
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

        {/* Social proof placeholder */}
        <div className="mb-14">
          <div className="bg-muted/30 rounded-2xl border border-border p-8 text-center">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <blockquote className="text-lg text-foreground italic max-w-2xl mx-auto">
              "We rolled this out to our entire team of 30 agents. The videos practically sell themselves — 
              and at a fraction of what we were paying our videographer."
            </blockquote>
            <p className="text-sm text-muted-foreground mt-3">
              — Coming soon: real brokerage testimonials
            </p>
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
            Email us with your brokerage name and team size. We'll set up your account 
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
