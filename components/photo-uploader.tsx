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
  Crop,
} from "lucide-react";

const DIRECTIONS = [
  { key: 'push_in', label: 'Fwd' },
  { key: 'pull_back', label: 'Back' },
  { key: 'diagonal_top_left', label: 'Fwd + L' },
  { key: 'diagonal_top_right', label: 'Fwd + R' },
  { key: 'diagonal_bottom_left', label: 'Back + L' },
  { key: 'diagonal_bottom_right', label: 'Back + R' },
  { key: 'tilt_up', label: 'Look Up' },
  { key: 'tilt_down', label: 'Look Down' },
  { key: 'orbit_left', label: 'Orbit L' },
  { key: 'orbit_right', label: 'Orbit R' },
  { key: 'rise', label: 'Rise' },
  { key: 'bring_to_life', label: '✨ Bring to Life' },
];

const SPEEDS = [
  { key: 'slow', label: 'Slow' },
  { key: 'medium', label: 'Med' },
  { key: 'fast', label: 'Fast' },
];

export interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  description: string;
  secure_url?: string;
  uploadStatus: 'uploading' | 'complete' | 'failed';
  camera_direction?: string | null;
  camera_speed?: string | null;
  custom_motion?: string;
  crop_offset_landscape?: number;
  crop_offset_vertical?: number;
  original_width?: number;
  original_height?: number;
}

interface PhotoUploaderProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[] | ((prev: PhotoItem[]) => PhotoItem[])) => void;
  orientation?: string;
}

