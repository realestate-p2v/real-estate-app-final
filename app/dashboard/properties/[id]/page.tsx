// app/dashboard/properties/[id]/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardShell, useAccent } from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import BookingCalendar from "@/components/booking-calendar";
import UpgradeModal from "@/components/upgrade-modal";
import {
  ArrowLeft, Camera, Film, FileText, Sofa, PenTool, Pencil, X, Check,
  Loader2, Lock, Copy, Download, ExternalLink, Image as ImageIcon, Play,
  ChevronDown, ShoppingCart, GripVertical, CheckCircle, Sparkles, Globe,
  Eye, Link2, CalendarDays, Mail, Phone, MessageSquare, Trash2,
  LayoutGrid, Video, Megaphone, AlertCircle, Save,
} from "lucide-react";
import PropertyVideoCard from "@/components/property-video-card";

/* ═════════════════════════════════════════════════════════════
   Types and constants
   ═════════════════════════════════════════════════════════════ */

interface Property {
  id: string; address: string; address_normalized: string;
  city: string | null; state: string | null; zip: string | null;
  status: string; listing_type: string; price: number | null;
  price_period: string | null; bedrooms: number | null; bathrooms: number | null;
  sqft: number | null; lot_size: string | null; year_built: number | null;
  property_type: string; unit_count: number | null;
  special_features: string[] | null; amenities: string[] | null;
  website_published: boolean; website_slug: string | null;
  website_template: string | null; website_modules: Record<string, boolean> | null;
  website_curated: Record<string, string[]> | null;
  booking_enabled: boolean; lensy_enabled: boolean;
  created_at: string; updated_at: string;
}

interface ShowingRequest {
  id: string; property_id: string; agent_user_id: string;
  visitor_name: string; visitor_email: string | null; visitor_phone: string | null;
  message: string | null; property_info: any; source: string | null;
  read: boolean; created_at: string;
}

type TabId = "overview" | "media" | "marketing" | "website" | "bookings";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-400/15 text-green-300 ring-1 ring-green-400/30",
  pending: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30",
  sold: "bg-blue-400/15 text-blue-300 ring-1 ring-blue-400/30",
  withdrawn: "bg-white/10 text-white/60 ring-1 ring-white/20",
  rental: "bg-purple-400/15 text-purple-300 ring-1 ring-purple-400/30",
};

const PROPERTY_TYPES: Record<string, string> = {
  single_family: "Single Family", condo: "Condo", apartment: "Apartment",
  townhouse: "Townhouse", land: "Land", commercial: "Commercial",
};

const TEMPLATES = [
  { id: "modern_clean", label: "Modern Clean", desc: "White, sans-serif, minimal" },
  { id: "luxury_dark", label: "Luxury Dark", desc: "Dark, gold accents, serif" },
  { id: "classic_light", label: "Classic Light", desc: "Cream, navy accents, traditional" },
];

const MODULE_LABELS: Record<string, string> = {
  photos: "Photos", videos: "Videos", description: "Description",
  staging: "Virtual Staging", exports: "Marketing Materials",
  booking: "Booking Calendar", lead_capture: "Lead Capture Form", lensy: "Lensy Chat",
};

const AMENITIES = [
  { id: "ac", label: "A/C", icon: "❄️" }, { id: "heating", label: "Heating", icon: "🔥" },
  { id: "pool", label: "Pool", icon: "🏊" }, { id: "garage", label: "Garage", icon: "🚗" },
  { id: "parking", label: "Parking", icon: "🅿️" }, { id: "security", label: "Security", icon: "🔒" },
  { id: "gated", label: "Gated", icon: "🚧" }, { id: "laundry", label: "Laundry", icon: "👕" },
  { id: "dishwasher", label: "Dishwasher", icon: "🍽️" }, { id: "fireplace", label: "Fireplace", icon: "🪵" },
  { id: "furnished", label: "Furnished", icon: "🛋️" }, { id: "pet_friendly", label: "Pet Friendly", icon: "🐾" },
  { id: "gym", label: "Gym", icon: "💪" }, { id: "elevator", label: "Elevator", icon: "🛗" },
  { id: "balcony", label: "Balcony", icon: "🌅" }, { id: "garden", label: "Garden", icon: "🌿" },
  { id: "rooftop", label: "Rooftop", icon: "🏙️" }, { id: "storage", label: "Storage", icon: "📦" },
  { id: "wheelchair", label: "Wheelchair", icon: "♿" }, { id: "solar", label: "Solar", icon: "☀️" },
  { id: "ev_charging", label: "EV Charging", icon: "🔌" }, { id: "smart_home", label: "Smart Home", icon: "📱" },
  { id: "water_heater", label: "Water Heater", icon: "🚿" }, { id: "ceiling_fans", label: "Ceiling Fans", icon: "🌀" },
];

/* ═════════════════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════════════════ */

function generateSlug(address: string, city?: string | null, state?: string | null): string {
  const parts = [address, city, state].filter(Boolean).join(" ");
  return parts.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

function extractPublicId(url: string): string | null {
  if (!url) return null;
  try { const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/); return m ? m[1] : null; } catch { return null; }
}

async function deleteFromCloudinary(url: string, resourceType = "image"): Promise<boolean> {
  const publicId = extractPublicId(url);
  if (!publicId) return false;
  try {
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId, resource_type: resourceType }),
    });
    return (await res.json()).success;
  } catch { return false; }
}

function thumbnailize(url: string, w = 400, h = 300): string {
  if (!url?.includes("/upload/")) return url;
  if (url.match(/\.(mp4|mov|webm)$/i)) {
    return url.replace("/video/upload/", `/video/upload/so_1,w_${w},h_${h},c_fill,f_jpg/`).replace(/\.(mp4|mov|webm)$/i, ".jpg");
  }
  if (url.match(/\.pdf$/i)) {
    return url.replace("/image/upload/", `/image/upload/w_${w},h_${h},c_fill,pg_1,f_jpg/`);
  }
  return url.replace("/upload/", `/upload/w_${w},h_${h},c_fill/`);
}

type VideoState = "processing" | "awaiting_review" | "editing" | "accepted";

function getVideoState(order: any, isEditing: boolean): VideoState {
  if (isEditing) return "editing";
  if (order.approved_at) return "accepted";
  if (order.awaiting_approval_at || order.delivered_at) return "awaiting_review";
  return "processing";
}

/* ═════════════════════════════════════════════════════════════
   Small shared components
   ═════════════════════════════════════════════════════════════ */

function SectionCard({ title, count, icon: Icon, action, children }: {
  title: string; count?: number; icon?: any; action?: React.ReactNode; children: React.ReactNode;
}) {
  const a = useAccent();
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={`h-5 w-5 ${a.text}`} />}
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {typeof count === "number" && count > 0 && (
            <span className="text-xs font-semibold text-white/60 bg-white/[0.06] px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint, action }: {
  icon: any; title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-10 px-4">
      <Icon className="h-12 w-12 text-white/15 mx-auto mb-3" />
      <p className="text-sm font-semibold text-white/75 mb-1">{title}</p>
      {hint && <p className="text-xs text-white/45 mb-4">{hint}</p>}
      {action}
    </div>
  );
}

