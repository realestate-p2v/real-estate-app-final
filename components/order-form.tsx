// components/order-form.tsx
// Phase 1A refactor — preserves every working mode (URL, Quick Video, sequence,
// orientation rendering, UTM tracking, Pixel events, Photo Coach handoff,
// Stripe flow). Adds:
//   - Step 1 "Your Info" for first-order users (OPTIONAL fields — headshot,
//     logo, name, phone, brokerage are encouraged for bonus content branding
//     but can be skipped via confirmation modal)
//   - Free-first-video credit handling (zeros first 10 Quick Video clips)
//   - Special Features JSONB chips (captured inside the photo uploader's
//     questionnaire; we just pass them through to the DB)
//   - Room tags derived from photo uploader's step structure
//   - Autosave draft → promote on submit
//   - Always "both" orientation (no fee; pipeline renders landscape + crops
//     vertical via ffmpeg)
//   - Photo Enhancement toggle with subscriber-aware copy
// Removed from UI (but left intact in code/DB for future resurrection):
//   - Voiceover step (VoiceoverSelector file stays dormant)
//   - Branding wizard step (BrandingSelector file stays dormant for Design
//     Studio use; order-form never imports it)
//   - Orientation selector (always "both")
//   - Custom branding add-on line

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  Link as LinkIcon,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Music,
  Sparkles,
  CreditCard,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  Image as ImageIcon,
  Lock,
  X,
} from "lucide-react";

import { PhotoUploader, type PhotoItem, buildRoomTags } from "@/components/photo-uploader";
import { MusicSelector } from "@/components/music-selector";
import { OrderSummary } from "@/components/order-summary";
import {
  SpecialFeaturesPicker,
  hasAtLeastOneFeature,
  type SpecialFeaturesValue,
} from "@/components/order-form/special-features-picker";
import { DraftSaveBar } from "@/components/draft-save-bar";
import { hasConsent } from "@/components/cookie-consent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

import {
  getSubscriptionState,
  type SubscriptionState,
  UNAUTHENTICATED_STATE,
  FREE_FIRST_VIDEO_MIN_CLIPS,
  FREE_FIRST_VIDEO_MAX_CLIPS,
} from "@/lib/subscription-state";
import { extractBrandColor, saveBrandColorToProfile } from "@/lib/brand-color-extraction";
import { useOrderFormAutosave } from "@/lib/hooks/use-order-form-autosave";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types + constants
// ─────────────────────────────────────────────────────────────────────────────

type PhotoInputMode = "upload" | "url";

interface ListingPackage {
  label: string;
  photoCount: number;
  price: number;
}

const LISTING_PACKAGES: ListingPackage[] = [
  { label: "Up to 15 Photos", photoCount: 15, price: 79 },
  { label: "Up to 25 Photos", photoCount: 25, price: 99 },
  { label: "Up to 35 Photos", photoCount: 35, price: 109 },
];

const QUICK_VIDEO_RATE = 4.95;
const NON_SUBSCRIBER_MIN_PHOTOS = 15; // tier 1 entry point
const STANDARD_MAX_PHOTOS = 35;

