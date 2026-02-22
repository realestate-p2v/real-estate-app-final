"use client";

import * as React from "react";
import { Upload, Link, X, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  useUrl: boolean;
  setUseUrl: (value: boolean) => void;
  url: string;
  setUrl: (value: string) => void;
  urlPackage: string;
  setUrlPackage: (value: string) => void;
}

export function PhotoUploader({
  photos,
  setPhotos,
  useUrl,
  setUseUrl,
  url,
  setUrl,
  urlPackage,
  setUrlPackage,
}: PhotoUploaderProps) {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* 1. SELECTION TABS */}
      <div className="flex bg-muted p-1 rounded-xl">
        <button
          onClick={() => setUseUrl(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
            !useUrl ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4" />
          Upload Photos
        </button>
        <button
          onClick={() => setUseUrl(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
            useUrl ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link className="h-4 w-4" />
          Use Listing URL
        </button>
      </div>

      {/* 2. UPLOAD CONTENT */}
      {!useUrl ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full text-primary">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-semibold">Click or drag photos here</p>
                <p className="text-sm text-muted-foreground">Upload the photos you want in your video</p>
              </div>
            </div>
          </div>

          {/* Photo Preview Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-6">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* URL Input */}
          <div className="space-y-4">
            <Label htmlFor="listing-url" className="text-base font-bold">Paste Listing URL</Label>
            <Input
              id="listing-url"
              placeholder="e.g., https://www.zillow.com/homedetails/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 text-lg"
            />
            <p className="text-xs text-muted-foreground italic">
              * We will grab the photos directly from your Zillow, Realtor.com, or Redfin link.
            </p>
          </div>

          {/* Package Selection */}
          <div className="space-y-4">
            <Label className="text-base font-bold">Select your package limit</Label>
            <RadioGroup 
              value={urlPackage} 
              onValueChange={setUrlPackage} 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Standard */}
              <div 
                onClick={() => setUrlPackage("15")}
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/50",
                  urlPackage === "15" ? "border-primary bg-primary/5 shadow-md" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">Standard</span>
                  <RadioGroupItem value="15" id="p15" />
                </div>
                <span className="text-sm text-muted-foreground mb-3">Up to 15 photos</span>
                <span className="text-2xl font-bold text-primary">$79</span>
              </div>

              {/* Premium */}
              <div 
                onClick={() => setUrlPackage("25")}
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/50",
                  urlPackage === "25" ? "border-primary bg-primary/5 shadow-md" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">Premium</span>
                  <RadioGroupItem value="25" id="p25" />
                </div>
                <span className="text-sm text-muted-foreground mb-3">16-25 photos</span>
                <span className="text-2xl font-bold text-primary">$129</span>
              </div>

              {/* Professional */}
              <div 
                onClick={() => setUrlPackage("35")}
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/50",
                  urlPackage === "35" ? "border-primary bg-primary/5 shadow-md" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">Professional</span>
                  <RadioGroupItem value="35" id="p35" />
                </div>
                <span className="text-sm text-muted-foreground mb-3">26-35 photos</span>
                <span className="text-2xl font-bold text-primary">$179</span>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
}
