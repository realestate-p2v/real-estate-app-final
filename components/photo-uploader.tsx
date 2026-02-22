"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, X, ChevronUp, ChevronDown, ImageIcon, GripVertical, Link as LinkIcon
} from "lucide-react";

interface PhotoUploaderProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  useUrl: boolean;
  onUseUrlChange: (val: boolean) => void;
  url: string;
  onUrlChange: (val: string) => void;
  urlInstructions: string;
  onUrlInstructionsChange: (val: string) => void;
  selectedUrlPackage: number;
  onUrlPackageChange: (val: number) => void;
}

export function PhotoUploader({ 
  photos, onPhotosChange, useUrl, onUseUrlChange, 
  url, onUrlChange, urlInstructions, onUrlInstructionsChange,
  selectedUrlPackage, onUrlPackageChange
}: PhotoUploaderProps) {
  
  // Package options
  const packages = [
    { label: "15 Photos ($79)", value: 15 },
    { label: "25 Photos ($129)", value: 25 },
    { label: "35 Photos ($179)", value: 35 },
  ];

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex bg-muted p-1 rounded-xl">
        <button onClick={() => onUseUrlChange(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg ${!useUrl ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Upload Photos</button>
        <button onClick={() => onUseUrlChange(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg ${useUrl ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Use Listing URL</button>
      </div>

      {!useUrl ? (
        // ... Original upload logic remains same ...
        <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <input type="file" id="photo-upload" multiple accept="image/*" onChange={(e) => {/* same as original */}} className="hidden" />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Upload className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="font-semibold">Click to upload photos</p>
            </label>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          {/* PACKAGE PICKER */}
          <div className="space-y-3">
            <label className="text-sm font-bold">1. Select Your Package</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.value}
                  onClick={() => onUrlPackageChange(pkg.value)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${selectedUrlPackage === pkg.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground"}`}
                >
                  {pkg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">2. Listing URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Paste Zillow/MLS link here..." value={url} onChange={(e) => onUrlChange(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">3. Instructions (Optional)</label>
            <Textarea placeholder="Which photos should we use? (e.g. Skip the basement)" value={urlInstructions} onChange={(e) => onUrlInstructionsChange(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
