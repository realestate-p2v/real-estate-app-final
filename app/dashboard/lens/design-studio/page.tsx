"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Home,
  Camera,
  Film,
  FileText,
  PenTool,
  X,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeAddress } from "@/lib/utils/address";

interface Property {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
  updated_at: string;
  photo_count?: number;
  video_count?: number;
  description_count?: number;
  export_count?: number;
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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo}mo ago`;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formZip, setFormZip] = useState("");
  const [formBedrooms, setFormBedrooms] = useState("");
  const [formBathrooms, setFormBathrooms] = useState("");
  const [formPropertyType, setFormPropertyType] = useState("single_family");
  const [formStatus, setFormStatus] = useState("active");

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // --- Backfill from existing orders ---
      try {
        const { data: orders } = await supabase
          .from("orders")
          .select("property_address, property_city, property_state, property_bedrooms, property_bathrooms")
          .eq("user_id", user.id)
          .not("property_address", "is", null);

        if (orders && orders.length > 0) {
          const { data: existingProps } = await supabase
            .from("agent_properties")
            .select("address_normalized")
            .eq("user_id", user.id);

          const existingNorms = new Set(
            (existingProps || []).map((p: any) => p.address_normalized)
          );

          const seen = new Set<string>();
          for (const order of orders) {
            if (!order.property_address || !order.property_address.trim()) continue;
            const norm = normalizeAddress(order.property_address);
            if (!norm || seen.has(norm) || existingNorms.has(norm)) continue;
            seen.add(norm);

            // Use upsert to handle race conditions — onConflict on the unique index
            const { error: insertErr } = await supabase
              .from("agent_properties")
              .upsert(
                {
                  user_id: user.id,
                  address: order.property_address.trim(),
                  address_normalized: norm,
                  city: order.property_city || null,
                  state: order.property_state || null,
                  bedrooms: order.property_bedrooms ? Number(order.property_bedrooms) : null,
                  bathrooms: order.property_bathrooms ? Number(order.property_bathrooms) : null,
                },
                { onConflict: "user_id,address_normalized", ignoreDuplicates: true }
              );

            if (insertErr) {
              console.log("[Properties] Backfill skip:", norm, insertErr.message);
            }
          }
        }
      } catch (backfillErr) {
        console.error("[Properties] Backfill error (non-fatal):", backfillErr);
      }

      // --- Fetch properties ---
      const { data: props, error: propsError } = await supabase
        .from("agent_properties")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (propsError || !props || props.length === 0) {
        if (propsError) console.error("[Properties] Fetch error:", propsError);
        setProperties([]);
        setLoading(false);
        return;
      }

      // --- Count assets ---
      // Fetch orders once for all properties
      let allUserOrders: any[] = [];
      try {
        const { data } = await supabase
          .from("orders")
          .select("id, property_address")
          .eq("user_id", user.id)
          .not("property_address", "is", null);
        allUserOrders = data || [];
      } catch {}

      const enriched: Property[] = props.map((p: any) => {
        const videoCount = allUserOrders.filter((o: any) => {
          if (!o.property_address) return false;
          const orderNorm = normalizeAddress(o.property_address);
          return orderNorm === p.address_normalized ||
            orderNorm.startsWith(p.address_normalized) ||
            p.address_normalized.startsWith(orderNorm);
        }).length;

        return {
          ...p,
          photo_count: 0,
          video_count: videoCount,
          description_count: 0,
          export_count: 0,
        };
      });

      setProperties(enriched);
    } catch (err) {
      console.error("[Properties] Fatal error:", err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  const handleAddProperty = async () => {
    if (!formAddress.trim() || !userId) return;
    setSaving(true);
    const supabase = createClient();

    try {
      const normalized = normalizeAddress(formAddress.trim());
      if (!normalized) { setSaving(false); return; }

      const { data: existing } = await supabase
        .from("agent_properties")
        .select("id")
        .eq("user_id", userId)
        .eq("address_normalized", normalized)
        .maybeSingle();

      if (existing) {
        // Already exists — just close modal
        setShowAddModal(false);
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("agent_properties")
        .insert({
          user_id: userId,
          address: formAddress.trim(),
          address_normalized: normalized,
          city: formCity.trim() || null,
          state: formState.trim() || null,
          zip: formZip.trim() || null,
          bedrooms: formBedrooms ? parseInt(formBedrooms) : null,
          bathrooms: formBathrooms ? parseFloat(formBathrooms) : null,
          property_type: formPropertyType,
          status: formStatus,
        });

      if (error) {
        console.error("Insert failed:", error);
        alert("Failed to add property. Please try again.");
        setSaving(false);
        return;
      }

      setFormAddress("");
      setFormCity("");
      setFormState("");
      setFormZip("");
      setFormBedrooms("");
      setFormBathrooms("");
      setFormPropertyType("single_family");
      setFormStatus("active");
      setShowAddModal(false);

      setLoading(true);
      await loadProperties();
    } catch (err) {
      console.error("Failed to add property:", err);
      alert("Failed to add property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
          <Button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
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
              Your properties will appear here automatically when you order a listing video, run Photo Coach on a property, write a listing description, or create marketing materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"><Link href="/order">Order a Video</Link></Button>
              <Button asChild variant="outline" className="font-bold"><Link href="/dashboard/lens/coach">Open Photo Coach</Link></Button>
            </div>
          </div>
        )}

        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <Link key={prop.id} href={`/dashboard/properties/${prop.id}`} className="bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300 block group">
                <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors truncate">{prop.address}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{[prop.city, prop.state].filter(Boolean).join(", ") || "No location details"}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[prop.status] || STATUS_COLORS.active}`}>{prop.status}</span>
                  {prop.property_type && prop.property_type !== "single_family" && (
                    <span className="text-xs text-muted-foreground">{PROPERTY_TYPES[prop.property_type] || prop.property_type}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4 text-muted-foreground">
                  {(prop.video_count ?? 0) > 0 && (<span className="flex items-center gap-1 text-xs font-medium"><Film className="h-3.5 w-3.5" /> {prop.video_count}</span>)}
                  {(prop.photo_count ?? 0) > 0 && (<span className="flex items-center gap-1 text-xs font-medium"><Camera className="h-3.5 w-3.5" /> {prop.photo_count}</span>)}
                  {(prop.description_count ?? 0) > 0 && (<span className="flex items-center gap-1 text-xs font-medium"><FileText className="h-3.5 w-3.5" /> {prop.description_count}</span>)}
                  {(prop.export_count ?? 0) > 0 && (<span className="flex items-center gap-1 text-xs font-medium"><PenTool className="h-3.5 w-3.5" /> {prop.export_count}</span>)}
                </div>
                <p className="text-xs text-muted-foreground mt-3">{timeAgo(prop.updated_at || prop.created_at)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Add Property</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Address <span className="text-red-500">*</span></label>
                <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="123 Main Street" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-semibold text-foreground mb-1.5">City</label><input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="Austin" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" /></div>
                <div><label className="block text-sm font-semibold text-foreground mb-1.5">State</label><input type="text" value={formState} onChange={(e) => setFormState(e.target.value)} placeholder="TX" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" /></div>
                <div><label className="block text-sm font-semibold text-foreground mb-1.5">Zip</label><input type="text" value={formZip} onChange={(e) => setFormZip(e.target.value)} placeholder="78701" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-foreground mb-1.5">Bedrooms</label><input type="number" value={formBedrooms} onChange={(e) => setFormBedrooms(e.target.value)} placeholder="3" min="0" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" /></div>
                <div><label className="block text-sm font-semibold text-foreground mb-1.5">Bathrooms</label><input type="number" value={formBathrooms} onChange={(e) => setFormBathrooms(e.target.value)} placeholder="2" min="0" step="0.5" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Property Type</label><select value={formPropertyType} onChange={(e) => setFormPropertyType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"><option value="single_family">Single Family</option><option value="condo">Condo</option><option value="apartment">Apartment</option><option value="townhouse">Townhouse</option><option value="land">Land</option><option value="commercial">Commercial</option></select></div>
              <div><label className="block text-sm font-semibold text-foreground mb-1.5">Status</label><select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"><option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option><option value="withdrawn">Withdrawn</option><option value="rental">Rental</option></select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowAddModal(false)} variant="outline" className="flex-1 font-bold">Cancel</Button>
              <Button onClick={handleAddProperty} disabled={!formAddress.trim() || saving} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                {saving ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>) : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
