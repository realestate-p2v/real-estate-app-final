// app/dashboard/properties/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardShell, DarkInput, DarkLabel, DarkSelect, useAccent } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, Home, X, Loader2, Merge, AlertTriangle, Check, Undo2, Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeAddress } from "@/lib/utils/address";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-400/15 text-green-300 border border-green-400/20",
  pending: "bg-amber-400/15 text-amber-300 border border-amber-400/20",
  sold: "bg-blue-400/15 text-blue-300 border border-blue-400/20",
  withdrawn: "bg-white/[0.06] text-white/50 border border-white/[0.08]",
  rental: "bg-purple-400/15 text-purple-300 border border-purple-400/20",
  merged: "bg-orange-400/15 text-orange-300 border border-orange-400/20",
};

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

function isSimilarAddress(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nb = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (na === nb) return true;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  if (shorter.length > 5 && longer.startsWith(shorter)) return true;
  if (shorter.length >= longer.length * 0.8) {
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) matches++;
    }
    if (matches / longer.length > 0.85) return true;
  }
  return false;
}

function extractPublicId(cloudinaryUrl: string): string | null {
  if (!cloudinaryUrl) return null;
  try {
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch { return null; }
}

async function deleteFromCloudinary(url: string, resourceType: string = "image"): Promise<boolean> {
  const publicId = extractPublicId(url);
  if (!publicId) return false;
  try {
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId, resource_type: resourceType }),
    });
    const data = await res.json();
    return data.success;
  } catch { return false; }
}

function extractAllUrls(obj: any): string[] {
  if (!obj) return [];
  if (typeof obj === "string") return obj.startsWith("http") ? [obj] : [];
  if (Array.isArray(obj)) return obj.flatMap(extractAllUrls);
  if (typeof obj === "object") return Object.values(obj).flatMap(extractAllUrls);
  return [];
}

/* ═══════════════════════════════════════════════════════════════
   deletePropertyWithCleanup (April 21 evening FIX)

   OLD behavior: awaited every Cloudinary cleanup BEFORE deleting
   the property row. If any Cloudinary call threw, the outer catch
   swallowed it and the row was never deleted → property reappeared
   on refresh.

   NEW behavior:
     1. Read the property + collect related asset URLs (fast, DB only)
     2. DELETE THE PROPERTY ROW FIRST (what the user cares about)
     3. Clean up related DB rows (best-effort)
     4. Fire Cloudinary deletes as Promise.allSettled (no single
        failure can break the chain)

   Orphaned Cloudinary assets are harmless — fixable later with a
   background cleanup job. User gets immediate feedback that the
   property is gone.
   ═══════════════════════════════════════════════════════════════ */
