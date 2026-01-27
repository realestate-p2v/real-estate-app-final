"use client";

import { useState, useRef } from "react";
import { Check, ImageIcon, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const brandingOptions = [
  {
    id: "unbranded",
    name: "Unbranded",
    description: "Clean video without any branding",
    price: 0,
  },
  {
    id: "basic",
    name: "Basic Branding",
    description: "Your logo in the corner of the video",
    price: 0,
  },
  {
    id: "custom",
    name: "Custom Branding",
    description: "Custom intro/outro with your branding",
    price: 25,
  },
];

export interface BrandingData {
  type: "unbranded" | "basic" | "custom";
  logoUrl?: string;
  logoFile?: File;
  agentName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface BrandingSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  brandingData?: BrandingData;
  onBrandingDataChange?: (data: BrandingData) => void;
}

export function BrandingSelector({ 
  selected, 
  onSelect,
  brandingData,
  onBrandingDataChange 
}: BrandingSelectorProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(brandingData?.logoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeSelect = (type: string) => {
    onSelect(type);
    if (onBrandingDataChange) {
      onBrandingDataChange({
        ...brandingData,
        type: type as BrandingData["type"],
      });
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onBrandingDataChange) {
      onBrandingDataChange({
        ...brandingData,
        type: selected as BrandingData["type"],
        logoFile: undefined,
        logoUrl: undefined,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Branding Options</h3>
          <p className="text-sm text-muted-foreground">Add your logo to the video</p>
        </div>
      </div>

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
            <p className="font-semibold text-foreground pr-6">{option.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
            <p className="text-sm font-semibold text-primary mt-2">
              {option.price === 0 ? "Free" : `+$${option.price}`}
            </p>
          </button>
        ))}
      </div>

      {/* Show branding details form when basic or custom is selected */}
      {(selected === "basic" || selected === "custom") && (
        <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border space-y-4">
          <h4 className="font-medium text-foreground">Branding Details</h4>
          
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo (optional)</Label>
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
        </div>
      )}
    </div>
  );
}
