"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  ImageIcon,
  Upload,
  Sparkles,
  Download,
  Loader2,
  Check,
  X,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Home,
  Zap,
  AlertCircle,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
type EnhanceStatus = "pending" | "uploading" | "uploaded" | "enhancing" | "enhanced" | "error";

interface EnhancePhoto {
  id: string;                  // local id
  file?: File;                 // present until uploaded
  originalUrl: string | null;  // cloudinary URL once uploaded
  originalPublicId: string | null;
  enhancedUrl: string | null;  // cloudinary URL with transform applied
  status: EnhanceStatus;
  intensity: number;           // 0-100
  width?: number;
  height?: number;
  bytes?: number;
  filename: string;
  dbId?: string;               // supabase row id once saved
  error?: string;
}

interface PropertyContext {
  id: string;
  address: string;
}

/* ─────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────── */
const pageStyles = `
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-in { animation: fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .compare-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 28px; height: 28px; border-radius: 50%;
    background: #fff; border: 3px solid #06b6d4;
    cursor: ew-resize; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .compare-slider::-moz-range-thumb {
    width: 28px; height: 28px; border-radius: 50%;
    background: #fff; border: 3px solid #06b6d4;
    cursor: ew-resize; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .intensity-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 18px; height: 18px; border-radius: 50%;
    background: #06b6d4; cursor: pointer;
    box-shadow: 0 0 0 2px rgba(6,182,212,0.2);
  }
  .intensity-slider::-moz-range-thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: #06b6d4; cursor: pointer; border: none;
    box-shadow: 0 0 0 2px rgba(6,182,212,0.2);
  }
`;

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Build an enhanced-image URL from a Cloudinary URL by inserting the
 * transformation string after /upload/.
 *
 * intensity 0–100 controls e_improve strength. We always apply:
 *   e_improve, e_auto_color, e_auto_brightness, e_auto_contrast
 */
