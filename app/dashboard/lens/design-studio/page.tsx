"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Calendar,
  Clock,
  Type,
  Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type TemplateType = "just-listed" | "open-house" | "price-reduced" | "just-sold";
type SizeOption = "square" | "story" | "postcard";
type StudioTab = "templates" | "branding-card";

interface TemplateConfig {
  id: TemplateType;
  label: string;
  icon: typeof Home;
  color: string;
  badgeColor: string;
}

interface SizeConfig {
  id: SizeOption;
  label: string;
  sublabel: string;
  width: number;
  height: number;
}

const TEMPLATES: TemplateConfig[] = [
  { id: "just-listed", label: "Just Listed", icon: Home, color: "bg-blue-600", badgeColor: "bg-blue-600" },
  { id: "open-house", label: "Open House", icon: Calendar, color: "bg-emerald-600", badgeColor: "bg-emerald-600" },
  { id: "price-reduced", label: "Price Reduced", icon: DollarSign, color: "bg-red-600", badgeColor: "bg-red-600" },
  { id: "just-sold", label: "Just Sold", icon: CheckCircle, color: "bg-amber-600", badgeColor: "bg-amber-600" },
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
  accept = "image/*",
  className = "",
}: {
  label: string;
  imageUrl: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
  hint?: string;
  accept?: string;
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
        accept={accept}
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
   TEMPLATE RENDERERS
   ═══════════════════════════════════════════════════════ */

function JustListedTemplate({
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
}) {
  const isStory = size.id === "story";
  const photoPercent = isStory ? 65 : 60;
  const infoPercent = isStory ? 35 : 40;

  return (
    <div
      className="relative overflow-hidden bg-gray-900"
      style={{ width: size.width, height: size.height }}
    >
      {/* Top: Listing photo */}
      <div className="absolute inset-x-0 top-0" style={{ height: `${photoPercent}%` }}>
        {listingPhoto ? (
          <img src={listingPhoto} alt="Listing" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <ImageIcon className="text-gray-500" style={{ width: 80, height: 80 }} />
          </div>
        )}
        {/* Gradient fade into info bar */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-900 to-transparent" />
      </div>

      {/* Bottom: Info bar */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gray-900 flex items-center"
        style={{ height: `${infoPercent}%`, padding: isStory ? "0 48px" : "0 40px" }}
      >
        {/* Left: Agent info */}
        <div className="flex items-center gap-4 flex-shrink-0" style={{ maxWidth: "50%" }}>
          {headshot ? (
            <img
              src={headshot}
              alt="Agent"
              className="rounded-full object-cover flex-shrink-0 border-2 border-white/20"
              style={{ width: isStory ? 90 : 80, height: isStory ? 90 : 80 }}
            />
          ) : (
            <div
              className="rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 border-2 border-white/20"
              style={{ width: isStory ? 90 : 80, height: isStory ? 90 : 80 }}
            >
              <User className="text-gray-500" style={{ width: 32, height: 32 }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold truncate" style={{ fontSize: isStory ? 22 : 18 }}>
              {agentName || "Agent Name"}
            </p>
            <p className="text-gray-400 truncate" style={{ fontSize: isStory ? 16 : 14 }}>
              {brokerage || "Brokerage"}
            </p>
            <p className="text-gray-400 truncate" style={{ fontSize: isStory ? 16 : 14 }}>
              {phone || "(555) 000-0000"}
            </p>
          </div>
        </div>

        {/* Right: Listing info */}
        <div className="ml-auto text-right flex-shrink-0" style={{ maxWidth: "48%" }}>
          <div
            className="inline-block bg-blue-600 text-white font-black uppercase tracking-wider px-4 py-1.5 rounded-sm mb-3"
            style={{ fontSize: isStory ? 18 : 15 }}
          >
            Just Listed
          </div>
          <p className="text-white font-bold leading-tight truncate" style={{ fontSize: isStory ? 22 : 18 }}>
            {address || "123 Main Street"}
          </p>
          <p className="text-gray-300 mt-1" style={{ fontSize: isStory ? 18 : 15 }}>
            {[beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`]
              .filter(Boolean)
              .join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF"}
          </p>
          <p className="text-white font-black mt-2" style={{ fontSize: isStory ? 32 : 26 }}>
            {price ? `$${price}` : "$000,000"}
          </p>
        </div>

        {/* Logo in corner */}
        {logo && (
          <img
            src={logo}
            alt="Logo"
            className="absolute object-contain"
            style={{
              bottom: isStory ? 20 : 16,
              left: isStory ? 48 : 40,
              maxWidth: isStory ? 100 : 80,
              maxHeight: isStory ? 50 : 40,
              opacity: 0.7,
            }}
          />
        )}
      </div>
    </div>
  );
}

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
}) {
  const isStory = size.id === "story";

  return (
    <div
      className="relative overflow-hidden bg-gray-900"
      style={{ width: size.width, height: size.height }}
    >
      {/* Full bleed listing photo */}
      {listingPhoto ? (
        <img src={listingPhoto} alt="Listing" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
          <ImageIcon className="text-gray-500" style={{ width: 100, height: 100 }} />
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80" />

      {/* Top: OPEN HOUSE + date/time */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center justify-center text-center text-white"
        style={{ height: isStory ? "30%" : "38%", padding: "0 32px" }}
      >
        <div
          className="inline-block bg-emerald-600 text-white font-black uppercase tracking-[0.15em] px-6 py-2 rounded-sm"
          style={{ fontSize: isStory ? 28 : 26 }}
        >
          Open House
        </div>
        <p className="mt-4 font-bold text-white" style={{ fontSize: isStory ? 28 : 24 }}>
          {date || "Saturday, March 22"}
        </p>
        <p className="text-white/80 font-semibold" style={{ fontSize: isStory ? 22 : 20 }}>
          {time || "1:00 PM – 4:00 PM"}
        </p>
      </div>

      {/* Bottom: Property info bar */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ padding: isStory ? "0 40px 0" : "0 32px 0" }}
      >
        {/* Property details */}
        <div
          className="text-center text-white mb-4"
          style={{ paddingBottom: isStory ? 8 : 4 }}
        >
          <p className="font-bold leading-tight" style={{ fontSize: isStory ? 24 : 20 }}>
            {address || "123 Main Street"}
          </p>
          <p className="text-white/80 mt-1" style={{ fontSize: isStory ? 18 : 16 }}>
            {[beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`]
              .filter(Boolean)
              .join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF"}
          </p>
          <p className="font-black mt-2" style={{ fontSize: isStory ? 30 : 26 }}>
            {price ? `$${price}` : "$000,000"}
          </p>
        </div>

        {/* Agent info bar */}
        <div
          className="flex items-center justify-center gap-3 bg-black/50 backdrop-blur-sm rounded-t-xl"
          style={{ padding: isStory ? "16px 24px" : "12px 20px" }}
        >
          {headshot ? (
            <img
              src={headshot}
              alt="Agent"
              className="rounded-full object-cover flex-shrink-0 border-2 border-white/30"
              style={{ width: isStory ? 56 : 48, height: isStory ? 56 : 48 }}
            />
          ) : (
            <div
              className="rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 border-2 border-white/30"
              style={{ width: isStory ? 56 : 48, height: isStory ? 56 : 48 }}
            >
              <User className="text-gray-400" style={{ width: 20, height: 20 }} />
            </div>
          )}
          <div className="text-white min-w-0">
            <p className="font-bold truncate" style={{ fontSize: isStory ? 17 : 15 }}>
              {agentName || "Agent Name"}
            </p>
            <p className="text-white/60 truncate" style={{ fontSize: isStory ? 14 : 13 }}>
              {[brokerage, phone].filter(Boolean).join("  ·  ") || "Brokerage  ·  (555) 000-0000"}
            </p>
          </div>
          {logo && (
            <img
              src={logo}
              alt="Logo"
              className="object-contain flex-shrink-0 ml-auto"
              style={{ maxWidth: 70, maxHeight: 36, opacity: 0.8 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PriceReducedTemplate(props: {
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
}) {
  // Same structure as JustListed but with red badge
  return <JustListedTemplate {...props} />;
}

function JustSoldTemplate(props: {
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
}) {
  return <JustListedTemplate {...props} />;
}

/* Override badge text/color for Price Reduced and Just Sold
   We do this by wrapping the JustListed template and replacing the badge inline.
   Since the badge is rendered inside JustListedTemplate, we instead create
   a generic InfoBarTemplate that accepts badgeText and badgeColor. */

function GenericInfoBarTemplate({
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
}) {
  const isStory = size.id === "story";
  const photoPercent = isStory ? 65 : 60;
  const infoPercent = isStory ? 35 : 40;

  return (
    <div
      className="relative overflow-hidden bg-gray-900"
      style={{ width: size.width, height: size.height }}
    >
      {/* Top: Listing photo */}
      <div className="absolute inset-x-0 top-0" style={{ height: `${photoPercent}%` }}>
        {listingPhoto ? (
          <img src={listingPhoto} alt="Listing" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <ImageIcon className="text-gray-500" style={{ width: 80, height: 80 }} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-900 to-transparent" />
      </div>

      {/* Bottom: Info bar */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gray-900 flex items-center"
        style={{ height: `${infoPercent}%`, padding: isStory ? "0 48px" : "0 40px" }}
      >
        {/* Left: Agent info */}
        <div className="flex items-center gap-4 flex-shrink-0" style={{ maxWidth: "50%" }}>
          {headshot ? (
            <img
              src={headshot}
              alt="Agent"
              className="rounded-full object-cover flex-shrink-0 border-2 border-white/20"
              style={{ width: isStory ? 90 : 80, height: isStory ? 90 : 80 }}
            />
          ) : (
            <div
              className="rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 border-2 border-white/20"
              style={{ width: isStory ? 90 : 80, height: isStory ? 90 : 80 }}
            >
              <User className="text-gray-500" style={{ width: 32, height: 32 }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold truncate" style={{ fontSize: isStory ? 22 : 18 }}>
              {agentName || "Agent Name"}
            </p>
            <p className="text-gray-400 truncate" style={{ fontSize: isStory ? 16 : 14 }}>
              {brokerage || "Brokerage"}
            </p>
            <p className="text-gray-400 truncate" style={{ fontSize: isStory ? 16 : 14 }}>
              {phone || "(555) 000-0000"}
            </p>
          </div>
        </div>

        {/* Right: Listing info */}
        <div className="ml-auto text-right flex-shrink-0" style={{ maxWidth: "48%" }}>
          <div
            className="inline-block text-white font-black uppercase tracking-wider px-4 py-1.5 rounded-sm mb-3"
            style={{ fontSize: isStory ? 18 : 15, backgroundColor: badgeColor }}
          >
            {badgeText}
          </div>
          <p className="text-white font-bold leading-tight truncate" style={{ fontSize: isStory ? 22 : 18 }}>
            {address || "123 Main Street"}
          </p>
          <p className="text-gray-300 mt-1" style={{ fontSize: isStory ? 18 : 15 }}>
            {[beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`]
              .filter(Boolean)
              .join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF"}
          </p>
          <p className="text-white font-black mt-2" style={{ fontSize: isStory ? 32 : 26 }}>
            {price ? `$${price}` : "$000,000"}
          </p>
        </div>

        {logo && (
          <img
            src={logo}
            alt="Logo"
            className="absolute object-contain"
            style={{
              bottom: isStory ? 20 : 16,
              left: isStory ? 48 : 40,
              maxWidth: isStory ? 100 : 80,
              maxHeight: isStory ? 50 : 40,
              opacity: 0.7,
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BRANDING CARD TEMPLATE
   ═══════════════════════════════════════════════════════ */

function BrandingCardTemplate({
  orientation,
  logo,
  agentName,
  phone,
  email,
  brokerage,
  tagline,
  bgColor,
  bgPhoto,
}: {
  orientation: { width: number; height: number; id: string };
  logo: string | null;
  agentName: string;
  phone: string;
  email: string;
  brokerage: string;
  tagline: string;
  bgColor: string;
  bgPhoto: string | null;
}) {
  const isVertical = orientation.id === "vertical";

  return (
    <div
      className="relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        width: orientation.width,
        height: orientation.height,
        backgroundColor: bgColor || "#1a1a2e",
      }}
    >
      {bgPhoto && (
        <>
          <img src={bgPhoto} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-12 gap-4">
        {logo && (
          <img
            src={logo}
            alt="Logo"
            className="object-contain mb-2"
            style={{
              maxWidth: isVertical ? 240 : 300,
              maxHeight: isVertical ? 120 : 100,
            }}
          />
        )}
        <p
          className="text-white font-bold leading-tight"
          style={{ fontSize: isVertical ? 48 : 44 }}
        >
          {agentName || "Agent Name"}
        </p>
        {brokerage && (
          <p className="text-white/70" style={{ fontSize: isVertical ? 26 : 24 }}>
            {brokerage}
          </p>
        )}
        {tagline && (
          <p className="text-white/50 italic" style={{ fontSize: isVertical ? 22 : 20 }}>
            {tagline}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-2">
          {phone && (
            <span className="text-white/80 flex items-center gap-2" style={{ fontSize: isVertical ? 20 : 18 }}>
              <Phone style={{ width: 18, height: 18 }} className="text-white/50" />
              {phone}
            </span>
          )}
          {email && (
            <span className="text-white/80 flex items-center gap-2" style={{ fontSize: isVertical ? 20 : 18 }}>
              <Mail style={{ width: 18, height: 18 }} className="text-white/50" />
              {email}
            </span>
          )}
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

  // Branding card state
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandBgPhoto, setBrandBgPhoto] = useState<string | null>(null);
  const [brandAgentName, setBrandAgentName] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandBrokerage, setBrandBrokerage] = useState("");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandBgColor, setBrandBgColor] = useState("#1a1a2e");
  const [brandOrientation, setBrandOrientation] = useState<"landscape" | "vertical">("landscape");
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [uploadingBrandBg, setUploadingBrandBg] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const currentSize = SIZES.find((s) => s.id === selectedSize)!;
  const currentBrandOrientation = BRANDING_ORIENTATIONS.find((o) => o.id === brandOrientation)!;

  // Calculate scale to fit preview in the right panel
  const getPreviewScale = useCallback(() => {
    if (tab === "branding-card") {
      const w = currentBrandOrientation.width;
      const h = currentBrandOrientation.height;
      const maxW = 520;
      const maxH = 580;
      return Math.min(maxW / w, maxH / h, 1);
    }
    const w = currentSize.width;
    const h = currentSize.height;
    const maxW = 520;
    const maxH = 580;
    return Math.min(maxW / w, maxH / h, 1);
  }, [tab, currentSize, currentBrandOrientation]);

  // Upload handlers
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
      // Find the actual template container inside the preview
      const templateEl = previewRef.current.querySelector("[data-export-target]") as HTMLElement;
      if (!templateEl) return;

      const canvas = await html2canvas(templateEl, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: templateEl.offsetWidth,
        height: templateEl.offsetHeight,
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

  // Template badge config
  const getBadgeConfig = (templateId: TemplateType) => {
    switch (templateId) {
      case "just-listed":
        return { text: "Just Listed", color: "#2563eb" };
      case "open-house":
        return { text: "Open House", color: "#059669" };
      case "price-reduced":
        return { text: "Price Reduced", color: "#dc2626" };
      case "just-sold":
        return { text: "Just Sold", color: "#d97706" };
    }
  };

  const badge = getBadgeConfig(selectedTemplate);

  const scale = getPreviewScale();

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

        {/* ═══ LISTING GRAPHICS TAB ═══ */}
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

            {/* Main Layout: Form | Preview */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Upload + Form */}
              <div className="space-y-6">
                {/* Uploads */}
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

                {/* Property Details */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    Property Details
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Address</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main Street, Anytown"
                      />
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

                {/* Agent Info */}
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
              </div>

              {/* Right: Preview + Export */}
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                  <h3 className="font-bold text-foreground mb-4">Live Preview</h3>

                  {/* Preview container */}
                  <div
                    ref={previewRef}
                    className="bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ minHeight: 400 }}
                  >
                    <div
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "center center",
                      }}
                    >
                      <div data-export-target="true">
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
                          />
                        ) : (
                          <GenericInfoBarTemplate
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

                  {/* Download button */}
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

        {/* ═══ BRANDING CARD TAB ═══ */}
        {tab === "branding-card" && (
          <>
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-cyan-800">
                <strong>Tip:</strong> Create your intro/outro card here, download as PNG, then upload it in the order form under "Custom branding cards."
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
                  <div className="grid grid-cols-2 gap-4">
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

                {/* Info */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-accent" />
                    Card Details
                  </h3>
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
                    <div className="space-y-1.5">
                      <Label className="text-sm">Brokerage</Label>
                      <Input value={brandBrokerage} onChange={(e) => setBrandBrokerage(e.target.value)} placeholder="Keller Williams" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Tagline</Label>
                      <Input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} placeholder="Your Home, Your Future" />
                    </div>
                  </div>
                </div>

                {/* Background color */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-accent" />
                    Background Color
                  </h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={brandBgColor}
                      onChange={(e) => setBrandBgColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={brandBgColor}
                      onChange={(e) => setBrandBgColor(e.target.value)}
                      className="w-32 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Ignored if a background photo is uploaded</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {["#1a1a2e", "#0f172a", "#1e293b", "#27272a", "#0c4a6e", "#134e4a", "#3f3f46", "#18181b"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setBrandBgColor(c)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          brandBgColor === c ? "border-primary scale-110" : "border-border"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Preview + Export */}
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                  <h3 className="font-bold text-foreground mb-4">Live Preview</h3>

                  <div
                    ref={previewRef}
                    className="bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ minHeight: 400 }}
                  >
                    <div
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "center center",
                      }}
                    >
                      <div data-export-target="true">
                        <BrandingCardTemplate
                          orientation={currentBrandOrientation}
                          logo={brandLogo}
                          agentName={brandAgentName}
                          phone={brandPhone}
                          email={brandEmail}
                          brokerage={brandBrokerage}
                          tagline={brandTagline}
                          bgColor={brandBgColor}
                          bgPhoto={brandBgPhoto}
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
