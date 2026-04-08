"use client";

import { useState, useRef, useCallback, useEffect, Suspense, type ReactNode } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronDown, Download, Upload, Image as ImageIcon, PenTool, Home, DollarSign,
  CheckCircle, X, Loader2, Palette, CreditCard, Phone, Mail, User, MapPin,
  Calendar, Play, FileText, Sparkles, Film, Music, Check, Type, Eye, Layers,
  ZoomIn, ZoomOut, LayoutTemplate, Settings, RotateCcw, Undo2, Redo2,
  ChevronLeft, ChevronRight, Paintbrush, LogIn, Lock, Share2, ArrowLeft, Save, Printer, Globe,
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
   TYPES
   ═══════════════════════════════════════════════════════ */
type SizeOption = "square" | "story" | "postcard";
type StudioTab = "templates" | "branding-card" | "yard-sign" | "property-pdf" | "video-remix" | "listing-flyer";
type YardSignDesign = "split-bar" | "sidebar" | "top-heavy";

// Listing flyer uses US Letter: 2550x3300 (same as property PDF at 300dpi)
const FLYER_W = 2550;
const FLYER_H = 3300;

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const TEMPLATES = [
  { id: "just-listed" as TemplateType, label: "Just Listed", icon: Home, color: "#10b981" },
  { id: "open-house" as TemplateType, label: "Open House", icon: Calendar, color: "#6366f1" },
  { id: "price-reduced" as TemplateType, label: "Price Reduced", icon: DollarSign, color: "#f59e0b" },
  { id: "just-sold" as TemplateType, label: "Just Sold", icon: CheckCircle, color: "#ef4444" },
];

const SIZES: SizeConfig[] = [
  { id: "square", label: "Square", sublabel: "1080×1080", width: 1080, height: 1080 },
  { id: "story", label: "Story", sublabel: "1080×1920", width: 1080, height: 1920 },
  { id: "postcard", label: "Postcard", sublabel: "1800×1200", width: 1800, height: 1200 },
];

const YARD_SIGN_SIZES = [
  { id: "18x24" as const, label: '18×24"', sublabel: "Standard", width: 5400, height: 7200 },
  { id: "24x36" as const, label: '24×36"', sublabel: "Large", width: 7200, height: 10800 },
];

const YARD_SIGN_DESIGNS: { id: YardSignDesign; label: string; desc: string }[] = [
  { id: "split-bar", label: "Split Bar", desc: "Top & bottom bars" },
  { id: "sidebar", label: "Sidebar", desc: "Vertical side accent" },
  { id: "top-heavy", label: "Top Heavy", desc: "Large header block" },
];

const BRANDING_ORIENTATIONS = [
  { id: "landscape" as const, label: "Landscape", sublabel: "1920×1080", width: 1920, height: 1080 },
  { id: "vertical" as const, label: "Vertical", sublabel: "1080×1920", width: 1080, height: 1920 },
];

const BROKERAGE_COLORS = [
  { hex: "#b40101", label: "KW Red" },{ hex: "#666666", label: "KW Gray" },{ hex: "#003399", label: "CB Blue" },{ hex: "#012169", label: "CB Navy" },{ hex: "#003da5", label: "RM Blue" },{ hex: "#dc1c2e", label: "RM Red" },{ hex: "#b5985a", label: "C21 Gold" },{ hex: "#1c1c1c", label: "C21 Black" },{ hex: "#000000", label: "CMP Black" },{ hex: "#333333", label: "CMP Dark" },{ hex: "#002349", label: "SIR Blue" },{ hex: "#1a1a1a", label: "SIR Black" },{ hex: "#552448", label: "BH Purple" },{ hex: "#2d1a33", label: "BH Dark" },{ hex: "#1c3f6e", label: "EXP Blue" },{ hex: "#006341", label: "HH Green" },{ hex: "#003d28", label: "HH Dk Green" },{ hex: "#4c8c2b", label: "BHG Green" },{ hex: "#d4272e", label: "EXT Red" },{ hex: "#e31937", label: "ERA Red" },{ hex: "#273691", label: "ERA Blue" },{ hex: "#a02021", label: "RF Red" },{ hex: "#ffffff", label: "White" },
];

const ACCENT_COLORS = ["#b8860b","#c41e3a","#1e40af","#0d6e4f","#6b21a8","#be185d","#0e7490","#c2410c","#8b6914","#71717a","#ffffff","#000000"];

const FONT_OPTIONS = [
  { id: "serif", label: "Classic Serif", family: "Georgia, 'Times New Roman', serif", sample: "Elegant Home" },
  { id: "sans", label: "Clean Sans", family: "'Helvetica Neue', Arial, sans-serif", sample: "Modern Living" },
  { id: "modern", label: "Modern", family: "'Trebuchet MS', 'Gill Sans', sans-serif", sample: "Fresh Start" },
  { id: "elegant", label: "Elegant", family: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", sample: "Luxury Estate" },
];

const TABS: { id: StudioTab; label: string; icon: any }[] = [
  { id: "templates", label: "Listing Graphics", icon: PenTool },
  { id: "video-remix", label: "Video Remix", icon: Film },
  { id: "listing-flyer", label: "Listing Flyer", icon: Printer },
  { id: "branding-card", label: "Branding", icon: CreditCard },
  { id: "yard-sign", label: "Yard Sign", icon: MapPin },
  { id: "property-pdf", label: "Property Sheet", icon: FileText },
];

const LEFT_PANELS: Record<string, { id: string; label: string; icon: any }[]> = {
  templates: [{ id: "templates", label: "Templates", icon: LayoutTemplate },{ id: "uploads", label: "Uploads", icon: Upload },{ id: "text", label: "Details", icon: Type },{ id: "styles", label: "Styles", icon: Palette }],
  "video-remix": [{ id: "uploads", label: "Media", icon: Upload },{ id: "text", label: "Details", icon: Type },{ id: "styles", label: "Styles", icon: Palette },{ id: "music", label: "Music", icon: Music }],
  "listing-flyer": [{ id: "photos", label: "Photos", icon: ImageIcon },{ id: "text", label: "Details", icon: Type },{ id: "links", label: "Links", icon: Globe },{ id: "styles", label: "Styles", icon: Palette }],
  "yard-sign": [{ id: "design", label: "Design", icon: LayoutTemplate },{ id: "uploads", label: "Uploads", icon: Upload },{ id: "text", label: "Details", icon: Type },{ id: "styles", label: "Colors", icon: Palette }],
  "branding-card": [{ id: "uploads", label: "Uploads", icon: Upload },{ id: "text", label: "Details", icon: Type },{ id: "styles", label: "Styles", icon: Palette }],
  "property-pdf": [{ id: "text", label: "Details", icon: Type },{ id: "photos", label: "Photos", icon: ImageIcon },{ id: "styles", label: "Styles", icon: Palette }],
};

const VIBE_FILTERS = [
  { key: "", label: "All", emoji: "🎵" },{ key: "upbeat_modern", label: "Upbeat", emoji: "🎶" },{ key: "chill_tropical", label: "Chill", emoji: "🌴" },
  { key: "energetic_pop", label: "Energetic", emoji: "⚡" },{ key: "elegant_classical", label: "Elegant", emoji: "🎹" },{ key: "warm_acoustic", label: "Acoustic", emoji: "🎸" },
  { key: "bold_cinematic", label: "Cinematic", emoji: "🎬" },{ key: "smooth_jazz", label: "Jazz", emoji: "🎺" },{ key: "ambient", label: "Ambient", emoji: "🌙" },
];

/* ═══════════════════════════════════════════════════════
   CLOUDINARY UPLOAD
   ═══════════════════════════════════════════════════════ */
async function uploadToCloudinary(file: File | Blob, folder: string): Promise<string | null> {
  try {
    const sigResponse = await fetch("/api/cloudinary-signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: `photo2video/${folder}` }) });
    const sigData = await sigResponse.json();
    if (!sigData.success) throw new Error("Signature failed");
    const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;
    const fd = new FormData();
    fd.append("file", file); fd.append("api_key", apiKey); fd.append("timestamp", timestamp.toString()); fd.append("signature", signature); fd.append("folder", folderPath); fd.append("resource_type", "auto");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: "POST", body: fd });
    const result = await res.json();
    return result.secure_url || null;
  } catch (error) { console.error("Cloudinary upload error:", error); return null; }
}

/* ═══════════════════════════════════════════════════════
   CSS — Dark Studio Shell
   ═══════════════════════════════════════════════════════ */