function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);
  useEffect(() => {
    const move = (e: MouseEvent) => { if (isDragging.current) updatePosition(e.clientX); };
    const touchMove = (e: TouchEvent) => { if (isDragging.current) updatePosition(e.touches[0].clientX); };
    const end = () => { isDragging.current = false; };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", touchMove, { passive: true }); window.addEventListener("touchend", end);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", end); window.removeEventListener("touchmove", touchMove); window.removeEventListener("touchend", end); };
  }, [updatePosition]);
  return (
    <div ref={containerRef} className="relative aspect-[4/3] rounded-2xl overflow-hidden select-none cursor-ew-resize"
      onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; updatePosition(e.clientX); }}
      onTouchStart={(e) => { isDragging.current = true; updatePosition(e.touches[0].clientX); }}>
      <img src={afterUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={beforeUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">Before</div>
      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">After</div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none">
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   Main page
   ═════════════════════════════════════════════════════════════ */

export default function SinglePropertyPage() {
  return (
    <DashboardShell accent="cyan" maxWidth="6xl">
      <PropertyPageInner />
    </DashboardShell>
  );
}

function PropertyPageInner() {
  const a = useAccent();
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  /* ─── State ─── */
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<"none" | "lens" | "pro">("none");
  const [includedSiteUsed, setIncludedSiteUsed] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<any[]>([]);
  const [exports, setExports] = useState<any[]>([]);
  const [stagings, setStagings] = useState<any[]>([]);
  const [orderPhotos, setOrderPhotos] = useState<any[]>([]);
  const [orderClips, setOrderClips] = useState<any[]>([]);
  const [remixDrafts, setRemixDrafts] = useState<any[]>([]);
  const [deleteDraftConfirm, setDeleteDraftConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Property>>({});

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectedCoachPhotos, setSelectedCoachPhotos] = useState<Set<string>>(new Set());
  const [selectedClips, setSelectedClips] = useState<number[]>([]);
  const [stagingModal, setStagingModal] = useState<any>(null);
  const [exportModal, setExportModal] = useState<any>(null);
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingDescId, setDeletingDescId] = useState<string | null>(null);

  /* ─── Video review state ─── */
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  /* Awaiting-review videos: paid + delivered + not yet approved.
     Drives the property-page banner and the State 1 UI on the Videos card. */
  const awaitingReviewVideos = videos.filter(
    (v: any) =>
      v.payment_status === "paid" &&
      !v.approved_at &&
      (v.awaiting_approval_at || v.delivered_at)
  );
  const hasAwaitingReview = awaitingReviewVideos.length > 0;
  const firstAwaitingReviewId = awaitingReviewVideos[0]?.order_id || awaitingReviewVideos[0]?.id || null;

  const [pubTemplate, setPubTemplate] = useState<string>("modern_clean");
  const [pubModules, setPubModules] = useState<Record<string, boolean>>({
    photos: true, videos: true, description: true, staging: true,
    exports: true, booking: false, lead_capture: true, lensy: false,
  });
  const [pubCurated, setPubCurated] = useState<Record<string, string[]>>({});
  const [pubSlug, setPubSlug] = useState("");
  const [pubPublished, setPubPublished] = useState(false);
  const [pubSaving, setPubSaving] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingToggling, setBookingToggling] = useState(false);
  const [showingRequests, setShowingRequests] = useState<ShowingRequest[]>([]);
  const [showingsLoading, setShowingsLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const supabase = createClient();

  /* ─── Tab state synced with URL hash ─── */
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "") as TabId;
      if (["overview", "media", "marketing", "website", "bookings"].includes(h)) {
        setActiveTab(h);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  /* ─── Data helpers ─── */
  const buildPropertyParams = (prop: Property) => {
    const p = new URLSearchParams();
    p.set("propertyId", prop.id);
    if (prop.address) p.set("address", prop.address);
    if (prop.city) p.set("city", prop.city);
    if (prop.state) p.set("state", prop.state);
    if (prop.zip) p.set("zip", prop.zip);
    if (prop.bedrooms) p.set("beds", prop.bedrooms.toString());
    if (prop.bathrooms) p.set("baths", prop.bathrooms.toString());
    if (prop.sqft) p.set("sqft", prop.sqft.toString());
    if (prop.lot_size) p.set("lotSize", prop.lot_size);
    if (prop.year_built) p.set("yearBuilt", prop.year_built.toString());
    if (prop.price) p.set("price", prop.price.toString());
    if (prop.special_features?.length) p.set("specialFeatures", prop.special_features.join(", "));
    return p.toString();
  };

  const initPublishState = (prop: Property) => {
    setPubTemplate(prop.website_template || "modern_clean");
    setPubModules(prop.website_modules || { photos: true, videos: true, description: true, staging: true, exports: true, booking: false, lead_capture: true, lensy: false });
    setPubCurated(prop.website_curated || {});
    setPubSlug(prop.website_slug || generateSlug(prop.address, prop.city, prop.state));
    setPubPublished(prop.website_published || false);
  };

  const fetchShowingRequests = useCallback(async () => {
    setShowingsLoading(true);
    try {
      const res = await fetch(`/api/showings?propertyId=${propertyId}`);
      if (res.ok) { const data = await res.json(); setShowingRequests(data.requests || data || []); }
    } catch (err) { console.error("Failed to fetch showing requests:", err); }
    setShowingsLoading(false);
  }, [propertyId]);

  const loadProperty = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?redirect=/dashboard/properties"); return; }
    setUserId(user.id);
    const isAdmin = user.email === "realestatephoto2video@gmail.com";
    if (isAdmin) { setIsSubscriber(true); setSubscriptionTier("pro"); }
    else {
      const { data: usage } = await supabase.from("lens_usage").select("is_subscriber, subscription_tier, included_website_used").eq("user_id", user.id).single();
      if (usage?.is_subscriber) setIsSubscriber(true);
      if (usage?.subscription_tier === "pro") setSubscriptionTier("pro");
      else if (usage?.subscription_tier === "lens" || usage?.is_subscriber) setSubscriptionTier("lens");
      if (usage?.included_website_used) setIncludedSiteUsed(true);
    }

    const { data: prop, error } = await supabase.from("agent_properties").select("*").eq("id", propertyId).eq("user_id", user.id).single();
    if (error || !prop) { router.push("/dashboard/properties"); return; }
    setProperty(prop); setEditForm(prop);
    setBookingEnabled(prop.booking_enabled || false);
    initPublishState(prop);

    const norm = prop.address_normalized;
    const { data: sessionData } = await supabase.from("lens_sessions").select("*").eq("user_id", user.id).ilike("property_address", `${norm}%`).order("created_at", { ascending: false });
    setPhotos(sessionData || []);

    const { data: orderData } = await supabase.from("orders").select("*").eq("user_id", user.id).ilike("property_address", `${norm}%`).order("created_at", { ascending: false });
    setVideos(orderData || []);

    const allPhotos: any[] = [];
    (orderData || []).forEach((order: any) => {
      if (Array.isArray(order.photos)) order.photos.forEach((photo: any, idx: number) => {
        if (photo.secure_url) allPhotos.push({ ...photo, orderId: order.order_id || order.id, orderDate: order.created_at, index: idx });
      });
    });
    setOrderPhotos(allPhotos);

    const allClips: any[] = [];
    (orderData || []).forEach((order: any) => {
      if (Array.isArray(order.clip_urls)) order.clip_urls.forEach((clip: any, idx: number) => {
        const clipUrl = clip.url || clip.clip_file || clip.drive_url || "";
        if (clipUrl) allClips.push({ ...clip, clipUrl, photoUrl: clip.photo_url || "", orderId: order.order_id || order.id, orderDate: order.created_at, index: idx });
      });
    });
    setOrderClips(allClips);

    // Descriptions: new per-property_id lookup, with legacy fallback for unmatched rows
    const { data: descByProp } = await supabase.from("lens_descriptions").select("*").eq("user_id", user.id).eq("property_id", propertyId).order("created_at", { ascending: false });
    const { data: legacyDescs } = await supabase.from("lens_descriptions").select("*").eq("user_id", user.id).is("property_id", null).order("created_at", { ascending: false });
    const filteredLegacy = (legacyDescs || []).filter((desc: any) => {
      const descAddr = desc.property_data?.address || desc.property_data?.property_address || "";
      if (!descAddr) return false;
      const n = descAddr.trim().toLowerCase().replace(/\bstreet\b/g, "st").replace(/\bavenue\b/g, "ave").replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr").replace(/\blane\b/g, "ln").replace(/\broad\b/g, "rd").replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();
      return n.startsWith(norm) || norm.startsWith(n);
    });
    const descMap = new Map<string, any>();
    for (const d of (descByProp || [])) descMap.set(d.id, d);
    for (const d of filteredLegacy) if (!descMap.has(d.id)) descMap.set(d.id, d);
    setDescriptions(Array.from(descMap.values()));

    const { data: exportData } = await supabase.from("design_exports").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setExports(exportData || []);

    const { data: stagingData } = await supabase.from("lens_staging").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setStagings(stagingData || []);

    // Fetch remix drafts via API (uses RLS-gated route). Non-blocking — failure
    // here doesn't prevent the property page from rendering.
    try {
      const draftsRes = await fetch(`/api/lens/remix/drafts?propertyId=${encodeURIComponent(propertyId)}`);
      if (draftsRes.ok) {
        const draftsData = await draftsRes.json();
        setRemixDrafts(draftsData.drafts || []);
      } else {
        console.warn("[property] drafts fetch failed:", draftsRes.status);
        setRemixDrafts([]);
      }
    } catch (e) {
      console.warn("[property] drafts fetch exception:", e);
      setRemixDrafts([]);
    }

    setLoading(false);
  }, [supabase, propertyId, router]);

  useEffect(() => { loadProperty(); }, [loadProperty]);
  useEffect(() => { if (property) fetchShowingRequests(); }, [property, fetchShowingRequests]);

  /* ─── Mutations ─── */

  const handleSave = async () => {
    if (!property) return; setSaving(true);
    const { error } = await supabase.from("agent_properties").update({
      address: editForm.address || property.address, city: editForm.city || null, state: editForm.state || null,
      zip: editForm.zip || null, status: editForm.status || "active", listing_type: editForm.listing_type || "sale",
      price: editForm.price || null, bedrooms: editForm.bedrooms || null, bathrooms: editForm.bathrooms || null,
      sqft: editForm.sqft || null, lot_size: editForm.lot_size || null, year_built: editForm.year_built || null,
      property_type: editForm.property_type || "single_family", updated_at: new Date().toISOString(),
    }).eq("id", property.id);
    if (!error) { setProperty({ ...property, ...editForm, updated_at: new Date().toISOString() } as Property); setEditing(false); }
    setSaving(false);
  };

  const handlePublishSave = async () => {
    if (!property) return; setPubSaving(true);
    const slug = pubSlug.trim() || generateSlug(property.address, property.city, property.state);
    const { error } = await supabase.from("agent_properties").update({
      website_template: pubTemplate, website_modules: pubModules, website_curated: pubCurated,
      website_slug: slug, website_published: pubPublished, updated_at: new Date().toISOString(),
    }).eq("id", property.id);
    if (error) alert("Failed to save: " + error.message);
    else { setProperty({ ...property, website_template: pubTemplate, website_modules: pubModules, website_curated: pubCurated, website_slug: slug, website_published: pubPublished, updated_at: new Date().toISOString() } as Property); setPubSlug(slug); }
    setPubSaving(false);
  };

  const togglePublish = async () => {
    const next = !pubPublished; setPubPublished(next); if (!property) return;
    const slug = pubSlug.trim() || generateSlug(property.address, property.city, property.state); setPubSlug(slug); setPubSaving(true);
    await supabase.from("agent_properties").update({ website_published: next, website_slug: slug, website_template: pubTemplate, website_modules: pubModules, website_curated: pubCurated, updated_at: new Date().toISOString() }).eq("id", property.id);
    setProperty({ ...property, website_published: next, website_slug: slug, website_template: pubTemplate, website_modules: pubModules, website_curated: pubCurated, updated_at: new Date().toISOString() } as Property);
    setPubSaving(false);
  };

  const toggleBookingEnabled = async () => {
    if (!property) return; setBookingToggling(true);
    const next = !bookingEnabled;
    const { error } = await supabase.from("agent_properties").update({ booking_enabled: next, updated_at: new Date().toISOString() }).eq("id", property.id);
    if (!error) { setBookingEnabled(next); setProperty({ ...property, booking_enabled: next, updated_at: new Date().toISOString() } as Property); }
    setBookingToggling(false);
  };

  const handleMarkRead = async (requestId: string) => {
    setMarkingRead(requestId);
    try {
      const res = await fetch("/api/showings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: requestId, read: true }) });
      if (res.ok) setShowingRequests(prev => prev.map(r => r.id === requestId ? { ...r, read: true } : r));
    } catch (err) { console.error("Failed to mark read:", err); }
    setMarkingRead(null);
  };

  const handleDeleteDescription = async (descId: string) => {
    if (!userId) return;
    if (!window.confirm("Delete this description? You can regenerate a new one anytime.")) return;
    setDeletingDescId(descId);
    try {
      const res = await fetch("/api/lens/description", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ descriptionId: descId, userId }) });
      const data = await res.json();
      if (data.success) setDescriptions(prev => prev.filter(d => d.id !== descId));
      else alert(data.error || "Failed to delete description.");
    } catch (e) { console.error(e); alert("Failed to delete description."); }
    finally { setDeletingDescId(null); }
  };

  const handleDeleteExport = async (exp: any) => {
    if (!window.confirm("Delete this export? This will permanently remove it from cloud storage.")) return;
    try {
      if (exp.export_url?.includes("cloudinary")) {
        const rt = exp.template_type?.startsWith("video_remix") ? "video" : "image";
        await deleteFromCloudinary(exp.export_url, rt);
      }
      await supabase.from("design_exports").delete().eq("id", exp.id);
      setExports(prev => prev.filter(e => e.id !== exp.id));
    } catch (e) { console.error("Delete export failed:", e); }
  };

  const handleDeleteDraft = async (draftId: string) => {
    setDeletingDraft(true);
    try {
      const res = await fetch(`/api/lens/remix/drafts/${encodeURIComponent(draftId)}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[property] delete draft failed:", err);
        alert(err.error || "Failed to delete draft.");
        return;
      }
      setRemixDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (e) {
      console.error("[property] delete draft exception:", e);
      alert("Failed to delete draft.");
    } finally {
      setDeletingDraft(false);
      setDeleteDraftConfirm(null);
    }
  };

  /* ─── Curation ─── */
  const toggleCuratedItem = (category: string, itemId: string) => {
    setPubCurated(prev => { const list = prev[category] || []; return list.includes(itemId) ? { ...prev, [category]: list.filter(x => x !== itemId) } : { ...prev, [category]: [...list, itemId] }; });
  };
  const selectAllCurated = (category: string, items: string[]) => setPubCurated(prev => ({ ...prev, [category]: [...items] }));
  const deselectAllCurated = (category: string) => setPubCurated(prev => ({ ...prev, [category]: [] }));

  const copyToClipboard = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const sendPhotosToOrder = (photoList: any[]) => {
    const photosForOrder = photoList.map((photo, i) => ({ id: `prop-${Date.now()}-${i}`, secure_url: photo.secure_url, preview: photo.secure_url, description: photo.description || "", uploadStatus: "complete", camera_direction: photo.camera_direction || null, camera_speed: photo.camera_speed || null, custom_motion: photo.custom_motion || "", crop_offset_landscape: photo.crop_offset_landscape ?? 50, crop_offset_vertical: photo.crop_offset_vertical ?? 50 }));
    sessionStorage.setItem("coach_photos_for_order", JSON.stringify(photosForOrder));
    if (property) sessionStorage.setItem("coach_property_address", property.address);
    window.location.href = "/order";
  };

  const sendCoachPhotosToOrder = () => {
    const allCoach: any[] = [];
    photos.forEach((session: any) => {
      if (Array.isArray(session.photos)) session.photos.filter((p: any) => p.approved).forEach((photo: any, i: number) => {
        const key = `${session.id}-${i}`;
        if (selectedCoachPhotos.size === 0 || selectedCoachPhotos.has(key)) {
          allCoach.push({ id: `coach-${Date.now()}-${allCoach.length}`, secure_url: photo.edited_url || photo.url, preview: photo.edited_url || photo.url, description: photo.room || "", uploadStatus: "complete", camera_direction: null, camera_speed: null, custom_motion: "", crop_offset_landscape: 50, crop_offset_vertical: 50 });
        }
      });
    });
    if (allCoach.length === 0) return;
    sessionStorage.setItem("coach_photos_for_order", JSON.stringify(allCoach));
    if (property) sessionStorage.setItem("coach_property_address", property.address);
    window.location.href = "/order";
  };

  const sendClipsToDesignStudio = () => {
    const selected = selectedClips.map(i => orderClips[i]).filter(Boolean);
    if (selected.length === 0) return;
    sessionStorage.setItem("design_studio_clips", JSON.stringify(selected.map(c => c.clipUrl)));
    if (property) window.location.href = `/dashboard/lens/design-studio?${buildPropertyParams(property)}`;
  };

  /* ─── Loading ─── */
  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className={`h-8 w-8 animate-spin ${a.text}`} /></div>;
  }
  if (!property) return null;

  /* ─── Derived data ─── */
  const qs = buildPropertyParams(property);
  const inp = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-base text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30";

  const allCoachApproved: any[] = [];
  photos.forEach((session: any) => {
    if (Array.isArray(session.photos)) session.photos.filter((p: any) => p.approved).forEach((photo: any, i: number) => {
      allCoachApproved.push({ ...photo, sessionId: session.id, indexInSession: i });
    });
  });

  const curatedPhotoUrls = orderPhotos.map(p => p.secure_url).filter(Boolean);
  const curatedVideoUrls: { url: string; label: string; orderId: string }[] = [];
  videos.forEach((v: any) => {
    if (v.unbranded_delivery_url) curatedVideoUrls.push({ url: v.unbranded_delivery_url, label: `${v.is_quick_video ? "Quick Video" : v.listing_package_label || "Listing Video"} — Unbranded`, orderId: v.id });
    if (v.delivery_url) curatedVideoUrls.push({ url: v.delivery_url, label: `${v.is_quick_video ? "Quick Video" : v.listing_package_label || "Listing Video"} — Branded`, orderId: v.id });
  });
  const curatedDescIds = descriptions.map(d => d.id);
  const curatedStagingIds = stagings.map(s => s.id);
  const curatedExportIds = exports.map(e => e.id);
  const pubLiveUrl = `https://${pubSlug}.p2v.homes`;
  const heroThumb = orderPhotos[0]?.secure_url ? thumbnailize(orderPhotos[0].secure_url, 800, 450) : null;
  const unreadShowings = showingRequests.filter(r => !r.read).length;
  const nonRemixExports = exports.filter((e: any) => !e.template_type?.startsWith("video_remix"));
  const remixExports = exports.filter((e: any) => e.template_type?.startsWith("video_remix"));

  const mediaCount = videos.length + remixExports.length + remixDrafts.length + orderPhotos.length + orderClips.length + allCoachApproved.length;
  const marketingCount = nonRemixExports.length + stagings.length + descriptions.length;

  /* ─── Tab definitions (color-coded per section) ─── */
  const tabs: {
    id: TabId; label: string; icon: any; count?: number;
    colors: { text: string; textDim: string; bg: string; ring: string; dot: string };
  }[] = [
    { id: "overview",  label: "Overview",  icon: LayoutGrid,   colors: { text: "text-cyan-300",    textDim: "text-cyan-400",    bg: "bg-cyan-400/10",    ring: "ring-cyan-400/30",    dot: "bg-cyan-400" } },
    { id: "media",     label: "Media",     icon: Video,        count: mediaCount,        colors: { text: "text-violet-300",  textDim: "text-violet-400",  bg: "bg-violet-400/10",  ring: "ring-violet-400/30",  dot: "bg-violet-400" } },
    { id: "marketing", label: "Marketing", icon: Megaphone,    count: marketingCount,    colors: { text: "text-orange-300",  textDim: "text-orange-400",  bg: "bg-orange-400/10",  ring: "ring-orange-400/30",  dot: "bg-orange-400" } },
    { id: "website",   label: "Website",   icon: Globe,        colors: { text: "text-emerald-300", textDim: "text-emerald-400", bg: "bg-emerald-400/10", ring: "ring-emerald-400/30", dot: "bg-emerald-400" } },
    { id: "bookings",  label: "Bookings",  icon: CalendarDays, count: unreadShowings || undefined, colors: { text: "text-blue-300",    textDim: "text-blue-400",    bg: "bg-blue-400/10",    ring: "ring-blue-400/30",    dot: "bg-blue-400" } },
  ];

  /* ═════════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════════ */
  return (
    <>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentTier={subscriptionTier} includedSiteUsed={includedSiteUsed} />

      {/* Staging Modal */}
      {stagingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setStagingModal(null)}>
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{stagingModal.room_type ? stagingModal.room_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Virtual Staging"}</h3>
                <p className="text-xs text-white/50">{stagingModal.style} · {new Date(stagingModal.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setStagingModal(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="h-5 w-5 text-white/70" /></button>
            </div>
            <BeforeAfterSlider beforeUrl={stagingModal.original_url} afterUrl={stagingModal.staged_url} />
            <div className="flex items-center gap-3 mt-4">
              <a href={stagingModal.staged_url} target="_blank" rel="noopener noreferrer" download className={`inline-flex items-center gap-1.5 ${a.btnBg} ${a.btnBgHover} text-white font-bold text-sm px-4 py-2 rounded-full`}><Download className="h-3.5 w-3.5" />Download Staged</a>
              <a href={stagingModal.original_url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-white font-semibold text-sm px-4 py-2 rounded-full"><Download className="h-3.5 w-3.5" />Original</a>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal && (() => {
        const dl = exportModal.export_url || exportModal.overlay_video_url;
        const isVideo = exportModal.export_format === "mp4" || dl?.match(/\.(mp4|mov|webm)$/i);
        const tl: Record<string, string> = { just_listed: "Just Listed", open_house: "Open House", price_reduced: "Price Reduced", just_sold: "Just Sold", yard_sign: "Yard Sign", property_pdf: "Property PDF", branding_card: "Branding Card", video_remix: "Video Remix" };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={() => setExportModal(null)}>
            <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${exportModal.template_type?.startsWith("video_remix") ? "text-purple-300 bg-purple-400/15 ring-1 ring-purple-400/30" : "text-orange-300 bg-orange-400/15 ring-1 ring-orange-400/30"}`}>{tl[exportModal.template_type] || exportModal.template_type}</span>
                  <p className="text-xs text-white/50">{new Date(exportModal.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setExportModal(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="h-5 w-5 text-white/70" /></button>
              </div>
              <div className="bg-black">
                {isVideo ? <video src={dl} controls autoPlay playsInline className="w-full max-h-[60vh] object-contain" /> : <img src={dl} alt={tl[exportModal.template_type] || "Export"} className="w-full max-h-[60vh] object-contain" />}
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-white/10">
                <a href={dl?.includes("/upload/") ? dl.replace("/upload/", "/upload/fl_attachment/") : dl} download className={`inline-flex items-center gap-1.5 ${a.btnBg} ${a.btnBgHover} text-white font-bold text-sm px-4 py-2 rounded-full`}><Download className="h-3.5 w-3.5" />Download</a>
                <a href={dl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-white font-semibold text-sm px-4 py-2 rounded-full"><ExternalLink className="h-3.5 w-3.5" />Open in New Tab</a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ DELETE DRAFT CONFIRM ═══ */}
      {deleteDraftConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={() => !deletingDraft && setDeleteDraftConfirm(null)}>
          <div className="relative w-full max-w-sm bg-slate-900 ring-1 ring-white/10 rounded-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="h-12 w-12 rounded-full bg-red-500/10 ring-1 ring-red-400/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Delete this draft?</h3>
            <p className="text-sm text-white/60 mb-1">"{deleteDraftConfirm.name}"</p>
            <p className="text-xs text-white/40 mb-5">This cannot be undone.</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteDraftConfirm(null)}
                disabled={deletingDraft}
                className="px-5 py-2 rounded-full ring-1 ring-white/15 text-white text-sm font-semibold hover:bg-white/[0.05] disabled:opacity-50"
              >Cancel</button>
              <button
                onClick={() => handleDeleteDraft(deleteDraftConfirm.id)}
                disabled={deletingDraft}
                className="px-5 py-2 rounded-full bg-red-500 hover:bg-red-400 text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                {deletingDraft && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {deletingDraft ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

     {/* ═══ HEADER with inline quick actions ═══ */}
      <div className="mc-animate flex items-start gap-3 mb-6">
        <Link href="/dashboard/properties" className="mt-2 text-white/50 hover:text-white transition-colors flex-shrink-0"><ArrowLeft className="h-5 w-5" /></Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Title + status */}
            <div className="min-w-0 w-full md:w-auto md:flex-1">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white break-words">{property.address}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[property.status] || STATUS_STYLES.active}`}>{property.status}</span>
                {pubPublished && <span className="text-xs font-bold text-green-300 bg-green-400/15 ring-1 ring-green-400/30 px-2.5 py-1 rounded-full">● Live</span>}
              </div>
              <p
                className="text-sm sm:text-base text-white/55 truncate"
                title={`${[property.city, property.state, property.zip].filter(Boolean).join(", ")}${property.property_type ? ` · ${PROPERTY_TYPES[property.property_type] || property.property_type}` : ""}`}
              >
                {[property.city, property.state, property.zip].filter(Boolean).join(", ")}
                {property.property_type && ` · ${PROPERTY_TYPES[property.property_type] || property.property_type}`}
              </p>
            </div>

           
          </div>
        </div>
      </div>

      {/* ═══ AWAITING REVIEW BANNER ═══ */}
      {hasAwaitingReview && (
        <div className="mc-animate mb-4 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4 flex items-center justify-between gap-3 flex-wrap" style={{ animationDelay: "0.08s" }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <Film className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                {awaitingReviewVideos.length === 1
                  ? "Your video is ready — review and accept, or request changes."
                  : `You have ${awaitingReviewVideos.length} videos ready to review.`}
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                1 free re-render of existing clips · New clips $4 each
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              changeTab("media");
              setTimeout(() => {
                if (firstAwaitingReviewId) {
                  const el = document.getElementById(`video-${firstAwaitingReviewId}`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }, 100);
            }}
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold flex-shrink-0"
          >
            Review Video <ChevronDown className="h-3.5 w-3.5 ml-1.5 -rotate-90" />
          </Button>
        </div>
      )}

      {/* ═══ TABS (color-coded per section) ═══ */}
      <div className="mc-animate sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-gray-900/80 backdrop-blur-xl border-b border-white/[0.05] mb-6" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const c = tab.colors;
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? `${c.bg} ${c.text} ring-1 ${c.ring}`
                    : `text-white/55 hover:text-white hover:bg-white/[0.04]`
                }`}
              >
               <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? c.text : c.textDim}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/15 text-white"
                      : `${c.bg} ${c.text}`
                  }`}>
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <span className={`absolute left-4 right-4 -bottom-3 h-0.5 rounded-full ${c.dot}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="space-y-6 pb-12">

        {/* ────────── OVERVIEW ────────── */}
        {activeTab === "overview" && (
          <div className="mc-animate space-y-6">
            <SectionCard
              title="Property Details"
              action={
                <Button
                  onClick={() => { if (editing) handleSave(); else setEditing(true); }}
                  className={editing ? `${a.btnBg} ${a.btnBgHover} text-white font-bold` : "bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"}
                  disabled={saving}
                >
                  {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving</> : editing ? <><Check className="h-4 w-4 mr-1.5" />Save</> : <><Pencil className="h-4 w-4 mr-1.5" />Edit</>}
                </Button>
              }
            >
              {editing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Address</label>
                    <input type="text" value={editForm.address || ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })} placeholder="123 Main Street" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Status", key: "status", type: "select", options: ["active", "pending", "sold", "withdrawn", "rental"] },
                      { label: "Listing Type", key: "listing_type", type: "select", options: ["sale", "rental", "commercial"] },
                      { label: "Property Type", key: "property_type", type: "select", options: Object.keys(PROPERTY_TYPES) },
                      { label: "Price", key: "price", type: "number" },
                      { label: "Bedrooms", key: "bedrooms", type: "number" },
                      { label: "Bathrooms", key: "bathrooms", type: "number", step: 0.5 },
                      { label: "Sqft", key: "sqft", type: "number" },
                      { label: "Lot Size", key: "lot_size", type: "text" },
                      { label: "Year Built", key: "year_built", type: "number" },
                    ].map((f: any) => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">{f.label}</label>
                        {f.type === "select" ? (
                          <select value={(editForm as any)[f.key] || f.options[0]} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} className={inp} style={{ colorScheme: "dark" }}>
                            {f.options.map((o: string) => <option key={o} value={o} className="bg-gray-900">{f.key === "property_type" ? PROPERTY_TYPES[o] : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.type}
                            step={f.step}
                            value={(editForm as any)[f.key] || ""}
                            onChange={e => {
                              const v = e.target.value;
                              setEditForm({ ...editForm, [f.key]: f.type === "number" ? (v ? (f.step ? parseFloat(v) : parseInt(v)) : null) : (v || null) });
                            }}
                            className={inp}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { setEditing(false); setEditForm(property); }} className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { label: "Bedrooms", value: property.bedrooms, icon: "🛏️" },
                      { label: "Bathrooms", value: property.bathrooms, icon: "🚿" },
                      { label: "Sqft", value: property.sqft?.toLocaleString(), icon: "📐" },
                      { label: "Lot Size", value: property.lot_size, icon: "🌳" },
                      { label: "Year Built", value: property.year_built, icon: "🏗️" },
                      { label: "Price", value: property.price ? `$${property.price.toLocaleString()}${property.price_period ? `/${property.price_period}` : ""}` : null, icon: "💰" },
                      { label: "Listing Type", value: property.listing_type ? property.listing_type.charAt(0).toUpperCase() + property.listing_type.slice(1) : null, icon: "📋" },
                      { label: "Property Type", value: PROPERTY_TYPES[property.property_type] || property.property_type, icon: "🏠" },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{item.icon}</span>
                          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{item.label}</p>
                        </div>
                        <p className="text-lg font-bold text-white">{item.value || <span className="text-white/30">—</span>}</p>
                      </div>
                    ))}
                  </div>
                  {property.special_features && property.special_features.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-white/[0.06]">
                      <p className="text-xs font-semibold text-white/50 mb-2.5 uppercase tracking-wider">Special Features</p>
                      <div className="flex flex-wrap gap-2">
                        {property.special_features.map((f, i) => (
                          <span key={i} className={`text-sm font-medium ${a.bg} ${a.textLight} px-3 py-1.5 rounded-full ring-1 ${a.border}`}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!property.bedrooms || !property.bathrooms || !property.price || !property.sqft) && (
                    <div className="mt-5 rounded-xl bg-amber-400/10 border border-amber-400/25 p-4 flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-200">Complete your property details</p>
                        <p className="text-sm text-amber-200/70 mt-0.5">Beds, baths, price, and sqft auto-fill your tools — saving time when creating descriptions, graphics, and property sheets.</p>
                        <button onClick={() => setEditing(true)} className="text-sm font-bold text-amber-200 hover:text-amber-100 mt-2 underline">Edit Details →</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </SectionCard>

            <SectionCard title="Amenities">
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(amenity => {
                  const selected = (property.amenities || []).includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      onClick={async () => {
                        const current = property.amenities || [];
                        const updated = selected ? current.filter((x: string) => x !== amenity.id) : [...current, amenity.id];
                        const { error } = await supabase.from("agent_properties").update({ amenities: updated, updated_at: new Date().toISOString() }).eq("id", property.id);
                        if (!error) setProperty({ ...property, amenities: updated, updated_at: new Date().toISOString() } as Property);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${selected ? `${a.bg} ${a.textLight} ring-1 ${a.border}` : "bg-white/[0.03] text-white/60 ring-1 ring-white/[0.08] hover:ring-white/[0.15]"}`}
                    >
                      <span>{amenity.icon}</span>{amenity.label}
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ────────── MEDIA ────────── */}
        {activeTab === "media" && (
          <div className="mc-animate space-y-6">
            {/* Videos */}
            <SectionCard title="Videos" count={videos.length} icon={Film}>
              {videos.length === 0 ? (
                <EmptyState icon={Film} title="No videos yet" hint="Order a video for this property to see it here."
                  action={<Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Link href={`/order?${qs}`}><Film className="h-4 w-4 mr-2" />Order a Video</Link></Button>} />
              ) : (
                <div className="space-y-5">
                  {videos.map((order: any) => {
                    const orderKey = order.order_id || order.id;
                    return (
                      <div key={order.id} id={`video-${orderKey}`}>
                        <PropertyVideoCard
                          order={order}
                          isEditing={editingOrderId === orderKey}
                          onEnterEdit={() => setEditingOrderId(orderKey)}
                          onCancelEdit={() => setEditingOrderId(null)}
                          onAccepted={() => {
                            // Optimistic local update so the card switches to "accepted" state immediately
                            setVideos(videos.map((v: any) =>
                              v.id === order.id ? { ...v, approved_at: new Date().toISOString() } : v
                            ));
                          }}
                          onChangesSubmitted={() => {
                            setEditingOrderId(null);
                            // Reload so we get the fresh order data after revision submit
                            loadProperty();
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Saved Remix Drafts — editable states, click to open in studio. */}
            <SectionCard title="Saved Remix Drafts" count={remixDrafts.length} icon={Save}
              action={<Button asChild size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold"><Link href={`/dashboard/lens/design-studio?${qs}`}><PenTool className="h-3.5 w-3.5 mr-1.5" />New Draft</Link></Button>}>
              {remixDrafts.length === 0 ? (
                <EmptyState icon={Save} title="No saved drafts yet" hint="Build a remix in the Design Studio and click Save to keep it here for later."
                  action={<Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Link href={`/dashboard/lens/design-studio?${qs}`}><Film className="h-4 w-4 mr-2" />Open Video Remix</Link></Button>} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {remixDrafts.map((draft: any) => {
                    const studioHref = `/dashboard/lens/design-studio?${qs}&draftId=${encodeURIComponent(draft.id)}`;
                    return (
                      <div key={draft.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors overflow-hidden flex flex-col">
                        <Link href={studioHref} className="flex-1 p-4 group">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/10 ring-1 ring-violet-400/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
                              <Save className="h-5 w-5 text-violet-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors" title={draft.name}>{draft.name}</p>
                              <p className="text-xs text-white/50 mt-1">
                                {draft.clip_count} clip{draft.clip_count !== 1 ? "s" : ""} · {draft.total_duration}s · {draft.size}
                              </p>
                              <p className="text-xs text-white/35 mt-0.5">Updated {timeAgo(draft.updated_at)}</p>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-white/[0.04] bg-white/[0.01]">
                          <Link href={studioHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-violet-200">
                            <PenTool className="h-3.5 w-3.5" />Open & Export
                          </Link>
                          <button
                            onClick={() => setDeleteDraftConfirm({ id: draft.id, name: draft.name })}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete draft"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Video Remixes */}
            <SectionCard title="Video Remixes" count={remixExports.length} icon={Film}
              action={<Button asChild size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold"><Link href={`/dashboard/lens/design-studio?${qs}`}><PenTool className="h-3.5 w-3.5 mr-1.5" />Create Remix</Link></Button>}>
              {remixExports.length === 0 ? (
                <EmptyState icon={Film} title="No remixes yet" hint="Remix your clips in the Design Studio to create social-ready videos."
                  action={<Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Link href={`/dashboard/lens/design-studio?${qs}`}><Film className="h-4 w-4 mr-2" />Open Video Remix</Link></Button>} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {remixExports.map((remix: any) => {
                    const dl = remix.export_url || remix.overlay_video_url;
                    const thumb = dl?.includes("cloudinary.com") && dl.includes("/video/upload/") ? thumbnailize(dl, 500, 280) : null;
                    return (
                      <div key={remix.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden group">
                        <button onClick={() => setExportModal(remix)} className="block w-full">
                          <div className="aspect-video relative bg-black">
                            {thumb ? <img src={thumb} alt="Video Remix" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="h-10 w-10 text-white/20" /></div>}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"><div className="h-14 w-14 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center"><Play className="h-6 w-6 text-white ml-0.5" /></div></div>
                          </div>
                        </button>
                        <div className="p-3 flex items-center justify-between gap-2">
                          <p className="text-sm text-white/50">{new Date(remix.created_at).toLocaleDateString()}</p>
                          <div className="flex items-center gap-2">
                            <a href={dl?.includes("/upload/") ? dl.replace("/upload/", "/upload/fl_attachment/") : dl} download className="text-sm font-semibold text-white/60 hover:text-white"><Download className="h-4 w-4" /></a>
                            <button onClick={() => handleDeleteExport(remix)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Photo Coach */}
            {allCoachApproved.length > 0 && (
              <SectionCard title="Photo Coach" count={allCoachApproved.length} icon={Camera}
                action={<button onClick={sendCoachPhotosToOrder} className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white font-bold text-sm px-4 py-2 rounded-lg"><ShoppingCart className="h-4 w-4" />Order Video{selectedCoachPhotos.size > 0 ? ` (${selectedCoachPhotos.size})` : ""}</button>}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {allCoachApproved.map((photo: any, i: number) => {
                    const key = `${photo.sessionId}-${photo.indexInSession}`;
                    const sel = selectedCoachPhotos.has(key);
                    const url = photo.edited_url || photo.url;
                    const th = thumbnailize(url, 300, 225);
                    return (
                      <button key={key} onClick={() => setSelectedCoachPhotos(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })} className={`relative rounded-xl overflow-hidden ring-2 transition-all ${sel ? `${a.ring.replace("ring-", "ring-")} ${a.ring}` : "ring-white/[0.06] hover:ring-white/[0.15]"}`}>
                        <div className="aspect-[4/3] bg-black"><img src={th} alt={photo.room || `Photo ${i+1}`} className="w-full h-full object-cover" /></div>
                        {sel && <div className={`absolute top-2 right-2 h-6 w-6 rounded-full ${a.btnBg} flex items-center justify-center`}><Check className="h-3.5 w-3.5 text-white" /></div>}
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{photo.score}/10</div>
                        {photo.room && <div className="px-2 py-1.5 bg-black/50 backdrop-blur-sm"><p className="text-xs font-semibold text-white truncate">{photo.room}</p></div>}
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Listing Photos */}
            {orderPhotos.length > 0 && (
              <SectionCard title="Listing Photos" count={orderPhotos.length} icon={ImageIcon}
                action={
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedPhotos.size > 0 && (
                      <button onClick={() => sendPhotosToOrder(orderPhotos.filter((_, i) => selectedPhotos.has(i)))} className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white font-bold text-sm px-4 py-2 rounded-lg"><ShoppingCart className="h-4 w-4" />Order ({selectedPhotos.size})</button>
                    )}
                    <button onClick={() => { if (selectedPhotos.size === orderPhotos.length) setSelectedPhotos(new Set()); else setSelectedPhotos(new Set(orderPhotos.map((_, i) => i))); }} className={`text-sm font-semibold ${a.textLight} hover:text-white`}>{selectedPhotos.size === orderPhotos.length ? "Deselect All" : "Select All"}</button>
                  </div>
                }>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {orderPhotos.map((photo: any, i: number) => {
                    const sel = selectedPhotos.has(i);
                    const th = thumbnailize(photo.secure_url, 300, 225);
                    return (
                      <button key={`${photo.orderId}-${photo.index}`} onClick={() => setSelectedPhotos(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className={`relative rounded-xl overflow-hidden ring-2 transition-all ${sel ? a.ring : "ring-white/[0.06] hover:ring-white/[0.15]"}`}>
                        <div className="aspect-[4/3] bg-black"><img src={th} alt={photo.description || `Photo ${i+1}`} className="w-full h-full object-cover" /></div>
                        {sel && <div className={`absolute top-2 right-2 h-6 w-6 rounded-full ${a.btnBg} flex items-center justify-center`}><Check className="h-3.5 w-3.5 text-white" /></div>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                  <button onClick={() => sendPhotosToOrder(orderPhotos)} className={`inline-flex items-center gap-1.5 text-sm font-semibold ${a.textLight} hover:text-white`}><ShoppingCart className="h-4 w-4" />Send All to Order</button>
                  <button onClick={() => orderPhotos.forEach((p: any, i: number) => { setTimeout(() => { const url = p.secure_url; const dl = url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url; const a = document.createElement("a"); a.href = dl; a.download = `${property.address.replace(/[^a-zA-Z0-9]/g, "_")}_photo_${i+1}.jpg`; document.body.appendChild(a); a.click(); document.body.removeChild(a); }, i * 300); })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white"><Download className="h-4 w-4" />Download All</button>
                </div>
              </SectionCard>
            )}

            {/* Video Clips */}
            {orderClips.length > 0 && (
              <SectionCard title="Video Clips" count={orderClips.length} icon={Play}
                action={selectedClips.length > 0 ? <button onClick={sendClipsToDesignStudio} className={`inline-flex items-center gap-1.5 ${a.btnBg} ${a.btnBgHover} text-white font-bold text-sm px-4 py-2 rounded-lg`}><PenTool className="h-4 w-4" />Design Studio ({selectedClips.length})</button> : undefined}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {orderClips.map((clip: any, i: number) => {
                    const sel = selectedClips.includes(i);
                    const selOrder = sel ? selectedClips.indexOf(i) + 1 : 0;
                    const pTh = clip.photoUrl ? thumbnailize(clip.photoUrl, 400, 225) : null;
                    const vTh = clip.clipUrl?.includes("cloudinary.com") && clip.clipUrl.includes("/video/upload/") ? thumbnailize(clip.clipUrl, 400, 225) : null;
                    const th = pTh || vTh;
                    return (
                      <button key={`clip-${clip.orderId}-${clip.index}`} onClick={() => setSelectedClips(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} className={`relative rounded-xl overflow-hidden ring-2 transition-all text-left ${sel ? a.ring : "ring-white/[0.06] hover:ring-white/[0.15]"}`}>
                        <div className="aspect-video bg-black">{th ? <img src={th} alt={clip.description || `Clip ${i+1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Play className="h-8 w-8 text-white/30" /></div>}</div>
                        {sel && <div className={`absolute top-2 right-2 h-6 w-6 rounded-full ${a.btnBg} flex items-center justify-center text-xs font-bold text-white`}>{selOrder}</div>}
                        {clip.camera_direction && <span className="absolute top-2 left-2 text-xs font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">{clip.camera_direction.replace(/_/g, " ")}</span>}
                        <div className="p-2.5 bg-black/30"><p className="text-xs font-semibold text-white truncate">{clip.description || `Clip ${(clip.position || i) + 1}`}</p></div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {mediaCount === 0 && (
              <EmptyState icon={Video} title="No media yet" hint="Order your first video to start building your property library."
                action={<Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Link href={`/order?${qs}`}><Film className="h-4 w-4 mr-2" />Order a Video</Link></Button>} />
            )}
          </div>
        )}

        {/* ────────── MARKETING ────────── */}
        {activeTab === "marketing" && (
          <div className="mc-animate space-y-6">
            {/* Marketing Materials */}
            <SectionCard title="Marketing Materials" count={nonRemixExports.length} icon={PenTool}>
              {nonRemixExports.length === 0 ? (
                <EmptyState icon={PenTool} title="No design exports yet" hint="Create graphics, flyers, and property PDFs in the Design Studio."
                  action={isSubscriber
                    ? <Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Link href={`/dashboard/lens/design-studio?${qs}`}><PenTool className="h-4 w-4 mr-2" />Open Design Studio</Link></Button>
                    : <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"><Link href="/lens"><Lock className="h-4 w-4 mr-2" />Subscribe</Link></Button>
                  } />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {nonRemixExports.map((exp: any) => {
                    const tl: Record<string, string> = { just_listed: "Just Listed", open_house: "Open House", price_reduced: "Price Reduced", just_sold: "Just Sold", yard_sign: "Yard Sign", property_pdf: "Property PDF", branding_card: "Branding Card" };
                    const fl: Record<string, string> = { png: "PNG", pdf: "PDF", mp4: "Video" };
                    const dl = exp.export_url || exp.overlay_video_url;
                    const thumb = dl?.includes("cloudinary.com") ? thumbnailize(dl, 400, 300) : null;
                    return (
                      <div key={exp.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                        <button onClick={() => setExportModal(exp)} className="block w-full">
                          <div className="aspect-[4/3] relative bg-black">
                            {thumb ? <img src={thumb} alt={tl[exp.template_type] || "Export"} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PenTool className="h-8 w-8 text-white/20" /></div>}
                            {exp.export_format === "mp4" && <div className="absolute inset-0 flex items-center justify-center"><div className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center"><Play className="h-4 w-4 text-white ml-0.5" /></div></div>}
                          </div>
                        </button>
                        <div className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className="text-xs font-semibold text-orange-300 bg-orange-400/15 ring-1 ring-orange-400/30 px-2 py-0.5 rounded-full">{tl[exp.template_type] || exp.template_type}</span>
                            {exp.export_format && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${exp.export_format === "mp4" ? "text-cyan-300 bg-cyan-400/15 ring-cyan-400/30" : "text-white/60 bg-white/[0.06] ring-white/[0.1]"}`}>{fl[exp.export_format] || exp.export_format.toUpperCase()}</span>}
                          </div>
                          <p className="text-xs text-white/50 mb-2">{new Date(exp.created_at).toLocaleDateString()}</p>
                          {dl && (
                            <div className="flex items-center gap-3">
                              <a href={dl.includes("/upload/") ? dl.replace("/upload/", "/upload/fl_attachment/") : dl} download className="text-sm font-semibold text-white/60 hover:text-white"><Download className="h-4 w-4" /></a>
                              <button onClick={() => handleDeleteExport(exp)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Virtual Staging */}
            <SectionCard title="Virtual Staging" count={stagings.length} icon={Sofa}
              action={stagings.length > 0 && isSubscriber ? <Button asChild size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold"><Link href={`/dashboard/lens/staging?${qs}`}>Stage Another</Link></Button> : undefined}>
              {stagings.length === 0 ? (
                <EmptyState icon={Sofa} title="No staged rooms yet" hint="Furnish empty rooms with AI in 8 different styles."
                  action={isSubscriber
                    ? <Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Link href={`/dashboard/lens/staging?${qs}`}><Sofa className="h-4 w-4 mr-2" />Stage a Room</Link></Button>
                    : <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"><Link href="/lens"><Lock className="h-4 w-4 mr-2" />Subscribe</Link></Button>
                  } />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stagings.map((s: any) => (
                    <button key={s.id} onClick={() => setStagingModal(s)} className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-white/[0.15] transition-all text-left group">
                      <div className="grid grid-cols-2 aspect-[8/3]">
                        <div className="relative overflow-hidden"><img src={s.original_url} alt="Before" className="w-full h-full object-cover" /><span className="absolute bottom-1.5 left-1.5 text-xs font-bold bg-black/70 text-white px-2 py-0.5 rounded-full">Before</span></div>
                        <div className="relative overflow-hidden"><img src={s.staged_url} alt="After" className="w-full h-full object-cover" /><span className={`absolute bottom-1.5 left-1.5 text-xs font-bold ${a.btnBg} text-white px-2 py-0.5 rounded-full`}>After</span></div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-white">{s.room_type ? s.room_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Room"}</p>
                        <p className="text-xs text-white/50 mt-0.5">{s.style} · Click to compare</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Descriptions */}
            <SectionCard title="Description" count={descriptions.length} icon={FileText}
              action={descriptions.length > 0 && isSubscriber ? <Button asChild size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold"><Link href={`/dashboard/lens/descriptions?${qs}`}>Regenerate</Link></Button> : undefined}>
              {descriptions.length === 0 ? (
                <EmptyState icon={FileText} title="No description yet" hint="AI will analyze your photos and write MLS-ready copy in 4 styles."
                  action={isSubscriber
                    ? <Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Link href={`/dashboard/lens/descriptions?${qs}`}><FileText className="h-4 w-4 mr-2" />Write Description</Link></Button>
                    : <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"><Link href="/lens"><Lock className="h-4 w-4 mr-2" />Subscribe</Link></Button>
                  } />
              ) : (
                <div className="space-y-3">
                  {descriptions.map((desc: any) => {
                    const isExp = expandedDesc === desc.id;
                    const isDeleting = deletingDescId === desc.id;
                    return (
                      <div key={desc.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className={`text-sm font-semibold ${a.textLight} capitalize`}>{desc.style || "Professional"} · {new Date(desc.created_at).toLocaleDateString()}</p>
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <button onClick={() => copyToClipboard(desc.description || "", desc.id)} className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white" title="Copy">
                              {copiedId === desc.id ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <button onClick={() => handleDeleteDescription(desc.id)} disabled={isDeleting} className="p-2 rounded-lg hover:bg-red-400/10 text-white/60 hover:text-red-400 disabled:opacity-50" title="Delete">
                              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <p className={`text-base text-white/85 leading-relaxed whitespace-pre-wrap ${isExp ? "" : "line-clamp-3"}`}>{desc.description}</p>
                        {desc.description?.length > 180 && (
                          <button onClick={() => setExpandedDesc(isExp ? null : desc.id)} className={`text-sm font-semibold ${a.textLight} hover:text-white mt-2 flex items-center gap-1`}>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExp ? "rotate-180" : ""}`} />{isExp ? "Show less" : "Read full description"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ────────── WEBSITE ────────── */}
        {activeTab === "website" && (
          <div className="mc-animate space-y-6">
            {/* Live banner or CTA */}
            {pubPublished ? (
              <div className="rounded-2xl border border-green-400/25 bg-green-400/[0.04] overflow-hidden">
                <a href={pubLiveUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative h-48 sm:h-56 bg-black overflow-hidden">
                    {heroThumb ? <img src={heroThumb} alt={property.address} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center"><Globe className="h-16 w-16 text-white/20" /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute top-4 left-4"><span className="text-green-300 bg-green-400/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full ring-1 ring-green-400/40">● Live</span></div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-white/70 text-sm font-medium mb-1">Your Property Website</p>
                      <p className="text-white text-xl sm:text-2xl font-extrabold">{property.address}</p>
                      <p className="text-white/70 text-sm mt-1 truncate">{pubSlug}.p2v.homes</p>
                    </div>
                  </div>
                </a>
                <div className="p-4 flex items-center gap-3 flex-wrap">
                  <a href={pubLiveUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 ${a.btnBg} ${a.btnBgHover} text-white font-bold text-sm px-5 py-2 rounded-full`}><Eye className="h-4 w-4" />View Live</a>
                  <button onClick={() => { navigator.clipboard.writeText(pubLiveUrl); setSlugCopied(true); setTimeout(() => setSlugCopied(false), 2000); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white">
                    {slugCopied ? <><CheckCircle className="h-4 w-4 text-green-400" />Copied!</> : <><Copy className="h-4 w-4" />Copy Link</>}
                  </button>
                </div>
              </div>
            ) : subscriptionTier === "pro" ? (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] overflow-hidden">
                <div className="relative h-48 sm:h-56 bg-black overflow-hidden">
                  {heroThumb ? <img src={heroThumb} alt={property.address} className="w-full h-full object-cover opacity-60" /> : <div className="w-full h-full flex items-center justify-center"><Globe className="h-16 w-16 text-white/20" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute top-4 left-4"><span className="text-emerald-300 bg-emerald-400/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full ring-1 ring-emerald-400/40">Not yet published</span></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white/70 text-sm font-medium mb-1">Your Pro Property Website</p>
                    <p className="text-white text-xl sm:text-2xl font-extrabold">{property.address}</p>
                    <p className="text-white/70 text-sm mt-1 truncate">Ready to go live at {pubSlug}.p2v.homes</p>
                  </div>
                </div>
                <div className="p-4">
                  <button onClick={togglePublish} disabled={pubSaving} className={`inline-flex items-center gap-1.5 ${a.btnBg} ${a.btnBgHover} text-white font-bold text-sm px-5 py-2 rounded-full`}>
                    {pubSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Publishing...</> : <><Globe className="h-4 w-4" />Set up your website now</>}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.04] overflow-hidden">
                  <a href={`https://realestatephoto2video.com/p/${pubSlug}`} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="relative h-48 sm:h-56 bg-black overflow-hidden">
                      {heroThumb ? <img src={heroThumb} alt={property.address} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center"><Globe className="h-16 w-16 text-white/20" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-4 left-4"><span className="text-cyan-300 bg-cyan-400/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full ring-1 ring-cyan-400/40">● Live</span></div>
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="text-white/70 text-sm font-medium mb-1">Your Listing Page</p>
                        <p className="text-white text-xl sm:text-2xl font-extrabold">{property.address}</p>
                        <p className="text-white/70 text-sm mt-1 truncate">realestatephoto2video.com/p/{pubSlug}</p>
                      </div>
                    </div>
                  </a>
                  <div className="p-4 flex items-center gap-3 flex-wrap">
                    <a href={`https://realestatephoto2video.com/p/${pubSlug}`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 ${a.btnBg} ${a.btnBgHover} text-white font-bold text-sm px-5 py-2 rounded-full`}><Eye className="h-4 w-4" />View your listing page</a>
                    <button onClick={() => { navigator.clipboard.writeText(`https://realestatephoto2video.com/p/${pubSlug}`); setSlugCopied(true); setTimeout(() => setSlugCopied(false), 2000); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white">
                      {slugCopied ? <><CheckCircle className="h-4 w-4 text-green-400" />Copied!</> : <><Copy className="h-4 w-4" />Copy Link</>}
                    </button>
                  </div>
                </div>

                <SectionCard title="Want your own branded website?">
                  <EmptyState icon={Globe} title="Upgrade to a full property website" hint="A custom-branded page at your-slug.p2v.homes with photos, videos, staging, booking, lead capture, and more. Own it for $399 or subscribe to Lens Pro."
                    action={<Button onClick={() => setShowUpgradeModal(true)} className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}><Globe className="h-4 w-4 mr-2" />Get Your Website</Button>} />
                </SectionCard>
              </>
            )}

            {subscriptionTier === "pro" && (
              <>
                {/* Publish toggle */}
                <SectionCard title="Publish Settings" icon={Globe}>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
                    <div>
                      <p className="text-base font-bold text-white">{pubPublished ? "Website is Live" : "Website is Off"}</p>
                      <p className="text-sm text-white/55 mt-0.5">{pubPublished ? "Visitors can see your property page." : "Toggle on to publish."}</p>
                    </div>
                    <button onClick={togglePublish} disabled={pubSaving} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${pubPublished ? "bg-green-500" : "bg-white/[0.15]"}`}>
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${pubPublished ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {/* URL */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Page URL</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={pubSlug} onChange={e => setPubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80))} className={`flex-1 ${inp}`} placeholder="123-main-st-austin-tx" />
                      <span className="text-sm text-white/50 flex-shrink-0">.p2v.homes</span>
                      <button onClick={() => { navigator.clipboard.writeText(pubLiveUrl); setSlugCopied(true); setTimeout(() => setSlugCopied(false), 2000); }} className="p-2.5 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white" title="Copy URL">
                        {slugCopied ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Link2 className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Template */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Template</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setPubTemplate(t.id)} className={`rounded-xl border-2 p-4 text-left transition-all ${pubTemplate === t.id ? `${a.border} ${a.bg}` : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`}>
                          <p className={`text-base font-bold ${pubTemplate === t.id ? a.textLight : "text-white"}`}>{t.label}</p>
                          <p className="text-sm text-white/50 mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modules */}
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Sections to Show</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(MODULE_LABELS).map(([key, label]) => {
                        const isOn = key === "lead_capture" ? true : (pubModules[key] ?? false);
                        const isLocked = key === "lead_capture";
                        const hasContent = key === "photos" ? orderPhotos.length > 0 : key === "videos" ? videos.some((v: any) => v.delivery_url || v.unbranded_delivery_url) : key === "description" ? descriptions.length > 0 : key === "staging" ? stagings.length > 0 : key === "exports" ? exports.length > 0 : true;
                        return (
                          <button key={key} onClick={() => { if (!isLocked) setPubModules(prev => ({ ...prev, [key]: !prev[key] })); }} disabled={isLocked} className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${isOn ? `${a.border} ${a.bg}` : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"} ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}>
                            <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${isOn ? `${a.btnBg}` : "bg-white/[0.06] ring-1 ring-white/[0.1]"}`}>{isOn && <Check className="h-3 w-3 text-white" />}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">{label}</p>
                              {!hasContent && key !== "booking" && key !== "lead_capture" && key !== "lensy" && <p className="text-xs text-white/40">No content yet</p>}
                              {isLocked && <p className="text-xs text-white/40">Always on</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>

                {/* Curation panels */}
                {pubModules.photos && orderPhotos.length > 0 && (
                  <CurationPanel title="Curate Photos" selected={(pubCurated.photos || []).length} total={curatedPhotoUrls.length}
                    onSelectAll={() => selectAllCurated("photos", curatedPhotoUrls)} onDeselect={() => deselectAllCurated("photos")}>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {orderPhotos.map((photo: any, i: number) => {
                        const url = photo.secure_url;
                        const isSel = (pubCurated.photos || []).includes(url);
                        return (
                          <button key={i} onClick={() => toggleCuratedItem("photos", url)} className={`relative rounded-lg overflow-hidden ring-2 transition-all ${isSel ? a.ring : "ring-transparent hover:ring-white/[0.15]"}`}>
                            <div className="aspect-[4/3] bg-black"><img src={thumbnailize(url, 150, 112)} alt="" className="w-full h-full object-cover" /></div>
                            {isSel && <div className={`absolute top-1 right-1 h-5 w-5 rounded-full ${a.btnBg} flex items-center justify-center`}><Check className="h-3 w-3 text-white" /></div>}
                          </button>
                        );
                      })}
                    </div>
                  </CurationPanel>
                )}

                {pubModules.videos && curatedVideoUrls.length > 0 && (
                  <CurationPanel title="Curate Videos" selected={(pubCurated.videos || []).length} total={curatedVideoUrls.length}
                    onSelectAll={() => selectAllCurated("videos", curatedVideoUrls.map(v => v.url))} onDeselect={() => deselectAllCurated("videos")}>
                    <div className="space-y-2">
                      {curatedVideoUrls.map(v => {
                        const isSel = (pubCurated.videos || []).includes(v.url);
                        return (
                          <button key={v.url} onClick={() => toggleCuratedItem("videos", v.url)} className={`flex items-center gap-3 w-full p-3.5 rounded-xl border transition-all text-left ${isSel ? `${a.border} ${a.bg}` : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`}>
                            <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${isSel ? a.btnBg : "bg-white/[0.06] ring-1 ring-white/[0.1]"}`}>{isSel && <Check className="h-3 w-3 text-white" />}</div>
                            <Film className={`h-5 w-5 ${a.text}`} />
                            <p className="text-sm font-semibold text-white">{v.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </CurationPanel>
                )}

                {pubModules.description && descriptions.length > 0 && (
                  <CurationPanel title="Curate Descriptions" selected={(pubCurated.descriptions || []).length} total={curatedDescIds.length}
                    onSelectAll={() => selectAllCurated("descriptions", curatedDescIds)} onDeselect={() => deselectAllCurated("descriptions")}>
                    <div className="space-y-2">
                      {descriptions.map((desc: any) => {
                        const isSel = (pubCurated.descriptions || []).includes(desc.id);
                        return (
                          <button key={desc.id} onClick={() => toggleCuratedItem("descriptions", desc.id)} className={`flex items-start gap-3 w-full p-3.5 rounded-xl border transition-all text-left ${isSel ? `${a.border} ${a.bg}` : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`}>
                            <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${isSel ? a.btnBg : "bg-white/[0.06] ring-1 ring-white/[0.1]"}`}>{isSel && <Check className="h-3 w-3 text-white" />}</div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white capitalize">{desc.style || "Professional"} style</p>
                              <p className="text-sm text-white/55 line-clamp-2 mt-0.5">{desc.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CurationPanel>
                )}

                {pubModules.staging && stagings.length > 0 && (
                  <CurationPanel title="Curate Staging" selected={(pubCurated.staging || []).length} total={curatedStagingIds.length}
                    onSelectAll={() => selectAllCurated("staging", curatedStagingIds)} onDeselect={() => deselectAllCurated("staging")}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {stagings.map((s: any) => {
                        const isSel = (pubCurated.staging || []).includes(s.id);
                        return (
                          <button key={s.id} onClick={() => toggleCuratedItem("staging", s.id)} className={`relative rounded-lg overflow-hidden ring-2 transition-all ${isSel ? a.ring : "ring-transparent hover:ring-white/[0.15]"}`}>
                            <div className="aspect-[4/3] bg-black"><img src={s.staged_url} alt="" className="w-full h-full object-cover" /></div>
                            {isSel && <div className={`absolute top-1 right-1 h-5 w-5 rounded-full ${a.btnBg} flex items-center justify-center`}><Check className="h-3 w-3 text-white" /></div>}
                            <div className="px-2 py-1 bg-black/50"><p className="text-xs font-semibold truncate text-white">{s.room_type?.replace(/_/g, " ") || "Room"}</p></div>
                          </button>
                        );
                      })}
                    </div>
                  </CurationPanel>
                )}

                {pubModules.exports && exports.length > 0 && (
                  <CurationPanel title="Curate Marketing Materials" selected={(pubCurated.exports || []).length} total={curatedExportIds.length}
                    onSelectAll={() => selectAllCurated("exports", curatedExportIds)} onDeselect={() => deselectAllCurated("exports")}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {exports.map((exp: any) => {
                        const isSel = (pubCurated.exports || []).includes(exp.id);
                        const dl = exp.export_url || exp.overlay_video_url;
                        const thumb = dl?.includes("cloudinary.com") ? thumbnailize(dl, 200, 150) : null;
                        const tl: Record<string, string> = { just_listed: "Just Listed", open_house: "Open House", price_reduced: "Price Reduced", just_sold: "Just Sold", yard_sign: "Yard Sign", property_pdf: "Property PDF", branding_card: "Branding Card", video_remix: "Video Remix" };
                        return (
                          <button key={exp.id} onClick={() => toggleCuratedItem("exports", exp.id)} className={`relative rounded-lg overflow-hidden ring-2 transition-all ${isSel ? a.ring : "ring-transparent hover:ring-white/[0.15]"}`}>
                            <div className="aspect-[4/3] bg-black">{thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PenTool className="h-6 w-6 text-white/20" /></div>}</div>
                            {isSel && <div className={`absolute top-1 right-1 h-5 w-5 rounded-full ${a.btnBg} flex items-center justify-center`}><Check className="h-3 w-3 text-white" /></div>}
                            <div className="px-2 py-1 bg-black/50"><p className="text-xs font-semibold truncate text-white">{tl[exp.template_type] || exp.template_type}</p></div>
                          </button>
                        );
                      })}
                    </div>
                  </CurationPanel>
                )}

                <div className="flex items-center gap-3 flex-wrap sticky bottom-4 bg-gray-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] shadow-2xl">
                  <Button onClick={handlePublishSave} disabled={pubSaving} className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}>
                    {pubSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Check className="h-4 w-4 mr-2" />Save Settings</>}
                  </Button>
                  {pubSlug && <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"><a href={pubLiveUrl} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-2" />Preview</a></Button>}
                  {pubPublished && <button onClick={togglePublish} disabled={pubSaving} className="ml-auto text-sm font-semibold text-red-400 hover:text-red-300">Unpublish</button>}
                </div>
              </>
            )}
          </div>
        )}

        {/* ────────── BOOKINGS ────────── */}
        {activeTab === "bookings" && (
          <div className="mc-animate space-y-6">
            <SectionCard title="Booking Calendar" icon={CalendarDays}>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
                <div>
                  <p className="text-base font-bold text-white">{bookingEnabled ? "Booking is On" : "Booking is Off"}</p>
                  <p className="text-sm text-white/55 mt-0.5">{bookingEnabled ? "Visitors can book showings from your property page." : "Enable to let visitors book showings."}</p>
                </div>
                <button onClick={toggleBookingEnabled} disabled={bookingToggling} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${bookingEnabled ? "bg-green-500" : "bg-white/[0.15]"}`}>
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${bookingEnabled ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>

              {bookingEnabled && <BookingCalendar propertyId={property.id} mode="manage" propertyAddress={property.address} />}
            </SectionCard>

            {bookingEnabled && (
              <SectionCard title="Showing Requests" icon={MessageSquare} count={unreadShowings}>
                {showingsLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div>
                ) : showingRequests.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="No requests yet" hint="They'll appear here when visitors inquire from your property page." />
                ) : (
                  <div className="space-y-3">
                    {showingRequests.map(req => (
                      <div key={req.id} className={`p-4 rounded-xl border transition-all ${!req.read ? `${a.border} ${a.bg}` : "border-white/[0.06] bg-white/[0.02]"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {!req.read && <div className={`h-2.5 w-2.5 rounded-full ${a.btnBg} flex-shrink-0 mt-1.5`} />}
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-bold text-white">{req.visitor_name}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                {req.visitor_email && <a href={`mailto:${req.visitor_email}`} className={`inline-flex items-center gap-1 text-sm ${a.textLight} hover:text-white font-medium`}><Mail className="h-3.5 w-3.5" />{req.visitor_email}</a>}
                                {req.visitor_phone && <a href={`tel:${req.visitor_phone}`} className={`inline-flex items-center gap-1 text-sm ${a.textLight} hover:text-white font-medium`}><Phone className="h-3.5 w-3.5" />{req.visitor_phone}</a>}
                              </div>
                              {req.message && <p className="text-sm text-white/70 mt-2 whitespace-pre-wrap">{req.message}</p>}
                              <p className="text-xs text-white/40 mt-2">{timeAgo(req.created_at)}{req.source && ` · via ${req.source}`}</p>
                            </div>
                          </div>
                          {!req.read && (
                            <button onClick={() => handleMarkRead(req.id)} disabled={markingRead === req.id} className="flex-shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] rounded-lg px-3 py-1.5">
                              {markingRead === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" />Mark Read</>}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Curation panel used inside Website tab ─── */
function CurationPanel({ title, selected, total, onSelectAll, onDeselect, children }: {
  title: string; selected: number; total: number;
  onSelectAll: () => void; onDeselect: () => void; children: React.ReactNode;
}) {
  const a = useAccent();
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm font-bold text-white">{title} <span className="text-white/50 font-normal">({selected} of {total})</span></p>
        <div className="flex items-center gap-3">
          <button onClick={onSelectAll} className={`text-sm font-semibold ${a.textLight} hover:text-white`}>Select All</button>
          <button onClick={onDeselect} className="text-sm font-semibold text-white/50 hover:text-white">Clear</button>
        </div>
      </div>
      {children}
    </div>
  );
}
