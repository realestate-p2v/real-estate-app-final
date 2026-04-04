"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ImageIcon, Upload, X, Sparkles, ArrowRight, Loader2, Palette, User, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BrandingCardTemplate } from "@/components/design-templates";

/* ═══════════════════════════════════════════════════════
   COLOR SWATCHES
   ═══════════════════════════════════════════════════════ */

const BROKERAGE_COLORS = [
  "#003366","#00274c","#c8102e","#b5985a","#1e3a5f","#14532d","#1a1a2e",
  "#7b2d26","#4b0082","#2c3e50","#0e4d92","#8b0000","#1b5e20","#37474f",
  "#5d4037","#283593","#01579b","#004d40","#880e4f","#e65100","#000000",
];

const ACCENT_COLORS = ["#b8860b","#c41e3a","#1e40af","#0d6e4f","#6b21a8","#be185d","#0e7490","#c2410c","#8b6914","#71717a","#ffffff","#000000"];

function ColorSwatches({ colors, currentColor, onSelect }: { colors: string[]; currentColor: string; onSelect: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button key={c} onClick={() => onSelect(c)}
          className={`w-6 h-6 rounded-md border-2 transition-all flex-shrink-0 ${currentColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"}`}
          style={{ backgroundColor: c }} title={c}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

const brandingOptions = [
  { id: "unbranded", name: "No Branding", description: "Clean video without intro/outro cards", icon: "🚫" },
  { id: "create", name: "Create Card", description: "Build a branding card right here", icon: "✨" },
  { id: "choose", name: "My Cards", description: "Pick from your saved designs", icon: "📁" },
  { id: "upload", name: "Upload Card", description: "Use your own custom image", icon: "📤" },
];

export interface BrandingData {
  type: "unbranded" | "custom" | "upload";
  logoUrl?: string;
  logoFile?: File;
  agentName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  website?: string;
  customIntroCardUrl?: string;
  customOutroCardUrl?: string;
}

interface BrandingSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  brandingData?: BrandingData;
  onBrandingDataChange?: (data: BrandingData) => void;
  propertyCity?: string;
  propertyState?: string;
  propertyBedrooms?: string;
  propertyBathrooms?: string;
  propertyAddress?: string;
  includeAddressOnCard?: boolean;
  onIncludeAddressChange?: (val: boolean) => void;
  includeUnbranded?: boolean;
  onIncludeUnbrandedChange?: (val: boolean) => void;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function BrandingSelector({
  selected,
  onSelect,
  brandingData,
  onBrandingDataChange,
  propertyCity,
  propertyState,
  propertyBedrooms,
  propertyBathrooms,
  propertyAddress,
  includeAddressOnCard,
  onIncludeAddressChange,
  includeUnbranded,
  onIncludeUnbrandedChange,
}: BrandingSelectorProps) {
  // Map internal selection to the existing BrandingData.type
  const [internalMode, setInternalMode] = useState<string>(
    selected === "custom" ? "create" : selected === "upload" ? "upload" : selected === "unbranded" ? "unbranded" : "create"
  );

  // ── Card builder state ──
  const [cbHeadshot, setCbHeadshot] = useState<string | null>(null);
  const [cbLogo, setCbLogo] = useState<string | null>(null);
  const [cbAgentName, setCbAgentName] = useState(brandingData?.agentName || "");
  const [cbPhone, setCbPhone] = useState(brandingData?.phone || "");
  const [cbEmail, setCbEmail] = useState(brandingData?.email || "");
  const [cbBrokerage, setCbBrokerage] = useState(brandingData?.companyName || "");
  const [cbWebsite, setCbWebsite] = useState(brandingData?.website || "");
  const [cbTagline, setCbTagline] = useState("");
  const [cbBgColor, setCbBgColor] = useState("#003366");
  const [cbAccentColor, setCbAccentColor] = useState("");
  const [cbOrientation, setCbOrientation] = useState<"landscape" | "vertical">("landscape");
  const [cbGenerating, setCbGenerating] = useState(false);
  const [cbGenerated, setCbGenerated] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Upload state ──
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [uploadingCard, setUploadingCard] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Choose from library state ──
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);

  // Load saved cards from design_exports when "choose" is selected
  useEffect(() => {
    if (internalMode === "choose") {
      loadSavedCards();
    }
  }, [internalMode]);

  // Load saved headshot/logo from profile
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("lens_usage").select("saved_headshot_url, saved_logo_url").eq("user_id", user.id).single();
        if (data?.saved_headshot_url && !cbHeadshot) setCbHeadshot(data.saved_headshot_url);
        if (data?.saved_logo_url && !cbLogo) setCbLogo(data.saved_logo_url);
      } catch { /* ignore */ }
    };
    loadSaved();
  }, []);

  const loadSavedCards = async () => {
    setLoadingSaved(true);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingSaved(false); return; }
      const { data } = await supabase
        .from("design_exports")
        .select("id, export_url, template_type, created_at")
        .eq("user_id", user.id)
        .in("template_type", ["branding-card"])
        .order("created_at", { ascending: false })
        .limit(20);
      setSavedCards(data || []);
    } catch (err) {
      console.error("Failed to load saved cards:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleModeSelect = (mode: string) => {
    setInternalMode(mode);
    if (mode === "unbranded") {
      onSelect("unbranded");
      onBrandingDataChange?.({ ...brandingData, type: "unbranded" });
      onIncludeUnbrandedChange?.(false);
    } else if (mode === "create") {
      onSelect("upload"); // Will generate and upload the card
      onBrandingDataChange?.({ ...brandingData, type: "upload" });
    } else if (mode === "choose") {
      onSelect("upload");
      onBrandingDataChange?.({ ...brandingData, type: "upload" });
    } else if (mode === "upload") {
      onSelect("upload");
      onBrandingDataChange?.({ ...brandingData, type: "upload" });
    }
  };

  // ── Image upload helpers ──
  const uploadToCloudinary = async (file: Blob, folder: string): Promise<string | null> => {
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
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: "POST", body: fd });
      const result = await res.json();
      return result.secure_url || null;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const handleHeadshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCbHeadshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCbLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCardPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadingCard(true);
    const url = await uploadToCloudinary(file, "design-studio");
    setUploadingCard(false);
    if (url) {
      onBrandingDataChange?.({ ...brandingData, type: "upload", customIntroCardUrl: url, customOutroCardUrl: url });
    }
  };

  // ── Generate branding card from builder ──
  const handleGenerateCard = async () => {
    if (!previewRef.current) return;
    setCbGenerating(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = previewRef.current.querySelector("[data-card-target]") as HTMLElement;
      if (!el) throw new Error("Card target not found");
      const cardW = cbOrientation === "landscape" ? 1920 : 1080;
      const cardH = cbOrientation === "landscape" ? 1080 : 1920;
      
      // Remove scale transform for full-resolution capture
      const originalTransform = el.style.transform;
      const originalWidth = el.parentElement?.style.width;
      const originalHeight = el.parentElement?.style.height;
      const originalOverflow = el.parentElement?.style.overflow;
      el.style.transform = "none";
      if (el.parentElement) {
        el.parentElement.style.width = `${cardW}px`;
        el.parentElement.style.height = `${cardH}px`;
        el.parentElement.style.overflow = "hidden";
      }
      
      const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, width: cardW, height: cardH });
      
      // Restore scale transform
      el.style.transform = originalTransform;
      if (el.parentElement) {
        el.parentElement.style.width = originalWidth || "";
        el.parentElement.style.height = originalHeight || "";
        el.parentElement.style.overflow = originalOverflow || "";
      }
      
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      const url = await uploadToCloudinary(new File([blob], "branding-card.png", { type: "image/png" }), "design-studio");
      if (url) {
        onBrandingDataChange?.({
          ...brandingData,
          type: "upload",
          customIntroCardUrl: url,
          customOutroCardUrl: url,
          agentName: cbAgentName,
          companyName: cbBrokerage,
          phone: cbPhone,
          email: cbEmail,
          website: cbWebsite,
        });
        setCbGenerated(true);
      }
    } catch (err) {
      console.error("Card generation failed:", err);
      alert("Failed to generate card. Please try again.");
    } finally {
      setCbGenerating(false);
    }
  };

  const handleSelectSavedCard = (card: any) => {
    setSelectedSavedCard(card.id);
    onBrandingDataChange?.({
      ...brandingData,
      type: "upload",
      customIntroCardUrl: card.export_url,
      customOutroCardUrl: card.export_url,
    });
  };

  const hasBranding = internalMode !== "unbranded";

  // Card builder preview dimensions
  const cardW = cbOrientation === "landscape" ? 1920 : 1080;
  const cardH = cbOrientation === "landscape" ? 1080 : 1920;
  const previewScale = cbOrientation === "landscape" ? 320 / 1920 : 200 / 1080;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Branding</h3>
          <p className="text-sm text-muted-foreground">Add your branding to the video intro & outro</p>
        </div>
      </div>

      {/* Four branding options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {brandingOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleModeSelect(option.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              internalMode === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {internalMode === option.id && (
              <div className="absolute top-3 right-3">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="text-lg mb-1">{option.icon}</div>
            <p className="font-semibold text-foreground text-sm pr-5">{option.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
          </button>
        ))}
      </div>

      {/* ═══ DELIVER BOTH COPIES ═══ */}
      {hasBranding && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={includeUnbranded}
              onCheckedChange={(checked) => onIncludeUnbrandedChange?.(checked === true)}
              className="h-5 w-5 mt-0.5"
            />
            <div>
              <span className="text-sm font-semibold text-foreground">Deliver both branded and unbranded copies</span>
              <p className="text-xs text-muted-foreground mt-0.5">Get two versions — branded for social, unbranded for MLS.</p>
            </div>
          </label>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           CREATE CARD — Inline builder
         ═══════════════════════════════════════════ */}
      {internalMode === "create" && (
        <div className="mt-2 p-5 bg-muted/30 rounded-xl border border-border space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Card Builder
            </h4>
            <Link href="/dashboard/lens/design-studio" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80">
              Full Design Studio <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT: Form */}
            <div className="space-y-4">
              {/* Image uploads */}
              <div className="flex gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Headshot</Label>
                  {cbHeadshot ? (
                    <div className="relative">
                      <img src={cbHeadshot} alt="" className="h-14 w-14 object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => setCbHeadshot(null)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => headshotInputRef.current?.click()} className="h-14 w-14 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </button>
                  )}
                  <input ref={headshotInputRef} type="file" accept="image/*" onChange={handleHeadshotUpload} className="hidden" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Logo</Label>
                  {cbLogo ? (
                    <div className="relative">
                      <img src={cbLogo} alt="" className="h-14 w-14 object-contain rounded-lg border border-border bg-background" />
                      <button type="button" onClick={() => setCbLogo(null)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="h-14 w-14 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Agent Name</Label>
                  <Input value={cbAgentName} onChange={(e) => setCbAgentName(e.target.value)} placeholder="Jane Smith" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={cbPhone} onChange={(e) => setCbPhone(e.target.value)} placeholder="(555) 123-4567" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={cbEmail} onChange={(e) => setCbEmail(e.target.value)} placeholder="jane@email.com" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Brokerage</Label>
                  <Input value={cbBrokerage} onChange={(e) => setCbBrokerage(e.target.value)} placeholder="Coldwell Banker" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Website</Label>
                  <Input value={cbWebsite} onChange={(e) => setCbWebsite(e.target.value)} placeholder="www.site.com" className="h-9 text-sm" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Tagline</Label>
                  <Input value={cbTagline} onChange={(e) => setCbTagline(e.target.value)} placeholder="Your Home, Your Future" className="h-9 text-sm" />
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Background</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={cbBgColor} onChange={(e) => setCbBgColor(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input value={cbBgColor} onChange={(e) => setCbBgColor(e.target.value)} className="w-24 font-mono text-xs h-8" />
                </div>
                <ColorSwatches colors={BROKERAGE_COLORS} currentColor={cbBgColor} onSelect={setCbBgColor} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Accent Color <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={cbAccentColor || "#ffffff"} onChange={(e) => setCbAccentColor(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input value={cbAccentColor} onChange={(e) => setCbAccentColor(e.target.value)} placeholder="None" className="w-24 font-mono text-xs h-8" />
                  {cbAccentColor && <button type="button" onClick={() => setCbAccentColor("")} className="text-xs text-muted-foreground underline">Clear</button>}
                </div>
                <ColorSwatches colors={ACCENT_COLORS} currentColor={cbAccentColor} onSelect={setCbAccentColor} />
              </div>

              {/* Orientation */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setCbOrientation("landscape")}
                  className={`flex-1 p-2 rounded-lg border-2 text-center text-xs font-semibold transition-all ${cbOrientation === "landscape" ? "border-primary bg-primary/10" : "border-border"}`}>
                  📺 Landscape
                </button>
                <button type="button" onClick={() => setCbOrientation("vertical")}
                  className={`flex-1 p-2 rounded-lg border-2 text-center text-xs font-semibold transition-all ${cbOrientation === "vertical" ? "border-primary bg-primary/10" : "border-border"}`}>
                  📱 Vertical
                </button>
              </div>

              {/* Address on card */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeAddressOnCard} onCheckedChange={(checked) => onIncludeAddressChange?.(checked === true)} className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">Include address on card</span>
              </label>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="flex flex-col items-center">
              <div ref={previewRef} className="rounded-lg overflow-hidden border border-border"
                style={{
                  width: cbOrientation === "landscape" ? 320 : 200,
                  height: cbOrientation === "landscape" ? 180 : (200 * 1920 / 1080),
                  backgroundImage: "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                }}>
                <div style={{ width: cbOrientation === "landscape" ? 320 : 200, height: cbOrientation === "landscape" ? 180 : (200 * 1920 / 1080), overflow: "hidden" }}>
                  <div data-card-target="true" style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: cardW, height: cardH }}>
                    <BrandingCardTemplate
                      orientation={{ width: cardW, height: cardH, id: cbOrientation }}
                      logo={cbLogo}
                      headshot={cbHeadshot}
                      agentName={cbAgentName}
                      phone={cbPhone}
                      email={cbEmail}
                      brokerage={cbBrokerage}
                      tagline={cbTagline}
                      website={cbWebsite}
                      address={includeAddressOnCard ? (propertyAddress || "") : ""}
                      cityState={includeAddressOnCard ? [propertyCity, propertyState].filter(Boolean).join(", ") : ""}
                      price=""
                      features=""
                      bgColor={cbBgColor}
                      accentColor={cbAccentColor}
                      bgPhoto={null}
                      fontFamily="system-ui, -apple-system, sans-serif"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateCard}
                disabled={cbGenerating}
                className="mt-3 w-full max-w-[320px] bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              >
                {cbGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                ) : cbGenerated ? (
                  <><Check className="mr-2 h-4 w-4" />Card Applied ✓</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Use This Card</>
                )}
              </Button>
              {cbGenerated && (
                <p className="text-xs text-green-600 font-medium mt-1 text-center">Card will be used as intro & outro</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           CHOOSE FROM LIBRARY
         ═══════════════════════════════════════════ */}
      {internalMode === "choose" && (
        <div className="mt-2 p-5 bg-muted/30 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Your Saved Cards</h4>
            <Link href="/dashboard/lens/design-studio" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80">
              Create More in Design Studio <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loadingSaved ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedCards.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground mb-2">No saved branding cards found.</p>
              <Link href="/dashboard/lens/design-studio" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent/80">
                Create one in Design Studio <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {savedCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSelectSavedCard(card)}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                    selectedSavedCard === card.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <img src={card.export_url} alt="" className="w-full aspect-video object-cover" />
                  {selectedSavedCard === card.id && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground p-1.5">
                    {new Date(card.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
           UPLOAD YOUR OWN CARD
         ═══════════════════════════════════════════ */}
      {internalMode === "upload" && (
        <div className="mt-2 p-5 bg-muted/30 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Upload Your Branding Card</h4>
            <Link href="/dashboard/lens/design-studio" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80">
              <Sparkles className="h-3 w-3" />
              Create in Design Studio
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload one image — it will be used as both the intro and outro card. Recommended: 1920×1080 for landscape, 1080×1920 for vertical.
          </p>

          {cardPreview ? (
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border max-w-md">
              <img src={cardPreview} alt="Card" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setCardPreview(null); if (cardInputRef.current) cardInputRef.current.value = ""; onBrandingDataChange?.({ ...brandingData, type: "upload", customIntroCardUrl: undefined, customOutroCardUrl: undefined }); }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                <X className="h-4 w-4" />
              </button>
              {uploadingCard && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
              <div className="absolute bottom-2 left-2 bg-black/60 text-white/80 text-[9px] font-medium px-2 py-0.5 rounded-full">
                Used for Intro & Outro
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => cardInputRef.current?.click()}
              className="w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Upload your branding card</span>
              <span className="text-xs text-muted-foreground">PNG or JPG</span>
            </button>
          )}
          <input ref={cardInputRef} type="file" accept="image/*" onChange={handleCardUpload} className="hidden" />
        </div>
      )}
    </div>
  );
}