function CropPreview({ 
  photo, 
  targetAspect, 
  offset, 
  onOffsetChange,
  label 
}: { 
  photo: PhotoItem; 
  targetAspect: '16:9' | '9:16'; 
  offset: number; 
  onOffsetChange: (val: number) => void;
  label: string;
}) {
  const w = photo.original_width || 1;
  const h = photo.original_height || 1;
  const currentRatio = w / h;
  const targetRatio = targetAspect === '16:9' ? 16 / 9 : 9 / 16;
  
  const needsCrop = Math.abs(currentRatio - targetRatio) > 0.02;
  const cropsTopBottom = currentRatio < targetRatio;
  const cropsLeftRight = currentRatio > targetRatio;
  
  if (!needsCrop) {
    return (
      <div className="text-xs text-green-600 flex items-center gap-1">
        <Crop className="h-3 w-3" />
        <span>{label}: No crop needed!</span>
      </div>
    );
  }

  let cropPercent: number;
  if (cropsTopBottom) {
    const visibleH = w / targetRatio;
    cropPercent = Math.round((1 - visibleH / h) * 100);
  } else {
    const visibleW = h * targetRatio;
    cropPercent = Math.round((1 - visibleW / w) * 100);
  }

  const previewW = 200;
  const previewH = 133;
  
  const getOverlayStyle = () => {
    if (cropsTopBottom) {
      const visibleRatio = (w / targetRatio) / h;
      const visibleHeight = previewH * visibleRatio;
      const maxShift = previewH - visibleHeight;
      const topOffset = (offset / 100) * maxShift;
      return {
        top: `${topOffset}px`,
        left: '0',
        width: '100%',
        height: `${visibleHeight}px`,
      };
    } else {
      const visibleRatio = (h * targetRatio) / w;
      const visibleWidth = previewW * visibleRatio;
      const maxShift = previewW - visibleWidth;
      const leftOffset = (offset / 100) * maxShift;
      return {
        top: '0',
        left: `${leftOffset}px`,
        width: `${visibleWidth}px`,
        height: '100%',
      };
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Crop className="h-3 w-3" />
          {label}: {cropPercent}% will be cropped ({cropsTopBottom ? 'top/bottom' : 'left/right'})
        </span>
      </div>
      
      <div className="relative rounded-lg overflow-hidden border border-border" style={{ width: previewW, height: previewH }}>
        <img
          src={photo.preview}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute border-2 border-primary rounded-sm" style={getOverlayStyle()}>
          <img
            src={photo.preview}
            alt=""
            className="w-full h-full object-cover"
            style={{
              objectPosition: cropsTopBottom 
                ? `center ${offset}%` 
                : `${offset}% center`
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-12">
          {cropsTopBottom ? '↑ Top' : '← Left'}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={offset}
          onChange={(e) => onOffsetChange(parseInt(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="flex-1 h-3 accent-primary cursor-pointer"
        />
        <span className="text-xs text-muted-foreground w-14 text-right">
          {cropsTopBottom ? 'Bottom ↓' : 'Right →'}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOffsetChange(Math.max(0, offset - 5)); }}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-all"
        >
          {cropsTopBottom ? '↑ Move Up' : '← Move Left'}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOffsetChange(50); }}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-all"
        >
          Center
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOffsetChange(Math.min(100, offset + 5)); }}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-all"
        >
          {cropsTopBottom ? 'Move Down ↓' : 'Move Right →'}
        </button>
      </div>

export function PhotoUploader({ photos, onPhotosChange, orientation = "landscape" }: PhotoUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPhotoTips, setShowPhotoTips] = useState(false);
  const [openDirectionIndex, setOpenDirectionIndex] = useState<number | null>(null);
  const [openCropIndex, setOpenCropIndex] = useState<number | null>(null);

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
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      
      const validFiles: { file: File; width: number; height: number }[] = [];
      for (const file of files) {
        const dims = await new Promise<{ valid: boolean; width: number; height: number }>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const minSide = Math.min(img.width, img.height);
            if (minSide < 768) {
              alert(`"${file.name}" is too small (${img.width}×${img.height}). Minimum dimension is 768px. Please upload a higher quality photo.`);
              resolve({ valid: false, width: img.width, height: img.height });
            } else {
              resolve({ valid: true, width: img.width, height: img.height });
            }
            URL.revokeObjectURL(img.src);
          };
          img.onerror = () => resolve({ valid: false, width: 0, height: 0 });
          img.src = URL.createObjectURL(file);
        });
        if (dims.valid) validFiles.push({ file, width: dims.width, height: dims.height });
      }
      
      if (validFiles.length === 0) return;
      
      const newPhotos: PhotoItem[] = validFiles.map(({ file, width, height }) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        description: "",
        uploadStatus: 'uploading' as const,
        crop_offset_landscape: 50,
        crop_offset_vertical: 50,
        original_width: width,
        original_height: height,
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
      if (photo) URL.revokeObjectURL(photo.preview);
      onPhotosChange(photos.filter((p) => p.id !== id));
    },
    [photos, onPhotosChange]
  );

  const handleDescriptionChange = useCallback(
    (id: string, description: string) => {
      if (description.length <= 30) {
        onPhotosChange(photos.map((p) => (p.id === id ? { ...p, description } : p)));
      }
    },
    [photos, onPhotosChange]
  );

  const handleDirectionChange = useCallback(
    (id: string, direction: string | null) => {
      onPhotosChange(photos.map((p) => (p.id === id ? { ...p, camera_direction: direction, custom_motion: direction ? '' : p.custom_motion } : p)));
    },
    [photos, onPhotosChange]
  );

  const handleSpeedChange = useCallback(
    (id: string, speed: string | null) => {
      onPhotosChange(photos.map((p) => (p.id === id ? { ...p, camera_speed: speed } : p)));
    },
    [photos, onPhotosChange]
  );

  const handleCustomMotionChange = useCallback(
    (id: string, custom_motion: string) => {
      if (custom_motion.length <= 80) {
        onPhotosChange(photos.map((p) => (p.id === id ? { ...p, custom_motion, camera_direction: custom_motion ? null : p.camera_direction } : p)));
      }
    },
    [photos, onPhotosChange]
  );

  const handleCropOffsetChange = useCallback(
    (id: string, aspect: 'landscape' | 'vertical', value: number) => {
      const key = aspect === 'landscape' ? 'crop_offset_landscape' : 'crop_offset_vertical';
      onPhotosChange(photos.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
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
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    onPhotosChange(newPhotos);
  }, [photos, onPhotosChange]);

  const moveDown = useCallback((index: number) => {
    if (index === photos.length - 1) return;
    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
    onPhotosChange(newPhotos);
  }, [photos, onPhotosChange]);

  const showTooManyPhotosWarning = photos.length > 35;

  const getCameraDisplayText = (photo: PhotoItem) => {
    if (photo.custom_motion) return `"${photo.custom_motion}"`;
    if (photo.camera_direction) {
      const dir = DIRECTIONS.find(d => d.key === photo.camera_direction);
      const speed = SPEEDS.find(s => s.key === photo.camera_speed);
      return `${dir?.label || photo.camera_direction}${speed ? ` · ${speed.label}` : ''}`;
    }
    return 'Select Camera Movement';
  };

  const needsCropForOrientation = (photo: PhotoItem, orient: string) => {
    if (!photo.original_width || !photo.original_height) return false;
    const ratio = photo.original_width / photo.original_height;
    if (orient === 'landscape' || orient === 'both') {
      if (Math.abs(ratio - 16/9) > 0.02) return true;
    }
    if (orient === 'vertical' || orient === 'both') {
      if (Math.abs(ratio - 9/16) > 0.02) return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("border-primary", "bg-primary/5"); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove("border-primary", "bg-primary/5"); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          e.currentTarget.classList.remove("border-primary", "bg-primary/5");
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const input = document.getElementById("photo-upload") as HTMLInputElement;
            input.files = files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }}
      >
        <input type="file" id="photo-upload" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold">Upload your listing photos</p>
          <p className="text-muted-foreground">Drag and drop or click to select</p>
          <p className="text-xs text-muted-foreground mt-2">💡 Upload the highest quality photos you have — the quality you put in is the quality you get out!</p>
          <p className="text-xs text-muted-foreground mt-1">📐 For best results, use landscape-oriented photos (wider than tall). Photos with different aspect ratios will be automatically cropped to fit your video format — you can adjust the crop position after uploading.</p>
        </label>
      </div>
      
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

      {photos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
            <span>{photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded</span>
          </div>
          <p className="text-sm text-muted-foreground">Drag the dots or use arrows to reorder</p>
        </div>
      )}

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
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground/50 flex-shrink-0">
                <GripVertical className="h-5 w-5" />
              </div>

              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button type="button" onClick={(e) => { e.stopPropagation(); moveUp(index); }} disabled={index === 0}
                  className={`p-0.5 rounded ${index === 0 ? "text-muted-foreground/20" : "hover:bg-muted"}`}>
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); moveDown(index); }} disabled={index === photos.length - 1}
                  className={`p-0.5 rounded ${index === photos.length - 1 ? "text-muted-foreground/20" : "hover:bg-muted"}`}>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>

              <div className="h-24 w-36 sm:h-28 sm:w-40 relative rounded-lg overflow-hidden flex-shrink-0 border">
                <Image src={photo.preview || "/placeholder.svg"} alt="" fill className="object-cover" />
                {photo.uploadStatus === 'uploading' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <Input
                  placeholder="Label (e.g. Kitchen)"
                  value={photo.description}
                  onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                  maxLength={30}
                  className="text-sm h-9"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-3 flex-wrap">
                  {photo.uploadStatus === 'complete' && <span className="text-green-500 text-sm font-semibold">✓ Ready</span>}
                  {photo.uploadStatus === 'uploading' && <span className="text-amber-500 text-sm font-semibold animate-pulse">Uploading...</span>}
                  {photo.uploadStatus === 'failed' && <span className="text-red-500 text-sm font-semibold">✕ Failed</span>}

                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); setOpenDirectionIndex(openDirectionIndex === index ? null : index); setOpenCropIndex(null); }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[180px]">{getCameraDisplayText(photo)}</span>
                    <span className="text-muted-foreground">▾</span>
                  </button>

                  {needsCropForOrientation(photo, orientation) && (
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenCropIndex(openCropIndex === index ? null : index); setOpenDirectionIndex(null); }}
                      className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1">
                      <Crop className="h-3.5 w-3.5" />
                      <span>Adjust Crop</span>
                      <span className="text-muted-foreground">▾</span>
                    </button>
                  )}
                </div>
                {photo.original_width && (
                  <p className="text-xs text-muted-foreground">{photo.original_width} × {photo.original_height}px</p>
                )}
              </div>

              <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(photo.id); }}
                className="p-2 text-muted-foreground hover:text-destructive flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {openCropIndex === index && (
              <div className="mt-3 pt-3 border-t border-border space-y-4">
                <p className="text-xs text-muted-foreground">
                  Drag the slider to adjust which part of your photo is visible in the video. The bright area shows what will appear on screen.
                </p>
                
                {(orientation === 'landscape' || orientation === 'both') && (
                  <CropPreview photo={photo} targetAspect="16:9"
                    offset={photo.crop_offset_landscape ?? 50}
                    onOffsetChange={(val) => handleCropOffsetChange(photo.id, 'landscape', val)}
                    label="Landscape (16:9)" />
                )}

                {(orientation === 'vertical' || orientation === 'both') && (
                  <CropPreview photo={photo} targetAspect="9:16"
                    offset={photo.crop_offset_vertical ?? 50}
                    onOffsetChange={(val) => handleCropOffsetChange(photo.id, 'vertical', val)}
                    label="Vertical (9:16)" />
                )}

                <button type="button" onClick={(e) => { e.stopPropagation(); setOpenCropIndex(null); }}
                  className="text-xs text-primary font-semibold hover:underline">
                  Done ✓
                </button>
              </div>
            )}

            {openDirectionIndex === index && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Direction:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDirectionChange(photo.id, null); }}
                      className={`text-xs py-2 px-3 rounded-lg border text-center transition-all ${
                        !photo.camera_direction && !photo.custom_motion ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border hover:bg-muted'
                      }`}>
                      🤖 Auto
                    </button>
                    {DIRECTIONS.map(d => (
                      <button key={d.key} type="button" onClick={(e) => { e.stopPropagation(); handleDirectionChange(photo.id, d.key); }}
                        className={`text-xs py-2 px-3 rounded-lg border text-center transition-all ${
                          photo.camera_direction === d.key ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border hover:bg-muted'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {photo.camera_direction !== 'bring_to_life' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Speed:</p>
                  <div className="flex gap-1.5">
                    {SPEEDS.map(s => (
                      <button key={s.key} type="button"
                        onClick={(e) => { e.stopPropagation(); handleSpeedChange(photo.id, photo.camera_speed === s.key ? null : s.key); }}
                        className={`text-xs py-2 px-4 rounded-lg border text-center transition-all ${
                          photo.camera_speed === s.key ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border hover:bg-muted'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {photo.camera_direction === 'bring_to_life'
                      ? 'Describe the action (warm, friendly actions work best):'
                      : 'Or describe your own camera movement:'}
                  </p>
                  <Input
                    placeholder={photo.camera_direction === 'bring_to_life'
                      ? "e.g. Agent waves warmly at camera and smiles"
                      : "e.g. Slowly zoom into the fireplace then pan right"}
                    value={photo.custom_motion || ''}
                    onChange={(e) => { handleCustomMotionChange(photo.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={80}
                    className="text-sm h-9"
                  />
                  {photo.custom_motion && (
                    <p className="text-xs text-muted-foreground mt-1">{80 - (photo.custom_motion?.length || 0)} characters remaining</p>
                  )}
                </div>

                <button type="button" onClick={(e) => { e.stopPropagation(); setOpenDirectionIndex(null); }}
                  className="text-xs text-primary font-semibold hover:underline">
                  Done ✓
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {photos.length > 0 && !showTooManyPhotosWarning && (
        <div className="text-center pt-2">
          <Button type="button" variant="outline" onClick={() => document.getElementById("photo-upload")?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Add More Photos
          </Button>
        </div>
      )}
    </div>
  );
}
