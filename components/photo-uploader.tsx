"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  AlertCircle,
  Phone,
  Loader2,
  Crop,
  Check,
  BedDouble,
  Bath,
  Sparkles,
  Eye,
  Home,
  DoorOpen,
  Sofa,
  Trees,
  Camera,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

export interface PhotoItem {
  id: string;
  file?: File;
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
  onReviewConfirmed?: (confirmed: boolean) => void;
  initialBedrooms?: number;
  initialBathrooms?: number;
}

// ═══════════════════════════════════════════════════
// QUESTIONNAIRE TYPES
// ═══════════════════════════════════════════════════

interface QuestionnaireAnswers {
  bedrooms: number;
  bathrooms: number;
  features: string[];
  featureOther: string;
  views: string[];
  viewOther: string;
}

// ═══════════════════════════════════════════════════
// UPLOAD STEP DEFINITION
// ═══════════════════════════════════════════════════

interface UploadStep {
  id: string;
  title: string;
  instructions: string;
  recommended: string;
  defaultLabels: string[];
  icon: React.ElementType;
  viewNote?: string;
}

// ═══════════════════════════════════════════════════
// SPECIAL FEATURES + VIEWS OPTIONS
// ═══════════════════════════════════════════════════

const SPECIAL_FEATURES = [
  "Pool", "Garage", "Patio/Deck", "Garden", "Home Office",
  "Gym", "Wine Cellar", "Theater", "Guest House", "Laundry",
  "Balcony", "Rooftop",
];

const NOTABLE_VIEWS = [
  "Ocean/Water", "Mountain", "City Skyline", "Garden/Nature",
  "Golf Course", "Pool/Backyard",
];

// ═══════════════════════════════════════════════════
// BUILD STEPS FROM QUESTIONNAIRE
// ═══════════════════════════════════════════════════

function buildUploadSteps(answers: QuestionnaireAnswers): UploadStep[] {
  const hasViews = answers.views.length > 0 || answers.viewOther.trim() !== "";
  const viewsList = [
    ...answers.views,
    ...(answers.viewOther.trim() ? [answers.viewOther.trim()] : []),
  ].join(", ");
  const viewNote = hasViews ? `This property has notable views (${viewsList}). Include the view from the room if visible.` : undefined;

  const steps: UploadStep[] = [];

  steps.push({
    id: "exterior",
    title: "Exterior",
    instructions: "Start with the hero shot — the front of the property. Add 2-3 exterior angles.",
    recommended: "2-3 photos",
    defaultLabels: ["Front Exterior", "Side Exterior", "Rear Exterior"],
    icon: Home,
  });

  steps.push({
    id: "entryway",
    title: "Front Door & Entryway",
    instructions: "One photo from inside, looking toward the front door or entry.",
    recommended: "1 photo",
    defaultLabels: ["Entryway"],
    icon: DoorOpen,
  });

  steps.push({
    id: "common",
    title: "Common Areas",
    instructions: "Living room, kitchen, dining room. These are the most important interior shots.",
    recommended: "3-5 photos",
    defaultLabels: ["Living Room", "Kitchen", "Dining Room", "Family Room"],
    icon: Sofa,
    viewNote: viewNote,
  });

  const bedroomLabels: string[] = [];
  for (let i = 1; i <= answers.bedrooms; i++) {
    bedroomLabels.push(i === 1 ? "Master Bedroom" : `Bedroom ${i}`);
  }
  steps.push({
    id: "bedrooms",
    title: `Bedrooms (${answers.bedrooms})`,
    instructions: "Start with the master bedroom.",
    recommended: `${answers.bedrooms} photo${answers.bedrooms !== 1 ? "s" : ""}`,
    defaultLabels: bedroomLabels,
    icon: BedDouble,
    viewNote: viewNote,
  });

  const bathroomLabels: string[] = [];
  for (let i = 1; i <= answers.bathrooms; i++) {
    bathroomLabels.push(i === 1 ? "Master Bath" : `Bathroom ${i}`);
  }
  steps.push({
    id: "bathrooms",
    title: `Bathrooms (${answers.bathrooms})`,
    instructions: "Start with the master bath.",
    recommended: `${answers.bathrooms} photo${answers.bathrooms !== 1 ? "s" : ""}`,
    defaultLabels: bathroomLabels,
    icon: Bath,
  });

  const allFeatures = [
    ...answers.features,
    ...(answers.featureOther.trim() ? [answers.featureOther.trim()] : []),
  ];
  if (allFeatures.length > 0) {
    steps.push({
      id: "features",
      title: "Special Features",
      instructions: "One or two photos of each feature.",
      recommended: `${allFeatures.length}-${allFeatures.length * 2} photos`,
      defaultLabels: allFeatures,
      icon: Sparkles,
    });
  }

  steps.push({
    id: "backyard",
    title: "Backyard & Outdoor",
    instructions: "Closing shot — backyard, patio, pool area, or garden.",
    recommended: "1-2 photos",
    defaultLabels: ["Backyard", "Patio/Deck"],
    icon: Trees,
  });

  return steps;
}

