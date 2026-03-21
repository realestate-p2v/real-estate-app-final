"use client";

import { useState, useRef, useCallback } from "react";
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
  Sparkles,
  Type,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════════════════ */

type TemplateType = "just-listed" | "open-house" | "price-reduced" | "just-sold";
type SizeOption = "square" | "story" | "postcard";
type StudioTab = "templates" | "branding-card";

interface TemplateConfig {
  id: TemplateType;
  label: string;
  icon: typeof Home;
}

interface SizeConfig {
  id: SizeOption;
  label: string;
  sublabel: string;
  width: number;
  height: number;
}

const TEMPLATES: TemplateConfig[] = [
  { id: "just-listed", label: "Just Listed", icon: Home },
  { id: "open-house", label: "Open House", icon: Calendar },
  { id: "price-reduced", label: "Price Reduced", icon: DollarSign },
  { id: "just-sold", label: "Just Sold", icon: CheckCircle },
];

const SIZES: SizeConfig[] = [
  { id: "square", label: "Square", sublabel: "Instagram / Facebook", width: 1080, height: 1080 },
  { id: "story", label: "Story", sublabel: "Instagram / TikTok", width: 1080, height: 1920 },
  { id: "postcard", label: "Postcard", sublabel: "6×4 Print-Ready", width: 1800, height: 1200 },
];

const BRANDING_ORIENTATIONS = [
  { id: "landscape" as const, label: "Landscape", sublabel: "1920×1080", width: 1920, height: 1080 },
  { id: "vertical" as const, label: "Vertical", sublabel: "1080×1920", width: 1080, height: 1920 },
];

const BG_COLORS = [
  // Darks
  "#1a1a2e", "#0f172a", "#1e293b", "#18181b", "#27272a",
  // Rich darks
  "#14532d", "#1e3a5f", "#4a1942", "#7f1d1d", "#78350f",
  // Mids
  "#374151", "#475569", "#4b5563", "#6b7280",
  // Lights
  "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#f5f5f4",
  "#fef3c7", "#fed7aa", "#fdba74",
  "#dbeafe", "#dcfce7", "#fce7f3", "#e0e7ff", "#f0fdf4",
];

const FONT_OPTIONS = [
  { id: "serif", label: "Classic Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "sans", label: "Clean Sans", family: "'Helvetica Neue', Arial, sans-serif" },
  { id: "modern", label: "Modern", family: "'Trebuchet MS', 'Gill Sans', sans-serif" },
  { id: "elegant", label: "Elegant", family: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
];

/* ═══════════════════════════════════════════════════════
   CLOUDINARY UPLOAD HELPER
   ═══════════════════════════════════════════════════════ */

async function uploadToCloudinary(file: File, folder: string): Promise<string | null> {
  try {
    const sigResponse = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: `photo2video/${folder}` }),
    });
    const sigData = await sigResponse.json();
    if (!sigData.success) throw new Error("Signature failed");
    const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", apiKey);
    uploadData.append("timestamp", timestamp.toString());
    uploadData.append("signature", signature);
    uploadData.append("folder", folderPath);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: "POST",
      body: uploadData,
    });
    const result = await response.json();
    return result.secure_url || null;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   IMAGE UPLOAD COMPONENT
   ═══════════════════════════════════════════════════════ */

