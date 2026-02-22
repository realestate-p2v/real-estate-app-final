"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Ensure you have this UI component
import {
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  AlertCircle,
  Phone,
  GripVertical,
  Link as LinkIcon
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
  // Added these props
  useUrl: boolean;
  onUseUrlChange: (val: boolean) => void;
  url: string;
  onUrlChange: (val: string) => void;
  urlInstructions: string;
  onUrlInstructionsChange: (val: string) => void;
}

export function PhotoUploader({ 
  photos, 
  onPhotosChange,
  useUrl,
  onUseUrlChange,
  url,
  onUrlChange,
  urlInstructions,
  onUrlInstructionsChange
}: PhotoUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      if (photo) { URL.revokeObjectURL(photo.preview); }
      onPhotosChange(photos.filter((p) => p.id !== id));
    },
    [photos, onPhotosChange]
  );

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDrop = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newPhotos = [...photos];
      const [movedItem] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(dragOverIndex, 0, movedItem);
      onPhotosChange(newPhotos);
    }
    setDraggedIndex(null); setDragOverIndex(null);
  };

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
      {/* Selector Toggle */}
      <div className="flex bg-muted p-1 rounded-xl">
        <button 
          onClick={() => onUseUrlChange(false)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!useUrl ? "bg-background shadow-sm" : "text-muted-foreground"}`}
        >
          Upload Photos
        </button>
        <button 
          onClick={() => onUseUrlChange(true)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${useUrl ? "bg-background shadow-sm" : "text-muted-foreground"}`}
        >
          Use Listing URL
        </button>
      </div>

      {!useUrl ? (
        <>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
            <input type="file" id="photo-upload" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">Upload listing photos</p>
              <p className="text-muted-foreground">Click to select files</p>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                className={`relative bg-card border rounded-xl flex items-center gap-2 p-2 cursor-move ${dragOverIndex === index ? "border-primary border-t-4" : "border-border"}`}
              >
                <div className="text-muted-foreground/50"><GripVertical className="h-5 w-5" /></div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveUp(index)} disabled={index === 0} className="p-1"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveDown(index)} disabled={index === photos.length - 1} className="p-1"><ChevronDown className="h-4 w-4" /></button>
                </div>
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold">{index + 1}</div>
                <div className="h-14 w-20 relative rounded-lg overflow-hidden border"><Image src={photo.preview} alt="" fill className="object-cover" /></div>
                <div className="flex-1 hidden sm:block">
                  <Input placeholder="Label" value={photo.description} onChange={(e) => onPhotosChange(photos.map(p => p.id === photo.id ? {...p, description: e.target.value} : p))} maxLength={30} className="h-8 text-sm" />
                </div>
                <button type="button" onClick={() => handleRemove(photo.id)} className="p-2 text-muted-foreground hover:text-destructive"><X className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Zillow, Redfin, or MLS URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="https://www.zillow.com/homedetails/..." value={url} onChange={(e) => onUrlChange(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Which photos should we use?</label>
            <Textarea placeholder="E.g. Use the first 15 photos, or focus on the kitchen and backyard." value={urlInstructions} onChange={(e) => onUrlInstructionsChange(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