// ═══════════════════════════════════════════════════
// GENERATE LABEL FOR NEW PHOTO IN A STEP
// ═══════════════════════════════════════════════════

function getNextLabel(step: UploadStep, existingPhotosInStep: PhotoItem[]): string {
  const count = existingPhotosInStep.length;
  if (count < step.defaultLabels.length) {
    return step.defaultLabels[count];
  }
  const baseLabel = step.defaultLabels.length > 0 ? step.defaultLabels[0] : step.title;
  return `${baseLabel} ${count + 1}`;
}

function getLabelsForBatch(step: UploadStep, existingPhotosInStep: PhotoItem[], batchSize: number): string[] {
  const labels: string[] = [];
  const existingCount = existingPhotosInStep.length;

  for (let i = 0; i < batchSize; i++) {
    const totalIndex = existingCount + i;
    if (totalIndex < step.defaultLabels.length) {
      labels.push(step.defaultLabels[totalIndex]);
    } else {
      const baseLabel = step.defaultLabels.length > 0 ? step.defaultLabels[0] : step.title;
      labels.push(`${baseLabel} ${totalIndex + 1}`);
    }
  }

  return labels;
}

// ═══════════════════════════════════════════════════
// CROP PREVIEW
// ═══════════════════════════════════════════════════

function CropPreview({
  photo,
  targetAspect,
  offset,
  onOffsetChange,
  label,
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

  const containerW = 280;
  const photoRatio = w / h;
  const containerH = Math.round(containerW / photoRatio);
  const previewW = containerW;
  const previewH = Math.min(containerH, 350);

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
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export function PhotoUploader({ photos, onPhotosChange, orientation = "landscape", onReviewConfirmed, initialBedrooms, initialBathrooms }: PhotoUploaderProps) {
  const [phase, setPhase] = useState<'questionnaire' | 'guided'>(
    photos.length > 0 ? 'guided' : 'questionnaire'
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    bedrooms: 3,
    bathrooms: 2,
    features: [],
    featureOther: "",
    views: [],
    viewOther: "",
  });

  // Hydration-safe: read URL params after mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlBeds = parseInt(params.get("beds") || "");
    const urlBaths = parseInt(params.get("baths") || "");
    setAnswers(prev => ({
      ...prev,
      bedrooms: (!isNaN(urlBeds) && urlBeds >= 1) ? urlBeds : (initialBedrooms || prev.bedrooms),
      bathrooms: (!isNaN(urlBaths) && urlBaths >= 1) ? urlBaths : (initialBathrooms || prev.bathrooms),
    }));
  }, []);
  useEffect(() => {
    if (initialBathrooms && initialBathrooms !== answers.bathrooms) {
      setAnswers(prev => ({ ...prev, bathrooms: initialBathrooms }));
    }
  }, [initialBathrooms]);
  
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([]);
  const [stepPhotoIds, setStepPhotoIds] = useState<Record<string, string[]>>({});
  const [openCropIndex, setOpenCropIndex] = useState<number | null>(null);

  const currentStep = uploadSteps[currentStepIndex] || null;

  const currentStepPhotos = useMemo(() => {
    if (!currentStep) return [];
    const ids = stepPhotoIds[currentStep.id] || [];
    return ids.map(id => photos.find(p => p.id === id)).filter(Boolean) as PhotoItem[];
  }, [currentStep, stepPhotoIds, photos]);

  const resizeForUpload = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1920;

        if (width <= maxDim && height <= maxDim) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg',
            0.85
          );
          URL.revokeObjectURL(img.src);
          return;
        }

        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
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
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFilesForStep = useCallback(
    async (files: File[], step: UploadStep) => {
      const validFiles: { file: File; width: number; height: number }[] = [];
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          alert(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum file size is 20MB.`);
          continue;
        }

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

      const currentIds = stepPhotoIds[step.id] || [];
      const currentStepPhotosList = currentIds.map(id => photos.find(p => p.id === id)).filter(Boolean) as PhotoItem[];
      const labels = getLabelsForBatch(step, currentStepPhotosList, validFiles.length);

      const newPhotos: PhotoItem[] = validFiles.map(({ file, width, height }, i) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        description: labels[i] || "",
        uploadStatus: 'uploading' as const,
        crop_offset_landscape: 50,
        crop_offset_vertical: 50,
        original_width: width,
        original_height: height,
      }));

      const newIds = newPhotos.map(p => p.id);
      setStepPhotoIds(prev => ({
        ...prev,
        [step.id]: [...(prev[step.id] || []), ...newIds],
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

          const resized = await resizeForUpload(photo.file!);
          uploadData.append("file", resized, photo.file!.name);
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
    [photos, onPhotosChange, stepPhotoIds]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!currentStep) return;
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      await handleFilesForStep(files, currentStep);
      e.target.value = "";
    },
    [currentStep, handleFilesForStep]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (photo?.preview && photo.preview.startsWith('blob:')) URL.revokeObjectURL(photo.preview);
      onPhotosChange(photos.filter((p) => p.id !== id));

      setStepPhotoIds(prev => {
        const updated = { ...prev };
        for (const stepId of Object.keys(updated)) {
          updated[stepId] = updated[stepId].filter(pid => pid !== id);
        }
        return updated;
      });
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

  const handleCropOffsetChange = useCallback(
    (id: string, aspect: 'landscape' | 'vertical', value: number) => {
      const key = aspect === 'landscape' ? 'crop_offset_landscape' : 'crop_offset_vertical';
      onPhotosChange(photos.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
    },
    [photos, onPhotosChange]
  );

  const needsCropForOrientation = (photo: PhotoItem, orient: string) => {
    if (!photo.original_width || !photo.original_height) return false;
    const ratio = photo.original_width / photo.original_height;
    if (orient === 'landscape' || orient === 'both') {
      if (Math.abs(ratio - 16 / 9) > 0.02) return true;
    }
    if (orient === 'vertical' || orient === 'both') {
      if (Math.abs(ratio - 9 / 16) > 0.02) return true;
    }
    return false;
  };

  const allUploadsComplete = photos.length > 0 && photos.every((p) => p.uploadStatus === 'complete');
  const isOnLastStep = uploadSteps.length > 0 && currentStepIndex === uploadSteps.length - 1;
  const isDraftRestore = photos.length > 0 && uploadSteps.length === 0;
  React.useEffect(() => {
    onReviewConfirmed?.(allUploadsComplete && (isOnLastStep || isDraftRestore));
  }, [allUploadsComplete, isOnLastStep, isDraftRestore, onReviewConfirmed]);

  const handleStartGuided = () => {
    const steps = buildUploadSteps(answers);
    setUploadSteps(steps);
    setCurrentStepIndex(0);
    setPhase('guided');
  };

  const goToNextStep = () => {
    if (currentStepIndex < uploadSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setOpenCropIndex(null);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setOpenCropIndex(null);
    }
  };

  const showTooManyPhotosWarning = photos.length > 35;
  const totalPhotoCount = photos.length;

  // ═══════════════════════════════════════════════════
  // RENDER — QUESTIONNAIRE
  // ═══════════════════════════════════════════════════

  if (phase === 'questionnaire') {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Tell us about the property
          </h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ll create a custom upload flow based on your answers — takes 15 seconds.
          </p>
        </div>

        {/* Bedrooms */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">How many bedrooms?</label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setAnswers(prev => ({ ...prev, bedrooms: n }))}
                className={`h-11 w-14 rounded-xl border-2 font-bold text-sm transition-all ${
                  answers.bedrooms === n
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {n === 6 ? "6+" : n}
              </button>
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">How many bathrooms?</label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setAnswers(prev => ({ ...prev, bathrooms: n }))}
                className={`h-11 w-14 rounded-xl border-2 font-bold text-sm transition-all ${
                  answers.bathrooms === n
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {n === 5 ? "5+" : n}
              </button>
            ))}
          </div>
        </div>

        {/* Special Features */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Special features? <span className="font-normal text-muted-foreground">(select all that apply)</span></label>
          <div className="flex gap-2 flex-wrap">
            {SPECIAL_FEATURES.map(feature => {
              const isSelected = answers.features.includes(feature);
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => {
                    setAnswers(prev => ({
                      ...prev,
                      features: isSelected
                        ? prev.features.filter(f => f !== feature)
                        : [...prev.features, feature],
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 inline mr-1.5" />}
                  {feature}
                </button>
              );
            })}
          </div>
          <Input
            placeholder="Other feature (e.g., Sauna)"
            value={answers.featureOther}
            onChange={(e) => setAnswers(prev => ({ ...prev, featureOther: e.target.value }))}
            className="mt-2 max-w-xs"
          />
        </div>

        {/* Notable Views */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Notable views? <span className="font-normal text-muted-foreground">(select all that apply)</span></label>
          <div className="flex gap-2 flex-wrap">
            {NOTABLE_VIEWS.map(view => {
              const isSelected = answers.views.includes(view);
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    setAnswers(prev => ({
                      ...prev,
                      views: isSelected
                        ? prev.views.filter(v => v !== view)
                        : [...prev.views, view],
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 inline mr-1.5" />}
                  {view}
                </button>
              );
            })}
          </div>
          <Input
            placeholder="Other view (e.g., Lake)"
            value={answers.viewOther}
            onChange={(e) => setAnswers(prev => ({ ...prev, viewOther: e.target.value }))}
            className="mt-2 max-w-xs"
          />
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleStartGuided}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg gap-2 w-full sm:w-auto"
        >
          Continue to Upload
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER — GUIDED UPLOAD STEPS
  // ═══════════════════════════════════════════════════

  if (phase === 'guided' && currentStep) {
    const StepIcon = currentStep.icon;
    const stepNumber = currentStepIndex + 1;
    const totalSteps = uploadSteps.length;
    const inputId = `photo-upload-step-${currentStep.id}`;

    return (
      <div
        className="space-y-6"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0 && currentStep) {
            handleFilesForStep(files, currentStep);
          }
        }}
      >
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Step {stepNumber} of {totalSteps}</span>
            <span className="text-muted-foreground">{totalPhotoCount} photo{totalPhotoCount !== 1 ? "s" : ""} total</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
            />
          </div>
          {/* Step pills */}
          <div className="flex gap-1.5 flex-wrap">
            {uploadSteps.map((s, i) => {
              const stepPhotos = (stepPhotoIds[s.id] || []).length;
              const isCurrent = i === currentStepIndex;
              const isPast = i < currentStepIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setCurrentStepIndex(i); setOpenCropIndex(null); }}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isPast
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {isPast && stepPhotos > 0 && <Check className="h-3 w-3" />}
                  {s.title.replace(/ \(\d+\)/, '')}
                  {stepPhotos > 0 && <span className="opacity-70">({stepPhotos})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <StepIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{currentStep.title}</h3>
            <p className="text-base text-muted-foreground">{currentStep.instructions}</p>
          </div>
        </div>

        {/* Recommended count */}
        <p className="text-sm text-muted-foreground">
          Recommended: {currentStep.recommended} · Every step is optional — skip if you don&apos;t have these shots
        </p>

        {/* View note */}
        {currentStep.viewNote && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Eye className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{currentStep.viewNote}</p>
          </div>
        )}

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("border-primary", "bg-primary/5"); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove("border-primary", "bg-primary/5"); }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            e.currentTarget.classList.remove("border-primary", "bg-primary/5");
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0 && currentStep) {
              handleFilesForStep(files, currentStep);
            }
          }}
        >
          <input type="file" id={inputId} multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          <label htmlFor={inputId} className="cursor-pointer flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold">Upload {currentStep.title.toLowerCase()} photos</p>
            <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
          </label>
        </div>

        {/* Photos in this step */}
        {currentStepPhotos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm">{currentStepPhotos.length} photo{currentStepPhotos.length !== 1 ? "s" : ""} in this step</span>
            </div>

            <div className="flex flex-col gap-3">
              {currentStepPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative bg-card border border-border rounded-xl transition-all p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="h-20 w-28 sm:h-24 sm:w-36 relative rounded-lg overflow-hidden flex-shrink-0 border">
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
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        {photo.uploadStatus === 'complete' && <span className="text-green-500 text-xs font-semibold">✓ Ready</span>}
                        {photo.uploadStatus === 'uploading' && <span className="text-amber-500 text-xs font-semibold animate-pulse">Uploading...</span>}
                        {photo.uploadStatus === 'failed' && <span className="text-red-500 text-xs font-semibold">✕ Failed</span>}

                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setOpenCropIndex(openCropIndex === index ? null : index); }}
                          className={`text-xs py-1 px-2.5 rounded-lg border flex items-center gap-1 transition-colors ${
                            openCropIndex === index ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                          }`}>
                          <Crop className="h-3 w-3" />
                          <span>Crop</span>
                        </button>
                      </div>
                      {photo.original_width && (
                        <p className="text-xs text-muted-foreground">{photo.original_width} × {photo.original_height}px</p>
                      )}
                    </div>

                    <button type="button" onClick={() => handleRemove(photo.id)}
                      className="p-2 text-muted-foreground hover:text-destructive flex-shrink-0">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Crop panel */}
                  {openCropIndex === index && (
                    <div className="mt-3 pt-3 border-t border-border space-y-4">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">This is optional.</span> If you skip this, we&apos;ll auto-center the crop.
                      </p>

                      {!needsCropForOrientation(photo, orientation) ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                          <Crop className="h-5 w-5 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-green-800">No crop needed!</p>
                          <p className="text-xs text-green-700 mt-1">This photo already matches your selected video format.</p>
                        </div>
                      ) : (
                        <>
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

                          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-left">
                            <p className="text-xs font-semibold text-foreground">Cropping tips:</p>
                            <p className="text-xs text-muted-foreground">• Give the home some <span className="font-medium text-foreground">headroom</span> — don&apos;t crop too tight on the roofline</p>
                            <p className="text-xs text-muted-foreground">• Front doors look best <span className="font-medium text-foreground">slightly below center</span></p>
                            <p className="text-xs text-muted-foreground">• Keep <span className="font-medium text-foreground">key features visible</span> — landscaping, pools, driveways</p>
                            <p className="text-xs text-muted-foreground">• For interiors, keep <span className="font-medium text-foreground">floors and ceilings balanced</span></p>
                          </div>
                        </>
                      )}

                      <button type="button" onClick={() => setOpenCropIndex(null)}
                        className="text-sm text-primary font-semibold hover:underline">
                        Done ✓
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add more to this step */}
            <div className="text-center pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(inputId)?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Add More {currentStep.title} Photos
              </Button>
            </div>
          </div>
        )}

        {/* Too many photos warning */}
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

        {/* Step navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {currentStepIndex > 0 ? (
            <Button variant="outline" onClick={goToPrevStep} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setPhase('questionnaire')} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Edit Property
            </Button>
          )}
          {currentStepIndex < uploadSteps.length - 1 ? (
            <Button
              onClick={goToNextStep}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-6 py-5 text-base gap-2"
            >
              {currentStepPhotos.length === 0 ? "Skip Step" : "Next Step"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-right">
              {totalPhotoCount > 0
                ? `✓ ${totalPhotoCount} photo${totalPhotoCount !== 1 ? "s" : ""} uploaded — continue below`
                : "Upload at least one photo to continue"
              }
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
