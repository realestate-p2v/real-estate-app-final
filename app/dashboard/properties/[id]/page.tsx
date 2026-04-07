"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Camera,
  Film,
  FileText,
  Sofa,
  PenTool,
  Pencil,
  X,
  Check,
  Loader2,
  Lock,
  Copy,
  Download,
  ExternalLink,
  Home,
  Image as ImageIcon,
  Play,
  ChevronDown,
  ShoppingCart,
  GripVertical,
  CheckCircle,
  Sparkles,
  Globe,
  Eye,
  Link2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string;
  address: string;
  address_normalized: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
  listing_type: string;
  price: number | null;
  price_period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lot_size: string | null;
  year_built: number | null;
  property_type: string;
  unit_count: number | null;
  special_features: string[] | null;
  website_published: boolean;
  website_slug: string | null;
  website_template: string | null;
  website_modules: Record<string, boolean> | null;
  website_curated: Record<string, string[]> | null;
  booking_enabled: boolean;
  lensy_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  withdrawn: "bg-gray-100 text-gray-600",
  rental: "bg-purple-100 text-purple-700",
};

const PROPERTY_TYPES: Record<string, string> = {
  single_family: "Single Family",
  condo: "Condo",
  apartment: "Apartment",
  townhouse: "Townhouse",
  land: "Land",
  commercial: "Commercial",
};

const TEMPLATES = [
  { id: "modern_clean", label: "Modern Clean", desc: "White, sans-serif, minimal", colors: "bg-white border-gray-200 text-gray-800" },
  { id: "luxury_dark", label: "Luxury Dark", desc: "Dark, gold accents, serif", colors: "bg-gray-900 border-amber-500/50 text-amber-100" },
  { id: "classic_light", label: "Classic Light", desc: "Cream, navy accents, traditional", colors: "bg-amber-50 border-blue-900/30 text-blue-900" },
];

const MODULE_LABELS: Record<string, string> = {
  photos: "Photos",
  videos: "Videos",
  description: "Description",
  staging: "Virtual Staging",
  exports: "Marketing Materials",
  booking: "Booking Calendar",
  lead_capture: "Lead Capture Form",
  lensy: "Lensy Chat",
};

