"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Home, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeAddress } from "@/lib/utils/address";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  withdrawn: "bg-gray-100 text-gray-600",
  rental: "bg-purple-100 text-purple-700",
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

  useEffect(() => {
    fetchProperties();
  }, []);

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
      .order("updated_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);

    // Fetch thumbnails from orders (after setting loading false so cards render immediately)
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
          <Button onClick={() => setShowAdd(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            <Plus className="h-4 w-4 mr-2" />Add Property
          </Button>
        </div>

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
            {properties.map((p: any) => (
              <Link
                key={p.id}
                href={`/dashboard/properties/${p.id}`}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300 block group"
              >
                {/* Thumbnail */}
                <div className="h-36 w-full bg-muted relative">
                  {thumbnails[p.id] ? (
                    <img
                      src={thumbnails[p.id]}
                      alt={p.address}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Home className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Status badge overlaid on thumbnail */}
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize shadow-sm ${STATUS_COLORS[p.status] || STATUS_COLORS.active}`}>
                    {p.status}
                  </span>
                </div>

                {/* Card body */}
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
            ))}
          </div>
        )}
      </div>

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
