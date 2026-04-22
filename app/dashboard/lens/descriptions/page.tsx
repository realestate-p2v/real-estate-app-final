// app/dashboard/lens/descriptions/page.tsx

"use client";

import { useState, useEffect, useCallback, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardShell, useAccent } from "@/components/dashboard-shell";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  Camera,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Lock,
  LogIn,
  X,
  AlertCircle,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GateOverlay } from "@/components/gate-overlay";
import { SpinWheel } from "@/components/spin-wheel";

type Style = "professional" | "luxury" | "conversational" | "concise";

interface PropertyData {
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  lotSize: string;
  yearBuilt: string;
  price: string;
  neighborhood: string;
  specialFeatures: string;
}

const STYLES: { value: Style; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Polished MLS-ready tone" },
  { value: "luxury", label: "Luxury", description: "Elevated, premium language" },
  { value: "conversational", label: "Conversational", description: "Warm and approachable" },
  { value: "concise", label: "Concise", description: "Short, punchy, social-ready" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SURPRISE_SEGMENTS = [
  { value: 5,  label: "5%\nOFF",  color: "#3b82f6", angle: 70 },
  { value: 8,  label: "8%\nOFF",  color: "#8b5cf6", angle: 55 },
  { value: 5,  label: "5%\nOFF",  color: "#06b6d4", angle: 70 },
  { value: 10, label: "10%\nOFF", color: "#f59e0b", angle: 40 },
  { value: 5,  label: "5%\nOFF",  color: "#22c55e", angle: 70 },
  { value: 8,  label: "8%\nOFF",  color: "#ec4899", angle: 55 },
];

export default function DescriptionWriterPage() {
  return (
    <Suspense>
      <DashboardShell accent="sky" maxWidth="4xl">
        <DescriptionWriterInner />
      </DashboardShell>
    </Suspense>
  );
}

function DescriptionWriterInner() {
  const a = useAccent();
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Property selector state
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Form state
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [propertyData, setPropertyData] = useState<PropertyData>({
    address: "", beds: "", baths: "", sqft: "", lotSize: "",
    yearBuilt: "", price: "", neighborhood: "", specialFeatures: "",
  });
  const [style, setStyle] = useState<Style>("professional");

  // Result state
  const [generating, setGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [photoAnalyses, setPhotoAnalyses] = useState<string[]>([]);
  const [photosSkipped, setPhotosSkipped] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [trialUsed, setTrialUsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  // Access gating
  const [showGate, setShowGate] = useState(false);
  const [gateType, setGateType] = useState<"buy_video" | "subscribe" | "upgrade_pro">("buy_video");

  // Surprise discount wheel
  const [showSurpriseWheel, setShowSurpriseWheel] = useState(false);
  const [surprisePromoCode, setSurprisePromoCode] = useState<string | null>(null);

  const handleSelectProperty = useCallback(async (id: string) => {
    if (id === "__new__" || id === "") {
      setSelectedPropertyId(null);
      setPropertyData({ address: "", beds: "", baths: "", sqft: "", lotSize: "", yearBuilt: "", price: "", neighborhood: "", specialFeatures: "" });
      setPhotoUrls([]);
      return;
    }

    const prop = userProperties.find((p: any) => p.id === id);
    if (!prop) return;
    setSelectedPropertyId(prop.id);

    const cityState = [prop.city, prop.state].filter(Boolean).join(", ");
    setPropertyData({
      address: prop.address || "",
      beds: prop.bedrooms?.toString() || "",
      baths: prop.bathrooms?.toString() || "",
      sqft: prop.sqft?.toString() || "",
      lotSize: prop.lot_size || "",
      yearBuilt: prop.year_built?.toString() || "",
      price: prop.price ? `$${Number(prop.price).toLocaleString()}` : "",
      neighborhood: cityState,
      specialFeatures: [
        ...(prop.special_features || []),
        ...(prop.amenities || []),
      ].filter(Boolean).join(", "),
    });

    let photos: string[] = [];

    const curated = prop.website_curated;
    if (curated) {
      if (Array.isArray(curated)) {
        photos = curated.filter((u: any) => typeof u === "string").slice(0, 10);
      } else if (curated.photos && Array.isArray(curated.photos)) {
        photos = curated.photos.slice(0, 10);
      }
    }

    if (photos.length < 3) {
      try {
        const { data: orders } = await supabase
          .from("orders")
          .select("photos")
          .eq("user_id", user?.id)
          .ilike("property_address", `%${(prop.address || "").substring(0, 15)}%`)
          .order("created_at", { ascending: false })
          .limit(3);

        for (const o of (orders || [])) {
          const urls = (o.photos || [])
            .map((p: any) => p.secure_url || p.url)
            .filter(Boolean);
          photos = [...photos, ...urls];
          if (photos.length >= 10) break;
        }
        photos = [...new Set(photos)].slice(0, 10);
      } catch (err) {
        console.error("Failed to load order photos:", err);
      }
    }

    if (photos.length > 0) {
      setPhotoUrls(photos);
    }
  }, [userProperties, user, supabase]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setUser(user);
      setAuthLoading(false);
      if (user?.email === "realestatephoto2video@gmail.com") {
        setIsAdmin(true);
        setIsSubscriber(true);
      } else if (user) {
        const [usageResult, orderResult] = await Promise.all([
          supabase
            .from("lens_usage")
            .select("is_subscriber, subscription_tier, trial_expires_at")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("payment_status", "paid"),
        ]);

        const usage = usageResult.data;
        const hasPaid = (orderResult.count || 0) > 0;
        const isSub = usage?.is_subscriber;
        const hasActiveTrial = usage?.trial_expires_at && new Date(usage.trial_expires_at) > new Date();

        if (isSub || hasActiveTrial) {
          setIsSubscriber(true);
        } else {
          setGateType(hasPaid ? "subscribe" : "buy_video");
        }
      }

      if (user) {
        const { data: props } = await supabase
          .from("agent_properties")
          .select("id, address, city, state, bedrooms, bathrooms, sqft, price, lot_size, year_built, special_features, amenities, website_curated")
          .eq("user_id", user.id)
          .is("merged_into_id", null)
          .order("updated_at", { ascending: false });
        if (props) setUserProperties(props);
      }
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    if (userProperties.length === 0) return;
    const pid = searchParams.get("propertyId");
    if (pid) {
      const prop = userProperties.find((p: any) => p.id === pid);
      if (prop) {
        handleSelectProperty(prop.id);
      }
    }
  }, [userProperties, searchParams, handleSelectProperty]);

  useEffect(() => {
    if (searchParams.get("propertyId")) return;

    const addr = searchParams.get("address");
    if (addr) {
      const city = searchParams.get("city") || "";
      const state = searchParams.get("state") || "";
      const fullAddr = [addr, city, state].filter(Boolean).join(", ");
      setPropertyData(prev => ({
        ...prev,
        address: fullAddr,
        beds: searchParams.get("beds") || prev.beds,
        baths: searchParams.get("baths") || prev.baths,
        sqft: searchParams.get("sqft") || prev.sqft,
        lotSize: searchParams.get("lotSize") || prev.lotSize,
        yearBuilt: searchParams.get("yearBuilt") || prev.yearBuilt,
        price: searchParams.get("price") ? `$${Number(searchParams.get("price")).toLocaleString()}` : prev.price,
        specialFeatures: searchParams.get("specialFeatures") || prev.specialFeatures,
      }));
      return;
    }

    try {
      const coachPhotos = sessionStorage.getItem("coach_photos_for_description");
      const coachAddress = sessionStorage.getItem("coach_property_address");
      if (coachPhotos) {
        const parsed = JSON.parse(coachPhotos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhotoUrls(parsed);
        }
        sessionStorage.removeItem("coach_photos_for_description");
      }
      if (coachAddress) {
        setPropertyData(prev => ({ ...prev, address: coachAddress }));
        sessionStorage.removeItem("coach_property_address");
      }
    } catch (e) {
      console.error("Failed to load coach photos:", e);
    }
  }, [searchParams]);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    setUploadProgress("");

    try {
      const newUrls: string[] = [];
      const oversized: string[] = [];
      const failed: string[] = [];
      const fileArray = Array.from(files);
      let uploaded = 0;

      for (const file of fileArray) {
        if (file.size > MAX_FILE_SIZE) {
          oversized.push(file.name);
          continue;
        }

        setUploadProgress(`Uploading ${uploaded + 1} of ${fileArray.length - oversized.length}...`);

        try {
          const sigResponse = await fetch("/api/cloudinary-signature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder: "p2v-lens/descriptions" }),
          });
          const sigData = await sigResponse.json();
          if (!sigData.success) throw new Error("Signature failed");

          const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;

          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("api_key", apiKey);
          uploadData.append("timestamp", timestamp.toString());
          uploadData.append("signature", signature);
          uploadData.append("folder", folder);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            { method: "POST", body: uploadData }
          );
          const result = await response.json();

          if (result.secure_url) {
            newUrls.push(result.secure_url);
            uploaded++;
          } else {
            failed.push(file.name);
          }
        } catch {
          failed.push(file.name);
        }
      }

      setPhotoUrls((prev) => [...prev, ...newUrls].slice(0, 10));

      const messages: string[] = [];
      if (oversized.length > 0) {
        messages.push(
          `${oversized.length} photo${oversized.length > 1 ? "s" : ""} skipped — files must be under 10MB (${oversized.join(", ")})`
        );
      }
      if (failed.length > 0) {
        messages.push(
          `${failed.length} photo${failed.length > 1 ? "s" : ""} failed to upload (${failed.join(", ")}). Please try again.`
        );
      }
      if (messages.length > 0) {
        setError(messages.join(" "));
      }
    } catch (err) {
      setError("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress("");
      e.target.value = "";
    }
  }, []);

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!isSubscriber && !isAdmin) {
      setShowGate(true);
      return;
    }

    if (photoUrls.length === 0) {
      setError("Please upload at least one photo.");
      return;
    }

    setGenerating(true);
    setError("");
    setDescription("");
    setEditedDescription("");
    setPhotoAnalyses([]);

    try {
      const res = await fetch("/api/lens/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls,
          propertyData,
          style,
          userId: user?.id,
          propertyId: selectedPropertyId, // ← NEW: upsert key. Backend returns 403 if this propertyId doesn't belong to userId.
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "free_trial_used") {
          setTrialUsed(true);
          setError("");
        } else {
          setError(data.error || "Failed to generate description.");
        }
        return;
      }

      setDescription(data.description);
      setEditedDescription(data.description);
      setPhotoAnalyses(data.photoAnalyses || []);
      setPhotosSkipped(data.photosSkipped || 0);

      if (data.surprise && isSubscriber) {
        setShowSurpriseWheel(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => handleGenerate();

  const handleCopy = () => {
    navigator.clipboard.writeText(editedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (field: keyof PropertyData, value: string) => {
    setPropertyData((prev) => ({ ...prev, [field]: value }));
  };

  /* ═══════════════ GATED / AUTH STATES ═══════════════ */

  if (!authLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-10 space-y-5 backdrop-blur-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/[0.04] flex items-center justify-center ring-1 ring-white/[0.06]">
            <LogIn className="h-8 w-8 text-white/50" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Sign In to Try the Description Writer</h1>
          <p className="text-white/60 max-w-md mx-auto">
            Create a free account to try the AI Listing Description Writer. Your first description is free — no subscription required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-black px-8 py-6 text-base shadow-lg ${a.btnShadow}`}>
              <Link href={`/login?redirect=/dashboard/lens/descriptions`}>
                <LogIn className="mr-2 h-4 w-4" />Sign In
              </Link>
            </Button>
            <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold px-8 py-6 text-base">
              <Link href="/lens">Learn About P2V Lens</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (trialUsed) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-10 space-y-5 backdrop-blur-sm">
          <div className={`mx-auto h-16 w-16 rounded-2xl ${a.bg} flex items-center justify-center ring-1 ${a.ring}`}>
            <Lock className={`h-8 w-8 ${a.text}`} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">You&apos;ve Used Your Free Description</h1>
          <p className="text-white/60 max-w-md mx-auto">
            Subscribe to P2V Lens for unlimited AI listing descriptions, plus photo coaching, design studio, virtual staging, and more — starting at $27.95/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-black px-8 py-6 text-base shadow-lg ${a.btnShadow}`}>
              <Link href="/lens">
                <Sparkles className="mr-2 h-4 w-4" />Subscribe to P2V Lens
              </Link>
            </Button>
            <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold px-8 py-6 text-base">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════ MAIN UI ═══════════════ */

  return (
    <>
      {/* Header */}
      <div className="mc-animate flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            AI Listing Description Writer
          </h1>
          <p className="text-white/50 mt-1">
            Upload photos + enter property details → get an MLS-ready description
          </p>
        </div>
      </div>

      {/* Subscription / trial badge */}
      {isAdmin ? (
        <div className="mc-animate rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3 mb-8 flex items-center gap-3" style={{ animationDelay: "0.05s" }}>
          <Sparkles className="h-5 w-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-300 font-semibold">Admin — Unlimited Access</p>
        </div>
      ) : isSubscriber ? (
        <div className={`mc-animate rounded-xl border ${a.border} ${a.bg} px-4 py-3 mb-8 flex items-center gap-3`} style={{ animationDelay: "0.05s" }}>
          <Sparkles className={`h-5 w-5 ${a.text} flex-shrink-0`} />
          <p className="text-sm text-white/80">
            <span className={`font-bold ${a.textLight}`}>P2V Lens Subscriber</span> — Unlimited descriptions
          </p>
        </div>
      ) : (
        <div className={`mc-animate rounded-xl border ${a.border} ${a.bg} px-4 py-3 mb-8 flex items-center gap-3`} style={{ animationDelay: "0.05s" }}>
          <Sparkles className={`h-5 w-5 ${a.text} flex-shrink-0`} />
          <p className="text-sm text-white/80">
            <span className="font-bold text-white">Free trial:</span> Generate your first listing description free. Subscribe to P2V Lens for unlimited access.
          </p>
        </div>
      )}

      {/* Property Selector */}
      {userProperties.length > 0 && (
        <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 mb-6 backdrop-blur-sm" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-3">
            <Home className={`h-5 w-5 ${a.text}`} />
            <h2 className="text-lg font-bold text-white">Select a Property</h2>
          </div>
          <p className="text-sm text-white/50 mb-3">
            Choose a property to auto-fill details and photos, or enter everything manually.
          </p>
          <select
            value={selectedPropertyId || ""}
            onChange={(e) => handleSelectProperty(e.target.value)}
            className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-${a.text.replace("text-", "")}/40 focus:outline-none`}
            style={{ colorScheme: "dark" }}
          >
            <option value="">Select property...</option>
            {userProperties.map((p: any) => (
              <option key={p.id} value={p.id} className="bg-gray-900">
                {p.address}{p.city ? `, ${p.city}` : ""}
              </option>
            ))}
            <option value="__new__" className="bg-gray-900">＋ Enter details manually</option>
          </select>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-lg font-bold text-white mb-1">Listing Photos</h2>
            <p className="text-sm text-white/50 mb-4">
              Upload 3–10 photos. AI analyzes each room to write an accurate description.
            </p>

            <label className={`block border-2 border-dashed border-white/[0.1] rounded-xl p-6 text-center cursor-pointer hover:${a.border.replace("/20", "/40")} hover:${a.bg} transition-colors`}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading || photoUrls.length >= 10}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className={`h-8 w-8 ${a.text} animate-spin`} />
                  <p className="text-sm text-white/70">{uploadProgress || "Uploading..."}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className={`h-8 w-8 ${a.textDim}`} />
                  <p className="text-sm text-white/70">
                    {photoUrls.length >= 10 ? "Maximum 10 photos reached" : "Click to upload photos (max 10)"}
                  </p>
                  <p className="text-xs text-white/35">JPG, PNG, or HEIC · Max 10MB per photo</p>
                </div>
              )}
            </label>

            {photoUrls.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/[0.08]">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 h-5 w-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-white/40 mt-2">{photoUrls.length}/10 photos</p>
          </div>

          {/* Property Data */}
          <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-lg font-bold text-white mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Address" colSpan={2}>
                <DarkInput value={propertyData.address} onChange={(v) => updateField("address", v)} placeholder="123 Main St, City, State" />
              </Field>
              <Field label="Bedrooms">
                <DarkInput value={propertyData.beds} onChange={(v) => updateField("beds", v)} placeholder="3" />
              </Field>
              <Field label="Bathrooms">
                <DarkInput value={propertyData.baths} onChange={(v) => updateField("baths", v)} placeholder="2.5" />
              </Field>
              <Field label="Square Feet">
                <DarkInput value={propertyData.sqft} onChange={(v) => updateField("sqft", v)} placeholder="2,400" />
              </Field>
              <Field label="Lot Size">
                <DarkInput value={propertyData.lotSize} onChange={(v) => updateField("lotSize", v)} placeholder="0.25 acres" />
              </Field>
              <Field label="Year Built">
                <DarkInput value={propertyData.yearBuilt} onChange={(v) => updateField("yearBuilt", v)} placeholder="2005" />
              </Field>
              <Field label="Price">
                <DarkInput value={propertyData.price} onChange={(v) => updateField("price", v)} placeholder="$599,000" />
              </Field>
              <Field label="Neighborhood" colSpan={2}>
                <DarkInput value={propertyData.neighborhood} onChange={(v) => updateField("neighborhood", v)} placeholder="Sunset Ridge, close to downtown" />
              </Field>
              <Field label="Special Features" colSpan={2}>
                <DarkTextarea value={propertyData.specialFeatures} onChange={(v) => updateField("specialFeatures", v)} placeholder="Pool, new roof 2024, finished basement, EV charger..." rows={2} />
              </Field>
            </div>
          </div>

          {/* Style Selector */}
          <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm" style={{ animationDelay: "0.25s" }}>
            <h2 className="text-lg font-bold text-white mb-4">Writing Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => {
                const active = style === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      active
                        ? `${a.border} ${a.bg}`
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                    }`}
                  >
                    <p className={`text-sm font-bold ${active ? a.textLight : "text-white"}`}>{s.label}</p>
                    <p className="text-xs text-white/45">{s.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || photoUrls.length === 0}
            className={`mc-animate w-full ${a.btnBg} ${a.btnBgHover} text-white font-bold py-7 text-lg rounded-xl shadow-lg ${a.btnShadow} disabled:opacity-50`}
            style={{ animationDelay: "0.3s" }}
          >
            {generating ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" />Analyzing Photos & Writing Description...</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" />Generate Description</>
            )}
          </Button>

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] px-4 py-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 sticky top-6 backdrop-blur-sm" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Generated Description</h2>
              {description && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRegenerate}
                    disabled={generating}
                    className="flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1 text-xs font-semibold ${a.textLight} hover:text-white transition-colors`}
                  >
                    {copied ? <><Check className="h-3.5 w-3.5" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
                  </button>
                </div>
              )}
            </div>

            {description ? (
              <DarkTextarea
                value={editedDescription}
                onChange={setEditedDescription}
                rows={12}
                resize={false}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-center border border-dashed border-white/[0.08] rounded-xl">
                <div className="space-y-2 px-6">
                  <FileText className="h-10 w-10 text-white/20 mx-auto" />
                  <p className="text-sm text-white/50">
                    {generating ? "AI is analyzing your photos and writing your description..." : "Upload photos, fill in property details, and hit Generate"}
                  </p>
                </div>
              </div>
            )}

            {description && (
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={handleCopy}
                  className={`flex-1 ${a.btnBg} ${a.btnBgHover} text-white font-black`}
                >
                  {copied ? <><Check className="h-4 w-4 mr-2" />Copied to Clipboard!</> : <><Copy className="h-4 w-4 mr-2" />Copy to Clipboard</>}
                </Button>
              </div>
            )}
          </div>

          {/* AI Photo Analysis block removed 4/22/2026 — was producing unreadable output; underlying state still populated in case we reinstate */}
          
        </div>
      </div>

      {/* Surprise wheel */}
      {showSurpriseWheel && (
        <SpinWheel
          title="🎉 Surprise! Spin for a Video Discount!"
          segments={SURPRISE_SEGMENTS}
          promoCode={surprisePromoCode || ""}
          onResult={async (segment) => {
            try {
              const res = await fetch("/api/surprise-spin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ percent: segment.value }),
              });
              const data = await res.json();
              if (data.success) {
                setSurprisePromoCode(data.code);
              }
            } catch (err) {
              console.error("Surprise spin error:", err);
            }
          }}
          onClose={() => setShowSurpriseWheel(false)}
        />
      )}

      {/* Access gate */}
      {showGate && <GateOverlay gateType={gateType} toolName="Description Writer" onClose={() => setShowGate(false)} />}
    </>
  );
}

/* ─────────────────────────────────────────────
   Dark-themed form field primitives (local to this page)
   Pulls the label + input styling out of the JSX for readability.
   ───────────────────────────────────────────── */

function Field({ label, colSpan = 1, children }: { label: string; colSpan?: 1 | 2; children: ReactNode }) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <label className="text-xs font-semibold text-white/50 mb-1.5 block uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function DarkInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/[0.2] focus:bg-white/[0.06] focus:outline-none transition-colors"
    />
  );
}

function DarkTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  resize = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  resize?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/[0.2] focus:bg-white/[0.06] focus:outline-none transition-colors leading-relaxed ${resize ? "" : "resize-none"}`}
    />
  );
}
