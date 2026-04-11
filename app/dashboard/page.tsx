"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { LensConversionTracker } from "@/components/lens-conversion-tracker";
import { LensTrialBanner } from "@/components/lens-trial-banner";
import { SignupSpin } from "@/components/signup-spin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  Zap,
  Clock,
  Sofa,
  ArrowRight,
  ImageIcon,
  MessageSquare,
  Play,
  BookOpen,
  Lock,
  Crown,
  PenTool,
  Crosshair,
  Film,
  Gift,
  Home,
  ChevronRight,
  FileText,
  Percent,
  ShieldCheck,
  Video,
  RefreshCw,
  BarChart3,
  Star,
  DollarSign,
  UserPlus,
  Edit,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Check,
  X,
  Loader2,
  Pencil,
  Upload,
  Save,
  Eye,
  Copy,
  MapPin,
  TrendingUp,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */
const PROPERTY_SITE_BASE = "/p"; // Change to "https://" + slug + ".p2v.homes" when DNS is live

/* ─────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────── */
const mcStyles = `
  @keyframes mc-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mc-chip-in {
    from { opacity: 0; transform: translateY(10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes mc-glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.25), 0 0 60px rgba(34, 197, 94, 0.1); }
    50%      { box-shadow: 0 0 28px rgba(34, 197, 94, 0.4),  0 0 80px rgba(34, 197, 94, 0.18); }
  }
  .mc-animate {
    opacity: 0;
    animation: mc-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .mc-chip-animate {
    opacity: 0;
    animation: mc-chip-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .mc-glow-btn {
    animation: mc-glow-pulse 3s ease-in-out infinite;
  }
`;

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface LensSubscription {
  active: boolean;
  plan: string | null;
  analysesUsed: number;
  analysesLimit: number;
  renewsAt: string | null;
}

interface AgentProfile {
  saved_agent_name: string;
  saved_phone: string;
  saved_email: string;
  saved_company: string;
  saved_website: string;
  saved_headshot_url: string | null;
  saved_logo_url: string | null;
}

interface RecentProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  price: number | null;
  special_features: string[] | null;
}

interface PublishedWebsite {
  id: string;
  address: string;
  website_slug: string;
  website_published: boolean;
  website_curated: any;
}

/* ─────────────────────────────────────────────
   Tool definitions (shared by both views)
   ───────────────────────────────────────────── */
interface ToolDef {
  icon: any;
  label: string;
  desc: string;
  href: string;
  color: string;
  bg: string;
  ring: string;
  stat?: string | null;
  badge?: string;
  badgeColor?: string;
  locked?: boolean;
}

