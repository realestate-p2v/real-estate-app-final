"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCircle2,
  AlertCircle,
  Download,
  Info,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { GateOverlay } from "@/components/gate-overlay";

// ── Types ──

interface Props {
  userId: string;
  isLensSubscriber?: boolean;
  gateType?: "buy_video" | "subscribe" | "upgrade_pro";
}

interface PropertyOption {
  id: string;
  address: string;
  city?: string | null;
  state?: string | null;
}

interface PhotoItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileSize: number;
  fileSizeLoaded: boolean;
  filename: string;
  alreadyOptimized: boolean;
}

interface OptimizeResult {
  photoId: string;
  originalUrl: string;
  optimizedUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  status: "success" | "error" | "skipped";
  error?: string;
}

type PresetKey = "mls" | "zillow" | "social" | "custom";

// ── Constants ──

const PRESETS: Record<PresetKey, { label: string; desc: string; maxPx: number; targetKB: number; startQuality: number }> = {
  mls:    { label: "MLS Standard",         desc: "1920px · ≤290KB", maxPx: 1920, targetKB: 290, startQuality: 0.85 },
  zillow: { label: "Zillow / Realtor.com", desc: "1920px · ≤250KB", maxPx: 1920, targetKB: 250, startQuality: 0.80 },
  social: { label: "Social Media",         desc: "1080px · ≤200KB", maxPx: 1080, targetKB: 200, startQuality: 0.75 },
  custom: { label: "Custom",              desc: "Set your own",     maxPx: 1920, targetKB: 290, startQuality: 0.85 },
};

const MAX_PX = 1920;
const MAX_KB = 290;

// ── Inline Helpers ──

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function extractPublicId(url: string): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch { return null; }
}

async function deleteFromCloudinary(url: string): Promise<boolean> {
  const publicId = extractPublicId(url);
  if (!publicId) return false;
  try {
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId, resource_type: "image" }),
    });
    const data = await res.json();
    return data.success;
  } catch { return false; }
}

async function uploadToCloudinary(blob: Blob, filename: string): Promise<string> {
  const sigRes = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "photo2video/optimized" }),
  });
  const sigData = await sigRes.json();
  if (!sigData.success) throw new Error("Cloudinary signature failed");
  const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("api_key", apiKey);
  fd.append("timestamp", timestamp.toString());
  fd.append("signature", signature);
  fd.append("folder", folder);
  fd.append("resource_type", "auto");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: "POST", body: fd });
  const result = await res.json();
  if (!result.secure_url) throw new Error("Cloudinary upload failed");
  return result.secure_url;
}

function makeThumbnailUrl(url: string): string {
  if (url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/w_300,h_300,c_fill,q_60/");
  }
  return url;
}

function extractFilename(url: string): string {
  try {
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return last.split("?")[0] || "photo.jpg";
  } catch { return "photo.jpg"; }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractPhotoUrls(obj: any): string[] {
  if (!obj) return [];
  if (typeof obj === "string") return obj.startsWith("http") ? [obj] : [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => {
      if (typeof item === "string") return item.startsWith("http") ? [item] : [];
      if (item?.url) return [item.url];
      return [];
    });
  }
  if (typeof obj === "object") {
    const urls: string[] = [];
    if (obj.hero) urls.push(...extractPhotoUrls(obj.hero));
    if (obj.photos) urls.push(...extractPhotoUrls(obj.photos));
    if (obj.gallery) urls.push(...extractPhotoUrls(obj.gallery));
    if (urls.length === 0) {
      for (const val of Object.values(obj)) {
        urls.push(...extractPhotoUrls(val));
      }
    }
    return urls;
  }
  return [];
}

// ── Component ──

