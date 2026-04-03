"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Upload,
  Image as ImageIcon,
  PenTool,
  Home,
  DollarSign,
  CheckCircle,
  X,
  Loader2,
  Palette,
  CreditCard,
  Phone,
  Mail,
  User,
  MapPin,
  Calendar,
  Play,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Lock,
  Sparkles,
  Film,
  Music,
  Check,
} from "lucide-react";
import {
  InfoBarTemplate,
  OpenHouseTemplate,
  YardSignSplitBar,
  YardSignSidebar,
  YardSignTopHeavy,
  PropertyPdfPage,
  BrandingCardTemplate,
  getBadgeConfig,
  isLightColor,
  type TemplateType,
  type SizeConfig,
} from "@/components/design-templates";

/* ═══════════════════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════════════════ */

type SizeOption = "square" | "story" | "postcard";
type StudioTab = "templates" | "branding-card" | "yard-sign" | "property-pdf";
type YardSignDesign = "split-bar" | "sidebar" | "top-heavy";

const TEMPLATES = [
  { id: "just-listed" as TemplateType, label: "Just Listed", icon: Home },
  { id: "open-house" as TemplateType, label: "Open House", icon: Calendar },
  { id: "price-reduced" as TemplateType, label: "Price Reduced", icon: DollarSign },
  { id: "just-sold" as TemplateType, label: "Just Sold", icon: CheckCircle },
];

const SIZES: SizeConfig[] = [
  { id: "square", label: "Square", sublabel: "Instagram / Facebook", width: 1080, height: 1080 },
  { id: "story", label: "Story", sublabel: "Instagram / TikTok", width: 1080, height: 1920 },
  { id: "postcard", label: "Postcard", sublabel: "6×4 Print-Ready", width: 1800, height: 1200 },
];

const YARD_SIGN_SIZES = [
  { id: "18x24" as const, label: '18×24"', sublabel: "Standard", width: 5400, height: 7200 },
  { id: "24x36" as const, label: '24×36"', sublabel: "Large", width: 7200, height: 10800 },
];

const YARD_SIGN_DESIGNS: { id: YardSignDesign; label: string; description: string }[] = [
  { id: "split-bar", label: "Split Bar", description: "Colored top & bottom bars with white center" },
  { id: "sidebar", label: "Sidebar", description: "Vertical sidebar with centered headshot" },
  { id: "top-heavy", label: "Top Heavy", description: "Large color header with photo below" },
];

const BRANDING_ORIENTATIONS = [
  { id: "landscape" as const, label: "Landscape", sublabel: "1920×1080", width: 1920, height: 1080 },
  { id: "vertical" as const, label: "Vertical", sublabel: "1080×1920", width: 1080, height: 1920 },
];

const BROKERAGE_COLORS = [
  { hex: "#b40101", label: "KW Red" },{ hex: "#666666", label: "KW Gray" },{ hex: "#003399", label: "CB Blue" },{ hex: "#012169", label: "CB Navy" },{ hex: "#003da5", label: "RM Blue" },{ hex: "#dc1c2e", label: "RM Red" },{ hex: "#b5985a", label: "C21 Gold" },{ hex: "#1c1c1c", label: "C21 Black" },{ hex: "#000000", label: "CMP Black" },{ hex: "#333333", label: "CMP Dark" },{ hex: "#002349", label: "SIR Blue" },{ hex: "#1a1a1a", label: "SIR Black" },{ hex: "#552448", label: "BH Purple" },{ hex: "#2d1a33", label: "BH Dark" },{ hex: "#1c3f6e", label: "EXP Blue" },{ hex: "#006341", label: "HH Green" },{ hex: "#003d28", label: "HH Dk Green" },{ hex: "#4c8c2b", label: "BHG Green" },{ hex: "#d4272e", label: "EXT Red" },{ hex: "#e31937", label: "ERA Red" },{ hex: "#273691", label: "ERA Blue" },{ hex: "#a02021", label: "RF Red" },{ hex: "#ffffff", label: "White" },
];

const ACCENT_COLORS = ["#f59e0b","#ef4444","#3b82f6","#10b981","#8b5cf6","#ec4899","#06b6d4","#f97316","#d4af37","#c0c0c0","#ffffff","#000000"];

const FONT_OPTIONS = [
  { id: "serif", label: "Classic Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "sans", label: "Clean Sans", family: "'Helvetica Neue', Arial, sans-serif" },
  { id: "modern", label: "Modern", family: "'Trebuchet MS', 'Gill Sans', sans-serif" },
  { id: "elegant", label: "Elegant", family: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
];

const VIBE_FILTERS = [
  { key: "", label: "All", emoji: "🎵" },
  { key: "upbeat_modern", label: "Upbeat", emoji: "🎶" },
  { key: "chill_tropical", label: "Chill", emoji: "🌴" },
  { key: "energetic_pop", label: "Energetic", emoji: "⚡" },
  { key: "elegant_classical", label: "Elegant", emoji: "🎹" },
  { key: "warm_acoustic", label: "Acoustic", emoji: "🎸" },
  { key: "bold_cinematic", label: "Cinematic", emoji: "🎬" },
  { key: "smooth_jazz", label: "Jazz", emoji: "🎺" },
  { key: "ambient", label: "Ambient", emoji: "🌙" },
];

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

async function uploadToCloudinary(file: File | Blob, folder: string): Promise<string | null> {
  try {
    const sigResponse = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: `photo2video/${folder}` }),
    });
    const sigData = await sigResponse.json();
    if (!sigData.success) throw new Error("Signature failed");
    const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", timestamp.toString());
    fd.append("signature", signature);
    fd.append("folder", folderPath);
    fd.append("resource_type", "auto");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: "POST", body: fd });
    const result = await res.json();
    return result.secure_url || null;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   REUSABLE UI COMPONENTS
   ═══════════════════════════════════════════════════════ */

