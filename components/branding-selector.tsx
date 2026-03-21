"use client";

import { useState, useRef } from "react";
import { Check, ImageIcon, Upload, X, Sparkles, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

const brandingOptions = [
  {
    id: "unbranded",
    name: "No Branding",
    description: "Clean video without intro/outro cards",
    price: 0,
  },
  {
    id: "custom",
    name: "Built-in Branding",
    description: "We create intro/outro cards with your info",
    price: 0,
  },
  {
    id: "upload",
    name: "Upload Your Own Cards",
    description: "Use your own custom intro/outro images",
    price: 0,
  },
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

function BrandingPreview({ brandingData, logoPreview, propertyCity, propertyState, propertyBedrooms, propertyBathrooms, propertyAddress, includeAddressOnCard }: { 
  brandingData?: BrandingData; 
  logoPreview: string | null;
  propertyCity?: string;
  propertyState?: string;
  propertyBedrooms?: string;
  propertyBathrooms?: string;
  propertyAddress?: string;
  includeAddressOnCard?: boolean;
}) {
  const agent = brandingData?.agentName || "";
  const company = brandingData?.companyName || "";
  const phone = brandingData?.phone || "";
  const email = brandingData?.email || "";
  const website = brandingData?.website || "";

  const contactParts = [phone, email].filter(x => x.trim());
  const contactLine = contactParts.join(" | ");

  const isEmpty = !agent && !company && !contactLine && !website && !logoPreview;

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-black/55" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
        {isEmpty ? (
          <div className="space-y-2">
            <p className="text-white/40 text-sm font-medium">Your branding preview</p>
            <p className="text-white/25 text-xs">Fill in the fields to see a live preview</p>
          </div>
        ) : (
          <>
            {logoPreview && (
              <div className="mb-1">
                <img src={logoPreview} alt="Logo" className="h-10 sm:h-12 w-auto object-contain mx-auto" />
              </div>
            )}
            <p className={`text-white font-bold leading-tight ${agent ? '' : 'text-white/30'}`}
               style={{ fontSize: 'clamp(13px, 3.5vw, 18px)', marginTop: logoPreview ? '1%' : '0' }}>
              {agent || "Agent Name"}
            </p>
            <p className={`leading-tight mt-0.5 ${company ? 'text-white/85' : 'text-white/25'}`}
               style={{ fontSize: 'clamp(10px, 2.5vw, 13px)' }}>
              {company || "Company / Brokerage"}
            </p>
            {(contactLine || (!agent && !company)) && (
              <p className={`leading-tight mt-1 ${contactLine ? 'text-white/80' : 'text-white/20'}`}
                 style={{ fontSize: 'clamp(8px, 2vw, 11px)' }}>
                {contactLine || "(555) 123-4567 | agent@email.com"}
              </p>
            )}
            {(website || (!agent && !company)) && (
              <p className={`leading-tight mt-0.5 ${website ? 'text-white/75' : 'text-white/20'}`}
                 style={{ fontSize: 'clamp(8px, 2vw, 11px)' }}>
                {website || "www.example.com"}
              </p>
            )}
            <p className="font-bold mt-2" style={{ fontSize: 'clamp(10px, 2.5vw, 13px)', color: '#FFD700' }}>
              Schedule a Showing Today
            </p>
            {(() => {
              const parts = [];
              if (propertyBedrooms) parts.push(`${propertyBedrooms} BD`);
              if (propertyBathrooms) parts.push(`${propertyBathrooms} BA`);
              if (propertyCity || propertyState) {
                parts.push([propertyCity, propertyState].filter(Boolean).join(", "));
              }
              const propertyLine = parts.length > 0 ? parts.join(" | ") : "3 BD | 2 BA | City, ST";
              const isPlaceholder = parts.length === 0;
              return (
                <p className={`mt-1 ${isPlaceholder ? 'text-white/25' : 'text-white/95'}`}
                   style={{ fontSize: 'clamp(7px, 1.8vw, 10px)' }}>
                  {includeAddressOnCard && propertyAddress ? `${propertyAddress} · ` : ""}{propertyLine}
                </p>
              );
            })()}
          </>
        )}
      </div>

      <div className="absolute top-2 left-2 bg-black/60 text-white/70 text-[9px] font-medium px-2 py-0.5 rounded-full">
        Preview — Intro / Outro Card
      </div>
    </div>
  );
}

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
  const [logoPreview, setLogoPreview] = useState<string | null>(brandingData?.logoUrl || null);
  const [introPreview, setIntroPreview] = useState<string | null>(null);
  const [outroPreview, setOutroPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const introInputRef = useRef<HTMLInputElement>(null);
  const outroInputRef = useRef<HTMLInputElement>(null);

  const handleTypeSelect = (type: string) => {
    onSelect(type);
    if (onBrandingDataChange) {
      onBrandingDataChange({
        ...brandingData,
        type: type as BrandingData["type"],
      });
    }
    // Reset unbranded checkbox when switching to "No Branding"
    if (type === "unbranded" && onIncludeUnbrandedChange) {
      onIncludeUnbrandedChange(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        if (onBrandingDataChange) {
          onBrandingDataChange({
            ...brandingData,
            type: selected as BrandingData["type"],
            logoFile: file,
            logoUrl: reader.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onBrandingDataChange) {
      onBrandingDataChange({
        ...brandingData,
        type: selected as BrandingData["type"],
        logoFile: undefined,
        logoUrl: undefined,
      });
    }
  };

  const handleCardUpload = (type: "intro" | "outro") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        if (type === "intro") setIntroPreview(url);
        else setOutroPreview(url);
        if (onBrandingDataChange) {
          onBrandingDataChange({
            ...brandingData,
            type: "upload",
            [type === "intro" ? "customIntroCardUrl" : "customOutroCardUrl"]: url,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCard = (type: "intro" | "outro") => {
    if (type === "intro") {
      setIntroPreview(null);
      if (introInputRef.current) introInputRef.current.value = "";
    } else {
      setOutroPreview(null);
      if (outroInputRef.current) outroInputRef.current.value = "";
    }
    if (onBrandingDataChange) {
      onBrandingDataChange({
        ...brandingData,
        type: "upload",
        [type === "intro" ? "customIntroCardUrl" : "customOutroCardUrl"]: undefined,
      });
    }
  };

  const handleFieldChange = (field: keyof BrandingData, value: string) => {
    if (onBrandingDataChange) {
      onBrandingDataChange({
        ...brandingData,
        type: selected as BrandingData["type"],
        [field]: value,
      });
    }
  };

  const hasBranding = selected !== "unbranded";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Branding</h3>
          <p className="text-sm text-muted-foreground">Add your branding to the video intro &amp; outro</p>
        </div>
      </div>

      {/* Three branding options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {brandingOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleTypeSelect(option.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              selected === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {selected === option.id && (
              <div className="absolute top-3 right-3">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <p className="font-semibold text-foreground pr-6 text-sm">{option.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            <p className="text-xs font-semibold text-primary mt-2">Free</p>
          </button>
        ))}
      </div>

      {/* ═══ DELIVER BOTH COPIES CHECKBOX ═══ */}
      {/* Shows whenever any branding is selected (custom or upload) */}
      {hasBranding && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={includeUnbranded}
              onCheckedChange={(checked) => onIncludeUnbrandedChange?.(checked === true)}
              className="h-5 w-5 mt-0.5"
            />
            <div>
              <span className="text-sm font-semibold text-foreground">
                Deliver both branded and unbranded copies
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get two versions — branded with intro/outro cards for social media, unbranded for MLS and websites.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* ═══ BUILT-IN BRANDING FORM ═══ */}
      {selected === "custom" && (
        <div className="mt-2 p-4 bg-muted/30 rounded-xl border border-border space-y-4">
          <h4 className="font-medium text-foreground">Branding Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Form fields */}
            <div className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Agent Photo or Logo (optional)</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-16 w-16 object-contain rounded-lg border border-border bg-background"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-16 w-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </div>

              {/* Agent/Company Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    placeholder="John Smith"
                    value={brandingData?.agentName || ""}
                    onChange={(e) => handleFieldChange("agentName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company/Brokerage</Label>
                  <Input
                    id="companyName"
                    placeholder="RE/MAX Premier"
                    value={brandingData?.companyName || ""}
                    onChange={(e) => handleFieldChange("companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandingPhone">Phone</Label>
                  <Input
                    id="brandingPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={brandingData?.phone || ""}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandingEmail">Email</Label>
                  <Input
                    id="brandingEmail"
                    type="email"
                    placeholder="agent@example.com"
                    value={brandingData?.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={brandingData?.website || ""}
                    onChange={(e) => handleFieldChange("website", e.target.value)}
                  />
                </div>
              </div>

              {/* Address on card checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeAddressOnCard}
                  onCheckedChange={(checked) => onIncludeAddressChange?.(checked === true)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Include address on video intro/outro card</span>
              </label>
            </div>

            {/* Right: Live Preview */}
            <div className="flex flex-col justify-start">
              <BrandingPreview 
                brandingData={brandingData} 
                logoPreview={logoPreview}
                propertyCity={propertyCity}
                propertyState={propertyState}
                propertyBedrooms={propertyBedrooms}
                propertyBathrooms={propertyBathrooms}
                propertyAddress={propertyAddress}
                includeAddressOnCard={includeAddressOnCard}
              />
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                This preview approximates your video intro &amp; outro cards
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ UPLOAD CUSTOM CARDS ═══ */}
      {selected === "upload" && (
        <div className="mt-2 p-4 bg-muted/30 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Upload Custom Cards</h4>
            <Link 
              href="/dashboard/lens/design-studio" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Create in Design Studio
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload your own intro and outro card images. Recommended: 1920×1080 for landscape videos, 1080×1920 for vertical.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Intro Card Upload */}
            <div className="space-y-2">
              <Label>Intro Card</Label>
              {introPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                  <img src={introPreview} alt="Intro card" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveCard("intro")}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white/80 text-[9px] font-medium px-2 py-0.5 rounded-full">
                    Intro Card
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => introInputRef.current?.click()}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload intro card image</span>
                </button>
              )}
              <input
                ref={introInputRef}
                type="file"
                accept="image/*"
                onChange={handleCardUpload("intro")}
                className="hidden"
              />
            </div>

            {/* Outro Card Upload */}
            <div className="space-y-2">
              <Label>Outro Card</Label>
              {outroPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                  <img src={outroPreview} alt="Outro card" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveCard("outro")}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white/80 text-[9px] font-medium px-2 py-0.5 rounded-full">
                    Outro Card
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => outroInputRef.current?.click()}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload outro card image</span>
                </button>
              )}
              <input
                ref={outroInputRef}
                type="file"
                accept="image/*"
                onChange={handleCardUpload("outro")}
                className="hidden"
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Tip: Use the P2V Lens Design Studio to create professional branding cards with your headshot, logo, and listing details.
          </p>
        </div>
      )}
    </div>
  );
}
