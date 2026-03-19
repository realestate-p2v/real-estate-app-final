"use client";

import { useState, useEffect } from "react";
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
  DollarSign,
  UserPlus,
  Edit,
  Building2,
  Image as ImageIcon,
} from "lucide-react";

const REALTOR_FEATURES = [
  {
    icon: Video,
    title: "Your Videos",
    description: "Watch, download, and share all your completed listing videos.",
    status: "live",
    href: "/dashboard/videos",
  },
  {
    icon: FileText,
    title: "Saved Drafts",
    description: "Resume unfinished orders. Photos, settings, and preferences are all saved.",
    status: "live",
    href: "/dashboard/drafts",
  },
  {
    icon: RefreshCw,
    title: "Request Revisions",
    description: "Select clips, choose new directions, and submit revision requests from your browser.",
    status: "live",
    href: "/dashboard/videos",
  },
  {
    icon: BarChart3,
    title: "Order History",
    description: "Track every order with status updates, delivery dates, and receipts.",
    status: "live",
    href: "/dashboard/videos",
  },
  {
    icon: Star,
    title: "Leave Reviews",
    description: "Share your experience and unlock exclusive discounts up to 25% off.",
    status: "live",
    href: "/dashboard/reviews",
  },
  {
    icon: DollarSign,
    title: "Referral Program",
    description: "Earn 20% commission when people you refer order listing videos.",
    status: "live",
    href: "/dashboard/referral-earnings",
  },
  {
    icon: Sparkles,
    title: "P2V Lens",
    description: "AI photography coaching, free photo editing, and priority 12-hour delivery on every order.",
    status: "live",
    href: "/dashboard/lens",
  },
  {
    icon: Building2,
    title: "Brokerage Dashboard",
    description: "View your team's tier progress, monthly usage, per-clip rate, and recent orders.",
    status: "live",
    href: "/dashboard/brokerage",
  },
];

const PHOTOGRAPHER_FEATURES_NO_LISTING = [
  {
    icon: UserPlus,
    title: "Join the Directory",
    description: "List yourself for free and get discovered by realtors in your market.",
    status: "live",
    href: "/directory/join",
  },
  {
    icon: DollarSign,
    title: "Referral Program",
    description: "Earn 20% commission when your agent clients order listing videos.",
    status: "live",
    href: "/partners",
  },
  {
    icon: Video,
    title: "Create Videos for Clients",
    description: "Order listing videos on behalf of your agent clients. Same great service.",
    status: "live",
    href: "/order",
  },
];

const PHOTOGRAPHER_FEATURES_HAS_LISTING = [
  {
    icon: Edit,
    title: "Edit My Listing",
    description: "Update your profile, specialties, bio, and contact info.",
    status: "live",
    href: "/directory/edit",
  },
  {
    icon: ImageIcon,
    title: "View My Listing",
    description: "See how your profile looks to realtors browsing the directory.",
    status: "live",
    href: "/directory",
  },
  {
    icon: DollarSign,
    title: "Referral Program",
    description: "Earn 20% commission when your agent clients order listing videos.",
    status: "live",
    href: "/partners",
  },
  {
    icon: Video,
    title: "Create Videos for Clients",
    description: "Order listing videos on behalf of your agent clients. Same great service.",
    status: "live",
    href: "/order",
  },
  {
    icon: BarChart3,
    title: "Directory Analytics",
    description: "See how many realtors viewed your listing and sent you inquiries.",
    status: "live",
    href: "/dashboard/directory-analytics",
  },
  {
    icon: Gift,
    title: "Referral Earnings",
    description: "Track your commissions, payouts, and referred orders.",
    status: "live",
    href: "/dashboard/referral-earnings",
  },
];

export default function DashboardPage() {
  const [hasListing, setHasListing] = useState<boolean | null>(null);

  useEffect(() => {
    checkListing();
  }, []);

  const checkListing = async () => {
    try {
      const res = await fetch("/api/directory/me");
      const data = await res.json();
      setHasListing(data.success && !!data.photographer);
    } catch {
      setHasListing(false);
    }
  };

  const photographerFeatures = hasListing
    ? PHOTOGRAPHER_FEATURES_HAS_LISTING
    : PHOTOGRAPHER_FEATURES_NO_LISTING;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Your Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your videos, track orders, and grow your business.
          </p>
        </div>

        {/* ═══ FOR REALTORS ═══ */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-accent rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">For Realtors</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REALTOR_FEATURES.map(({ icon: Icon, title, description, status, href }, i) => {
              const cardContent = (
                <>
                  {status === "live" && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Live</span>
                  )}
                  {status === "coming" && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Soon</span>
                  )}
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${status === "live" ? "bg-accent/10" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${status === "live" ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className={`font-bold ${status === "live" ? "text-foreground group-hover:text-accent transition-colors" : "text-foreground"}`}>{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </>
              );

              return status === "live" && href ? (
                <Link
                  key={i}
                  href={href}
                  className="relative bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 group block"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={i}
                  className="relative bg-card rounded-xl border border-border p-5 space-y-2.5"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ FOR PHOTOGRAPHERS ═══ */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">For Photographers</h2>
          </div>
          {hasListing === null ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-xl border border-border p-5 h-40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photographerFeatures.map(({ icon: Icon, title, description, status, href }, i) => {
                const cardContent = (
                  <>
                    {status === "live" && (
                      <span className="absolute top-3 right-3 text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Live</span>
                    )}
                    {status === "coming" && (
                      <span className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Soon</span>
                    )}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${status === "live" ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-5 w-5 ${status === "live" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className={`font-bold ${status === "live" ? "text-foreground group-hover:text-accent transition-colors" : "text-foreground"}`}>{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </>
                );

                return status === "live" && href ? (
                  <Link
                    key={i}
                    href={href}
                    className="relative bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 group block"
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div
                    key={i}
                    className="relative bg-card rounded-xl border border-border p-5 space-y-2.5"
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-5 mb-12">
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
                <p className="text-sm text-muted-foreground mt-1">32-page guide with camera settings, lighting, staging, and drone tips.</p>
              </div>
            </Link>
            <Link href="/support" className="group bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Support & FAQ</h4>
                <p className="text-sm text-muted-foreground mt-1">Find answers, contact us, or chat on WhatsApp.</p>
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