function ImageUploadBox({
  label,
  imageUrl,
  onUpload,
  onClear,
  uploading,
  hint,
  className = "",
}: {
  label: string;
  imageUrl: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
  hint?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm font-semibold">{label}</Label>
      {imageUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square">
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground bg-muted/30"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="text-xs font-medium">Upload</span>
            </>
          )}
        </button>
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BADGE CONFIG
   ═══════════════════════════════════════════════════════ */

function getBadgeConfig(templateId: TemplateType) {
  switch (templateId) {
    case "just-listed": return { text: "JUST LISTED", color: "#2563eb" };
    case "open-house": return { text: "OPEN HOUSE", color: "#059669" };
    case "price-reduced": return { text: "PRICE REDUCED", color: "#dc2626" };
    case "just-sold": return { text: "JUST SOLD", color: "#d97706" };
  }
}

/* ═══════════════════════════════════════════════════════
   LISTING TEMPLATE — INFO BAR STYLE
   (Just Listed, Price Reduced, Just Sold)
   ═══════════════════════════════════════════════════════ */

function InfoBarTemplate({
  size,
  listingPhoto,
  headshot,
  logo,
  address,
  beds,
  baths,
  sqft,
  price,
  agentName,
  phone,
  brokerage,
  badgeText,
  badgeColor,
  fontFamily,
  barColor,
  accentColor,
}: {
  size: SizeConfig;
  listingPhoto: string | null;
  headshot: string | null;
  logo: string | null;
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  price: string;
  agentName: string;
  phone: string;
  brokerage: string;
  badgeText: string;
  badgeColor: string;
  fontFamily: string;
  barColor: string;
  accentColor: string;
}) {
  const w = size.width;
  const h = size.height;
  const isStory = size.id === "story";

  const unit = w / 1080;
  const photoPercent = isStory ? 65 : 58;
  const barPadX = Math.round(36 * unit);
  const barPadY = Math.round(20 * unit);

  // Font sizes
  const badgeFontSize = Math.round(26 * unit);
  const addressFontSize = Math.round(34 * unit);
  const detailsFontSize = Math.round(24 * unit);
  const priceFontSize = Math.round(52 * unit);
  const agentNameFontSize = Math.round(30 * unit);
  const agentDetailFontSize = Math.round(22 * unit);
  // BIGGER headshot and logo
  const headshotSize = Math.round((isStory ? 160 : 140) * unit);
  const logoMaxW = Math.round(140 * unit);
  const logoMaxH = Math.round(70 * unit);

  const accent = accentColor || "#ffffff";
  const usedBadgeColor = accentColor || badgeColor;

  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h, fontFamily }}>
      {/* Listing photo */}
      <div className="absolute inset-x-0 top-0" style={{ height: `${photoPercent}%` }}>
        {listingPhoto ? (
          <img src={listingPhoto} alt="Listing" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <ImageIcon className="text-gray-500" style={{ width: 80 * unit, height: 80 * unit }} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent" style={{ height: Math.round(80 * unit), backgroundImage: `linear-gradient(to top, ${barColor}, transparent)` }} />
      </div>

      {/* Info bar */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between"
        style={{ height: `${100 - photoPercent}%`, padding: `${barPadY}px ${barPadX}px`, backgroundColor: barColor }}
      >
        {/* Left: Agent info */}
        <div className="flex items-center flex-shrink-0" style={{ gap: Math.round(16 * unit), maxWidth: "48%" }}>
          {headshot ? (
            <img
              src={headshot}
              alt="Agent"
              className="rounded-full object-cover flex-shrink-0"
              style={{ width: headshotSize, height: headshotSize, border: `${Math.round(4 * unit)}px solid rgba(255,255,255,0.3)` }}
            />
          ) : (
            <div
              className="rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"
              style={{ width: headshotSize, height: headshotSize, border: `${Math.round(4 * unit)}px solid rgba(255,255,255,0.25)` }}
            >
              <User className="text-gray-500" style={{ width: 48 * unit, height: 48 * unit }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold truncate" style={{ fontSize: agentNameFontSize, lineHeight: 1.2 }}>
              {agentName || "Agent Name"}
            </p>
            <p className="text-gray-400 truncate" style={{ fontSize: agentDetailFontSize, lineHeight: 1.3 }}>
              {brokerage || "Brokerage"}
            </p>
            <p className="text-gray-400 truncate" style={{ fontSize: agentDetailFontSize, lineHeight: 1.3 }}>
              {phone || "(555) 000-0000"}
            </p>
          </div>
        </div>

        {/* Right: Property info */}
        <div className="text-right flex-shrink-0" style={{ maxWidth: "50%" }}>
          <div
            className="inline-block text-white font-black uppercase tracking-wider rounded-sm"
            style={{
              fontSize: badgeFontSize,
              backgroundColor: usedBadgeColor,
              padding: `${Math.round(6 * unit)}px ${Math.round(16 * unit)}px`,
              marginBottom: Math.round(10 * unit),
            }}
          >
            {badgeText}
          </div>
          <p className="text-white font-bold leading-tight truncate" style={{ fontSize: addressFontSize }}>
            {address || "123 Main Street"}
          </p>
          <p className="text-gray-300" style={{ fontSize: detailsFontSize, marginTop: Math.round(4 * unit) }}>
            {[beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`]
              .filter(Boolean)
              .join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF"}
          </p>
          <p className="font-black" style={{ fontSize: priceFontSize, marginTop: Math.round(6 * unit), lineHeight: 1.1, color: accent }}>
            {price ? `$${price}` : "$000,000"}
          </p>
        </div>

        {/* Logo */}
        {logo && (
          <img
            src={logo}
            alt="Logo"
            className="absolute object-contain"
            style={{
              top: barPadY,
              left: barPadX,
              maxWidth: logoMaxW,
              maxHeight: logoMaxH,
              opacity: 0.8,
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LISTING TEMPLATE — OPEN HOUSE (full-bleed overlay)
   ═══════════════════════════════════════════════════════ */

function OpenHouseTemplate({
  size,
  listingPhoto,
  headshot,
  logo,
  address,
  beds,
  baths,
  sqft,
  price,
  date,
  time,
  agentName,
  phone,
  brokerage,
  fontFamily,
  barColor,
  accentColor,
}: {
  size: SizeConfig;
  listingPhoto: string | null;
  headshot: string | null;
  logo: string | null;
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  price: string;
  date: string;
  time: string;
  agentName: string;
  phone: string;
  brokerage: string;
  fontFamily: string;
  barColor: string;
  accentColor: string;
}) {
  const w = size.width;
  const h = size.height;
  const isStory = size.id === "story";
  const unit = w / 1080;

  const badgeFontSize = Math.round(36 * unit);
  const dateFontSize = Math.round(32 * unit);
  const timeFontSize = Math.round(26 * unit);
  const addressFontSize = Math.round(30 * unit);
  const detailsFontSize = Math.round(24 * unit);
  const priceFontSize = Math.round(44 * unit);
  const agentFontSize = Math.round(24 * unit);
  const agentDetailFontSize = Math.round(20 * unit);
  // BIGGER headshot and logo
  const headshotSize = Math.round(90 * unit);
  const logoMaxW = Math.round(120 * unit);
  const logoMaxH = Math.round(56 * unit);
  const pad = Math.round(40 * unit);

  const accent = accentColor || "#ffffff";
  const badgeBg = accentColor || "#059669";

  return (
    <div className="relative overflow-hidden bg-gray-900" style={{ width: w, height: h, fontFamily }}>
      {listingPhoto ? (
        <img src={listingPhoto} alt="Listing" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
          <ImageIcon className="text-gray-500" style={{ width: 100 * unit, height: 100 * unit }} />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80" />

      {/* Top: Badge + date/time */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center justify-center text-center text-white"
        style={{ height: isStory ? "28%" : "36%", padding: `0 ${pad}px` }}
      >
        <div
          className="inline-block text-white font-black uppercase tracking-[0.15em] rounded-sm"
          style={{ fontSize: badgeFontSize, padding: `${Math.round(8 * unit)}px ${Math.round(24 * unit)}px`, backgroundColor: badgeBg }}
        >
          Open House
        </div>
        <p className="font-bold text-white" style={{ fontSize: dateFontSize, marginTop: Math.round(16 * unit) }}>
          {date || "Saturday, March 22"}
        </p>
        <p className="text-white/80 font-semibold" style={{ fontSize: timeFontSize, marginTop: Math.round(4 * unit) }}>
          {time || "1:00 PM – 4:00 PM"}
        </p>
      </div>

      {/* Bottom: Property + agent */}
      <div className="absolute inset-x-0 bottom-0" style={{ padding: `0 ${pad}px` }}>
        <div className="text-center text-white" style={{ marginBottom: Math.round(12 * unit) }}>
          <p className="font-bold leading-tight" style={{ fontSize: addressFontSize }}>
            {address || "123 Main Street"}
          </p>
          <p className="text-white/80" style={{ fontSize: detailsFontSize, marginTop: Math.round(4 * unit) }}>
            {[beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`]
              .filter(Boolean)
              .join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF"}
          </p>
          <p className="font-black" style={{ fontSize: priceFontSize, marginTop: Math.round(8 * unit), lineHeight: 1.1, color: accent }}>
            {price ? `$${price}` : "$000,000"}
          </p>
        </div>

        {/* Agent bar */}
        <div
          className="flex items-center justify-center backdrop-blur-sm rounded-t-xl"
          style={{ padding: `${Math.round(14 * unit)}px ${Math.round(20 * unit)}px`, gap: Math.round(14 * unit), backgroundColor: barColor + "cc" }}
        >
          {headshot ? (
            <img
              src={headshot}
              alt="Agent"
              className="rounded-full object-cover flex-shrink-0"
              style={{ width: headshotSize, height: headshotSize, border: `${Math.round(3 * unit)}px solid rgba(255,255,255,0.3)` }}
            />
          ) : (
            <div
              className="rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"
              style={{ width: headshotSize, height: headshotSize, border: `${Math.round(3 * unit)}px solid rgba(255,255,255,0.3)` }}
            >
              <User className="text-gray-400" style={{ width: 32 * unit, height: 32 * unit }} />
            </div>
          )}
          <div className="text-white min-w-0">
            <p className="font-bold truncate" style={{ fontSize: agentFontSize }}>
              {agentName || "Agent Name"}
            </p>
            <p className="text-white/60 truncate" style={{ fontSize: agentDetailFontSize }}>
              {[brokerage, phone].filter(Boolean).join("  ·  ") || "Brokerage  ·  (555) 000-0000"}
            </p>
          </div>
          {logo && (
            <img src={logo} alt="Logo" className="object-contain flex-shrink-0 ml-auto"
              style={{ maxWidth: logoMaxW, maxHeight: logoMaxH, opacity: 0.9 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BRANDING CARD — WOLFE STYLE
   (Address left, logo center, headshot right, rounded corners)
   ═══════════════════════════════════════════════════════ */

function BrandingCardTemplate({
  orientation,
  logo,
  headshot,
  agentName,
  phone,
  email,
  brokerage,
  tagline,
  address,
  cityState,
  price,
  features,
  bgColor,
  accentColor,
  bgPhoto,
  fontFamily,
}: {
  orientation: { width: number; height: number; id: string };
  logo: string | null;
  headshot: string | null;
  agentName: string;
  phone: string;
  email: string;
  brokerage: string;
  tagline: string;
  address: string;
  cityState: string;
  price: string;
  features: string;
  bgColor: string;
  accentColor: string;
  bgPhoto: string | null;
  fontFamily: string;
}) {
  const w = orientation.width;
  const h = orientation.height;
  const isVertical = orientation.id === "vertical";

  const isLightBg = bgColor && !bgPhoto ? (() => {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  })() : false;

  const textColor = isLightBg ? "#1a1a2e" : "#ffffff";
  const textMuted = isLightBg ? "rgba(26,26,46,0.6)" : "rgba(255,255,255,0.7)";
  const borderColor = isLightBg ? "rgba(0,0,0,0.2)" : "rgba(180,180,180,0.5)";
  const accent = accentColor || textColor;

  /* ── VERTICAL: stacked layout — BIG text and images ── */
  if (isVertical) {
    const u = w / 1080;
    const inset = Math.round(24 * u);
    const radius = Math.round(30 * u);
    const border = Math.round(4 * u);
    const pad = Math.round(56 * u);

    const addressSz = Math.round(80 * u);
    const citySz = Math.round(48 * u);
    const priceSz = Math.round(68 * u);
    const featureSz = Math.round(40 * u);
    const nameSz = Math.round(52 * u);
    const detailSz = Math.round(34 * u);
    const taglineSz = Math.round(32 * u);
    const headshotSz = Math.round(520 * u);
    const frameBorder = Math.round(10 * u);
    const logoMaxW = Math.round(400 * u);
    const logoMaxH = Math.round(180 * u);

    return (
      <div style={{ width: w, height: h, background: "transparent" }}>
        <div
          style={{
            position: "absolute",
            inset: inset,
            borderRadius: radius,
            border: `${border}px solid ${borderColor}`,
            backgroundColor: bgColor || "#14532d",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: pad,
            fontFamily,
          }}
        >
          {bgPhoto && (
            <>
              <img src={bgPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)" }} />
            </>
          )}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%" }}>
            {headshot ? (
              <img src={headshot} alt="Agent" style={{
                width: headshotSz, height: headshotSz, objectFit: "cover",
                border: `${frameBorder}px solid white`, margin: "0 auto", display: "block",
              }} />
            ) : (
              <div style={{
                width: headshotSz, height: headshotSz,
                backgroundColor: "rgba(255,255,255,0.08)",
                border: `${frameBorder}px solid ${borderColor}`,
                margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <User style={{ width: 100 * u, height: 100 * u, color: textMuted }} />
              </div>
            )}
            <p style={{ fontSize: nameSz, fontWeight: 700, color: accent, marginTop: Math.round(20 * u) }}>
              {agentName || "Agent Name"}
            </p>

            {logo && (
              <img src={logo} alt="Logo" style={{
                maxWidth: logoMaxW, maxHeight: logoMaxH, objectFit: "contain",
                margin: `${Math.round(32 * u)}px auto`, display: "block",
              }} />
            )}

            {address && (
              <p style={{ fontSize: addressSz, fontWeight: 800, color: textColor, marginTop: Math.round(28 * u), lineHeight: 1.05 }}>{address}</p>
            )}
            {cityState && (
              <p style={{ fontSize: citySz, fontWeight: 600, color: textColor, marginTop: Math.round(10 * u) }}>{cityState}</p>
            )}
            {price && (
              <p style={{ fontSize: priceSz, fontWeight: 800, color: accent, marginTop: Math.round(24 * u) }}>${price}</p>
            )}
            {features && (
              <div style={{ marginTop: Math.round(22 * u), color: textMuted, fontSize: featureSz, lineHeight: 1.6 }}>
                {features.split("\n").map((f, i) => <div key={i}>{f}</div>)}
              </div>
            )}

            {/* Contact info — always show */}
            <div style={{ marginTop: Math.round(36 * u), display: "flex", justifyContent: "center", gap: Math.round(28 * u), flexWrap: "wrap" }}>
              {phone && <span style={{ fontSize: detailSz, color: textMuted }}>{phone}</span>}
              {email && <span style={{ fontSize: detailSz, color: textMuted }}>{email}</span>}
            </div>
            {brokerage && <p style={{ fontSize: detailSz, color: textMuted, marginTop: Math.round(8 * u) }}>{brokerage}</p>}
            {tagline && <p style={{ fontSize: taglineSz, color: accentColor || textMuted, fontStyle: "italic", marginTop: Math.round(10 * u) }}>{tagline}</p>}
          </div>
        </div>
      </div>
    );
  }

  /* ── LANDSCAPE — Wolfe-style 3-column layout ── */
  const u = w / 1920;
  const uh = h / 1080;

  const inset = Math.round(48 * u);
  const radius = Math.round(48 * u);
  const borderW = Math.round(7 * u);
  const contentPadX = Math.round(72 * u);
  const contentPadY = Math.round(52 * uh);

  const addressSz = Math.round(h * 0.11);
  const citySz = Math.round(h * 0.067);
  const priceSz = Math.round(h * 0.089);
  const featureSz = Math.round(h * 0.050);
  const nameSz = Math.round(h * 0.055);
  const detailSz = Math.round(h * 0.035);
  const taglineSz = Math.round(h * 0.032);

  const innerH = h - inset * 2 - borderW * 2;
  const innerW = w - inset * 2 - borderW * 2;
  const frameH = Math.round(innerH * 0.82);
  const frameW = Math.round(innerW * 0.237);
  const frameBorder = Math.round(10 * u);
  const logoMaxW = Math.round(innerW * 0.18);
  const logoMaxH = Math.round(innerH * 0.50);

  return (
    <div style={{ width: w, height: h, background: "transparent" }}>
      <div
        style={{
          position: "absolute", inset: inset, borderRadius: radius,
          border: `${borderW}px solid ${borderColor}`,
          backgroundColor: bgColor || "#14532d", overflow: "hidden", fontFamily,
        }}
      >
        {bgPhoto && (
          <>
            <img src={bgPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)" }} />
          </>
        )}

        <div style={{
          position: "relative", zIndex: 1, display: "flex", alignItems: "stretch",
          width: "100%", height: "100%", padding: `${contentPadY}px ${contentPadX}px`,
        }}>

          {/* LEFT — Text (38%) */}
          <div style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: Math.round(20 * u), minWidth: 0 }}>
            {address ? (
              <p style={{ fontSize: addressSz, fontWeight: 800, color: textColor, lineHeight: 1.05, margin: 0 }}>{address}</p>
            ) : (
              <p style={{ fontSize: addressSz, fontWeight: 800, color: accent, lineHeight: 1.05, margin: 0 }}>{agentName || "Your Name"}</p>
            )}
            {cityState && (
              <p style={{ fontSize: citySz, fontWeight: 600, color: textColor, margin: 0, marginTop: Math.round(h * 0.035) }}>{cityState}</p>
            )}
            {price && (
              <p style={{ fontSize: priceSz, fontWeight: 800, color: accent, margin: 0, marginTop: Math.round(h * 0.045) }}>${price}</p>
            )}
            {features && (
              <div style={{ marginTop: Math.round(h * 0.04), color: textMuted, fontSize: featureSz, lineHeight: 1.55 }}>
                {features.split("\n").map((f, i) => <div key={i}>{f}</div>)}
              </div>
            )}
            {!address && tagline && (
              <p style={{ fontSize: citySz, color: accentColor || textMuted, fontStyle: "italic", margin: 0, marginTop: Math.round(h * 0.03) }}>{tagline}</p>
            )}
            {!address && brokerage && (
              <p style={{ fontSize: featureSz, color: textMuted, margin: 0, marginTop: Math.round(h * 0.02) }}>{brokerage}</p>
            )}
            {!address && phone && (
              <p style={{ fontSize: featureSz, color: textMuted, margin: 0, marginTop: Math.round(h * 0.015) }}>{phone}</p>
            )}
            {!address && email && (
              <p style={{ fontSize: featureSz, color: textMuted, margin: 0, marginTop: Math.round(h * 0.010) }}>{email}</p>
            )}
          </div>

          {/* CENTER — Logo (24%) */}
          <div style={{ flex: "0 0 24%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {logo ? (
              <img src={logo} alt="Logo" style={{ maxWidth: logoMaxW, maxHeight: logoMaxH, objectFit: "contain" }} />
            ) : (
              <div style={{ width: Math.round(120 * u), height: Math.round(120 * u), borderRadius: "50%", border: `3px dashed ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ImageIcon style={{ width: 40 * u, height: 40 * u, color: textMuted }} />
              </div>
            )}
            {brokerage && address && (
              <p style={{ fontSize: detailSz, color: textMuted, marginTop: Math.round(16 * u), textAlign: "center" }}>{brokerage}</p>
            )}
            {tagline && address && (
              <p style={{ fontSize: taglineSz, color: accentColor || textMuted, fontStyle: "italic", marginTop: Math.round(10 * u), textAlign: "center", maxWidth: logoMaxW }}>{tagline}</p>
            )}
          </div>

          {/* RIGHT — Headshot + Name (38%) */}
          <div style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {headshot ? (
              <img src={headshot} alt="Agent" style={{ width: frameW, height: frameH, objectFit: "cover", border: `${frameBorder}px solid white` }} />
            ) : (
              <div style={{ width: frameW, height: frameH, backgroundColor: "rgba(255,255,255,0.06)", border: `${frameBorder}px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: 80 * u, height: 80 * u, color: textMuted }} />
              </div>
            )}
            <p style={{ fontSize: nameSz, fontWeight: 600, color: accent, marginTop: Math.round(10 * uh), textAlign: "center" }}>
              {address ? (agentName || "Agent Name") : ""}
            </p>
            {address && phone && (
              <p style={{ fontSize: detailSz, color: textMuted, marginTop: Math.round(4 * uh), textAlign: "center" }}>{phone}</p>
            )}
            {address && email && (
              <p style={{ fontSize: detailSz, color: textMuted, marginTop: Math.round(2 * uh), textAlign: "center" }}>{email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function DesignStudioPage() {
  const [tab, setTab] = useState<StudioTab>("templates");

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("just-listed");
  const [selectedSize, setSelectedSize] = useState<SizeOption>("square");

  // Uploads
  const [listingPhoto, setListingPhoto] = useState<string | null>(null);
  const [headshot, setHeadshot] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [uploadingListing, setUploadingListing] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form fields
  const [address, setAddress] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [agentName, setAgentName] = useState("");
  const [phone, setPhone] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [listingFont, setListingFont] = useState("sans");
  const [listingBarColor, setListingBarColor] = useState("#111827");
  const [listingAccentColor, setListingAccentColor] = useState("");

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

  // Export
  const [exporting, setExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const currentSize = SIZES.find((s) => s.id === selectedSize)!;
  const currentBrandOrientation = BRANDING_ORIENTATIONS.find((o) => o.id === brandOrientation)!;
  const currentFontFamily = FONT_OPTIONS.find((f) => f.id === brandFont)?.family || FONT_OPTIONS[0].family;
  const listingFontFamily = FONT_OPTIONS.find((f) => f.id === listingFont)?.family || FONT_OPTIONS[1].family;

  // Scale to fit preview area
  const getScaledDimensions = useCallback(() => {
    const maxW = 520;
    const maxH = 560;
    if (tab === "branding-card") {
      const w = currentBrandOrientation.width;
      const h = currentBrandOrientation.height;
      const s = Math.min(maxW / w, maxH / h, 1);
      return { scale: s, width: w * s, height: h * s, rawW: w, rawH: h };
    }
    const w = currentSize.width;
    const h = currentSize.height;
    const s = Math.min(maxW / w, maxH / h, 1);
    return { scale: s, width: w * s, height: h * s, rawW: w, rawH: h };
  }, [tab, currentSize, currentBrandOrientation]);

  const { scale, width: previewW, height: previewH, rawW, rawH } = getScaledDimensions();

  // Upload handler
  const handleUpload = async (
    file: File,
    folder: string,
    setUrl: (url: string | null) => void,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    const url = await uploadToCloudinary(file, folder);
    setUrl(url);
    setLoading(false);
  };

  // Export via html2canvas
  const handleExport = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const templateEl = previewRef.current.querySelector("[data-export-target]") as HTMLElement;
      if (!templateEl) return;

      const canvas = await html2canvas(templateEl, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: rawW,
        height: rawH,
      });

      const link = document.createElement("a");
      const templateName = tab === "branding-card" ? "branding-card" : selectedTemplate;
      const sizeName = tab === "branding-card" ? brandOrientation : selectedSize;
      link.download = `p2v-${templateName}-${sizeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const badge = getBadgeConfig(selectedTemplate);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/lens" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Marketing Design Studio
            </h1>
            <p className="text-muted-foreground mt-1">Create professional listing graphics and branding cards in seconds</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("templates")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              tab === "templates"
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <PenTool className="h-4 w-4" />
            Listing Graphics
          </button>
          <button
            onClick={() => setTab("branding-card")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              tab === "branding-card"
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Branding Card
          </button>
        </div>

        {/* ═══════════════════════════════════════════
            LISTING GRAPHICS TAB
            ═══════════════════════════════════════════ */}
        {tab === "templates" && (
          <>
            {/* Template Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    selectedTemplate === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <t.icon className="h-5 w-5 flex-shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Layout: Form | Preview */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Form */}
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-accent" />
                    Upload Images
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <ImageUploadBox
                      label="Listing Photo *"
                      imageUrl={listingPhoto}
                      onUpload={(f) => handleUpload(f, "design-studio", setListingPhoto, setUploadingListing)}
                      onClear={() => setListingPhoto(null)}
                      uploading={uploadingListing}
                    />
                    <ImageUploadBox
                      label="Headshot"
                      imageUrl={headshot}
                      onUpload={(f) => handleUpload(f, "design-studio", setHeadshot, setUploadingHeadshot)}
                      onClear={() => setHeadshot(null)}
                      uploading={uploadingHeadshot}
                    />
                    <ImageUploadBox
                      label="Logo"
                      imageUrl={logo}
                      onUpload={(f) => handleUpload(f, "design-studio", setLogo, setUploadingLogo)}
                      onClear={() => setLogo(null)}
                      uploading={uploadingLogo}
                      hint="Optional"
                    />
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    Property Details
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Address</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street, Anytown" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Beds</Label>
                        <Input value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Baths</Label>
                        <Input value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Sq Ft</Label>
                        <Input value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1,800" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Price</Label>
                      <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="450,000" />
                    </div>
                    {selectedTemplate === "open-house" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-sm">Date</Label>
                          <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Saturday, March 22" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm">Time</Label>
                          <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="1:00 PM – 4:00 PM" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-accent" />
                    Agent Info
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Agent Name</Label>
                      <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Jane Smith" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Brokerage</Label>
                        <Input value={brokerage} onChange={(e) => setBrokerage(e.target.value)} placeholder="Keller Williams" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-accent" />
                    Appearance
                  </h3>

                  <Label className="text-sm font-semibold mb-2 block">Font Style</Label>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setListingFont(f.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          listingFont === f.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="text-sm font-semibold">{f.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: f.family }}>Aa Bb Cc 123</p>
                      </button>
                    ))}
                  </div>

                  <Label className="text-sm font-semibold mb-2 block">Info Bar Color</Label>
                  <div className="flex items-center gap-3 mb-2">
                    <input type="color" value={listingBarColor} onChange={(e) => setListingBarColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <Input value={listingBarColor} onChange={(e) => setListingBarColor(e.target.value)} className="w-28 font-mono text-sm" />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {["#111827", "#0f172a", "#1e293b", "#18181b", "#1a1a2e", "#14532d", "#1e3a5f", "#7f1d1d", "#27272a", "#374151"].map((c) => (
                      <button key={c} onClick={() => setListingBarColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all flex-shrink-0 ${listingBarColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"}`} style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>

                  <Label className="text-sm font-semibold mb-2 block">Accent Color <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <p className="text-xs text-muted-foreground mb-2">Applies to price and badge.</p>
                  <div className="flex items-center gap-3">
                    <input type="color" value={listingAccentColor || "#ffffff"} onChange={(e) => setListingAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <Input value={listingAccentColor} onChange={(e) => setListingAccentColor(e.target.value)} placeholder="None" className="w-28 font-mono text-sm" />
                    {listingAccentColor && <button onClick={() => setListingAccentColor("")} className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#d4af37", "#c0c0c0"].map((c) => (
                      <button key={c} onClick={() => setListingAccentColor(c)} className={`w-7 h-7 rounded-lg border-2 transition-all flex-shrink-0 ${listingAccentColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"}`} style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                  <h3 className="font-bold text-foreground mb-4">Live Preview</h3>

                  <div
                    ref={previewRef}
                    className="bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ width: "100%", height: previewH + 24, padding: 12 }}
                  >
                    <div style={{ width: previewW, height: previewH, overflow: "hidden" }}>
                      <div
                        data-export-target="true"
                        style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: rawW, height: rawH }}
                      >
                        {selectedTemplate === "open-house" ? (
                          <OpenHouseTemplate
                            size={currentSize}
                            listingPhoto={listingPhoto}
                            headshot={headshot}
                            logo={logo}
                            address={address}
                            beds={beds}
                            baths={baths}
                            sqft={sqft}
                            price={price}
                            date={date}
                            time={time}
                            agentName={agentName}
                            phone={phone}
                            brokerage={brokerage}
                            fontFamily={listingFontFamily}
                            barColor={listingBarColor}
                            accentColor={listingAccentColor}
                          />
                        ) : (
                          <InfoBarTemplate
                            size={currentSize}
                            listingPhoto={listingPhoto}
                            headshot={headshot}
                            logo={logo}
                            address={address}
                            beds={beds}
                            baths={baths}
                            sqft={sqft}
                            price={price}
                            agentName={agentName}
                            phone={phone}
                            brokerage={brokerage}
                            badgeText={badge.text}
                            badgeColor={badge.color}
                            fontFamily={listingFontFamily}
                            barColor={listingBarColor}
                            accentColor={listingAccentColor}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Size selector */}
                  <div className="mt-5">
                    <Label className="text-sm font-semibold mb-2 block">Output Size</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {SIZES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSize(s.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            selectedSize === s.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="text-sm font-semibold">{s.label}</p>
                          <p className="text-[11px] text-muted-foreground">{s.sublabel}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full mt-5 bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg"
                  >
                    {exporting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Exporting...</>
                    ) : (
                      <><Download className="mr-2 h-5 w-5" /> Download PNG</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════
            BRANDING CARD TAB
            ═══════════════════════════════════════════ */}
        {tab === "branding-card" && (
          <>
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-cyan-800">
                <strong>Tip:</strong> Create your branding card here, download as PNG, then upload it in the order form under "Custom branding cards." The PNG exports with a transparent background.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Form */}
              <div className="space-y-6">
                {/* Uploads */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-accent" />
                    Upload Images
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <ImageUploadBox
                      label="Headshot"
                      imageUrl={brandHeadshot}
                      onUpload={(f) => handleUpload(f, "design-studio", setBrandHeadshot, setUploadingBrandHeadshot)}
                      onClear={() => setBrandHeadshot(null)}
                      uploading={uploadingBrandHeadshot}
                    />
                    <ImageUploadBox
                      label="Logo"
                      imageUrl={brandLogo}
                      onUpload={(f) => handleUpload(f, "design-studio", setBrandLogo, setUploadingBrandLogo)}
                      onClear={() => setBrandLogo(null)}
                      uploading={uploadingBrandLogo}
                    />
                    <ImageUploadBox
                      label="Background Photo"
                      imageUrl={brandBgPhoto}
                      onUpload={(f) => handleUpload(f, "design-studio", setBrandBgPhoto, setUploadingBrandBg)}
                      onClear={() => setBrandBgPhoto(null)}
                      uploading={uploadingBrandBg}
                      hint="Optional — overrides color"
                    />
                  </div>
                </div>

                {/* Agent + Property Info */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-accent" />
                    Card Details
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">All fields are optional — fill in only what you need.</p>
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Agent Name</Label>
                      <Input value={brandAgentName} onChange={(e) => setBrandAgentName(e.target.value)} placeholder="Jane Smith" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Phone</Label>
                        <Input value={brandPhone} onChange={(e) => setBrandPhone(e.target.value)} placeholder="(555) 123-4567" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Email</Label>
                        <Input value={brandEmail} onChange={(e) => setBrandEmail(e.target.value)} placeholder="jane@email.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Brokerage</Label>
                        <Input value={brandBrokerage} onChange={(e) => setBrandBrokerage(e.target.value)} placeholder="Keller Williams" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Tagline</Label>
                        <Input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} placeholder="Your Home, Your Future" />
                      </div>
                    </div>

                    <div className="h-[1px] bg-border my-1" />
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Property Info (optional)</p>

                    <div className="space-y-1.5">
                      <Label className="text-sm">Address</Label>
                      <Input value={brandAddress} onChange={(e) => setBrandAddress(e.target.value)} placeholder="21 N William St" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">City, State</Label>
                        <Input value={brandCityState} onChange={(e) => setBrandCityState(e.target.value)} placeholder="Pearl River, NY" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Price</Label>
                        <Input value={brandPrice} onChange={(e) => setBrandPrice(e.target.value)} placeholder="4250/mo" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Features (one per line)</Label>
                      <textarea
                        value={brandFeatures}
                        onChange={(e) => setBrandFeatures(e.target.value)}
                        placeholder={"Downtown location\n6 office spaces\nDual Entrances\nFull Kitchen"}
                        rows={4}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-accent" />
                    Appearance
                  </h3>

                  {/* Font picker */}
                  <div className="mb-5">
                    <Label className="text-sm font-semibold mb-2 block">Font Style</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setBrandFont(f.id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            brandFont === f.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="text-sm font-semibold">{f.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: f.family }}>Aa Bb Cc 123</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background color */}
                  <Label className="text-sm font-semibold mb-2 block">Background Color</Label>
                  <div className="flex items-center gap-4 mb-3">
                    <input
                      type="color"
                      value={brandBgColor}
                      onChange={(e) => setBrandBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={brandBgColor}
                      onChange={(e) => setBrandBgColor(e.target.value)}
                      className="w-28 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Ignored if background photo is uploaded</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BG_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setBrandBgColor(c)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all flex-shrink-0 ${
                          brandBgColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>

                  {/* Accent color */}
                  <div className="mt-5">
                    <Label className="text-sm font-semibold mb-2 block">Accent Color <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <p className="text-xs text-muted-foreground mb-2">Applies to agent name, price, and tagline. Leave empty for default.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandAccentColor || "#ffffff"}
                        onChange={(e) => setBrandAccentColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        value={brandAccentColor}
                        onChange={(e) => setBrandAccentColor(e.target.value)}
                        placeholder="None"
                        className="w-28 font-mono text-sm"
                      />
                      {brandAccentColor && (
                        <button
                          onClick={() => setBrandAccentColor("")}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#d4af37", "#c0c0c0"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setBrandAccentColor(c)}
                          className={`w-7 h-7 rounded-lg border-2 transition-all flex-shrink-0 ${
                            brandAccentColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                  <h3 className="font-bold text-foreground mb-4">Live Preview</h3>

                  <div
                    ref={tab === "branding-card" ? previewRef : undefined}
                    className="rounded-xl overflow-hidden flex items-center justify-center"
                    style={{
                      width: "100%",
                      height: previewH + 24,
                      padding: 12,
                      // Checkerboard pattern to show transparency
                      backgroundImage: "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    }}
                  >
                    <div style={{ width: previewW, height: previewH, overflow: "hidden" }}>
                      <div
                        data-export-target="true"
                        style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: currentBrandOrientation.width, height: currentBrandOrientation.height }}
                      >
                        <BrandingCardTemplate
                          orientation={currentBrandOrientation}
                          logo={brandLogo}
                          headshot={brandHeadshot}
                          agentName={brandAgentName}
                          phone={brandPhone}
                          email={brandEmail}
                          brokerage={brandBrokerage}
                          tagline={brandTagline}
                          address={brandAddress}
                          cityState={brandCityState}
                          price={brandPrice}
                          features={brandFeatures}
                          bgColor={brandBgColor}
                          accentColor={brandAccentColor}
                          bgPhoto={brandBgPhoto}
                          fontFamily={currentFontFamily}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Orientation selector */}
                  <div className="mt-5">
                    <Label className="text-sm font-semibold mb-2 block">Orientation</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {BRANDING_ORIENTATIONS.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => setBrandOrientation(o.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            brandOrientation === o.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="text-sm font-semibold">{o.label}</p>
                          <p className="text-[11px] text-muted-foreground">{o.sublabel}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full mt-5 bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg"
                  >
                    {exporting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Exporting...</>
                    ) : (
                      <><Download className="mr-2 h-5 w-5" /> Download PNG</>
                    )}
                  </Button>
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