const STUDIO_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
  :root{--sb:#0c0c10;--ss:#151519;--ss2:#1c1c22;--sbr:rgba(255,255,255,0.06);--sa:#6366f1;--sag:rgba(99,102,241,0.15);--st:#e4e4ea;--std:rgba(255,255,255,0.4);--stm:rgba(255,255,255,0.2);--suc:#10b981;--sc:#09090d;--sf:'DM Sans',-apple-system,sans-serif;}
  .sr{font-family:var(--sf);background:var(--sb);color:var(--st);height:100vh;display:flex;flex-direction:column;overflow:hidden;-webkit-font-smoothing:antialiased;}
  .st{height:54px;background:var(--ss);border-bottom:1px solid var(--sbr);display:flex;align-items:center;padding:0 14px;gap:6px;flex-shrink:0;z-index:20;}
  .slg{display:flex;align-items:center;gap:9px;padding-right:18px;border-right:1px solid var(--sbr);margin-right:6px;}
  .slm{width:30px;height:30px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:8px;display:flex;align-items:center;justify-content:center;}
  .stb{display:flex;gap:1px;background:rgba(255,255,255,0.03);border-radius:9px;padding:3px;overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .stbi{padding:6px 14px;border-radius:7px;border:none;background:none;color:var(--std);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:5px;white-space:nowrap;font-family:var(--sf);}
  .stbi:hover{color:var(--st);background:rgba(255,255,255,0.04);}.stbi.ac{color:#fff;background:var(--sa);box-shadow:0 2px 8px rgba(99,102,241,0.3);}
  .ssp{flex:1;min-width:0;}.sac{display:flex;align-items:center;gap:6px;}
  .bi{width:34px;height:34px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;font-family:var(--sf);flex-shrink:0;}.bi:hover{background:rgba(255,255,255,0.05);color:var(--st);}
  .bx{padding:7px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,var(--sa),#7c3aed);color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all 0.2s;box-shadow:0 2px 12px rgba(99,102,241,0.3);font-family:var(--sf);flex-shrink:0;}.bx:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(99,102,241,0.4);}.bx:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
  .sb{flex:1;display:flex;overflow:hidden;}.slr{width:68px;background:var(--ss);border-right:1px solid var(--sbr);display:flex;flex-direction:column;align-items:center;padding:10px 0;gap:2px;flex-shrink:0;}
  .rb{width:54px;padding:9px 0;border-radius:9px;border:none;background:none;color:var(--std);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;font-family:var(--sf);}.rb span{font-size:9px;font-weight:600;}.rb:hover{background:rgba(255,255,255,0.04);color:var(--st);}.rb.ac{background:var(--sag);color:var(--sa);}
  .slp{width:310px;background:var(--ss);border-right:1px solid var(--sbr);overflow-y:auto;flex-shrink:0;}.slp::-webkit-scrollbar{width:4px;}.slp::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}
  .ph{padding:16px 20px 12px;font-size:14px;font-weight:800;letter-spacing:-0.02em;border-bottom:1px solid var(--sbr);display:flex;align-items:center;gap:7px;position:sticky;top:0;background:var(--ss);z-index:5;}
  .sc{flex:1;background:var(--sc);display:flex;flex-direction:column;position:relative;overflow:hidden;}
  .scb{position:absolute;inset:0;opacity:0.025;background-image:linear-gradient(45deg,#fff 25%,transparent 25%),linear-gradient(-45deg,#fff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#fff 75%),linear-gradient(-45deg,transparent 75%,#fff 75%);background-size:28px 28px;background-position:0 0,0 14px,14px -14px,-14px 0px;}
  .scc{flex:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;padding:16px;}
  .spf{border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.05),0 20px 60px rgba(0,0,0,0.5);transition:all 0.3s;}
  .sct{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--ss);border-radius:10px;border:1px solid var(--sbr);box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:10;flex-wrap:wrap;justify-content:center;}
  .zd{font-size:11px;font-weight:700;color:var(--std);min-width:40px;text-align:center;user-select:none;}.td{width:1px;height:18px;background:var(--sbr);margin:0 3px;}
  .sp{padding:4px 10px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:var(--sf);}.sp:hover{background:rgba(255,255,255,0.05);color:var(--st);}.sp.ac{background:var(--sa);color:#fff;border-color:var(--sa);}
  .srp{width:280px;background:var(--ss);border-left:1px solid var(--sbr);overflow-y:auto;flex-shrink:0;}.srp::-webkit-scrollbar{width:4px;}.srp::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}
  .fl{font-size:10px;font-weight:700;color:var(--std);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;display:block;}
  .fi{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:rgba(255,255,255,0.03);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;transition:all 0.15s;}.fi:focus{border-color:var(--sa);box-shadow:0 0 0 3px var(--sag);}.fi::placeholder{color:var(--stm);}
  .fg{margin-bottom:12px;}.fr{display:flex;gap:7px;}
  .fo{padding:9px 12px;border-radius:9px;border:1px solid var(--sbr);background:none;cursor:pointer;transition:all 0.15s;text-align:left;width:100%;margin-bottom:5px;font-family:var(--sf);}.fo:hover{background:rgba(255,255,255,0.03);}.fo.ac{border-color:var(--sa);background:var(--sag);}
  .tg{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
  .tc{border-radius:10px;border:2px solid var(--sbr);background:rgba(255,255,255,0.015);cursor:pointer;transition:all 0.2s;overflow:hidden;padding:12px;text-align:center;font-family:var(--sf);}.tc:hover{border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);}.tc.ac{border-color:var(--sa);background:var(--sag);}
  .tiw{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;}
  .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);padding:10px 22px;background:var(--suc);color:#fff;font-size:12px;font-weight:700;border-radius:10px;box-shadow:0 8px 32px rgba(16,185,129,0.3);z-index:100;animation:ti 0.3s ease;font-family:var(--sf);}
  @keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(16px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
  .animate-spin{animation:spin 1s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}
  .group:hover .ghov{opacity:1!important;}
  .ta{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:rgba(255,255,255,0.03);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;resize:none;transition:all 0.15s;}.ta:focus{border-color:var(--sa);box-shadow:0 0 0 3px var(--sag);}
  .ps{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:rgba(255,255,255,0.03);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;appearance:none;cursor:pointer;}.ps:focus{border-color:var(--sa);}
  /* Mobile responsive */
  @media(max-width:1100px){.slp{width:260px;}.srp{width:240px;}}
  @media(max-width:900px){.srp{display:none;}.slp{width:240px;}}
  @media(max-width:700px){
    .sr{height:auto;min-height:100vh;min-height:100dvh;}
    .st{height:auto;min-height:48px;flex-wrap:wrap;padding:8px 10px;gap:4px;}
    .slg{display:none;}
    .stb{width:100%;order:2;overflow-x:auto;padding:2px;}
    .stbi{padding:5px 10px;font-size:11px;}
    .ssp{display:none;}
    .sac{order:1;margin-left:auto;}
    .sb{flex-direction:column;}
    .slr{display:none;}
    .slp{width:100%;max-height:50vh;overflow-y:auto;border-right:none;border-bottom:1px solid var(--sbr);}
    .sc{min-height:50vh;}
    .sct{position:relative;bottom:auto;left:auto;transform:none;margin:8px auto;flex-wrap:wrap;}
    .scc{padding:8px;}
  }
  /* Video export modal */
  .vem-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);}
  .vem-card{background:var(--ss);border-radius:20px;border:1px solid var(--sbr);padding:32px;max-width:420px;width:calc(100% - 32px);text-align:center;}
`;

/* ═══════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════ */
function UploadZone({ label, imageUrl, onUpload, onClear, uploading, compact, savedUrl, onUseSaved }: {
  label: string; imageUrl: string | null; onUpload: (f: File) => void; onClear: () => void; uploading: boolean; compact?: boolean;
  savedUrl?: string | null; onUseSaved?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  if (imageUrl) return (
    <div className="group" style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: compact ? "1" : "4/3" }}>
      <img src={imageUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div className="ghov" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button onClick={onClear} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color="#333" /></button>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 8px", background: "linear-gradient(transparent,rgba(0,0,0,0.6))", fontSize: 10, color: "#fff", fontWeight: 600 }}>{label}</div>
    </div>
  );
  return (
    <div>
      <div onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onUpload(f); }}
        style={{ aspectRatio: compact ? "1" : "4/3", borderRadius: 12, border: `2px dashed ${drag ? "var(--sa)" : "rgba(255,255,255,0.10)"}`, background: drag ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: "all 0.2s" }}>
        {uploading ? <Loader2 size={18} color="rgba(255,255,255,0.3)" className="animate-spin" /> : <><Upload size={16} color="rgba(255,255,255,0.25)" /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{label}</span></>}
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
      </div>
      {!imageUrl && savedUrl && onUseSaved && (
        <button onClick={onUseSaved} style={{ marginTop: 4, background: "none", border: "none", color: "var(--sa)", fontSize: 10, cursor: "pointer", fontWeight: 600, fontFamily: "var(--sf)" }}>Use saved</button>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon?: any; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "13px 20px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, fontFamily: "var(--sf)" }}>
        {Icon && <Icon size={14} color="rgba(255,255,255,0.35)" />}<span style={{ flex: 1, textAlign: "left" }}>{title}</span><ChevronDown size={13} color="rgba(255,255,255,0.25)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && <div style={{ padding: "0 20px 16px" }}>{children}</div>}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", padding: 0, background: "none" }} /><input className="fi" value={value} onChange={e => onChange(e.target.value)} style={{ width: 90, fontFamily: "monospace", fontSize: 12 }} /></div>);
}

function SwatchGrid({ colors, current, onSelect, showLabels }: { colors: any[]; current: string; onSelect: (h: string) => void; showLabels?: boolean }) {
  return (<div style={{ display: "flex", flexWrap: "wrap", gap: showLabels ? 4 : 6 }}>{colors.map(c => {
    const hex = typeof c === "string" ? c : c.hex, label = typeof c === "string" ? null : c.label;
    if (showLabels) return <button key={hex + (label || "")} onClick={() => onSelect(hex)} title={label || hex} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, border: current === hex ? "1px solid var(--sa)" : "1px solid rgba(255,255,255,0.08)", background: current === hex ? "rgba(99,102,241,0.12)" : "none", cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--sf)" }}><span style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: "1px solid rgba(0,0,0,0.15)", backgroundColor: hex }} /><span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{label}</span></button>;
    return <div key={hex} onClick={() => onSelect(hex)} title={label || hex} style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: hex, border: current === hex ? "2px solid #fff" : "1px solid rgba(255,255,255,0.08)", boxShadow: current === hex ? "0 0 0 2px var(--sa)" : "none", cursor: "pointer", transition: "all 0.15s" }} />;
  })}</div>);
}

function VideoExportModal({ progress, status, onCancel }: { progress: number; status: string; onCancel?: () => void }) {
  return (
    <div className="vem-overlay">
      <div className="vem-card">
        <div style={{ margin: "0 auto 16px", width: 64, height: 64, borderRadius: 16, background: "var(--sag)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Film size={32} color="var(--sa)" style={{ animation: "spin 2s ease-in-out infinite" }} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--st)", marginBottom: 8 }}>Exporting Video</h3>
        <p style={{ fontSize: 13, color: "var(--std)", marginBottom: 16 }}>{status}</p>
        <div style={{ width: "100%", height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${Math.max(progress, 2)}%`, background: "var(--sa)", borderRadius: 8, transition: "width 0.3s" }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--st)" }}>{Math.round(progress)}%</p>
        {progress < 100 && onCancel && (
          <button onClick={onCancel} style={{ marginTop: 12, background: "none", border: "none", color: "var(--std)", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "var(--sf)" }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MUSIC SELECTOR (compact, dark theme)
   ═══════════════════════════════════════════════════════ */
function CompactMusicPanel({ selectedTrack, onSelect, customAudioFile, onCustomAudioChange }: {
  selectedTrack: string; onSelect: (s: string) => void; customAudioFile: File | null; onCustomAudioChange: (f: File | null) => void;
}) {
  const [vibeFilter, setVibeFilter] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioPermission, setAudioPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = async (vibe: string = "") => { setLoading(true); try { const resp = await fetch(`/api/generate-music?library=true&vibe=${vibe}`); const data = await resp.json(); setTracks(data.tracks || []); } catch (e) { console.error(e); } setLoading(false); };
  useEffect(() => { fetchTracks(); }, []);
  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);

  const handlePlay = (trackId: string, url: string) => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } if (playingId === trackId) { setPlayingId(null); return; } const audio = new Audio(url); audio.play(); audio.onended = () => setPlayingId(null); audioRef.current = audio; setPlayingId(trackId); };

  return (
    <>
      <div className="ph"><Music size={15} color="var(--sa)" /> Background Music</div>
      <div style={{ padding: 14 }}>
        {/* No music option */}
        <button onClick={() => { onSelect(""); onCustomAudioChange(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: !selectedTrack && !customAudioFile ? "1px solid var(--sa)" : "1px solid var(--sbr)", background: !selectedTrack && !customAudioFile ? "var(--sag)" : "none", cursor: "pointer", marginBottom: 10, fontFamily: "var(--sf)", color: "var(--std)", fontSize: 12 }}>
          <X size={14} /><span style={{ flex: 1, textAlign: "left" }}>No music</span>{!selectedTrack && !customAudioFile && <Check size={14} color="var(--sa)" />}
        </button>

        {/* Vibe filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 10 }}>
          {VIBE_FILTERS.map(v => (
            <button key={v.key} onClick={() => { setVibeFilter(v.key); fetchTracks(v.key); }}
              style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: vibeFilter === v.key ? "1px solid var(--sa)" : "1px solid var(--sbr)", background: vibeFilter === v.key ? "var(--sag)" : "none", color: vibeFilter === v.key ? "var(--sa)" : "var(--std)", cursor: "pointer", fontFamily: "var(--sf)", fontWeight: 600 }}>
              {v.emoji} {v.label}
            </button>
          ))}
        </div>

        {/* Tracks */}
        {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={18} color="var(--sa)" className="animate-spin" /></div> : (
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {tracks.map(track => {
              const isSelected = selectedTrack.includes(track.id);
              return (
                <button key={track.id} onClick={() => onSelect(`library:${track.id}:${track.file_url}`)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 8, border: isSelected ? "1px solid var(--sa)" : "1px solid transparent", background: isSelected ? "var(--sag)" : "none", cursor: "pointer", marginBottom: 3, fontFamily: "var(--sf)" }}>
                  <button onClick={e => { e.stopPropagation(); handlePlay(track.id, track.file_url); }}
                    style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: playingId === track.id ? "var(--sa)" : "rgba(99,102,241,0.15)", border: "none", cursor: "pointer", color: playingId === track.id ? "#fff" : "var(--sa)", fontSize: 9, fontWeight: 700 }}>
                    {playingId === track.id ? "■" : "▶"}
                  </button>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--st)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.display_name}</p>
                    <p style={{ fontSize: 10, color: "var(--std)", margin: 0 }}>{track.duration_seconds}s</p>
                  </div>
                  {isSelected && <Check size={14} color="var(--sa)" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Custom upload */}
        <div style={{ borderTop: "1px solid var(--sbr)", marginTop: 10, paddingTop: 10 }}>
          <p style={{ fontSize: 10, color: "var(--std)", marginBottom: 6 }}>Upload your own audio:</p>
          <input type="file" accept="audio/*" onChange={e => { const file = e.target.files?.[0] || null; onCustomAudioChange(file); if (file) { onSelect("custom"); setAudioPermission(false); } }}
            style={{ fontSize: 11, color: "var(--st)" }} />
          {customAudioFile && (
            <div style={{ marginTop: 6 }}>
              <p style={{ fontSize: 11, color: "var(--suc)" }}>✓ {customAudioFile.name}</p>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer", marginTop: 4 }}>
                <input type="checkbox" checked={audioPermission} onChange={e => { setAudioPermission(e.target.checked); if (!e.target.checked) { onCustomAudioChange(null); onSelect(""); } }} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 10, color: "var(--std)" }}>I have permission to use this audio.</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   LISTING FLYER PAGE RENDERER
   ═══════════════════════════════════════════════════════ */
function ListingFlyerPage({ pageNumber, photos, address, cityStateZip, beds, baths, sqft, price, amenities, description, listingUrl, videoUrl, stagingUrl, accentColor, agentName, phone, email, brokerage, headshot, logo, fontFamily, brandingCardUrl }: {
  pageNumber: number; photos: string[]; address: string; cityStateZip: string; beds: string; baths: string; sqft: string; price: string; amenities: string[]; description: string; listingUrl: string; videoUrl: string; stagingUrl: string; accentColor: string; agentName: string; phone: string; email: string; brokerage: string; headshot: string | null; logo: string | null; fontFamily: string; brandingCardUrl: string | null;
}) {
  const W = FLYER_W, H = FLYER_H, accent = accentColor || "#0e7490", m = 76;
  const ad = address || "Property Address";
  const pr = price ? `$${price}` : "";
  const det = [beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`].filter(Boolean).join("  ·  ");
  const hasUrls = !!(listingUrl || videoUrl || stagingUrl);
  const descTruncated = description ? (description.length > 300 ? description.slice(0, 297) + "..." : description) : "";

  const AMENITY_LABELS: Record<string, string> = {
    ac: "A/C", heating: "Heating", pool: "Pool", garage: "Garage", parking: "Parking",
    security: "Security", gated: "Gated", laundry: "Laundry", dishwasher: "Dishwasher",
    fireplace: "Fireplace", furnished: "Furnished", pet_friendly: "Pet Friendly",
    gym: "Gym", elevator: "Elevator", balcony: "Balcony", garden: "Garden",
    rooftop: "Rooftop", storage: "Storage", solar: "Solar", ev_charging: "EV Charging",
    smart_home: "Smart Home", water_heater: "Water Heater", ceiling_fans: "Ceiling Fans",
  };

  if (pageNumber === 0) {
    // PAGE 1 — Photo grid + details + URLs
    const photoCount = Math.min(photos.length, 7);
    const heroH = Math.round(H * 0.38);
    const gridGap = 12;

    return (
      <div style={{ width: W, height: H, backgroundColor: "#ffffff", fontFamily, position: "relative", overflow: "hidden" }}>
        {/* Accent bar top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, backgroundColor: accent }} />

        {/* Branding card or agent header */}
        <div style={{ position: "absolute", top: 10, left: 0, right: 0, height: 200, backgroundColor: accent, display: "flex", alignItems: "center", padding: `0 ${m}px`, gap: 30 }}>
          {logo && <img src={logo} alt="" style={{ maxHeight: 120, maxWidth: 200, objectFit: "contain" }} />}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 52, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.02em" }}>{agentName || "Agent Name"}</p>
            <p style={{ fontSize: 32, fontWeight: 500, color: "rgba(255,255,255,0.8)", margin: 0, marginTop: 6 }}>{brokerage || ""}</p>
          </div>
          {headshot && <img src={headshot} alt="" style={{ width: 130, height: 130, borderRadius: "50%", objectFit: "cover", border: "4px solid rgba(255,255,255,0.3)" }} />}
        </div>

        {/* Photo grid */}
        <div style={{ position: "absolute", top: 230, left: m, right: m, height: heroH }}>
          {photoCount === 0 ? (
            <div style={{ width: "100%", height: "100%", backgroundColor: "#f0efea", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#ccc", fontSize: 48 }}>Select a property to load photos</span>
            </div>
          ) : photoCount <= 2 ? (
            <div style={{ display: "flex", gap: gridGap, height: "100%" }}>
              {photos.slice(0, 2).map((p, i) => <div key={i} style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}><img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
            </div>
          ) : photoCount <= 4 ? (
            <div style={{ display: "flex", gap: gridGap, height: "100%" }}>
              <div style={{ flex: 1.2, borderRadius: 12, overflow: "hidden" }}><img src={photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: gridGap }}>
                {photos.slice(1, 4).map((p, i) => <div key={i} style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}><img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
              </div>
            </div>
          ) : (
            // 5-7 photos: hero left, 2 stacked right, 3-4 bottom row
            <div style={{ display: "flex", flexDirection: "column", gap: gridGap, height: "100%" }}>
              <div style={{ flex: 2, display: "flex", gap: gridGap }}>
                <div style={{ flex: 1.2, borderRadius: 12, overflow: "hidden" }}><img src={photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: gridGap }}>
                  <div style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}><img src={photos[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  <div style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}><img src={photos[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", gap: gridGap }}>
                {photos.slice(3, 7).map((p, i) => <div key={i} style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}><img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
              </div>
            </div>
          )}
        </div>

        {/* Property details bar */}
        <div style={{ position: "absolute", top: 230 + heroH + 20, left: m, right: m }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              {pr && <p style={{ fontSize: 72, fontWeight: 800, color: accent, margin: 0, lineHeight: 1 }}>{pr}</p>}
              <p style={{ fontSize: 48, fontWeight: 700, color: "#1a1a1a", margin: 0, marginTop: 8 }}>{ad}</p>
              {cityStateZip && <p style={{ fontSize: 32, color: "#666", margin: 0, marginTop: 4 }}>{cityStateZip}</p>}
            </div>
            {det && <p style={{ fontSize: 36, fontWeight: 600, color: "#555", letterSpacing: "0.04em", margin: 0 }}>{det}</p>}
          </div>
          {/* Amenities */}
          {amenities.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              {amenities.slice(0, 12).map(a => (
                <span key={a} style={{ fontSize: 26, fontWeight: 600, color: accent, backgroundColor: `${accent}12`, padding: "6px 18px", borderRadius: 8, border: `1px solid ${accent}30` }}>
                  {AMENITY_LABELS[a] || a.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
          {/* Truncated description */}
          {descTruncated && (
            <p style={{ fontSize: 30, color: "#555", lineHeight: 1.6, margin: 0, marginTop: 24 }}>{descTruncated}</p>
          )}
        </div>

        {/* URL / QR section */}
        {hasUrls && (
          <div style={{ position: "absolute", bottom: m, left: m, right: m, borderTop: `3px solid ${accent}20`, paddingTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
              {listingUrl && <div><p style={{ fontSize: 22, fontWeight: 700, color: accent, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>View Listing</p><p style={{ fontSize: 28, color: "#333", margin: 0, marginTop: 4 }}>{listingUrl}</p></div>}
              {videoUrl && <div><p style={{ fontSize: 22, fontWeight: 700, color: accent, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Video Tour</p><p style={{ fontSize: 28, color: "#333", margin: 0, marginTop: 4 }}>{videoUrl}</p></div>}
              {stagingUrl && <div><p style={{ fontSize: 22, fontWeight: 700, color: accent, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Virtual Staging</p><p style={{ fontSize: 28, color: "#333", margin: 0, marginTop: 4 }}>{stagingUrl}</p></div>}
            </div>
          </div>
        )}

        {/* Bottom accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 10, backgroundColor: accent }} />
      </div>
    );
  }

  // PAGE 2 — Description, details table, amenities grid, agent contact
  return (
    <div style={{ width: W, height: H, backgroundColor: "#ffffff", fontFamily, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, backgroundColor: accent }} />

      <div style={{ padding: `${m + 10}px ${m}px ${m}px` }}>
        {/* Full description */}
        {description && (
          <div style={{ marginBottom: 50 }}>
            <p style={{ fontSize: 40, fontWeight: 700, color: "#222", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, marginBottom: 20 }}>About This Property</p>
            <div style={{ width: 60, height: 4, backgroundColor: accent, borderRadius: 2, marginBottom: 24 }} />
            <p style={{ fontSize: 34, color: "#444", lineHeight: 1.7, margin: 0, overflowWrap: "break-word" }}>{description}</p>
          </div>
        )}

        {/* Property details table */}
        <div style={{ marginBottom: 50 }}>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#222", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, marginBottom: 20 }}>Property Details</p>
          <div style={{ width: 60, height: 4, backgroundColor: accent, borderRadius: 2, marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" }}>
            {[
              { label: "Bedrooms", value: beds },
              { label: "Bathrooms", value: baths },
              { label: "Square Feet", value: sqft },
              { label: "Price", value: pr },
              { label: "Address", value: ad },
              { label: "City / State", value: cityStateZip },
            ].filter(d => d.value).map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #eee" }}>
                <span style={{ fontSize: 30, fontWeight: 600, color: "#888" }}>{d.label}</span>
                <span style={{ fontSize: 30, fontWeight: 700, color: "#222" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities grid */}
        {amenities.length > 0 && (
          <div style={{ marginBottom: 50 }}>
            <p style={{ fontSize: 40, fontWeight: 700, color: "#222", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, marginBottom: 20 }}>Amenities</p>
            <div style={{ width: 60, height: 4, backgroundColor: accent, borderRadius: 2, marginBottom: 24 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {amenities.map(a => (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, backgroundColor: "#f9fafb", border: "1px solid #eee" }}>
                  <span style={{ fontSize: 28, color: accent, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 28, fontWeight: 600, color: "#444" }}>{AMENITY_LABELS[a] || a.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Agent contact card */}
      <div style={{ position: "absolute", bottom: m + 10, left: m, right: m, display: "flex", alignItems: "center", gap: 30, padding: "30px 40px", backgroundColor: accent, borderRadius: 16 }}>
        {headshot && <img src={headshot} alt="" style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 40, fontWeight: 800, color: "#fff", margin: 0 }}>{agentName || "Agent Name"}</p>
          {brokerage && <p style={{ fontSize: 28, color: "rgba(255,255,255,0.8)", margin: 0, marginTop: 4 }}>{brokerage}</p>}
          <div style={{ display: "flex", gap: 30, marginTop: 10, flexWrap: "wrap" }}>
            {phone && <span style={{ fontSize: 26, color: "rgba(255,255,255,0.9)" }}>📞 {phone}</span>}
            {email && <span style={{ fontSize: 26, color: "rgba(255,255,255,0.9)" }}>✉ {email}</span>}
          </div>
        </div>
        {logo && <img src={logo} alt="" style={{ maxHeight: 80, maxWidth: 160, objectFit: "contain", flexShrink: 0 }} />}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", margin: 0 }}>Powered by Real Estate Photo 2 Video</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE EXPORT
   ═══════════════════════════════════════════════════════ */
export default function DesignStudioPage() {
  return (<Suspense><DesignStudioInner /></Suspense>);
}

function DesignStudioInner() {
  /* ─── Auth & subscription state ─── */
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [freeExportsUsed, setFreeExportsUsed] = useState(0);
  const [paywallHit, setPaywallHit] = useState(false);
  const FREE_EXPORT_LIMIT = 3;
  const [savedHeadshot, setSavedHeadshot] = useState<string | null>(null);
  const [savedLogo, setSavedLogo] = useState<string | null>(null);

  /* ─── Studio UI state ─── */
  const [activeTab, setActiveTab] = useState<StudioTab>("templates");
  const [leftPanel, setLeftPanel] = useState("templates");
  const [showRight, setShowRight] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [notification, setNotification] = useState<string | null>(null);

  /* ─── Template state ─── */
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("just-listed");
  const [selectedSize, setSelectedSize] = useState<SizeOption>("square");

  /* ─── Property selector ─── */
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  /* ─── Shared fields ─── */
  const [listingPhoto, setListingPhoto] = useState<string | null>(null);
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

  /* ─── Video / media state ─── */
  const [mediaMode, setMediaMode] = useState<"image" | "video">("image");
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; thumbnail: string; orderId: string } | null>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [clipUrls, setClipUrls] = useState<string[]>([]);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [orderClips, setOrderClips] = useState<{ clipUrl: string; photoUrl: string; description: string; cameraDirection: string; orderId: string; orderDate: string; index: number }[]>([]);
  const [selectedClipIndices, setSelectedClipIndices] = useState<Set<number>>(new Set());
  const [loadingClips, setLoadingClips] = useState(false);
  const [overlayMusic, setOverlayMusic] = useState("");
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);

  /* ─── Yard sign state ─── */
  const [yardDesign, setYardDesign] = useState<YardSignDesign>("split-bar");
  const [yardSignSize, setYardSignSize] = useState<"18x24" | "24x36">("18x24");
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
  const [yardBullet1, setYardBullet1] = useState("");
  const [yardBullet2, setYardBullet2] = useState("");
  const [yardBullet3, setYardBullet3] = useState("");

  /* ─── Property PDF state ─── */
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
  const [pdfAccentColor, setPdfAccentColor] = useState("#0e7490");

  /* ─── Branding card state ─── */
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandHeadshot, setBrandHeadshot] = useState<string | null>(null);
  const [brandBgPhoto, setBrandBgPhoto] = useState<string | null>(null);
  const [brandAgentName, setBrandAgentName] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
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
  const [savingBrandCard, setSavingBrandCard] = useState(false);
  const [brandCardSaved, setBrandCardSaved] = useState(false);

  /* ─── Listing flyer state ─── */
  const [flyerPhotos, setFlyerPhotos] = useState<string[]>([]);
  const [flyerDescription, setFlyerDescription] = useState("");
  const [flyerAmenities, setFlyerAmenities] = useState<string[]>([]);
  const [flyerListingUrl, setFlyerListingUrl] = useState("");
  const [flyerVideoUrl, setFlyerVideoUrl] = useState("");
  const [flyerStagingUrl, setFlyerStagingUrl] = useState("");
  const [flyerAccentColor, setFlyerAccentColor] = useState("#0e7490");
  const [flyerPreviewPage, setFlyerPreviewPage] = useState(0);
  const [uploadingFlyerPhoto, setUploadingFlyerPhoto] = useState(false);

  /* ─── Export state ─── */
  const [exporting, setExporting] = useState(false);
  const [videoExporting, setVideoExporting] = useState(false);
  const [videoExportProgress, setVideoExportProgress] = useState(0);
  const [videoExportStatus, setVideoExportStatus] = useState("");
  const [showMusicReminder, setShowMusicReminder] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  /* ─── Refs ─── */
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  /* ─── Save draft to sessionStorage ─── */
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        activeTab, selectedTemplate, selectedSize, selectedPropertyId,
        listingPhoto, address, beds, baths, sqft, price, date, time,
        agentName, phone: phone, agentEmail, brokerage,
        listingFont, listingBarColor, listingAccentColor,
        yardDesign, yardSignSize, yardHeaderText, yardTopColor, yardBottomColor,
        yardSidebarColor, yardMainBgColor, yardWebsite, yardOfficeName, yardOfficePhone,
        yardBullet1, yardBullet2, yardBullet3,
        pdfAddress, pdfCityStateZip, pdfPrice, pdfBeds, pdfBaths, pdfSqft,
        pdfDescription, pdfFeatures, pdfAccentColor,
        brandAgentName, brandPhone, brandEmail, brandBrokerage, brandTagline, brandWebsite,
        brandAddress, brandCityState, brandPrice, brandFeatures,
        brandBgColor, brandAccentColor, brandOrientation, brandFont,
      };
      sessionStorage.setItem("design_studio_draft", JSON.stringify(draft));
      setHasSavedDraft(true);
      notify("Draft saved");
      setTimeout(() => setHasSavedDraft(false), 2000);
    } catch { /* sessionStorage may be full */ }
  }, [activeTab, selectedTemplate, selectedSize, selectedPropertyId, listingPhoto, address, beds, baths, sqft, price, date, time, agentName, phone, agentEmail, brokerage, listingFont, listingBarColor, listingAccentColor, yardDesign, yardSignSize, yardHeaderText, yardTopColor, yardBottomColor, yardSidebarColor, yardMainBgColor, yardWebsite, yardOfficeName, yardOfficePhone, yardBullet1, yardBullet2, yardBullet3, pdfAddress, pdfCityStateZip, pdfPrice, pdfBeds, pdfBaths, pdfSqft, pdfDescription, pdfFeatures, pdfAccentColor, brandAgentName, brandPhone, brandEmail, brandBrokerage, brandTagline, brandWebsite, brandAddress, brandCityState, brandPrice, brandFeatures, brandBgColor, brandAccentColor, brandOrientation, brandFont]);

  /* ─── Restore draft from sessionStorage ─── */
  const restoreDraft = useCallback(() => {
    try {
      const raw = sessionStorage.getItem("design_studio_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.activeTab) setActiveTab(d.activeTab);
      if (d.selectedTemplate) setSelectedTemplate(d.selectedTemplate);
      if (d.selectedSize) setSelectedSize(d.selectedSize);
      if (d.listingPhoto) setListingPhoto(d.listingPhoto);
      if (d.address) setAddress(d.address);
      if (d.beds) setBeds(d.beds);
      if (d.baths) setBaths(d.baths);
      if (d.sqft) setSqft(d.sqft);
      if (d.price) setPrice(d.price);
      if (d.date) setDate(d.date);
      if (d.time) setTime(d.time);
      if (d.listingFont) setListingFont(d.listingFont);
      if (d.listingBarColor) setListingBarColor(d.listingBarColor);
      if (d.listingAccentColor) setListingAccentColor(d.listingAccentColor);
      if (d.yardDesign) setYardDesign(d.yardDesign);
      if (d.yardSignSize) setYardSignSize(d.yardSignSize);
      if (d.yardHeaderText) setYardHeaderText(d.yardHeaderText);
      if (d.yardTopColor) setYardTopColor(d.yardTopColor);
      if (d.yardBottomColor) setYardBottomColor(d.yardBottomColor);
      if (d.yardSidebarColor) setYardSidebarColor(d.yardSidebarColor);
      if (d.yardMainBgColor) setYardMainBgColor(d.yardMainBgColor);
      if (d.yardWebsite) setYardWebsite(d.yardWebsite);
      if (d.yardOfficeName) setYardOfficeName(d.yardOfficeName);
      if (d.yardOfficePhone) setYardOfficePhone(d.yardOfficePhone);
      if (d.yardBullet1) setYardBullet1(d.yardBullet1);
      if (d.yardBullet2) setYardBullet2(d.yardBullet2);
      if (d.yardBullet3) setYardBullet3(d.yardBullet3);
      if (d.pdfAddress) setPdfAddress(d.pdfAddress);
      if (d.pdfCityStateZip) setPdfCityStateZip(d.pdfCityStateZip);
      if (d.pdfPrice) setPdfPrice(d.pdfPrice);
      if (d.pdfBeds) setPdfBeds(d.pdfBeds);
      if (d.pdfBaths) setPdfBaths(d.pdfBaths);
      if (d.pdfSqft) setPdfSqft(d.pdfSqft);
      if (d.pdfDescription) setPdfDescription(d.pdfDescription);
      if (d.pdfFeatures) setPdfFeatures(d.pdfFeatures);
      if (d.pdfAccentColor) setPdfAccentColor(d.pdfAccentColor);
      if (d.brandAgentName) setBrandAgentName(d.brandAgentName);
      if (d.brandPhone) setBrandPhone(d.brandPhone);
      if (d.brandEmail) setBrandEmail(d.brandEmail);
      if (d.brandBrokerage) setBrandBrokerage(d.brandBrokerage);
      if (d.brandTagline) setBrandTagline(d.brandTagline);
      if (d.brandWebsite) setBrandWebsite(d.brandWebsite);
      if (d.brandAddress) setBrandAddress(d.brandAddress);
      if (d.brandCityState) setBrandCityState(d.brandCityState);
      if (d.brandPrice) setBrandPrice(d.brandPrice);
      if (d.brandFeatures) setBrandFeatures(d.brandFeatures);
      if (d.brandBgColor) setBrandBgColor(d.brandBgColor);
      if (d.brandAccentColor) setBrandAccentColor(d.brandAccentColor);
      if (d.brandOrientation) setBrandOrientation(d.brandOrientation);
      if (d.brandFont) setBrandFont(d.brandFont);
      sessionStorage.removeItem("design_studio_draft");
    } catch { /* ok */ }
  }, []);

  const handleExit = () => { setShowExitDialog(true); };
  const handleExitWithSave = () => { saveDraft(); setShowExitDialog(false); router.push("/dashboard/lens"); };
  const handleExitWithoutSave = () => { sessionStorage.removeItem("design_studio_draft"); setShowExitDialog(false); router.push("/dashboard/lens"); };

  /* ─── Derived values ─── */
  const currentSize = SIZES.find(s => s.id === selectedSize)!;
  const currentYardSize = YARD_SIGN_SIZES.find(s => s.id === yardSignSize)!;
  const currentBrandOrientation = BRANDING_ORIENTATIONS.find(o => o.id === brandOrientation)!;
  const listingFontFamily = FONT_OPTIONS.find(f => f.id === listingFont)?.family || FONT_OPTIONS[1].family;
  const brandFontFamily = FONT_OPTIONS.find(f => f.id === brandFont)?.family || FONT_OPTIONS[0].family;
  const badge = getBadgeConfig(selectedTemplate);
  const currentPanels = LEFT_PANELS[activeTab] || LEFT_PANELS.templates;

  // PDF page calculation
  const pdfDescLines = pdfDescription ? pdfDescription.split("\n").filter(Boolean).length : 0;
  const pdfFeatureLines = pdfFeatures ? pdfFeatures.split("\n").filter(Boolean).length : 0;
  const pdfEstFeatureH = pdfFeatureLines * 70 + (pdfFeatureLines > 0 ? 80 : 0);
  const pdfMaxDescLines = Math.floor((1400 - pdfEstFeatureH) / 52);
  const pdfHasOverflow = pdfDescLines > pdfMaxDescLines && pdfMaxDescLines > 0;
  const pdfPage2Slots = pdfHasOverflow ? 4 : 6;
  const pdfPhotosAfterP1 = Math.max(0, pdfPhotos.length - 3);
  const pdfTotalPages = pdfHasOverflow ? 2 + Math.ceil(Math.max(0, pdfPhotosAfterP1 - pdfPage2Slots) / 6) : 1 + Math.ceil(pdfPhotosAfterP1 / 6);

  /* ─── Effects ─── */
  useEffect(() => { setLeftPanel(currentPanels[0].id); }, [activeTab]);

  // Auth init
  useEffect(() => {
    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setAuthLoading(false);
      if (!authUser) return;
      setUser(authUser);
      const admin = authUser.email === "realestatephoto2video@gmail.com";
      setIsAdmin(admin);
      const { data } = await supabase.from("lens_usage").select("saved_headshot_url, saved_logo_url, is_subscriber, free_design_exports_used, saved_agent_name, saved_phone, saved_email, saved_company, saved_website").eq("user_id", authUser.id).single();
      if (data) {
        if (data.saved_headshot_url) { setSavedHeadshot(data.saved_headshot_url); setHeadshot(data.saved_headshot_url); setBrandHeadshot(data.saved_headshot_url); }
        if (data.saved_logo_url) { setSavedLogo(data.saved_logo_url); setLogo(data.saved_logo_url); setBrandLogo(data.saved_logo_url); }
        if (data.saved_agent_name) { setAgentName(data.saved_agent_name); setBrandAgentName(data.saved_agent_name); }
        if (data.saved_phone) { setPhone(data.saved_phone); setBrandPhone(data.saved_phone); }
        if (data.saved_email) { setAgentEmail(data.saved_email); setBrandEmail(data.saved_email); }
        if (data.saved_company) { setBrokerage(data.saved_company); setBrandBrokerage(data.saved_company); }
        if (data.saved_website) { setBrandWebsite(data.saved_website); }
        if (admin || data.is_subscriber) setIsSubscriber(true);
        setFreeExportsUsed(data.free_design_exports_used || 0);
      }
      if (admin) setIsSubscriber(true);
      const { data: props } = await supabase.from("agent_properties").select("id, address, address_normalized, city, state, bedrooms, bathrooms, sqft, price, special_features").eq("user_id", authUser.id).is("merged_into_id", null).order("updated_at", { ascending: false });
      if (props) setUserProperties(props);
      // Restore saved draft if exists (only if no deep link params)
      if (!searchParams.get("propertyId") && !searchParams.get("address")) {
        restoreDraft();
      }
    };
    init();
  }, []);

  // Deep link params
  const searchParams = useSearchParams();
  useEffect(() => {
    const propId = searchParams.get("propertyId");
    const a = searchParams.get("address");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const bd = searchParams.get("beds");
    const ba = searchParams.get("baths");
    const sf = searchParams.get("sqft");
    const pr = searchParams.get("price");
    const features = searchParams.get("specialFeatures");
    if (propId) setSelectedPropertyId(propId);
    if (a) { setAddress([a, city, state].filter(Boolean).join(", ")); setPdfAddress(a); setBrandAddress(a); const cs = [city, state].filter(Boolean).join(", "); if (cs) { setPdfCityStateZip(cs); setBrandCityState(cs); } }
    if (bd) { setBeds(bd); setPdfBeds(bd); } if (ba) { setBaths(ba); setPdfBaths(ba); }
    if (sf) { setSqft(sf); setPdfSqft(sf); } if (pr) { setPrice(pr); setPdfPrice(pr); setBrandPrice(pr); }
    if (features) { setPdfFeatures(features); setBrandFeatures(features); }
    const tmpl = searchParams.get("template");
    if (tmpl === "listing_flyer") setActiveTab("listing-flyer");
  }, [searchParams]);

  // Session storage clips
  useEffect(() => {
    try {
      const clipsJson = sessionStorage.getItem("design_studio_clips");
      if (clipsJson) {
        const parsed = JSON.parse(clipsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClipUrls(parsed); setMediaMode("video"); setCurrentClipIndex(0); setListingPhoto(null);
          setActiveTab("video-remix"); setSelectedVideo({ url: parsed[0], thumbnail: "", orderId: "clips" });
        }
        sessionStorage.removeItem("design_studio_clips");
      }
    } catch (e) { console.error("Failed to load clips:", e); }
  }, []);

  // QR code generation
  useEffect(() => { if (!yardQrUrl) { setYardQrDataUrl(null); return; } let c = false; (async () => { try { const QR = (await import("qrcode")).default; const u = await QR.toDataURL(yardQrUrl, { width: 600, margin: 2, errorCorrectionLevel: "M" }); if (!c) setYardQrDataUrl(u); } catch { if (!c) setYardQrDataUrl(null); } })(); return () => { c = true; }; }, [yardQrUrl]);

  // Clip looping
  useEffect(() => { if (clipUrls.length > 1 && videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); } }, [currentClipIndex, clipUrls.length]);

  /* ─── Helpers ─── */
  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const saveAssetToDb = async (field: "saved_headshot_url" | "saved_logo_url", url: string) => { if (!user) return; const supabase = (await import("@/lib/supabase/client")).createClient(); await supabase.from("lens_usage").upsert({ user_id: user.id, [field]: url }, { onConflict: "user_id" }); };
  const incrementExportCounter = async () => { if (!isSubscriber && !isAdmin && user) { const nc = freeExportsUsed + 1; setFreeExportsUsed(nc); const supabase = (await import("@/lib/supabase/client")).createClient(); await supabase.from("lens_usage").upsert({ user_id: user.id, free_design_exports_used: nc }, { onConflict: "user_id" }); } };
  const checkPaywall = (): boolean => { if (!isSubscriber && !isAdmin && freeExportsUsed >= FREE_EXPORT_LIMIT) { setPaywallHit(true); return true; } return false; };

  const saveDesignExport = async (exportUrl: string | null, format: "png" | "pdf" | "mp4", overlayVideoUrl?: string) => {
    if (!user) return;
    const supabase = (await import("@/lib/supabase/client")).createClient();
    const templateType = activeTab === "templates" || activeTab === "video-remix" ? selectedTemplate : activeTab === "branding-card" ? "branding_card" : activeTab === "yard-sign" ? "yard_sign" : "property_pdf";
    await supabase.from("design_exports").insert({ user_id: user.id, property_id: selectedPropertyId || null, template_type: templateType, export_url: exportUrl || overlayVideoUrl || null, export_format: format, overlay_video_url: overlayVideoUrl || null });
  };

  /* ─── Upload handlers ─── */
  const handleUpload = async (file: File, folder: string, setUrl: (u: string | null) => void, setLoading: (v: boolean) => void) => { setLoading(true); const url = await uploadToCloudinary(file, folder); setUrl(url); setLoading(false); };
  const handleHeadshotUpload = async (file: File, setUrl: (u: string | null) => void, setLoading: (v: boolean) => void) => { setLoading(true); const url = await uploadToCloudinary(file, "design-studio"); if (url) { setUrl(url); setHeadshot(url); setBrandHeadshot(url); saveAssetToDb("saved_headshot_url", url); setSavedHeadshot(url); } setLoading(false); };
  const handleLogoUpload = async (file: File, setUrl: (u: string | null) => void, setLoading: (v: boolean) => void) => { setLoading(true); const url = await uploadToCloudinary(file, "design-studio"); if (url) { setUrl(url); setLogo(url); setBrandLogo(url); saveAssetToDb("saved_logo_url", url); setSavedLogo(url); } setLoading(false); };
  const handlePdfPhotoUpload = async (file: File) => { if (pdfPhotos.length >= 25) return; setUploadingPdfPhoto(true); const url = await uploadToCloudinary(file, "design-studio"); if (url) setPdfPhotos(prev => [...prev, url]); setUploadingPdfPhoto(false); };

  /* ─── Load user videos ─── */
  const loadUserVideos = async () => {
    if (userVideos.length > 0) return;
    setLoadingVideos(true);
    try { const supabase = (await import("@/lib/supabase/client")).createClient(); const { data: { user: u } } = await supabase.auth.getUser(); if (!u) return; const { data: orders } = await supabase.from("orders").select("order_id, delivery_url, unbranded_delivery_url, photos, created_at").eq("user_id", u.id).in("status", ["complete", "delivered", "closed"]).order("created_at", { ascending: false }); setUserVideos((orders || []).filter((o: any) => o.unbranded_delivery_url || o.delivery_url).map((o: any) => ({ orderId: o.order_id, url: o.unbranded_delivery_url || o.delivery_url, thumbnail: o.photos?.[0]?.secure_url || null, hasUnbranded: !!o.unbranded_delivery_url, date: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }))); } catch (err) { console.error(err); } finally { setLoadingVideos(false); }
  };

  /* ─── Load order clips ─── */
  const loadOrderClips = async () => {
    if (orderClips.length > 0) return;
    setLoadingClips(true);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const { data: orders } = await supabase.from("orders").select("order_id, clip_urls, photos, created_at, property_address").eq("user_id", u.id).in("status", ["complete", "delivered", "closed"]).order("created_at", { ascending: false });
      const allClips: typeof orderClips = [];
      (orders || []).forEach((order: any) => {
        if (Array.isArray(order.clip_urls)) {
          order.clip_urls.forEach((clip: any, idx: number) => {
            const clipUrl = clip.url || clip.clip_file || clip.drive_url || "";
            if (clipUrl) allClips.push({ clipUrl, photoUrl: clip.photo_url || "", description: clip.description || order.property_address || `Clip ${idx + 1}`, cameraDirection: clip.camera_direction || "", orderId: order.order_id, orderDate: new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), index: idx });
          });
        }
      });
      setOrderClips(allClips);
    } catch (err) { console.error(err); } finally { setLoadingClips(false); }
  };

  const handleSelectClip = (idx: number) => {
    setSelectedClipIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const applySelectedClips = () => {
    const selected = Array.from(selectedClipIndices).sort((a, b) => a - b).map(i => orderClips[i]).filter(Boolean);
    if (selected.length === 0) return;
    const urls = selected.map(c => c.clipUrl);
    setClipUrls(urls);
    setCurrentClipIndex(0);
    setMediaMode("video");
    setSelectedVideo({ url: urls[0], thumbnail: selected[0].photoUrl || "", orderId: "clips" });
    setListingPhoto(null);
  };

  /* ─── Property selector ─── */
  const handleSelectProperty = (propertyId: string) => {
    if (propertyId === "__new__") {
      setSelectedPropertyId(null); setAddress(""); setBeds(""); setBaths(""); setSqft(""); setPrice("");
      setPdfAddress(""); setPdfCityStateZip(""); setPdfBeds(""); setPdfBaths(""); setPdfSqft(""); setPdfPrice("");
      setBrandAddress(""); setBrandCityState(""); setBrandPrice(""); setPdfFeatures(""); setBrandFeatures(""); return;
    }
    const prop = userProperties.find((p: any) => p.id === propertyId);
    if (!prop) return;
    setSelectedPropertyId(prop.id);
    const fullAddr = [prop.address, prop.city, prop.state].filter(Boolean).join(", ");
    setAddress(fullAddr); setPdfAddress(prop.address || ""); setBrandAddress(prop.address || "");
    const cs = [prop.city, prop.state].filter(Boolean).join(", ");
    if (cs) { setPdfCityStateZip(cs); setBrandCityState(cs); }
    if (prop.bedrooms) { const b = prop.bedrooms.toString(); setBeds(b); setPdfBeds(b); }
    if (prop.bathrooms) { const b = prop.bathrooms.toString(); setBaths(b); setPdfBaths(b); }
    if (prop.sqft) { const s = prop.sqft.toString(); setSqft(s); setPdfSqft(s); }
    if (prop.price) { const p = prop.price.toString(); setPrice(p); setPdfPrice(p); setBrandPrice(p); }
    if (prop.special_features?.length > 0) { const f = prop.special_features.join("\n"); setPdfFeatures(f); setBrandFeatures(f); }
    // Flyer auto-fill
    if (prop.amenities?.length > 0) setFlyerAmenities(prop.amenities);
    // Description + photos auto-fill (async)
    (async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) return;
        // Description
        const { data: descs } = await supabase.from("lens_descriptions").select("description, property_data").eq("user_id", u.id).order("created_at", { ascending: false }).limit(10);
        const propAddr = (prop.address || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (propAddr && descs?.length) {
          const match = descs.find((d: any) => { const pd = d.property_data; if (!pd) return false; const dAddr = (pd.address || pd.property_address || "").toLowerCase().replace(/[^a-z0-9]/g, ""); return dAddr && (dAddr.includes(propAddr) || propAddr.includes(dAddr)); });
          if (match?.description) { setPdfDescription(match.description); setFlyerDescription(match.description); }
        }
        // Flyer photos — try curated first, then order photos
        const { data: fullProp } = await supabase.from("agent_properties").select("website_curated, website_slug, website_published").eq("id", prop.id).single();
        const curated = fullProp?.website_curated as any;
        let photos: string[] = [];
        if (curated?.photos?.length > 0) {
          photos = curated.photos.slice(0, 7);
        }
        if (photos.length < 7) {
          const norm = (prop.address || "").toLowerCase().replace(/\bstreet\b/g, "st").replace(/\bavenue\b/g, "ave").replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr").replace(/\blane\b/g, "ln").replace(/\broad\b/g, "rd").replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();
          const { data: orders } = await supabase.from("orders").select("photos").eq("user_id", u.id).ilike("property_address", `${norm}%`).order("created_at", { ascending: false }).limit(3);
          (orders || []).forEach((o: any) => { if (Array.isArray(o.photos)) o.photos.forEach((p: any) => { if (p.secure_url && photos.length < 7 && !photos.includes(p.secure_url)) photos.push(p.secure_url); }); });
        }
        if (photos.length > 0) setFlyerPhotos(photos);
        // Auto-fill URLs
        if (fullProp?.website_published && fullProp?.website_slug) {
          setFlyerListingUrl(`https://${fullProp.website_slug}.p2v.homes`);
        }
      } catch { /* ok */ }
    })();
  };

  /* ─── Export helpers ─── */
  const prepareForExport = (el: HTMLElement): { restore: () => void } => {
    const parent = el.parentElement as HTMLElement;
    const st = el.style.transform, so = parent?.style.overflow, sw = parent?.style.width, sh = parent?.style.height;
    el.style.transform = "none";
    if (parent) { parent.style.overflow = "visible"; parent.style.width = `${rawW}px`; parent.style.height = `${rawH}px`; }
    return { restore: () => { el.style.transform = st; if (parent) { parent.style.overflow = so || ""; parent.style.width = sw || ""; parent.style.height = sh || ""; } } };
  };

  const handleExport = async () => {
    if (checkPaywall()) return; if (!previewRef.current) return; setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement; if (!el) return;
      const { restore } = prepareForExport(el);
      const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: activeTab === "property-pdf" ? "#ffffff" : null, width: rawW, height: rawH });
      restore();
      const link = document.createElement("a"); link.download = `p2v-${activeTab}-${Date.now()}.png`; link.href = canvas.toDataURL("image/png"); link.click();
      await incrementExportCounter();
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), "image/png"));
      const uploadedUrl = await uploadToCloudinary(new File([blob], `p2v-${activeTab}.png`, { type: "image/png" }), "design-studio/exports");
      await saveDesignExport(uploadedUrl, "png");
      notify("Design exported!");
    } catch (err) { console.error(err); alert("Export failed."); } finally { setExporting(false); }
  };

  const handlePdfExport = async () => {
    if (checkPaywall()) return; if (!previewRef.current) return; setExporting(true);
    try {
      const jsPDF = (await import("jspdf")).default; const html2canvas = (await import("html2canvas-pro")).default;
      const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
      for (let page = 0; page < pdfTotalPages; page++) {
        setPdfPreviewPage(page); await new Promise(r => setTimeout(r, 400));
        const el = previewRef.current!.querySelector("[data-export-target]") as HTMLElement; if (!el) continue;
        const { restore } = prepareForExport(el);
        const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", width: 2550, height: 3300 });
        restore(); if (page > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 8.5, 11);
      }
      pdf.save(`${pdfAddress.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30) || "property"}_sheet.pdf`);
      setPdfPreviewPage(0); await incrementExportCounter();
      const pdfBlob = pdf.output("blob");
      const uploadedUrl = await uploadToCloudinary(new File([pdfBlob], "property_sheet.pdf", { type: "application/pdf" }), "design-studio/exports");
      await saveDesignExport(uploadedUrl, "pdf"); notify("PDF exported!");
    } catch (err) { console.error(err); alert("PDF export failed."); } finally { setExporting(false); }
  };

  const handleFlyerPhotoUpload = async (file: File) => { if (flyerPhotos.length >= 7) return; setUploadingFlyerPhoto(true); const url = await uploadToCloudinary(file, "design-studio"); if (url) setFlyerPhotos(prev => [...prev, url]); setUploadingFlyerPhoto(false); };

  const handleFlyerPdfExport = async () => {
    if (checkPaywall()) return; if (!previewRef.current) return; setExporting(true);
    try {
      const jsPDF = (await import("jspdf")).default; const html2canvas = (await import("html2canvas-pro")).default;
      const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
      for (let page = 0; page < 2; page++) {
        setFlyerPreviewPage(page); await new Promise(r => setTimeout(r, 400));
        const el = previewRef.current!.querySelector("[data-export-target]") as HTMLElement; if (!el) continue;
        const { restore } = prepareForExport(el);
        const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", width: FLYER_W, height: FLYER_H });
        restore(); if (page > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 8.5, 11);
      }
      pdf.save(`${address.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30) || "listing"}_flyer.pdf`);
      setFlyerPreviewPage(0); await incrementExportCounter();
      const pdfBlob = pdf.output("blob");
      const uploadedUrl = await uploadToCloudinary(new File([pdfBlob], "listing_flyer.pdf", { type: "application/pdf" }), "design-studio/exports");
      await saveDesignExport(uploadedUrl, "pdf"); notify("Flyer exported!");
    } catch (err) { console.error(err); alert("Flyer export failed."); } finally { setExporting(false); }
  };

  const handleSaveBrandingCard = async () => {
    if (!previewRef.current || !user) return; setSavingBrandCard(true); setBrandCardSaved(false);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement; if (!el) return;
      const { restore } = prepareForExport(el);
      const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, width: currentBrandOrientation.width, height: currentBrandOrientation.height });
      restore();
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), "image/png"));
      const uploadedUrl = await uploadToCloudinary(new File([blob], `branding-card-${Date.now()}.png`, { type: "image/png" }), "design-studio/branding-cards");
      if (uploadedUrl) {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: existing } = await supabase.from("lens_usage").select("saved_branding_cards").eq("user_id", user.id).single();
        const cards = Array.isArray(existing?.saved_branding_cards) ? existing.saved_branding_cards : [];
        const updated = [uploadedUrl, ...cards].slice(0, 10);
        await supabase.from("lens_usage").upsert({ user_id: user.id, saved_branding_cards: updated }, { onConflict: "user_id" });
        await saveDesignExport(uploadedUrl, "png"); setBrandCardSaved(true); notify("Branding card saved!");
        setTimeout(() => setBrandCardSaved(false), 3000);
      }
    } catch (err) { console.error(err); alert("Failed to save branding card."); } finally { setSavingBrandCard(false); }
  };

  const getMusicSource = (): { type: "url"; url: string } | { type: "file"; file: File } | null => { if (overlayMusic.startsWith("library:")) { const parts = overlayMusic.split(":"); const url = parts.slice(2).join(":"); if (url) return { type: "url", url }; } if (overlayMusic === "custom" && customAudioFile) return { type: "file", file: customAudioFile }; return null; };

  const handleVideoExport = async () => {
    if (checkPaywall()) return;
    if (!selectedVideo?.url || !previewRef.current) { alert("Please select a video first."); return; }
    // Remind user about music if none selected
    if (!overlayMusic && !showMusicReminder) {
      setShowMusicReminder(true);
      return;
    }
    setShowMusicReminder(false);
    setVideoExporting(true); setVideoExportProgress(0); setVideoExportStatus("Loading video encoder...");
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg"); const { toBlobURL, fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg(); ffmpeg.on("progress", ({ progress: p }) => setVideoExportProgress(Math.min(Math.round(p * 100), 99)));
      setVideoExportStatus("Downloading encoder (~30 MB)..."); setVideoExportProgress(2);
      const coreBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({ coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript"), wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm") });
      setVideoExportStatus("Downloading source video..."); setVideoExportProgress(5);
      const videoData = await fetchFile(selectedVideo.url); await ffmpeg.writeFile("input.mp4", videoData);
      const musicSource = getMusicSource(); let hasMusic = false;
      if (musicSource) { setVideoExportStatus("Loading music track..."); setVideoExportProgress(8); if (musicSource.type === "url") { await ffmpeg.writeFile("music.mp3", await fetchFile(musicSource.url)); hasMusic = true; } else { await ffmpeg.writeFile("music.mp3", new Uint8Array(await musicSource.file.arrayBuffer())); hasMusic = true; } }
      setVideoExportStatus("Rendering overlay..."); setVideoExportProgress(10);
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement; if (!el) throw new Error("Export target not found");
      const videoEls = el.querySelectorAll("video"); videoEls.forEach(v => { (v as HTMLElement).style.opacity = "0"; });
      const placeholders = el.querySelectorAll("[data-video-area]"); placeholders.forEach(p => { (p as HTMLElement).style.opacity = "0"; });
      const { restore } = prepareForExport(el);
      const overlayCanvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, width: rawW, height: rawH });
      restore(); videoEls.forEach(v => { (v as HTMLElement).style.opacity = "1"; }); placeholders.forEach(p => { (p as HTMLElement).style.opacity = "1"; });
      const overlayBlob = await new Promise<Blob>(resolve => overlayCanvas.toBlob(b => resolve(b!), "image/png"));
      await ffmpeg.writeFile("overlay.png", new Uint8Array(await overlayBlob.arrayBuffer()));
      setVideoExportStatus(hasMusic ? "Compositing video with overlay & music..." : "Compositing video with overlay..."); setVideoExportProgress(15);
      const outW = currentSize.width, outH = currentSize.height;
      const photoPercent = selectedTemplate === "open-house" ? 100 : selectedSize === "postcard" ? 55 : 58;
      const photoH = Math.round(outH * photoPercent / 100);
      if (hasMusic) {
        await ffmpeg.exec(["-i", "input.mp4", "-i", "overlay.png", "-i", "music.mp3", "-t", "119", "-filter_complex", `[0:v]scale=${outW}:${photoH}:force_original_aspect_ratio=increase,crop=${outW}:${photoH},pad=${outW}:${outH}:0:0:black[bg];[bg][1:v]overlay=0:0[vout];[0:a]volume=0.3[orig];[2:a]volume=0.85,atrim=0:119,apad[mus];[orig][mus]amix=inputs=2:duration=shortest[aout]`, "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-y", "output.mp4"]);
      } else {
        await ffmpeg.exec(["-i", "input.mp4", "-i", "overlay.png", "-t", "119", "-filter_complex", `[0:v]scale=${outW}:${photoH}:force_original_aspect_ratio=increase,crop=${outW}:${photoH},pad=${outW}:${outH}:0:0:black[bg];[bg][1:v]overlay=0:0`, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-y", "output.mp4"]);
      }
      setVideoExportStatus("Finalizing..."); setVideoExportProgress(95);
      const outputData = await ffmpeg.readFile("output.mp4"); const outputBlob = new Blob([outputData], { type: "video/mp4" });
      const downloadUrl = URL.createObjectURL(outputBlob); const link = document.createElement("a"); link.download = `p2v-video-overlay-${Date.now()}.mp4`; link.href = downloadUrl; link.click(); URL.revokeObjectURL(downloadUrl);
      setVideoExportStatus("Saving..."); setVideoExportProgress(98);
      const uploadedUrl = await uploadToCloudinary(new File([outputBlob], "overlay-video.mp4", { type: "video/mp4" }), "design-studio/videos");
      if (uploadedUrl && user) { const supabase = (await import("@/lib/supabase/client")).createClient(); await supabase.from("orders").update({ overlay_video_url: uploadedUrl }).eq("order_id", selectedVideo.orderId); }
      setVideoExportProgress(100); setVideoExportStatus("Done!"); await incrementExportCounter(); await saveDesignExport(uploadedUrl, "mp4", uploadedUrl || undefined);
      setTimeout(() => setVideoExporting(false), 1500);
    } catch (err: any) { console.error("Video export error:", err); alert("Video export failed: " + (err.message || "Unknown error")); setVideoExporting(false); }
  };

  /* ─── Preview dimensions ─── */
  const getPreviewDims = useCallback(() => {
    let w: number, h: number;
    if (activeTab === "yard-sign") { w = currentYardSize.width; h = currentYardSize.height; }
    else if (activeTab === "property-pdf" || activeTab === "listing-flyer") { w = FLYER_W; h = FLYER_H; }
    else if (activeTab === "branding-card") { w = currentBrandOrientation.width; h = currentBrandOrientation.height; }
    else { w = currentSize.width; h = currentSize.height; }
    const maxW = 580, maxH = 560;
    const s = Math.min(maxW / w, maxH / h, 1) * (zoom / 100);
    return { scale: s, pW: w * s, pH: h * s, rawW: w, rawH: h };
  }, [activeTab, currentSize, currentYardSize, currentBrandOrientation, zoom]);

  const { scale, pW, pH, rawW, rawH } = getPreviewDims();

  /* ─── Video preview element ─── */
  const videoPreviewElement = selectedVideo ? (
    <div className="w-full h-full relative" data-video-area>
      <video ref={videoRef} src={clipUrls.length > 0 ? clipUrls[currentClipIndex] : selectedVideo.url} autoPlay loop={clipUrls.length <= 1} muted playsInline className="w-full h-full object-cover" crossOrigin="anonymous" onEnded={() => { if (clipUrls.length > 1) setCurrentClipIndex((currentClipIndex + 1) % clipUrls.length); }} />
      {clipUrls.length > 1 && <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, pointerEvents: "none" }}>Clip {currentClipIndex + 1}/{clipUrls.length}</div>}
    </div>
  ) : undefined;

  /* ─── Canvas content ─── */
  const renderPreview = () => {
    const isVideoTab = activeTab === "video-remix";
    const photo = (isVideoTab || mediaMode === "video") ? null : listingPhoto;
    const videoEl = (isVideoTab || mediaMode === "video") ? videoPreviewElement : undefined;

    if (activeTab === "templates" || activeTab === "video-remix") {
      if (selectedTemplate === "open-house") return <OpenHouseTemplate size={currentSize} listingPhoto={photo} videoElement={videoEl} headshot={headshot} logo={logo} address={address} beds={beds} baths={baths} sqft={sqft} price={price} date={date} time={time} agentName={agentName} phone={phone} brokerage={brokerage} fontFamily={listingFontFamily} barColor={listingBarColor} accentColor={listingAccentColor} />;
      return <InfoBarTemplate size={currentSize} listingPhoto={photo} videoElement={videoEl} headshot={headshot} logo={logo} address={address} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} badgeText={badge.text} badgeColor={badge.color} fontFamily={listingFontFamily} barColor={listingBarColor} accentColor={listingAccentColor} />;
    }
    if (activeTab === "yard-sign") {
      const ys = { width: currentYardSize.width, height: currentYardSize.height, headshot, logo, agentName, phone, email: agentEmail, brokerage, headerText: yardHeaderText, fontFamily: listingFontFamily, qrDataUrl: yardQrDataUrl, bulletPoints: [yardBullet1, yardBullet2, yardBullet3] };
      if (yardDesign === "sidebar") return <YardSignSidebar {...ys} website={yardWebsite} sidebarColor={yardSidebarColor} mainBgColor={yardMainBgColor} />;
      if (yardDesign === "top-heavy") return <YardSignTopHeavy {...ys} topColor={yardTopColor} bottomColor={yardBottomColor} />;
      return <YardSignSplitBar {...ys} officeName={yardOfficeName} officePhone={yardOfficePhone} topColor={yardTopColor} bottomColor={yardBottomColor} />;
    }
    if (activeTab === "property-pdf") return <PropertyPdfPage pageNumber={pdfPreviewPage} address={pdfAddress} cityStateZip={pdfCityStateZip} price={pdfPrice} beds={pdfBeds} baths={pdfBaths} sqft={pdfSqft} description={pdfDescription} features={pdfFeatures} photos={pdfPhotos} accentColor={pdfAccentColor} fontFamily={listingFontFamily} />;
    if (activeTab === "listing-flyer") return <ListingFlyerPage pageNumber={flyerPreviewPage} photos={flyerPhotos} address={address} cityStateZip={[pdfCityStateZip || ""].filter(Boolean).join("")} beds={beds} baths={baths} sqft={sqft} price={price} amenities={flyerAmenities} description={flyerDescription} listingUrl={flyerListingUrl} videoUrl={flyerVideoUrl} stagingUrl={flyerStagingUrl} accentColor={flyerAccentColor} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} headshot={headshot} logo={logo} fontFamily={listingFontFamily} brandingCardUrl={null} />;
    if (activeTab === "branding-card") return <BrandingCardTemplate orientation={currentBrandOrientation} logo={brandLogo} headshot={brandHeadshot} agentName={brandAgentName} phone={brandPhone} email={brandEmail} brokerage={brandBrokerage} tagline={brandTagline} website={brandWebsite} address={brandAddress} cityState={brandCityState} price={brandPrice} features={brandFeatures} bgColor={brandBgColor} accentColor={brandAccentColor} bgPhoto={brandBgPhoto} fontFamily={brandFontFamily} />;
    return null;
  };

  /* ═══════════════════════════════════════════════════════
     AUTH GATES
     ═══════════════════════════════════════════════════════ */
  if (authLoading) return (<div className="min-h-screen bg-background"><Navigation /><div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></div>);

  if (!user) return (
    <div className="min-h-screen bg-background"><Navigation />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center"><div className="bg-card rounded-2xl border border-border p-10 space-y-5">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center"><LogIn className="h-8 w-8 text-muted-foreground" /></div>
        <h1 className="text-2xl font-extrabold text-foreground">Sign In to Use the Design Studio</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Create a free account to try the Marketing Design Studio. Your first 3 exports are free — no subscription required.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base"><Link href="/login?redirect=/dashboard/lens/design-studio"><LogIn className="mr-2 h-4 w-4" />Sign In</Link></Button>
          <Button asChild variant="outline" className="px-8 py-6 text-base"><Link href="/lens">Learn About P2V Lens</Link></Button>
        </div>
      </div></div>
    </div>
  );

  if (paywallHit) return (
    <div className="min-h-screen bg-background"><Navigation />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center"><div className="bg-card rounded-2xl border border-border p-10 space-y-5">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center"><Lock className="h-8 w-8 text-accent" /></div>
        <h1 className="text-2xl font-extrabold text-foreground">You&apos;ve Used Your 3 Free Exports</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Subscribe to P2V Lens for unlimited design exports, plus AI photo coaching, listing descriptions, virtual staging, and more.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base"><Link href="/lens"><Sparkles className="mr-2 h-4 w-4" />Subscribe to P2V Lens</Link></Button>
          <Button variant="outline" className="px-8 py-6 text-base" onClick={() => setPaywallHit(false)}>Back to Studio</Button>
        </div>
      </div></div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     MAIN STUDIO RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <><style>{STUDIO_CSS}</style>
    {videoExporting && <VideoExportModal progress={videoExportProgress} status={videoExportStatus} onCancel={() => setVideoExporting(false)} />}

    {/* Exit confirmation dialog */}
    {showExitDialog && (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
        <div style={{ background: "var(--ss)", borderRadius: 20, border: "1px solid var(--sbr)", padding: 28, maxWidth: 380, width: "calc(100% - 32px)", fontFamily: "var(--sf)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--sag)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Save size={22} color="var(--sa)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--st)", margin: 0 }}>Save before leaving?</h3>
              <p style={{ fontSize: 12, color: "var(--std)", margin: 0, marginTop: 2 }}>Your current design will be saved as a draft.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleExitWithSave}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, var(--sa), #7c3aed)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sf)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Save size={14} /> Save & Exit
            </button>
            <button onClick={handleExitWithoutSave}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--sbr)", background: "none", color: "var(--std)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sf)" }}>
              Don&apos;t Save
            </button>
          </div>
          <button onClick={() => setShowExitDialog(false)}
            style={{ width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8, border: "none", background: "none", color: "var(--std)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--sf)" }}>
            Cancel
          </button>
        </div>
      </div>
    )}
    <div className="sr">
      {/* ─── TOP BAR ─── */}
      <div className="st">
        {/* Exit button */}
        <button onClick={handleExit} className="bi" title="Exit Studio" style={{ marginRight: 4 }}>
          <ArrowLeft size={16} />
        </button>
        <div className="slg">
          <div className="slm"><Sparkles size={14} color="#fff" /></div>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg,#e0f2fe,#c7d2fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>P2V Design Studio</span>
        </div>
        <div className="stb">{TABS.map(t => <button key={t.id} className={`stbi ${activeTab === t.id ? "ac" : ""}`} onClick={() => setActiveTab(t.id)}><t.icon size={13} />{t.label}</button>)}</div>
        {/* Property selector in top bar */}
        <div style={{ marginLeft: 10, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, padding: "4px 12px 4px 10px", borderRadius: 10, border: selectedPropertyId ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(99,102,241,0.2)", background: selectedPropertyId ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)", transition: "all 0.2s" }}>
          <Home size={14} color="#818cf8" style={{ flexShrink: 0 }} />
          <select className="ps" value={selectedPropertyId || ""} onChange={e => handleSelectProperty(e.target.value)} style={{ width: 200, fontSize: 12, fontWeight: 600, color: selectedPropertyId ? "#e0e7ff" : "rgba(255,255,255,0.5)", background: "transparent", border: "none", padding: "6px 0", cursor: "pointer" }}>
            <option value="" style={{ background: "#1a1a2e", color: "rgba(255,255,255,0.5)" }}>⌂ Select property...</option>
            {userProperties.map((p: any) => <option key={p.id} value={p.id} style={{ background: "#1a1a2e", color: "#e0e7ff" }}>{p.address}{p.city ? `, ${p.city}` : ""}</option>)}
            <option value="__new__" style={{ background: "#1a1a2e", color: "#818cf8" }}>＋ Enter manually</option>
          </select>
        </div>
        <div className="ssp" />
        <div className="sac">
          {/* Status badge */}
          {isAdmin ? <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "3px 8px", borderRadius: 6, marginRight: 4 }}>ADMIN</span>
            : isSubscriber ? <span style={{ fontSize: 9, fontWeight: 700, color: "#0ea5e9", background: "rgba(14,165,233,0.15)", padding: "3px 8px", borderRadius: 6, marginRight: 4 }}>PRO</span>
            : <span style={{ fontSize: 9, fontWeight: 700, color: "var(--std)", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 6, marginRight: 4 }}>{FREE_EXPORT_LIMIT - freeExportsUsed} free</span>}
          {/* Save draft button */}
          <button className="bi" onClick={saveDraft} title="Save Draft" style={{ position: "relative" }}>
            {hasSavedDraft ? <Check size={15} color="var(--suc)" /> : <Save size={15} />}
          </button>
          <button className="bx" onClick={activeTab === "property-pdf" ? handlePdfExport : activeTab === "listing-flyer" ? handleFlyerPdfExport : (activeTab === "video-remix" || (activeTab === "templates" && mediaMode === "video" && selectedVideo)) ? handleVideoExport : handleExport} disabled={exporting || videoExporting}>
            {exporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Export</>}
          </button>
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="sb">
        {/* Left icon rail */}
        <div className="slr">{currentPanels.map(p => <button key={p.id} className={`rb ${leftPanel === p.id ? "ac" : ""}`} onClick={() => setLeftPanel(p.id)}><p.icon size={18} /><span>{p.label}</span></button>)}</div>

        {/* Left panel */}
        <div className="slp">
          {/* ═══ LISTING GRAPHICS PANELS ═══ */}
          {activeTab === "templates" && leftPanel === "templates" && <>
            <div className="ph"><LayoutTemplate size={15} color="var(--sa)" /> Templates</div>
            <div style={{ padding: 14 }}>
              <div className="tg">{TEMPLATES.map(t => <button key={t.id} className={`tc ${selectedTemplate === t.id ? "ac" : ""}`} onClick={() => setSelectedTemplate(t.id)}><div className="tiw" style={{ background: `${t.color}20` }}><t.icon size={18} color={t.color} /></div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--st)" }}>{t.label}</div></button>)}</div>
            </div>
          </>}

          {activeTab === "templates" && leftPanel === "uploads" && <>
            <div className="ph"><Upload size={15} color="var(--sa)" /> Media</div>
            <div style={{ padding: 14 }}>
              {/* Image/Video toggle */}
              <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 14 }}>
                <button onClick={() => { setMediaMode("image"); setSelectedVideo(null); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", background: mediaMode === "image" ? "var(--sa)" : "none", color: mediaMode === "image" ? "#fff" : "var(--std)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sf)" }}><ImageIcon size={14} /> Image</button>
                <button onClick={() => { setMediaMode("video"); setListingPhoto(null); loadUserVideos(); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", background: mediaMode === "video" ? "var(--sa)" : "none", color: mediaMode === "video" ? "#fff" : "var(--std)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sf)" }}><Play size={14} /> Video</button>
              </div>
              {mediaMode === "image" && <UploadZone label="Listing Photo" imageUrl={listingPhoto} onUpload={f => handleUpload(f, "design-studio", setListingPhoto, setUploadingListing)} onClear={() => setListingPhoto(null)} uploading={uploadingListing} />}
              {mediaMode === "video" && <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 10 }}><Film size={13} color="#f59e0b" /><span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>Video exports limited to 119s</span></div>
                {clipUrls.length > 0 && <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", marginBottom: 10 }}><span style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 600 }}>{clipUrls.length} clip{clipUrls.length !== 1 ? "s" : ""} loaded</span></div>}
                {loadingVideos ? <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={18} className="animate-spin" color="var(--std)" /></div> : userVideos.length === 0 ? <p style={{ fontSize: 11, color: "var(--std)", textAlign: "center", padding: 16 }}>No completed videos found.</p> : (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {userVideos.map(v => (
                      <button key={v.orderId} onClick={() => { setSelectedVideo(v); if (v.thumbnail) setListingPhoto(v.thumbnail); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, border: selectedVideo?.orderId === v.orderId ? "1px solid var(--sa)" : "1px solid transparent", background: selectedVideo?.orderId === v.orderId ? "var(--sag)" : "none", cursor: "pointer", marginBottom: 3, fontFamily: "var(--sf)" }}>
                        <div style={{ width: 40, height: 30, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.04)" }}>
                          {v.thumbnail ? <img src={v.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Play size={14} color="var(--std)" style={{ margin: "8px auto", display: "block" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}><p style={{ fontSize: 11, fontWeight: 600, color: "var(--st)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Order {v.orderId?.slice(0, 8)}</p><p style={{ fontSize: 10, color: "var(--std)", margin: 0 }}>{v.date}</p></div>
                        {selectedVideo?.orderId === v.orderId && <Check size={14} color="var(--sa)" />}
                      </button>
                    ))}
                  </div>
                )}
              </>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <UploadZone label="Headshot" imageUrl={headshot} onUpload={f => handleHeadshotUpload(f, setHeadshot, setUploadingHeadshot)} onClear={() => setHeadshot(null)} uploading={uploadingHeadshot} compact savedUrl={savedHeadshot} onUseSaved={() => { setHeadshot(savedHeadshot); setBrandHeadshot(savedHeadshot); }} />
                <UploadZone label="Logo" imageUrl={logo} onUpload={f => handleLogoUpload(f, setLogo, setUploadingLogo)} onClear={() => setLogo(null)} uploading={uploadingLogo} compact savedUrl={savedLogo} onUseSaved={() => { setLogo(savedLogo); setBrandLogo(savedLogo); }} />
              </div>
            </div>
          </>}

          {activeTab === "templates" && leftPanel === "text" && <>
            <div className="ph"><Type size={15} color="var(--sa)" /> Details</div>
            <Section title="Property" icon={Home}><div className="fg"><label className="fl">Address</label><input className="fi" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Beds</label><input className="fi" value={beds} onChange={e => setBeds(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Baths</label><input className="fi" value={baths} onChange={e => setBaths(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Sq Ft</label><input className="fi" value={sqft} onChange={e => setSqft(e.target.value)} /></div></div><div className="fg"><label className="fl">Price</label><input className="fi" value={price} onChange={e => setPrice(e.target.value)} /></div>{selectedTemplate === "open-house" && <div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Date</label><input className="fi" value={date} onChange={e => setDate(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Time</label><input className="fi" value={time} onChange={e => setTime(e.target.value)} /></div></div>}</Section>
            <Section title="Agent" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e => setAgentName(e.target.value)} /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e => setBrokerage(e.target.value)} /></div></div></Section>
          </>}

          {activeTab === "templates" && leftPanel === "styles" && <>
            <div className="ph"><Palette size={15} color="var(--sa)" /> Styles</div>
            <Section title="Font" icon={Type}>{FONT_OPTIONS.map(f => <button key={f.id} className={`fo ${listingFont === f.id ? "ac" : ""}`} onClick={() => setListingFont(f.id)}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--std)", fontFamily: "var(--sf)" }}>{f.label}</div><div style={{ fontSize: 17, color: "var(--st)", marginTop: 1, fontFamily: f.family }}>{f.sample}</div></button>)}</Section>
            <Section title="Info Bar Color" icon={Paintbrush}><ColorPicker value={listingBarColor} onChange={setListingBarColor} /><div style={{ marginTop: 10 }}><span className="fl">Brokerage Presets</span><SwatchGrid colors={BROKERAGE_COLORS} current={listingBarColor} onSelect={setListingBarColor} showLabels /></div></Section>
            <Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={listingAccentColor || "#ffffff"} onChange={setListingAccentColor} />{listingAccentColor && <button onClick={() => setListingAccentColor("")} style={{ marginTop: 6, background: "none", border: "none", color: "var(--std)", fontSize: 11, cursor: "pointer", textDecoration: "underline", fontFamily: "var(--sf)" }}>Clear</button>}<div style={{ marginTop: 10 }}><SwatchGrid colors={ACCENT_COLORS} current={listingAccentColor} onSelect={setListingAccentColor} /></div></Section>
          </>}

          {/* ═══ VIDEO REMIX PANELS ═══ */}
          {activeTab === "video-remix" && leftPanel === "uploads" && <>
            <div className="ph"><Film size={15} color="var(--sa)" /> Video Source</div>
            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 10 }}><Film size={13} color="#f59e0b" /><span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>Video exports limited to 119s</span></div>

              {/* Currently loaded clips indicator */}
              {clipUrls.length > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 600 }}>▶ {clipUrls.length} clip{clipUrls.length !== 1 ? "s" : ""} active</span>
                  <button onClick={() => { setClipUrls([]); setSelectedVideo(null); setCurrentClipIndex(0); }} style={{ fontSize: 10, color: "rgba(139,92,246,0.7)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sf)", fontWeight: 600 }}>Clear</button>
                </div>
              )}

              {/* ─── CLIPS SECTION ─── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--st)" }}>Individual Clips</span>
                  <button onClick={loadOrderClips} style={{ fontSize: 10, color: "var(--sa)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sf)", fontWeight: 600 }}>
                    {orderClips.length > 0 ? "Refresh" : "Load Clips"}
                  </button>
                </div>

                {loadingClips ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Loader2 size={18} className="animate-spin" color="var(--std)" /></div>
                ) : orderClips.length > 0 ? (
                  <>
                    <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {orderClips.map((clip, i) => {
                          const sel = selectedClipIndices.has(i);
                          const selOrder = sel ? Array.from(selectedClipIndices).sort((a, b) => a - b).indexOf(i) + 1 : 0;
                          const pTh = clip.photoUrl?.includes("/upload/") ? clip.photoUrl.replace("/upload/", "/upload/w_200,h_112,c_fill/") : null;
                          const vTh = clip.clipUrl.includes("cloudinary.com") && clip.clipUrl.includes("/video/upload/") ? clip.clipUrl.replace("/video/upload/", "/video/upload/so_1,w_200,h_112,c_fill,f_jpg/").replace(/\.(mp4|mov|webm)$/i, ".jpg") : null;
                          const th = pTh || vTh;
                          return (
                            <button key={`clip-${clip.orderId}-${clip.index}`} onClick={() => handleSelectClip(i)}
                              style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: sel ? "2px solid #8b5cf6" : "2px solid var(--sbr)", background: "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                              <div style={{ aspectRatio: "16/9", background: "#000" }}>
                                {th ? <img src={th} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={16} color="rgba(255,255,255,0.2)" /></div>}
                              </div>
                              {sel && <div style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{selOrder}</div>}
                              {clip.cameraDirection && <span style={{ position: "absolute", top: 4, left: 4, fontSize: 8, fontWeight: 700, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "1px 5px", borderRadius: 4 }}>{clip.cameraDirection.replace(/_/g, " ")}</span>}
                              <div style={{ padding: "4px 6px" }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--st)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.description}</p>
                                <p style={{ fontSize: 9, color: "var(--std)", margin: 0 }}>{clip.orderDate}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {selectedClipIndices.size > 0 && (
                      <button onClick={applySelectedClips}
                        style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sf)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Play size={14} /> Use {selectedClipIndices.size} Clip{selectedClipIndices.size !== 1 ? "s" : ""}
                      </button>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 10, color: "var(--std)", textAlign: "center", padding: "10px 0" }}>Click "Load Clips" to browse your video clips</p>
                )}
              </div>

              {/* ─── FULL VIDEOS SECTION ─── */}
              <div style={{ borderTop: "1px solid var(--sbr)", paddingTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--st)" }}>Full Videos</span>
                  <button onClick={loadUserVideos} style={{ fontSize: 10, color: "var(--sa)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sf)", fontWeight: 600 }}>
                    {userVideos.length > 0 ? "Refresh" : "Load Videos"}
                  </button>
                </div>
                {loadingVideos ? <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Loader2 size={18} className="animate-spin" color="var(--std)" /></div> : (
                  <div style={{ maxHeight: 180, overflowY: "auto" }}>
                    {userVideos.map(v => (
                      <button key={v.orderId} onClick={() => { setSelectedVideo(v); setMediaMode("video"); setClipUrls([]); setSelectedClipIndices(new Set()); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, border: selectedVideo?.orderId === v.orderId && clipUrls.length === 0 ? "1px solid var(--sa)" : "1px solid transparent", background: selectedVideo?.orderId === v.orderId && clipUrls.length === 0 ? "var(--sag)" : "none", cursor: "pointer", marginBottom: 3, fontFamily: "var(--sf)" }}>
                        <div style={{ width: 40, height: 30, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.04)" }}>
                          {v.thumbnail ? <img src={v.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Play size={14} color="var(--std)" style={{ margin: "8px auto", display: "block" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}><p style={{ fontSize: 11, fontWeight: 600, color: "var(--st)", margin: 0 }}>Order {v.orderId?.slice(0, 8)}</p><p style={{ fontSize: 10, color: "var(--std)", margin: 0 }}>{v.date}</p></div>
                        {selectedVideo?.orderId === v.orderId && clipUrls.length === 0 && <Check size={14} color="var(--sa)" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14, borderTop: "1px solid var(--sbr)", paddingTop: 12 }}>
                <UploadZone label="Headshot" imageUrl={headshot} onUpload={f => handleHeadshotUpload(f, setHeadshot, setUploadingHeadshot)} onClear={() => setHeadshot(null)} uploading={uploadingHeadshot} compact savedUrl={savedHeadshot} onUseSaved={() => { setHeadshot(savedHeadshot); setBrandHeadshot(savedHeadshot); }} />
                <UploadZone label="Logo" imageUrl={logo} onUpload={f => handleLogoUpload(f, setLogo, setUploadingLogo)} onClear={() => setLogo(null)} uploading={uploadingLogo} compact savedUrl={savedLogo} onUseSaved={() => { setLogo(savedLogo); setBrandLogo(savedLogo); }} />
              </div>
            </div>
          </>}

          {activeTab === "video-remix" && leftPanel === "text" && <>
            <div className="ph"><Type size={15} color="var(--sa)" /> Overlay Details</div>
            <Section title="Template" icon={LayoutTemplate}><div className="tg">{TEMPLATES.map(t => <button key={t.id} className={`tc ${selectedTemplate === t.id ? "ac" : ""}`} onClick={() => setSelectedTemplate(t.id)}><div className="tiw" style={{ background: `${t.color}20` }}><t.icon size={18} color={t.color} /></div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--st)" }}>{t.label}</div></button>)}</div></Section>
            <Section title="Property" icon={Home}><div className="fg"><label className="fl">Address</label><input className="fi" value={address} onChange={e => setAddress(e.target.value)} /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Beds</label><input className="fi" value={beds} onChange={e => setBeds(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Baths</label><input className="fi" value={baths} onChange={e => setBaths(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Sq Ft</label><input className="fi" value={sqft} onChange={e => setSqft(e.target.value)} /></div></div><div className="fg"><label className="fl">Price</label><input className="fi" value={price} onChange={e => setPrice(e.target.value)} /></div>{selectedTemplate === "open-house" && <div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Date</label><input className="fi" value={date} onChange={e => setDate(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Time</label><input className="fi" value={time} onChange={e => setTime(e.target.value)} /></div></div>}</Section>
            <Section title="Agent" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e => setAgentName(e.target.value)} /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e => setBrokerage(e.target.value)} /></div></div></Section>
          </>}

          {activeTab === "video-remix" && leftPanel === "styles" && <>
            <div className="ph"><Palette size={15} color="var(--sa)" /> Styles</div>
            <Section title="Font" icon={Type}>{FONT_OPTIONS.map(f => <button key={f.id} className={`fo ${listingFont === f.id ? "ac" : ""}`} onClick={() => setListingFont(f.id)}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--std)" }}>{f.label}</div><div style={{ fontSize: 17, color: "var(--st)", marginTop: 1, fontFamily: f.family }}>{f.sample}</div></button>)}</Section>
            <Section title="Info Bar Color" icon={Paintbrush}><ColorPicker value={listingBarColor} onChange={setListingBarColor} /><div style={{ marginTop: 10 }}><SwatchGrid colors={BROKERAGE_COLORS} current={listingBarColor} onSelect={setListingBarColor} showLabels /></div></Section>
            <Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={listingAccentColor || "#ffffff"} onChange={setListingAccentColor} />{listingAccentColor && <button onClick={() => setListingAccentColor("")} style={{ marginTop: 6, background: "none", border: "none", color: "var(--std)", fontSize: 11, cursor: "pointer", textDecoration: "underline", fontFamily: "var(--sf)" }}>Clear</button>}<div style={{ marginTop: 10 }}><SwatchGrid colors={ACCENT_COLORS} current={listingAccentColor} onSelect={setListingAccentColor} /></div></Section>
          </>}

          {activeTab === "video-remix" && leftPanel === "music" && <CompactMusicPanel selectedTrack={overlayMusic} onSelect={(v) => { setOverlayMusic(v); if (v) setShowMusicReminder(false); }} customAudioFile={customAudioFile} onCustomAudioChange={setCustomAudioFile} />}

          {/* ═══ YARD SIGN PANELS ═══ */}
          {activeTab === "yard-sign" && leftPanel === "design" && <><div className="ph"><LayoutTemplate size={15} color="var(--sa)" /> Yard Sign Design</div><div style={{ padding: 14 }}><div className="tg" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>{YARD_SIGN_DESIGNS.map(d => <button key={d.id} className={`tc ${yardDesign === d.id ? "ac" : ""}`} onClick={() => setYardDesign(d.id)}><div style={{ fontSize: 11, fontWeight: 700, color: "var(--st)" }}>{d.label}</div><div style={{ fontSize: 9, color: "var(--std)", marginTop: 2 }}>{d.desc}</div></button>)}</div><div style={{ marginTop: 14 }}><span className="fl">Sign Size</span><div className="fr" style={{ marginTop: 4 }}>{YARD_SIGN_SIZES.map(s => <button key={s.id} className={`sp ${yardSignSize === s.id ? "ac" : ""}`} style={{ flex: 1, padding: "8px 0", textAlign: "center" }} onClick={() => setYardSignSize(s.id)}>{s.label}</button>)}</div></div></div></>}

          {activeTab === "yard-sign" && leftPanel === "uploads" && <><div className="ph"><Upload size={15} color="var(--sa)" /> Images</div><div style={{ padding: 14 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f => handleHeadshotUpload(f, setHeadshot, setUploadingHeadshot)} onClear={() => setHeadshot(null)} uploading={uploadingHeadshot} compact savedUrl={savedHeadshot} onUseSaved={() => { setHeadshot(savedHeadshot); setBrandHeadshot(savedHeadshot); }} /><UploadZone label="Logo" imageUrl={logo} onUpload={f => handleLogoUpload(f, setLogo, setUploadingLogo)} onClear={() => setLogo(null)} uploading={uploadingLogo} compact savedUrl={savedLogo} onUseSaved={() => { setLogo(savedLogo); setBrandLogo(savedLogo); }} /></div></div></>}

          {activeTab === "yard-sign" && leftPanel === "text" && <><div className="ph"><Type size={15} color="var(--sa)" /> Sign Details</div>
            <Section title="Header & Agent" icon={User}><div className="fg"><label className="fl">Header Text</label><input className="fi" value={yardHeaderText} onChange={e => setYardHeaderText(e.target.value)} /></div><div className="fg"><label className="fl">Agent Name</label><input className="fi" value={agentName} onChange={e => setAgentName(e.target.value)} /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Email</label><input className="fi" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} /></div></div><div className="fg"><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e => setBrokerage(e.target.value)} /></div>
              {yardDesign === "split-bar" && <div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Office Name</label><input className="fi" value={yardOfficeName} onChange={e => setYardOfficeName(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Office Phone</label><input className="fi" value={yardOfficePhone} onChange={e => setYardOfficePhone(e.target.value)} /></div></div>}
              {yardDesign === "sidebar" && <div className="fg"><label className="fl">Website</label><input className="fi" value={yardWebsite} onChange={e => setYardWebsite(e.target.value)} /></div>}
              <div className="fg"><label className="fl">QR Code URL</label><input className="fi" value={yardQrUrl} onChange={e => setYardQrUrl(e.target.value)} placeholder="https://..." /></div>
            </Section>
            <Section title="Property Highlights" icon={Home}><div className="fg"><input className="fi" value={yardBullet1} onChange={e => setYardBullet1(e.target.value)} placeholder="e.g. 3 BDR / 2 BTH" /></div><div className="fg"><input className="fi" value={yardBullet2} onChange={e => setYardBullet2(e.target.value)} placeholder="e.g. Pool & Spa" /></div><div className="fg"><input className="fi" value={yardBullet3} onChange={e => setYardBullet3(e.target.value)} placeholder="e.g. Ocean View" /></div></Section>
          </>}

          {activeTab === "yard-sign" && leftPanel === "styles" && <><div className="ph"><Palette size={15} color="var(--sa)" /> Colors</div>
            {yardDesign === "split-bar" && <><Section title="Top Bar" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels /></div></Section><Section title="Bottom Bar" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels /></div></Section></>}
            {yardDesign === "sidebar" && <><Section title="Sidebar Color" icon={Paintbrush}><ColorPicker value={yardSidebarColor} onChange={setYardSidebarColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={yardSidebarColor} onSelect={setYardSidebarColor} showLabels /></div></Section><Section title="Main Background" icon={Paintbrush}><ColorPicker value={yardMainBgColor} onChange={setYardMainBgColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={yardMainBgColor} onSelect={setYardMainBgColor} showLabels /></div></Section></>}
            {yardDesign === "top-heavy" && <><Section title="Top Section" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels /></div></Section><Section title="Bottom Section" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels /></div></Section></>}
          </>}

          {/* ═══ PROPERTY PDF PANELS ═══ */}
          {activeTab === "property-pdf" && leftPanel === "text" && <><div className="ph"><Type size={15} color="var(--sa)" /> Property Details</div>
            <Section title="Address & Price" icon={MapPin}><div className="fg"><label className="fl">Address</label><input className="fi" value={pdfAddress} onChange={e => setPdfAddress(e.target.value)} /></div><div className="fg"><label className="fl">City, State, Zip</label><input className="fi" value={pdfCityStateZip} onChange={e => setPdfCityStateZip(e.target.value)} /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Price</label><input className="fi" value={pdfPrice} onChange={e => setPdfPrice(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Beds</label><input className="fi" value={pdfBeds} onChange={e => setPdfBeds(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Baths</label><input className="fi" value={pdfBaths} onChange={e => setPdfBaths(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Sq Ft</label><input className="fi" value={pdfSqft} onChange={e => setPdfSqft(e.target.value)} /></div></div></Section>
            <Section title="Description" icon={FileText} defaultOpen={false}><textarea className="ta" rows={6} value={pdfDescription} onChange={e => setPdfDescription(e.target.value)} placeholder="Property description..." /></Section>
            <Section title="Key Features" icon={Sparkles}><textarea className="ta" rows={6} value={pdfFeatures} onChange={e => setPdfFeatures(e.target.value)} placeholder="One feature per line..." /></Section>
          </>}

          {activeTab === "property-pdf" && leftPanel === "photos" && <><div className="ph"><ImageIcon size={15} color="var(--sa)" /> Photos ({pdfPhotos.length}/25)</div><div style={{ padding: 14 }}>
            <p style={{ fontSize: 11, color: "var(--std)", marginBottom: 10 }}>First 3 photos appear on page 1. Remaining fill grids.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>{pdfPhotos.map((url, i) => <div key={i} className="group" style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--sbr)" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{i < 3 ? `★${i + 1}` : i + 1}</div><button className="ghov" onClick={() => setPdfPhotos(p => p.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}><X size={10} /></button></div>)}
              {pdfPhotos.length < 25 && <label style={{ aspectRatio: "1", borderRadius: 8, border: "2px dashed var(--sbr)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", color: "var(--std)" }}>{uploadingPdfPhoto ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /><span style={{ fontSize: 9, fontWeight: 600 }}>Add</span></>}<input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { Array.from(e.target.files || []).forEach(f => handlePdfPhotoUpload(f)); e.target.value = ""; }} /></label>}
            </div>
          </div></>}

          {activeTab === "property-pdf" && leftPanel === "styles" && <><div className="ph"><Palette size={15} color="var(--sa)" /> Accent Color</div>
            <Section title="Color" icon={Paintbrush}><ColorPicker value={pdfAccentColor} onChange={setPdfAccentColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={pdfAccentColor} onSelect={setPdfAccentColor} showLabels /></div><div style={{ marginTop: 10 }}><SwatchGrid colors={ACCENT_COLORS} current={pdfAccentColor} onSelect={setPdfAccentColor} /></div></Section>
          </>}

          {/* ═══ LISTING FLYER PANELS ═══ */}
          {activeTab === "listing-flyer" && leftPanel === "photos" && <><div className="ph"><ImageIcon size={15} color="var(--sa)" /> Photos ({flyerPhotos.length}/7)</div><div style={{ padding: 14 }}>
            <p style={{ fontSize: 11, color: "var(--std)", marginBottom: 10 }}>Up to 7 photos. First photo is the hero. Select a property to auto-load.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>{flyerPhotos.map((url, i) => <div key={i} className="group" style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--sbr)" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{i === 0 ? "★ Hero" : i + 1}</div><button className="ghov" onClick={() => setFlyerPhotos(p => p.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}><X size={10} /></button></div>)}
              {flyerPhotos.length < 7 && <label style={{ aspectRatio: "1", borderRadius: 8, border: "2px dashed var(--sbr)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", color: "var(--std)" }}>{uploadingFlyerPhoto ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /><span style={{ fontSize: 9, fontWeight: 600 }}>Add</span></>}<input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { Array.from(e.target.files || []).forEach(f => handleFlyerPhotoUpload(f)); e.target.value = ""; }} /></label>}
            </div>
          </div></>}

          {activeTab === "listing-flyer" && leftPanel === "text" && <><div className="ph"><Type size={15} color="var(--sa)" /> Flyer Details</div>
            <Section title="Property" icon={Home}>
              <div className="fg"><label className="fl">Address</label><input className="fi" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" /></div>
              <div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Beds</label><input className="fi" value={beds} onChange={e => setBeds(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Baths</label><input className="fi" value={baths} onChange={e => setBaths(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Sq Ft</label><input className="fi" value={sqft} onChange={e => setSqft(e.target.value)} /></div></div>
              <div className="fg"><label className="fl">Price</label><input className="fi" value={price} onChange={e => setPrice(e.target.value)} /></div>
            </Section>
            <Section title="Description" icon={FileText} defaultOpen={false}>
              <textarea className="ta" rows={6} value={flyerDescription} onChange={e => setFlyerDescription(e.target.value)} placeholder="Listing description (truncated to ~300 chars on page 1, full on page 2)..." />
            </Section>
            <Section title="Agent" icon={User}>
              <div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e => setAgentName(e.target.value)} /></div>
              <div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Email</label><input className="fi" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} /></div></div>
              <div className="fg"><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e => setBrokerage(e.target.value)} /></div>
            </Section>
          </>}

          {activeTab === "listing-flyer" && leftPanel === "links" && <><div className="ph"><Globe size={15} color="var(--sa)" /> URLs & Links</div>
            <div style={{ padding: 14 }}>
              <p style={{ fontSize: 11, color: "var(--std)", marginBottom: 12 }}>Leave blank to hide that section on the flyer. Auto-fills from property data if available.</p>
              <div className="fg"><label className="fl">Listing URL (QR + link)</label><input className="fi" value={flyerListingUrl} onChange={e => setFlyerListingUrl(e.target.value)} placeholder="https://123-main-st.p2v.homes" /></div>
              <div className="fg"><label className="fl">Video Tour URL</label><input className="fi" value={flyerVideoUrl} onChange={e => setFlyerVideoUrl(e.target.value)} placeholder="https://youtube.com/..." /></div>
              <div className="fg"><label className="fl">Virtual Staging URL</label><input className="fi" value={flyerStagingUrl} onChange={e => setFlyerStagingUrl(e.target.value)} placeholder="https://..." /></div>
            </div>
          </>}

          {activeTab === "listing-flyer" && leftPanel === "styles" && <><div className="ph"><Palette size={15} color="var(--sa)" /> Accent Color</div>
            <Section title="Color" icon={Paintbrush}><ColorPicker value={flyerAccentColor} onChange={setFlyerAccentColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={flyerAccentColor} onSelect={setFlyerAccentColor} showLabels /></div><div style={{ marginTop: 10 }}><SwatchGrid colors={ACCENT_COLORS} current={flyerAccentColor} onSelect={setFlyerAccentColor} /></div></Section>
          </>}

          {/* ═══ BRANDING CARD PANELS ═══ */}
          {activeTab === "branding-card" && leftPanel === "uploads" && <><div className="ph"><Upload size={15} color="var(--sa)" /> Media</div><div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <UploadZone label="Headshot" imageUrl={brandHeadshot} onUpload={f => handleHeadshotUpload(f, setBrandHeadshot, setUploadingBrandHeadshot)} onClear={() => setBrandHeadshot(null)} uploading={uploadingBrandHeadshot} compact savedUrl={savedHeadshot} onUseSaved={() => { setBrandHeadshot(savedHeadshot); setHeadshot(savedHeadshot); }} />
              <UploadZone label="Logo" imageUrl={brandLogo} onUpload={f => handleLogoUpload(f, setBrandLogo, setUploadingBrandLogo)} onClear={() => setBrandLogo(null)} uploading={uploadingBrandLogo} compact savedUrl={savedLogo} onUseSaved={() => { setBrandLogo(savedLogo); setLogo(savedLogo); }} />
            </div>
            <div style={{ marginTop: 10 }}><UploadZone label="Background Photo (optional)" imageUrl={brandBgPhoto} onUpload={f => handleUpload(f, "design-studio", setBrandBgPhoto, setUploadingBrandBg)} onClear={() => setBrandBgPhoto(null)} uploading={uploadingBrandBg} /></div>
          </div></>}

          {activeTab === "branding-card" && leftPanel === "text" && <><div className="ph"><Type size={15} color="var(--sa)" /> Card Details</div>
            <Section title="Agent Info" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={brandAgentName} onChange={e => setBrandAgentName(e.target.value)} /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Phone</label><input className="fi" value={brandPhone} onChange={e => setBrandPhone(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Email</label><input className="fi" value={brandEmail} onChange={e => setBrandEmail(e.target.value)} /></div></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">Brokerage</label><input className="fi" value={brandBrokerage} onChange={e => setBrandBrokerage(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Tagline</label><input className="fi" value={brandTagline} onChange={e => setBrandTagline(e.target.value)} /></div></div><div className="fg"><label className="fl">Website</label><input className="fi" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} /></div></Section>
            <Section title="Property (optional)" icon={Home} defaultOpen={false}><div className="fg"><label className="fl">Address</label><input className="fi" value={brandAddress} onChange={e => setBrandAddress(e.target.value)} /></div><div className="fr"><div className="fg" style={{ flex: 1 }}><label className="fl">City, State</label><input className="fi" value={brandCityState} onChange={e => setBrandCityState(e.target.value)} /></div><div className="fg" style={{ flex: 1 }}><label className="fl">Price</label><input className="fi" value={brandPrice} onChange={e => setBrandPrice(e.target.value)} /></div></div><div className="fg"><label className="fl">Features</label><textarea className="ta" rows={3} value={brandFeatures} onChange={e => setBrandFeatures(e.target.value)} /></div></Section>
          </>}

          {activeTab === "branding-card" && leftPanel === "styles" && <><div className="ph"><Palette size={15} color="var(--sa)" /> Styles</div>
            <Section title="Font" icon={Type}>{FONT_OPTIONS.map(f => <button key={f.id} className={`fo ${brandFont === f.id ? "ac" : ""}`} onClick={() => setBrandFont(f.id)}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--std)", fontFamily: "var(--sf)" }}>{f.label}</div><div style={{ fontSize: 17, color: "var(--st)", marginTop: 1, fontFamily: f.family }}>{f.sample}</div></button>)}</Section>
            <Section title="Background Color" icon={Paintbrush}><ColorPicker value={brandBgColor} onChange={setBrandBgColor} /><div style={{ marginTop: 8 }}><SwatchGrid colors={BROKERAGE_COLORS} current={brandBgColor} onSelect={setBrandBgColor} showLabels /></div></Section>
            <Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={brandAccentColor || "#ffffff"} onChange={setBrandAccentColor} />{brandAccentColor && <button onClick={() => setBrandAccentColor("")} style={{ marginTop: 6, background: "none", border: "none", color: "var(--std)", fontSize: 11, cursor: "pointer", textDecoration: "underline", fontFamily: "var(--sf)" }}>Clear</button>}<div style={{ marginTop: 10 }}><SwatchGrid colors={ACCENT_COLORS} current={brandAccentColor} onSelect={setBrandAccentColor} /></div></Section>
            <Section title="Orientation" icon={Layers}><div className="fr">{BRANDING_ORIENTATIONS.map(o => <button key={o.id} className={`sp ${brandOrientation === o.id ? "ac" : ""}`} style={{ flex: 1, padding: "8px 0", textAlign: "center" }} onClick={() => setBrandOrientation(o.id)}>{o.label}</button>)}</div></Section>
          </>}
        </div>

        {/* ═══ CANVAS ═══ */}
        <div className="sc">
          <div className="scb" />
          <div className="scc">
            <div className="spf" ref={previewRef} style={{ width: pW, height: pH }}>
              <div data-export-target="true" style={{ width: rawW, height: rawH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                {renderPreview()}
              </div>
            </div>
          </div>
          <div className="sct">
            <button className="bi" style={{ width: 28, height: 28 }} onClick={() => setZoom(Math.max(50, zoom - 10))}><ZoomOut size={13} /></button>
            <div className="zd">{zoom}%</div>
            <button className="bi" style={{ width: 28, height: 28 }} onClick={() => setZoom(Math.min(200, zoom + 10))}><ZoomIn size={13} /></button>
            <button className="bi" style={{ width: 28, height: 28 }} onClick={() => setZoom(100)}><RotateCcw size={13} /></button>
            <div className="td" />
            {(activeTab === "templates" || activeTab === "video-remix") && SIZES.map(s => <button key={s.id} className={`sp ${selectedSize === s.id ? "ac" : ""}`} onClick={() => setSelectedSize(s.id)}>{s.label}</button>)}
            {activeTab === "yard-sign" && YARD_SIGN_SIZES.map(s => <button key={s.id} className={`sp ${yardSignSize === s.id ? "ac" : ""}`} onClick={() => setYardSignSize(s.id)}>{s.label}</button>)}
            {activeTab === "property-pdf" && pdfTotalPages > 1 && <><button className="bi" style={{ width: 28, height: 28 }} onClick={() => setPdfPreviewPage(Math.max(0, pdfPreviewPage - 1))}><ChevronLeft size={13} /></button><span className="zd">Pg {pdfPreviewPage + 1}/{pdfTotalPages}</span><button className="bi" style={{ width: 28, height: 28 }} onClick={() => setPdfPreviewPage(Math.min(pdfTotalPages - 1, pdfPreviewPage + 1))}><ChevronRight size={13} /></button></>}
            {activeTab === "listing-flyer" && <><button className="bi" style={{ width: 28, height: 28 }} onClick={() => setFlyerPreviewPage(flyerPreviewPage === 0 ? 1 : 0)}><ChevronLeft size={13} /></button><span className="zd">Pg {flyerPreviewPage + 1}/2</span><button className="bi" style={{ width: 28, height: 28 }} onClick={() => setFlyerPreviewPage(flyerPreviewPage === 0 ? 1 : 0)}><ChevronRight size={13} /></button></>}
            {activeTab === "branding-card" && BRANDING_ORIENTATIONS.map(o => <button key={o.id} className={`sp ${brandOrientation === o.id ? "ac" : ""}`} onClick={() => setBrandOrientation(o.id)}>{o.label}</button>)}
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        {showRight && <div className="srp">
          <div className="ph"><Settings size={14} color="var(--sa)" /> Actions<div style={{ flex: 1 }} /><button className="bi" style={{ width: 26, height: 26 }} onClick={() => setShowRight(false)}><X size={11} /></button></div>
          <Section title="Export" icon={Download}>
            {activeTab === "video-remix" || (activeTab === "templates" && mediaMode === "video" && selectedVideo) ? (
              <>
                {overlayMusic ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "var(--sag)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 8 }}><Music size={12} color="var(--sa)" /><span style={{ fontSize: 10, color: "var(--sa)", fontWeight: 600 }}>Music will be mixed in</span></div>
                ) : !showMusicReminder ? (
                  <button onClick={() => { if (activeTab === "video-remix") setLeftPanel("music"); else { setActiveTab("video-remix"); setTimeout(() => setLeftPanel("music"), 100); } }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 8, cursor: "pointer", fontFamily: "var(--sf)" }}>
                    <Music size={13} color="#f59e0b" />
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", margin: 0 }}>Add background music?</p>
                      <p style={{ fontSize: 9, color: "rgba(245,158,11,0.7)", margin: 0, marginTop: 1 }}>Music makes your video stand out</p>
                    </div>
                    <ChevronRight size={13} color="#f59e0b" />
                  </button>
                ) : null}
                {showMusicReminder && (
                  <div style={{ padding: "12px", borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Music size={16} color="#f59e0b" />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", margin: 0 }}>No music selected</p>
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(245,158,11,0.85)", margin: 0, marginBottom: 10, lineHeight: 1.4 }}>Background music makes listing videos more engaging and professional. Add a track before exporting?</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { if (activeTab === "video-remix") setLeftPanel("music"); else { setActiveTab("video-remix"); setTimeout(() => setLeftPanel("music"), 100); } setShowMusicReminder(false); }}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", background: "#f59e0b", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sf)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <Music size={12} /> Add Music
                      </button>
                      <button onClick={handleVideoExport}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "1px solid var(--sbr)", background: "none", color: "var(--std)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sf)" }}>
                        Export Without
                      </button>
                    </div>
                  </div>
                )}
                {!showMusicReminder && (
                  <button className="bx" style={{ width: "100%", justifyContent: "center", padding: "11px 0" }} onClick={handleVideoExport} disabled={exporting || videoExporting}>{videoExporting ? <><Loader2 size={14} className="animate-spin" /> Exporting Video...</> : <><Film size={14} /> Export Video (MP4)</>}</button>
                )}
                <button className="bi" style={{ width: "100%", marginTop: 6, fontSize: 11, gap: 4, fontWeight: 600 }} onClick={handleExport} disabled={exporting}><Download size={13} /> Download Thumbnail</button>
              </>
            ) : activeTab === "property-pdf" ? (
              <>
                <button className="bx" style={{ width: "100%", justifyContent: "center", padding: "11px 0" }} onClick={handlePdfExport} disabled={exporting}>{exporting ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Download size={14} /> Download PDF</>}</button>
                <button className="bi" style={{ width: "100%", marginTop: 6, fontSize: 11, gap: 4, fontWeight: 600 }} onClick={handleExport} disabled={exporting}><Download size={13} /> Download Page as PNG</button>
              </>
            ) : activeTab === "listing-flyer" ? (
              <>
                <button className="bx" style={{ width: "100%", justifyContent: "center", padding: "11px 0" }} onClick={handleFlyerPdfExport} disabled={exporting}>{exporting ? <><Loader2 size={14} className="animate-spin" /> Generating Flyer...</> : <><Printer size={14} /> Download Flyer PDF</>}</button>
                <button className="bi" style={{ width: "100%", marginTop: 6, fontSize: 11, gap: 4, fontWeight: 600 }} onClick={handleExport} disabled={exporting}><Download size={13} /> Download Page as PNG</button>
              </>
            ) : (
              <>
                <button className="bx" style={{ width: "100%", justifyContent: "center", padding: "11px 0" }} onClick={handleExport} disabled={exporting}>{exporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Download PNG</>}</button>
              </>
            )}
            {activeTab === "branding-card" && (
              <button className="bi" style={{ width: "100%", marginTop: 6, fontSize: 11, gap: 4, fontWeight: 600 }} onClick={handleSaveBrandingCard} disabled={savingBrandCard}>
                {savingBrandCard ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : brandCardSaved ? <><CheckCircle size={13} color="var(--suc)" /> Saved!</> : <><CreditCard size={13} /> Save to Profile</>}
              </button>
            )}
          </Section>
          <Section title="Layers" icon={Layers} defaultOpen={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {(activeTab === "templates" || activeTab === "video-remix" ? [{ n: "Badge", i: "🏷️" }, { n: "Price", i: "💲" }, { n: "Info Bar", i: "📋" }, { n: "Agent", i: "👤" }, { n: mediaMode === "video" || activeTab === "video-remix" ? "Video" : "Photo", i: mediaMode === "video" || activeTab === "video-remix" ? "🎬" : "🖼️" }]
                : activeTab === "yard-sign" ? [{ n: "Header", i: "🏷️" }, { n: "Agent", i: "👤" }, { n: "Background", i: "🖼️" }]
                : activeTab === "property-pdf" ? [{ n: "Photos", i: "🖼️" }, { n: "Details", i: "📋" }, { n: "Features", i: "✨" }]
                : [{ n: "Headshot", i: "👤" }, { n: "Info", i: "📋" }, { n: "Background", i: "🖼️" }]
              ).map((l, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", borderRadius: 7, background: "rgba(255,255,255,0.02)", border: "1px solid var(--sbr)", fontSize: 11, color: "var(--std)" }}><span>{l.i}</span><span style={{ flex: 1, fontWeight: 600 }}>{l.n}</span><Eye size={13} color="var(--sa)" /></div>)}
            </div>
          </Section>
        </div>}
      </div>

      {notification && <div className="toast"><CheckCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />{notification}</div>}
    </div></>
  );
}