async function deletePropertyWithCleanup(propertyId: string) {
  const supabase = createClient();

  // ─── Step 1: Read property for asset collection ───
  const { data: prop, error: propReadErr } = await supabase
    .from("agent_properties")
    .select("id, address_normalized, website_curated, optimized_photos")
    .eq("id", propertyId)
    .single();

  if (propReadErr || !prop) {
    throw new Error(propReadErr?.message || "Property not found");
  }

  // ─── Step 2: Collect related data (reads only) ───
  const { data: exps } = await supabase
    .from("design_exports")
    .select("id, export_url, template_type")
    .eq("property_id", propertyId);

  // Orders: match by address_normalized (orders has no property_id FK)
  const norm = prop.address_normalized;
  const ordersQuery = norm
    ? await supabase
        .from("orders")
        .select("id, photos, delivery_url, unbranded_delivery_url, branded_video_url, unbranded_video_url, clip_urls")
        .ilike("property_address", `${norm}%`)
    : { data: [] as any[] };
  const orders = ordersQuery.data || [];

  const orderPhotoUrls: string[] = [];
  for (const o of orders) {
    orderPhotoUrls.push(...extractAllUrls(o.photos));
  }

  const { data: stagings } = orderPhotoUrls.length > 0
    ? await supabase
        .from("lens_staging")
        .select("id, staged_url, original_url")
        .in("original_url", orderPhotoUrls)
    : { data: [] as any[] };

  // ─── Step 3: DELETE THE PROPERTY ROW FIRST ───
  await supabase
    .from("agent_properties")
    .update({ merged_into_id: null })
    .eq("merged_into_id", propertyId);

  // Null out descriptions FK before delete (safer than relying on CASCADE)
  await supabase
    .from("lens_descriptions")
    .update({ property_id: null })
    .eq("property_id", propertyId);

  const { error: propDeleteErr } = await supabase
    .from("agent_properties")
    .delete()
    .eq("id", propertyId);

  if (propDeleteErr) {
    throw new Error(`Property delete failed: ${propDeleteErr.message}`);
  }

  // ─── Step 4: Clean up related DB rows (best-effort) ───
  const dbCleanup = async () => {
    try {
      if (exps && exps.length > 0) {
        await supabase.from("design_exports").delete().in("id", exps.map(e => e.id));
      }
      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        await supabase.from("order_revisions").delete().in("order_id", orderIds);
        await supabase.from("order_messages").delete().in("order_id", orderIds);
        await supabase.from("orders").delete().in("id", orderIds);
      }
      if (stagings && stagings.length > 0) {
        await supabase.from("lens_staging").delete().in("id", stagings.map(s => s.id));
      }
    } catch (e) {
      console.warn("Post-delete DB cleanup error:", e);
    }
  };

  // ─── Step 5: Cloudinary cleanup (fire-and-forget) ───
  const cloudinaryCleanup = async () => {
    try {
      const deletions: Promise<boolean>[] = [];

      for (const exp of (exps || [])) {
        if (exp.export_url?.includes("cloudinary")) {
          const rt = exp.template_type?.startsWith("video_remix") ? "video" : "image";
          deletions.push(deleteFromCloudinary(exp.export_url, rt));
        }
      }
      for (const o of orders) {
        for (const vUrl of [o.delivery_url, o.unbranded_delivery_url, o.branded_video_url, o.unbranded_video_url].filter(Boolean)) {
          if (vUrl?.includes("cloudinary")) deletions.push(deleteFromCloudinary(vUrl, "video"));
        }
        const clips = Array.isArray(o.clip_urls) ? o.clip_urls : [];
        for (const clip of clips) {
          const clipUrl = typeof clip === "string" ? clip : clip?.url;
          if (clipUrl?.includes("cloudinary")) deletions.push(deleteFromCloudinary(clipUrl, "video"));
        }
      }
      for (const url of orderPhotoUrls) {
        if (url.includes("cloudinary")) deletions.push(deleteFromCloudinary(url));
      }
      for (const s of (stagings || [])) {
        if (s.staged_url?.includes("cloudinary")) deletions.push(deleteFromCloudinary(s.staged_url));
      }
      for (const url of extractAllUrls(prop.website_curated)) {
        if (url.includes("cloudinary")) deletions.push(deleteFromCloudinary(url));
      }
      for (const opt of (prop.optimized_photos || [])) {
        if (opt?.url?.includes("cloudinary")) deletions.push(deleteFromCloudinary(opt.url));
      }

      await Promise.allSettled(deletions);
    } catch (e) {
      console.warn("Cloudinary cleanup error:", e);
    }
  };

  // Kick off background cleanup — don't await
  dbCleanup();
  cloudinaryCleanup();
}

export default function PropertiesPage() {
  return (
    <DashboardShell accent="cyan" maxWidth="6xl">
      <PropertiesBody />
    </DashboardShell>
  );
}

