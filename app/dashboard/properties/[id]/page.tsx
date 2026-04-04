"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
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

  // Asset data
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<any[]>([]);
  const [exports, setExports] = useState<any[]>([]);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<Property>>({});

  const supabase = createClient();

  // Build query string from property data for tool deep-linking
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
    if (prop.special_features && prop.special_features.length > 0) {
      p.set("specialFeatures", prop.special_features.join(", "));
    }
    return p.toString();
  };

  const loadProperty = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?redirect=/dashboard/properties"); return; }
    setUserId(user.id);

    // Check subscription
    const isAdmin = user.email === "realestatephoto2video@gmail.com";
    if (isAdmin) {
      setIsSubscriber(true);
    } else {
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber")
        .eq("user_id", user.id)
        .single();
      if (usage?.is_subscriber) setIsSubscriber(true);
    }

    // Fetch property
    const { data: prop, error } = await supabase
      .from("agent_properties")
      .select("*")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .single();

    if (error || !prop) {
      router.push("/dashboard/properties");
      return;
    }

    setProperty(prop);
    setEditForm(prop);

    const norm = prop.address_normalized;

    // Load photos (lens_sessions matched by address)
    const { data: sessionData } = await supabase
      .from("lens_sessions")
      .select("*")
      .eq("user_id", user.id)
      .ilike("property_address", `${norm}%`)
      .order("created_at", { ascending: false });
    setPhotos(sessionData || []);

    // Load videos (orders matched by address)
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .ilike("property_address", `${norm}%`)
      .order("created_at", { ascending: false });
    setVideos(orderData || []);

    // FIX 1: Load descriptions — fetch all, then filter client-side by address match
    const { data: descData } = await supabase
      .from("lens_descriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const normalizedPropAddr = norm;
    const filteredDescs = (descData || []).filter((desc: any) => {
      const descAddr = desc.property_data?.address || desc.property_data?.property_address || "";
      if (!descAddr) return false;
      const normalizedDescAddr = descAddr.trim().toLowerCase()
        .replace(/\bstreet\b/g, "st").replace(/\bavenue\b/g, "ave")
        .replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr")
        .replace(/\blane\b/g, "ln").replace(/\broad\b/g, "rd")
        .replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();
      return normalizedDescAddr.startsWith(normalizedPropAddr) || normalizedPropAddr.startsWith(normalizedDescAddr);
    });
    setDescriptions(filteredDescs);

    // Load design exports
    const { data: exportData } = await supabase
      .from("design_exports")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    setExports(exportData || []);

    setLoading(false);
  }, [supabase, propertyId, router]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);

    const { error } = await supabase
      .from("agent_properties")
      .update({
        address: editForm.address || property.address,
        city: editForm.city || null,
        state: editForm.state || null,
        zip: editForm.zip || null,
        status: editForm.status || "active",
        listing_type: editForm.listing_type || "sale",
        price: editForm.price || null,
        bedrooms: editForm.bedrooms || null,
        bathrooms: editForm.bathrooms || null,
        sqft: editForm.sqft || null,
        lot_size: editForm.lot_size || null,
        year_built: editForm.year_built || null,
        property_type: editForm.property_type || "single_family",
        updated_at: new Date().toISOString(),
      })
      .eq("id", property.id);

    if (!error) {
      setProperty({ ...property, ...editForm, updated_at: new Date().toISOString() } as Property);
      setEditing(false);
    }
    setSaving(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Quick action button — shows lock for non-subscribers on Lens tools
  const QuickAction = ({ href, icon: Icon, label, requiresSub }: { href: string; icon: any; label: string; requiresSub?: boolean }) => {
    if (requiresSub && !isSubscriber) {
      return (
        <Link
          href="/lens"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-muted-foreground hover:border-accent/40 transition-all"
        >
          <Lock className="h-3.5 w-3.5" />
          {label}
        </Link>
      );
    }
    return (
      <Link
        href={href}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm font-semibold text-accent hover:bg-accent/20 transition-all"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!property) return null;

  const qs = buildPropertyParams(property);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/properties" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">
                {property.address}
              </h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[property.status] || STATUS_COLORS.active}`}>
                {property.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5">
              {[property.city, property.state, property.zip].filter(Boolean).join(", ")}
              {property.property_type && ` · ${PROPERTY_TYPES[property.property_type] || property.property_type}`}
            </p>
          </div>
          <Button
            onClick={() => setEditing(!editing)}
            variant="outline"
            size="sm"
            className="font-semibold flex-shrink-0"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>

        {/* Quick Actions Bar — links include property params */}
        <div className="flex flex-wrap gap-2 mt-6 mb-8">
          <QuickAction href={`/order?${qs}`} icon={Film} label="Order Video" />
          <QuickAction href={`/dashboard/lens/coach?${qs}`} icon={Camera} label="Photo Coach" requiresSub />
          <QuickAction href={`/dashboard/lens/descriptions?${qs}`} icon={FileText} label="Write Description" requiresSub />
          <QuickAction href={`/dashboard/lens/staging?${qs}`} icon={Sofa} label="Stage Room" requiresSub />
          <QuickAction href={`/dashboard/lens/design-studio?${qs}`} icon={PenTool} label="Create Graphic" requiresSub />
        </div>

        {/* ═══ PROPERTY DETAILS (editable) ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Property Details</h2>
            {editing && (
              <div className="flex gap-2">
                <Button onClick={() => { setEditing(false); setEditForm(property); }} variant="outline" size="sm">
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                  Save
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                <select
                  value={editForm.status || "active"}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="rental">Rental</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Listing Type</label>
                <select
                  value={editForm.listing_type || "sale"}
                  onChange={(e) => setEditForm({ ...editForm, listing_type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="sale">Sale</option>
                  <option value="rental">Rental</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Property Type</label>
                <select
                  value={editForm.property_type || "single_family"}
                  onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="single_family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Price</label>
                <input
                  type="number"
                  value={editForm.price || ""}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="499000"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={editForm.bedrooms || ""}
                  onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={editForm.bathrooms || ""}
                  onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value ? parseFloat(e.target.value) : null })}
                  step="0.5"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Sqft</label>
                <input
                  type="number"
                  value={editForm.sqft || ""}
                  onChange={(e) => setEditForm({ ...editForm, sqft: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Lot Size</label>
                <input
                  type="text"
                  value={editForm.lot_size || ""}
                  onChange={(e) => setEditForm({ ...editForm, lot_size: e.target.value || null })}
                  placeholder="0.25 acres"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Year Built</label>
                <input
                  type="number"
                  value={editForm.year_built || ""}
                  onChange={(e) => setEditForm({ ...editForm, year_built: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Bedrooms", value: property.bedrooms },
                { label: "Bathrooms", value: property.bathrooms },
                { label: "Sqft", value: property.sqft?.toLocaleString() },
                { label: "Lot Size", value: property.lot_size },
                { label: "Year Built", value: property.year_built },
                { label: "Price", value: property.price ? `$${property.price.toLocaleString()}${property.price_period ? `/${property.price_period}` : ""}` : null },
                { label: "Listing Type", value: property.listing_type ? property.listing_type.charAt(0).toUpperCase() + property.listing_type.slice(1) : null },
                { label: "Property Type", value: PROPERTY_TYPES[property.property_type] || property.property_type },
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          )}

          {/* Special features */}
          {!editing && property.special_features && property.special_features.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Special Features</p>
              <div className="flex flex-wrap gap-2">
                {property.special_features.map((f, i) => (
                  <span key={i} className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ═══ PHOTOS ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-foreground">Photos</h2>
              {photos.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{photos.length} session{photos.length !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">No Photo Coach sessions for this property yet.</p>
              {isSubscriber ? (
                <Button asChild size="sm" variant="outline" className="font-semibold">
                  <Link href={`/dashboard/lens/coach?${qs}`}>Open Photo Coach</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="font-semibold">
                  <Link href="/lens"><Lock className="h-3 w-3 mr-1.5" />Subscribe to Use Photo Coach</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {photos.map((session: any) => (
                <Link
                  key={session.id}
                  href={`/dashboard/lens/coach?${qs}`}
                  className="block p-4 rounded-xl bg-muted/30 border border-border hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{session.property_address}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.total_analyses || 0} photos analyzed · {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ═══ VIDEOS (FIX 2: with thumbnails) ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-cyan-600" />
              <h2 className="text-lg font-bold text-foreground">Videos</h2>
              {videos.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{videos.length}</span>
              )}
            </div>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">No video orders for this property yet.</p>
              <Button asChild size="sm" variant="outline" className="font-semibold">
                <Link href={`/order?${qs}`}>Order a Video</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((order: any) => {
                const statusColor: Record<string, string> = {
                  delivered: "bg-green-100 text-green-700",
                  complete: "bg-green-100 text-green-700",
                  processing: "bg-amber-100 text-amber-700",
                  new: "bg-blue-100 text-blue-700",
                  pending_payment: "bg-gray-100 text-gray-600",
                };
                const firstPhotoUrl = Array.isArray(order.photos) && order.photos.length > 0
                  ? order.photos[0]?.secure_url || null
                  : null;

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="h-20 w-28 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border">
                        {firstPhotoUrl ? (
                          <img
                            src={firstPhotoUrl}
                            alt="Video thumbnail"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Film className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {order.is_quick_video ? "Quick Video" : order.listing_package_label || "Listing Video"}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor[order.status] || "bg-gray-100 text-gray-600"}`}>
                            {order.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.photo_count} photos · {order.orientation} · {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Watch button */}
                      {order.delivery_url && (
                        <Button asChild size="sm" variant="outline" className="font-semibold flex-shrink-0">
                          <Link href={`/video/${order.order_id}`}>
                            <ExternalLink className="h-3 w-3 mr-1.5" />Watch
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ DESCRIPTIONS (FIX 1: filtered by property address) ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-bold text-foreground">Descriptions</h2>
              {descriptions.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{descriptions.length}</span>
              )}
            </div>
          </div>

          {descriptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">Descriptions will appear here when generated from this property&apos;s portfolio page.</p>
              {isSubscriber ? (
                <Button asChild size="sm" variant="outline" className="font-semibold">
                  <Link href={`/dashboard/lens/descriptions?${qs}`}>Write a Description</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="font-semibold">
                  <Link href="/lens"><Lock className="h-3 w-3 mr-1.5" />Subscribe to Use Description Writer</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {descriptions.slice(0, 5).map((desc: any) => (
                <div
                  key={desc.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground capitalize mb-1">
                        {desc.style || "Professional"} style · {new Date(desc.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-foreground line-clamp-2">
                        {desc.description?.slice(0, 150)}...
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(desc.description || "")}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ VIRTUAL STAGING ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sofa className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-foreground">Virtual Staging</h2>
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">Stage a room to see it here.</p>
            {isSubscriber ? (
              <Button asChild size="sm" variant="outline" className="font-semibold">
                <Link href={`/dashboard/lens/staging?${qs}`}>Stage a Room</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="font-semibold">
                <Link href="/lens"><Lock className="h-3 w-3 mr-1.5" />Subscribe to Use Virtual Staging</Link>
              </Button>
            )}
          </div>
        </section>

        {/* ═══ MARKETING MATERIALS ═══ */}
        <section className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-bold text-foreground">Marketing Materials</h2>
              {exports.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{exports.length}</span>
              )}
            </div>
          </div>

          {exports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">No design exports linked to this property yet.</p>
              {isSubscriber ? (
                <Button asChild size="sm" variant="outline" className="font-semibold">
                  <Link href={`/dashboard/lens/design-studio?${qs}`}>Create a Graphic</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="font-semibold">
                  <Link href="/lens"><Lock className="h-3 w-3 mr-1.5" />Subscribe to Use Design Studio</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {exports.map((exp: any) => {
                const typeLabels: Record<string, string> = {
                  just_listed: "Just Listed",
                  open_house: "Open House",
                  price_reduced: "Price Reduced",
                  just_sold: "Just Sold",
                  yard_sign: "Yard Sign",
                  property_pdf: "Property PDF",
                  branding_card: "Branding Card",
                };
                const formatLabels: Record<string, string> = {
                  png: "PNG",
                  pdf: "PDF",
                  mp4: "Video",
                };
                const downloadUrl = exp.export_url || exp.overlay_video_url;
                // Build thumbnail URL
                let thumbnailUrl: string | null = null;
                if (downloadUrl && downloadUrl.includes("cloudinary.com")) {
                  if (exp.export_format === "mp4" || downloadUrl.match(/\.(mp4|mov|webm)$/i)) {
                    // Video: use Cloudinary video thumbnail (grab frame at 1 second)
                    thumbnailUrl = downloadUrl
                      .replace("/video/upload/", "/video/upload/so_1,w_400,h_300,c_fill,f_jpg/")
                      .replace(/\.(mp4|mov|webm)$/i, ".jpg");
                  } else if (exp.export_format === "pdf" || downloadUrl.match(/\.pdf$/i)) {
                    // PDF: use Cloudinary page-to-image
                    thumbnailUrl = downloadUrl
                      .replace("/image/upload/", "/image/upload/w_400,h_300,c_fill,pg_1,f_jpg/");
                  } else {
                    // Image: use Cloudinary resize
                    thumbnailUrl = downloadUrl.includes("/upload/")
                      ? downloadUrl.replace("/upload/", "/upload/w_400,h_300,c_fill/")
                      : downloadUrl;
                  }
                }
                return (
                  <div key={exp.id} className="rounded-xl bg-muted/30 border border-border overflow-hidden">
                    {/* Thumbnail */}
                    {thumbnailUrl ? (
                      <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="aspect-[4/3] relative bg-muted">
                          <img
                            src={thumbnailUrl}
                            alt={typeLabels[exp.template_type] || "Export"}
                            className="w-full h-full object-cover"
                          />
                          {exp.export_format === "mp4" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center">
                                <ExternalLink className="h-4 w-4 text-white ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                        <PenTool className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Card body */}
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                          {typeLabels[exp.template_type] || exp.template_type}
                        </span>
                        {exp.export_format && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            exp.export_format === "mp4" ? "bg-cyan-100 text-cyan-700" : "bg-muted text-muted-foreground"
                          }`}>
                            {formatLabels[exp.export_format] || exp.export_format.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </p>
                      {downloadUrl && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80"
                          >
                            <ExternalLink className="h-3 w-3" /> {exp.export_format === "mp4" ? "Watch" : "View"}
                          </a>
                          <a
                            href={downloadUrl.includes("/upload/") ? downloadUrl.replace("/upload/", "/upload/fl_attachment/") : downloadUrl}
                            download
                            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-3 w-3" /> Download
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
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