interface StepDef {
  label: string;
  icon: React.ElementType;
  key: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard progress bar (unchanged behavior)
// ─────────────────────────────────────────────────────────────────────────────

function WizardProgress({
  currentStep,
  totalSteps,
  steps,
}: {
  currentStep: number;
  totalSteps: number;
  steps: StepDef[];
}) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i + 1 < currentStep
                    ? "bg-accent text-accent-foreground"
                    : i + 1 === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1 < currentStep ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`text-xs mt-2 font-medium hidden sm:block ${
                  i + 1 <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav buttons (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function StepNavigation({
  currentStep,
  totalSteps,
  canProceed,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  canSubmit,
  submitLabel = "Start My Video",
}: {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
      {currentStep > 1 ? (
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      ) : (
        <div />
      )}
      <div className="ml-auto">
        {currentStep < totalSteps ? (
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg gap-2"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !canSubmit}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black px-8 py-6 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Order...
              </>
            ) : (
              <>{submitLabel}</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skip-branding confirmation modal (inline — no new deps)
// ─────────────────────────────────────────────────────────────────────────────

function SkipBrandingModal({
  open,
  onGoBack,
  onSkipAnyway,
}: {
  open: boolean;
  onGoBack: () => void;
  onSkipAnyway: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onGoBack}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 md:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold">Skip branded bonus content?</h3>
          <button
            type="button"
            onClick={onGoBack}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            You&apos;ll still get your listing video — that&apos;s the main event. But you&apos;ll miss
            out on three bonus pieces we&apos;d normally include:
          </p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>A branded flyer (print-ready for open houses and mailers)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>A vertical social video for Instagram and TikTok</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>A shareable listing page at yourname.p2v.homes</span>
            </li>
          </ul>
          <p>
            These use your headshot, logo, name, phone, and brokerage to brand them for you. It takes
            about 30 seconds to fill in.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={onSkipAnyway}
            className="text-muted-foreground hover:text-foreground font-medium text-sm"
          >
            Skip anyway
          </Button>
          <Button
            onClick={onGoBack}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold px-5 py-2.5 text-sm"
          >
            Go back and fill it in
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function OrderForm() {
  // ── Subscription + first-order state ──
  const [subState, setSubState] = useState<SubscriptionState>(UNAUTHENTICATED_STATE);
  const [isFirstOrder, setIsFirstOrder] = useState<boolean | null>(null); // null = loading
  const [stateLoaded, setStateLoaded] = useState(false);

  // ── Core form state ──
  const [currentStep, setCurrentStep] = useState(1);
  const [photoInputMode, setPhotoInputMode] = useState<PhotoInputMode>("upload");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [listingUrl, setListingUrl] = useState("");
  const [listingPackage, setListingPackage] = useState<ListingPackage | null>(null);
  const [listingPermission, setListingPermission] = useState(false);
  const [listingInstructions, setListingInstructions] = useState("");
  const [musicSelection, setMusicSelection] = useState("");
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [resolution, setResolution] = useState<"768P" | "1080P">("768P");
  const [includeEditedPhotos, setIncludeEditedPhotos] = useState(false);
  const [sequenceConfirmed, setSequenceConfirmed] = useState(false);
  const [photoPermission, setPhotoPermission] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [seqDraggedIndex, setSeqDraggedIndex] = useState<number | null>(null);
  const [seqDragOverIndex, setSeqDragOverIndex] = useState<number | null>(null);
  const [uploaderReady, setUploaderReady] = useState(false);
  const [specialFeatures, setSpecialFeatures] = useState<SpecialFeaturesValue>({});

  // ── Profile fields (Step 1 — optional for first-order users) ──
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentBrokerage, setAgentBrokerage] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ── Skip-branding modal state ──
  const [showSkipModal, setShowSkipModal] = useState(false);

  // ── Property fields (existing behavior; URL params pre-fill) ──
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyBedrooms, setPropertyBedrooms] = useState("");
  const [propertyBathrooms, setPropertyBathrooms] = useState("");
  const [listingStatus, setListingStatus] = useState<string>("Active");

  const [formData, setFormData] = useState({ notes: "" });

  // Read URL query params on mount (preserves existing ?address=...&city=... flow)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const addr = params.get("address")?.replace(/\+/g, " ");
      const city = params.get("city")?.replace(/\+/g, " ");
      const st = params.get("state")?.replace(/\+/g, " ");
      const beds = params.get("beds");
      const baths = params.get("baths");
      if (addr) setPropertyAddress(addr);
      if (city) setPropertyCity(city);
      if (st) setPropertyState(st);
      if (beds) setPropertyBedrooms(beds);
      if (baths) setPropertyBathrooms(baths);
    } catch {
      /* ignore */
    }
  }, []);

  // ── UTM capture (unchanged) ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm = {
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "",
        utm_term: params.get("utm_term") || "",
        utm_content: params.get("utm_content") || "",
      };
      if (utm.utm_source) sessionStorage.setItem("p2v_utm", JSON.stringify(utm));
    } catch {
      /* ignore */
    }
  }, []);

  // ── Load subscription state + first-order detection + profile prefill ──
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const state = await getSubscriptionState(supabase);
        setSubState(state);

        if (!state.isLoggedIn || !state.userId) {
          setIsFirstOrder(true); // treat anon as first-order (will require auth at submit)
          setStateLoaded(true);
          return;
        }

        // First-order detection: zero delivered orders
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", state.userId)
          .not("delivered_at", "is", null);

        const firstOrder = (count || 0) === 0;
        setIsFirstOrder(firstOrder);

        // Prefill profile info from lens_usage
        const { data: profile } = await supabase
          .from("lens_usage")
          .select(
            "saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url, saved_logo_url"
          )
          .eq("user_id", state.userId)
          .maybeSingle();

        if (profile) {
          setAgentName((prev) => prev || profile.saved_agent_name || "");
          setAgentPhone((prev) => prev || profile.saved_phone || "");
          setAgentEmail((prev) => prev || profile.saved_email || state.userEmail || "");
          setAgentBrokerage((prev) => prev || profile.saved_company || "");
          setHeadshotUrl((prev) => prev || profile.saved_headshot_url || null);
          setLogoUrl((prev) => prev || profile.saved_logo_url || null);
        } else if (state.userEmail) {
          setAgentEmail((prev) => prev || state.userEmail || "");
        }
      } catch (err) {
        console.error("[order-form] state load error:", err);
      } finally {
        setStateLoaded(true);
      }
    })();
  }, []);

  // ── Photo Coach handoff (preserved) ──
  useEffect(() => {
    try {
      const coachPhotos = sessionStorage.getItem("coach_photos_for_order");
      const coachAddress = sessionStorage.getItem("coach_property_address");
      if (coachPhotos) {
        const parsed = JSON.parse(coachPhotos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhotos(parsed);
          setSequenceConfirmed(false);
          parsed.forEach((photo: any) => {
            if (photo.secure_url && !photo.original_width) {
              const img = new window.Image();
              img.onload = () => {
                setPhotos((prev) =>
                  prev.map((p) =>
                    p.id === photo.id
                      ? { ...p, original_width: img.naturalWidth, original_height: img.naturalHeight }
                      : p
                  )
                );
              };
              img.src = photo.secure_url;
            }
          });
        }
        sessionStorage.removeItem("coach_photos_for_order");
      }
      if (coachAddress) {
        setPropertyAddress(coachAddress);
        sessionStorage.removeItem("coach_property_address");
      }
    } catch (e) {
      console.error("Failed to load coach photos:", e);
    }
  }, []);

  // ─── Derived state ───────────────────────────────────────────────────────
  const isUrlMode = photoInputMode === "url";
  const isUploadMode = photoInputMode === "upload";
  const photoCount = photos.length;
  const allUploadsComplete = photos.length > 0 && photos.every((p) => p.uploadStatus === "complete");

  const quickVideoEligible = subState.isQuickVideoEligible;
  const isQuickVideo =
    quickVideoEligible && isUploadMode && photoCount >= FREE_FIRST_VIDEO_MIN_CLIPS && photoCount < 15;

  // Required min for submit changes based on subscription state
  const effectiveMinPhotos = quickVideoEligible
    ? FREE_FIRST_VIDEO_MIN_CLIPS
    : NON_SUBSCRIBER_MIN_PHOTOS;

  // Free-first-video cap: 10 photos max for the promo. Otherwise 35.
  const effectiveMaxPhotos =
    subState.hasFreeFirstVideoCredit && quickVideoEligible
      ? FREE_FIRST_VIDEO_MAX_CLIPS
      : STANDARD_MAX_PHOTOS;

  // "Your Info" step is shown when this is a first-order user (regardless of
  // subscription). They get the branded sample content. Anyone else skips.
  const showYourInfoStep = isFirstOrder === true;

  // ─── Step definitions ────────────────────────────────────────────────────
  const steps: StepDef[] = useMemo(() => {
    const arr: StepDef[] = [];
    if (showYourInfoStep) arr.push({ label: "Your Info", icon: User, key: "your-info" });
    if (isUrlMode) {
      arr.push({ label: "Listing", icon: LinkIcon, key: "upload" });
    } else {
      arr.push({ label: "Photos", icon: Upload, key: "upload" });
      arr.push({ label: "Sequence", icon: ListOrdered, key: "sequence" });
    }
    arr.push({ label: "Music", icon: Music, key: "music" });
    arr.push({ label: "Extras", icon: Sparkles, key: "extras" });
    arr.push({ label: "Review", icon: CreditCard, key: "review" });
    return arr;
  }, [showYourInfoStep, isUrlMode]);

  const totalSteps = steps.length;
  const currentStepKey = steps[currentStep - 1]?.key || "upload";

  // ─── Autosave hook ──────────────────────────────────────────────────────
  const autosave = useOrderFormAutosave({
    getPayload: () => ({
      propertyAddress,
      propertyCity,
      propertyState,
      propertyBedrooms,
      propertyBathrooms,
      listingStatus,
      photos: photos.map((p, i) => ({
        id: p.id,
        order: i,
        secure_url: p.secure_url,
        description: p.description,
        camera_direction: p.camera_direction,
        camera_speed: p.camera_speed,
        custom_motion: p.custom_motion,
        crop_offset_landscape: p.crop_offset_landscape,
        crop_offset_vertical: p.crop_offset_vertical,
        original_width: p.original_width,
        original_height: p.original_height,
        roomCategory: p.roomCategory,
      })),
      roomTags: buildRoomTags(photos),
      musicSelection,
      resolution,
      orientation: "both", // always both now
      brandingSelection: "unbranded", // video is always unbranded per Matt
      brandingData: { type: "unbranded" },
      includeEditedPhotos,
      photoEditing: includeEditedPhotos,
      specialFeatures,
      includeAddressOnCard: true,
      includeUnbranded: false,
      customIntroCardUrl: null,
      customOutroCardUrl: null,
      formData: {
        name: agentName,
        email: agentEmail,
        phone: agentPhone,
        notes: formData.notes,
      },
      photoInputMode,
      listingUrl,
      listingPackage,
      listingPermission,
      listingInstructions,
    }),
    onRehydrate: (payload, ids) => {
      if (payload.propertyAddress) setPropertyAddress(payload.propertyAddress);
      if (payload.propertyCity) setPropertyCity(payload.propertyCity);
      if (payload.propertyState) setPropertyState(payload.propertyState);
      if (payload.propertyBedrooms) setPropertyBedrooms(String(payload.propertyBedrooms));
      if (payload.propertyBathrooms) setPropertyBathrooms(String(payload.propertyBathrooms));
      if (payload.listingStatus) setListingStatus(payload.listingStatus);
      if (Array.isArray(payload.photos) && payload.photos.length > 0) {
        const restored = payload.photos
          .filter((p: any) => p.secure_url)
          .map((p: any) => ({
            id: p.id || `restored-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            preview: p.secure_url,
            description: p.description || "",
            secure_url: p.secure_url,
            uploadStatus: "complete" as const,
            camera_direction: p.camera_direction || null,
            camera_speed: p.camera_speed || null,
            custom_motion: p.custom_motion || "",
            crop_offset_landscape: p.crop_offset_landscape ?? 50,
            crop_offset_vertical: p.crop_offset_vertical ?? 50,
            original_width: p.original_width || null,
            original_height: p.original_height || null,
            roomCategory: p.roomCategory || undefined,
          }));
        setPhotos(restored);
      }
      if (payload.musicSelection) setMusicSelection(payload.musicSelection);
      if (payload.resolution) setResolution(payload.resolution as "768P" | "1080P");
      if (typeof payload.includeEditedPhotos === "boolean") setIncludeEditedPhotos(payload.includeEditedPhotos);
      if (payload.specialFeatures) setSpecialFeatures(payload.specialFeatures);
      if (payload.photoInputMode === "url" || payload.photoInputMode === "upload") {
        setPhotoInputMode(payload.photoInputMode);
      }
      if (payload.listingUrl) setListingUrl(payload.listingUrl);
      if (payload.listingPackage) setListingPackage(payload.listingPackage as ListingPackage);
      if (typeof payload.listingPermission === "boolean") setListingPermission(payload.listingPermission);
      if (payload.listingInstructions) setListingInstructions(payload.listingInstructions);
      if (payload.formData?.name) setAgentName(payload.formData.name);
      if (payload.formData?.email) setAgentEmail(payload.formData.email);
      if (payload.formData?.phone) setAgentPhone(payload.formData.phone);
      if (payload.formData?.notes) setFormData({ notes: payload.formData.notes });
    },
  });

  // Mark dirty on every meaningful change
  useEffect(() => {
    autosave.markChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    propertyAddress,
    propertyCity,
    propertyState,
    propertyBedrooms,
    propertyBathrooms,
    listingStatus,
    photos.length,
    photoInputMode,
    listingUrl,
    listingPackage,
    listingPermission,
    listingInstructions,
    musicSelection,
    resolution,
    includeEditedPhotos,
    specialFeatures,
    agentName,
    agentPhone,
    agentEmail,
    agentBrokerage,
    headshotUrl,
    logoUrl,
    formData.notes,
  ]);

  // ─── InitiateCheckout pixel event (unchanged) ───────────────────────────
  const [checkoutInitiated, setCheckoutInitiated] = useState(false);
  useEffect(() => {
    if (checkoutInitiated) return;
    const hasContent = (isUploadMode && photos.length > 0) || (isUrlMode && listingUrl.trim() !== "");
    if (!hasContent) return;
    setCheckoutInitiated(true);
    if (hasConsent("marketing") && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "InitiateCheckout");
    }
    if (hasConsent("analytics") && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "begin_checkout");
    }
  }, [photos.length, listingUrl, isUploadMode, isUrlMode, checkoutInitiated]);

  // ─── Pricing (no orientation fee; voiceover fully removed) ──────────────
  const getBasePrice = () => {
    if (isUrlMode && listingPackage) return listingPackage.price;
    if (isQuickVideo) {
      return Math.round(photoCount * QUICK_VIDEO_RATE * 100) / 100;
    }
    if (photoCount <= 15) return 79;
    if (photoCount <= 25) return 99;
    if (photoCount <= 35) return 109;
    return 0;
  };
  const getEditedPhotosPrice = () =>
    includeEditedPhotos && !subState.isBranded ? photos.length * 2.99 : 0;
  const getResolutionPrice = () => (resolution === "1080P" ? 10 : 0);
  const getUrlServicePrice = () => (isUrlMode ? 25 : 0);
  const getTotalPrice = () =>
    getBasePrice() + getEditedPhotosPrice() + getResolutionPrice() + getUrlServicePrice();

  // ─── Cloudinary upload helper ───────────────────────────────────────────
  const uploadToCloudinary = async (file: Blob, folder: string): Promise<string | null> => {
    try {
      const sigResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `photo2video/${folder}` }),
      });
      const sigData = await sigResponse.json();
      if (!sigData.success) throw new Error("Signature failed");
      const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", timestamp.toString());
      fd.append("signature", signature);
      fd.append("folder", folderPath);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      return result.secure_url || null;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  // ─── Headshot + logo handlers ───────────────────────────────────────────
  const handleHeadshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeadshot(true);
    const url = await uploadToCloudinary(file, "headshots");
    setUploadingHeadshot(false);
    if (url) setHeadshotUrl(url);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await uploadToCloudinary(file, "logos");
    setUploadingLogo(false);
    if (url) {
      setLogoUrl(url);
      // Fire-and-forget brand color extraction + profile save
      try {
        const color = await extractBrandColor(file);
        if (subState.userId) {
          await saveBrandColorToProfile(createClient(), subState.userId, color);
        }
      } catch (err) {
        console.error("[order-form] color extraction failed:", err);
      }
    }
  };

  // ─── Step validation ────────────────────────────────────────────────────
  const canProceedFromCurrentStep = useCallback((): boolean => {
    switch (currentStepKey) {
      case "your-info": {
        // Fields are OPTIONAL — don't block on missing branding info.
        // Still wait for any in-flight uploads to finish so we don't drop them.
        return !uploadingHeadshot && !uploadingLogo;
      }
      case "upload":
        if (isUploadMode) {
          if (photos.length === 0 || photos.length > STANDARD_MAX_PHOTOS || !allUploadsComplete) return false;
          if (photos.length < effectiveMinPhotos) return false;
          // Special features chip picker lives inside the photo-uploader's
          // questionnaire. We also gate here — at least 1 filled.
          if (!hasAtLeastOneFeature(specialFeatures)) return false;
          return true;
        }
        if (isUrlMode) {
          return listingUrl.trim() !== "" && listingPackage !== null && listingPermission;
        }
        return false;
      case "sequence":
        return sequenceConfirmed;
      case "music":
        return !!musicSelection;
      case "extras":
        return true;
      case "review":
        return (
          !!agentName.trim() && !!agentEmail.trim() && photoPermission && !!propertyAddress.trim()
        );
      default:
        return false;
    }
  }, [
    currentStepKey,
    uploadingHeadshot,
    uploadingLogo,
    isUploadMode,
    isUrlMode,
    photos.length,
    allUploadsComplete,
    effectiveMinPhotos,
    specialFeatures,
    listingUrl,
    listingPackage,
    listingPermission,
    sequenceConfirmed,
    musicSelection,
    agentName,
    agentEmail,
    photoPermission,
    propertyAddress,
  ]);

  // ─── Skip-branding handlers ─────────────────────────────────────────────
  // Any branding field filled in? Determines whether "Skip" button is shown.
  const hasAnyBrandingInfo =
    !!agentName.trim() ||
    !!agentPhone.trim() ||
    !!agentBrokerage.trim() ||
    !!headshotUrl ||
    !!logoUrl;

  const handleSkipClick = () => {
    setShowSkipModal(true);
  };

  const handleSkipConfirmed = () => {
    setShowSkipModal(false);
    setCurrentStep(currentStep + 1);
  };

  // ─── Submit handler ─────────────────────────────────────────────────────
  const handleSubmitOrder = async () => {
    if (!agentName || !agentEmail) {
      alert("Please fill in your name and email.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Flush autosave + promote draft
      const { orderId: promotedOrderId, agentPropertyId } = await autosave.promoteDraft();

      let uploadedPhotos: any[] = [];
      if (isUploadMode) {
        uploadedPhotos = photos.map((photo, i) => ({
          secure_url: photo.secure_url,
          order: i,
          description: photo.description || "",
          camera_direction: photo.camera_direction || null,
          camera_speed: photo.camera_speed || null,
          custom_motion: photo.custom_motion || "",
          crop_offset_landscape: photo.crop_offset_landscape ?? 50,
          crop_offset_vertical: photo.crop_offset_vertical ?? 50,
          original_width: photo.original_width || null,
          original_height: photo.original_height || null,
          room_category: photo.roomCategory || null,
        }));
      }

      let musicFileUrl = "";
      if (customAudioFile) {
        const musicResult = await uploadToCloudinary(customAudioFile, "audio");
        musicFileUrl = musicResult || "";
      }

      let utmData: Record<string, string> = {};
      try {
        utmData = JSON.parse(sessionStorage.getItem("p2v_utm") || "{}");
      } catch {
        utmData = {};
      }

      const orderPayload = {
        // Pre-existing /api/orders contract
        customer: { name: agentName, email: agentEmail, phone: agentPhone },
        uploadedPhotos,
        listing_url: isUrlMode ? listingUrl.trim() : null,
        listing_package_price: isUrlMode && listingPackage ? listingPackage.price : null,
        listing_package_label: isUrlMode && listingPackage ? listingPackage.label : null,
        listing_instructions: isUrlMode ? listingInstructions.trim() : null,
        resolution,
        orientation: "both",
        propertyAddress,
        propertyCity,
        propertyState,
        propertyBedrooms,
        propertyBathrooms,
        musicSelection,
        musicFile: musicFileUrl,
        branding: { type: "unbranded" }, // video is always unbranded now
        voiceover: false,
        voiceoverScript: "",
        voiceoverVoice: "",
        includeEditedPhotos,
        includeUnbranded: false,
        customIntroCardUrl: null,
        customOutroCardUrl: null,
        includeAddressOnCard: true,
        totalPrice: getTotalPrice(),
        specialInstructions: formData.notes,
        is_quick_video: isQuickVideo,
        utm_source: utmData.utm_source || null,
        utm_medium: utmData.utm_medium || null,
        utm_campaign: utmData.utm_campaign || null,

        // Phase 1A additions
        agent_property_id: agentPropertyId || null,
        promoted_order_id: promotedOrderId || null,
        special_features: specialFeatures,
        room_tags: buildRoomTags(photos),
        photo_editing: includeEditedPhotos,
        is_first_order: isFirstOrder === true,
        listing_status: listingStatus,
        agent_info: isFirstOrder
          ? {
              name: agentName,
              phone: agentPhone,
              email: agentEmail,
              company: agentBrokerage,
              headshot_url: headshotUrl,
              logo_url: logoUrl,
            }
          : null,
      };

      // Free-first-video path: new endpoint, skip Stripe entirely
      if (subState.hasFreeFirstVideoCredit && isQuickVideo) {
        const resp = await fetch("/api/orders/free-first-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const result = await resp.json();
        if (!result.success) throw new Error(result.error || "Free video submission failed");
        window.location.href = `/order/processing?orderId=${result.data.orderId}`;
        return;
      }

      // Paid path: existing /api/orders → /api/checkout flow
      const dbResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const dbResult = await dbResponse.json();
      if (!dbResult.success) throw new Error(dbResult.error || "Failed to save to database");

      const createdOrderId = dbResult.data.orderId;

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              name: isQuickVideo
                ? `Quick Video — ${photoCount} clips × $${QUICK_VIDEO_RATE}`
                : isUrlMode && listingPackage
                ? `${listingPackage.label} — Listing URL Order`
                : `${photoCount} Photo Video Package`,
              amount: getTotalPrice() * 100,
            },
          ],
          customerDetails: { name: agentName, email: agentEmail, phone: agentPhone },
          orderData: {
            orderId: createdOrderId,
            photoCount: isUrlMode && listingPackage ? listingPackage.photoCount : photoCount,
          },
        }),
      });
      const session = await checkoutResponse.json();
      if (!checkoutResponse.ok || !session.url) {
        throw new Error(session.error || "Checkout failed");
      }

      // Admin bypass case: jump straight to processing
      if (session.sessionId === "admin_bypass") {
        window.location.href = `/order/processing?orderId=${createdOrderId}`;
        return;
      }

      window.location.href = session.url;
    } catch (error: any) {
      alert("Error processing order: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeSwitch = (mode: PhotoInputMode) => {
    setPhotoInputMode(mode);
    setCurrentStep(showYourInfoStep ? 2 : 1);
    if (mode === "upload") {
      setListingUrl("");
      setListingPackage(null);
      setListingPermission(false);
      setListingInstructions("");
    } else {
      setSequenceConfirmed(false);
    }
  };

  if (!stateLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="relative">
      <SkipBrandingModal
        open={showSkipModal}
        onGoBack={() => setShowSkipModal(false)}
        onSkipAnyway={handleSkipConfirmed}
      />

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <DraftSaveBar
            isLoggedIn={autosave.isLoggedIn}
            draftId={autosave.orderId}
            draftName={propertyAddress || "Draft"}
            isSaving={autosave.isSaving}
            lastSaved={autosave.lastSavedAt}
            hasUnsavedChanges={autosave.hasUnsavedChanges}
            onSave={() => autosave.saveNow()}
          />

          <WizardProgress currentStep={currentStep} totalSteps={totalSteps} steps={steps} />

          {/* ═══ STEP: YOUR INFO (first-order only — fields optional) ═══ */}
          {currentStepKey === "your-info" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your Info</h2>
                  <p className="text-sm text-muted-foreground">
                    Used to brand your bonus content (flyer, social post, listing page). Your video itself
                    is always delivered unbranded.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-base text-green-800 leading-relaxed">
                    Add your info and we&apos;ll include three branded bonus pieces with your video — a
                    flyer, a vertical social video, and a shareable listing page. Optional, but nice to
                    have.
                  </p>
                </div>
              </div>

              {/* Headshot + Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Headshot</Label>
                  {headshotUrl ? (
                    <div className="relative">
                      <img
                        src={headshotUrl}
                        alt="Headshot"
                        className="h-32 w-32 object-cover rounded-xl border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setHeadshotUrl(null)}
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 w-32 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer">
                      {uploadingHeadshot ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <User className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeadshotUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  {logoUrl ? (
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-32 w-32 object-contain rounded-xl border border-border bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 w-32 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer">
                      {uploadingLogo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Jane Smith"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={agentPhone}
                    onChange={(e) => setAgentPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brokerage</Label>
                  <Input
                    value={agentBrokerage}
                    onChange={(e) => setAgentBrokerage(e.target.value)}
                    placeholder="Coldwell Banker"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={agentEmail}
                    onChange={(e) => setAgentEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                We&apos;ll only brand the bonus pieces with the info you provide. Leave any field blank
                to skip branding on that piece.
              </p>

              <StepNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                canProceed={canProceedFromCurrentStep()}
                onBack={() => setCurrentStep(currentStep - 1)}
                onNext={() => setCurrentStep(currentStep + 1)}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
                canSubmit={canProceedFromCurrentStep()}
              />

              {/* Skip link — only shown if user hasn't filled in anything */}
              {!hasAnyBrandingInfo && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleSkipClick}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  >
                    Skip branding — I just want my video
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP: UPLOAD / LISTING URL ═══ */}
          {currentStepKey === "upload" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Upload Your Photos</h2>
                  <p className="text-sm text-muted-foreground">
                    Your video is delivered in both landscape and vertical — included at no extra cost.
                  </p>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleModeSwitch("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 font-semibold text-md transition-all ${
                    isUploadMode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  Use My Photos
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("url")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 font-semibold text-md transition-all ${
                    isUrlMode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <LinkIcon className="h-5 w-5" />
                  <span>Use My Listing Link</span>
                  <span className="text-green-600 font-medium">(+$25)</span>
                </button>
              </div>

              {/* Upload mode */}
              {isUploadMode && (
                <>
                  <PhotoUploader
                    photos={photos}
                    onPhotosChange={setPhotos}
                    orientation="both"
                    onReviewConfirmed={setUploaderReady}
                    initialBedrooms={propertyBedrooms ? parseInt(propertyBedrooms) : undefined}
                    initialBathrooms={propertyBathrooms ? parseInt(propertyBathrooms) : undefined}
                    minPhotos={effectiveMinPhotos}
                    maxPhotos={effectiveMaxPhotos}
                  />

                  {/* Special Features chips — JSONB, narrative data for DW */}
                  <div className="pt-4 border-t border-border">
                    <SpecialFeaturesPicker value={specialFeatures} onChange={setSpecialFeatures} />
                  </div>

                  {/* Subscriber Quick Video banner */}
                  {isQuickVideo && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-bold text-cyan-800">
                              Quick Video — {photoCount} clips × ${QUICK_VIDEO_RATE} = ${(photoCount * QUICK_VIDEO_RATE).toFixed(2)}
                            </p>
                            <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded-full">
                              LENS SUBSCRIBER
                            </span>
                          </div>
                          <p className="text-sm text-cyan-700 mt-1">
                            Pay only for the clips you need — no minimum package required.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Non-subscriber minimum note */}
                  {!quickVideoEligible && photoCount > 0 && photoCount < NON_SUBSCRIBER_MIN_PHOTOS && (
                    <p className="text-sm text-amber-600">
                      Upload at least {NON_SUBSCRIBER_MIN_PHOTOS} photos for the Standard package ($79). Subscribe to
                      Lens to unlock per-clip pricing from 5 photos.
                    </p>
                  )}
                </>
              )}

              {/* URL mode (preserved) */}
              {isUrlMode && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="listing-url" className="font-semibold">
                      Paste Your Listing URL
                    </Label>
                    <Input
                      id="listing-url"
                      type="url"
                      placeholder="https://www.zillow.com/homedetails/..."
                      value={listingUrl}
                      onChange={(e) => setListingUrl(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold">Select Your Package</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {LISTING_PACKAGES.map((pkg) => (
                        <button
                          key={pkg.photoCount}
                          type="button"
                          onClick={() => setListingPackage(pkg)}
                          className={`flex flex-col items-center justify-center gap-1 py-5 px-3 rounded-xl border-2 font-semibold transition-all ${
                            listingPackage?.photoCount === pkg.photoCount
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <span className="text-2xl font-black text-foreground">${pkg.price}</span>
                          <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                            {pkg.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listing-instructions" className="font-semibold">
                      Photo Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      id="listing-instructions"
                      placeholder="e.g. Don't use basement photos..."
                      value={listingInstructions}
                      onChange={(e) => setListingInstructions(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Special features still apply in URL mode */}
                  <div className="pt-4 border-t border-border">
                    <SpecialFeaturesPicker value={specialFeatures} onChange={setSpecialFeatures} />
                  </div>

                  <div
                    className={`rounded-xl border-2 p-4 transition-colors ${
                      listingPermission
                        ? "bg-green-50/50 border-green-500"
                        : "bg-red-50/50 border-red-400"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="listing-permission"
                        checked={listingPermission}
                        onCheckedChange={(c) => setListingPermission(c === true)}
                        className="h-8 w-8 mt-0.5 bg-white border-3 border-gray-500"
                      />
                      <label htmlFor="listing-permission" className="text-sm font-medium cursor-pointer leading-snug">
                        I give permission to select and sequence the photos from my listing as they see fit to create
                        the best possible video.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav */}
              {((isUploadMode && uploaderReady) || isUrlMode) && (
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  canProceed={canProceedFromCurrentStep()}
                  onBack={() => setCurrentStep(currentStep - 1)}
                  onNext={() => setCurrentStep(currentStep + 1)}
                  onSubmit={handleSubmitOrder}
                  isSubmitting={isSubmitting}
                  canSubmit={canProceedFromCurrentStep()}
                />
              )}
            </div>
          )}

          {/* ═══ STEP: SEQUENCE ═══ */}
          {currentStepKey === "sequence" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <ListOrdered className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Confirm Your Sequence</h2>
                  <p className="text-sm text-muted-foreground">
                    Make sure your photos are in the right order for the walkthrough video
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">Drag photos to reorder, or use the arrows on hover.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={() => setSeqDraggedIndex(index)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setSeqDragOverIndex(index);
                    }}
                    onDragEnd={() => {
                      setSeqDraggedIndex(null);
                      setSeqDragOverIndex(null);
                    }}
                    onDrop={() => {
                      if (seqDraggedIndex !== null && seqDraggedIndex !== index) {
                        const newPhotos = [...photos];
                        const [moved] = newPhotos.splice(seqDraggedIndex, 1);
                        newPhotos.splice(index, 0, moved);
                        setPhotos(newPhotos);
                        setSequenceConfirmed(false);
                      }
                      setSeqDraggedIndex(null);
                      setSeqDragOverIndex(null);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all ${
                      seqDraggedIndex === index
                        ? "opacity-40 scale-95 border-primary"
                        : seqDragOverIndex === index
                        ? "border-primary ring-2 ring-primary/30 scale-105"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="aspect-[4/3] relative">
                      <img src={photo.preview} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                    </div>
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <div className="bg-black/60 text-white rounded p-0.5">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold shadow-md">
                        {index + 1}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          if (index === 0) return;
                          const newPhotos = [...photos];
                          [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
                          setPhotos(newPhotos);
                          setSequenceConfirmed(false);
                        }}
                        disabled={index === 0}
                        className="h-6 w-6 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (index === photos.length - 1) return;
                          const newPhotos = [...photos];
                          [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
                          setPhotos(newPhotos);
                          setSequenceConfirmed(false);
                        }}
                        disabled={index === photos.length - 1}
                        className="h-6 w-6 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    {photo.description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                        <p className="text-white text-xs truncate">{photo.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                className={`rounded-2xl border-2 p-5 transition-colors ${
                  sequenceConfirmed ? "bg-green-50/50 border-green-500" : "bg-red-50/50 border-red-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="confirm-sequence"
                    checked={sequenceConfirmed}
                    onCheckedChange={(c) => setSequenceConfirmed(c === true)}
                    className="h-8 w-8 bg-white"
                  />
                  <label htmlFor="confirm-sequence" className="font-medium cursor-pointer">
                    I confirm these photos are in the correct order for my video.
                  </label>
                </div>
              </div>

              <StepNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                canProceed={canProceedFromCurrentStep()}
                onBack={() => setCurrentStep(currentStep - 1)}
                onNext={() => setCurrentStep(currentStep + 1)}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
                canSubmit={canProceedFromCurrentStep()}
              />
            </div>
          )}

          {/* ═══ STEP: MUSIC ═══ */}
          {currentStepKey === "music" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
              <MusicSelector
                selected={musicSelection}
                onSelect={setMusicSelection}
                customAudioFile={customAudioFile}
                onCustomAudioChange={setCustomAudioFile}
                photoCount={photos.length}
              />
              {!musicSelection && (
                <p className="text-xs text-red-500 italic">* Please select a music track to continue</p>
              )}
              <StepNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                canProceed={canProceedFromCurrentStep()}
                onBack={() => setCurrentStep(currentStep - 1)}
                onNext={() => setCurrentStep(currentStep + 1)}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
                canSubmit={canProceedFromCurrentStep()}
              />
            </div>
          )}

          {/* ═══ STEP: EXTRAS ═══ */}
          {currentStepKey === "extras" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Extras</h2>
                  <p className="text-sm text-muted-foreground">Enhance your video with these optional upgrades</p>
                </div>
              </div>

              {/* Resolution */}
              <div className="space-y-3">
                <label className="text-base font-bold text-foreground">Video Resolution</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setResolution("768P")}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      resolution === "768P"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-lg font-bold">768P HD</div>
                    <div className="text-sm text-muted-foreground mt-1">Included</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution("1080P")}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      resolution === "1080P"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-lg font-bold">1080P Full HD</div>
                    <div className="text-sm text-green-600 font-medium mt-1">+ $10</div>
                  </button>
                </div>
              </div>

              {/* Photo Enhancement */}
              <div className="border-t border-border pt-8">
                <div className="flex items-center justify-between p-5 bg-muted/80 rounded-xl">
                  <div className="pr-4">
                    <p className="font-bold text-base">
                      Photo Enhancement{" "}
                      {subState.isBranded ? (
                        <span className="text-green-600 text-sm font-semibold ml-1">
                          — Included with Lens
                        </span>
                      ) : includeEditedPhotos && photos.length > 0 ? (
                        <span className="text-muted-foreground text-sm font-normal ml-1">
                          (+${(photos.length * 2.99).toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm font-normal ml-1">(+$2.99/photo)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clean up lighting, colors, and exposure on all your photos.
                    </p>
                  </div>
                  <Switch
                    checked={includeEditedPhotos}
                    onCheckedChange={setIncludeEditedPhotos}
                    className="scale-150 mr-2 data-[state=checked]:bg-primary border-1 border-slate-400"
                  />
                </div>
              </div>

              <StepNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                canProceed={canProceedFromCurrentStep()}
                onBack={() => setCurrentStep(currentStep - 1)}
                onNext={() => setCurrentStep(currentStep + 1)}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
                canSubmit={canProceedFromCurrentStep()}
              />
            </div>
          )}

          {/* ═══ STEP: REVIEW & PAY ═══ */}
          {currentStepKey === "review" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Review &amp; Pay</h2>
                  <p className="text-sm text-muted-foreground">Confirm property details and complete your order</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Property Details</h3>
                <Input
                  placeholder="Property Address (e.g. 123 Main Street)"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="h-11"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Input placeholder="City" value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} />
                  <Input placeholder="State" value={propertyState} onChange={(e) => setPropertyState(e.target.value)} />
                  <Input
                    placeholder="Bedrooms"
                    type="number"
                    value={propertyBedrooms}
                    onChange={(e) => setPropertyBedrooms(e.target.value)}
                  />
                  <Input
                    placeholder="Bathrooms"
                    type="number"
                    value={propertyBathrooms}
                    onChange={(e) => setPropertyBathrooms(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Listing Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Active", "Coming Soon", "Sold", "Price Reduced"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setListingStatus(s)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          listingStatus === s
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact — locked to Step 1 profile info for first-order users */}
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-lg font-bold">Your Contact</h3>
                {showYourInfoStep ? (
                  <div className="bg-muted/50 rounded-xl border border-border p-4 text-sm">
                    <p className="font-semibold text-foreground">{agentName || <span className="text-muted-foreground italic">No name provided</span>}</p>
                    <p className="text-muted-foreground">{agentEmail}</p>
                    <p className="text-muted-foreground">{agentPhone || <span className="italic">No phone provided</span>}</p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-primary font-semibold hover:underline mt-1"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={agentEmail}
                        onChange={(e) => setAgentEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone (Optional)</Label>
                      <Input value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} className="h-11" />
                    </div>
                  </div>
                )}
               
                <div className="space-y-2">
                  <Label>Special Instructions (Optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific requests..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Photo permission */}
              <div
                className={`rounded-2xl border-2 p-5 transition-colors ${
                  photoPermission ? "bg-green-50/50 border-green-500" : "bg-red-50/50 border-red-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="photo-permission"
                    checked={photoPermission}
                    onCheckedChange={(c) => setPhotoPermission(c === true)}
                    className="h-6 w-6 mt-0.5"
                  />
                  <div>
                    <label htmlFor="photo-permission" className="font-medium cursor-pointer">
                      I confirm I own these photos or have permission from the owner to use them.
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      This includes photos taken by a photographer hired for your listing.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">
                By placing this order, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
                .
              </p>

              <StepNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                canProceed={canProceedFromCurrentStep()}
                onBack={() => setCurrentStep(currentStep - 1)}
                onNext={() => setCurrentStep(currentStep + 1)}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
                canSubmit={canProceedFromCurrentStep()}
              />
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <OrderSummary
            photoCount={isUrlMode && listingPackage ? listingPackage.photoCount : photoCount}
            includeEditedPhotos={includeEditedPhotos}
            resolution={resolution}
            orientation="both"
            isUrlMode={isUrlMode}
            isQuickVideo={isQuickVideo}
            isSubscriber={subState.isBranded}
            hasFreeFirstVideoCredit={subState.hasFreeFirstVideoCredit}
          />
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 lg:hidden z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="w-full flex items-center justify-between"
        >
          <span className="text-sm font-semibold text-foreground">Order Total</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-foreground">${getTotalPrice().toFixed(2)}</span>
            <ChevronUp
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                showMobileSummary ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        {showMobileSummary && (
          <div className="mt-3 pt-3 border-t border-border max-h-[50vh] overflow-y-auto">
            <OrderSummary
              photoCount={isUrlMode && listingPackage ? listingPackage.photoCount : photoCount}
              includeEditedPhotos={includeEditedPhotos}
              resolution={resolution}
              orientation="both"
              isUrlMode={isUrlMode}
              isQuickVideo={isQuickVideo}
              isSubscriber={subState.isBranded}
              hasFreeFirstVideoCredit={subState.hasFreeFirstVideoCredit}
            />
          </div>
        )}
      </div>

      <div className="h-20 lg:hidden" />
    </div>
  );
}
