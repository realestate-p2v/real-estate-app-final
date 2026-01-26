"use client";

import React from "react"

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  X,
  GripVertical,
  ImageIcon,
  AlertCircle,
  Phone,
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      const newPhotos = [...photos];
      const [removed] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(dragOverIndex, 0, removed);
      onPhotosChange(newPhotos);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const showTooManyPhotosWarning = photos.length > 35;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            Upload your listing photos
          </p>
          <p className="text-muted-foreground mt-1">
            Drag and drop or click to select
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports JPG, PNG, WEBP
          </p>
        </label>
      </div>

      {/* Too Many Photos Warning */}
      {showTooManyPhotosWarning && (
        <div className="bg-accent/10 border border-accent rounded-xl p-4 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">
              More than 35 photos detected
            </p>
            <p className="text-muted-foreground mt-1">
              For orders with more than 35 photos, please contact us directly:
            </p>
            <a
              href="tel:+18455366954"
              className="inline-flex items-center gap-2 mt-2 text-primary font-semibold hover:underline"
            >
              <Phone className="h-4 w-4" />1 (845) 536-6954
            </a>
          </div>
        </div>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Drag to reorder the sequence
          </p>
        </div>
      )}

      {/* Photo List - Single column for easy mobile reordering */}
      {photos.length > 0 && (
        <div className="flex flex-col gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative bg-card border rounded-xl overflow-hidden transition-all flex items-center gap-3 p-2 ${
                dragOverIndex === index ? "border-primary border-2 bg-primary/5" : "border-border"
              } ${draggedIndex === index ? "opacity-50 scale-95" : ""}`}
            >
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing touch-none p-2 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Photo Number */}
              <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="h-16 w-24 relative rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={photo.preview || "/placeholder.svg"}
                  alt={photo.description || `Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Description (optional)"
                  value={photo.description}
                  onChange={(e) =>
                    handleDescriptionChange(photo.id, e.target.value)
                  }
                  maxLength={30}
                  className="text-sm h-9"
                />
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(photo.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Remove photo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add More Button */}
      {photos.length > 0 && !showTooManyPhotosWarning && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("photo-upload")?.click()}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Upload className="mr-2 h-4 w-4" />
            Add More Photos
          </Button>
        </div>
      )}
    </div>
  );
}