/* ═══════════════════════════════════════════════
   MAIN PAGE EXPORT
   ═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [subscription, setSubscription] = useState<LensSubscription>({
    active: false, plan: null, analysesUsed: 0, analysesLimit: 200, renewsAt: null,
  });
  const [agentProfile, setAgentProfile] = useState<AgentProfile>({
    saved_agent_name: "", saved_phone: "", saved_email: "", saved_company: "",
    saved_website: "", saved_headshot_url: null, saved_logo_url: null,
  });
  const [coachSessionCount, setCoachSessionCount] = useState(0);
  const [descriptionCount, setDescriptionCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [publishedWebsites, setPublishedWebsites] = useState<PublishedWebsite[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFreePrize, setIsFreePrize] = useState(false);
  const [freeLensDaysLeft, setFreeLensDaysLeft] = useState<number | null>(null);
  const [freeLensExpired, setFreeLensExpired] = useState(false);
  const [signupPrizeCode, setSignupPrizeCode] = useState<string | null>(null);
  const [signupPrizeLabel, setSignupPrizeLabel] = useState("");
  const [hasDirectoryListing, setHasDirectoryListing] = useState<boolean | null>(null);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<AgentProfile>({ ...agentProfile });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Active tab for tools vs quick links
  const [activeTab, setActiveTab] = useState<"tools" | "coming-soon">("tools");

  // Subscribe banner dismiss (resets each visit — intentional gentle reminder)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setIsLoading(false); return; }

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "",
      });

      const isAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email);

      const { data: usage } = await supabase
        .from("lens_usage")
        .select("*, signup_prize_code")
        .eq("user_id", authUser.id)
        .single();

      // Agent profile
      if (usage) {
        const profile: AgentProfile = {
          saved_agent_name: usage.saved_agent_name || "",
          saved_phone: usage.saved_phone || "",
          saved_email: usage.saved_email || "",
          saved_company: usage.saved_company || "",
          saved_website: usage.saved_website || "",
          saved_headshot_url: usage.saved_headshot_url || null,
          saved_logo_url: usage.saved_logo_url || null,
        };
        setAgentProfile(profile);
        setProfileForm(profile);
        if (usage.signup_prize_code) {
          setSignupPrizeCode(usage.signup_prize_code);
          setSignupPrizeLabel("Discount on your first order");
        }
      }

      const { data: sessions } = await supabase
        .from("lens_sessions")
        .select("total_analyses")
        .eq("user_id", authUser.id);
      const totalFromSessions = (sessions || []).reduce((sum: number, s: { total_analyses: number | null }) => sum + (s.total_analyses || 0), 0);
      const totalAnalyses = Math.max(usage?.total_analyses || 0, totalFromSessions);

      if (isAdmin) {
        setSubscription({ active: true, plan: "Admin", analysesUsed: totalAnalyses, analysesLimit: 200, renewsAt: null });
      } else if (usage?.is_subscriber) {
        if (usage.subscription_tier === "free_prize" && usage.free_lens_expires_at) {
          const expiresAt = new Date(usage.free_lens_expires_at);
          const msLeft = expiresAt.getTime() - Date.now();
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            setFreeLensExpired(true);
            await supabase.from("lens_usage").update({ is_subscriber: false, subscription_tier: null }).eq("user_id", authUser.id);
            setSubscription({ active: false, plan: null, analysesUsed: totalAnalyses, analysesLimit: 200, renewsAt: null });
          } else {
            setIsFreePrize(true);
            setFreeLensDaysLeft(daysLeft);
            setSubscription({ active: true, plan: "Free Month", analysesUsed: totalAnalyses, analysesLimit: 200, renewsAt: null });
          }
        } else {
          setSubscription({ active: true, plan: usage.subscription_tier || "Individual", analysesUsed: totalAnalyses, analysesLimit: 200, renewsAt: null });
        }
      }

      const { count: sessionCount } = await supabase.from("lens_sessions").select("*", { count: "exact", head: true }).eq("user_id", authUser.id);
      setCoachSessionCount(sessionCount || 0);

      const { count: descCount } = await supabase.from("lens_descriptions").select("*", { count: "exact", head: true }).eq("user_id", authUser.id);
      setDescriptionCount(descCount || 0);

      const { count: propCount } = await supabase.from("agent_properties").select("*", { count: "exact", head: true }).eq("user_id", authUser.id);
      setPropertyCount(propCount || 0);

      // Recent properties for quick links
      const { data: props } = await supabase
        .from("agent_properties")
        .select("id, address, city, state, status, bedrooms, bathrooms, sqft, price, special_features")
        .eq("user_id", authUser.id)
        .is("merged_into_id", null)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (props) setRecentProperties(props);

      // Published property websites
      const { data: publishedSites } = await supabase
        .from("agent_properties")
        .select("id, address, website_slug, website_published, website_curated")
        .eq("user_id", authUser.id)
        .eq("website_published", true)
        .is("merged_into_id", null)
        .not("website_slug", "is", null)
        .order("updated_at", { ascending: false })
        .limit(6);
      if (publishedSites) setPublishedWebsites(publishedSites);

      // Directory listing check
      try {
        const res = await fetch("/api/directory/me");
        const data = await res.json();
        setHasDirectoryListing(data.success && !!data.photographer);
      } catch { setHasDirectoryListing(false); }

      setIsLoading(false);
    };
    init();
  }, []);

  /* ─── Copy link handler ─── */
  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  /* ─── Get hero image from website_curated ─── */
  const getHeroImage = (curated: any): string | null => {
    if (!curated) return null;
    if (Array.isArray(curated) && curated.length > 0) return typeof curated[0] === "string" ? curated[0] : curated[0]?.url || null;
    if (curated.photos && Array.isArray(curated.photos) && curated.photos.length > 0) return typeof curated.photos[0] === "string" ? curated.photos[0] : curated.photos[0]?.url || null;
    if (curated.hero && Array.isArray(curated.hero) && curated.hero.length > 0) return typeof curated.hero[0] === "string" ? curated.hero[0] : curated.hero[0]?.url || null;
    return null;
  };

  /* ─── Profile save ─── */
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.from("lens_usage").upsert({
      user_id: user.id,
      saved_agent_name: profileForm.saved_agent_name,
      saved_phone: profileForm.saved_phone,
      saved_email: profileForm.saved_email,
      saved_company: profileForm.saved_company,
      saved_website: profileForm.saved_website,
    }, { onConflict: "user_id" });
    setAgentProfile({ ...profileForm });
    setEditingProfile(false);
    setSavingProfile(false);
  };

  /* ─── Profile image upload ─── */
  const handleProfileImageUpload = async (file: File, field: "saved_headshot_url" | "saved_logo_url", setLoading: (v: boolean) => void) => {
    if (!user) return;
    setLoading(true);
    try {
      const sigRes = await fetch("/api/cloudinary-signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: "photo2video/design-studio" }) });
      const sigData = await sigRes.json();
      if (!sigData.success) throw new Error("Signature failed");
      const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
      const fd = new FormData();
      fd.append("file", file); fd.append("api_key", apiKey); fd.append("timestamp", timestamp.toString()); fd.append("signature", signature); fd.append("folder", folder); fd.append("resource_type", "auto");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: "POST", body: fd });
      const result = await res.json();
      if (result.secure_url) {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        await supabase.from("lens_usage").upsert({ user_id: user.id, [field]: result.secure_url }, { onConflict: "user_id" });
        setAgentProfile(prev => ({ ...prev, [field]: result.secure_url }));
        setProfileForm(prev => ({ ...prev, [field]: result.secure_url }));
      }
    } catch (err) { console.error("Upload error:", err); }
    setLoading(false);
  };

  /* ─── Build property query string for quick links ─── */
  const buildQs = (prop: RecentProperty) => {
    const p = new URLSearchParams();
    p.set("propertyId", prop.id);
    if (prop.address) p.set("address", prop.address);
    if (prop.city) p.set("city", prop.city);
    if (prop.state) p.set("state", prop.state);
    if (prop.bedrooms) p.set("beds", prop.bedrooms.toString());
    if (prop.bathrooms) p.set("baths", prop.bathrooms.toString());
    if (prop.sqft) p.set("sqft", prop.sqft.toString());
    if (prop.price) p.set("price", prop.price.toString());
    if (prop.special_features?.length) p.set("specialFeatures", prop.special_features.join(", "));
    return p.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <style dangerouslySetInnerHTML={{ __html: mcStyles }} />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  const getTimeOfDay = () => { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; };
  const firstName = user?.name?.split(" ")[0] || "there";
  const usagePercent = subscription.analysesLimit > 0 ? Math.round((subscription.analysesUsed / subscription.analysesLimit) * 100) : 0;
  const isSubscriber = subscription.active && !!user;

  /* ─────────────────────────────────────────────
     Tools array — shared definition with gating
     ───────────────────────────────────────────── */
  const tools: ToolDef[] = isSubscriber ? [
    // Subscriber tools — no badges, no locks
    { icon: Camera, label: "Photo Coach", desc: "AI-powered photo scoring & feedback", href: "/dashboard/lens/coach", color: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/20", stat: coachSessionCount > 0 ? `${coachSessionCount} session${coachSessionCount !== 1 ? "s" : ""}` : null },
    { icon: PenTool, label: "Design Studio", desc: "Marketing graphics, remix clips, listing flyers", href: "/dashboard/lens/design-studio", color: "text-indigo-400", bg: "bg-indigo-400/10", ring: "ring-indigo-400/20" },
    { icon: Crosshair, label: "Drone Mark", desc: "Annotate aerial photos with lot lines & pins", href: "/dashboard/lens/dronemark", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20" },
    { icon: MessageSquare, label: "Description Writer", desc: "MLS-ready listing copy from your photos", href: "/dashboard/lens/descriptions", color: "text-sky-400", bg: "bg-sky-400/10", ring: "ring-sky-400/20", stat: descriptionCount > 0 ? `${descriptionCount} description${descriptionCount !== 1 ? "s" : ""}` : null },
    { icon: Sofa, label: "Virtual Staging", desc: "Furnish empty rooms with AI in seconds", href: "/dashboard/lens/staging", color: "text-violet-400", bg: "bg-violet-400/10", ring: "ring-violet-400/20" },
    { icon: FileText, label: "Reports", desc: "Branded buyer & seller guides", href: "/dashboard/lens/reports", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20", badge: "PRO", badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    { icon: Film, label: "Quick Videos", desc: "Short clips from $4.95/clip", href: "/order", color: "text-teal-400", bg: "bg-teal-400/10", ring: "ring-teal-400/20" },
  ] : [
    // Non-subscriber tools — open, free-use, or locked
    { icon: Video, label: "Order a Video", desc: "Cinematic listing walkthrough from $79", href: "/order", color: "text-cyan-400", bg: "bg-cyan-400/10", ring: "ring-cyan-400/20" },
    { icon: Film, label: "Video Remix", desc: "Recut your clips into new videos — free forever", href: "/dashboard/lens/remix", color: "text-purple-400", bg: "bg-purple-400/10", ring: "ring-purple-400/20" },
    { icon: Camera, label: "Photo Coach", desc: "AI-powered photo scoring & feedback", href: "/dashboard/lens/coach", color: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/20", badge: "3 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20", stat: coachSessionCount > 0 ? `${coachSessionCount} session${coachSessionCount !== 1 ? "s" : ""}` : null },
    { icon: MessageSquare, label: "Description Writer", desc: "MLS-ready listing copy from your photos", href: "/dashboard/lens/descriptions", color: "text-sky-400", bg: "bg-sky-400/10", ring: "ring-sky-400/20", badge: "1 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20", stat: descriptionCount > 0 ? `${descriptionCount} description${descriptionCount !== 1 ? "s" : ""}` : null },
    { icon: Sofa, label: "Virtual Staging", desc: "Furnish empty rooms with AI in seconds", href: "/dashboard/lens/staging", color: "text-violet-400", bg: "bg-violet-400/10", ring: "ring-violet-400/20", badge: "1 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
    { icon: PenTool, label: "Design Studio", desc: "Marketing graphics, flyers, yard signs", href: "/dashboard/lens/design-studio", color: "text-indigo-400", bg: "bg-indigo-400/10", ring: "ring-indigo-400/20", badge: "1 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
    { icon: ImageIcon, label: "Listing Flyer", desc: "Print-ready flyers from your photos", href: "/dashboard/lens/design-studio", color: "text-orange-400", bg: "bg-orange-400/10", ring: "ring-orange-400/20", badge: "1 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
    { icon: Crosshair, label: "Drone Mark", desc: "Annotate aerial photos with lot lines & pins", href: "/dashboard/lens/dronemark", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20", badge: "1 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
    { icon: MapPin, label: "Location Value Score", desc: "Neighborhood insights for your listing", href: "/dashboard/lens/location-score", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20", badge: "1 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
    { icon: TrendingUp, label: "Value Boost Report", desc: "ROI-ranked improvement suggestions", href: "/dashboard/lens/value-boost", color: "text-rose-400", bg: "bg-rose-400/10", ring: "ring-rose-400/20", badge: "1 FREE", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
    // Locked tools
    { icon: Zap, label: "Quick Videos", desc: "$4.95/clip — subscribe to unlock", href: "/lens", color: "text-teal-400", bg: "bg-teal-400/10", ring: "ring-teal-400/20", badge: "LENS", badgeColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", locked: true },
    { icon: FileText, label: "Custom Reports", desc: "Branded buyer & seller guides", href: "/lens", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20", badge: "PRO", badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20", locked: true },
    { icon: Globe, label: "Property Websites", desc: "Single-property sites with your branding", href: "/lens", color: "text-sky-400", bg: "bg-sky-400/10", ring: "ring-sky-400/20", badge: "PRO", badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20", locked: true },
    { icon: User, label: "Agent Websites", desc: "Your own agent marketing page", href: "/lens", color: "text-pink-400", bg: "bg-pink-400/10", ring: "ring-pink-400/20", badge: "PRO", badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20", locked: true },
    { icon: Building2, label: "Property Portfolio", desc: "Showcase all your listings in one place", href: "/lens", color: "text-lime-400", bg: "bg-lime-400/10", ring: "ring-lime-400/20", badge: "LENS", badgeColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", locked: true },
  ];

  const comingSoonTools = [
    { icon: ImageIcon, label: "Photo Enhancement", desc: "AI brightness, color, and white balance correction", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
    { icon: Percent, label: "10% Off Every Video", desc: "Automatic subscriber discount at checkout", color: "text-green-400", bg: "bg-green-400/10", ring: "ring-green-400/20" },
    { icon: Zap, label: "Priority Delivery", desc: "12-hour turnaround — subscribers go first", color: "text-yellow-400", bg: "bg-yellow-400/10", ring: "ring-yellow-400/20" },
  ];

  /* ═══════════════════════════════════════════════════════════════
     SHARED DARK DASHBOARD — used by both subscriber & non-subscriber
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <style dangerouslySetInnerHTML={{ __html: mcStyles }} />
      {user && <SignupSpin userId={user.id} />}
      {!isSubscriber && <LensConversionTracker />}

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 15% 20%, rgba(56,189,248,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(99,102,241,0.04) 0%, transparent 60%)" }} />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* ═══ HEADER ═══ */}
        <div className="mc-animate flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: "0.05s" }}>
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              {getTimeOfDay()}, <span className="text-cyan-400">{firstName}</span>
            </h1>
            <p className="mt-0.5 text-sm text-white/40">P2V Lens · {isSubscriber ? "Mission Control" : "Dashboard"}</p>
          </div>
          <div className="flex items-center gap-3">
            {isSubscriber ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 backdrop-blur-sm">
                <Crown className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-white/80">{subscription.plan}</span>
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">Active</span>
              </div>
            ) : (
              <Link href="/lens">
                <Button size="sm" className="mc-glow-btn bg-green-500 hover:bg-green-400 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl">
                  Subscribe — $27.95/mo
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ═══ SIGNUP PRIZE ═══ */}
        {signupPrizeCode && (
          <div className="mc-animate mt-4 rounded-xl border border-green-400/20 bg-green-400/[0.06] p-4 flex items-center gap-3" style={{ animationDelay: "0.08s" }}>
            <Gift className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div>
              <span className="text-sm font-bold text-green-300">{signupPrizeLabel}</span>
              <span className="ml-2 text-sm text-green-400/70">Code: <span className="font-mono font-bold bg-green-400/10 px-1.5 py-0.5 rounded text-green-300">{signupPrizeCode}</span></span>
            </div>
          </div>
        )}

        {/* ═══ SUBSCRIBE BANNER — non-subscribers only ═══ */}
        {!isSubscriber && !bannerDismissed && (
          <div className="mc-animate mt-4 rounded-xl border border-green-400/15 bg-green-400/[0.04] p-5 relative" style={{ animationDelay: "0.08s" }}>
            <button onClick={() => setBannerDismissed(true)} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors"><X className="h-4 w-4" /></button>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white/90">Unlock unlimited access to all tools</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Subscribe to P2V Lens for $27.95/mo and get unlimited photo coaching, design exports, descriptions, staging, and 10% off every video order.</p>
                <div className="flex items-center gap-3 mt-3">
                  <Link href="/lens"><Button size="sm" className="bg-green-500 hover:bg-green-400 text-white font-bold text-xs px-4 py-2 rounded-lg">Explore P2V Lens <ArrowRight className="ml-1.5 h-3 w-3" /></Button></Link>
                  <Link href="/lens#features" className="text-xs font-semibold text-green-400/60 hover:text-green-400 transition-colors">See what&apos;s included</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FREE LENS EXPIRED — non-subscriber who had a free month ═══ */}
        {freeLensExpired && !isSubscriber && (
          <div className="mc-animate mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-400" />
                <span className="text-sm font-bold text-red-300">Your free month has ended</span>
                <span className="text-xs text-white/40">Subscribe to continue using all features.</span>
              </div>
              <Link href="/lens"><Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs">Subscribe — $27.95/mo</Button></Link>
            </div>
          </div>
        )}

        {/* ═══ FREE PRIZE COUNTDOWN — subscriber on free month ═══ */}
        {isFreePrize && freeLensDaysLeft !== null && isSubscriber && (
          <div className={`mc-animate mt-4 rounded-xl border p-4 ${freeLensDaysLeft <= 5 ? "border-amber-400/20 bg-amber-400/[0.06]" : "border-cyan-400/15 bg-cyan-400/[0.04]"}`} style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className={`h-4 w-4 ${freeLensDaysLeft <= 5 ? "text-amber-400" : "text-cyan-400"}`} />
                <span className="text-sm font-bold text-white/90">Free Lens Month</span>
                <span className={`text-sm font-bold ${freeLensDaysLeft <= 5 ? "text-amber-400" : "text-cyan-400"}`}>{freeLensDaysLeft} day{freeLensDaysLeft !== 1 ? "s" : ""} left</span>
              </div>
              {freeLensDaysLeft <= 5 && <Link href="/lens"><Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs">Subscribe — $27.95/mo</Button></Link>}
            </div>
          </div>
        )}

        {/* ═══ AGENT PROFILE CARD ═══ */}
        <div className="mc-animate mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/30">Agent Profile</p>
            <button onClick={() => { if (editingProfile) handleSaveProfile(); else { setProfileForm({ ...agentProfile }); setEditingProfile(true); } }}
              className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400/70 hover:text-cyan-400 transition-colors">
              {editingProfile ? (savingProfile ? <><Loader2 className="h-3 w-3 animate-spin" />Saving...</> : <><Save className="h-3 w-3" />Save</>) : <><Pencil className="h-3 w-3" />Edit</>}
            </button>
          </div>
          <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
            {/* Headshot */}
            <div className="relative group flex-shrink-0">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.08]">
                {agentProfile.saved_headshot_url ? <img src={agentProfile.saved_headshot_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="h-6 w-6 text-white/20" /></div>}
              </div>
              <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingHeadshot ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Upload className="h-4 w-4 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleProfileImageUpload(f, "saved_headshot_url", setUploadingHeadshot); e.target.value = ""; }} />
              </label>
            </div>
            {/* Info */}
            {editingProfile ? (
              <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                <div><label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Name</label><input value={profileForm.saved_agent_name} onChange={e => setProfileForm(p => ({ ...p, saved_agent_name: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/30 focus:outline-none" placeholder="Jane Smith" /></div>
                <div><label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Company</label><input value={profileForm.saved_company} onChange={e => setProfileForm(p => ({ ...p, saved_company: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/30 focus:outline-none" placeholder="Coldwell Banker" /></div>
                <div><label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Phone</label><input value={profileForm.saved_phone} onChange={e => setProfileForm(p => ({ ...p, saved_phone: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/30 focus:outline-none" placeholder="(555) 123-4567" /></div>
                <div><label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Email</label><input value={profileForm.saved_email} onChange={e => setProfileForm(p => ({ ...p, saved_email: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/30 focus:outline-none" placeholder="jane@email.com" /></div>
                <div className="col-span-2"><label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Website</label><input value={profileForm.saved_website} onChange={e => setProfileForm(p => ({ ...p, saved_website: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/30 focus:outline-none" placeholder="www.janesmith.com" /></div>
                <button onClick={() => setEditingProfile(false)} className="text-xs text-white/30 hover:text-white/50 transition-colors">Cancel</button>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-base font-bold text-white/90">{agentProfile.saved_agent_name || "Add your name"}</p>
                  {agentProfile.saved_company && <span className="text-xs text-white/40">{agentProfile.saved_company}</span>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                  {agentProfile.saved_phone && <span className="flex items-center gap-1.5 text-xs text-white/50"><Phone className="h-3 w-3 text-cyan-400/50" />{agentProfile.saved_phone}</span>}
                  {agentProfile.saved_email && <span className="flex items-center gap-1.5 text-xs text-white/50"><Mail className="h-3 w-3 text-cyan-400/50" />{agentProfile.saved_email}</span>}
                  {agentProfile.saved_website && <span className="flex items-center gap-1.5 text-xs text-white/50"><Globe className="h-3 w-3 text-cyan-400/50" />{agentProfile.saved_website}</span>}
                </div>
                {!agentProfile.saved_agent_name && !agentProfile.saved_phone && (
                  <p className="text-xs text-white/25 mt-1">Complete your profile — it auto-fills your marketing tools, branding cards, and reports.</p>
                )}
              </div>
            )}
            {/* Logo */}
            <div className="relative group flex-shrink-0 hidden sm:block">
              <div className="h-12 w-20 rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                {agentProfile.saved_logo_url ? <img src={agentProfile.saved_logo_url} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-[9px] text-white/15 font-bold">LOGO</span>}
              </div>
              <label className="absolute inset-0 rounded-lg cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingLogo ? <Loader2 className="h-3 w-3 text-white animate-spin" /> : <Upload className="h-3 w-3 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleProfileImageUpload(f, "saved_logo_url", setUploadingLogo); e.target.value = ""; }} />
              </label>
            </div>
          </div>
        </div>

        {/* ═══ QUICK-LINK BUTTONS (replaces old Stats Row + Quick Actions) ═══ */}
        <div className={`mc-animate mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 ${publishedWebsites.length > 0 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`} style={{ animationDelay: "0.16s" }}>
          <Link href="/order" className="group flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4 transition-all hover:border-cyan-400/25 hover:bg-cyan-400/[0.08]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
              <Play className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Order a Video</p>
              <p className="mt-0.5 text-xs text-white/40">From <span className="font-bold text-cyan-400">{isSubscriber ? "$4.95/clip" : "$79"}</span></p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-cyan-400 transition-all group-hover:translate-x-0.5" />
          </Link>
          <Link href="/dashboard/properties" className="group flex items-center gap-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4 transition-all hover:border-emerald-400/25 hover:bg-emerald-400/[0.08]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <Home className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">My Properties</p>
              <p className="mt-0.5 text-xs text-white/40">{propertyCount > 0 ? `${propertyCount} propert${propertyCount === 1 ? "y" : "ies"}` : "Add your first"}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-emerald-400 transition-all group-hover:translate-x-0.5" />
          </Link>
          <Link href="/dashboard/videos" className="group flex items-center gap-4 rounded-2xl border border-purple-400/10 bg-purple-400/[0.04] p-4 transition-all hover:border-purple-400/25 hover:bg-purple-400/[0.08]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-400/10 ring-1 ring-purple-400/20">
              <Video className="h-5 w-5 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">My Videos</p>
              <p className="mt-0.5 text-xs text-white/40">View & download</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-purple-400 transition-all group-hover:translate-x-0.5" />
          </Link>
          <button onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="group flex items-center gap-4 rounded-2xl border border-indigo-400/10 bg-indigo-400/[0.04] p-4 transition-all hover:border-indigo-400/25 hover:bg-indigo-400/[0.08] text-left w-full">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 ring-1 ring-indigo-400/20">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Tools</p>
              <p className="mt-0.5 text-xs text-white/40">Jump to tools ↓</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5" />
          </button>
          {publishedWebsites.length > 0 && (
            <button onClick={() => document.getElementById("websites")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="group flex items-center gap-4 rounded-2xl border border-sky-400/10 bg-sky-400/[0.04] p-4 transition-all hover:border-sky-400/25 hover:bg-sky-400/[0.08] text-left w-full">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 ring-1 ring-sky-400/20">
                <Globe className="h-5 w-5 text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">Websites</p>
                <p className="mt-0.5 text-xs text-white/40">{publishedWebsites.length} live site{publishedWebsites.length !== 1 ? "s" : ""}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-sky-400 transition-all group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {/* ═══ PROPERTY WEBSITES ═══ */}
        {publishedWebsites.length > 0 && (
          <div id="websites" className="mc-animate mt-8" style={{ animationDelay: "0.18s" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white/30">Your Property Websites</p>
              <Link href="/dashboard/properties" className="text-xs font-semibold text-cyan-400/60 hover:text-cyan-400 transition-colors">Manage all →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {publishedWebsites.map((site, i) => {
                const heroUrl = getHeroImage(site.website_curated);
                const siteUrl = `${PROPERTY_SITE_BASE}/${site.website_slug}`;
                return (
                  <div
                    key={site.id}
                    className="mc-chip-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]"
                    style={{ animationDelay: `${0.2 + i * 0.06}s` }}
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      {heroUrl ? (
                        <img src={heroUrl} alt={site.address} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(99,102,241,0.2) 50%, rgba(168,85,247,0.15) 100%)" }} />
                      )}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-400">Live</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Your Property Website</p>
                      <p className="text-sm font-bold text-white/90 truncate">{site.address}</p>
                      <p className="text-[11px] text-cyan-400/60 truncate mt-0.5">{site.website_slug}.p2v.homes</p>
                    </div>
                    <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-3">
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-white text-[11px] font-bold rounded-full px-3.5 py-1.5 transition-colors"><Eye className="h-3 w-3" />View Live Page</a>
                      <button onClick={() => handleCopyLink(site.website_slug)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors">
                        {copiedSlug === site.website_slug ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied!</span></> : <><Copy className="h-3 w-3" />Copy Link</>}
                      </button>
                      <Link href={`/dashboard/properties/${site.id}`} className="ml-auto text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors">Edit Settings →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TABS ═══ */}
        <div id="tools" className="mc-animate mt-10 flex items-center gap-1 border-b border-white/[0.06]" style={{ animationDelay: "0.24s" }}>
          {[{ id: "tools" as const, label: "Your Tools" }, { id: "coming-soon" as const, label: "Coming Soon" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2.5 text-sm font-bold transition-colors relative ${activeTab === t.id ? "text-cyan-400" : "text-white/40 hover:text-white/60"}`}>
              {t.label}
              {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
            </button>
          ))}
        </div>

        {/* ═══ TOOLS GRID ═══ */}
        {activeTab === "tools" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <Link
                key={tool.label}
                href={tool.href}
                className={`mc-chip-animate group relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-white/[0.06] ${tool.locked ? "opacity-60" : ""}`}
                style={{ animationDelay: `${0.28 + i * 0.05}s` }}
              >
                {/* Badge */}
                {tool.badge && (
                  <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tool.badgeColor || "text-amber-400 bg-amber-400/10 border-amber-400/20"}`}>
                    {tool.locked && <Lock className="inline h-2.5 w-2.5 mr-0.5" />}
                    {tool.badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} transition-transform group-hover:scale-110`}><tool.icon className={`h-5 w-5 ${tool.color}`} /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white/90 group-hover:text-cyan-300 transition-colors">{tool.label}</p>
                    {tool.stat && <p className="text-[11px] font-medium text-white/30">{tool.stat}</p>}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-white/40">{tool.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400/60 group-hover:text-cyan-400 transition-colors mt-auto pt-1">
                  {tool.locked ? <>Unlock<Lock className="h-3 w-3" /></> : <>Open<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></>}
                </span>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "coming-soon" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {comingSoonTools.map((tool, i) => (
              <div key={tool.label} className="mc-chip-animate flex items-start gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 opacity-70" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring}`}><tool.icon className={`h-5 w-5 ${tool.color}`} /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><p className="text-sm font-bold text-white/70">{tool.label}</p><span className="text-[9px] font-bold uppercase tracking-wider text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded-full">Coming Soon</span></div>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ RECENT PROPERTIES — quick links with auto-fill ═══ */}
        {recentProperties.length > 0 && (
          <div className="mc-animate mt-10" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white/30">Recent Properties — Quick Actions</p>
              <Link href="/dashboard/properties" className="text-xs font-semibold text-cyan-400/60 hover:text-cyan-400 transition-colors">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentProperties.map(prop => {
                const qs = buildQs(prop);
                return (
                  <div key={prop.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/dashboard/properties/${prop.id}`} className="text-sm font-bold text-white/80 hover:text-cyan-300 transition-colors truncate">{prop.address}</Link>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${prop.status === "active" ? "bg-green-400/20 text-green-300" : prop.status === "sold" ? "bg-blue-400/20 text-blue-300" : "bg-white/10 text-white/40"}`}>{prop.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`/order?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-400/[0.06] border border-cyan-400/10 text-[10px] font-semibold text-cyan-400/80 hover:bg-cyan-400/[0.12] hover:text-cyan-300 transition-all"><Video className="h-3 w-3" />Order Video</Link>
                      <Link href={`/dashboard/lens/coach?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-400/[0.06] border border-blue-400/10 text-[10px] font-semibold text-blue-400/80 hover:bg-blue-400/[0.12] hover:text-blue-300 transition-all"><Camera className="h-3 w-3" />Coach</Link>
                      <Link href={`/dashboard/lens/descriptions?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-400/[0.06] border border-sky-400/10 text-[10px] font-semibold text-sky-400/80 hover:bg-sky-400/[0.12] hover:text-sky-300 transition-all"><FileText className="h-3 w-3" />Description</Link>
                      <Link href={`/dashboard/lens/design-studio?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-400/[0.06] border border-indigo-400/10 text-[10px] font-semibold text-indigo-400/80 hover:bg-indigo-400/[0.12] hover:text-indigo-300 transition-all"><PenTool className="h-3 w-3" />Design</Link>
                      <Link href={`/dashboard/lens/staging?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-400/[0.06] border border-violet-400/10 text-[10px] font-semibold text-violet-400/80 hover:bg-violet-400/[0.12] hover:text-violet-300 transition-all"><Sofa className="h-3 w-3" />Stage</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ MORE TOOLS — Realtor & Photographer links ═══ */}
        <div className="mc-animate mt-10" style={{ animationDelay: "0.55s" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">More Tools & Resources</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Video, label: "My Videos", desc: "Watch, download & share", href: "/dashboard/videos" },
              { icon: FileText, label: "Saved Drafts", desc: "Resume unfinished orders", href: "/dashboard/drafts" },
              { icon: RefreshCw, label: "Request Revisions", desc: "Recut clips & update", href: "/dashboard/videos" },
              { icon: BarChart3, label: "Order History", desc: "Track all your orders", href: "/dashboard/videos" },
              { icon: Star, label: "Leave Reviews", desc: "Earn up to 25% off", href: "/dashboard/reviews" },
              { icon: DollarSign, label: "Referral Program", desc: "Earn 20% commission", href: "/dashboard/referral-earnings" },
              { icon: Building2, label: "Brokerage Dashboard", desc: "Team usage & billing", href: "/dashboard/brokerage" },
              ...(hasDirectoryListing ? [
                { icon: Edit, label: "Edit Directory Listing", desc: "Update your profile", href: "/directory/edit" },
                { icon: BarChart3, label: "Directory Analytics", desc: "Views & inquiries", href: "/dashboard/directory-analytics" },
              ] : [
                { icon: UserPlus, label: "Join the Directory", desc: "Get discovered by agents", href: "/directory/join" },
              ]),
              { icon: BookOpen, label: "Photography Guide", desc: "32-page free guide", href: "/resources/photography-guide" },
            ].map((item, i) => (
              <Link key={item.label} href={item.href} className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all hover:border-cyan-400/15 hover:bg-white/[0.05]">
                <item.icon className="h-4 w-4 text-cyan-400/40 group-hover:text-cyan-400/70 transition-colors flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white/60 group-hover:text-cyan-300 transition-colors">{item.label}</p>
                  <p className="text-[10px] text-white/25">{item.desc}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-white/15 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* ═══ PERKS SECTION — subscriber sees current perks, non-subscriber sees what they'd unlock ═══ */}
        <div className="mc-animate mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm" style={{ animationDelay: "0.6s" }}>
          {isSubscriber ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Your Subscriber Perks</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: Percent, text: "10% off every video order" },
                  { icon: ImageIcon, text: "Free photo enhancement" },
                  { icon: Clock, text: "Priority 12hr processing" },
                  { icon: Film, text: "Quick Videos from $4.95/clip" },
                  { icon: ShieldCheck, text: "Satisfaction guarantee" },
                ].map((perk) => (
                  <div key={perk.text} className="flex items-center gap-2 text-xs text-white/45">
                    <perk.icon className="h-3 w-3 text-cyan-400/50" />{perk.text}
                  </div>
                ))}
              </div>
              {/* Photo Analyses usage inline */}
              <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-cyan-400/40" />
                <span className="text-xs text-white/30">Photo Analyses: <span className="font-bold text-white/50">{subscription.analysesUsed}/{subscription.analysesLimit}</span></span>
                <div className="h-1 w-20 rounded-full bg-white/[0.06] overflow-hidden ml-1">
                  <div className={`h-full rounded-full ${usagePercent > 95 ? "bg-red-400" : usagePercent > 80 ? "bg-amber-400" : "bg-cyan-400"}`} style={{ width: `${Math.max(Math.min(usagePercent, 100), 2)}%` }} />
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">What You Get with P2V Lens — $27.95/mo</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4">
                {[
                  "Unlimited Photo Coach sessions",
                  "Unlimited Design Studio exports",
                  "Unlimited descriptions & staging",
                  "Quick Videos from $4.95/clip",
                  "10% off every video order",
                  "Location Value Score & Value Boost",
                  "Priority 12hr processing",
                ].map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-xs text-white/50">
                    <Check className="h-3 w-3 text-green-400/70 flex-shrink-0" />{perk}
                  </div>
                ))}
              </div>
              <Link href="/lens">
                <Button size="sm" className="bg-green-500 hover:bg-green-400 text-white font-bold text-xs px-5 py-2 rounded-lg">
                  Subscribe to P2V Lens <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-white/[0.04] pt-6 pb-8 text-center">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/lens" className="text-xs text-white/25 hover:text-white/50 transition-colors">P2V Lens</Link>
            <Link href="/support" className="text-xs text-white/25 hover:text-white/50 transition-colors">Support</Link>
            <Link href="/portfolio" className="text-xs text-white/25 hover:text-white/50 transition-colors">Portfolio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