function PropertiesBody() {
  const a = useAccent();
  const [properties, setProperties] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [form, setForm] = useState({
    address: "", city: "", state: "", zip: "",
    bedrooms: "", bathrooms: "",
    property_type: "single_family", status: "active",
  });

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMerge, setShowMerge] = useState(false);
  const [merging, setMerging] = useState(false);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<any>(null);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const duplicateGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const active = properties.filter((p) => p.status !== "merged");
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (isSimilarAddress(active[i].address_normalized, active[j].address_normalized)) {
          const key = active[i].id;
          if (!groups[key]) groups[key] = [key];
          if (!groups[key].includes(active[j].id)) groups[key].push(active[j].id);
          if (!groups[active[j].id]) groups[active[j].id] = [];
        }
      }
    }
    const dupIds = new Set<string>();
    Object.values(groups).forEach((ids) => {
      if (ids.length >= 2) ids.forEach((id) => dupIds.add(id));
    });
    return dupIds;
  }, [properties]);

  async function fetchProperties() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUid(user.id);
    const { data } = await supabase
      .from("agent_properties")
      .select("*")
      .eq("user_id", user.id)
      .is("merged_into_id", null)
      .order("updated_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);

    if (data && data.length > 0) {
      const thumbMap: Record<string, string> = {};
      for (const prop of data) {
        const { data: orders } = await supabase
          .from("orders")
          .select("photos")
          .eq("user_id", user.id)
          .ilike("property_address", `${prop.address_normalized}%`)
          .order("created_at", { ascending: false })
          .limit(1);
        if (orders && orders.length > 0 && Array.isArray(orders[0].photos) && orders[0].photos.length > 0) {
          const url = orders[0].photos[0]?.secure_url;
          if (url) thumbMap[prop.id] = url;
        }
      }
      setThumbnails(thumbMap);
    }
  }

  async function handleAdd() {
    if (!form.address.trim() || !uid) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("agent_properties").insert({
      user_id: uid,
      address: form.address.trim(),
      address_normalized: normalizeAddress(form.address.trim()),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
      property_type: form.property_type,
      status: form.status,
    });
    if (error) {
      alert("Failed to add property: " + error.message);
    } else {
      setForm({ address: "", city: "", state: "", zip: "", bedrooms: "", bathrooms: "", property_type: "single_family", status: "active" });
      setShowAdd(false);
      await fetchProperties();
    }
    setSaving(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openMergeModal() {
    if (selected.size < 2) return;
    const selectedProps = properties.filter((p) => selected.has(p.id));
    selectedProps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setPrimaryId(selectedProps[0]?.id || null);
    setMergeResult(null);
    setShowMerge(true);
  }

  async function handleMerge() {
    if (!primaryId || selected.size < 2) return;
    setMerging(true);
    const mergeIds = Array.from(selected).filter((id) => id !== primaryId);
    try {
      const res = await fetch("/api/properties/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId, mergeIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Merge failed: " + (data.error || "Unknown error"));
      } else {
        setMergeResult(data);
        setSelected(new Set());
        setSelectMode(false);
        await fetchProperties();
      }
    } catch (err: any) {
      alert("Merge failed: " + err.message);
    }
    setMerging(false);
  }

  async function handleUndo(mergeId: string) {
    setUndoing(mergeId);
    try {
      const res = await fetch("/api/properties/merge/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mergeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Undo failed: " + (data.error || "Unknown error"));
      } else {
        await fetchProperties();
      }
    } catch (err: any) {
      alert("Undo failed: " + err.message);
    }
    setUndoing(null);
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleDeleteProperty(propertyId: string, address: string) {
    const ok = window.confirm(`Delete "${address}"?\n\nThis will permanently remove the property and all associated cloud storage files (videos, photos, exports, staging). This cannot be undone.`);
    if (!ok) return;
    setDeletingId(propertyId);
    try {
      await deletePropertyWithCleanup(propertyId);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (e: any) {
      console.error("Property delete failed:", e);
      alert(`Failed to delete property: ${e?.message || "Please try again."}`);
    }
    setDeletingId(null);
  }

  const selectedProps = properties.filter((p) => selected.has(p.id));

  return (
    <>
      {/* Header */}
      <div className="mc-animate flex items-center justify-between mb-8 gap-3" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white truncate">My Properties</h1>
            <p className="text-white/50 mt-1 text-sm hidden sm:block">All your listing materials organized by property</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!selectMode && properties.length >= 2 && (
            <Button onClick={() => setSelectMode(true)} className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 font-bold text-xs px-3 sm:text-sm sm:px-4">
              <Merge className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Merge</span>
            </Button>
          )}
          {selectMode && (
            <Button onClick={exitSelectMode} className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 font-bold text-xs px-3 sm:text-sm sm:px-4">
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          )}
          <Button onClick={() => setShowAdd(true)} className={`${a.btnBg} ${a.btnBgHover} text-white font-bold text-xs px-3 sm:text-sm sm:px-4 shadow-lg ${a.btnShadow}`}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Duplicate detection banner */}
      {!selectMode && duplicateGroups.size > 0 && (
        <div className="mc-animate mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 flex items-start gap-3" style={{ animationDelay: "0.08s" }}>
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Possible duplicates detected</p>
            <p className="text-sm text-amber-200/70 mt-0.5">
              Some properties have similar addresses. Use the Merge button to combine them and consolidate all assets.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`h-8 w-8 animate-spin ${a.text}`} />
        </div>
      )}

      {!loading && properties.length === 0 && (
        <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-10 sm:p-14 text-center backdrop-blur-sm" style={{ animationDelay: "0.1s" }}>
          <div className={`mx-auto h-16 w-16 rounded-2xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center mb-6`}>
            <Home className={`h-8 w-8 ${a.text}`} />
          </div>
          <h2 className="text-xl font-bold text-white/90 mb-3">No properties yet.</h2>
          <p className="text-white/50 max-w-md mx-auto mb-8 leading-relaxed">
            Your properties will appear here automatically when you order a listing video, or you can add one manually.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setShowAdd(true)} className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}>Add a Property</Button>
            <Button asChild className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 font-bold"><Link href="/order">Order a Video</Link></Button>
          </div>
        </div>
      )}

      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p: any, i: number) => {
            const isSelected = selected.has(p.id);
            const isDuplicate = duplicateGroups.has(p.id);
            return (
              <div key={p.id} className="mc-chip-animate relative group" style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
                {selectMode && (
                  <button
                    onClick={() => toggleSelect(p.id)}
                    className={`absolute top-3 left-3 z-10 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? `${a.btnBg} border-transparent text-white`
                        : "bg-black/50 backdrop-blur-sm border-white/30 hover:border-white/60"
                    }`}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )}
                {!selectMode && isDuplicate && (
                  <span className="absolute top-3 right-3 z-10 bg-amber-400/15 text-amber-300 border border-amber-400/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Possible duplicate
                  </span>
                )}
                {!selectMode && !isDuplicate && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProperty(p.id, p.address); }}
                    disabled={deletingId === p.id}
                    className="absolute top-3 right-3 z-10 h-7 w-7 rounded-lg bg-black/60 hover:bg-red-600 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                    title="Delete property"
                  >
                    {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-white" />}
                  </button>
                )}
                <Link
                  href={selectMode ? "#" : `/dashboard/properties/${p.id}`}
                  onClick={(e) => {
                    if (selectMode) {
                      e.preventDefault();
                      toggleSelect(p.id);
                    }
                  }}
                  className={`block rounded-2xl border overflow-hidden bg-white/[0.03] transition-all duration-300 group ${
                    isSelected
                      ? `${a.border} ring-2 ${a.ring}`
                      : `border-white/[0.06] hover:${a.border} hover:bg-white/[0.05]`
                  }`}
                >
                  <div className="h-36 w-full bg-white/[0.04] relative">
                    {thumbnails[p.id] ? (
                      <img src={thumbnails[p.id]} alt={p.address} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(99,102,241,0.12) 50%, rgba(168,85,247,0.1) 100%)" }}>
                        <Home className="h-10 w-10 text-white/20" />
                      </div>
                    )}
                    <span className={`absolute top-3 ${selectMode ? "left-12" : "left-3"} text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize backdrop-blur-sm ${STATUS_COLORS[p.status] || STATUS_COLORS.active}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className={`text-lg font-bold text-white/90 group-hover:${a.textLight} transition-colors truncate`}>{p.address}</h3>
                    <p className="text-sm text-white/40 mt-0.5 truncate">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {p.bedrooms && <span className="text-xs text-white/40">{p.bedrooms} bd</span>}
                      {p.bathrooms && <span className="text-xs text-white/40">{p.bathrooms} ba</span>}
                      {p.sqft && <span className="text-xs text-white/40">{p.sqft.toLocaleString()} sqft</span>}
                      {p.price && <span className="text-xs font-semibold text-white/80">${p.price.toLocaleString()}</span>}
                    </div>
                    <p className="text-xs text-white/30 mt-3">{timeAgo(p.updated_at || p.created_at)}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating merge bar */}
      {selectMode && selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[calc(100vw-2rem)]">
          <div className="bg-gray-900/95 backdrop-blur-lg border border-white/[0.1] rounded-2xl shadow-2xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm font-semibold text-white/90 whitespace-nowrap">
              {selected.size} selected
            </span>
            <Button onClick={openMergeModal} className={`${a.btnBg} ${a.btnBgHover} text-white font-bold text-xs sm:text-sm px-3 sm:px-4`}>
              <Merge className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Merge {selected.size} Properties</span>
              <span className="sm:hidden">Merge</span>
            </Button>
          </div>
        </div>
      )}

      {/* Merge modal */}
      {showMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-gray-900 rounded-2xl border border-white/[0.1] p-5 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white/90">Merge Properties</h2>
              <button onClick={() => { setShowMerge(false); setMergeResult(null); }} className="text-white/40 hover:text-white/80 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {mergeResult ? (
              <div>
                <div className="rounded-xl border border-green-400/20 bg-green-400/[0.06] p-4 mb-4">
                  <p className="text-sm font-semibold text-green-300 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Merge complete
                  </p>
                  <p className="text-sm text-green-200/70 mt-1">
                    {mergeResult.merged?.length || 0} properties merged into &quot;{mergeResult.primaryAddress}&quot;
                  </p>
                </div>
                {mergeResult.merged?.map((m: any) => (
                  <div key={m.mergedId} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90 truncate">{m.address}</p>
                      <p className="text-xs text-white/40 truncate">
                        {Object.entries(m.assetsMoved)
                          .filter(([, v]) => (v as number) > 0)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(", ") || "No assets to move"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUndo(m.mergedId)}
                      disabled={undoing === m.mergedId}
                      className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 text-xs flex-shrink-0"
                    >
                      {undoing === m.mergedId ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Undo2 className="h-3 w-3 mr-1" />Undo</>}
                    </Button>
                  </div>
                ))}
                <Button onClick={() => { setShowMerge(false); setMergeResult(null); }} className={`w-full mt-4 font-bold ${a.btnBg} ${a.btnBgHover} text-white`}>
                  Done
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-white/50 mb-4">
                  Choose the primary property. All assets from the other properties will be moved to it. This can be undone within 30 days.
                </p>
                <div className="space-y-3 mb-6">
                  {selectedProps.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        primaryId === p.id
                          ? `${a.border} ${a.bg}`
                          : "border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="primary"
                        checked={primaryId === p.id}
                        onChange={() => setPrimaryId(p.id)}
                        className="mt-1 flex-shrink-0 accent-cyan-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{p.address}</p>
                        <p className="text-xs text-white/40 truncate">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
                        {primaryId === p.id && (
                          <span className={`inline-block mt-1 ${a.bg} ${a.text} text-xs font-bold px-2 py-0.5 rounded-full border ${a.border}`}>
                            Primary — keeps this listing
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowMerge(false)} className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 font-bold">Cancel</Button>
                  <Button onClick={handleMerge} disabled={!primaryId || merging} className={`flex-1 ${a.btnBg} ${a.btnBgHover} text-white font-bold text-xs sm:text-sm`}>
                    {merging ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Merging...</> : <>Merge {selected.size}<span className="hidden sm:inline">&nbsp;Properties</span></>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add property modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-gray-900 rounded-2xl border border-white/[0.1] p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white/90">Add Property</h2>
              <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white/80 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <DarkLabel>Address *</DarkLabel>
                <DarkInput value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><DarkLabel>City</DarkLabel><DarkInput value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Austin" /></div>
                <div><DarkLabel>State</DarkLabel><DarkInput value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="TX" /></div>
                <div><DarkLabel>Zip</DarkLabel><DarkInput value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} placeholder="78701" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><DarkLabel>Beds</DarkLabel><DarkInput type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} placeholder="3" /></div>
                <div><DarkLabel>Baths</DarkLabel><DarkInput type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} placeholder="2" step="0.5" /></div>
              </div>
              <div>
                <DarkLabel>Property Type</DarkLabel>
                <DarkSelect value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })}>
                  <option value="single_family">Single Family</option><option value="condo">Condo</option><option value="apartment">Apartment</option><option value="townhouse">Townhouse</option><option value="land">Land</option><option value="commercial">Commercial</option>
                </DarkSelect>
              </div>
              <div>
                <DarkLabel>Status</DarkLabel>
                <DarkSelect value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option><option value="withdrawn">Withdrawn</option><option value="rental">Rental</option>
                </DarkSelect>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowAdd(false)} className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 font-bold">Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.address.trim() || saving} className={`flex-1 ${a.btnBg} ${a.btnBgHover} text-white font-bold`}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-white/[0.04] pt-6 pb-8 text-center">
        <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
      </div>
    </>
  );
}
