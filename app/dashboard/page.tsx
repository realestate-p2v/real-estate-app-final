"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Video,
  FileText,
  RefreshCw,
  BarChart3,
  Star,
  Gift,
  Bell,
  Camera,
  Sparkles,
  ArrowRight,
  BookOpen,
  Play,
} from "lucide-react";

const FEATURES = [
  {
    icon: Video,
    title: "Your Videos",
    description: "Watch, download, and share all your completed listing videos in one place.",
    status: "live",
    href: "/dashboard/videos",
  },
  {
    icon: FileText,
    title: "Saved Drafts",
    description: "Resume unfinished orders right where you left off. Your photos, settings, and preferences are saved.",
    status: "live",
    href: "/dashboard/drafts",
  },
  {
    icon: RefreshCw,
    title: "Request Revisions",
    description: "Select individual clips, choose new camera directions, and submit revision requests — all from your browser.",
    status: "coming",
  },
  {
    icon: BarChart3,
    title: "Order History",
    description: "Track every order with status updates, delivery dates, and payment receipts.",
    status: "coming",
  },
  {
    icon: Star,
    title: "Leave Reviews",
    description: "Share your experience on Google, Facebook, or Zillow and unlock exclusive discounts.",
    status: "coming",
  },
  {
    icon: Gift,
    title: "Rewards & Referrals",
    description: "Earn $10 credit for every agent you refer. Complete all 3 reviews to spin the mystery wheel.",
    status: "coming",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Get notified when your video is ready, when a revision is complete, or when you earn a reward.",
    status: "coming",
  },
  {
    icon: Camera,
    title: "Photo Editing",
    description: "View before/after comparisons of your edited photos and download the corrected versions.",
    status: "coming",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Your Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Manage your videos, track orders, and access your account.
            More features are coming soon.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-16">
          {FEATURES.map(({ icon: Icon, title, description, status, href }, i) => (
            <div
              key={i}
              className={`relative bg-card rounded-xl border p-6 space-y-3 transition-all ${
                status === "live"
                  ? "border-primary/30 shadow-sm hover:shadow-md"
                  : "border-border"
              }`}
            >
              {status === "live" && (
                <span className="absolute top-4 right-4 text-xs font-semibold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                  Live
                </span>
              )}
              {status === "coming" && (
                <span className="absolute top-4 right-4 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  Coming Soon
                </span>
              )}
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${
                status === "live" ? "bg-primary/10" : "bg-muted"
              }`}>
                <Icon className={`h-5 w-5 ${
                  status === "live" ? "text-primary" : "text-muted-foreground"
                }`} />
              </div>
              <h3 className="font-bold text-foreground text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              {status === "live" && href && (
                <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-1">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-6 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ready to create your next listing video?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload your photos, pick your music and branding, and we'll deliver a professional 
            walkthrough video within 24 hours. Packages start at $79.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
              <Link href="/order">
                <Play className="mr-2 h-5 w-5" />
                Create My Listing Video
              </Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-6 text-lg">
              <Link href="/portfolio">View Portfolio</Link>
            </Button>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground text-center">Resources</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/resources/photography-guide" className="group bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Free Photography Guide</h4>
                <p className="text-sm text-muted-foreground mt-1">23-page guide with camera settings, lighting tips, staging, drone photography, and printable checklists.</p>
              </div>
            </Link>
            <Link href="/support" className="group bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Support & FAQ</h4>
                <p className="text-sm text-muted-foreground mt-1">Find answers to common questions, contact us, or chat on WhatsApp.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link>
            <Link href="/resources/photography-guide" className="hover:text-foreground transition-colors">Free Guide</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
