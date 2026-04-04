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
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set());
  const [stagingModal, setStagingModal] = useState<any>(null);
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createClient();

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
    const selected = orderClips.filter((_, i) => selectedClips.has(i));
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/properties" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">{property.address}</h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[property.status] || STATUS_COLORS.active}`}>{property.status}</span>
            </div>
            <p className="text-muted-foreground mt-0.5">{[property.city, property.state, property.zip].filter(Boolean).join(", ")}{property.property_type && ` · ${PROPERTY_TYPES[property.property_type] || property.property_type}`}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-6 mb-8">
          <QuickAction href={`/order?${qs}`} icon={Film} label="Order Video" />
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
                    {thumb ? <a href={dl} target="_blank" rel="noopener noreferrer" className="block"><div className="aspect-[4/3] relative bg-muted"><img src={thumb} alt={tl[exp.template_type] || "Export"} className="w-full h-full object-cover" />{exp.export_format === "mp4" && <div className="absolute inset-0 flex items-center justify-center"><div className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center"><Play className="h-4 w-4 text-white ml-0.5" /></div></div>}</div></a> : <div className="aspect-[4/3] bg-muted flex items-center justify-center"><PenTool className="h-8 w-8 text-muted-foreground/30" /></div>}
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
              {selectedClips.size > 0 && <button onClick={sendClipsToDesignStudio} className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs px-3 py-2 rounded-lg"><PenTool className="h-3.5 w-3.5" />Design Studio ({selectedClips.size})</button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {orderClips.map((clip: any, i: number) => {
                const sel = selectedClips.has(i);
                const pTh = clip.photoUrl?.includes("/upload/") ? clip.photoUrl.replace("/upload/", "/upload/w_400,h_225,c_fill/") : null;
                const vTh = clip.clipUrl.includes("cloudinary.com") && clip.clipUrl.includes("/video/upload/") ? clip.clipUrl.replace("/video/upload/", "/video/upload/so_1,w_400,h_225,c_fill,f_jpg/").replace(/\.(mp4|mov|webm)$/i, ".jpg") : null;
                const th = pTh || vTh;
                return (
                  <button key={`clip-${clip.orderId}-${clip.index}`} onClick={() => setSelectedClips(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${sel ? "border-violet-500 ring-2 ring-violet-500/30" : "border-border hover:border-violet-500/40"}`}>
                    <div className="aspect-video bg-black">{th ? <img src={th} alt={clip.description || `Clip ${i+1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-muted"><Play className="h-8 w-8 text-muted-foreground/30" /></div>}</div>
                    {sel && <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>}
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
