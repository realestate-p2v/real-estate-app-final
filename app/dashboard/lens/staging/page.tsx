"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Sofa,
  Sparkles,
  Loader2,
  Download,
  RefreshCw,
  Crown,
  Lock,
  ChevronDown,
  ImageIcon,
  X,
  GripVertical,
  Camera,
} from "lucide-react";

const ADMIN_EMAIL = "realestatephoto2video@gmail.com";
const MONTHLY_STAGING_LIMIT = 25;

const ROOM_TYPES = [
  { value: "living_room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "dining_room", label: "Dining Room" },
  { value: "kitchen", label: "Kitchen" },
  { value: "office", label: "Office" },
  { value: "bathroom", label: "Bathroom" },
  { value: "nursery", label: "Nursery" },
  { value: "home_gym", label: "Home Gym" },
];

const STYLES = [
  { value: "Modern", label: "Modern" },
  { value: "Traditional", label: "Traditional" },
  { value: "Minimalist", label: "Minimalist" },
  { value: "Scandinavian", label: "Scandinavian" },
  { value: "Coastal", label: "Coastal" },
  { value: "Farmhouse", label: "Farmhouse" },
  { value: "Industrial", label: "Industrial" },
  { value: "Mid-Century Modern", label: "Mid-Century Modern" },
];

interface StagingResult {
  id?: string;
  original_url: string;
  staged_url: string;
  room_type: string;
  style: string;
  room_analysis?: string;
  created_at?: string;
}

// ─── Before/After Slider ───
function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  className = "",
}: {
  beforeUrl: string;
  afterUrl: string;
  className?: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.touches[0].clientX);
    };
    const handleEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[4/3] rounded-2xl overflow-hidden select-none cursor-ew-resize ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After (staged) — full background */}
      <img
        src={afterUrl}
        alt="Staged"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* Before (original) — clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>
      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
        Before
      </div>
      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
        After
      </div>
      {/* Handle line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
        style={{ left: `${position}%` }}
      >
        {/* Drag handle circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none">
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
}

// ─── Usage Bar ───
function UsageBar({
  used,
  limit,
  isAdmin,
}: {
  used: number;
  limit: number;
  isAdmin: boolean;
}) {
  if (isAdmin) return null;

  const pct = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);
  const isLow = remaining <= 5 && remaining > 0;
  const isOut = remaining === 0;

  return (
    <div className="w-full bg-card rounded-xl border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">
          Monthly Staging Usage
        </span>
        <span className="text-sm font-bold text-foreground">
          {used} <span className="text-muted-foreground font-normal">/ {limit}</span>
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOut
              ? "bg-red-500"
              : isLow
              ? "bg-amber-500"
              : "bg-[#22c55e]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {isOut
          ? "You've used all stagings this month. Resets on the 1st."
          : `${remaining} staging${remaining === 1 ? "" : "s"} remaining this month`}
      </p>
    </div>
  );
}

// ─── Main Page ───
export default function VirtualStagingPage() {
  // Auth
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [stagingCount, setStagingCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);

  // Upload
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options
  const [roomType, setRoomType] = useState("living_room");
  const [style, setStyle] = useState("Modern");

  // Generation
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [result, setResult] = useState<StagingResult | null>(null);
  const [error, setError] = useState("");

  // Previous stagings
  const [previousStagings, setPreviousStagings] = useState<StagingResult[]>([]);
  const [selectedPrevious, setSelectedPrevious] = useState<StagingResult | null>(null);

  // ── Init: load user, check sub, load history ──
  useEffect(() => {
    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      const admin = user.email === ADMIN_EMAIL;
      setIsAdmin(admin);

      if (admin) {
        setIsSubscriber(true);
      } else {
        const { data: usage } = await supabase
          .from("lens_usage")
          .select("is_subscriber")
          .eq("user_id", user.id)
          .single();
        if (usage?.is_subscriber) setIsSubscriber(true);
      }

      // Load total staging count + history
      const { data: stagings, count } = await supabase
        .from("lens_staging")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setStagingCount(count || 0);
      setPreviousStagings(stagings || []);

      // Calculate monthly count for usage bar
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: mCount } = await supabase
        .from("lens_staging")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString());

      setMonthlyCount(mCount || 0);

      // Check sessionStorage for photo from Coach
      try {
        const coachPhoto = sessionStorage.getItem("coach_photos_for_staging");
        if (coachPhoto) {
          setPhotoUrl(coachPhoto);
          setPhotoPreview(coachPhoto);
          sessionStorage.removeItem("coach_photos_for_staging");
        }
      } catch {}

      setLoading(false);
    };
    init();
  }, []);

  // ── Cloudinary signed upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");

    try {
      // Get signature
      const sigRes = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "p2v-lens/staging" }),
      });
      const sigJson = await sigRes.json();
      const sigData = sigJson.data;

      if (!sigData?.signature) {
        throw new Error("Failed to get upload signature");
      }

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", sigData.timestamp.toString());
      formData.append("signature", sigData.signature);
      formData.append("folder", sigData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setPhotoUrl(uploadData.secure_url);
      } else {
        setError("Upload failed. Please try again.");
        setPhotoPreview(null);
      }
    } catch {
      setError("Upload failed. Please try again.");
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = () => {
    setPhotoUrl(null);
    setPhotoPreview(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Generate staging ──
  const handleGenerate = async () => {
    if (!photoUrl || !user) return;

    setGenerating(true);
    setError("");
    setResult(null);
    setGenerationStep("Analyzing room architecture...");

    try {
      // Small delay so user sees the first step
      await new Promise((r) => setTimeout(r, 800));
      setGenerationStep("Generating furnished room...");

      const res = await fetch("/api/lens/staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_url: photoUrl,
          room_type: roomType,
          style,
          user_id: user.id,
          user_email: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error === "free_limit_reached" || data.error === "monthly_limit_reached") {
          setError(data.message);
        } else {
          setError(data.error || "Staging failed. Please try again.");
        }
        return;
      }

      const newResult: StagingResult = {
        original_url: photoUrl,
        staged_url: data.staged_url,
        room_type: roomType,
        style,
        room_analysis: data.room_analysis,
      };

      setResult(newResult);
      setStagingCount((c) => c + 1);
      setMonthlyCount((c) => c + 1);
      setPreviousStagings((prev) => [newResult, ...prev]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
      setGenerationStep("");
    }
  };

  // ── Try different style (keep same photo) ──
  const handleTryDifferentStyle = () => {
    setResult(null);
    setSelectedPrevious(null);
  };

  // ── Access logic ──
  const canGenerate =
    isAdmin || (isSubscriber && monthlyCount < MONTHLY_STAGING_LIMIT) || (!isSubscriber && stagingCount < 1);
  const freeTrialUsed = !isAdmin && !isSubscriber && stagingCount >= 1;

  // ── Subscription badge ──
  const renderBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
          <Crown className="h-3 w-3" />
          Admin
        </span>
      );
    }
    if (isSubscriber) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-cyan-100 text-cyan-700 text-xs font-bold px-2.5 py-1 rounded-full">
          <Sparkles className="h-3 w-3" />
          Subscriber
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-full">
        <Sparkles className="h-3 w-3" />
        {stagingCount >= 1 ? "Free Trial Used" : "1 Free Staging"}
      </span>
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Sign in to access Virtual Staging</h1>
          <p className="text-muted-foreground">
            Upload a photo of an empty room and see it furnished in seconds.
          </p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black">
            <Link href="/login?redirect=/dashboard/lens/staging">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Active slider content (current result or selected previous)
  const activeSlider = selectedPrevious || result;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/lens"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Virtual Staging
              </h1>
              <p className="text-muted-foreground mt-1">
                Upload an empty room photo → AI furnishes it in your chosen style
              </p>
            </div>
          </div>
          {renderBadge()}
        </div>

        {/* ═══ Usage Bar (subscribers only) ═══ */}
        {isSubscriber && (
          <UsageBar
            used={monthlyCount}
            limit={MONTHLY_STAGING_LIMIT}
            isAdmin={isAdmin}
          />
        )}

        {/* ═══ Main Tool Area ═══ */}
        {!activeSlider ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Photo upload + preview */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                Room Photo
              </h2>

              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Room to stage"
                    className="w-full aspect-[4/3] object-cover rounded-xl"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 h-8 w-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
                >
                  <Upload className="h-10 w-10" />
                  <span className="font-semibold text-sm">Upload empty room photo</span>
                  <span className="text-xs">JPG, PNG, WebP — max 20MB</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              {photoPreview && !uploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  Replace photo
                </button>
              )}
            </div>

            {/* Right: Options + Generate */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Sofa className="h-4 w-4 text-muted-foreground" />
                Staging Options
              </h2>

              {/* Room type */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Room Type
                </label>
                <div className="relative">
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full h-11 px-3 pr-10 rounded-xl border border-border bg-background text-foreground text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  >
                    {ROOM_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Design Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        style === s.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/30 hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-700">{error}</p>
                  {(error.includes("Subscribe") || error.includes("free")) && (
                    <Link
                      href="/lens"
                      className="text-sm font-semibold text-accent hover:text-accent/80 mt-1 inline-block"
                    >
                      Subscribe to P2V Lens →
                    </Link>
                  )}
                </div>
              )}

              {/* Generate button */}
              {freeTrialUsed && !generating ? (
                <div className="bg-muted/50 rounded-xl p-4 text-center space-y-3">
                  <Lock className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve used your free staging. Subscribe for unlimited access.
                  </p>
                  <Button
                    asChild
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-black"
                  >
                    <Link href="/lens">Subscribe to P2V Lens</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={!photoUrl || uploading || generating || !canGenerate}
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-6 text-base disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {generationStep}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Stage This Room
                    </>
                  )}
                </Button>
              )}

              {!isAdmin && !isSubscriber && stagingCount < 1 && (
                <p className="text-xs text-center text-muted-foreground">
                  1 free staging included · Subscribe for unlimited
                </p>
              )}

              {generating && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full animate-pulse w-2/3" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    This usually takes 15–30 seconds
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ═══ Result View ═══ */
          <div className="space-y-6">
            <BeforeAfterSlider
              beforeUrl={activeSlider.original_url}
              afterUrl={activeSlider.staged_url}
              className="shadow-lg"
            />

            {/* Info bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="bg-muted px-2.5 py-1 rounded-full font-semibold">
                  {ROOM_TYPES.find((r) => r.value === activeSlider.room_type)?.label ||
                    activeSlider.room_type}
                </span>
                <span className="bg-muted px-2.5 py-1 rounded-full font-semibold">
                  {activeSlider.style}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeSlider.staged_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm px-4 py-2 rounded-full transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Staged
                </a>
                <button
                  onClick={handleTryDifferentStyle}
                  className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm px-4 py-2 rounded-full transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Different Style
                </button>
              </div>
            </div>

            {/* Room analysis (expandable) */}
            {activeSlider.room_analysis && (
              <details className="bg-card rounded-2xl border border-border overflow-hidden">
                <summary className="px-6 py-4 font-semibold text-sm text-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                  Room Analysis
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {activeSlider.room_analysis}
                  </p>
                </div>
              </details>
            )}
          </div>
        )}

        {/* ═══ Previous Stagings ═══ */}
        {previousStagings.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1.5 bg-accent rounded-full" />
              <h2 className="text-2xl font-bold text-foreground">Previous Stagings</h2>
              <span className="text-sm text-muted-foreground">({previousStagings.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {previousStagings.map((staging, i) => {
                const isSelected =
                  selectedPrevious?.original_url === staging.original_url &&
                  selectedPrevious?.staged_url === staging.staged_url;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPrevious(null);
                      } else {
                        setSelectedPrevious(staging);
                        setResult(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className={`group relative bg-card rounded-xl border overflow-hidden transition-all duration-300 text-left ${
                      isSelected
                        ? "border-accent ring-2 ring-accent/20"
                        : "border-border hover:border-accent/40 hover:shadow-lg"
                    }`}
                  >
                    {/* Thumbnail: show staged version */}
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={staging.staged_url}
                        alt={`${staging.style} ${staging.room_type}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {ROOM_TYPES.find((r) => r.value === staging.room_type)?.label ||
                          staging.room_type}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{staging.style}</p>
                    </div>
                    {/* Before/After indicator */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      View B/A
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Upsell CTA (non-subscribers) ═══ */}
        {!isAdmin && !isSubscriber && (
          <div className="mt-14 bg-card rounded-2xl border border-border p-8 text-center space-y-4">
            <Sofa className="h-10 w-10 text-accent mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Unlimited Virtual Staging with P2V Lens
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Stage up to {MONTHLY_STAGING_LIMIT} rooms per month, plus AI photo coaching, listing descriptions, priority
              delivery, and more — starting at $27.95/month.
            </p>
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black"
            >
              <Link href="/lens">
                <Sparkles className="mr-2 h-4 w-4" />
                Get P2V Lens
              </Link>
            </Button>
          </div>
        )}
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/lens" className="hover:text-foreground transition-colors">
              P2V Lens
            </Link>
            <Link href="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
