"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  AlertCircle,
  Phone,
  Camera,
  GripVertical, // Added for the drag handle icon
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
}

export function PhotoUploader({ photos, onPhotosChange }: PhotoUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPhotoTips, setShowPhotoTips] = useState(false);

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

  // --- Drag and Drop Logic ---

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // This is required to allow a "drop"
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

  // --- Arrow Button Logic ---

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newPhotos = [...photos];
      [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
      onPhotosChange(newPhotos);
    },
    [photos, onPhotosChange]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index === photos.length - 1) return;
      const newPhotos = [...photos];
      [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
      onPhotosChange(newPhotos);
    },
    [photos, onPhotosChange]
  );

  const showTooManyPhotosWarning = photos.length > 35;

  return (
    <div className="space-y-6">
    

      {/* Upload Area */}
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

      {/* Too Many Photos Warning */}
      {showTooManyPhotosWarning && (
        <div className="bg-accent/10 border border-accent rounded-xl p-4 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">More than 35 photos detected</p>
            <a href="tel:+18455366954" className="inline-flex items-center gap-2 mt-2 text-primary font-semibold hover:underline">
              <Phone className="h-4 w-4" />1 (845) 536-6954
            </a>
          </div>
        </div>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
            <span>{photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded</span>
          </div>
          <p className="text-sm text-muted-foreground">Drag the dots or use arrows to reorder</p>
        </div>
      )}

      {/* Photo List */}
      <div className="flex flex-col gap-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            draggable // Enables dragging
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            className={`relative bg-card border rounded-xl overflow-hidden transition-all flex items-center gap-2 p-2 sm:p-3 cursor-move ${
              dragOverIndex === index ? "border-primary border-t-4" : "border-border"
            } ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
          >
            {/* Drag Handle Icon */}
            <div className="text-muted-foreground/50">
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Reorder Buttons (Arrows) */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveUp(index); }}
                disabled={index === 0}
                className={`p-1 rounded-lg ${index === 0 ? "text-muted-foreground/20" : "hover:bg-muted"}`}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveDown(index); }}
                disabled={index === photos.length - 1}
                className={`p-1 rounded-lg ${index === photos.length - 1 ? "text-muted-foreground/20" : "hover:bg-muted"}`}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Photo Number */}
            <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {index + 1}
            </div>

            {/* Thumbnail */}
            <div className="h-14 w-20 sm:h-16 sm:w-24 relative rounded-lg overflow-hidden flex-shrink-0 border">
              <Image src={photo.preview || "/placeholder.svg"} alt="" fill className="object-cover" />
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0 hidden sm:block">
              <Input
                placeholder="Label (e.g. Kitchen)"
                value={photo.description}
                onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                maxLength={30}
                className="text-sm h-8"
              />
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(photo.id); }}
              className="p-2 text-muted-foreground hover:text-destructive ml-auto"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add More Button */}
      {photos.length > 0 && !showTooManyPhotosWarning && (
        <div className="text-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("photo-upload")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" /> Add More Photos
          </Button>
        </div>
      )}
    </div>
  );
}