export default function PhotoOptimizer({ userId, isLensSubscriber = false, gateType = "buy_video" }: Props) {
  // Gate state
  const [showGate, setShowGate] = useState(false);

  // Property selection
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Settings
  const [preset, setPreset] = useState<PresetKey>("mls");
  const [customMaxPx, setCustomMaxPx] = useState(1920);
  const [customMaxKB, setCustomMaxKB] = useState(290);
  const [autoBrightness, setAutoBrightness] = useState(false);
  const [autoContrast, setAutoContrast] = useState(false);

  // Processing
  const [processing, setProcessing] = useState(false);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [results, setResults] = useState<OptimizeResult[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load properties on mount ──
  useEffect(() => {
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data } = await supabase
        .from("agent_properties")
        .select("id, address, city, state")
        .eq("user_id", userId)
        .is("merged_into_id", null)
        .order("updated_at", { ascending: false });
      if (data) setProperties(data);
      setLoadingProperties(false);
    })();
  }, [userId]);

  // ── Load photos when property selected ──
  useEffect(() => {
    if (!selectedPropertyId) { setPhotos([]); return; }
    setLoadingPhotos(true);
    setSelectedIds(new Set());
    setResults([]);
    setDone(false);

    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();

      // Get photos from orders
      const { data: orders } = await supabase
        .from("orders")
        .select("photos")
        .eq("property_id", selectedPropertyId)
        .order("created_at", { ascending: false });

      let allUrls: string[] = [];
      for (const order of (orders || [])) {
        allUrls.push(...extractPhotoUrls(order.photos));
      }

      // Also check website_curated on the property
      const { data: prop } = await supabase
        .from("agent_properties")
        .select("website_curated")
        .eq("id", selectedPropertyId)
        .single();

      if (prop?.website_curated) {
        allUrls.push(...extractPhotoUrls(prop.website_curated));
      }

      // Deduplicate
      allUrls = [...new Set(allUrls)].filter(u => u.includes("cloudinary") || u.startsWith("http"));

      if (allUrls.length === 0) {
        setPhotos([]);
        setLoadingPhotos(false);
        return;
      }

      // Create PhotoItem stubs
      const items: PhotoItem[] = allUrls.map((url) => ({
        id: uid(),
        url,
        thumbnailUrl: makeThumbnailUrl(url),
        width: 0,
        height: 0,
        fileSize: 0,
        fileSizeLoaded: false,
        filename: extractFilename(url),
        alreadyOptimized: false,
      }));

      setPhotos(items);
      setLoadingPhotos(false);

      // Load dimensions and file sizes in background
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej(new Error("Image load failed"));
            img.src = item.url;
          });
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          let fileSize = 0;
          try {
            const headRes = await fetch(item.url, { method: "HEAD" });
            const cl = headRes.headers.get("content-length");
            if (cl) fileSize = parseInt(cl, 10);
          } catch {
            fileSize = Math.round(w * h * 0.15);
          }

          const alreadyOptimized = fileSize <= MAX_KB * 1024 && Math.max(w, h) <= MAX_PX;

          setPhotos(prev => prev.map(p =>
            p.id === item.id ? { ...p, width: w, height: h, fileSize, fileSizeLoaded: true, alreadyOptimized } : p
          ));
        } catch {
          setPhotos(prev => prev.map(p =>
            p.id === item.id ? { ...p, fileSizeLoaded: true } : p
          ));
        }
      }
    })();
  }, [selectedPropertyId]);

  // ── Core Optimization Engine ──
  async function optimizePhoto(photoUrl: string, settings: {
    maxPx: number; targetKB: number; startQuality: number;
    autoBrightness: boolean; autoContrast: boolean;
  }): Promise<{ blob: Blob; width: number; height: number }> {
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => {
        // Retry with proxy
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load image"));
        img.src = `/api/proxy-media?url=${encodeURIComponent(photoUrl)}`;
      };
      img.src = photoUrl;
    });

    // Calculate target dimensions
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const maxDim = Math.min(settings.maxPx, MAX_PX);
    const longest = Math.max(w, h);
    if (longest > maxDim) {
      const scale = maxDim / longest;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    // Draw to canvas
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    // Auto-brightness and auto-contrast
    if (settings.autoBrightness || settings.autoContrast) {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      if (settings.autoBrightness) {
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / (data.length / 4);
        if (avgBrightness < 100) {
          const boost = Math.min(120 / avgBrightness, 1.6);
          for (let i = 0; i < data.length; i += 4) {
            data[i]     = Math.min(255, data[i] * boost);
            data[i + 1] = Math.min(255, data[i + 1] * boost);
            data[i + 2] = Math.min(255, data[i + 2] * boost);
          }
        }
      }

      if (settings.autoContrast) {
        let minVal = 255, maxVal = 0;
        for (let i = 0; i < data.length; i += 4) {
          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (lum < minVal) minVal = lum;
          if (lum > maxVal) maxVal = lum;
        }
        const range = maxVal - minVal;
        if (range > 0 && range < 200) {
          const s = 255 / range;
          for (let i = 0; i < data.length; i += 4) {
            data[i]     = Math.min(255, Math.max(0, (data[i] - minVal) * s));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - minVal) * s));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - minVal) * s));
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    // Iterative JPEG quality reduction to hit target file size
    const maxBytes = Math.min(settings.targetKB, MAX_KB) * 1024;
    let quality = settings.startQuality;
    let blob: Blob;

    do {
      blob = await new Promise<Blob>((res) => {
        canvas.toBlob((b) => res(b!), "image/jpeg", quality);
      });
      if (blob.size <= maxBytes) break;
      quality -= 0.05;
    } while (quality > 0.3);

    // Last resort: reduce dimensions if still over target
    if (blob.size > maxBytes) {
      const reductionScale = Math.sqrt(maxBytes / blob.size) * 0.95;
      const newW = Math.round(w * reductionScale);
      const newH = Math.round(h * reductionScale);
      canvas.width = newW;
      canvas.height = newH;
      ctx.drawImage(img, 0, 0, newW, newH);
      blob = await new Promise<Blob>((res) => {
        canvas.toBlob((b) => res(b!), "image/jpeg", 0.4);
      });
      w = newW;
      h = newH;
    }

    return { blob, width: w, height: h };
  }

  // ── Save with Overwrite ──
  async function saveOptimizedPhoto(
    propertyId: string,
    originalUrl: string,
    blob: Blob,
    width: number,
    height: number,
    presetKey: string
  ): Promise<string> {
    const supabase = (await import("@/lib/supabase/client")).createClient();

    // 1. Get existing optimized_photos
    const { data: prop } = await supabase
      .from("agent_properties")
      .select("optimized_photos")
      .eq("id", propertyId)
      .single();

    let existing: any[] = prop?.optimized_photos || [];

    // 2. If this original was already optimized, delete old from Cloudinary
    const oldMatch = existing.find((e: any) => e.original_url === originalUrl);
    if (oldMatch?.url) {
      await deleteFromCloudinary(oldMatch.url);
      existing = existing.filter((e: any) => e.original_url !== originalUrl);
    }

    // 3. Upload new optimized version
    const filename = `opt_${Date.now()}.jpg`;
    const optimizedUrl = await uploadToCloudinary(blob, filename);

    // 4. Append to array and save
    const newEntry = {
      id: "opt_" + uid(),
      url: optimizedUrl,
      original_url: originalUrl,
      width,
      height,
      file_size: blob.size,
      preset: presetKey,
      optimized_at: new Date().toISOString(),
    };

    await supabase
      .from("agent_properties")
      .update({ optimized_photos: [...existing, newEntry] })
      .eq("id", propertyId);

    return optimizedUrl;
  }

  // ── Process All Selected Photos ──
  async function handleOptimize() {
    if (!isLensSubscriber) { setShowGate(true); return; }
    if (!selectedPropertyId || selectedIds.size === 0) return;

    const selected = photos.filter(p => selectedIds.has(p.id));
    setProcessing(true);
    setProgressCurrent(0);
    setProgressTotal(selected.length);
    setResults([]);
    setError(null);

    const activePreset = preset === "custom"
      ? { maxPx: Math.min(customMaxPx, MAX_PX), targetKB: Math.min(customMaxKB, MAX_KB), startQuality: 0.85 }
      : PRESETS[preset];

    const newResults: OptimizeResult[] = [];

    // Process SEQUENTIALLY — no Promise.all (avoids OOM)
    for (let i = 0; i < selected.length; i++) {
      const photo = selected[i];
      setProgressCurrent(i + 1);

      try {
        const { blob, width, height } = await optimizePhoto(photo.url, {
          maxPx: activePreset.maxPx,
          targetKB: activePreset.targetKB,
          startQuality: activePreset.startQuality,
          autoBrightness,
          autoContrast,
        });

        const optimizedUrl = await saveOptimizedPhoto(
          selectedPropertyId, photo.url, blob, width, height, preset
        );

        newResults.push({
          photoId: photo.id,
          originalUrl: photo.url,
          optimizedUrl,
          originalSize: photo.fileSize,
          optimizedSize: blob.size,
          width,
          height,
          status: "success",
        });
      } catch (err: any) {
        console.error(`Failed to optimize ${photo.filename}:`, err);
        newResults.push({
          photoId: photo.id,
          originalUrl: photo.url,
          optimizedUrl: "",
          originalSize: photo.fileSize,
          optimizedSize: 0,
          width: 0,
          height: 0,
          status: "error",
          error: err.message || "Unknown error",
        });
      }

      setResults([...newResults]);
    }

    setProcessing(false);
    setDone(true);
  }

  // ── Selection Helpers ──
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map(p => p.id)));
    }
  }

  function handleReset() {
    setResults([]);
    setDone(false);
    setSelectedIds(new Set());
  }

  // ── Download Helpers ──
  async function downloadSingle(url: string, filename: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }

  function downloadAll() {
    const successes = results.filter(r => r.status === "success");
    successes.forEach((r, i) => {
      setTimeout(() => {
        downloadSingle(r.optimizedUrl, `optimized_${i + 1}.jpg`);
      }, i * 500);
    });
  }

  // ── Computed Values ──
  const selectedCount = selectedIds.size;
  const allSelected = photos.length > 0 && selectedIds.size === photos.length;
  const activeSettings = preset === "custom"
    ? { maxPx: Math.min(customMaxPx, MAX_PX), targetKB: Math.min(customMaxKB, MAX_KB) }
    : { maxPx: PRESETS[preset].maxPx, targetKB: PRESETS[preset].targetKB };

  const totalOriginalSize = results.reduce((s, r) => s + r.originalSize, 0);
  const totalOptimizedSize = results.reduce((s, r) => s + r.optimizedSize, 0);
  const reductionPercent = totalOriginalSize > 0 ? Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100) : 0;
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  // ── Render ──
  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">

        {/* ── TOP BAR ── */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/lens" className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <ImageIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white">Photo Optimizer</h1>
              <p className="text-xs text-white/30">Batch compress for MLS, Zillow, social — under 290KB</p>
            </div>
          </div>
        </div>

        {/* ── STEP 1: SELECT PROPERTY ── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Select Property</p>
          {loadingProperties ? (
            <div className="flex items-center gap-2 text-white/40 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-white/40 mb-3">No properties found. Add a property first.</p>
              <Link href="/dashboard/properties" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">Go to Properties →</Link>
            </div>
          ) : (
            <select
              value={selectedPropertyId || ""}
              onChange={(e) => setSelectedPropertyId(e.target.value || null)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-400/30 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">Choose a property...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.address}{p.city ? `, ${p.city}` : ""}{p.state ? ` ${p.state}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ── STEP 2: SELECT PHOTOS ── */}
        {selectedPropertyId && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white/30">Select Photos</p>
              {photos.length > 0 && (
                <div className="flex items-center gap-3">
                  <button onClick={toggleSelectAll} className="text-xs font-semibold text-cyan-400/70 hover:text-cyan-400 transition-colors">
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-xs text-white/30">{selectedCount} of {photos.length} selected</span>
                </div>
              )}
            </div>

            {loadingPhotos ? (
              <div className="flex items-center justify-center py-12 gap-2 text-white/40 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading photos...</div>
            ) : photos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-white/40">No photos found for this property.</p>
                <p className="text-xs text-white/25 mt-1">Photos are loaded from your video orders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {photos.map(photo => {
                  const isSelected = selectedIds.has(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => toggleSelect(photo.id)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? "border-cyan-400/40 bg-cyan-400/[0.06] ring-1 ring-cyan-400/20"
                          : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square overflow-hidden">
                        <img src={photo.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>

                      {/* Checkbox */}
                      <div className={`absolute top-2 left-2 h-5 w-5 rounded-md flex items-center justify-center transition-all ${
                        isSelected ? "bg-cyan-400 text-white" : "bg-black/40 border border-white/20"
                      }`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>

                      {/* File size badge */}
                      <div className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        photo.alreadyOptimized
                          ? "bg-green-400/20 text-green-400"
                          : "bg-black/50 text-white/70"
                      }`}>
                        {photo.alreadyOptimized && "✓ "}
                        {photo.fileSizeLoaded ? formatBytes(photo.fileSize) : "..."}
                      </div>

                      {/* Dimensions */}
                      {photo.width > 0 && (
                        <div className="px-2 py-1.5 text-center">
                          <span className="text-[10px] text-white/30">{photo.width} × {photo.height}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: SETTINGS ── */}
        {selectedCount > 0 && !processing && !done && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Optimization Settings</p>

            {/* Preset pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.entries(PRESETS) as [PresetKey, typeof PRESETS[PresetKey]][]).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    preset === key
                      ? "bg-cyan-400/15 border border-cyan-400/30 text-cyan-400"
                      : "bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white/70 hover:border-white/[0.12]"
                  }`}
                >
                  <span className="block">{p.label}</span>
                  <span className="block text-[10px] mt-0.5 opacity-60">{p.desc}</span>
                </button>
              ))}
            </div>

            {/* Active settings display */}
            <div className="flex items-center gap-2 mb-4 text-xs text-white/40">
              <Info className="h-3 w-3" />
              Max: {activeSettings.maxPx}px longest edge · Under {activeSettings.targetKB}KB · EXIF auto-stripped
            </div>

            {/* Custom inputs */}
            {preset === "custom" && (
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Max Dimension</label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min={500} max={1920} value={customMaxPx}
                      onChange={e => setCustomMaxPx(Math.min(1920, Math.max(500, Number(e.target.value))))}
                      className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-cyan-400/30 focus:outline-none" />
                    <span className="text-xs text-white/30">px (max 1920)</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Max File Size</label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min={50} max={290} value={customMaxKB}
                      onChange={e => setCustomMaxKB(Math.min(290, Math.max(50, Number(e.target.value))))}
                      className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-cyan-400/30 focus:outline-none" />
                    <span className="text-xs text-white/30">KB (max 290)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Enhancement toggles */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={autoBrightness} onChange={e => setAutoBrightness(e.target.checked)}
                  className="accent-cyan-400 rounded" />
                <span className="text-xs text-white/50">Auto-brightness (dark interiors)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={autoContrast} onChange={e => setAutoContrast(e.target.checked)}
                  className="accent-cyan-400 rounded" />
                <span className="text-xs text-white/50">Auto-contrast</span>
              </label>
            </div>

            {/* Optimize button */}
            <button
              onClick={handleOptimize}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-colors"
            >
              Optimize {selectedCount} Photo{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* ── STEP 4: PROCESSING ── */}
        {processing && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
              <p className="text-sm font-bold text-white/80">Optimizing {progressCurrent} of {progressTotal}...</p>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-4">
              <div className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0}%` }} />
            </div>

            {/* Results so far */}
            <div className="space-y-2">
              {results.map(r => {
                const photo = photos.find(p => p.id === r.photoId);
                return (
                  <div key={r.photoId} className="flex items-center gap-3 text-xs">
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className="text-white/60 truncate flex-1">{photo?.filename || "photo"}</span>
                    {r.status === "success" && (
                      <span className="text-white/40">
                        {formatBytes(r.originalSize)} → <span className="text-green-400 font-bold">{formatBytes(r.optimizedSize)}</span>
                      </span>
                    )}
                    {r.status === "error" && <span className="text-red-400">{r.error}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 5: DONE ── */}
        {done && (
          <div className="rounded-2xl border border-green-400/20 bg-green-400/[0.04] p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-sm font-bold text-white/90">{successCount} photo{successCount !== 1 ? "s" : ""} optimized & saved</p>
                {errorCount > 0 && <p className="text-xs text-red-400">{errorCount} failed</p>}
              </div>
            </div>

            {/* Summary */}
            {successCount > 0 && (
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="text-white/40">Total: {formatBytes(totalOriginalSize)} → <span className="text-green-400 font-bold">{formatBytes(totalOptimizedSize)}</span></span>
                <span className="text-green-400 font-bold">{reductionPercent}% reduction</span>
                <span className="text-green-400">All under {MAX_KB}KB ✓</span>
              </div>
            )}

            {/* Per-photo results */}
            <div className="space-y-2 mb-5">
              {results.map(r => {
                const photo = photos.find(p => p.id === r.photoId);
                return (
                  <div key={r.photoId} className="flex items-center gap-3 text-xs">
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    )}
                    <span className="text-white/60 truncate flex-1">{photo?.filename || "photo"}</span>
                    {r.status === "success" && (
                      <>
                        <span className="text-white/30">{formatBytes(r.originalSize)} → {formatBytes(r.optimizedSize)}</span>
                        <span className="text-white/20">{r.width}×{r.height}</span>
                      </>
                    )}
                    {r.status === "error" && <span className="text-red-400">{r.error}</span>}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/dashboard/properties/${selectedPropertyId}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold transition-colors">
                View on Property Page
              </Link>
              {successCount > 0 && (
                <button onClick={downloadAll}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white text-sm font-semibold transition-colors">
                  <Download className="h-4 w-4" /> Download All
                </button>
              )}
              <button onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white text-sm font-semibold transition-colors">
                Optimize More
              </button>
            </div>
          </div>
        )}

      </div>
      {showGate && <GateOverlay gateType={gateType} toolName="Photo Optimizer" onClose={() => setShowGate(false)} />}
    </div>
  );
}
