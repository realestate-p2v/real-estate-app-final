"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form state
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [propertyData, setPropertyData] = useState<PropertyData>({
    address: "",
    beds: "",
    baths: "",
    sqft: "",
    lotSize: "",
    yearBuilt: "",
    price: "",
    neighborhood: "",
    specialFeatures: "",
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

  // Surprise discount wheel
  const [showSurpriseWheel, setShowSurpriseWheel] = useState(false);
  const [surprisePromoCode, setSurprisePromoCode] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      if (user?.email === "realestatephoto2video@gmail.com") {
        setIsAdmin(true);
        setIsSubscriber(true);
      } else if (user) {
        const { data: usage } = await supabase
          .from("lens_usage")
          .select("is_subscriber")
          .eq("user_id", user.id)
          .single();
        if (usage?.is_subscriber) {
          setIsSubscriber(true);
        }
      }
    };
    getUser();
  }, [supabase.auth]);

  // Pre-fill from URL params (property portfolio) or sessionStorage (Photo Coach)
  useEffect(() => {
    // URL params take priority (from property portfolio page)
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
      return; // Don't also load from sessionStorage
    }

    // Fallback: load from Photo Coach sessionStorage
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (field: keyof PropertyData, value: string) => {
    setPropertyData((prev) => ({ ...prev, [field]: value }));
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="bg-card rounded-2xl border border-border p-10 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Sign In to Try the Description Writer
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create a free account to try the AI Listing Description Writer. Your first description is free — no subscription required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base">
                <Link href={`/login?redirect=/dashboard/lens/descriptions`}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-6 text-base">
                <Link href="/lens">Learn About P2V Lens</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Trial used paywall
  if (trialUsed) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="bg-card rounded-2xl border border-border p-10 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              You&apos;ve Used Your Free Description
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Subscribe to P2V Lens for unlimited AI listing descriptions, plus photo coaching, design studio, virtual staging, and more — starting at $27.95/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base">
                <Link href="/lens">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Subscribe to P2V Lens
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-6 text-base">
                <Link href="/dashboard/lens">Back to Lens Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/lens" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              AI Listing Description Writer
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload photos + enter property details → get an MLS-ready description
            </p>
          </div>
        </div>

        {/* Subscription / trial badge */}
        {isAdmin ? (
          <div className="bg-green-100 border border-green-200 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-semibold">Admin — Unlimited Access</p>
          </div>
        ) : isSubscriber ? (
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-cyan-600 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-bold text-cyan-700">P2V Lens Subscriber</span> — Unlimited descriptions
            </p>
          </div>
        ) : (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-bold">Free trial:</span> Generate your first listing description free. Subscribe to P2V Lens for unlimited access.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            {/* Photo Upload */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">Listing Photos</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload 3–10 photos. AI analyzes each room to write an accurate description.
              </p>

              <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent/40 transition-colors">
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
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">{uploadProgress || "Uploading..."}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {photoUrls.length >= 10
                        ? "Maximum 10 photos reached"
                        : "Click to upload photos (max 10)"}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      JPG, PNG, or HEIC · Max 10MB per photo
                    </p>
                  </div>
                )}
              </label>

              {photoUrls.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">{photoUrls.length}/10 photos</p>
            </div>

            {/* Property Data */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Property Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Address</label>
                  <Input
                    placeholder="123 Main St, City, State"
                    value={propertyData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bedrooms</label>
                  <Input
                    placeholder="3"
                    value={propertyData.beds}
                    onChange={(e) => updateField("beds", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bathrooms</label>
                  <Input
                    placeholder="2.5"
                    value={propertyData.baths}
                    onChange={(e) => updateField("baths", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Square Feet</label>
                  <Input
                    placeholder="2,400"
                    value={propertyData.sqft}
                    onChange={(e) => updateField("sqft", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lot Size</label>
                  <Input
                    placeholder="0.25 acres"
                    value={propertyData.lotSize}
                    onChange={(e) => updateField("lotSize", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Year Built</label>
                  <Input
                    placeholder="2005"
                    value={propertyData.yearBuilt}
                    onChange={(e) => updateField("yearBuilt", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Price</label>
                  <Input
                    placeholder="$599,000"
                    value={propertyData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Neighborhood</label>
                  <Input
                    placeholder="Sunset Ridge, close to downtown"
                    value={propertyData.neighborhood}
                    onChange={(e) => updateField("neighborhood", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Special Features</label>
                  <Textarea
                    placeholder="Pool, new roof 2024, finished basement, EV charger..."
                    value={propertyData.specialFeatures}
                    onChange={(e) => updateField("specialFeatures", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Style Selector */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Writing Style</h2>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      style === s.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <p className={`text-sm font-bold ${style === s.value ? "text-accent" : "text-foreground"}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating || photoUrls.length === 0}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-7 text-lg rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analyzing Photos & Writing Description...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Description
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Generated Description</h2>
                {description && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={generating}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                      Regenerate
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {description ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={12}
                  className="text-sm leading-relaxed resize-none border-border"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {generating
                        ? "AI is analyzing your photos and writing your description..."
                        : "Upload photos, fill in property details, and hit Generate"}
                    </p>
                  </div>
                </div>
              )}

              {description && (
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={handleCopy}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-black"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {photoAnalyses.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-1">AI Photo Analysis</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {photoAnalyses.length} photos analyzed{photosSkipped > 0 ? `, ${photosSkipped} skipped (too dark/blurry)` : ""}
                </p>
                <div className="space-y-3">
                  {photoAnalyses.map((analysis, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center">
                        <Camera className="h-3 w-3 text-accent" />
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{analysis}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Surprise discount wheel */}
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
    </div>
  );
}
