"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  AlertCircle,
  Phone,
  GripVertical,
  Link as LinkIcon,
  Check
} from "lucide-react";

export interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  description: string;
}

interface PhotoUploaderProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  // URL Mode Props
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
  photos,
  onPhotosChange,
  useUrl,
  onUseUrlChange,
  url,
  onUrlChange,
  urlInstructions,
  onUrlInstructionsChange,
  selectedUrlPackage,
  onUrlPackageChange,
}: PhotoUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // --- Package Options ---
  const packages = [
    { id: 15, label: "Starter", photos: "15 Photos", price: "$79" },
    { id: 25, label: "Professional", photos: "25 Photos", price: "$129" },
    { id: 35, label: "Premium", photos: "35 Photos", price: "$179" },
  ];

  // --- Manual Upload Logic ---
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newPhotos: PhotoItem[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        description: "",
      }));
      onPhotosChange([...photos, ...newPhotos]);
    },
    [photos, onPhotosChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      onPhotosChange(photos.filter((p) => p.id !== id));
    },
    [photos, onPhotosChange]
  );

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    onPhotosChange(newPhotos);
  };

  const moveDown = (index: number) => {
    if (index === photos.length - 1) return;
    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle: Upload vs URL 
      */}
      <div className="flex bg-muted p-1 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => onUseUrlChange(false)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            !useUrl ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Upload Photos
        </button>
        <button
          type="button"
          onClick={() => onUseUrlChange(true)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            useUrl ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Use Listing URL
        </button>
      </div>

      {/* UPLOAD MODE 
      */}
      {!useUrl ? (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-primary/50 transition-colors bg-card/50">
            <input
              type="file"
              id="photo-upload"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-bold">Upload your listing photos</p>
              <p className="text-muted-foreground">Drag and drop or click to select files</p>
            </label>
          </div>

          {photos.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {photos.length} photos added
                </span>
                <span className="text-xs text-muted-foreground italic">Drag to reorder</span>
              </div>
              <div className="flex flex-col gap-2">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative bg-card border rounded-xl flex items-center gap-3 p-3 shadow-sm"
                  >
                    <div className="text-muted-foreground/30 flex items-center">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => moveUp(index)} disabled={index === 0} className="p-0.5 hover:bg-muted rounded"><ChevronUp className="h-4 w-4" /></button>
                      <button type="button" onClick={() => moveDown(index)} disabled={index === photos.length - 1} className="p-0.5 hover:bg-muted rounded"><ChevronDown className="h-4 w-4" /></button>
                    </div>
                    <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </div>
                    <div className="h-12 w-16 relative rounded-md overflow-hidden border bg-muted">
                      <Image src={photo.preview} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Room Name (e.g. Kitchen)"
                        value={photo.description}
                        onChange={(e) => {
                          const newPhotos = photos.map((p) =>
                            p.id === photo.id ? { ...p, description: e.target.value } : p
                          );
                          onPhotosChange(newPhotos);
                        }}
                        className="h-9 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(photo.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* URL MODE - Styled to match Voice/Music cards 
        */
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
          {/* 1. Package Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">1</div>
              <label className="font-bold text-base">Select Your Video Package</label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => onUrlPackageChange(pkg.id)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    selectedUrlPackage === pkg.id
                      ? "border-primary bg-primary/[0.03] shadow-md"
                      : "border-border bg-card hover:border-primary/40 hover:bg-blue/50"
                  }`}
                >
                  <div className="flex justify-between w-full mb-1 items-start">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      selectedUrlPackage === pkg.id ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {pkg.label}
                    </span>
                    {selectedUrlPackage === pkg.id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                        <Check className="h-3 w-3 text-white" strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-black mb-0.5">{pkg.price}</div>
                  <div className="text-sm font-medium text-muted-foreground">{pkg.photos}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Link Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">2</div>
              <label className="font-bold text-base">Paste Listing Link</label>
            </div>
            <div className="relative group">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                className="pl-12 h-14 rounded-xl border-2 focus-visible:ring-primary shadow-sm"
                placeholder="Zillow, Redfin, or MLS URL..."
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">3</div>
              <label className="font-bold text-base">Instructions (Optional)</label>
            </div>
            <Textarea
              className="min-h-[120px] rounded-xl border-2 focus-visible:ring-primary p-4 shadow-sm"
              placeholder="e.g. Focus on the mountain views and the newly renovated kitchen. Skip the basement photos."
              value={urlInstructions}
              onChange={(e) => onUrlInstructionsChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
