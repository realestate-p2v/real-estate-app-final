"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, Home, X, Loader2, Merge, AlertTriangle, Check, Undo2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeAddress } from "@/lib/utils/address";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  withdrawn: "bg-gray-100 text-gray-600",
  rental: "bg-purple-100 text-purple-700",
  merged: "bg-orange-100 text-orange-700",
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

// Simple similarity check for duplicate detection
function isSimilarAddress(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nb = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (na === nb) return true;
  // Check if one is a prefix of the other (>80% length match)
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  if (shorter.length > 5 && longer.startsWith(shorter)) return true;
  if (shorter.length >= longer.length * 0.8) {
    // Simple character overlap check
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) matches++;
    }
    if (matches / longer.length > 0.85) return true;
  }
  return false;
}

export default function PropertiesPage() {
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

  // Merge state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMerge, setShowMerge] = useState(false);
  const [merging, setMerging] = useState(false);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<any>(null);

  // Undo state
  const [undoing, setUndoing] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Detect duplicate groups
  const duplicateGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const active = properties.filter((p) => p.status !== "merged");
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (isSimilarAddress(active[i].address_normalized, active[j].address_normalized)) {
          const key = active[i].id;
          if (!groups[key]) groups[key] = [key];
          if (!groups[key].includes(active[j].id)) groups[key].push(active[j].id);
          // Also mark the j property
          if (!groups[active[j].id]) groups[active[j].id] = [];
        }
      }
    }
    // Build a set of all IDs that are in a duplicate group
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
    // Default primary to the first selected that was created earliest
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

  const selectedProps = properties.filter((p) => selected.has(p.id));
  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">My Properties</h1>
              <p className="text-muted-foreground mt-1">All your listing materials organized by property</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!selectMode && properties.length >= 2 && (
              <Button onClick={() => setSelectMode(true)} variant="outline" className="font-bold">
                <Merge className="h-4 w-4 mr-2" />Merge
              </Button>
            )}
            {selectMode && (
              <Button onClick={exitSelectMode} variant="outline" className="font-bold">
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
            )}
            <Button onClick={() => setShowAdd(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
              <Plus className="h-4 w-4 mr-2" />Add Property
            </Button>
          </div>
        </div>

        {/* Duplicate detection banner */}
        {!selectMode && duplicateGroups.size > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Possible duplicates detected</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Some properties have similar addresses. Use the Merge button to combine them and consolidate all assets.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-10 sm:p-14 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">No properties yet.</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              Your properties will appear here automatically when you order a listing video, or you can add one manually.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setShowAdd(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">Add a Property</Button>
              <Button asChild variant="outline" className="font-bold"><Link href="/order">Order a Video</Link></Button>
            </div>
          </div>
        )}

        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p: any) => {
              const isSelected = selected.has(p.id);
              const isDuplicate = duplicateGroups.has(p.id);
              return (
                <div key={p.id} className="relative">
                  {/* Checkbox overlay in select mode */}
                  {selectMode && (
                    <button
                      onClick={() => toggleSelect(p.id)}
                      className={`absolute top-3 left-3 z-10 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-accent border-accent text-white"
                          : "bg-white/90 border-border hover:border-accent/60"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  )}
                  {/* Duplicate badge */}
                  {!selectMode && isDuplicate && (
                    <span className="absolute top-3 right-3 z-10 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Possible duplicate
                    </span>
                  )}
                  <Link
                    href={selectMode ? "#" : `/dashboard/properties/${p.id}`}
                    onClick={(e) => {
                      if (selectMode) {
                        e.preventDefault();
                        toggleSelect(p.id);
                      }
                    }}
                    className={`bg-card rounded-2xl border overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300 block group ${
                      isSelected ? "border-accent ring-2 ring-accent/30" : "border-border"
                    }`}
                  >
                    <div className="h-36 w-full bg-muted relative">
                      {thumbnails[p.id] ? (
                        <img src={thumbnails[p.id]} alt={p.address} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Home className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <span className={`absolute top-3 ${selectMode ? "left-12" : "left-3"} text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize shadow-sm ${STATUS_COLORS[p.status] || STATUS_COLORS.active}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors truncate">{p.address}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
                      <div className="flex items-center gap-3 mt-3">
                        {p.bedrooms && <span className="text-xs text-muted-foreground">{p.bedrooms} bd</span>}
                        {p.bathrooms && <span className="text-xs text-muted-foreground">{p.bathrooms} ba</span>}
                        {p.sqft && <span className="text-xs text-muted-foreground">{p.sqft.toLocaleString()} sqft</span>}
                        {p.price && <span className="text-xs font-semibold text-foreground">${p.price.toLocaleString()}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">{timeAgo(p.updated_at || p.created_at)}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating merge bar */}
      {selectMode && selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-border rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-semibold text-foreground">{selected.size} properties selected</span>
          <Button onClick={openMergeModal} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            <Merge className="h-4 w-4 mr-2" />Merge Selected
          </Button>
        </div>
      )}

      {/* Merge modal */}
      {showMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Merge Properties</h2>
              <button onClick={() => { setShowMerge(false); setMergeResult(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {mergeResult ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Merge complete
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {mergeResult.merged?.length || 0} properties merged into &quot;{mergeResult.primaryAddress}&quot;
                  </p>
                </div>
                {mergeResult.merged?.map((m: any) => (
                  <div key={m.mergedId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{m.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {Object.entries(m.assetsMoved)
                          .filter(([, v]) => (v as number) > 0)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(", ") || "No assets to move"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUndo(m.mergedId)}
                      disabled={undoing === m.mergedId}
                      className="text-xs"
                    >
                      {undoing === m.mergedId ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Undo2 className="h-3 w-3 mr-1" />Undo</>}
                    </Button>
                  </div>
                ))}
                <Button onClick={() => { setShowMerge(false); setMergeResult(null); }} className="w-full mt-4 font-bold">
                  Done
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the primary property. All assets from the other properties will be moved to it. This can be undone within 30 days.
                </p>
                <div className="space-y-3 mb-6">
                  {selectedProps.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        primaryId === p.id
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="primary"
                        checked={primaryId === p.id}
                        onChange={() => setPrimaryId(p.id)}
                        className="mt-1 accent-[hsl(var(--accent))]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.address}</p>
                        <p className="text-xs text-muted-foreground">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
                        {primaryId === p.id && (
                          <span className="inline-block mt-1 bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                            Primary — keeps this listing
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowMerge(false)} variant="outline" className="flex-1 font-bold">Cancel</Button>
                  <Button onClick={handleMerge} disabled={!primaryId || merging} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                    {merging ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Merging...</> : `Merge ${selected.size} Properties`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add property modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Add Property</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Address *</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" className={inp} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-semibold mb-1.5">City</label><input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Austin" className={inp} /></div>
                <div><label className="block text-sm font-semibold mb-1.5">State</label><input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="TX" className={inp} /></div>
                <div><label className="block text-sm font-semibold mb-1.5">Zip</label><input type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} placeholder="78701" className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold mb-1.5">Beds</label><input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} placeholder="3" className={inp} /></div>
                <div><label className="block text-sm font-semibold mb-1.5">Baths</label><input type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} placeholder="2" step="0.5" className={inp} /></div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Property Type</label>
                <select value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} className={inp}>
                  <option value="single_family">Single Family</option><option value="condo">Condo</option><option value="apartment">Apartment</option><option value="townhouse">Townhouse</option><option value="land">Land</option><option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inp}>
                  <option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option><option value="withdrawn">Withdrawn</option><option value="rental">Rental</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1 font-bold">Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.address.trim() || saving} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
