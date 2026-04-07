"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PhotoUploader, type PhotoItem } from "@/components/photo-uploader";
import { MusicSelector } from "@/components/music-selector";
import { BrandingSelector, type BrandingData } from "@/components/branding-selector";
import { VoiceoverSelector } from "@/components/voiceover-selector";
import { OrderSummary } from "@/components/order-summary";
import { hasConsent } from "@/components/cookie-consent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import {
  Upload,
  Link as LinkIcon,
  User,
  Mail,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Camera,
  Music,
  ImageIcon,
  Sparkles,
  CreditCard,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ListOrdered,
} from "lucide-react";
import { useOrderDraft } from "@/hooks/use-order-draft";
import { DraftSaveBar } from "@/components/draft-save-bar";

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

// ── Quick Video constants ──
const QUICK_VIDEO_RATE = 4.95;
const QUICK_VIDEO_MIN = 5;
const QUICK_VIDEO_MAX = 14;

// ── Step definitions ──
interface StepDef {
  label: string;
  icon: React.ElementType;
  key: string;
}

const UPLOAD_STEPS: StepDef[] = [
  { label: "Photos", icon: Upload, key: "upload" },
  { label: "Sequence", icon: ListOrdered, key: "sequence" },
  { label: "Music", icon: Music, key: "music" },
  { label: "Branding", icon: ImageIcon, key: "branding" },
  { label: "Extras", icon: Sparkles, key: "extras" },
  { label: "Review", icon: CreditCard, key: "review" },
];

const URL_STEPS: StepDef[] = [
  { label: "Listing", icon: LinkIcon, key: "upload" },
  { label: "Music", icon: Music, key: "music" },
  { label: "Branding", icon: ImageIcon, key: "branding" },
  { label: "Extras", icon: Sparkles, key: "extras" },
  { label: "Review", icon: CreditCard, key: "review" },
];