function buildEnhancedUrl(originalUrl: string, intensity: number): string {
  if (!originalUrl.includes("/upload/")) return originalUrl;
  const parts = [
    `e_improve:${Math.round(intensity)}`,
    "e_auto_color",
    "e_auto_brightness",
    "e_auto_contrast",
    "q_auto:good",
    "f_auto",
  ].join(",");
  return originalUrl.replace("/upload/", `/upload/${parts}/`);
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ═══════════════════════════════════════════════
   INNER PAGE (uses useSearchParams — must be inside Suspense)
   ═══════════════════════════════════════════════ */
function PhotoEnhancementInner() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<EnhancePhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [compareSlider, setCompareSlider] = useState(50);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Property linking via query string
  const [property, setProperty] = useState<PropertyContext | null>(null);

  /* ─── Init ─── */
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      setUser({ id: session.user.id, email: session.user.email || "" });

      // Property context from query string
      const propId = searchParams.get("propertyId");
      const address = searchParams.get("address");
      if (propId && address) {
        setProperty({ id: propId, address });
      }

      setLoading(false);
    };
    init();
  }, [searchParams]);

  /* ─── Upload photos to Cloudinary ─── */
  const uploadToCloudinary = useCallback(async (photo: EnhancePhoto): Promise<EnhancePhoto> => {
    if (!photo.file) return photo;
    try {
      const sigRes = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "photo2video/enhancements" }),
      });
      const sigData = await sigRes.json();
      if (!sigData.success) throw new Error("Signature failed");

      const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
      const fd = new FormData();
      fd.append("file", photo.file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", timestamp.toString());
      fd.append("signature", signature);
      fd.append("folder", folder);
      fd.append("resource_type", "auto");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      if (!result.secure_url) throw new Error("Upload failed");

      return {
        ...photo,
        originalUrl: result.secure_url,
        originalPublicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        status: "uploaded" as EnhanceStatus,
        file: undefined,
      };
    } catch (err: any) {
      return { ...photo, status: "error" as EnhanceStatus, error: err?.message || "Upload failed" };
    }
  }, []);

  /* ─── Enhance a single photo (apply transform + save to DB) ─── */
  const enhancePhoto = useCallback(async (photo: EnhancePhoto): Promise<EnhancePhoto> => {
    if (!photo.originalUrl || !user) return photo;
    try {
      const enhancedUrl = buildEnhancedUrl(photo.originalUrl, photo.intensity);

      // Save / update the row in supabase
      const supabase = createClient();
      const payload = {
        user_id: user.id,
        property_id: property?.id || null,
        original_url: photo.originalUrl,
        enhanced_url: enhancedUrl,
        intensity: photo.intensity,
        auto_color: true,
        auto_bright: true,
        auto_contrast: true,
        original_public_id: photo.originalPublicId,
        width: photo.width,
        height: photo.height,
        bytes_original: photo.bytes,
        filename: photo.filename,
      };

      let dbId = photo.dbId;
      if (dbId) {
        await supabase
          .from("lens_enhancements")
          .update({ enhanced_url: enhancedUrl, intensity: photo.intensity })
          .eq("id", dbId);
      } else {
        const { data } = await supabase
          .from("lens_enhancements")
          .insert(payload)
          .select("id")
          .single();
        dbId = data?.id;
      }

      return { ...photo, enhancedUrl, status: "enhanced" as EnhanceStatus, dbId };
    } catch (err: any) {
      return { ...photo, status: "error" as EnhanceStatus, error: err?.message || "Enhance failed" };
    }
  }, [user, property]);

  /* ─── Handle files added (from drop or input) ─── */
  const handleFilesAdded = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!list.length) return;

    const newPhotos: EnhancePhoto[] = list.map(file => ({
      id: uid(),
      file,
      originalUrl: null,
      originalPublicId: null,
      enhancedUrl: null,
      status: "uploading",
      intensity: 60,
      filename: file.name,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    // Select first new photo if nothing was selected
    setSelectedId(prev => prev ?? newPhotos[0]?.id ?? null);

    // Upload + auto-enhance in parallel
    for (const photo of newPhotos) {
      (async () => {
        const uploaded = await uploadToCloudinary(photo);
        if (uploaded.status !== "uploaded") {
          // Upload failed — flip row and stop
          setPhotos(prev => prev.map(p => (p.id === uploaded.id ? uploaded : p)));
          return;
        }

        // Single render: mark as enhancing with uploaded data
        const enhancing: EnhancePhoto = { ...uploaded, status: "enhancing" };
        setPhotos(prev => prev.map(p => (p.id === enhancing.id ? enhancing : p)));

        const enhanced = await enhancePhoto(enhancing);
        setPhotos(prev => prev.map(p => (p.id === enhanced.id ? enhanced : p)));
      })();
    }
  }, [uploadToCloudinary, enhancePhoto]);

  /* ─── Drag & drop ─── */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFilesAdded(e.dataTransfer.files);
  };

  /* ─── Remove photo ─── */
  const handleRemove = async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (photo?.dbId) {
      const supabase = createClient();
      await supabase.from("lens_enhancements").delete().eq("id", photo.dbId);
    }
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (selectedId === id) {
        setSelectedId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  /* ─── Change intensity for selected ─── */
  const handleIntensityChange = (newIntensity: number) => {
    if (!selectedId) return;
    setPhotos(prev => prev.map(p => {
      if (p.id !== selectedId || !p.originalUrl) return p;
      return {
        ...p,
        intensity: newIntensity,
        enhancedUrl: buildEnhancedUrl(p.originalUrl, newIntensity),
      };
    }));
  };

  /* ─── Commit intensity (persist to DB) ─── */
  // Capture id at call time so a racing selection change can't redirect the write.
  const handleIntensityCommit = async (photoId: string | null) => {
    if (!photoId || !user) return;
    const photo = photos.find(p => p.id === photoId);
    if (!photo?.dbId || !photo.enhancedUrl) return;
    const supabase = createClient();
    await supabase
      .from("lens_enhancements")
      .update({ enhanced_url: photo.enhancedUrl, intensity: photo.intensity })
      .eq("id", photo.dbId);
  };

  /* ─── Apply current intensity to all photos ─── */
  const handleApplyToAll = async () => {
    const selected = photos.find(p => p.id === selectedId);
    if (!selected) return;
    const targetIntensity = selected.intensity;

    const updated = photos.map(p => {
      if (!p.originalUrl) return p;
      return { ...p, intensity: targetIntensity, enhancedUrl: buildEnhancedUrl(p.originalUrl, targetIntensity) };
    });
    setPhotos(updated);

    // Persist — only rows with both dbId and a valid enhancedUrl
    if (user) {
      const supabase = createClient();
      await Promise.all(
        updated
          .filter(p => p.dbId && p.enhancedUrl)
          .map(p =>
            supabase
              .from("lens_enhancements")
              .update({ enhanced_url: p.enhancedUrl, intensity: p.intensity })
              .eq("id", p.dbId!)
          )
      );
    }
  };

  /* ─── Re-enhance a single photo ─── */
  const handleReEnhance = async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo || !photo.originalUrl) return;
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, status: "enhancing" as EnhanceStatus } : p)));
    const enhanced = await enhancePhoto({ ...photo, status: "enhancing" });
    setPhotos(prev => prev.map(p => (p.id === enhanced.id ? enhanced : p)));
  };

  /* ─── Downloads ─── */
  const downloadSingle = async (photo: EnhancePhoto) => {
    if (!photo.enhancedUrl) return;
    try {
      const res = await fetch(photo.enhancedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enhanced-${photo.filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revoke — some browsers haven't finished the click handler yet
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(photo.enhancedUrl, "_blank");
    }
  };

  const downloadAll = async () => {
    const enhanced = photos.filter(p => p.enhancedUrl);
    if (!enhanced.length) return;
    setIsDownloadingAll(true);
    // Sequential downloads — browsers will queue them.
    // (If you want a zip, we can add JSZip later.)
    for (const photo of enhanced) {
      await downloadSingle(photo);
      await new Promise(r => setTimeout(r, 300)); // small gap so browser doesn't choke
    }
    setIsDownloadingAll(false);
  };

  /* ─── Selected photo + derived state ─── */
  const selected = photos.find(p => p.id === selectedId);
  const enhancedCount = photos.filter(p => p.status === "enhanced").length;
  const isProcessing = photos.some(p => p.status === "uploading" || p.status === "enhancing");

  /* ─── Navigation between photos in compare view ─── */
  const selectedIndex = photos.findIndex(p => p.id === selectedId);
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < photos.length - 1;
  const goPrev = () => canPrev && setSelectedId(photos[selectedIndex - 1].id);
  const goNext = () => canNext && setSelectedId(photos[selectedIndex + 1].id);

  /* ─────────────────────────────────────────────
     Render
     ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 15% 20%, rgba(20,184,166,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(99,102,241,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ═══ HEADER ═══ */}
        <div className="anim-in flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" />Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10 ring-1 ring-teal-400/20">
                <ImageIcon className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">Photo Enhancement</h1>
                <p className="text-sm text-white/50">AI brightness, color & white balance correction</p>
              </div>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-right mr-2">
                <p className="text-xs text-white/40">
                  {enhancedCount} of {photos.length} enhanced
                </p>
                {isProcessing && (
                  <p className="text-[10px] text-teal-400 flex items-center gap-1 justify-end mt-0.5">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />Processing...
                  </p>
                )}
              </div>
              <Button
                onClick={downloadAll}
                disabled={!enhancedCount || isDownloadingAll}
                size="sm"
                className="bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm"
              >
                {isDownloadingAll ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Downloading...</>
                ) : (
                  <><Download className="mr-1.5 h-4 w-4" />Download All</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* ═══ PROPERTY CONTEXT CHIP ═══ */}
        {property && (
          <div className="anim-in mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.06] px-3.5 py-1.5">
            <Home className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-xs text-white/70">Linked to:</span>
            <span className="text-xs font-bold text-teal-300">{property.address}</span>
            <Link href="/dashboard/lens/enhance" className="text-white/30 hover:text-white/60">
              <X className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* ═══ UPLOAD ZONE (always visible; compact when photos exist) ═══ */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`anim-in cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
            dragOver
              ? "border-teal-400 bg-teal-400/10"
              : "border-white/10 bg-white/[0.02] hover:border-teal-400/40 hover:bg-white/[0.04]"
          } ${photos.length ? "p-4" : "p-10"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files?.length) handleFilesAdded(e.target.files); e.target.value = ""; }}
          />
          <div className={`flex items-center justify-center ${photos.length ? "gap-3" : "flex-col gap-3"}`}>
            <div className={`flex items-center justify-center rounded-xl bg-teal-400/10 ${photos.length ? "h-10 w-10" : "h-16 w-16"}`}>
              <Upload className={`text-teal-400 ${photos.length ? "h-5 w-5" : "h-7 w-7"}`} />
            </div>
            <div className={photos.length ? "" : "text-center"}>
              <p className={`font-bold text-white ${photos.length ? "text-sm" : "text-lg"}`}>
                {photos.length ? "Add more photos" : "Drop photos here or click to upload"}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {photos.length ? "Auto-enhances on upload" : "JPG, PNG, WEBP — auto-enhances on upload"}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ EMPTY STATE HELP ═══ */}
        {photos.length === 0 && (
          <div className="anim-in mt-6 grid sm:grid-cols-3 gap-3">
            {[
              { icon: Wand2, label: "Brightness", desc: "Auto-balanced exposure for dark interiors" },
              { icon: Sparkles, label: "Color", desc: "Richer tones without oversaturation" },
              { icon: Zap, label: "White Balance", desc: "Removes yellow/blue color casts" },
            ].map(f => (
              <div key={f.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <f.icon className="h-4 w-4 text-teal-400" />
                  <p className="text-sm font-bold text-white/90">{f.label}</p>
                </div>
                <p className="text-xs text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ═══ MAIN LAYOUT: COMPARE + BATCH LIST ═══ */}
        {photos.length > 0 && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">

            {/* ── Compare view ── */}
            <div className="anim-in order-2 lg:order-1">
              {selected && selected.originalUrl && selected.enhancedUrl ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 min-w-0">
                      <button onClick={goPrev} disabled={!canPrev} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="h-4 w-4 text-white/60" />
                      </button>
                      <span className="text-xs text-white/40">
                        {selectedIndex + 1} / {photos.length}
                      </span>
                      <button onClick={goNext} disabled={!canNext} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRight className="h-4 w-4 text-white/60" />
                      </button>
                      <p className="text-sm font-semibold text-white/80 truncate ml-2">{selected.filename}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => downloadSingle(selected)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-400/80 hover:text-teal-300 px-2.5 py-1 rounded-lg hover:bg-teal-400/10 transition-colors"
                      >
                        <Download className="h-3 w-3" />Download
                      </button>
                    </div>
                  </div>

                  {/* Before/After compare */}
                  <div className="relative bg-black" style={{ aspectRatio: selected.width && selected.height ? `${selected.width} / ${selected.height}` : "3 / 2", maxHeight: "70vh" }}>
                    {/* Enhanced (bottom layer, full) */}
                    <img
                      src={selected.enhancedUrl}
                      alt="Enhanced"
                      className="absolute inset-0 w-full h-full object-contain"
                      draggable={false}
                    />
                    {/* Original (top layer, clipped) */}
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - compareSlider}% 0 0)` }}>
                      <img
                        src={selected.originalUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    {/* Divider line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                      style={{ left: `${compareSlider}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-teal-400 shadow-xl flex items-center justify-center">
                        <div className="flex">
                          <ChevronLeft className="h-3 w-3 text-teal-600 -mr-0.5" />
                          <ChevronRight className="h-3 w-3 text-teal-600 -ml-0.5" />
                        </div>
                      </div>
                    </div>
                    {/* Labels */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Before</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-teal-500/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">After</span>
                    </div>
                    {/* Compare slider (invisible, overlay) */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={compareSlider}
                      onChange={e => setCompareSlider(Number(e.target.value))}
                      className="compare-slider absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                      aria-label="Compare before and after"
                    />
                  </div>

                  {/* Controls */}
                  <div className="p-4 border-t border-white/[0.06] space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-white/70">Enhancement Intensity</label>
                        <span className="text-xs font-mono font-bold text-teal-400">{selected.intensity}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={selected.intensity}
                        onChange={e => handleIntensityChange(Number(e.target.value))}
                        onMouseUp={() => handleIntensityCommit(selected.id)}
                        onTouchEnd={() => handleIntensityCommit(selected.id)}
                        className="intensity-slider w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-white/30 mt-1">
                        <span>Subtle</span>
                        <span>Balanced</span>
                        <span>Strong</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleApplyToAll}
                        variant="outline"
                        size="sm"
                        className="bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white text-xs"
                      >
                        <Wand2 className="mr-1.5 h-3 w-3" />Apply to all
                      </Button>
                      <Button
                        onClick={() => handleReEnhance(selected.id)}
                        variant="outline"
                        size="sm"
                        className="bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white text-xs"
                      >
                        <RefreshCw className="mr-1.5 h-3 w-3" />Re-run
                      </Button>
                    </div>
                  </div>
                </div>
              ) : selected ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                  {selected.status === "error" ? (
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                      <p className="text-sm font-bold text-red-400">{selected.error || "Something went wrong"}</p>
                      <Button size="sm" variant="outline" onClick={() => handleRemove(selected.id)} className="bg-white/5 border-white/10 text-white/70">Remove</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                      <p className="text-sm font-bold text-white/70 capitalize">{selected.status}...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                  <p className="text-sm text-white/40">Select a photo from the list</p>
                </div>
              )}
            </div>

            {/* ── Batch list ── */}
            <div className="anim-in order-1 lg:order-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/40">Photos ({photos.length})</p>
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {photos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedId(photo.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${
                      selectedId === photo.id
                        ? "border-teal-400/40 bg-teal-400/[0.08]"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                      {photo.enhancedUrl ? (
                        <img src={photo.enhancedUrl} alt="" className="w-full h-full object-cover" />
                      ) : photo.originalUrl ? (
                        <img src={photo.originalUrl} alt="" className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-white/20" />
                        </div>
                      )}
                      {(photo.status === "uploading" || photo.status === "enhancing") && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                        </div>
                      )}
                      {photo.status === "enhanced" && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      {photo.status === "error" && (
                        <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-red-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/80 truncate">{photo.filename}</p>
                      <p className="text-[10px] text-white/40 capitalize">
                        {photo.status === "enhanced" ? `Enhanced · ${photo.intensity}%` : photo.status}
                        {photo.bytes ? ` · ${formatBytes(photo.bytes)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(photo.id); }}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   OUTER PAGE — Suspense boundary for useSearchParams()
   ═══════════════════════════════════════════════ */
export default function PhotoEnhancementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900">
          <Navigation />
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        </div>
      }
    >
      <PhotoEnhancementInner />
    </Suspense>
  );
}