function generateSlug(address: string, city?: string | null, state?: string | null): string {
  const parts = [address, city, state].filter(Boolean).join(" ");
  return parts
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/* ─── Before/After Slider ─── */
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

export default function SinglePropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);

  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<any[]>([]);
  const [exports, setExports] = useState<any[]>([]);
  const [stagings, setStagings] = useState<any[]>([]);
  const [orderPhotos, setOrderPhotos] = useState<any[]>([]);
  const [orderClips, setOrderClips] = useState<any[]>([]);
  const [editForm, setEditForm] = useState<Partial<Property>>({});

  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectedCoachPhotos, setSelectedCoachPhotos] = useState<Set<string>>(new Set());
  const [selectedClips, setSelectedClips] = useState<number[]>([]);
  const [stagingModal, setStagingModal] = useState<any>(null);
  const [exportModal, setExportModal] = useState<any>(null);
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Publish section state
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

  const supabase = createClient();

  // Ref for scrolling to publish section
  const publishSectionRef = useRef<HTMLDivElement>(null);

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
    if (prop.special_features && prop.special_features.length > 0) p.set("specialFeatures", prop.special_features.join(", "));
    return p.toString();
  };

  // Initialize publish state from property data
  function initPublishState(prop: Property) {
    setPubTemplate(prop.website_template || "modern_clean");
    setPubModules(prop.website_modules || {
      photos: true, videos: true, description: true, staging: true,
      exports: true, booking: false, lead_capture: true, lensy: false,
    });
    setPubCurated(prop.website_curated || {});
    setPubSlug(prop.website_slug || generateSlug(prop.address, prop.city, prop.state));
    setPubPublished(prop.website_published || false);
  }

  const loadProperty = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?redirect=/dashboard/properties"); return; }
    setUserId(user.id);
    const isAdmin = user.email === "realestatephoto2video@gmail.com";
    if (isAdmin) { setIsSubscriber(true); } else {
      const { data: usage } = await supabase.from("lens_usage").select("is_subscriber").eq("user_id", user.id).single();
      if (usage?.is_subscriber) setIsSubscriber(true);
    }
    const { data: prop, error } = await supabase.from("agent_properties").select("*").eq("id", propertyId).eq("user_id", user.id).single();
    if (error || !prop) { router.push("/dashboard/properties"); return; }
    setProperty(prop); setEditForm(prop);
    initPublishState(prop);
    const norm = prop.address_normalized;
    const { data: sessionData } = await supabase.from("lens_sessions").select("*").eq("user_id", user.id).ilike("property_address", `${norm}%`).order("created_at", { ascending: false });
    setPhotos(sessionData || []);
    const { data: orderData } = await supabase.from("orders").select("*").eq("user_id", user.id).ilike("property_address", `${norm}%`).order("created_at", { ascending: false });
    setVideos(orderData || []);
    const allPhotos: any[] = [];
    (orderData || []).forEach((order: any) => { if (Array.isArray(order.photos)) { order.photos.forEach((photo: any, idx: number) => { if (photo.secure_url) allPhotos.push({ ...photo, orderId: order.order_id || order.id, orderDate: order.created_at, index: idx }); }); } });
    setOrderPhotos(allPhotos);
    const allClips: any[] = [];
    (orderData || []).forEach((order: any) => { if (Array.isArray(order.clip_urls)) { order.clip_urls.forEach((clip: any, idx: number) => { const clipUrl = clip.url || clip.clip_file || clip.drive_url || ""; if (clipUrl) allClips.push({ ...clip, clipUrl, photoUrl: clip.photo_url || "", orderId: order.order_id || order.id, orderDate: order.created_at, index: idx }); }); } });
    setOrderClips(allClips);
    const { data: descData } = await supabase.from("lens_descriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const filteredDescs = (descData || []).filter((desc: any) => { const descAddr = desc.property_data?.address || desc.property_data?.property_address || ""; if (!descAddr) return false; const n = descAddr.trim().toLowerCase().replace(/\bstreet\b/g, "st").replace(/\bavenue\b/g, "ave").replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr").replace(/\blane\b/g, "ln").replace(/\broad\b/g, "rd").replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim(); return n.startsWith(norm) || norm.startsWith(n); });
    setDescriptions(filteredDescs);
    const { data: exportData } = await supabase.from("design_exports").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setExports(exportData || []);
    const { data: stagingData } = await supabase.from("lens_staging").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setStagings(stagingData || []);
    setLoading(false);
  }, [supabase, propertyId, router]);

  useEffect(() => { loadProperty(); }, [loadProperty]);

  const handleSave = async () => {
    if (!property) return; setSaving(true);
    const { error } = await supabase.from("agent_properties").update({ address: editForm.address || property.address, city: editForm.city || null, state: editForm.state || null, zip: editForm.zip || null, status: editForm.status || "active", listing_type: editForm.listing_type || "sale", price: editForm.price || null, bedrooms: editForm.bedrooms || null, bathrooms: editForm.bathrooms || null, sqft: editForm.sqft || null, lot_size: editForm.lot_size || null, year_built: editForm.year_built || null, property_type: editForm.property_type || "single_family", updated_at: new Date().toISOString() }).eq("id", property.id);
    if (!error) { setProperty({ ...property, ...editForm, updated_at: new Date().toISOString() } as Property); setEditing(false); }
    setSaving(false);
  };

  const handlePublishSave = async () => {
    if (!property) return;
    setPubSaving(true);
    const slug = pubSlug.trim() || generateSlug(property.address, property.city, property.state);
    const { error } = await supabase.from("agent_properties").update({
      website_template: pubTemplate,
      website_modules: pubModules,
      website_curated: pubCurated,
      website_slug: slug,
      website_published: pubPublished,
      updated_at: new Date().toISOString(),
    }).eq("id", property.id);
    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      setProperty({
        ...property,
        website_template: pubTemplate,
        website_modules: pubModules,
        website_curated: pubCurated,
        website_slug: slug,
        website_published: pubPublished,
        updated_at: new Date().toISOString(),
      } as Property);
      setPubSlug(slug);
    }
    setPubSaving(false);
  };

  const togglePublish = async () => {
    const next = !pubPublished;
    setPubPublished(next);
    if (!property) return;
    const slug = pubSlug.trim() || generateSlug(property.address, property.city, property.state);
    setPubSlug(slug);
    setPubSaving(true);
    await supabase.from("agent_properties").update({
      website_published: next,
      website_slug: slug,
      website_template: pubTemplate,
      website_modules: pubModules,
      website_curated: pubCurated,
      updated_at: new Date().toISOString(),
    }).eq("id", property.id);
    setProperty({
      ...property,
      website_published: next,
      website_slug: slug,
      website_template: pubTemplate,
      website_modules: pubModules,
      website_curated: pubCurated,
      updated_at: new Date().toISOString(),
    } as Property);
    setPubSaving(false);
  };

  function toggleCuratedItem(category: string, itemId: string) {
    setPubCurated(prev => {
      const list = prev[category] || [];
      if (list.includes(itemId)) {
        return { ...prev, [category]: list.filter(x => x !== itemId) };
      } else {
        return { ...prev, [category]: [...list, itemId] };
      }
    });
  }

  function selectAllCurated(category: string, items: string[]) {
    setPubCurated(prev => ({ ...prev, [category]: [...items] }));
  }

  function deselectAllCurated(category: string) {
    setPubCurated(prev => ({ ...prev, [category]: [] }));
  }

  const copyToClipboard = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const sendPhotosToOrder = (photoList: any[]) => {
    const photosForOrder = photoList.map((photo, i) => ({ id: `prop-${Date.now()}-${i}`, secure_url: photo.secure_url, preview: photo.secure_url, description: photo.description || "", uploadStatus: "complete", camera_direction: photo.camera_direction || null, camera_speed: photo.camera_speed || null, custom_motion: photo.custom_motion || "", crop_offset_landscape: photo.crop_offset_landscape ?? 50, crop_offset_vertical: photo.crop_offset_vertical ?? 50 }));
    sessionStorage.setItem("coach_photos_for_order", JSON.stringify(photosForOrder));
    if (property) sessionStorage.setItem("coach_property_address", property.address);
    window.location.href = "/order";
  };

  const sendCoachPhotosToOrder = () => {
    const allCoach: any[] = [];
    photos.forEach((session: any) => { if (Array.isArray(session.photos)) { session.photos.filter((p: any) => p.approved).forEach((photo: any, i: number) => { const key = `${session.id}-${i}`; if (selectedCoachPhotos.size === 0 || selectedCoachPhotos.has(key)) { allCoach.push({ id: `coach-${Date.now()}-${allCoach.length}`, secure_url: photo.edited_url || photo.url, preview: photo.edited_url || photo.url, description: photo.room || "", uploadStatus: "complete", camera_direction: null, camera_speed: null, custom_motion: "", crop_offset_landscape: 50, crop_offset_vertical: 50 }); } }); } });
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

  const QuickAction = ({ href, icon: Icon, label, requiresSub }: { href: string; icon: any; label: string; requiresSub?: boolean }) => {
    if (requiresSub && !isSubscriber) return <Link href="/lens" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-muted-foreground hover:border-accent/40 transition-all"><Lock className="h-3.5 w-3.5" />{label}</Link>;
    return <Link href={href} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm font-semibold text-accent hover:bg-accent/20 transition-all"><Icon className="h-3.5 w-3.5" />{label}</Link>;
  };

  if (loading) return <div className="min-h-screen bg-background"><Navigation /><div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></div>;
  if (!property) return null;

  const qs = buildPropertyParams(property);
  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  const allCoachApproved: any[] = [];
  photos.forEach((session: any) => { if (Array.isArray(session.photos)) { session.photos.filter((p: any) => p.approved).forEach((photo: any, i: number) => { allCoachApproved.push({ ...photo, sessionId: session.id, indexInSession: i }); }); } });

  // Build lists for curation
  const curatedPhotoUrls = orderPhotos.map(p => p.secure_url).filter(Boolean);
  const curatedVideoUrls = videos.map(v => v.delivery_url || v.unbranded_delivery_url).filter(Boolean);
  const curatedDescIds = descriptions.map(d => d.id);
  const curatedStagingIds = stagings.map(s => s.id);
  const curatedExportIds = exports.map(e => e.id);

  const pubUrl = `/p/${pubSlug}`;

  // Hero thumbnail for the website preview banner
  const heroThumb = orderPhotos[0]?.secure_url
    ? (orderPhotos[0].secure_url.includes("/upload/")
        ? orderPhotos[0].secure_url.replace("/upload/", "/upload/w_800,h_450,c_fill,q_auto/")
        : orderPhotos[0].secure_url)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Staging Before/After Modal */}
      {stagingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setStagingModal(null)}>
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{stagingModal.room_type ? stagingModal.room_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Virtual Staging"}</h3>
                <p className="text-xs text-muted-foreground">{stagingModal.style} · {new Date(stagingModal.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setStagingModal(null)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <BeforeAfterSlider beforeUrl={stagingModal.original_url} afterUrl={stagingModal.staged_url} />
            <div className="flex items-center gap-3 mt-4">
              <a href={stagingModal.staged_url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm px-4 py-2 rounded-full"><Download className="h-3.5 w-3.5" />Download Staged</a>
              <a href={stagingModal.original_url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm px-4 py-2 rounded-full"><Download className="h-3.5 w-3.5" />Original</a>
            </div>
          </div>
        </div>
      )}

      {/* Export Lightbox Modal */}
      {exportModal && (() => {
        const dl = exportModal.export_url || exportModal.overlay_video_url;
        const isVideo = exportModal.export_format === "mp4" || dl?.match(/\.(mp4|mov|webm)$/i);
        const tl: Record<string, string> = { just_listed: "Just Listed", open_house: "Open House", price_reduced: "Price Reduced", just_sold: "Just Sold", yard_sign: "Yard Sign", property_pdf: "Property PDF", branding_card: "Branding Card" };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setExportModal(null)}>
            <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">{tl[exportModal.template_type] || exportModal.template_type}</span>
                  <p className="text-xs text-muted-foreground">{new Date(exportModal.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setExportModal(null)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="bg-black">
                {isVideo ? (
                  <video src={dl} controls autoPlay playsInline className="w-full max-h-[60vh] object-contain" />
                ) : (
                  <img src={dl} alt={tl[exportModal.template_type] || "Export"} className="w-full max-h-[60vh] object-contain" />
                )}
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-border">
                <a href={dl?.includes("/upload/") ? dl.replace("/upload/", "/upload/fl_attachment/") : dl} download className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm px-4 py-2 rounded-full">
                  <Download className="h-3.5 w-3.5" />Download
                </a>
                <a href={dl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm px-4 py-2 rounded-full">
                  <ExternalLink className="h-3.5 w-3.5" />Open in New Tab
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/properties" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">{property.address}</h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[property.status] || STATUS_COLORS.active}`}>{property.status}</span>
              {pubPublished && (
                <span className="text-green-600 bg-green-100 text-[10px] font-semibold px-2 py-0.5 rounded-full">Live</span>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5">{[property.city, property.state, property.zip].filter(Boolean).join(", ")}{property.property_type && ` · ${PROPERTY_TYPES[property.property_type] || property.property_type}`}</p>
          </div>
        </div>

        {/* ═══ PROPERTY WEBSITE PREVIEW BANNER ═══ */}
        {pubPublished ? (
          <div className="mt-6 mb-8 rounded-2xl border border-border overflow-hidden bg-card hover:border-accent/40 hover:shadow-lg transition-all">
            <a href={pubUrl} target="_blank" rel="noopener noreferrer" className="block">
              <div className="relative h-48 sm:h-56 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                {heroThumb ? (
                  <img src={heroThumb} alt={property.address} className="w-full h-full object-cover opacity-90" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Globe className="h-16 w-16 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="text-green-400 bg-green-400/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full border border-green-400/30">
                    ● Live
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-white/70 text-xs font-medium mb-1">Your Property Website</p>
                  <p className="text-white text-xl sm:text-2xl font-extrabold">{property.address}</p>
                  <p className="text-white/60 text-sm mt-1 truncate">realestatephoto2video.com{pubUrl}</p>
                </div>
              </div>
            </a>
            <div className="px-5 py-3 flex items-center justify-between border-t border-border">
              <div className="flex items-center gap-3">
                <a
                  href={pubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm px-5 py-2 rounded-full transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Live Page
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(`https://realestatephoto2video.com${pubUrl}`); setSlugCopied(true); setTimeout(() => setSlugCopied(false), 2000); }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {slugCopied ? <><CheckCircle className="h-3.5 w-3.5 text-green-500" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy Link</>}
                </button>
              </div>
              <button
                onClick={() => publishSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit Settings →
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => publishSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="w-full mt-6 mb-8 rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/50 transition-all p-6 sm:p-8 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                <Globe className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-extrabold text-foreground">Create Your Property Website</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Build a beautiful listing page with photos, videos, staging, and lead capture — ready to share in minutes.
                </p>
              </div>
              <div className="hidden sm:block flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm px-5 py-2.5 rounded-full">
                  Get Started
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </span>
              </div>
            </div>
          </button>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-8">
          <a href={`/order?${qs}`} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm font-semibold text-accent hover:bg-accent/20 transition-all">
  <Film className="h-3.5 w-3.5" />Order Video
</a>
          <QuickAction href={`/dashboard/lens/coach?${qs}`} icon={Camera} label="Photo Coach" requiresSub />
          <QuickAction href={`/dashboard/lens/descriptions?${qs}`} icon={FileText} label="Write Description" requiresSub />
          <QuickAction href={`/dashboard/lens/staging?${qs}`} icon={Sofa} label="Stage Room" requiresSub />
          <QuickAction href={`/dashboard/lens/design-studio?${qs}`} icon={PenTool} label="Create Graphic" requiresSub />
        </div>

        {/* ═══ PROPERTY DETAILS ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Property Details</h2>
              <p className="text-sm text-muted-foreground mt-1">Complete details auto-fill your marketing tools, listing pages, and video branding.</p>
            </div>
            <Button onClick={() => { if (editing) handleSave(); else setEditing(true); }} variant={editing ? "default" : "outline"} className={`font-bold ${editing ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`}>
              {editing ? <><Check className="h-4 w-4 mr-1.5" />Save</> : <><Pencil className="h-4 w-4 mr-1.5" />Edit Details</>}
            </Button>
          </div>
          {editing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label><select value={editForm.status || "active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={inp}><option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option><option value="withdrawn">Withdrawn</option><option value="rental">Rental</option></select></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Listing Type</label><select value={editForm.listing_type || "sale"} onChange={(e) => setEditForm({ ...editForm, listing_type: e.target.value })} className={inp}><option value="sale">Sale</option><option value="rental">Rental</option><option value="commercial">Commercial</option></select></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Property Type</label><select value={editForm.property_type || "single_family"} onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })} className={inp}><option value="single_family">Single Family</option><option value="condo">Condo</option><option value="apartment">Apartment</option><option value="townhouse">Townhouse</option><option value="land">Land</option><option value="commercial">Commercial</option></select></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Price</label><input type="number" value={editForm.price || ""} onChange={(e) => setEditForm({ ...editForm, price: e.target.value ? parseInt(e.target.value) : null })} placeholder="499000" className={inp} /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Bedrooms</label><input type="number" value={editForm.bedrooms || ""} onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value ? parseInt(e.target.value) : null })} className={inp} /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Bathrooms</label><input type="number" value={editForm.bathrooms || ""} onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value ? parseFloat(e.target.value) : null })} step="0.5" className={inp} /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Sqft</label><input type="number" value={editForm.sqft || ""} onChange={(e) => setEditForm({ ...editForm, sqft: e.target.value ? parseInt(e.target.value) : null })} className={inp} /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Lot Size</label><input type="text" value={editForm.lot_size || ""} onChange={(e) => setEditForm({ ...editForm, lot_size: e.target.value || null })} placeholder="0.25 acres" className={inp} /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1">Year Built</label><input type="number" value={editForm.year_built || ""} onChange={(e) => setEditForm({ ...editForm, year_built: e.target.value ? parseInt(e.target.value) : null })} className={inp} /></div>
              </div>
              <Button onClick={() => { setEditing(false); setEditForm(property); }} variant="outline">Cancel</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <div key={i} className="bg-muted/30 rounded-xl p-3.5 border border-border/50">
                    <div className="flex items-center gap-2 mb-1"><span className="text-sm">{item.icon}</span><p className="text-xs font-semibold text-muted-foreground">{item.label}</p></div>
                    <p className="text-base font-bold text-foreground">{item.value || "—"}</p>
                  </div>
                ))}
              </div>
              {property.special_features && property.special_features.length > 0 && (
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Special Features</p>
                  <div className="flex flex-wrap gap-2">{property.special_features.map((f, i) => <span key={i} className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-full">{f}</span>)}</div>
                </div>
              )}
              {(!property.bedrooms || !property.bathrooms || !property.price || !property.sqft) && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Complete your property details</p>
                    <p className="text-xs text-amber-700 mt-0.5">Adding beds, baths, price, and sqft lets your tools auto-fill — saving time when creating descriptions, graphics, and property sheets.</p>
                    <button onClick={() => setEditing(true)} className="text-xs font-bold text-accent hover:text-accent/80 mt-2 underline">Edit Details →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ═══ VIDEOS — playable ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Film className="h-5 w-5 text-cyan-600" /><h2 className="text-lg font-bold text-foreground">Videos</h2>{videos.length > 0 && <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{videos.length}</span>}</div>
          </div>
          {videos.length === 0 ? (
            <div className="text-center py-10"><Film className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm text-muted-foreground mb-3">No video orders for this property yet.</p><Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"><Link href={`/order?${qs}`}><Film className="h-4 w-4 mr-2" />Order a Video</Link></Button></div>
          ) : (
            <div className="space-y-6">
              {videos.map((order: any) => {
                const sc: Record<string, string> = { delivered: "bg-green-100 text-green-700", complete: "bg-green-100 text-green-700", processing: "bg-amber-100 text-amber-700", new: "bg-blue-100 text-blue-700", pending_payment: "bg-gray-100 text-gray-600" };
                const videoUrl = order.delivery_url || order.unbranded_delivery_url;
                return (
                  <div key={order.id} className="rounded-xl bg-muted/30 border border-border overflow-hidden">
                    {videoUrl && <div className="aspect-video bg-black"><video src={videoUrl} controls playsInline preload="metadata" className="w-full h-full" /></div>}
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2"><p className="text-sm font-semibold text-foreground">{order.is_quick_video ? "Quick Video" : order.listing_package_label || "Listing Video"}</p><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${sc[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status?.replace(/_/g, " ")}</span></div>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.photo_count} photos · {order.orientation} · {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {videoUrl && <a href={videoUrl.includes("/upload/") ? videoUrl.replace("/upload/", "/upload/fl_attachment/") : videoUrl} download className="text-xs font-semibold text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5 inline mr-1" />Download</a>}
                        {order.delivery_url && <Button asChild size="sm" variant="outline" className="font-semibold"><Link href={`/video/${order.order_id}`}><ExternalLink className="h-3 w-3 mr-1.5" />Share</Link></Button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ MARKETING MATERIALS ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><PenTool className="h-5 w-5 text-orange-600" /><h2 className="text-lg font-bold text-foreground">Marketing Materials</h2>{exports.length > 0 && <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{exports.length}</span>}</div>
          </div>
          {exports.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-muted-foreground mb-3">No design exports yet.</p>{isSubscriber ? <Button asChild size="sm" variant="outline" className="font-semibold"><Link href={`/dashboard/lens/design-studio?${qs}`}>Create a Graphic</Link></Button> : <Button asChild size="sm" variant="outline" className="font-semibold"><Link href="/lens"><Lock className="h-3 w-3 mr-1.5" />Subscribe</Link></Button>}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {exports.map((exp: any) => {
                const tl: Record<string, string> = { just_listed: "Just Listed", open_house: "Open House", price_reduced: "Price Reduced", just_sold: "Just Sold", yard_sign: "Yard Sign", property_pdf: "Property PDF", branding_card: "Branding Card" };
                const fl: Record<string, string> = { png: "PNG", pdf: "PDF", mp4: "Video" };
                const dl = exp.export_url || exp.overlay_video_url;
                let thumb: string | null = null;
                if (dl?.includes("cloudinary.com")) {
                  if (exp.export_format === "mp4" || dl.match(/\.(mp4|mov|webm)$/i)) thumb = dl.replace("/video/upload/", "/video/upload/so_1,w_400,h_300,c_fill,f_jpg/").replace(/\.(mp4|mov|webm)$/i, ".jpg");
                  else if (exp.export_format === "pdf" || dl.match(/\.pdf$/i)) thumb = dl.replace("/image/upload/", "/image/upload/w_400,h_300,c_fill,pg_1,f_jpg/");
                  else thumb = dl.includes("/upload/") ? dl.replace("/upload/", "/upload/w_400,h_300,c_fill/") : dl;
                }
                return (
                  <div key={exp.id} className="rounded-xl bg-muted/30 border border-border overflow-hidden">
                    {thumb ? <button onClick={() => setExportModal(exp)} className="block w-full text-left"><div className="aspect-[4/3] relative bg-muted"><img src={thumb} alt={tl[exp.template_type] || "Export"} className="w-full h-full object-cover" />{exp.export_format === "mp4" && <div className="absolute inset-0 flex items-center justify-center"><div className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center"><Play className="h-4 w-4 text-white ml-0.5" /></div></div>}</div></button> : <button onClick={() => setExportModal(exp)} className="block w-full"><div className="aspect-[4/3] bg-muted flex items-center justify-center"><PenTool className="h-8 w-8 text-muted-foreground/30" /></div></button>}
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap"><span className="text-[10px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">{tl[exp.template_type] || exp.template_type}</span>{exp.export_format && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${exp.export_format === "mp4" ? "bg-cyan-100 text-cyan-700" : "bg-muted text-muted-foreground"}`}>{fl[exp.export_format] || exp.export_format.toUpperCase()}</span>}</div>
                      <p className="text-xs text-muted-foreground mt-1.5">{new Date(exp.created_at).toLocaleDateString()}</p>
                      {dl && <div className="flex items-center gap-2 mt-1.5"><a href={dl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-accent hover:text-accent/80">{exp.export_format === "mp4" ? "Watch" : "View"}</a><a href={dl.includes("/upload/") ? dl.replace("/upload/", "/upload/fl_attachment/") : dl} download className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">Download</a></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ PHOTO COACH — selectable ═══ */}
        {allCoachApproved.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Camera className="h-5 w-5 text-blue-600" /><h2 className="text-lg font-bold text-foreground">Photo Coach</h2><span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{allCoachApproved.length} approved</span></div>
              <button onClick={sendCoachPhotosToOrder} className="inline-flex items-center gap-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-xs px-3 py-2 rounded-lg"><ShoppingCart className="h-3.5 w-3.5" />Order Video{selectedCoachPhotos.size > 0 ? ` (${selectedCoachPhotos.size})` : ""}</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {allCoachApproved.map((photo: any, i: number) => {
                const key = `${photo.sessionId}-${photo.indexInSession}`;
                const sel = selectedCoachPhotos.has(key);
                const url = (photo.edited_url || photo.url);
                const th = url.includes("/upload/") ? url.replace("/upload/", "/upload/w_300,h_225,c_fill/") : url;
                return (
                  <button key={key} onClick={() => setSelectedCoachPhotos(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })} className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${sel ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/40"}`}>
                    <div className="aspect-[4/3] bg-muted"><img src={th} alt={photo.room || `Photo ${i+1}`} className="w-full h-full object-cover" /></div>
                    {sel && <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-accent flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>}
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{photo.score}/10</div>
                    {photo.room && <div className="px-2 py-1 bg-card"><p className="text-[10px] font-semibold text-foreground truncate">{photo.room}</p></div>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ LISTING PHOTOS — selectable ═══ */}
        {orderPhotos.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-emerald-600" /><h2 className="text-lg font-bold text-foreground">Listing Photos</h2><span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{orderPhotos.length}</span></div>
              <div className="flex items-center gap-2">
                {selectedPhotos.size > 0 && <button onClick={() => sendPhotosToOrder(orderPhotos.filter((_, i) => selectedPhotos.has(i)))} className="inline-flex items-center gap-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-xs px-3 py-2 rounded-lg"><ShoppingCart className="h-3.5 w-3.5" />Order Video ({selectedPhotos.size})</button>}
                <button onClick={() => { if (selectedPhotos.size === orderPhotos.length) setSelectedPhotos(new Set()); else setSelectedPhotos(new Set(orderPhotos.map((_, i) => i))); }} className="text-xs font-semibold text-accent hover:text-accent/80">{selectedPhotos.size === orderPhotos.length ? "Deselect All" : "Select All"}</button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {orderPhotos.map((photo: any, i: number) => {
                const sel = selectedPhotos.has(i);
                const th = photo.secure_url.includes("/upload/") ? photo.secure_url.replace("/upload/", "/upload/w_300,h_225,c_fill/") : photo.secure_url;
                return (
                  <button key={`${photo.orderId}-${photo.index}`} onClick={() => setSelectedPhotos(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${sel ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/40"}`}>
                    <div className="aspect-[4/3] bg-muted"><img src={th} alt={photo.description || `Photo ${i+1}`} className="w-full h-full object-cover" /></div>
                    {sel && <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-accent flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>}
                    {photo.description && <div className="px-2 py-1 bg-card"><p className="text-[10px] text-muted-foreground truncate">{photo.description}</p></div>}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
              <button onClick={() => sendPhotosToOrder(orderPhotos)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80"><ShoppingCart className="h-3 w-3" />Send All to Order</button>
              <button onClick={() => { orderPhotos.forEach((p: any, i: number) => { setTimeout(() => { const url = p.secure_url; const dl = url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url; const a = document.createElement("a"); a.href = dl; a.download = `${property.address.replace(/[^a-zA-Z0-9]/g, "_")}_photo_${i+1}.jpg`; document.body.appendChild(a); a.click(); document.body.removeChild(a); }, i * 300); }); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" />Download All ({orderPhotos.length})</button>
            </div>
          </section>
        )}

        {/* ═══ VIDEO CLIPS — selectable, send to design studio ═══ */}
        {orderClips.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Play className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-bold text-foreground">Video Clips</h2><span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{orderClips.length}</span></div>
              {selectedClips.length > 0 && <button onClick={sendClipsToDesignStudio} className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs px-3 py-2 rounded-lg"><PenTool className="h-3.5 w-3.5" />Design Studio ({selectedClips.length})</button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {orderClips.map((clip: any, i: number) => {
                const sel = selectedClips.includes(i);
                const selOrder = sel ? selectedClips.indexOf(i) + 1 : 0;
                const pTh = clip.photoUrl?.includes("/upload/") ? clip.photoUrl.replace("/upload/", "/upload/w_400,h_225,c_fill/") : null;
                const vTh = clip.clipUrl.includes("cloudinary.com") && clip.clipUrl.includes("/video/upload/") ? clip.clipUrl.replace("/video/upload/", "/video/upload/so_1,w_400,h_225,c_fill,f_jpg/").replace(/\.(mp4|mov|webm)$/i, ".jpg") : null;
                const th = pTh || vTh;
                return (
                  <button key={`clip-${clip.orderId}-${clip.index}`} onClick={() => setSelectedClips(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${sel ? "border-violet-500 ring-2 ring-violet-500/30" : "border-border hover:border-violet-500/40"}`}>
                    <div className="aspect-video bg-black">{th ? <img src={th} alt={clip.description || `Clip ${i+1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-muted"><Play className="h-8 w-8 text-muted-foreground/30" /></div>}</div>
                    {sel && <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white">{selOrder}</div>}
                    {clip.camera_direction && <span className="absolute top-2 left-2 text-[8px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">{clip.camera_direction.replace(/_/g, " ")}</span>}
                    <div className="p-2"><p className="text-[10px] font-semibold text-foreground truncate">{clip.description || `Clip ${(clip.position || i) + 1}`}</p></div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ VIRTUAL STAGING — click for before/after modal ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Sofa className="h-5 w-5 text-indigo-600" /><h2 className="text-lg font-bold text-foreground">Virtual Staging</h2>{stagings.length > 0 && <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{stagings.length}</span>}</div>
          </div>
          {stagings.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-muted-foreground mb-3">Stage a room to see it here.</p>{isSubscriber ? <Button asChild size="sm" variant="outline" className="font-semibold"><Link href={`/dashboard/lens/staging?${qs}`}>Stage a Room</Link></Button> : <Button asChild size="sm" variant="outline" className="font-semibold"><Link href="/lens"><Lock className="h-3 w-3 mr-1.5" />Subscribe</Link></Button>}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stagings.map((s: any) => (
                  <button key={s.id} onClick={() => setStagingModal(s)} className="rounded-xl border border-border overflow-hidden bg-muted/30 hover:border-indigo-500/40 hover:shadow-md transition-all text-left group">
                    <div className="grid grid-cols-2 aspect-[8/3]">
                      <div className="relative overflow-hidden"><img src={s.original_url} alt="Before" className="w-full h-full object-cover" /><span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">Before</span></div>
                      <div className="relative overflow-hidden"><img src={s.staged_url} alt="After" className="w-full h-full object-cover" /><span className="absolute bottom-1 left-1 text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">After</span></div>
                    </div>
                    <div className="p-2.5"><p className="text-xs font-semibold text-foreground">{s.room_type ? s.room_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Room"}</p><p className="text-[10px] text-muted-foreground">{s.style} · Click to compare</p></div>
                  </button>
                ))}
              </div>
              {isSubscriber && <div className="text-center"><Button asChild size="sm" variant="outline" className="font-semibold"><Link href={`/dashboard/lens/staging?${qs}`}>Stage Another Room</Link></Button></div>}
            </div>
          )}
        </section>

        {/* ═══ DESCRIPTIONS — collapsible ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-teal-600" /><h2 className="text-lg font-bold text-foreground">Descriptions</h2>{descriptions.length > 0 && <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{descriptions.length}</span>}</div>
          </div>
          {descriptions.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-muted-foreground mb-3">Descriptions will appear here when generated.</p>{isSubscriber ? <Button asChild size="sm" variant="outline" className="font-semibold"><Link href={`/dashboard/lens/descriptions?${qs}`}>Write a Description</Link></Button> : <Button asChild size="sm" variant="outline" className="font-semibold"><Link href="/lens"><Lock className="h-3 w-3 mr-1.5" />Subscribe</Link></Button>}</div>
          ) : (
            <div className="space-y-3">
              {descriptions.slice(0, 5).map((desc: any) => {
                const isExp = expandedDesc === desc.id;
                return (
                  <div key={desc.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground capitalize mb-1">{desc.style || "Professional"} style · {new Date(desc.created_at).toLocaleDateString()}</p>
                        <p className={`text-sm text-foreground whitespace-pre-wrap ${isExp ? "" : "line-clamp-2"}`}>{desc.description}</p>
                        {desc.description?.length > 150 && (
                          <button onClick={() => setExpandedDesc(isExp ? null : desc.id)} className="text-xs font-semibold text-accent hover:text-accent/80 mt-1.5 flex items-center gap-1">
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExp ? "rotate-180" : ""}`} />{isExp ? "Show less" : "Read full description"}
                          </button>
                        )}
                      </div>
                      <button onClick={() => copyToClipboard(desc.description || "", desc.id)} className="flex-shrink-0 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Copy">
                        {copiedId === desc.id ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ SECTION 9: PUBLISH TO WEBSITE ═══ */}
        <section ref={publishSectionRef} className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-accent" />
              <div>
                <h2 className="text-xl font-extrabold text-foreground">Publish to Website</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Create a beautiful property page and choose what to show.</p>
              </div>
            </div>
            {pubPublished && (
              <a href={pubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700">
                <Eye className="h-3.5 w-3.5" />View Live Page
              </a>
            )}
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border mb-6">
            <div>
              <p className="text-sm font-bold text-foreground">{pubPublished ? "Website is Live" : "Website is Off"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pubPublished ? "Visitors can see your property page." : "Toggle on to publish your property page."}</p>
            </div>
            <button
              onClick={togglePublish}
              disabled={pubSaving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${pubPublished ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${pubPublished ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Slug */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Page URL</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">realestatephoto2video.com/p/</span>
              <input
                type="text"
                value={pubSlug}
                onChange={(e) => setPubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80))}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="123-main-st-austin-tx"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(`https://realestatephoto2video.com${pubUrl}`); setSlugCopied(true); setTimeout(() => setSlugCopied(false), 2000); }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Copy URL"
              >
                {slugCopied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Template picker */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground mb-3">Template</label>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPubTemplate(t.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    pubTemplate === t.id
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className={`h-12 rounded-lg mb-2 border ${t.colors} flex items-center justify-center`}>
                    <span className="text-xs font-bold">Aa</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Module toggles */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground mb-3">Sections to Show</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(MODULE_LABELS).map(([key, label]) => {
                const isOn = key === "lead_capture" ? true : (pubModules[key] ?? false);
                const isLocked = key === "lead_capture";
                const hasContent = key === "photos" ? orderPhotos.length > 0 :
                  key === "videos" ? videos.some((v: any) => v.delivery_url || v.unbranded_delivery_url) :
                  key === "description" ? descriptions.length > 0 :
                  key === "staging" ? stagings.length > 0 :
                  key === "exports" ? exports.length > 0 :
                  true;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (isLocked) return;
                      setPubModules(prev => ({ ...prev, [key]: !prev[key] }));
                    }}
                    disabled={isLocked}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                      isOn
                        ? "border-accent/40 bg-accent/5"
                        : "border-border hover:border-accent/20"
                    } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      isOn ? "bg-accent border-accent" : "border-border"
                    }`}>
                      {isOn && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      {!hasContent && key !== "booking" && key !== "lead_capture" && key !== "lensy" && (
                        <p className="text-[9px] text-muted-foreground">No content yet</p>
                      )}
                      {isLocked && <p className="text-[9px] text-muted-foreground">Always on</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-asset curation panels */}
          {pubModules.photos && orderPhotos.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground">Curate Photos ({(pubCurated.photos || []).length} of {curatedPhotoUrls.length} selected)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => selectAllCurated("photos", curatedPhotoUrls)} className="text-[10px] font-semibold text-accent hover:text-accent/80">Select All</button>
                  <button onClick={() => deselectAllCurated("photos")} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {orderPhotos.map((photo: any, i: number) => {
                  const url = photo.secure_url;
                  const isSel = (pubCurated.photos || []).includes(url);
                  const th = url.includes("/upload/") ? url.replace("/upload/", "/upload/w_150,h_112,c_fill/") : url;
                  return (
                    <button key={i} onClick={() => toggleCuratedItem("photos", url)} className={`relative rounded-lg overflow-hidden border-2 transition-all ${isSel ? "border-accent" : "border-transparent hover:border-accent/30"}`}>
                      <div className="aspect-[4/3] bg-muted"><img src={th} alt="" className="w-full h-full object-cover" /></div>
                      {isSel && <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pubModules.videos && curatedVideoUrls.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground">Curate Videos ({(pubCurated.videos || []).length} of {curatedVideoUrls.length} selected)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => selectAllCurated("videos", curatedVideoUrls)} className="text-[10px] font-semibold text-accent hover:text-accent/80">Select All</button>
                  <button onClick={() => deselectAllCurated("videos")} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              </div>
              <div className="space-y-2">
                {videos.filter((v: any) => v.delivery_url || v.unbranded_delivery_url).map((order: any) => {
                  const url = order.delivery_url || order.unbranded_delivery_url;
                  const isSel = (pubCurated.videos || []).includes(url);
                  return (
                    <button key={order.id} onClick={() => toggleCuratedItem("videos", url)} className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left ${isSel ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"}`}>
                      <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${isSel ? "bg-accent border-accent" : "border-border"}`}>
                        {isSel && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <Film className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{order.is_quick_video ? "Quick Video" : order.listing_package_label || "Listing Video"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pubModules.description && descriptions.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground">Curate Descriptions ({(pubCurated.descriptions || []).length} of {curatedDescIds.length} selected)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => selectAllCurated("descriptions", curatedDescIds)} className="text-[10px] font-semibold text-accent hover:text-accent/80">Select All</button>
                  <button onClick={() => deselectAllCurated("descriptions")} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              </div>
              <div className="space-y-2">
                {descriptions.map((desc: any) => {
                  const isSel = (pubCurated.descriptions || []).includes(desc.id);
                  return (
                    <button key={desc.id} onClick={() => toggleCuratedItem("descriptions", desc.id)} className={`flex items-start gap-3 w-full p-3 rounded-xl border transition-all text-left ${isSel ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"}`}>
                      <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${isSel ? "bg-accent border-accent" : "border-border"}`}>
                        {isSel && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground capitalize">{desc.style || "Professional"} style</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{desc.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pubModules.staging && stagings.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground">Curate Staging ({(pubCurated.staging || []).length} of {curatedStagingIds.length} selected)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => selectAllCurated("staging", curatedStagingIds)} className="text-[10px] font-semibold text-accent hover:text-accent/80">Select All</button>
                  <button onClick={() => deselectAllCurated("staging")} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {stagings.map((s: any) => {
                  const isSel = (pubCurated.staging || []).includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleCuratedItem("staging", s.id)} className={`relative rounded-lg overflow-hidden border-2 transition-all ${isSel ? "border-accent" : "border-transparent hover:border-accent/30"}`}>
                      <div className="aspect-[4/3] bg-muted"><img src={s.staged_url} alt="" className="w-full h-full object-cover" /></div>
                      {isSel && <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>}
                      <div className="px-1.5 py-1 bg-card"><p className="text-[9px] font-semibold truncate">{s.room_type?.replace(/_/g, " ") || "Room"}</p></div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pubModules.exports && exports.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground">Curate Marketing Materials ({(pubCurated.exports || []).length} of {curatedExportIds.length} selected)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => selectAllCurated("exports", curatedExportIds)} className="text-[10px] font-semibold text-accent hover:text-accent/80">Select All</button>
                  <button onClick={() => deselectAllCurated("exports")} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {exports.map((exp: any) => {
                  const isSel = (pubCurated.exports || []).includes(exp.id);
                  const dl = exp.export_url || exp.overlay_video_url;
                  let thumb: string | null = null;
                  if (dl?.includes("cloudinary.com")) {
                    if (exp.export_format === "mp4" || dl.match(/\.(mp4|mov|webm)$/i)) thumb = dl.replace("/video/upload/", "/video/upload/so_1,w_200,h_150,c_fill,f_jpg/").replace(/\.(mp4|mov|webm)$/i, ".jpg");
                    else thumb = dl.includes("/upload/") ? dl.replace("/upload/", "/upload/w_200,h_150,c_fill/") : dl;
                  }
                  const tl: Record<string, string> = { just_listed: "Just Listed", open_house: "Open House", price_reduced: "Price Reduced", just_sold: "Just Sold", yard_sign: "Yard Sign", property_pdf: "Property PDF", branding_card: "Branding Card" };
                  return (
                    <button key={exp.id} onClick={() => toggleCuratedItem("exports", exp.id)} className={`relative rounded-lg overflow-hidden border-2 transition-all ${isSel ? "border-accent" : "border-transparent hover:border-accent/30"}`}>
                      <div className="aspect-[4/3] bg-muted">
                        {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PenTool className="h-6 w-6 text-muted-foreground/30" /></div>}
                      </div>
                      {isSel && <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>}
                      <div className="px-1.5 py-1 bg-card"><p className="text-[9px] font-semibold truncate">{tl[exp.template_type] || exp.template_type}</p></div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save + Preview */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handlePublishSave} disabled={pubSaving} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
              {pubSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Settings"}
            </Button>
            {pubSlug && (
              <Button asChild variant="outline" className="font-bold">
                <a href={pubUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />Preview
                </a>
              </Button>
            )}
            {pubPublished && (
              <button onClick={togglePublish} disabled={pubSaving} className="text-xs font-semibold text-red-500 hover:text-red-600 ml-auto">
                Unpublish
              </button>
            )}
          </div>
        </section>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/dashboard/properties" className="hover:text-foreground transition-colors">Properties</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