// ── Progress Bar Component ──
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
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        {/* Active line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />

        {steps.map((step, i) => {
          const StepIcon = step.icon;
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
                {i + 1 < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium hidden sm:block ${
                  i + 1 <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
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

// ── Navigation Buttons ──
function StepNavigation({
  currentStep,
  totalSteps,
  canProceed,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  canSubmit,
}: {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
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
              <>Pay &amp; Complete Order</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Order Form ──
export function OrderForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [photoInputMode, setPhotoInputMode] = useState<PhotoInputMode>("upload");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [listingUrl, setListingUrl] = useState("");
  const [listingPackage, setListingPackage] = useState<ListingPackage | null>(null);
  const [listingPermission, setListingPermission] = useState(false);
  const [listingInstructions, setListingInstructions] = useState("");
  const [musicSelection, setMusicSelection] = useState("");
  const [resolution, setResolution] = useState<"768P" | "1080P">("768P");
  const [orientation, setOrientation] = useState<"landscape" | "vertical" | "both">("landscape");
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [brandingSelection, setBrandingSelection] = useState("unbranded");
  const [brandingData, setBrandingData] = useState<BrandingData>({ type: "unbranded" });
  const [voiceoverSelection, setVoiceoverSelection] = useState("none");
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [includeEditedPhotos, setIncludeEditedPhotos] = useState(false);
  const [includeUnbranded, setIncludeUnbranded] = useState(false);
  const [sequenceConfirmed, setSequenceConfirmed] = useState(false);
  const [photoPermission, setPhotoPermission] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [seqDraggedIndex, setSeqDraggedIndex] = useState<number | null>(null);
  const [seqDragOverIndex, setSeqDragOverIndex] = useState<number | null>(null);
  const [uploaderReady, setUploaderReady] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [propertyAddress, setPropertyAddress] = useState(() => {
  if (typeof window !== "undefined") return new URLSearchParams(window.location.search).get("address")?.replace(/\+/g, " ") || "";
  return "";
});
  const [propertyCity, setPropertyCity] = useState(() => {
  if (typeof window !== "undefined") return new URLSearchParams(window.location.search).get("city")?.replace(/\+/g, " ") || "";
  return "";
});
  const [propertyState, setPropertyState] = useState(() => {
  if (typeof window !== "undefined") return new URLSearchParams(window.location.search).get("state")?.replace(/\+/g, " ") || "";
  return "";
});
  const [propertyBedrooms, setPropertyBedrooms] = useState(() => {
  if (typeof window !== "undefined") return new URLSearchParams(window.location.search).get("beds") || "";
  return "";
});
  const [propertyBathrooms, setPropertyBathrooms] = useState(() => {
  if (typeof window !== "undefined") return new URLSearchParams(window.location.search).get("baths") || "";
  return "";
});
  const [includeAddressOnCard, setIncludeAddressOnCard] = useState(true);

  // ── Subscriber check ──
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    const checkSub = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
 
        const isAdmin = user.email === "realestatephoto2video@gmail.com";
        if (isAdmin) setIsSubscriber(true);
 
        const { data } = await supabase
          .from("lens_usage")
          .select("is_subscriber, saved_agent_name, saved_phone, saved_email")
          .eq("user_id", user.id)
          .single();
 
        if (data) {
          if (isAdmin || data.is_subscriber) setIsSubscriber(true);
          if (data.saved_agent_name || data.saved_email || data.saved_phone) {
            setFormData(prev => ({
              ...prev,
              name: prev.name || data.saved_agent_name || "",
              email: prev.email || data.saved_email || user.email || "",
              phone: prev.phone || data.saved_phone || "",
            }));
          }
        }
      } catch {
        // Not logged in or query failed
      }
    };
    checkSub();
  }, []);

  // Read property details from URL query params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const addr = params.get("address");
      const city = params.get("city");
      const state = params.get("state");
      const beds = params.get("beds");
      const baths = params.get("baths");
      if (addr && !propertyAddress) setPropertyAddress(addr);
      if (city && !propertyCity) setPropertyCity(city);
      if (state && !propertyState) setPropertyState(state);
      if (beds && !propertyBedrooms) setPropertyBedrooms(beds);
      if (baths && !propertyBathrooms) setPropertyBathrooms(baths);
    } catch {}
  }, []);

  // ── Derived ──
  const isUrlMode = photoInputMode === "url";
  const isUploadMode = photoInputMode === "upload";
  const photoCount = photos.length;
  const allUploadsComplete = photos.length > 0 && photos.every((p) => p.uploadStatus === "complete");
  const steps = isUrlMode ? URL_STEPS : UPLOAD_STEPS;
  const totalSteps = steps.length;

  // ── Quick Video check ──
  const isQuickVideo = isSubscriber && isUploadMode && photoCount >= QUICK_VIDEO_MIN && photoCount <= QUICK_VIDEO_MAX;

  // ── UTM capture on mount ──
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
      if (utm.utm_source) {
        sessionStorage.setItem("p2v_utm", JSON.stringify(utm));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // ── InitiateCheckout event — fire once when first photo uploads or URL is entered ──
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

  // ── Draft save/load ──
  const draft = useOrderDraft({
    getFormData: () => ({
      photoInputMode,
      savedPhotos: photos.map((p) => ({
        id: p.id,
        secure_url: p.secure_url,
        description: p.description,
        camera_direction: p.camera_direction,
        camera_speed: p.camera_speed,
        custom_motion: p.custom_motion,
        crop_offset_landscape: p.crop_offset_landscape,
        crop_offset_vertical: p.crop_offset_vertical,
        original_width: p.original_width,
        original_height: p.original_height,
      })),
      listingUrl,
      listingPackage,
      listingPermission,
      listingInstructions,
      musicSelection,
      resolution,
      orientation,
      brandingSelection,
      brandingData: { ...brandingData, logoFile: undefined },
      voiceoverSelection,
      voiceoverScript,
      selectedVoice,
      includeEditedPhotos,
      propertyAddress,
      propertyCity,
      propertyState,
      propertyBedrooms,
      propertyBathrooms,
      includeAddressOnCard,
      formData,
    }),
    setFormData: (data) => {
      if (data.photoInputMode) setPhotoInputMode(data.photoInputMode);
      if (data.savedPhotos && Array.isArray(data.savedPhotos) && data.savedPhotos.length > 0) {
        const restoredPhotos = data.savedPhotos
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
          }));
        setPhotos(restoredPhotos);
      }
      if (data.listingUrl) setListingUrl(data.listingUrl);
      if (data.listingPackage) setListingPackage(data.listingPackage);
      if (data.listingPermission !== undefined) setListingPermission(data.listingPermission);
      if (data.listingInstructions) setListingInstructions(data.listingInstructions);
      if (data.musicSelection) setMusicSelection(data.musicSelection);
      if (data.resolution) setResolution(data.resolution);
      if (data.orientation) setOrientation(data.orientation);
      if (data.brandingSelection) setBrandingSelection(data.brandingSelection);
      if (data.brandingData) setBrandingData(data.brandingData);
      if (data.voiceoverSelection) setVoiceoverSelection(data.voiceoverSelection);
      if (data.voiceoverScript) setVoiceoverScript(data.voiceoverScript);
      if (data.selectedVoice) setSelectedVoice(data.selectedVoice);
      if (data.includeEditedPhotos !== undefined) setIncludeEditedPhotos(data.includeEditedPhotos);
      if (data.propertyAddress) setPropertyAddress(data.propertyAddress);
      if (data.propertyCity) setPropertyCity(data.propertyCity);
      if (data.propertyState) setPropertyState(data.propertyState);
      if (data.propertyBedrooms) setPropertyBedrooms(data.propertyBedrooms);
      if (data.propertyBathrooms) setPropertyBathrooms(data.propertyBathrooms);
      if (data.includeAddressOnCard !== undefined) setIncludeAddressOnCard(data.includeAddressOnCard);
      if (data.formData) setFormData(data.formData);

      // Determine which step to restore to based on data completeness
      if (data.formData?.name || data.formData?.email) {
        // Has review data — go to review step
      } else if (data.voiceoverSelection || data.resolution === "1080P" || data.includeEditedPhotos) {
        // Has extras
      } else if (data.brandingSelection && data.brandingSelection !== "unbranded") {
        // Has branding
      } else if (data.musicSelection) {
        // Has music
      }
    },
  });

  // Mark draft as changed when any form value changes
  useEffect(() => {
    draft.markChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photoInputMode,
    listingUrl,
    listingPackage,
    listingInstructions,
    musicSelection,
    resolution,
    orientation,
    brandingSelection,
    voiceoverSelection,
    voiceoverScript,
    selectedVoice,
    includeEditedPhotos,
    propertyAddress,
    propertyCity,
    propertyState,
    propertyBedrooms,
    propertyBathrooms,
    includeAddressOnCard,
    photos.length,
    formData.name,
    formData.email,
  ]);

  // Load photos from Photo Coach if navigated from gallery
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

  // ── Pricing ──
  const getBasePrice = () => {
    if (isUrlMode && listingPackage) return listingPackage.price;
    // Subscriber per-clip rate for 5-14 clips
    if (isQuickVideo) {
      return Math.round(photoCount * QUICK_VIDEO_RATE * 100) / 100;
    }
    // Regular tiers
    if (photoCount <= 15) return 79;
    if (photoCount <= 25) return 99;
    if (photoCount <= 35) return 109;
    return 0;
  };

  const getBrandingPrice = () => 0;
  const getVoiceoverPrice = () => (voiceoverSelection === "voiceover" && !isQuickVideo ? 25 : 0);
  const getEditedPhotosPrice = () => (includeEditedPhotos ? photos.length * 2.99 : 0);
  const getResolutionPrice = () => (resolution === "1080P" ? 10 : 0);
  const getOrientationPrice = () => (orientation === "both" ? 15 : 0);
  const getUrlServicePrice = () => (isUrlMode ? 25 : 0);
  const getTotalPrice = () =>
    getBasePrice() +
    getBrandingPrice() +
    getVoiceoverPrice() +
    getEditedPhotosPrice() +
    getResolutionPrice() +
    getOrientationPrice() +
    getUrlServicePrice();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Step key resolver ──
  const currentStepKey = steps[currentStep - 1]?.key || "upload";

  // ── Validation per step ──
  const canProceedFromCurrentStep = (): boolean => {
    switch (currentStepKey) {
      case "upload":
        if (isUploadMode) {
          if (photos.length === 0 || photos.length > 35 || !allUploadsComplete) return false;
          // Subscribers with 1-4 photos can't proceed (minimum 5 for quick video, or 15 for standard)
          if (isSubscriber && photos.length > 0 && photos.length < QUICK_VIDEO_MIN) return false;
          return true;
        }
        if (isUrlMode)
          return listingUrl.trim() !== "" && listingPackage !== null && listingPermission;
        return false;
      case "sequence":
        return sequenceConfirmed;
      case "music":
        return !!musicSelection;
      case "branding":
        return true; // optional
      case "extras":
        return true; // optional
      case "review":
        return !!formData.name && !!formData.email && photoPermission;
      default:
        return false;
    }
  };

  // ── Cloudinary helper ──
  const uploadToCloudinary = async (file: Blob, folder: string) => {
    try {
      const sigResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `photo2video/${folder}` }),
      });
      const sigData = await sigResponse.json();
      if (!sigData.success) throw new Error("Signature failed");
      const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", timestamp.toString());
      uploadData.append("signature", signature);
      uploadData.append("folder", folderPath);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: uploadData,
      });
      return await response.json();
    } catch (error) {
      console.error("Cloudinary Error:", error);
      return null;
    }
  };

  // ── Submit order ──
  const handleSubmitOrder = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in your name and email.");
      return;
    }
    setIsSubmitting(true);
    try {
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
        }));
      }

      let brandingLogoUrl = "";
      if (brandingData.logoFile) {
        const logoResult = await uploadToCloudinary(brandingData.logoFile, "logos");
        brandingLogoUrl = logoResult?.secure_url || "";
      }

      let musicFileUrl = "";
      if (customAudioFile) {
        const musicResult = await uploadToCloudinary(customAudioFile, "audio");
        musicFileUrl = musicResult?.secure_url || "";
      }

      // Retrieve UTM data from session storage
      let utmData: Record<string, string> = {};
      try {
        utmData = JSON.parse(sessionStorage.getItem("p2v_utm") || "{}");
      } catch {
        utmData = {};
      }

      const dbResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: formData.name, email: formData.email, phone: formData.phone },
          uploadedPhotos,
          listing_url: isUrlMode ? listingUrl.trim() : null,
          listing_package_price: isUrlMode && listingPackage ? listingPackage.price : null,
          listing_package_label: isUrlMode && listingPackage ? listingPackage.label : null,
          listing_instructions: isUrlMode ? listingInstructions.trim() : null,
          resolution,
          orientation,
          propertyAddress,
          propertyCity,
          propertyState,
          propertyBedrooms,
          propertyBathrooms,
          musicSelection,
          musicFile: musicFileUrl,
          branding: {
            type: brandingSelection,
            logoUrl: brandingLogoUrl,
            agentName: brandingData.agentName,
            companyName: brandingData.companyName,
            phone: brandingData.phone,
            email: brandingData.email,
            website: brandingData.website,
          },
          voiceover: voiceoverSelection === "voiceover" && !isQuickVideo,
          voiceoverScript: isQuickVideo ? "" : voiceoverScript,
          voiceoverVoice: isQuickVideo ? "" : selectedVoice,
          includeEditedPhotos,
          includeUnbranded: brandingSelection !== "unbranded" && includeUnbranded,
          customIntroCardUrl: brandingData.customIntroCardUrl || null,
          customOutroCardUrl: brandingData.customOutroCardUrl || null,
          includeAddressOnCard,
          totalPrice: getTotalPrice(),
          specialInstructions: formData.notes,
          is_quick_video: isQuickVideo,
          utm_source: utmData.utm_source || null,
          utm_medium: utmData.utm_medium || null,
          utm_campaign: utmData.utm_campaign || null,
        }),
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
          customerDetails: formData,
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
      if (draft.draftId) {
        draft.deleteDraft();
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
    setCurrentStep(1);
    if (mode === "upload") {
      setListingUrl("");
      setListingPackage(null);
      setListingPermission(false);
      setListingInstructions("");
    } else {
      setSequenceConfirmed(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <div className="relative">
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ── Main Column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Draft save bar */}
          <DraftSaveBar
            isLoggedIn={draft.isLoggedIn}
            draftId={draft.draftId}
            draftName={draft.draftName}
            isSaving={draft.isSaving}
            lastSaved={draft.lastSaved}
            hasUnsavedChanges={draft.hasUnsavedChanges}
            onSave={() => draft.saveDraft()}
          />

          {/* Progress bar */}
          <WizardProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={steps}
          />

          {/* ════════════════════════════════════════ */}
          {/* STEP: UPLOAD / LISTING URL              */}
          {/* ════════════════════════════════════════ */}
          {currentStepKey === "upload" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Upload Your Photos</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose how you want to provide your listing photos
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
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

              {/* Orientation Selector */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold">I am making a...</h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOrientation("landscape")}
                    className={`flex-1 p-5 rounded-xl border-2 text-center transition-all ${
                      orientation === "landscape"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-3xl mb-2">📺</div>
                    <div className="font-semibold">Landscape Video</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      16:9 · MLS, Zillow, websites
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation("vertical")}
                    className={`flex-1 p-5 rounded-xl border-2 text-center transition-all ${
                      orientation === "vertical"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-3xl mb-2">📱</div>
                    <div className="font-semibold">Vertical Video</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      9:16 · Reels, TikTok, Shorts
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation("both")}
                    className={`flex-1 p-5 rounded-xl border-2 text-center transition-all ${
                      orientation === "both"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-3xl mb-2">🎬</div>
                    <div className="font-semibold">Both</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Landscape + Vertical
                    </div>
                    <div className="text-sm text-green-600 font-medium mt-1">+ $15</div>
                  </button>
                </div>
              </div>

              {/* Upload Mode */}
              {isUploadMode && (
                <PhotoUploader photos={photos} onPhotosChange={setPhotos} orientation={orientation} onReviewConfirmed={setUploaderReady} initialBedrooms={propertyBedrooms ? parseInt(propertyBedrooms) : undefined} initialBathrooms={propertyBathrooms ? parseInt(propertyBathrooms) : undefined} />
              )}

              {/* ── Subscriber Quick Video Banner ── */}
              {isQuickVideo && (
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-bold text-cyan-800">
                          Quick Video — {photoCount} clips × ${QUICK_VIDEO_RATE} = ${(photoCount * QUICK_VIDEO_RATE).toFixed(2)}
                        </p>
                        <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded-full">LENS SUBSCRIBER</span>
                      </div>
                      <p className="text-sm text-cyan-700 mt-1">
                        Pay only for the clips you need — no minimum package required.
                        {photoCount < 15 && ` Add ${15 - photoCount} more photo${15 - photoCount > 1 ? "s" : ""} for the Standard package ($79 with 1 free revision).`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Standard tier note at exactly 15 photos for subscribers ── */}
              {isSubscriber && isUploadMode && photoCount === 15 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-green-800">
                    <strong>Standard Package — $79</strong> (with your 10% subscriber discount at checkout).
                    Includes 1 free revision and voiceover option.
                  </p>
                </div>
              )}

              {/* ── Minimum photo warning for subscribers with 1-4 photos ── */}
              {isSubscriber && isUploadMode && photoCount > 0 && photoCount < QUICK_VIDEO_MIN && (
                <p className="text-sm text-amber-600 mt-2">
                  Minimum {QUICK_VIDEO_MIN} photos required for Quick Video. Upload {QUICK_VIDEO_MIN - photoCount} more.
                </p>
              )}

              {/* URL Mode */}
              {isUrlMode && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="listing-url" className="font-semibold">
                      Paste Your Listing URL
                    </Label>
                    <Input
                      id="listing-url"
                      type="url"
                      placeholder="https://www.zillow.com/homedetails/your-listing..."
                      value={listingUrl}
                      onChange={(e) => setListingUrl(e.target.value)}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll visit your listing page and download the photos on your behalf.
                    </p>
                  </div>

                  {/* Package Selection */}
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

                  {/* Photo Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="listing-instructions" className="font-semibold">
                      Photo Instructions{" "}
                      <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      id="listing-instructions"
                      placeholder="e.g. Don't use basement photos, only include the master bathroom, skip the backyard..."
                      value={listingInstructions}
                      onChange={(e) => setListingInstructions(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Permission Checkbox */}
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
                        onCheckedChange={(checked) => setListingPermission(checked === true)}
                        className="h-8 w-8 mt-0.5 bg-white border-3 border-gray-500"
                      />
                      <label
                        htmlFor="listing-permission"
                        className="text-sm font-medium cursor-pointer leading-snug"
                      >
                        I give permission to select and sequence the photos from my listing as they
                        see fit to create the best possible video.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation messages */}
              <div className="space-y-1">
                {isUploadMode && photos.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Upload at least one photo to continue
                  </p>
                )}
                {isUrlMode && !listingUrl.trim() && (
                  <p className="text-xs text-red-500 italic">* Please paste your listing URL</p>
                )}
                {isUrlMode && !listingPackage && (
                  <p className="text-xs text-red-500 italic">* Please select a package</p>
                )}
                {isUrlMode && !listingPermission && (
                  <p className="text-xs text-red-500 italic">
                    * Please confirm the permission checkbox
                  </p>
                )}
              </div>

              {/* Upload mode: only show Continue when uploader signals ready */}
              {isUploadMode && uploaderReady && (
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
              {/* URL mode: always show navigation */}
              {isUrlMode && (
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

          {/* ════════════════════════════════════════ */}
          {/* STEP: SEQUENCE (upload mode only)        */}
          {/* ════════════════════════════════════════ */}
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

              {/* Photo sequence tips */}
              <div className="bg-muted/50 rounded-xl border border-border p-5 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  🏠 Order your photos like a real home tour:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">1.</span> Best exterior shot (hero)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">2.</span> Front door / entryway
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">3.</span> Living room / main spaces
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">4.</span> Kitchen / dining
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">5.</span> Remaining rooms in order
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">6.</span> Backyard / outdoor
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">7.</span> Best photo last (strong closer)
                  </p>
                </div>
              </div>

              {/* Photo grid with drag-and-drop reorder */}
              <p className="text-sm text-muted-foreground">Drag photos to reorder, or use the arrows on hover.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={() => setSeqDraggedIndex(index)}
                    onDragOver={(e) => { e.preventDefault(); setSeqDragOverIndex(index); }}
                    onDragEnd={() => { setSeqDraggedIndex(null); setSeqDragOverIndex(null); }}
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
                      <img
                        src={photo.preview}
                        alt={photo.description || `Photo ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                    {/* Drag handle + number badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <div className="bg-black/60 text-white rounded p-0.5">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold shadow-md">
                        {index + 1}
                      </div>
                    </div>
                    {/* Reorder buttons */}
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
                    {/* Label */}
                    {photo.description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                        <p className="text-white text-xs truncate">{photo.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sequence confirmation */}
              <div
                className={`rounded-2xl border-2 p-5 transition-colors ${
                  sequenceConfirmed
                    ? "bg-green-50/50 border-green-500"
                    : "bg-red-50/50 border-red-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="confirm-sequence"
                    checked={sequenceConfirmed}
                    onCheckedChange={(checked) => setSequenceConfirmed(checked === true)}
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

          {/* ════════════════════════════════════════ */}
          {/* STEP: MUSIC                              */}
          {/* ════════════════════════════════════════ */}
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

          {/* ════════════════════════════════════════ */}
          {/* STEP: BRANDING                           */}
          {/* ════════════════════════════════════════ */}
          {currentStepKey === "branding" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
              <BrandingSelector
                selected={brandingSelection}
                onSelect={setBrandingSelection}
                brandingData={brandingData}
                onBrandingDataChange={setBrandingData}
                propertyCity={propertyCity}
                propertyState={propertyState}
                propertyBedrooms={propertyBedrooms}
                propertyBathrooms={propertyBathrooms}
                propertyAddress={propertyAddress}
                includeAddressOnCard={includeAddressOnCard}
                onIncludeAddressChange={setIncludeAddressOnCard}
                includeUnbranded={includeUnbranded}
                onIncludeUnbrandedChange={setIncludeUnbranded}
              />

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

          {/* ════════════════════════════════════════ */}
          {/* STEP: EXTRAS                             */}
          {/* ════════════════════════════════════════ */}
          {currentStepKey === "extras" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Extras</h2>
                  <p className="text-sm text-muted-foreground">
                    Enhance your video with these optional upgrades
                  </p>
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

              {/* Voiceover — hidden for Quick Videos */}
              {!isQuickVideo ? (
                <div className="border-t border-border pt-8">
                  <VoiceoverSelector
                    selected={voiceoverSelection}
                    onSelect={setVoiceoverSelection}
                    script={voiceoverScript}
                    onScriptChange={setVoiceoverScript}
                    selectedVoice={selectedVoice}
                    onVoiceSelect={setSelectedVoice}
                  />
                </div>
              ) : (
                <div className="border-t border-border pt-8">
                  <div className="bg-muted/50 rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Voiceover</strong> is available on Standard ($79) and above orders.
                    </p>
                  </div>
                </div>
              )}

              {/* Photo Editing */}
              <div className="border-t border-border pt-8">
                <div className="flex items-center justify-between p-5 bg-muted/80 rounded-xl">
                  <div className="pr-4">
                    <p className="font-bold text-base">
                      Include Edited Photos{" "}
                      {includeEditedPhotos && photos.length > 0
                        ? `(+$${(photos.length * 2.99).toFixed(2)})`
                        : "(+$2.99/photo)"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Professional auto-correction: brightness, contrast, white balance, horizon
                      straightening.
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

          {/* ════════════════════════════════════════ */}
          {/* STEP: REVIEW & PAY                       */}
          {/* ════════════════════════════════════════ */}
          {currentStepKey === "review" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Review &amp; Pay</h2>
                  <p className="text-sm text-muted-foreground">
                    Fill in your details and complete your order
                  </p>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Property Details</h3>
                <p className="text-xs text-muted-foreground">
                  *Used for order processing and video branding
                </p>
                <Input
                  placeholder="Property Address (e.g. 123 Main Street)"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="h-11"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="City"
                    value={propertyCity}
                    onChange={(e) => setPropertyCity(e.target.value)}
                  />
                  <Input
                    placeholder="State"
                    value={propertyState}
                    onChange={(e) => setPropertyState(e.target.value)}
                  />
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
              </div>

              {/* Contact Details */}
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-lg font-bold">Your Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone (Optional)</Label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 000-0000"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Special Instructions (Optional)</Label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any specific requests here..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Photo Permission */}
              <div
                className={`rounded-2xl border-2 p-5 transition-colors ${
                  photoPermission
                    ? "bg-green-50/50 border-green-500"
                    : "bg-red-50/50 border-red-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="photo-permission"
                    checked={photoPermission}
                    onCheckedChange={(checked) => setPhotoPermission(checked === true)}
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

              {/* Terms & Privacy */}
              <p className="text-xs text-muted-foreground text-center mt-3">
                By placing this order, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>.
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

        {/* ── Sidebar: Order Summary (desktop) ── */}
        <div className="hidden lg:block lg:col-span-1">
          <OrderSummary
            photoCount={isUrlMode && listingPackage ? listingPackage.photoCount : photoCount}
            brandingOption={brandingSelection}
            voiceoverOption={isQuickVideo ? "none" : voiceoverSelection}
            includeEditedPhotos={includeEditedPhotos}
            resolution={resolution}
            orientation={orientation}
            isUrlMode={isUrlMode}
            isQuickVideo={isQuickVideo}
          />
        </div>
      </div>

      {/* ── Mobile Bottom Bar: Order Summary ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 lg:hidden z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="w-full flex items-center justify-between"
        >
          <span className="text-sm font-semibold text-foreground">Order Total</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-foreground">
              ${getTotalPrice().toFixed(2)}
            </span>
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
              brandingOption={brandingSelection}
              voiceoverOption={isQuickVideo ? "none" : voiceoverSelection}
              includeEditedPhotos={includeEditedPhotos}
              resolution={resolution}
              orientation={orientation}
              isUrlMode={isUrlMode}
              isQuickVideo={isQuickVideo}
            />
          </div>
        )}
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