function ImageUploadBox({ label, imageUrl, onUpload, onClear, uploading, hint, className = "" }: {
  label: string; imageUrl: string | null; onUpload: (file: File) => void; onClear: () => void;
  uploading: boolean; hint?: string; className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm font-semibold">{label}</Label>
      {imageUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square">
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          <button onClick={onClear} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground bg-muted/30">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Upload className="h-6 w-6" /><span className="text-xs font-medium">Upload</span></>}
        </button>
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
    </div>
  );
}

function BrokerageSwatches({ currentColor, onSelect }: { currentColor: string; onSelect: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {BROKERAGE_COLORS.map((c) => (
        <button key={c.hex + c.label} onClick={() => onSelect(c.hex)} title={`${c.label} — ${c.hex}`}
          className={`relative group flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all text-[10px] font-medium ${currentColor === c.hex ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/40"}`}>
          <span className="w-4 h-4 rounded flex-shrink-0 border border-black/10" style={{ backgroundColor: c.hex }} />
          <span className="text-muted-foreground">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

function AccentSwatches({ currentColor, onSelect }: { currentColor: string; onSelect: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_COLORS.map((c) => (
        <button key={c} onClick={() => onSelect(c)} className={`w-7 h-7 rounded-lg border-2 transition-all flex-shrink-0 ${currentColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"}`} style={{ backgroundColor: c }} title={c} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPACT MUSIC SELECTOR  (visible only in Video Overlay)
   ═══════════════════════════════════════════════════════ */

function CompactMusicSelector({
  selectedTrack,
  onSelect,
  customAudioFile,
  onCustomAudioChange,
}: {
  selectedTrack: string;
  onSelect: (selection: string) => void;
  customAudioFile: File | null;
  onCustomAudioChange: (file: File | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [vibeFilter, setVibeFilter] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioPermission, setAudioPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = async (vibe: string = "") => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/generate-music?library=true&vibe=${vibe}`);
      const data = await resp.json();
      setTracks(data.tracks || []);
    } catch (e) {
      console.error("Library fetch error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (expanded && tracks.length === 0) fetchTracks();
  }, [expanded]);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  const handlePlay = (trackId: string, url: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingId === trackId) { setPlayingId(null); return; }
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(trackId);
  };

  const getSelectedName = (): string | null => {
    if (customAudioFile) return customAudioFile.name;
    if (!selectedTrack) return null;
    const trackId = selectedTrack.split(":")[1];
    const track = tracks.find((t) => t.id === trackId);
    return track?.display_name || "Selected track";
  };

  const selectedName = getSelectedName();

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Music className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Background Music</p>
            {selectedName ? (
              <p className="text-xs text-primary font-medium">♪ {selectedName}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Optional — add music to your video</p>
            )}
          </div>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {/* No-music option */}
          <button
            type="button"
            onClick={() => { onSelect(""); onCustomAudioChange(null); }}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left text-sm transition-all ${
              !selectedTrack && !customAudioFile
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">No music (keep original audio)</span>
            {!selectedTrack && !customAudioFile && <Check className="h-4 w-4 text-primary ml-auto" />}
          </button>

          {/* Vibe filter chips */}
          <div className="flex flex-wrap gap-1">
            {VIBE_FILTERS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => { setVibeFilter(v.key); fetchTracks(v.key); }}
                className={`text-[11px] py-1 px-2.5 rounded-md border transition-all ${
                  vibeFilter === v.key
                    ? "bg-primary/10 border-primary text-primary font-semibold"
                    : "border-border hover:bg-muted"
                }`}
              >
                {v.emoji} {v.label}
              </button>
            ))}
          </div>

          {/* Track list */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
              {tracks.map((track) => {
                const isSelected = selectedTrack.includes(track.id);
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => onSelect(`library:${track.id}:${track.file_url}`)}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePlay(track.id, track.file_url); }}
                      className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        playingId === track.id ? "bg-primary text-white" : "bg-primary/10 hover:bg-primary/20"
                      }`}
                    >
                      {playingId === track.id ? (
                        <span className="text-[10px] font-bold">■</span>
                      ) : (
                        <span className="text-primary text-[10px] font-bold ml-0.5">▶</span>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">{track.duration_seconds}s</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom audio upload */}
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground mb-1.5">Or upload your own audio:</p>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onCustomAudioChange(file);
                if (file) { onSelect("custom"); setAudioPermission(false); }
              }}
              className="text-sm file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {customAudioFile && (
              <div className="mt-2 space-y-1.5">
                <p className="text-xs text-green-600">✓ {customAudioFile.name}</p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioPermission}
                    onChange={(e) => {
                      setAudioPermission(e.target.checked);
                      if (!e.target.checked) { onCustomAudioChange(null); onSelect(""); }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <span className="text-[11px] text-muted-foreground">I have permission to use this audio.</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIDEO EXPORT PROGRESS MODAL
   ═══════════════════════════════════════════════════════ */

function VideoExportModal({ progress, status, onCancel }: { progress: number; status: string; onCancel?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full mx-4 text-center space-y-5">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Film className="h-8 w-8 text-accent animate-pulse" />
        </div>
        <h3 className="text-xl font-extrabold text-foreground">Exporting Video</h3>
        <p className="text-sm text-muted-foreground">{status}</p>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${Math.max(progress, 2)}%` }} />
        </div>
        <p className="text-sm font-bold text-foreground">{Math.round(progress)}%</p>
        {progress < 100 && onCancel && (
          <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground underline">Cancel</button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function DesignStudioPage() {
  const [tab, setTab] = useState<StudioTab>("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("just-listed");
  const [selectedSize, setSelectedSize] = useState<SizeOption>("square");

  // Auth + Paywall
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [freeExportsUsed, setFreeExportsUsed] = useState(0);
  const [paywallHit, setPaywallHit] = useState(false);
  const FREE_EXPORT_LIMIT = 3;

  // Saved headshot/logo
  const [savedHeadshot, setSavedHeadshot] = useState<string | null>(null);
  const [savedLogo, setSavedLogo] = useState<string | null>(null);

  // Shared uploads & fields
  const [mediaMode, setMediaMode] = useState<"image" | "video">("image");
  const [listingPhoto, setListingPhoto] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; thumbnail: string; orderId: string } | null>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [headshot, setHeadshot] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [uploadingListing, setUploadingListing] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [address, setAddress] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [agentName, setAgentName] = useState("");
  const [phone, setPhone] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [listingFont, setListingFont] = useState("sans");
  const [listingBarColor, setListingBarColor] = useState("#111827");
  const [listingAccentColor, setListingAccentColor] = useState("");

  // Music state (video overlay mode)
  const [overlayMusic, setOverlayMusic] = useState("");            // "library:<id>:<url>" | "custom" | ""
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);

  // Yard sign state
  const [yardSignSize, setYardSignSize] = useState<"18x24" | "24x36">("18x24");
  const [yardDesign, setYardDesign] = useState<YardSignDesign>("split-bar");
  const [yardHeaderText, setYardHeaderText] = useState("FOR SALE");
  const [yardTopColor, setYardTopColor] = useState("#dc1c2e");
  const [yardBottomColor, setYardBottomColor] = useState("#003da5");
  const [yardSidebarColor, setYardSidebarColor] = useState("#1c1c1c");
  const [yardMainBgColor, setYardMainBgColor] = useState("#ffffff");
  const [yardWebsite, setYardWebsite] = useState("");
  const [yardOfficeName, setYardOfficeName] = useState("");
  const [yardOfficePhone, setYardOfficePhone] = useState("");
  const [yardQrUrl, setYardQrUrl] = useState("");
  const [yardQrDataUrl, setYardQrDataUrl] = useState<string | null>(null);

  // Property PDF state
  const [pdfAddress, setPdfAddress] = useState("");
  const [pdfCityStateZip, setPdfCityStateZip] = useState("");
  const [pdfPrice, setPdfPrice] = useState("");
  const [pdfBeds, setPdfBeds] = useState("");
  const [pdfBaths, setPdfBaths] = useState("");
  const [pdfSqft, setPdfSqft] = useState("");
  const [pdfDescription, setPdfDescription] = useState("");
  const [pdfFeatures, setPdfFeatures] = useState("");
  const [pdfPhotos, setPdfPhotos] = useState<string[]>([]);
  const [uploadingPdfPhoto, setUploadingPdfPhoto] = useState(false);
  const [pdfPreviewPage, setPdfPreviewPage] = useState(0);
  const [pdfAccentColor, setPdfAccentColor] = useState("#0d9488");

  // Branding card state
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandHeadshot, setBrandHeadshot] = useState<string | null>(null);
  const [brandBgPhoto, setBrandBgPhoto] = useState<string | null>(null);
  const [brandAgentName, setBrandAgentName] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandBrokerage, setBrandBrokerage] = useState("");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandAddress, setBrandAddress] = useState("");
  const [brandCityState, setBrandCityState] = useState("");
  const [brandPrice, setBrandPrice] = useState("");
  const [brandFeatures, setBrandFeatures] = useState("");
  const [brandBgColor, setBrandBgColor] = useState("#14532d");
  const [brandAccentColor, setBrandAccentColor] = useState("");
  const [brandOrientation, setBrandOrientation] = useState<"landscape" | "vertical">("landscape");
  const [brandFont, setBrandFont] = useState("serif");
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [uploadingBrandHeadshot, setUploadingBrandHeadshot] = useState(false);
  const [uploadingBrandBg, setUploadingBrandBg] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [videoExporting, setVideoExporting] = useState(false);
  const [videoExportProgress, setVideoExportProgress] = useState(0);
  const [videoExportStatus, setVideoExportStatus] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentSize = SIZES.find((s) => s.id === selectedSize)!;
  const currentBrandOrientation = BRANDING_ORIENTATIONS.find((o) => o.id === brandOrientation)!;
  const currentFontFamily = FONT_OPTIONS.find((f) => f.id === brandFont)?.family || FONT_OPTIONS[0].family;
  const listingFontFamily = FONT_OPTIONS.find((f) => f.id === listingFont)?.family || FONT_OPTIONS[1].family;
  const currentYardSize = YARD_SIGN_SIZES.find((s) => s.id === yardSignSize)!;

  // Init: auth + subscription + saved assets
  useEffect(() => {
    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setAuthLoading(false);
      if (!authUser) return;
      setUser(authUser);
      const admin = authUser.email === "realestatephoto2video@gmail.com";
      setIsAdmin(admin);
      const { data } = await supabase.from("lens_usage").select("saved_headshot_url, saved_logo_url, is_subscriber, free_design_exports_used").eq("user_id", authUser.id).single();
      if (data) {
        if (data.saved_headshot_url) { setSavedHeadshot(data.saved_headshot_url); setHeadshot(data.saved_headshot_url); setBrandHeadshot(data.saved_headshot_url); }
        if (data.saved_logo_url) { setSavedLogo(data.saved_logo_url); setLogo(data.saved_logo_url); setBrandLogo(data.saved_logo_url); }
        if (admin || data.is_subscriber) setIsSubscriber(true);
        setFreeExportsUsed(data.free_design_exports_used || 0);
      }
      if (admin) setIsSubscriber(true);
    };
    init();
  }, []);

  // Save asset to DB
  const saveAssetToDb = async (field: "saved_headshot_url" | "saved_logo_url", url: string) => {
    if (!user) return;
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.from("lens_usage").upsert({ user_id: user.id, [field]: url }, { onConflict: "user_id" });
  };

  // QR code
  useEffect(() => {
    if (!yardQrUrl) { setYardQrDataUrl(null); return; }
    let c = false;
    (async () => { try { const QR = (await import("qrcode")).default; const u = await QR.toDataURL(yardQrUrl, { width: 600, margin: 2, errorCorrectionLevel: "M" }); if (!c) setYardQrDataUrl(u); } catch { if (!c) setYardQrDataUrl(null); } })();
    return () => { c = true; };
  }, [yardQrUrl]);

  const pdfTotalPages = 1 + Math.ceil(Math.max(0, pdfPhotos.length - 3) / 6);

  const getScaledDimensions = useCallback(() => {
    const maxW = 520, maxH = 560;
    let w: number, h: number;
    if (tab === "branding-card") { w = currentBrandOrientation.width; h = currentBrandOrientation.height; }
    else if (tab === "yard-sign") { w = currentYardSize.width; h = currentYardSize.height; }
    else if (tab === "property-pdf") { w = 2550; h = 3300; }
    else { w = currentSize.width; h = currentSize.height; }
    const s = Math.min(maxW / w, maxH / h, 1);
    return { scale: s, width: w * s, height: h * s, rawW: w, rawH: h };
  }, [tab, currentSize, currentBrandOrientation, currentYardSize]);

  const { scale, width: previewW, height: previewH, rawW, rawH } = getScaledDimensions();

  // Upload handlers with persistence
  const handleUpload = async (file: File, folder: string, setUrl: (u: string | null) => void, setLoading: (v: boolean) => void) => { setLoading(true); const url = await uploadToCloudinary(file, folder); setUrl(url); setLoading(false); };

  const handleHeadshotUpload = async (file: File, setUrl: (u: string | null) => void, setLoading: (v: boolean) => void) => {
    setLoading(true);
    const url = await uploadToCloudinary(file, "design-studio");
    if (url) { setUrl(url); setHeadshot(url); setBrandHeadshot(url); saveAssetToDb("saved_headshot_url", url); setSavedHeadshot(url); }
    setLoading(false);
  };

  const handleLogoUpload = async (file: File, setUrl: (u: string | null) => void, setLoading: (v: boolean) => void) => {
    setLoading(true);
    const url = await uploadToCloudinary(file, "design-studio");
    if (url) { setUrl(url); setLogo(url); setBrandLogo(url); saveAssetToDb("saved_logo_url", url); setSavedLogo(url); }
    setLoading(false);
  };

  const handlePdfPhotoUpload = async (file: File) => { if (pdfPhotos.length >= 25) return; setUploadingPdfPhoto(true); const url = await uploadToCloudinary(file, "design-studio"); if (url) setPdfPhotos(prev => [...prev, url]); setUploadingPdfPhoto(false); };

  const loadUserVideos = async () => {
    if (userVideos.length > 0) return;
    setLoadingVideos(true);
    try { const supabase = (await import("@/lib/supabase/client")).createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data: orders } = await supabase.from("orders").select("order_id, delivery_url, unbranded_delivery_url, photos, created_at").eq("user_id", user.id).in("status", ["complete", "delivered", "closed"]).order("created_at", { ascending: false }); setUserVideos((orders || []).filter((o: any) => o.unbranded_delivery_url || o.delivery_url).map((o: any) => ({ orderId: o.order_id, url: o.unbranded_delivery_url || o.delivery_url, thumbnail: o.photos?.[0]?.secure_url || null, hasUnbranded: !!o.unbranded_delivery_url, date: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }))); } catch (err) { console.error(err); } finally { setLoadingVideos(false); }
  };

  // Increment export counter for free users
  const incrementExportCounter = async () => {
    if (!isSubscriber && !isAdmin && user) {
      const newCount = freeExportsUsed + 1;
      setFreeExportsUsed(newCount);
      const supabase = (await import("@/lib/supabase/client")).createClient();
      await supabase.from("lens_usage").upsert({ user_id: user.id, free_design_exports_used: newCount }, { onConflict: "user_id" });
    }
  };

  // Paywall check
  const checkPaywall = (): boolean => {
    if (!isSubscriber && !isAdmin && freeExportsUsed >= FREE_EXPORT_LIMIT) { setPaywallHit(true); return true; }
    return false;
  };

  // Prepare element for export — remove scale transform temporarily
  const prepareForExport = (el: HTMLElement): { restore: () => void } => {
    const parent = el.parentElement as HTMLElement;
    const savedTransform = el.style.transform;
    const savedOverflow = parent?.style.overflow;
    const savedWidth = parent?.style.width;
    const savedHeight = parent?.style.height;
    el.style.transform = "none";
    if (parent) { parent.style.overflow = "visible"; parent.style.width = `${rawW}px`; parent.style.height = `${rawH}px`; }
    return {
      restore: () => {
        el.style.transform = savedTransform;
        if (parent) { parent.style.overflow = savedOverflow || ""; parent.style.width = savedWidth || ""; parent.style.height = savedHeight || ""; }
      }
    };
  };

  // PNG Export
  const handleExport = async () => {
    if (checkPaywall()) return;
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement;
      if (!el) return;
      const { restore } = prepareForExport(el);
      const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: tab === "property-pdf" ? "#ffffff" : null, width: rawW, height: rawH });
      restore();
      const link = document.createElement("a");
      link.download = `p2v-${tab}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      await incrementExportCounter();
    } catch (err) { console.error(err); alert("Export failed."); } finally { setExporting(false); }
  };

  // PDF Export
  const handlePdfExport = async () => {
    if (checkPaywall()) return;
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas-pro")).default;
      const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
      for (let page = 0; page < pdfTotalPages; page++) {
        setPdfPreviewPage(page);
        await new Promise(r => setTimeout(r, 400));
        const el = previewRef.current!.querySelector("[data-export-target]") as HTMLElement;
        if (!el) continue;
        const { restore } = prepareForExport(el);
        const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", width: 2550, height: 3300 });
        restore();
        if (page > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 8.5, 11);
      }
      pdf.save(`${pdfAddress.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30) || "property"}_sheet.pdf`);
      setPdfPreviewPage(0);
      await incrementExportCounter();
    } catch (err) { console.error(err); alert("PDF export failed."); } finally { setExporting(false); }
  };

  /* ─────────────────────────────────────────────────────
     Resolve the selected music to a fetchable URL or File
     ───────────────────────────────────────────────────── */
  const getMusicSource = (): { type: "url"; url: string } | { type: "file"; file: File } | null => {
    if (overlayMusic.startsWith("library:")) {
      const parts = overlayMusic.split(":");
      const url = parts.slice(2).join(":");   // URL may contain colons
      if (url) return { type: "url", url };
    }
    if (overlayMusic === "custom" && customAudioFile) {
      return { type: "file", file: customAudioFile };
    }
    return null;
  };

  // Video Export with ffmpeg.wasm — now with optional music mixing
  const handleVideoExport = async () => {
    if (checkPaywall()) return;
    if (!selectedVideo?.url || !previewRef.current) { alert("Please select a video first."); return; }

    setVideoExporting(true);
    setVideoExportProgress(0);
    setVideoExportStatus("Loading video encoder...");

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
      ffmpeg.on("progress", ({ progress: p }) => {
        setVideoExportProgress(Math.min(Math.round(p * 100), 99));
      });

      setVideoExportStatus("Loading encoder core...");
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      // 1. Fetch the source video
      setVideoExportStatus("Downloading source video...");
      setVideoExportProgress(5);
      const videoData = await fetchFile(selectedVideo.url);
      await ffmpeg.writeFile("input.mp4", videoData);

      // 2. Fetch / write the music file if a track was selected
      const musicSource = getMusicSource();
      let hasMusic = false;

      if (musicSource) {
        setVideoExportStatus("Loading music track...");
        setVideoExportProgress(8);
        if (musicSource.type === "url") {
          const musicData = await fetchFile(musicSource.url);
          await ffmpeg.writeFile("music.mp3", musicData);
          hasMusic = true;
        } else {
          const buf = new Uint8Array(await musicSource.file.arrayBuffer());
          await ffmpeg.writeFile("music.mp3", buf);
          hasMusic = true;
        }
      }

      // 3. Render the overlay as a PNG using html2canvas
      setVideoExportStatus("Rendering overlay...");
      setVideoExportProgress(10);
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement;
      if (!el) throw new Error("Export target not found");

      // Hide the video element temporarily so we only capture the overlay
      const videoEls = el.querySelectorAll("video");
      videoEls.forEach(v => { (v as HTMLElement).style.opacity = "0"; });
      const placeholders = el.querySelectorAll("[data-video-area]");
      placeholders.forEach(p => { (p as HTMLElement).style.opacity = "0"; });

      const { restore } = prepareForExport(el);
      const overlayCanvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, width: rawW, height: rawH });
      restore();

      // Restore video visibility
      videoEls.forEach(v => { (v as HTMLElement).style.opacity = "1"; });
      placeholders.forEach(p => { (p as HTMLElement).style.opacity = "1"; });

      const overlayBlob = await new Promise<Blob>((resolve) => {
        overlayCanvas.toBlob((b) => resolve(b!), "image/png");
      });
      const overlayData = new Uint8Array(await overlayBlob.arrayBuffer());
      await ffmpeg.writeFile("overlay.png", overlayData);

      // 4. Composite: overlay on video, limit 45s, optionally mix music
      setVideoExportStatus(hasMusic ? "Compositing video with overlay & music..." : "Compositing video with overlay...");
      setVideoExportProgress(15);

      const outW = currentSize.width;
      const outH = currentSize.height;

      if (hasMusic) {
        // Mix music (louder) with original audio (ducked), composite overlay
        await ffmpeg.exec([
          "-i", "input.mp4",
          "-i", "overlay.png",
          "-i", "music.mp3",
          "-t", "45",
          "-filter_complex",
          [
            `[0:v]scale=${outW}:${outH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:black[bg]`,
            `[bg][1:v]overlay=0:0[vout]`,
            `[0:a]volume=0.3[orig]`,
            `[2:a]volume=0.85,atrim=0:45,apad[mus]`,
            `[orig][mus]amix=inputs=2:duration=shortest[aout]`,
          ].join(";"),
          "-map", "[vout]",
          "-map", "[aout]",
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-y", "output.mp4",
        ]);
      } else {
        // No music — original behavior
        await ffmpeg.exec([
          "-i", "input.mp4",
          "-i", "overlay.png",
          "-t", "45",
          "-filter_complex", `[0:v]scale=${outW}:${outH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:black[bg];[bg][1:v]overlay=0:0`,
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-y", "output.mp4",
        ]);
      }

      // 5. Read the output
      setVideoExportStatus("Finalizing...");
      setVideoExportProgress(95);
      const outputData = await ffmpeg.readFile("output.mp4");
      const outputBlob = new Blob([outputData], { type: "video/mp4" });

      // 6. Download locally
      const downloadUrl = URL.createObjectURL(outputBlob);
      const link = document.createElement("a");
      link.download = `p2v-video-overlay-${Date.now()}.mp4`;
      link.href = downloadUrl;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      // 7. Upload to Cloudinary and save to My Videos
      setVideoExportStatus("Saving to My Videos...");
      setVideoExportProgress(98);
      const uploadedUrl = await uploadToCloudinary(new File([outputBlob], "overlay-video.mp4", { type: "video/mp4" }), "design-studio/videos");

      if (uploadedUrl && user) {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        await supabase.from("orders").update({
          overlay_video_url: uploadedUrl,
        }).eq("order_id", selectedVideo.orderId);
      }

      setVideoExportProgress(100);
      setVideoExportStatus("Done!");
      await incrementExportCounter();

      setTimeout(() => { setVideoExporting(false); }, 1500);
    } catch (err: any) {
      console.error("Video export error:", err);
      alert("Video export failed: " + (err.message || "Unknown error"));
      setVideoExporting(false);
    }
  };

  const badge = getBadgeConfig(selectedTemplate);

  // Video element for preview
  const videoPreviewElement = selectedVideo ? (
    <div className="w-full h-full relative" data-video-area>
      <video
        ref={videoRef}
        src={selectedVideo.url}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
      />
    </div>
  ) : undefined;

  /* ═══════════════════════════════════════════════════════
     AUTH GATES
     ═══════════════════════════════════════════════════════ */

  if (authLoading) {
    return (<div className="min-h-screen bg-background"><Navigation /><div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></div>);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background"><Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="bg-card rounded-2xl border border-border p-10 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center"><LogIn className="h-8 w-8 text-muted-foreground" /></div>
            <h1 className="text-2xl font-extrabold text-foreground">Sign In to Use the Design Studio</h1>
            <p className="text-muted-foreground max-w-md mx-auto">Create a free account to try the Marketing Design Studio. Your first 3 exports are free — no subscription required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base"><Link href="/login?redirect=/dashboard/lens/design-studio"><LogIn className="mr-2 h-4 w-4" />Sign In</Link></Button>
              <Button asChild variant="outline" className="px-8 py-6 text-base"><Link href="/lens">Learn About P2V Lens</Link></Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paywallHit) {
    return (
      <div className="min-h-screen bg-background"><Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="bg-card rounded-2xl border border-border p-10 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center"><Lock className="h-8 w-8 text-accent" /></div>
            <h1 className="text-2xl font-extrabold text-foreground">You&apos;ve Used Your 3 Free Exports</h1>
            <p className="text-muted-foreground max-w-md mx-auto">Subscribe to P2V Lens for unlimited design exports, plus AI photo coaching, listing descriptions, virtual staging, and more — starting at $27.95/month.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base"><Link href="/lens"><Sparkles className="mr-2 h-4 w-4" />Subscribe to P2V Lens</Link></Button>
              <Button variant="outline" className="px-8 py-6 text-base" onClick={() => setPaywallHit(false)}>Back to Design Studio</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Video export progress modal */}
      {videoExporting && <VideoExportModal progress={videoExportProgress} status={videoExportStatus} onCancel={() => setVideoExporting(false)} />}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/lens" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Marketing Design Studio</h1>
            <p className="text-muted-foreground mt-1">Create listing graphics, yard signs, property sheets, and branding cards</p>
          </div>
        </div>

        {/* Subscription badge */}
        {isAdmin ? (
          <div className="bg-green-100 border border-green-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3"><Sparkles className="h-5 w-5 text-green-600 flex-shrink-0" /><p className="text-sm text-green-800 font-semibold">Admin — Unlimited Access</p></div>
        ) : isSubscriber ? (
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3"><Sparkles className="h-5 w-5 text-cyan-600 flex-shrink-0" /><p className="text-sm text-foreground"><span className="font-bold text-cyan-700">P2V Lens Subscriber</span> — Unlimited exports</p></div>
        ) : (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3"><Sparkles className="h-5 w-5 text-accent flex-shrink-0" /><p className="text-sm text-foreground"><span className="font-bold">Free trial:</span> {FREE_EXPORT_LIMIT - freeExportsUsed} of {FREE_EXPORT_LIMIT} exports remaining.</p></div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {([
            { id: "templates" as StudioTab, label: "Listing Graphics", icon: PenTool },
            { id: "branding-card" as StudioTab, label: "Branding Card", icon: CreditCard },
            { id: "yard-sign" as StudioTab, label: "Yard Sign", icon: MapPin },
            { id: "property-pdf" as StudioTab, label: "Property Sheet", icon: FileText },
          ]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${tab === t.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            TAB: LISTING GRAPHICS
            ═══════════════════════════════════════════ */}
        {tab === "templates" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {TEMPLATES.map((t) => (<button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`flex items-center gap-3 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}><t.icon className="h-5 w-5 flex-shrink-0" />{t.label}</button>))}
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Upload */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Upload className="h-4 w-4 text-accent" />Upload Media</h3>
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => { setMediaMode("image"); setSelectedVideo(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mediaMode === "image" ? "bg-primary/10 border-2 border-primary text-foreground" : "border-2 border-border text-muted-foreground hover:border-primary/40"}`}><ImageIcon className="h-4 w-4" />Image</button>
                    <button onClick={() => { setMediaMode("video"); setListingPhoto(null); loadUserVideos(); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mediaMode === "video" ? "bg-primary/10 border-2 border-primary text-foreground" : "border-2 border-border text-muted-foreground hover:border-primary/40"}`}><Play className="h-4 w-4" />Video Overlay</button>
                  </div>
                  {mediaMode === "video" && (
                    <p className="text-xs text-amber-600 font-medium mb-3 flex items-center gap-1">* Video overlay exports are limited to 45 seconds max</p>
                  )}
                  {mediaMode === "image" ? (
                    <div className="grid grid-cols-3 gap-4">
                      <ImageUploadBox label="Listing Photo *" imageUrl={listingPhoto} onUpload={(f) => handleUpload(f, "design-studio", setListingPhoto, setUploadingListing)} onClear={() => setListingPhoto(null)} uploading={uploadingListing} />
                      <div>
                        <ImageUploadBox label="Headshot" imageUrl={headshot} onUpload={(f) => handleHeadshotUpload(f, setHeadshot, setUploadingHeadshot)} onClear={() => setHeadshot(null)} uploading={uploadingHeadshot} />
                        {!headshot && savedHeadshot && <button onClick={() => { setHeadshot(savedHeadshot); setBrandHeadshot(savedHeadshot); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved headshot</button>}
                      </div>
                      <div>
                        <ImageUploadBox label="Logo" imageUrl={logo} onUpload={(f) => handleLogoUpload(f, setLogo, setUploadingLogo)} onClear={() => setLogo(null)} uploading={uploadingLogo} hint="Optional" />
                        {!logo && savedLogo && <button onClick={() => { setLogo(savedLogo); setBrandLogo(savedLogo); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved logo</button>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Select an unbranded video from your orders.</p>
                      {loadingVideos ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : userVideos.length === 0 ? <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border"><p className="text-sm text-muted-foreground">No completed videos found.</p></div> : (
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {userVideos.map((v) => (<button key={v.orderId} onClick={() => { setSelectedVideo(v); if (v.thumbnail) setListingPhoto(v.thumbnail); }} className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${selectedVideo?.orderId === v.orderId ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}>{v.thumbnail ? <img src={v.thumbnail} alt="" className="w-full aspect-video object-cover" /> : <div className="w-full aspect-video bg-muted flex items-center justify-center"><Play className="h-8 w-8 text-muted-foreground" /></div>}<div className="p-2"><p className="text-xs font-semibold truncate">Order {v.orderId?.slice(0, 8)}</p><p className="text-[11px] text-muted-foreground">{v.date}</p></div>{selectedVideo?.orderId === v.orderId && <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center"><CheckCircle className="h-4 w-4 text-white" /></div>}</button>))}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <ImageUploadBox label="Headshot" imageUrl={headshot} onUpload={(f) => handleHeadshotUpload(f, setHeadshot, setUploadingHeadshot)} onClear={() => setHeadshot(null)} uploading={uploadingHeadshot} />
                          {!headshot && savedHeadshot && <button onClick={() => { setHeadshot(savedHeadshot); setBrandHeadshot(savedHeadshot); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved headshot</button>}
                        </div>
                        <div>
                          <ImageUploadBox label="Logo" imageUrl={logo} onUpload={(f) => handleLogoUpload(f, setLogo, setUploadingLogo)} onClear={() => setLogo(null)} uploading={uploadingLogo} hint="Optional" />
                          {!logo && savedLogo && <button onClick={() => { setLogo(savedLogo); setBrandLogo(savedLogo); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved logo</button>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Compact Music Selector — only visible in Video Overlay mode ── */}
                {mediaMode === "video" && (
                  <CompactMusicSelector
                    selectedTrack={overlayMusic}
                    onSelect={setOverlayMusic}
                    customAudioFile={customAudioFile}
                    onCustomAudioChange={setCustomAudioFile}
                  />
                )}

                {/* Property Details */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />Property Details</h3>
                  <div className="grid gap-4">
                    <div className="space-y-1.5"><Label className="text-sm">Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street, Anytown" /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label className="text-sm">Beds</Label><Input value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" /></div>
                      <div className="space-y-1.5"><Label className="text-sm">Baths</Label><Input value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" /></div>
                      <div className="space-y-1.5"><Label className="text-sm">Sq Ft</Label><Input value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1,800" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-sm">Price</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="450,000" /></div>
                    {selectedTemplate === "open-house" && <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-sm">Date</Label><Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Saturday, March 22" /></div><div className="space-y-1.5"><Label className="text-sm">Time</Label><Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="1:00 PM – 4:00 PM" /></div></div>}
                  </div>
                </div>
                {/* Agent Info */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><User className="h-4 w-4 text-accent" />Agent Info</h3>
                  <div className="grid gap-4">
                    <div className="space-y-1.5"><Label className="text-sm">Agent Name</Label><Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Jane Smith" /></div>
                    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-sm">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" /></div><div className="space-y-1.5"><Label className="text-sm">Brokerage</Label><Input value={brokerage} onChange={(e) => setBrokerage(e.target.value)} placeholder="Keller Williams" /></div></div>
                  </div>
                </div>
                {/* Appearance */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Palette className="h-4 w-4 text-accent" />Appearance</h3>
                  <Label className="text-sm font-semibold mb-2 block">Font Style</Label>
                  <div className="grid grid-cols-2 gap-2 mb-5">{FONT_OPTIONS.map((f) => (<button key={f.id} onClick={() => setListingFont(f.id)} className={`p-3 rounded-xl border-2 text-left transition-all ${listingFont === f.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-semibold">{f.label}</p><p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: f.family }}>Aa Bb Cc 123</p></button>))}</div>
                  <Label className="text-sm font-semibold mb-2 block">Info Bar Color</Label>
                  <div className="flex items-center gap-3 mb-2"><input type="color" value={listingBarColor} onChange={(e) => setListingBarColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={listingBarColor} onChange={(e) => setListingBarColor(e.target.value)} className="w-28 font-mono text-sm" /></div>
                  <BrokerageSwatches currentColor={listingBarColor} onSelect={setListingBarColor} />
                  <Label className="text-sm font-semibold mb-2 block mt-5">Accent Color <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="flex items-center gap-3"><input type="color" value={listingAccentColor || "#ffffff"} onChange={(e) => setListingAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={listingAccentColor} onChange={(e) => setListingAccentColor(e.target.value)} placeholder="None" className="w-28 font-mono text-sm" />{listingAccentColor && <button onClick={() => setListingAccentColor("")} className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>}</div>
                  <div className="mt-2"><AccentSwatches currentColor={listingAccentColor} onSelect={setListingAccentColor} /></div>
                </div>
              </div>
              {/* Preview */}
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                  <h3 className="font-bold text-foreground mb-4">Live Preview</h3>
                  <div ref={previewRef} className="bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center" style={{ width: "100%", height: previewH + 24, padding: 12 }}>
                    <div style={{ width: previewW, height: previewH, overflow: "hidden" }}>
                      <div data-export-target="true" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: rawW, height: rawH }}>
                        {selectedTemplate === "open-house" ? (
                          <OpenHouseTemplate size={currentSize} listingPhoto={mediaMode === "video" ? null : listingPhoto} videoElement={mediaMode === "video" ? videoPreviewElement : undefined} headshot={headshot} logo={logo} address={address} beds={beds} baths={baths} sqft={sqft} price={price} date={date} time={time} agentName={agentName} phone={phone} brokerage={brokerage} fontFamily={listingFontFamily} barColor={listingBarColor} accentColor={listingAccentColor} />
                        ) : (
                          <InfoBarTemplate size={currentSize} listingPhoto={mediaMode === "video" ? null : listingPhoto} videoElement={mediaMode === "video" ? videoPreviewElement : undefined} headshot={headshot} logo={logo} address={address} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} badgeText={badge.text} badgeColor={badge.color} fontFamily={listingFontFamily} barColor={listingBarColor} accentColor={listingAccentColor} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5"><Label className="text-sm font-semibold mb-2 block">Output Size</Label><div className="grid grid-cols-3 gap-2">{SIZES.map((s) => (<button key={s.id} onClick={() => setSelectedSize(s.id)} className={`p-3 rounded-xl border-2 text-center transition-all ${selectedSize === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-semibold">{s.label}</p><p className="text-[11px] text-muted-foreground">{s.sublabel}</p></button>))}</div></div>
                  {mediaMode === "video" && selectedVideo ? (
                    <div className="mt-5 space-y-3">
                      {/* Music indicator in export area */}
                      {overlayMusic && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                          <Music className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <p className="text-xs text-primary font-medium truncate">
                            Music will be mixed into export
                          </p>
                        </div>
                      )}
                      <Button onClick={handleVideoExport} disabled={exporting || videoExporting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg">
                        {videoExporting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Exporting Video...</> : <><Film className="mr-2 h-5 w-5" />Export as Video (MP4)</>}
                      </Button>
                      <Button onClick={handleExport} disabled={exporting} variant="outline" className="w-full py-4">
                        <Download className="mr-2 h-4 w-4" />Download Thumbnail (PNG)
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleExport} disabled={exporting} className="w-full mt-5 bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg">{exporting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Exporting...</> : <><Download className="mr-2 h-5 w-5" />Download PNG</>}</Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════
            TAB: YARD SIGN
            ═══════════════════════════════════════════ */}
        {tab === "yard-sign" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Choose a Design</h3>
                <div className="grid grid-cols-3 gap-3">{YARD_SIGN_DESIGNS.map((d) => (<button key={d.id} onClick={() => setYardDesign(d.id)} className={`p-4 rounded-xl border-2 text-center transition-all ${yardDesign === d.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-bold">{d.label}</p><p className="text-[11px] text-muted-foreground mt-1">{d.description}</p></button>))}</div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Upload className="h-4 w-4 text-accent" />Upload Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><ImageUploadBox label="Headshot" imageUrl={headshot} onUpload={(f) => handleHeadshotUpload(f, setHeadshot, setUploadingHeadshot)} onClear={() => setHeadshot(null)} uploading={uploadingHeadshot} />{!headshot && savedHeadshot && <button onClick={() => { setHeadshot(savedHeadshot); setBrandHeadshot(savedHeadshot); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved headshot</button>}</div>
                  <div><ImageUploadBox label="Logo" imageUrl={logo} onUpload={(f) => handleLogoUpload(f, setLogo, setUploadingLogo)} onClear={() => setLogo(null)} uploading={uploadingLogo} hint="Optional" />{!logo && savedLogo && <button onClick={() => { setLogo(savedLogo); setBrandLogo(savedLogo); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved logo</button>}</div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><User className="h-4 w-4 text-accent" />Sign Details</h3>
                <div className="grid gap-4">
                  <div className="space-y-1.5"><Label className="text-sm">Header Text</Label><Input value={yardHeaderText} onChange={(e) => setYardHeaderText(e.target.value)} placeholder="FOR SALE" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">Agent Name</Label><Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Jane Smith" /></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-sm">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" /></div><div className="space-y-1.5"><Label className="text-sm">Email</Label><Input value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} placeholder="jane@email.com" /></div></div>
                  <div className="space-y-1.5"><Label className="text-sm">Brokerage</Label><Input value={brokerage} onChange={(e) => setBrokerage(e.target.value)} placeholder="Coldwell Banker" /></div>
                  {yardDesign === "split-bar" && <><div className="space-y-1.5"><Label className="text-sm">Office Name</Label><Input value={yardOfficeName} onChange={(e) => setYardOfficeName(e.target.value)} placeholder="Main Street Office" /></div><div className="space-y-1.5"><Label className="text-sm">Office Phone</Label><Input value={yardOfficePhone} onChange={(e) => setYardOfficePhone(e.target.value)} placeholder="800-555-4321" /></div></>}
                  {yardDesign === "sidebar" && <div className="space-y-1.5"><Label className="text-sm">Website</Label><Input value={yardWebsite} onChange={(e) => setYardWebsite(e.target.value)} placeholder="www.janesmith.com" /></div>}
                  <div className="space-y-1.5"><Label className="text-sm">QR Code URL <span className="text-muted-foreground font-normal">(optional)</span></Label><Input value={yardQrUrl} onChange={(e) => setYardQrUrl(e.target.value)} placeholder="https://janesmith.com" /></div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Palette className="h-4 w-4 text-accent" />Colors</h3>
                {yardDesign === "split-bar" && <><Label className="text-sm font-semibold mb-2 block">Top Bar Color</Label><div className="flex items-center gap-3 mb-2"><input type="color" value={yardTopColor} onChange={(e) => setYardTopColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={yardTopColor} onChange={(e) => setYardTopColor(e.target.value)} className="w-28 font-mono text-sm" /></div><BrokerageSwatches currentColor={yardTopColor} onSelect={setYardTopColor} /><Label className="text-sm font-semibold mb-2 block mt-4">Bottom Bar Color</Label><div className="flex items-center gap-3 mb-2"><input type="color" value={yardBottomColor} onChange={(e) => setYardBottomColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={yardBottomColor} onChange={(e) => setYardBottomColor(e.target.value)} className="w-28 font-mono text-sm" /></div><BrokerageSwatches currentColor={yardBottomColor} onSelect={setYardBottomColor} /></>}
                {yardDesign === "sidebar" && <><Label className="text-sm font-semibold mb-2 block">Sidebar Color</Label><div className="flex items-center gap-3 mb-2"><input type="color" value={yardSidebarColor} onChange={(e) => setYardSidebarColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={yardSidebarColor} onChange={(e) => setYardSidebarColor(e.target.value)} className="w-28 font-mono text-sm" /></div><BrokerageSwatches currentColor={yardSidebarColor} onSelect={setYardSidebarColor} /><Label className="text-sm font-semibold mb-2 block mt-4">Main Background</Label><div className="flex items-center gap-3 mb-2"><input type="color" value={yardMainBgColor} onChange={(e) => setYardMainBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={yardMainBgColor} onChange={(e) => setYardMainBgColor(e.target.value)} className="w-28 font-mono text-sm" /></div><BrokerageSwatches currentColor={yardMainBgColor} onSelect={setYardMainBgColor} /></>}
                {yardDesign === "top-heavy" && <><Label className="text-sm font-semibold mb-2 block">Top Section Color</Label><div className="flex items-center gap-3 mb-2"><input type="color" value={yardTopColor} onChange={(e) => setYardTopColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={yardTopColor} onChange={(e) => setYardTopColor(e.target.value)} className="w-28 font-mono text-sm" /></div><BrokerageSwatches currentColor={yardTopColor} onSelect={setYardTopColor} /><Label className="text-sm font-semibold mb-2 block mt-4">Bottom Section Color</Label><div className="flex items-center gap-3 mb-2"><input type="color" value={yardBottomColor} onChange={(e) => setYardBottomColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={yardBottomColor} onChange={(e) => setYardBottomColor(e.target.value)} className="w-28 font-mono text-sm" /></div><BrokerageSwatches currentColor={yardBottomColor} onSelect={setYardBottomColor} /></>}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <h3 className="font-bold text-foreground mb-4">Live Preview</h3>
                <div ref={previewRef} className="bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center" style={{ width: "100%", height: previewH + 24, padding: 12 }}>
                  <div style={{ width: previewW, height: previewH, overflow: "hidden" }}>
                    <div data-export-target="true" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: rawW, height: rawH }}>
                      {yardDesign === "split-bar" && <YardSignSplitBar width={currentYardSize.width} height={currentYardSize.height} headshot={headshot} logo={logo} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} officeName={yardOfficeName} officePhone={yardOfficePhone} headerText={yardHeaderText} topColor={yardTopColor} bottomColor={yardBottomColor} fontFamily={listingFontFamily} qrDataUrl={yardQrDataUrl} />}
                      {yardDesign === "sidebar" && <YardSignSidebar width={currentYardSize.width} height={currentYardSize.height} headshot={headshot} logo={logo} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} website={yardWebsite} headerText={yardHeaderText} sidebarColor={yardSidebarColor} mainBgColor={yardMainBgColor} fontFamily={listingFontFamily} qrDataUrl={yardQrDataUrl} />}
                      {yardDesign === "top-heavy" && <YardSignTopHeavy width={currentYardSize.width} height={currentYardSize.height} headshot={headshot} logo={logo} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} headerText={yardHeaderText} topColor={yardTopColor} bottomColor={yardBottomColor} fontFamily={listingFontFamily} qrDataUrl={yardQrDataUrl} />}
                    </div>
                  </div>
                </div>
                <div className="mt-5"><Label className="text-sm font-semibold mb-2 block">Sign Size</Label><div className="grid grid-cols-2 gap-2">{YARD_SIGN_SIZES.map((s) => (<button key={s.id} onClick={() => setYardSignSize(s.id)} className={`p-3 rounded-xl border-2 text-center transition-all ${yardSignSize === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-semibold">{s.label}</p><p className="text-[11px] text-muted-foreground">{s.sublabel}</p></button>))}</div></div>
                <Button onClick={handleExport} disabled={exporting} className="w-full mt-5 bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg">{exporting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating...</> : <><Download className="mr-2 h-5 w-5" />Download PNG</>}</Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: PROPERTY SHEET
            ═══════════════════════════════════════════ */}
        {tab === "property-pdf" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />Property Details</h3>
                <div className="grid gap-4">
                  <div className="space-y-1.5"><Label className="text-sm">Address</Label><Input value={pdfAddress} onChange={(e) => setPdfAddress(e.target.value)} placeholder="Torres 34" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">City, State, Zip</Label><Input value={pdfCityStateZip} onChange={(e) => setPdfCityStateZip(e.target.value)} placeholder="Playas Del Coco, Guanacaste" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-sm">Price</Label><Input value={pdfPrice} onChange={(e) => setPdfPrice(e.target.value)} placeholder="129,000" /></div>
                    <div className="grid grid-cols-3 gap-2"><div className="space-y-1.5"><Label className="text-sm">Beds</Label><Input value={pdfBeds} onChange={(e) => setPdfBeds(e.target.value)} placeholder="1" /></div><div className="space-y-1.5"><Label className="text-sm">Baths</Label><Input value={pdfBaths} onChange={(e) => setPdfBaths(e.target.value)} placeholder="1" /></div><div className="space-y-1.5"><Label className="text-sm">Sq Ft</Label><Input value={pdfSqft} onChange={(e) => setPdfSqft(e.target.value)} placeholder="750" /></div></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-sm">Key Features (one per line)</Label><textarea value={pdfFeatures} onChange={(e) => setPdfFeatures(e.target.value)} placeholder={"1 bedroom with built-in closets\n1 bathroom\nBright and inviting interiors"} rows={6} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">Description <span className="text-muted-foreground font-normal">(optional)</span></Label><textarea value={pdfDescription} onChange={(e) => setPdfDescription(e.target.value)} placeholder="Investment opportunity details..." rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><ImageIcon className="h-4 w-4 text-accent" />Photos ({pdfPhotos.length}/25)</h3>
                <p className="text-xs text-muted-foreground mb-4">First 3 photos appear on page 1. Remaining fill grids on additional pages.</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-4">
                  {pdfPhotos.map((url, i) => (<div key={i} className="relative group rounded-lg overflow-hidden border border-border aspect-square"><img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" /><div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{i < 3 ? `★ ${i + 1}` : i + 1}</div><button onClick={() => setPdfPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button></div>))}
                  {pdfPhotos.length < 25 && (<label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">{uploadingPdfPhoto ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5" /><span className="text-[10px] font-medium">Add</span></>}<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(f => handlePdfPhotoUpload(f)); e.target.value = ""; }} /></label>)}
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Palette className="h-4 w-4 text-accent" />Accent Color</h3>
                <div className="flex items-center gap-3 mb-2"><input type="color" value={pdfAccentColor} onChange={(e) => setPdfAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={pdfAccentColor} onChange={(e) => setPdfAccentColor(e.target.value)} className="w-28 font-mono text-sm" /></div>
                <AccentSwatches currentColor={pdfAccentColor} onSelect={setPdfAccentColor} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <h3 className="font-bold text-foreground mb-4">Live Preview</h3>
                <div ref={previewRef} className="bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center" style={{ width: "100%", height: previewH + 24, padding: 12 }}>
                  <div style={{ width: previewW, height: previewH, overflow: "hidden" }}>
                    <div data-export-target="true" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 2550, height: 3300 }}>
                      <PropertyPdfPage pageNumber={pdfPreviewPage} address={pdfAddress} cityStateZip={pdfCityStateZip} price={pdfPrice} beds={pdfBeds} baths={pdfBaths} sqft={pdfSqft} description={pdfDescription} features={pdfFeatures} photos={pdfPhotos} accentColor={pdfAccentColor} fontFamily={listingFontFamily} />
                    </div>
                  </div>
                </div>
                {pdfTotalPages > 1 && (<div className="flex items-center justify-center gap-3 mt-3"><button onClick={() => setPdfPreviewPage(Math.max(0, pdfPreviewPage - 1))} disabled={pdfPreviewPage === 0} className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4" /></button><span className="text-sm font-semibold">Page {pdfPreviewPage + 1} of {pdfTotalPages}</span><button onClick={() => setPdfPreviewPage(Math.min(pdfTotalPages - 1, pdfPreviewPage + 1))} disabled={pdfPreviewPage >= pdfTotalPages - 1} className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4" /></button></div>)}
                <div className="mt-5 space-y-3">
                  <Button onClick={handlePdfExport} disabled={exporting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg">{exporting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating PDF...</> : <><Download className="mr-2 h-5 w-5" />Download PDF</>}</Button>
                  <Button onClick={handleExport} disabled={exporting} variant="outline" className="w-full py-4"><Download className="mr-2 h-4 w-4" />Download Current Page as PNG</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: BRANDING CARD
            ═══════════════════════════════════════════ */}
        {tab === "branding-card" && (
          <>
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-8"><p className="text-sm text-cyan-800"><strong>Tip:</strong> Create your branding card here, download as PNG, then upload it in the order form under &ldquo;Custom branding cards.&rdquo; The PNG exports with a transparent background.</p></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Upload className="h-4 w-4 text-accent" />Upload Images</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div><ImageUploadBox label="Headshot" imageUrl={brandHeadshot} onUpload={(f) => handleHeadshotUpload(f, setBrandHeadshot, setUploadingBrandHeadshot)} onClear={() => setBrandHeadshot(null)} uploading={uploadingBrandHeadshot} />{!brandHeadshot && savedHeadshot && <button onClick={() => { setBrandHeadshot(savedHeadshot); setHeadshot(savedHeadshot); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved headshot</button>}</div>
                    <div><ImageUploadBox label="Logo" imageUrl={brandLogo} onUpload={(f) => handleLogoUpload(f, setBrandLogo, setUploadingBrandLogo)} onClear={() => setBrandLogo(null)} uploading={uploadingBrandLogo} />{!brandLogo && savedLogo && <button onClick={() => { setBrandLogo(savedLogo); setLogo(savedLogo); }} className="text-xs text-accent hover:text-accent/80 font-semibold mt-1">Use saved logo</button>}</div>
                    <ImageUploadBox label="Background Photo" imageUrl={brandBgPhoto} onUpload={(f) => handleUpload(f, "design-studio", setBrandBgPhoto, setUploadingBrandBg)} onClear={() => setBrandBgPhoto(null)} uploading={uploadingBrandBg} hint="Optional — overrides color" />
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><User className="h-4 w-4 text-accent" />Card Details</h3>
                  <p className="text-xs text-muted-foreground mb-4">All fields are optional.</p>
                  <div className="grid gap-4">
                    <div className="space-y-1.5"><Label className="text-sm">Agent Name</Label><Input value={brandAgentName} onChange={(e) => setBrandAgentName(e.target.value)} placeholder="Jane Smith" /></div>
                    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-sm">Phone</Label><Input value={brandPhone} onChange={(e) => setBrandPhone(e.target.value)} placeholder="(555) 123-4567" /></div><div className="space-y-1.5"><Label className="text-sm">Email</Label><Input value={brandEmail} onChange={(e) => setBrandEmail(e.target.value)} placeholder="jane@email.com" /></div></div>
                    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-sm">Brokerage</Label><Input value={brandBrokerage} onChange={(e) => setBrandBrokerage(e.target.value)} placeholder="Keller Williams" /></div><div className="space-y-1.5"><Label className="text-sm">Tagline</Label><Input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} placeholder="Your Home, Your Future" /></div></div>
                    <div className="h-[1px] bg-border my-1" />
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Property Info (optional)</p>
                    <div className="space-y-1.5"><Label className="text-sm">Address</Label><Input value={brandAddress} onChange={(e) => setBrandAddress(e.target.value)} placeholder="21 N William St" /></div>
                    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-sm">City, State</Label><Input value={brandCityState} onChange={(e) => setBrandCityState(e.target.value)} placeholder="Pearl River, NY" /></div><div className="space-y-1.5"><Label className="text-sm">Price</Label><Input value={brandPrice} onChange={(e) => setBrandPrice(e.target.value)} placeholder="4250/mo" /></div></div>
                    <div className="space-y-1.5"><Label className="text-sm">Features (one per line)</Label><textarea value={brandFeatures} onChange={(e) => setBrandFeatures(e.target.value)} placeholder={"Downtown location\n6 office spaces"} rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Palette className="h-4 w-4 text-accent" />Appearance</h3>
                  <Label className="text-sm font-semibold mb-2 block">Font Style</Label>
                  <div className="grid grid-cols-2 gap-2 mb-5">{FONT_OPTIONS.map((f) => (<button key={f.id} onClick={() => setBrandFont(f.id)} className={`p-3 rounded-xl border-2 text-left transition-all ${brandFont === f.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-semibold">{f.label}</p><p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: f.family }}>Aa Bb Cc 123</p></button>))}</div>
                  <Label className="text-sm font-semibold mb-2 block">Background Color</Label>
                  <div className="flex items-center gap-4 mb-3"><input type="color" value={brandBgColor} onChange={(e) => setBrandBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={brandBgColor} onChange={(e) => setBrandBgColor(e.target.value)} className="w-28 font-mono text-sm" /></div>
                  <BrokerageSwatches currentColor={brandBgColor} onSelect={setBrandBgColor} />
                  <div className="mt-5">
                    <Label className="text-sm font-semibold mb-2 block">Accent Color <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="flex items-center gap-3"><input type="color" value={brandAccentColor || "#ffffff"} onChange={(e) => setBrandAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" /><Input value={brandAccentColor} onChange={(e) => setBrandAccentColor(e.target.value)} placeholder="None" className="w-28 font-mono text-sm" />{brandAccentColor && <button onClick={() => setBrandAccentColor("")} className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>}</div>
                    <div className="mt-2"><AccentSwatches currentColor={brandAccentColor} onSelect={setBrandAccentColor} /></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                  <h3 className="font-bold text-foreground mb-4">Live Preview</h3>
                  <div ref={tab === "branding-card" ? previewRef : undefined} className="rounded-xl overflow-hidden flex items-center justify-center" style={{ width: "100%", height: previewH + 24, padding: 12, backgroundImage: "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px" }}>
                    <div style={{ width: previewW, height: previewH, overflow: "hidden" }}>
                      <div data-export-target="true" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: currentBrandOrientation.width, height: currentBrandOrientation.height }}>
                        <BrandingCardTemplate orientation={currentBrandOrientation} logo={brandLogo} headshot={brandHeadshot} agentName={brandAgentName} phone={brandPhone} email={brandEmail} brokerage={brandBrokerage} tagline={brandTagline} address={brandAddress} cityState={brandCityState} price={brandPrice} features={brandFeatures} bgColor={brandBgColor} accentColor={brandAccentColor} bgPhoto={brandBgPhoto} fontFamily={currentFontFamily} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5"><Label className="text-sm font-semibold mb-2 block">Orientation</Label><div className="grid grid-cols-2 gap-2">{BRANDING_ORIENTATIONS.map((o) => (<button key={o.id} onClick={() => setBrandOrientation(o.id)} className={`p-3 rounded-xl border-2 text-center transition-all ${brandOrientation === o.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}><p className="text-sm font-semibold">{o.label}</p><p className="text-[11px] text-muted-foreground">{o.sublabel}</p></button>))}</div></div>
                  <Button onClick={handleExport} disabled={exporting} className="w-full mt-5 bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg">{exporting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Exporting...</> : <><Download className="mr-2 h-5 w-5" />Download PNG</>}</Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard/lens" className="hover:text-foreground transition-colors">P2V Lens</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
