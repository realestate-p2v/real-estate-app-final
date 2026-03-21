"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  Zap,
  Clock,
  Sofa,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ImageIcon,
  MessageSquare,
  Play,
  BookOpen,
  Lock,
  Crown,
  BarChart3,
  DollarSign,
  PenTool,
} from "lucide-react";

interface LensSubscription {
  active: boolean;
  plan: string | null;
  analysesUsed: number;
  analysesLimit: number;
  renewsAt: string | null;
}

export default function DashboardLensPage() {
  const [subscription, setSubscription] = useState<LensSubscription>({
    active: false,
    plan: null,
    analysesUsed: 0,
    analysesLimit: 200,
    renewsAt: null,
  });

  const [coachSessionCount, setCoachSessionCount] = useState(0);
  const [descriptionCount, setDescriptionCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isAdmin = user.email === "realestatephoto2video@gmail.com";

      // Load usage data — try lens_usage first, fallback to summing lens_sessions
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Also get total analyses from sessions (more reliable since admin skips lens_usage)
      const { data: sessions } = await supabase
        .from("lens_sessions")
        .select("total_analyses")
        .eq("user_id", user.id);
      const totalFromSessions = (sessions || []).reduce((sum, s) => sum + (s.total_analyses || 0), 0);

      // Use whichever is higher
      const totalAnalyses = Math.max(usage?.total_analyses || 0, totalFromSessions);

      if (isAdmin) {
        setSubscription({
          active: true,
          plan: "Admin",
          analysesUsed: totalAnalyses,
          analysesLimit: 200,
          renewsAt: null,
        });
      } else if (usage?.is_subscriber) {
        setSubscription({
          active: true,
          plan: usage.subscription_tier || "Individual",
          analysesUsed: totalAnalyses,
          analysesLimit: 200,
          renewsAt: null,
        });
      }

      // Load counts for live tools
      const { count: sessionCount } = await supabase
        .from("lens_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setCoachSessionCount(sessionCount || 0);

      const { count: descCount } = await supabase
        .from("lens_descriptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setDescriptionCount(descCount || 0);
    };
    init();
  }, []);

  const features = [
    {
      icon: Camera,
      title: "AI Photo Coach",
      description: "Open a shoot session for any property. Snap a photo, get instant AI scoring — green means approved, yellow means almost there, red means reshoot. Use the room checklist so you never miss a shot. All approved photos save to your session gallery.",
      status: "live" as const,
      actionLabel: "Start a Shoot",
      actionHref: "/dashboard/lens/coach",
      count: coachSessionCount > 0 ? `${coachSessionCount} session${coachSessionCount !== 1 ? "s" : ""}` : null,
    },
    {
      icon: PenTool,
      title: "Marketing Design Studio",
      description: "Create Just Listed, Open House, Price Reduced, and Just Sold graphics in under a minute. Upload your headshot, listing photo, and logo — download print-ready and social-ready formats. Includes a branding card builder for your video intros and outros.",
      status: "live" as const,
      actionLabel: "Open Design Studio",
      actionHref: "/dashboard/lens/design-studio",
    },
    {
      icon: MessageSquare,
      title: "AI Listing Description Writer",
      description: "Upload your listing photos and enter property details. AI analyzes each room — features, finishes, condition — then writes a polished MLS-ready description. Choose from Professional, Luxury, Conversational, or Concise styles.",
      status: "live" as const,
      actionLabel: "Write a Description",
      actionHref: "/dashboard/lens/descriptions",
      count: descriptionCount > 0 ? `${descriptionCount} description${descriptionCount !== 1 ? "s" : ""} generated` : null,
    },
    {
      icon: Sofa,
      title: "Virtual Staging",
      description: "Upload a photo of an empty room and see it furnished in seconds. Choose from Modern, Traditional, Minimalist, Scandinavian, Coastal, or Farmhouse styles. Before/after comparison included.",
      status: "coming" as const,
      actionLabel: "Stage a Room",
      actionHref: "/dashboard/lens/staging",
    },
    {
      icon: ImageIcon,
      title: "Free Photo Enhancement",
      description: "All video orders include professional AI corrections — brightness, color, white balance, and vertical line straightening at no extra charge. Lens subscribers can also AI-edit photos on the spot during a shoot session.",
      status: "coming" as const,
      actionLabel: "Order a Video",
      actionHref: "/order",
    },
    {
      icon: Sparkles,
      title: "AI Suggest",
      description: "When ordering a video, AI auto-fills optimal camera directions for each photo based on room type and composition. Skip the guesswork.",
      status: "live" as const,
      actionLabel: "Order a Video",
      actionHref: "/order",
    },
    {
      icon: DollarSign,
      title: "10% Off Video Orders",
      description: "Save 10% on every Photo 2 Video order, automatically applied at checkout. Brokerage members enjoy even deeper bulk pricing.",
      status: "coming" as const,
      actionLabel: "Order a Video",
      actionHref: "/order",
    },
    {
      icon: Zap,
      title: "Priority Delivery",
      description: "Get your listing videos in 12 hours instead of the standard 24-hour turnaround. Subscribers always go first in the queue.",
      status: "coming" as const,
      actionLabel: "Order a Video",
      actionHref: "/order",
    },
  ];

  const usagePercent = subscription.analysesLimit > 0
    ? Math.round((subscription.analysesUsed / subscription.analysesLimit) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              P2V Lens
            </h1>
            <p className="text-muted-foreground mt-1">Your AI-powered real estate marketing suite</p>
          </div>
        </div>

        {/* ═══ SUBSCRIPTION STATUS ═══ */}
        <div className="mt-8 mb-10">
          {subscription.active ? (
            <div className="bg-card rounded-2xl border border-green-200 p-6 sm:p-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">P2V Lens — {subscription.plan}</h2>
                    <p className="text-sm text-green-600 font-medium">Active</p>
                  </div>
                </div>
                {subscription.renewsAt && (
                  <p className="text-sm text-muted-foreground">
                    Renews {new Date(subscription.renewsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* Usage meter */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Photo Analyses This Month</span>
                  <span className="text-sm text-muted-foreground">{subscription.analysesUsed} / {subscription.analysesLimit}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercent > 95 ? "bg-red-500" : usagePercent > 80 ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.max(Math.min(usagePercent, 100), 1)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {subscription.analysesLimit - subscription.analysesUsed} analyses remaining this month
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground">No Active Subscription</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Subscribe to P2V Lens to unlock AI photo coaching, design studio, listing descriptions, virtual staging, free photo editing, and priority 12-hour delivery.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                      <Link href="/lens">
                        Subscribe to P2V Lens
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/lens#waitlist-form">
                        Join the Waitlist
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview usage meter (inactive state) */}
              <div className="mt-6 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Photo Analyses This Month</span>
                  <span className="text-sm text-muted-foreground">0 / 200</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-muted-foreground/20" style={{ width: "0%" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ FEATURES ═══ */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-accent rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">Your Features</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description, status, actionLabel, actionHref, count }, i) => {
              const isClickable = status === "live" && actionHref;
              const cardClasses = `relative bg-card rounded-xl border p-5 space-y-2.5 block ${
                status === "coming"
                  ? "border-border opacity-70"
                  : "border-primary/20 hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
              }`;

              const cardContent = (
                <>
                  {status === "live" && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      {subscription.active ? "Active" : "With Subscription"}
                    </span>
                  )}
                  {status === "coming" && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    status === "live" ? "bg-accent/10" : "bg-muted"
                  }`}>
                    <Icon className={`h-5 w-5 ${status === "live" ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className={`font-bold ${status === "live" ? "text-foreground group-hover:text-accent transition-colors" : "text-foreground"}`}>{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  {count && (
                    <p className="text-xs text-muted-foreground font-medium">{count}</p>
                  )}
                  {status === "live" && actionLabel && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:text-accent/80 transition-colors pt-1">
                      {actionLabel}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </>
              );

              return isClickable ? (
                <Link key={i} href={actionHref} className={cardClasses}>
                  {cardContent}
                </Link>
              ) : (
                <div key={i} className={cardClasses}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              href="/order"
              className="group bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 block"
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">Order a Video</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload photos and get a cinematic listing video in {subscription.active ? "12" : "24"} hours.
              </p>
            </Link>
            <Link
              href="/tips"
              className="group bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 block"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">Photo Tips</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse DIY video tips to get the most from your listing photos.
              </p>
            </Link>
            <Link
              href="/resources/photography-guide"
              className="group bg-card rounded-xl border border-primary/20 p-5 space-y-2.5 hover:border-accent/40 hover:shadow-lg transition-all duration-300 block"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">Photography Guide</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                32-page guide with camera settings, lighting, staging, and drone tips.
              </p>
            </Link>
          </div>
        </div>

        {/* CTA */}
        {!subscription.active && (
          <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Your Complete Listing Marketing Suite
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              P2V Lens gives you AI photo coaching, a marketing design studio, listing description writer,
              virtual staging, free photo editing, and priority delivery. Plans start at $27.95/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
                <Link href="/lens">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get P2V Lens
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-6 text-lg">
                <Link href="/order">Create a Video Instead</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/lens" className="hover:text-foreground transition-colors">P2V Lens</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
