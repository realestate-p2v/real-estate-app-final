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
  GripVertical,
  Loader2,
} from "lucide-react";

const DIRECTIONS = [
  { key: 'pan_left', label: '← Left' },
  { key: 'pan_right', label: '→ Right' },
  { key: 'tilt_up', label: '↑ Up' },
  { key: 'tilt_down', label: '↓ Down' },
  { key: 'push_in', label: '⟶ Push' },
  { key: 'pull_back', label: '⟵ Pull' },
  { key: 'diagonal_top_left', label: '↖ TL' },
  { key: 'diagonal_top_right', label: '↗ TR' },
  { key: 'diagonal_bottom_left', label: '↙ BL' },
  { key: 'diagonal_bottom_right', label: '↘ BR' },
  { key: 'orbit_left', label: '↺ Orbit L' },
  { key: 'orbit_right', label: '↻ Orbit R' },
  { key: 'rise', label: '⬆ Rise' },
];

export interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  description: string;
  secure_url?: string;
  uploadStatus: 'uploading' | 'complete' | 'failed';
  camera_direction?: string | null;
}

interface PhotoUploaderProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[] | ((prev: PhotoItem[]) => PhotoItem[])) => void;
}

export function PhotoUploader({ photos, onPhotosChange }: PhotoUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPhotoTips, setShowPhotoTips] = useState(false);
  const [openDirectionIndex, setOpenDirectionIndex] = useState<number | null>(null);

  const compressImage = (file: File, maxSizeMB: number = 8): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 3000;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/jpeg',
          0.85
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newPhotos: PhotoItem[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        description: "",
        uploadStatus: 'uploading' as const,
      }));

      const allPhotos = [...photos, ...newPhotos];
      onPhotosChange(allPhotos);

      newPhotos.forEach(async (photo) => {
        try {
          const sigResponse = await fetch("/api/cloudinary-signature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder: "photo2video/orders" }),
          });
          const sigData = await sigResponse.json();
          if (!sigData.success) throw new Error("Signature failed");

          const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
          const uploadData = new FormData();
          const compressed = await compressImage(photo.file);
          uploadData.append("file", compressed, photo.file.name);
          uploadData.append("api_key", apiKey);
          uploadData.append("timestamp", timestamp.toString());
          uploadData.append("signature", signature);
          uploadData.append("folder", folder);

          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: "POST",
            body: uploadData,
          });
          const result = await response.json();

          if (result.secure_url) {
            onPhotosChange((prev: PhotoItem[]) =>
              prev.map(p => p.id === photo.id
                ? { ...p, secure_url: result.secure_url, uploadStatus: 'complete' as const }
                : p
              )
            );
          } else {
            throw new Error("No secure_url returned");
          }
        } catch (error) {
          console.error("Upload failed for", photo.id, error);
          onPhotosChange((prev: PhotoItem[]) =>
            prev.map(p => p.id === photo.id
              ? { ...p, uploadStatus: 'failed' as const }
              : p
            )
          );
        }
      });
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

  const handleDirectionChange = useCallback(
    (id: string, direction: string | null) => {
      onPhotosChange(
        photos.map((p) => (p.id === id ? { ...p, camera_direction: direction } : p))
      );
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
      <div className="flex flex-col gap-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            className={`relative bg-card border rounded-xl transition-all p-3 cursor-move ${
              dragOverIndex === index ? "border-primary border-t-4" : "border-border"
            } ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
          >
            {/* Top row: drag handle, arrows, number, thumbnail, label, status, remove */}
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <div className="text-muted-foreground/50 flex-shrink-0">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Reorder Arrows */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveUp(index); }}
                  disabled={index === 0}
                  className={`p-0.5 rounded ${index === 0 ? "text-muted-foreground/20" : "hover:bg-muted"}`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveDown(index); }}
                  disabled={index === photos.length - 1}
                  className={`p-0.5 rounded ${index === photos.length - 1 ? "text-muted-foreground/20" : "hover:bg-muted"}`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Photo Number */}
              <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="h-24 w-36 sm:h-28 sm:w-40 relative rounded-lg overflow-hidden flex-shrink-0 border">
                <Image src={photo.preview || "/placeholder.svg"} alt="" fill className="object-cover" />
                {photo.uploadStatus === 'uploading' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Label + Status + Camera toggle */}
              <div className="flex-1 min-w-0 space-y-1">
                <Input
                  placeholder="Label (e.g. Kitchen)"
                  value={photo.description}
                  onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                  maxLength={30}
                  className="text-sm h-9"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-3">
                  {/* Upload Status */}
                  {photo.uploadStatus === 'complete' && (
                    <span className="text-green-500 text-sm font-semibold">✓ Ready</span>
                  )}
                  {photo.uploadStatus === 'uploading' && (
                    <span className="text-amber-500 text-sm font-semibold animate-pulse">Uploading...</span>
                  )}
                  {photo.uploadStatus === 'failed' && (
                    <span className="text-red-500 text-sm font-semibold">✕ Failed</span>
                  )}

                  {/* Camera Direction Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDirectionIndex(openDirectionIndex === index ? null : index);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Camera className="h-3 w-3" />
                    {photo.camera_direction
                      ? DIRECTIONS.find(d => d.key === photo.camera_direction)?.label || 'Custom'
                      : 'Select Camera Movement'}
                    <span className="text-muted-foreground">▾</span>
                  </button>
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(photo.id); }}
                className="p-2 text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Camera Direction Picker (expandable) */}
            {openDirectionIndex === index && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Choose camera movement (or leave on Auto):</p>
                <div className="grid grid-cols-7 gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDirectionChange(photo.id, null); setOpenDirectionIndex(null); }}
                    className={`text-xs py-2 px-1 rounded-lg border text-center transition-all ${
                      !photo.camera_direction
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    🤖 Auto
                  </button>
                  {DIRECTIONS.map(d => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDirectionChange(photo.id, d.key); setOpenDirectionIndex(null); }}
                      className={`text-xs py-2 px-1 rounded-lg border text-center transition-all ${
                        photo.camera_direction === d.key
                          ? 'bg-primary/10 border-primary text-primary font-semibold'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
