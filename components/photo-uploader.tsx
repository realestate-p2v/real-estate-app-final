"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

export interface PhotoItem {
  id: string;
  file?: File; // Optional because URL method doesn't have a File
  preview: string;
  description: string;
}

interface PhotoUploaderProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  // New props for URL logic
  useUrl: boolean;
  onUseUrlChange: (checked: boolean) => void;
  urlValue: string;
  onUrlValueChange: (val: string) => void;
  urlPackage: string;
  onUrlPackageChange: (val: string) => void;
  urlPermission: boolean;
  onUrlPermissionChange: (checked: boolean) => void;
}

export function PhotoUploader({
  photos,
  onPhotosChange,
  useUrl,
  onUseUrlChange,
  urlValue,
  onUrlValueChange,
  urlPackage,
  onUrlPackageChange,
  urlPermission,
  onUrlPermissionChange,
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
      if (photo && photo.preview.startsWith("blob:")) {
        URL.revokeObjectURL(photo.preview);
      }
      onPhotosChange(photos.filter((p) => p.id !== id));
    },
    [photos, onPhotosChange]
  );

  const handleDescriptionChange = useCallback(
    (id: string, description: string) => {
      if (description.length <= 30) {
        onPhotosChange(
          photos.map((p) => (p.id === id ? { ...p, description } : p))
        );
      }
    },
    [photos, onPhotosChange]
  );

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newPhotos = [...photos];
      const [movedItem] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(dragOverIndex, 0, movedItem);
      onPhotosChange(newPhotos);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
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
      {/* 1. Standard Upload Area (Visible unless URL is confirmed) */}
      {!useUrl && (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
          <input type="file" id="photo-upload" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold">Upload your listing photos</p>
            <p className="text-muted-foreground">Drag and drop or click to select</p>
          </label>
        </div>
      )}

      {/* 2. Toggle Option */}
      <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
        <Checkbox 
          id="useUrl" 
          checked={useUrl} 
          onCheckedChange={(checked) => onUseUrlChange(checked === true)} 
        />
        <Label htmlFor="useUrl" className="text-sm font-medium cursor-pointer">
          Use the photos from my listing URL instead
        </Label>
      </div>

      {/* 3. Expanded URL Container */}
      {useUrl && (
        <div className="space-y-6 p-6 border rounded-xl bg-card animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Listing URL
            </Label>
            <Input 
              placeholder="https://www.zillow.com/homedetails/..." 
              value={urlValue}
              onChange={(e) => onUrlValueChange(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Select Photo Package</Label>
            <RadioGroup value={urlPackage} onValueChange={onUrlPackageChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="15" id="r15" />
                <Label htmlFor="r15" className="cursor-pointer">Up to 15 photos <br/><span className="font-bold">$79</span></Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="25" id="r25" />
                <Label htmlFor="r25" className="cursor-pointer">Up to 25 photos <br/><span className="font-bold">$129</span></Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="35" id="r35" />
                <Label htmlFor="r35" className="cursor-pointer">Up to 35 photos <br/><span className="font-bold">$179</span></Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <Checkbox 
              id="permission" 
              checked={urlPermission} 
              onCheckedChange={(checked) => onUrlPermissionChange(checked === true)} 
            />
            <Label htmlFor="permission" className="text-xs text-muted-foreground leading-tight cursor-pointer">
              I give permission to choose and sequence the photos as you decide.
            </Label>
          </div>
        </div>
      )}

      {/* 4. Photo List (Only show if not using URL and photos exist) */}
      {!useUrl && photos.length > 0 && (
        <div className="flex flex-col gap-2">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className={`relative bg-card border rounded-xl overflow-hidden flex items-center gap-2 p-2 sm:p-3 cursor-move ${
                dragOverIndex === index ? "border-primary border-t-4" : "border-border"
              } ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground/50" />
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => moveUp(index)} disabled={index === 0} className="p-1"><ChevronUp className="h-4 w-4"/></button>
                <button type="button" onClick={() => moveDown(index)} disabled={index === photos.length - 1} className="p-1"><ChevronDown className="h-4 w-4"/></button>
              </div>
              <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold">{index + 1}</div>
              <div className="h-14 w-20 relative rounded-lg overflow-hidden border">
                <Image src={photo.preview} alt="" fill className="object-cover" />
              </div>
              <Input
                placeholder="Label"
                value={photo.description}
                onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                className="text-sm h-8"
              />
              <button type="button" onClick={() => handleRemove(photo.id)} className="p-2 text-muted-foreground hover:text-destructive ml-auto"><X className="h-5 w-5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
