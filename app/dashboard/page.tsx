"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
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
  BookOpen,
  Lock,
  Crown,
  PenTool,
  Crosshair,
  Film,
  Gift,
  Home,
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
  Globe,
  Check,
  X,
  MapPin,
  TrendingUp,
  Sun,
  Moon,
  Settings,
} from "lucide-react";

/* ─── Lazy-loaded components (not needed for initial paint) ─── */
const SignupSpin = dynamic(() => import("@/components/signup-spin").then(m => ({ default: m.SignupSpin })), { ssr: false });
const LensConversionTracker = dynamic(() => import("@/components/lens-conversion-tracker").then(m => ({ default: m.LensConversionTracker })), { ssr: false });

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
  @keyframes mc-start-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.35), 0 0 0 0 rgba(34, 211, 238, 0);
      border-color: rgba(34, 211, 238, 0.4);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.15), 0 0 28px 4px rgba(34, 211, 238, 0.25);
      border-color: rgba(34, 211, 238, 0.6);
    }
  }
  @keyframes mc-start-badge {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-2px); }
  }
  .mc-start-here {
    animation: mc-start-pulse 2.4s ease-in-out infinite;
    border-color: rgba(34, 211, 238, 0.4) !important;
  }
  .mc-start-badge {
    animation: mc-start-badge 2.4s ease-in-out infinite;
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

  /* ── Font size bump — everything one step larger ── */
  .dash-root .text-\[9px\]  { font-size: 11px !important; }
  .dash-root .text-\[10px\] { font-size: 12px !important; }
  .dash-root .text-\[11px\] { font-size: 13px !important; }
  .dash-root .text-xs  { font-size: 14px !important; line-height: 1.55 !important; }
  .dash-root .text-sm  { font-size: 16px !important; line-height: 1.55 !important; }
  .dash-root .text-base { font-size: 18px !important; }
  .dash-root .text-lg  { font-size: 20px !important; }
  .dash-root .text-xl  { font-size: 23px !important; }
  .dash-root .text-2xl { font-size: 28px !important; }
  .dash-root .text-3xl { font-size: 34px !important; }

  /* ── Light mode overrides ── */
  .dashboard-light {
    background: #f1f5f9 !important;
  }
  .dashboard-light .dl-bg-overlay { display: none !important; }

  /* All white text → dark slate */
  .dashboard-light [class*="text-white"] { color: #334155 !important; }
  .dashboard-light h1[class*="text-white"] { color: #0f172a !important; }
  .dashboard-light [class*="font-extrabold"][class*="text-white"] { color: #0f172a !important; }
  .dashboard-light p[class*="text-white\\/90"],
  .dashboard-light p[class*="font-bold"][class*="text-white"] { color: #1e293b !important; }

  /* Keep accent colors readable */
  .dashboard-light [class*="text-cyan-400"] { color: #0891b2 !important; }
  .dashboard-light [class*="text-cyan-300"] { color: #06b6d4 !important; }
  .dashboard-light [class*="text-emerald-400"] { color: #059669 !important; }
  .dashboard-light [class*="text-emerald-300"] { color: #10b981 !important; }
  .dashboard-light [class*="text-purple-400"] { color: #7c3aed !important; }
  .dashboard-light [class*="text-purple-300"] { color: #8b5cf6 !important; }
  .dashboard-light [class*="text-indigo-400"] { color: #4f46e5 !important; }
  .dashboard-light [class*="text-indigo-300"] { color: #6366f1 !important; }
  .dashboard-light [class*="text-sky-400"] { color: #0284c7 !important; }
  .dashboard-light [class*="text-sky-300"] { color: #0ea5e9 !important; }
  .dashboard-light [class*="text-green-400"] { color: #16a34a !important; }
  .dashboard-light [class*="text-green-300"] { color: #22c55e !important; }
  .dashboard-light [class*="text-blue-400"] { color: #2563eb !important; }
  .dashboard-light [class*="text-blue-300"] { color: #3b82f6 !important; }
  .dashboard-light [class*="text-violet-400"] { color: #7c3aed !important; }
  .dashboard-light [class*="text-amber-400"] { color: #d97706 !important; }
  .dashboard-light [class*="text-teal-400"] { color: #0d9488 !important; }
  .dashboard-light [class*="text-rose-400"] { color: #e11d48 !important; }
  .dashboard-light [class*="text-orange-400"] { color: #ea580c !important; }
  .dashboard-light [class*="text-red-400"] { color: #dc2626 !important; }
  .dashboard-light [class*="text-red-300"] { color: #ef4444 !important; }
  .dashboard-light [class*="text-pink-400"] { color: #db2777 !important; }
  .dashboard-light [class*="text-lime-400"] { color: #65a30d !important; }

  /* Backgrounds → white/translucent */
  .dashboard-light [class*="bg-white\\/"] { background-color: rgba(255,255,255,0.75) !important; }
  .dashboard-light [class*="bg-gray-900"] { background-color: #f1f5f9 !important; }
  .dashboard-light [class*="bg-black\\/50"] { background-color: rgba(255,255,255,0.75) !important; }

  /* Borders → light gray */
  .dashboard-light [class*="border-white\\/"] { border-color: rgba(0,0,0,0.08) !important; }

  /* Colored borders — keep but lighter */
  .dashboard-light [class*="border-cyan"] { border-color: rgba(8,145,178,0.2) !important; }
  .dashboard-light [class*="border-emerald"] { border-color: rgba(5,150,105,0.2) !important; }
  .dashboard-light [class*="border-purple"] { border-color: rgba(124,58,237,0.15) !important; }
  .dashboard-light [class*="border-indigo"] { border-color: rgba(79,70,229,0.15) !important; }
  .dashboard-light [class*="border-sky"] { border-color: rgba(2,132,199,0.15) !important; }
  .dashboard-light [class*="border-green"] { border-color: rgba(22,163,74,0.2) !important; }
  .dashboard-light [class*="border-blue"] { border-color: rgba(37,99,235,0.15) !important; }
  .dashboard-light [class*="border-violet"] { border-color: rgba(124,58,237,0.15) !important; }
  .dashboard-light [class*="border-amber"] { border-color: rgba(217,119,6,0.2) !important; }
  .dashboard-light [class*="border-teal"] { border-color: rgba(13,148,136,0.2) !important; }
  .dashboard-light [class*="border-red"] { border-color: rgba(220,38,38,0.2) !important; }

  /* Colored bg accents — keep but lighter */
  .dashboard-light [class*="bg-cyan-400\\/"] { background-color: rgba(8,145,178,0.08) !important; }
  .dashboard-light [class*="bg-cyan-500\\/"] { background-color: rgba(8,145,178,0.08) !important; }
  .dashboard-light [class*="bg-emerald-400\\/"] { background-color: rgba(5,150,105,0.08) !important; }
  .dashboard-light [class*="bg-purple-400\\/"] { background-color: rgba(124,58,237,0.06) !important; }
  .dashboard-light [class*="bg-indigo-400\\/"] { background-color: rgba(79,70,229,0.06) !important; }
  .dashboard-light [class*="bg-sky-400\\/"] { background-color: rgba(2,132,199,0.06) !important; }
  .dashboard-light [class*="bg-green-400\\/"] { background-color: rgba(22,163,74,0.08) !important; }
  .dashboard-light [class*="bg-blue-400\\/"] { background-color: rgba(37,99,235,0.06) !important; }
  .dashboard-light [class*="bg-violet-400\\/"] { background-color: rgba(124,58,237,0.06) !important; }
  .dashboard-light [class*="bg-amber-400\\/"] { background-color: rgba(217,119,6,0.08) !important; }
  .dashboard-light [class*="bg-teal-400\\/"] { background-color: rgba(13,148,136,0.08) !important; }

  /* Solid bg buttons stay solid */
  .dashboard-light .bg-cyan-500 { background-color: #0891b2 !important; }
  .dashboard-light .bg-cyan-500:hover,
  .dashboard-light .bg-cyan-400 { background-color: #06b6d4 !important; }
  .dashboard-light .bg-green-500 { background-color: #16a34a !important; }
  .dashboard-light .bg-green-500:hover,
  .dashboard-light .bg-green-400 { background-color: #22c55e !important; }

  /* Rings */
  .dashboard-light [class*="ring-white\\/"] { --tw-ring-color: rgba(0,0,0,0.06) !important; }
  .dashboard-light [class*="ring-cyan"] { --tw-ring-color: rgba(8,145,178,0.15) !important; }
  .dashboard-light [class*="ring-emerald"] { --tw-ring-color: rgba(5,150,105,0.15) !important; }
  .dashboard-light [class*="ring-purple"] { --tw-ring-color: rgba(124,58,237,0.12) !important; }
  .dashboard-light [class*="ring-indigo"] { --tw-ring-color: rgba(79,70,229,0.12) !important; }
  .dashboard-light [class*="ring-blue"] { --tw-ring-color: rgba(37,99,235,0.12) !important; }
  .dashboard-light [class*="ring-teal"] { --tw-ring-color: rgba(13,148,136,0.15) !important; }

  /* Cards get subtle shadow */
  .dashboard-light .rounded-2xl { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02); }
  .dashboard-light .rounded-xl { box-shadow: 0 1px 2px rgba(0,0,0,0.03); }

  /* Backdrop blur — keep but lighten */
  .dashboard-light [class*="backdrop-blur"] { backdrop-filter: blur(8px); }

  /* Mode toggle */
  .dashboard-light .dl-mode-toggle {
    background: rgba(0,0,0,0.04) !important;
    border-color: rgba(0,0,0,0.1) !important;
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
  hero_image_url?: string | null;
  website_curated?: any;
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
  crown?: "silver" | "gold";
  startHere?: boolean;
}

/* ─────────────────────────────────────────────
   Access gating
   ───────────────────────────────────────────── */
const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

type AccessResult = {
  allowed: boolean;
  reason: "admin" | "pro" | "tools" | "trial" | "video_only" | "free";
  tier: "admin" | "pro" | "tools" | "trial" | "video_only" | "free";
  trialDaysLeft?: number;
  hasVideo?: boolean;
};

function checkAccess(
  email: string,
  lensUsage: any,
  hasPaidOrder: boolean
): AccessResult {
  if (ADMIN_EMAILS.includes(email)) {
    return { allowed: true, reason: "admin", tier: "admin" };
  }
  if (lensUsage?.is_subscriber && lensUsage.subscription_tier === "pro") {
    return { allowed: true, reason: "pro", tier: "pro" };
  }
  if (lensUsage?.is_subscriber && lensUsage.subscription_tier === "tools") {
    return { allowed: true, reason: "tools", tier: "tools" };
  }
 // Legacy subscriber tiers — free_prize is Pro level, others are tools-level
  if (lensUsage?.is_subscriber && lensUsage.subscription_tier === "free_prize") {
    return { allowed: true, reason: "pro", tier: "pro" };
  }
  if (lensUsage?.is_subscriber) {
    return { allowed: true, reason: "tools", tier: "tools" };
  }
  if (lensUsage?.trial_expires_at) {
    const expires = new Date(lensUsage.trial_expires_at);
    if (expires > new Date()) {
      const daysLeft = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { allowed: true, reason: "trial", tier: "trial", trialDaysLeft: daysLeft };
    }
  }
  if (hasPaidOrder) {
    return { allowed: false, reason: "video_only", tier: "video_only", hasVideo: true };
  }
  return { allowed: false, reason: "free", tier: "free", hasVideo: false };
}

const PRO_ONLY_TOOLS = ["location_value_score", "agent_website", "custom_reports"];

function checkToolAccess(toolKey: string, access: AccessResult): {
  canUse: boolean;
  gateType: "none" | "subscribe" | "upgrade_pro" | "buy_video";
} {
  if (access.tier === "admin") return { canUse: true, gateType: "none" };
  if (access.tier === "pro") return { canUse: true, gateType: "none" };
  if (PRO_ONLY_TOOLS.includes(toolKey)) return { canUse: false, gateType: "upgrade_pro" };
  if (access.tier === "tools" || access.tier === "trial") return { canUse: true, gateType: "none" };
  if (toolKey === "video_remix" && access.hasVideo) return { canUse: true, gateType: "none" };
  if (access.tier === "video_only") return { canUse: false, gateType: "subscribe" };
  return { canUse: false, gateType: "buy_video" };
}

/* ═══════════════════════════════════════════════
   MAIN PAGE EXPORT
   ═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [subscription, setSubscription] = useState<LensSubscription>({
    active: false, plan: null, analysesUsed: 0, analysesLimit: 200, renewsAt: null,
  });
  const [coachSessionCount, setCoachSessionCount] = useState(0);
  const [descriptionCount, setDescriptionCount] = useState(0);
  const [enhancementCount, setEnhancementCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [agentWebsite, setAgentWebsite] = useState<{ handle: string; status: string } | null>(null);
  const [coreReady, setCoreReady] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const [isFreePrize, setIsFreePrize] = useState(false);
  const [freeLensDaysLeft, setFreeLensDaysLeft] = useState<number | null>(null);
  const [freeLensExpired, setFreeLensExpired] = useState(false);
  const [signupPrizeCode, setSignupPrizeCode] = useState<string | null>(null);
  const [signupPrizeLabel, setSignupPrizeLabel] = useState("");
  const [hasDirectoryListing, setHasDirectoryListing] = useState<boolean | null>(null);
  const [access, setAccess] = useState<AccessResult>({ allowed: false, reason: "free", tier: "free", hasVideo: false });
  const [hasPaidOrder, setHasPaidOrder] = useState(false);

  // Subscribe banner dismiss (resets each visit — intentional gentle reminder)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Dark/light mode
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      // getSession reads from local token — much faster than getUser which hits network
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setCoreReady(true); return; }
      const authUser = session.user;

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "",
      });

      const isAdmin = authUser.email && ADMIN_EMAILS.includes(authUser.email);

      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber, subscription_tier, free_lens_expires_at, trial_activated_at, trial_expires_at, total_analyses, saved_agent_name, saved_phone, saved_email, saved_company, saved_website, saved_headshot_url, saved_logo_url, signup_prize_code")
        .eq("user_id", authUser.id)
        .single();

      // Signup prize code (profile now lives on /dashboard/profile)
      if (usage?.signup_prize_code) {
        setSignupPrizeCode(usage.signup_prize_code);
        setSignupPrizeLabel("Discount on your first order");
      }

      // ── Check if user has any paid video orders ──
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .eq("payment_status", "paid");
      const hasPaidOrder = (orderCount || 0) > 0;
      setHasPaidOrder(hasPaidOrder);

      // ── Build access result ──
      const accessResult = checkAccess(authUser.email || "", usage, hasPaidOrder);
      setAccess(accessResult);

      // ── Resolve subscription status (needed for tools array) ──
      if (isAdmin) {
        setSubscription({ active: true, plan: "Admin", analysesUsed: usage?.total_analyses || 0, analysesLimit: 200, renewsAt: null });
      } else if (usage?.is_subscriber) {
        if (usage.subscription_tier === "free_prize" && usage.free_lens_expires_at) {
          const expiresAt = new Date(usage.free_lens_expires_at);
          const msLeft = expiresAt.getTime() - Date.now();
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            setFreeLensExpired(true);
            supabase.from("lens_usage").update({ is_subscriber: false, subscription_tier: null }).eq("user_id", authUser.id);
            setSubscription({ active: false, plan: null, analysesUsed: usage?.total_analyses || 0, analysesLimit: 200, renewsAt: null });
          } else {
            setIsFreePrize(true);
            setFreeLensDaysLeft(daysLeft);
            setSubscription({ active: true, plan: "Free Month", analysesUsed: usage?.total_analyses || 0, analysesLimit: 200, renewsAt: null });
          }
        } else {
          setSubscription({ active: true, plan: usage.subscription_tier || "Individual", analysesUsed: usage?.total_analyses || 0, analysesLimit: 200, renewsAt: null });
        }
      }

      // ═══ PHASE 1 DONE — show the dashboard immediately ═══
      setCoreReady(true);

      // ═══ PHASE 2 — load secondary data in background ═══
      const [
        sessionsResult,
        sessionCountResult,
        descCountResult,
        enhanceCountResult,
        propCountResult,
        propsResult,
        agentWebsiteResult,
        directoryResult,
      ] = await Promise.all([
        supabase.from("lens_sessions").select("total_analyses").eq("user_id", authUser.id),
        supabase.from("lens_sessions").select("*", { count: "exact", head: true }).eq("user_id", authUser.id),
        supabase.from("lens_descriptions").select("*", { count: "exact", head: true }).eq("user_id", authUser.id),
        supabase.from("lens_enhancements").select("*", { count: "exact", head: true }).eq("user_id", authUser.id),
        supabase.from("agent_properties").select("*", { count: "exact", head: true }).eq("user_id", authUser.id),
        supabase.from("agent_properties")
          .select("id, address, city, state, status, bedrooms, bathrooms, sqft, price, special_features, website_curated")
          .eq("user_id", authUser.id).is("merged_into_id", null)
          .order("updated_at", { ascending: false }).limit(5),
        supabase.from("agent_websites")
          .select("handle, status")
          .eq("user_id", authUser.id)
          .limit(1),
        fetch("/api/directory/me").then(r => r.json()).catch(() => ({ success: false })),
      ]);

      // Update analyses count with session data
      const totalFromSessions = (sessionsResult.data || []).reduce((sum: number, s: { total_analyses: number | null }) => sum + (s.total_analyses || 0), 0);
      const totalAnalyses = Math.max(usage?.total_analyses || 0, totalFromSessions);
      setSubscription(prev => ({ ...prev, analysesUsed: totalAnalyses }));

      setCoachSessionCount(sessionCountResult.count || 0);
      setDescriptionCount(descCountResult.count || 0);
      setEnhancementCount(enhanceCountResult.count || 0);
      setPropertyCount(propCountResult.count || 0);
      if (propsResult.data) setRecentProperties(propsResult.data);
      if (agentWebsiteResult.data && agentWebsiteResult.data.length > 0) {
        setAgentWebsite(agentWebsiteResult.data[0]);
      }
      setHasDirectoryListing(directoryResult.success && !!directoryResult.photographer);

      setSecondaryLoaded(true);
    };
    init();
  }, []);

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

  /* ─── Pull the first usable image out of a property's website_curated blob ─── */
  const getPropertyThumb = (prop: RecentProperty): string | null => {
    if (prop.hero_image_url) return prop.hero_image_url;
    const curated = prop.website_curated;
    if (!curated) return null;
    const extract = (arr: any): string | null => {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const first = arr[0];
      if (typeof first === "string") return first;
      return first?.url || first?.secure_url || null;
    };
    if (Array.isArray(curated)) return extract(curated);
    return extract(curated.photos) || extract(curated.hero) || extract(curated.images) || null;
  };

  if (!coreReady) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <style dangerouslySetInnerHTML={{ __html: mcStyles }} />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  const usagePercent = subscription.analysesLimit > 0 ? Math.round((subscription.analysesUsed / subscription.analysesLimit) * 100) : 0;
  const isSubscriber = subscription.active && !!user;

  /* ─────────────────────────────────────────────
     Tools array — shared definition with gating
     ───────────────────────────────────────────── */
  const hasAccess = access.allowed; // admin, pro, tools, or trial
  const isTrial = access.tier === "trial";
  const isVideoOnly = access.tier === "video_only";
  const isFreeAcct = access.tier === "free";

  // Helper: crown tier badge (subtle visual indicator — gating is handled by GateOverlay)
  const PRO_TOOLS = ["location_value_score", "website_builder"];
  const NO_CROWN_TOOLS = ["order_video", "video_remix"];

  const gated = (toolKey: string) => {
    const ta = checkToolAccess(toolKey, access);
    const trialBadge = (isTrial && access.trialDaysLeft !== undefined)
      ? `TRIAL: ${access.trialDaysLeft}d` : undefined;

    if (NO_CROWN_TOOLS.includes(toolKey)) {
      return { badge: trialBadge, badgeColor: trialBadge ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : undefined, crown: undefined };
    }
    const crown = PRO_TOOLS.includes(toolKey) ? "gold" : "silver";
    return { badge: trialBadge, badgeColor: trialBadge ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : undefined, crown };
  };

  const tools: ToolDef[] = [
    { icon: hasAccess ? Film : Video, label: "Order a Video", desc: hasAccess ? "Cinematic listing walkthrough from $4.95/clip" : "Cinematic listing walkthrough from $79", href: "/order", color: "text-cyan-400", bg: "bg-cyan-400/10", ring: "ring-cyan-400/20", startHere: !hasPaidOrder },
    { icon: Film, label: "Video Remix", desc: isVideoOnly || hasAccess ? "Remix your clips into social-ready videos with music & branding" : "Recut your clips into new videos — free forever", href: "/dashboard/lens/remix", color: "text-purple-400", bg: "bg-purple-400/10", ring: "ring-purple-400/20", ...gated("video_remix") },
    { icon: MessageSquare, label: "Description Writer", desc: "MLS-ready listing copy from your photos", href: "/dashboard/lens/descriptions", color: "text-sky-400", bg: "bg-sky-400/10", ring: "ring-sky-400/20", stat: descriptionCount > 0 ? `${descriptionCount} description${descriptionCount !== 1 ? "s" : ""}` : null, ...gated("description_writer") },
    { icon: PenTool, label: "Design Studio", desc: "Marketing graphics, listing flyers, branding cards", href: "/dashboard/lens/design-studio", color: "text-indigo-400", bg: "bg-indigo-400/10", ring: "ring-indigo-400/20", ...gated("design_studio") },
    { icon: Crosshair, label: "Drone Mark", desc: "Annotate aerial photos with lot lines & pins", href: "/dashboard/lens/dronemark", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20", ...gated("drone_mark") },
    { icon: ImageIcon, label: "Listing Flyer", desc: "Print-ready flyers from your photos", href: "/dashboard/lens/design-studio", color: "text-orange-400", bg: "bg-orange-400/10", ring: "ring-orange-400/20", ...gated("listing_flyer") },
    { icon: MapPin, label: "Location Value Score", desc: "Neighborhood insights for your listing", href: "#", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20", ...gated("location_value_score") },
    { icon: MessageSquare, label: "Marketing Planner", desc: "AI assistant — captions, posting schedule, content gaps", href: "/dashboard/planner", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20", ...gated("marketing_planner") },
    {
      icon: Globe,
      label: "My Agent Website",
      desc: (access.tier === "pro" || access.tier === "admin")
        ? agentWebsite
          ? agentWebsite.handle + ".p2v.homes — View & edit your site"
          : "Start building your agent website on p2v.homes"
        : "Get your own branded agent website with Lens Pro",
      href: (access.tier === "pro" || access.tier === "admin")
        ? agentWebsite
          ? "https://" + agentWebsite.handle + ".p2v.homes"
          : "/dashboard/websites"
        : "/lens#pricing",
      color: "text-sky-400",
      bg: "bg-sky-400/10",
      ring: "ring-sky-400/20",
      ...gated("website_builder"),
    },
    { icon: Camera, label: "Photo Coach", desc: "AI-powered photo scoring & feedback", href: "/dashboard/lens/coach", color: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/20", stat: coachSessionCount > 0 ? `${coachSessionCount} session${coachSessionCount !== 1 ? "s" : ""}` : null, ...gated("photo_coach") },
    { icon: ImageIcon, label: "Photo Enhancement", desc: "AI brightness, color & white balance correction", href: "/dashboard/lens/enhance", color: "text-teal-400", bg: "bg-teal-400/10", ring: "ring-teal-400/20", stat: enhancementCount > 0 ? `${enhancementCount} enhanced` : null, ...gated("photo_enhancement") },
    { icon: ImageIcon, label: "Photo Optimizer", desc: "Batch compress for MLS, Zillow, social — under 290KB", href: "/dashboard/lens/optimize", color: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/20", ...gated("photo_optimizer") },
    { icon: FileText, label: "Reports", desc: "Branded buyer & seller guides", href: "/dashboard/lens/reports", color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/20", ...gated("custom_reports") },
    { icon: TrendingUp, label: "Value Boost Report", desc: "ROI-ranked improvement suggestions", href: "#", color: "text-rose-400", bg: "bg-rose-400/10", ring: "ring-rose-400/20", ...gated("value_boost") },
    { icon: Sofa, label: "Virtual Staging", desc: "Furnish empty rooms with AI in seconds", href: "/dashboard/lens/staging", color: "text-violet-400", bg: "bg-violet-400/10", ring: "ring-violet-400/20", ...gated("virtual_staging") },
  ];

  /* ═══════════════════════════════════════════════════════════════
     SHARED DARK DASHBOARD — used by both subscriber & non-subscriber
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className={`dash-root min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900" : "dashboard-light"}`}>
      <Navigation />
      <style dangerouslySetInnerHTML={{ __html: mcStyles }} />
      {user && <SignupSpin userId={user.id} />}
      {!isSubscriber && <LensConversionTracker />}

      {/* Background */}
      <div className="dl-bg-overlay pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 15% 20%, rgba(56,189,248,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(99,102,241,0.04) 0%, transparent 60%)" }} />
      <div className="dl-bg-overlay pointer-events-none fixed inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* ═══ TOP BAR ═══ */}
        <div className="mc-animate flex items-center justify-between mb-4" style={{ animationDelay: "0.05s" }}>
          {/* LEFT — discount pill */}
          <div className="flex items-center gap-3">
            {signupPrizeCode && (
              <div className="flex items-center gap-2 rounded-xl border border-green-400/20 bg-green-400/[0.06] px-3.5 py-2 backdrop-blur-sm">
                <Gift className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs font-bold text-green-300">{signupPrizeLabel}</span>
                <span className="text-xs font-mono font-bold bg-green-400/10 px-1.5 py-0.5 rounded text-green-300">{signupPrizeCode}</span>
              </div>
            )}
          </div>

          {/* RIGHT — mode toggle + subscriber badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="dl-mode-toggle flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            </button>
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

        {/* ═══ TRIAL BANNER — active trial ═══ */}
        {access.tier === "trial" && access.trialDaysLeft !== undefined && (
          <div className={`mc-animate mt-4 rounded-xl border p-4 ${access.trialDaysLeft <= 3 ? "border-amber-400/20 bg-amber-400/[0.06]" : "border-cyan-400/15 bg-cyan-400/[0.04]"}`} style={{ animationDelay: "0.08s" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${access.trialDaysLeft <= 3 ? "text-amber-400" : "text-cyan-400"}`} />
                <span className="text-sm font-bold text-white/90">Lens Trial</span>
                <span className={`text-sm font-bold ${access.trialDaysLeft <= 3 ? "text-amber-400" : "text-cyan-400"}`}>{access.trialDaysLeft} day{access.trialDaysLeft !== 1 ? "s" : ""} remaining</span>
              </div>
              <Link href="/lens#pricing"><Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs">Subscribe now →</Button></Link>
            </div>
          </div>
        )}

        {/* ═══ FREE ACCOUNT BANNER — no purchase yet ═══ */}
        {access.tier === "free" && !bannerDismissed && (
          <div className="mc-animate mt-4 rounded-xl border border-green-400/15 bg-green-400/[0.04] p-5 relative" style={{ animationDelay: "0.08s" }}>
            <button onClick={() => setBannerDismissed(true)} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors"><X className="h-4 w-4" /></button>
            <div className="flex items-start gap-3">
              <Film className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white/90">Order your first listing video to unlock 10 days of every AI marketing tool — free.</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Your first video order comes with a 10-day trial of all P2V Lens tools. No credit card required for the trial.</p>
                <div className="flex items-center gap-3 mt-3">
                  <Link href="/order"><Button size="sm" className="bg-green-500 hover:bg-green-400 text-white font-bold text-xs px-4 py-2 rounded-lg">Order a Video — from $79 <ArrowRight className="ml-1.5 h-3 w-3" /></Button></Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ VIDEO OWNER BANNER — trial expired, no sub ═══ */}
        {access.tier === "video_only" && !bannerDismissed && (
          <div className="mc-animate mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5 relative" style={{ animationDelay: "0.08s" }}>
            <button onClick={() => setBannerDismissed(true)} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors"><X className="h-4 w-4" /></button>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white/90">Your trial has ended</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Subscribe to keep using all marketing tools. Your videos and Video Remix are still available.</p>
                <div className="flex items-center gap-3 mt-3">
                  <Link href="/lens#pricing"><Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs px-4 py-2 rounded-lg">Subscribe — $27/mo</Button></Link>
                  <Link href="/lens#pricing" className="text-xs font-semibold text-cyan-400/60 hover:text-cyan-400 transition-colors">See Plans</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SUBSCRIBE BANNER — non-subscribers (legacy, kept for existing subs) ═══ */}
        {!isSubscriber && !bannerDismissed && access.tier !== "free" && access.tier !== "video_only" && access.tier !== "trial" && (
          <div className="mc-animate mt-4 rounded-xl border border-green-400/15 bg-green-400/[0.04] p-5 relative" style={{ animationDelay: "0.08s" }}>
            <button onClick={() => setBannerDismissed(true)} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors"><X className="h-4 w-4" /></button>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white/90">Unlock unlimited access to all tools</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Subscribe to P2V Lens for $27/mo and get unlimited photo coaching, design exports, descriptions, staging, and 10% off every video order.</p>
                <div className="flex items-center gap-3 mt-3">
                  <Link href="/lens"><Button size="sm" className="bg-green-500 hover:bg-green-400 text-white font-bold text-xs px-4 py-2 rounded-lg">Explore P2V Lens <ArrowRight className="ml-1.5 h-3 w-3" /></Button></Link>
                  <Link href="/lens#features" className="text-xs font-semibold text-green-400/60 hover:text-green-400 transition-colors">See what&apos;s included</Link>
                </div>
              </div>
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

        {/* ═══ TOOLS GRID — HERO ═══ */}
        <div id="tools" className="mc-animate mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "0.15s" }}>
          {tools.map((tool, i) => {
            const isScrollLink = tool.href.startsWith("#");
            const isExternal = tool.href.startsWith("http");
            const startHereClass = tool.startHere ? " mc-start-here" : "";

            let Wrapper: any;
            let wrapperProps: any;

            if (isScrollLink) {
              Wrapper = "button";
              wrapperProps = {
                onClick: () => {
                  const el = document.getElementById(tool.href.slice(1));
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                },
                className: "mc-chip-animate group relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-white/[0.06] text-left w-full" + startHereClass,
                style: { animationDelay: `${0.18 + i * 0.05}s` },
              };
            } else if (isExternal) {
              Wrapper = "a";
              wrapperProps = {
                href: tool.href,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "mc-chip-animate group relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]" + startHereClass,
                style: { animationDelay: `${0.18 + i * 0.05}s` },
              };
            } else {
              Wrapper = Link;
              wrapperProps = {
                href: tool.href,
                className: "mc-chip-animate group relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]" + startHereClass,
                style: { animationDelay: `${0.18 + i * 0.05}s` },
              };
            }

            return (
              <Wrapper key={tool.label} {...wrapperProps}>
                {/* Crown tier indicator + optional trial badge + start-here beacon */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {tool.startHere && (
                    <span className="mc-start-badge text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-400 text-gray-900 shadow-lg shadow-cyan-400/40">
                      ★ Start Here
                    </span>
                  )}
                  {tool.badge && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tool.badgeColor || ""}`}>
                      {tool.badge}
                    </span>
                  )}
                  {tool.crown === "gold" && <Crown className="h-3.5 w-3.5 text-amber-400/50" />}
                  {tool.crown === "silver" && <Crown className="h-3.5 w-3.5 text-gray-400/40" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.bg} ring-1 ${tool.ring} transition-transform group-hover:scale-110`}><tool.icon className={`h-5 w-5 ${tool.color}`} /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white/90 group-hover:text-cyan-300 transition-colors">{tool.label}</p>
                    {tool.stat && <p className="text-[11px] font-medium text-white/30">{tool.stat}</p>}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-white/40">{tool.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400/60 group-hover:text-cyan-400 transition-colors mt-auto pt-1">
                  Open<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Wrapper>
            );
          })}
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <div className="mc-animate mt-8" style={{ animationDelay: "0.45s" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Quick Links</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { icon: Video, label: "My Videos", href: "/dashboard/videos", color: "text-purple-300" },
              { icon: Home, label: "My Properties", href: "/dashboard/properties", color: "text-emerald-300" },
              { icon: Film, label: "Video Remix", href: "/dashboard/lens/remix", color: "text-indigo-300" },
              { icon: User, label: "Agent Profile", href: "/dashboard/profile", color: "text-blue-300" },
              { icon: Settings, label: "Account Settings", href: "/dashboard/settings", color: "text-white/80" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] py-4 px-3 text-center transition-all hover:border-cyan-400/30 hover:bg-white/[0.1]"
              >
                <item.icon className={`h-5 w-5 ${item.color} transition-opacity`} />
                <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══ RECENT PROPERTIES — quick links with auto-fill ═══ */}
        {recentProperties.length > 0 && (
          <div className="mc-animate mt-10" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Recent Properties — Quick Actions</p>
              <Link href="/dashboard/properties" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentProperties.map(prop => {
                const qs = buildQs(prop);
                const thumb = getPropertyThumb(prop);
                return (
                  <div key={prop.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 flex gap-4">
                    {/* Thumbnail */}
                    <Link
                      href={`/dashboard/properties/${prop.id}`}
                      className="relative block h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.06] group"
                      aria-label={`View ${prop.address}`}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={prop.address}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(99,102,241,0.12) 50%, rgba(168,85,247,0.1) 100%)" }}>
                          <Home className="h-6 w-6 text-white/25" />
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/dashboard/properties/${prop.id}`} className="text-sm font-bold text-white hover:text-cyan-200 transition-colors truncate">{prop.address}</Link>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${prop.status === "active" ? "bg-green-400/30 text-green-200" : prop.status === "sold" ? "bg-blue-400/30 text-blue-200" : "bg-white/20 text-white/70"}`}>{prop.status}</span>
                          <Link href={`/dashboard/properties/${prop.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/[0.18] border border-cyan-400/30 text-[11px] font-bold text-cyan-200 hover:bg-cyan-400/[0.28] hover:text-white transition-all">
                            <Edit className="h-3 w-3" />Edit Property
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/order?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-400/[0.15] border border-cyan-400/30 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/[0.25] hover:text-white transition-all"><Video className="h-3 w-3" />Order Video</Link>
                        <Link href={`/dashboard/lens/coach?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-400/[0.15] border border-blue-400/30 text-[10px] font-bold text-blue-200 hover:bg-blue-400/[0.25] hover:text-white transition-all"><Camera className="h-3 w-3" />Coach</Link>
                        <Link href={`/dashboard/lens/descriptions?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-400/[0.15] border border-sky-400/30 text-[10px] font-bold text-sky-200 hover:bg-sky-400/[0.25] hover:text-white transition-all"><FileText className="h-3 w-3" />Description</Link>
                        <Link href={`/dashboard/lens/design-studio?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-400/[0.15] border border-indigo-400/30 text-[10px] font-bold text-indigo-200 hover:bg-indigo-400/[0.25] hover:text-white transition-all"><PenTool className="h-3 w-3" />Design</Link>
                        <Link href={`/dashboard/lens/staging?${qs}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-400/[0.15] border border-violet-400/30 text-[10px] font-bold text-violet-200 hover:bg-violet-400/[0.25] hover:text-white transition-all"><Sofa className="h-3 w-3" />Stage</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ MORE TOOLS — Realtor & Photographer links ═══ */}
        <div id="more-tools" className="mc-animate mt-10" style={{ animationDelay: "0.55s" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">More Tools & Resources</p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
              <Link key={item.label} href={item.href} className="group flex items-center gap-3.5 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 transition-all hover:border-cyan-400/30 hover:bg-white/[0.08] backdrop-blur-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.15] ring-1 ring-cyan-400/25">
                  <item.icon className="h-3.5 w-3.5 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-[10px] text-white/55">{item.desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-white/35 group-hover:text-cyan-300 transition-all group-hover:translate-x-0.5 flex-shrink-0" />
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
                  "Unlimited Photo Enhancement",
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
