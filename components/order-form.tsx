"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { PhotoUploader, type PhotoItem } from "@/components/photo-uploader";
import { MusicSelector } from "@/components/music-selector";
import { BrandingSelector, type BrandingData } from "@/components/branding-selector";
import { VoiceoverSelector } from "@/components/voiceover-selector";
import { OrderSummary } from "@/components/order-summary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Upload, Link, User, Mail, Phone, Loader2, ChevronLeft } from "lucide-react";
import { useOrderDraft } from "@/hooks/use-order-draft";
import { DraftSaveBar } from "@/components/draft-save-bar";

type OrderStep = "upload" | "details" | "payment";
type PhotoInputMode = "upload" | "url";

interface ListingPackage {
  label: string;
  photoCount: number;
  price: number;
}

const LISTING_PACKAGES: ListingPackage[] = [
  { label: "Up to 15 Photos", photoCount: 15, price: 79 },
  { label: "Up to 25 Photos", photoCount: 25, price: 129 },
  { label: "Up to 35 Photos", photoCount: 35, price: 179 },
];

export function OrderForm() {
  const [step, setStep] = useState<OrderStep>("upload");
  const [photoInputMode, setPhotoInputMode] = useState<PhotoInputMode>("upload");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [listingUrl, setListingUrl] = useState("");
  const [listingPackage, setListingPackage] = useState<ListingPackage | null>(null);
  const [listingPermission, setListingPermission] = useState(false);
  const [listingInstructions, setListingInstructions] = useState("");
  const [musicSelection, setMusicSelection] = useState("");
  const [resolution, setResolution] = useState<'768P' | '1080P'>('768P');
  const [orientation, setOrientation] = useState<'landscape' | 'vertical' | 'both'>('landscape');
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [brandingSelection, setBrandingSelection] = useState("unbranded");
  const [brandingData, setBrandingData] = useState<BrandingData>({ type: "unbranded" });
  const [voiceoverSelection, setVoiceoverSelection] = useState("none");
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [includeEditedPhotos, setIncludeEditedPhotos] = useState(false);
  const [sequenceConfirmed, setSequenceConfirmed] = useState(false);
  const [photoPermission, setPhotoPermission] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [brokerageInfo, setBrokerageInfo] = useState<{
    isBrokerage: boolean;
    brokerage?: { id: string; company: string; tier: string; perClipRate: number };
  }>({ isBrokerage: false });

  useEffect(() => {
    const checkBrokerage = async () => {
      try {
        const res = await fetch("/api/brokerage/status");
        const data = await res.json();
        if (data.isBrokerage) setBrokerageInfo(data);
      } catch {}
    };
    checkBrokerage();
  }, []);

  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyBedrooms, setPropertyBedrooms] = useState("");
  const [propertyBathrooms, setPropertyBathrooms] = useState("");
  const [includeAddressOnCard, setIncludeAddressOnCard] = useState(true);

  // ── Draft save/load ──
  const draft = useOrderDraft({
    getFormData: () => ({
      photoInputMode,
      savedPhotos: photos.map(p => ({
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
            uploadStatus: 'complete' as const,
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
    },
  });

  // Mark draft as changed when any form value changes
  useEffect(() => {
    draft.markChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photoInputMode, listingUrl, listingPackage, listingInstructions,
    musicSelection, resolution, orientation, brandingSelection,
    voiceoverSelection, voiceoverScript, selectedVoice,
    includeEditedPhotos, propertyAddress, propertyCity, propertyState,
    propertyBedrooms, propertyBathrooms, includeAddressOnCard,
    photos.length, formData.name, formData.email,
  ]);

  const photoCount = photos.length;

  const isUrlMode = photoInputMode === "url";
  const isUploadMode = photoInputMode === "upload";

  const allUploadsComplete = photos.length > 0 && photos.every(p => p.uploadStatus === 'complete');
  const canProceedUpload = allUploadsComplete && photoCount <= 35 && sequenceConfirmed && musicSelection;
  const canProceedUrl = listingUrl.trim() !== "" && listingPackage !== null && listingPermission && musicSelection !== "";
  const canProceed = isUploadMode ? canProceedUpload : canProceedUrl;

  const getBasePrice = () => {
    if (isUrlMode && listingPackage) return listingPackage.price;
    if (photoCount === 1) return 1;
    if (photoCount <= 15) return 79;
    if (photoCount <= 25) return 129;
    if (photoCount <= 35) return 179;
    return 0;
  };

  const getBrandingPrice = () => 0;
  const getVoiceoverPrice = () => voiceoverSelection === "voiceover" ? 25 : 0;
  const getEditedPhotosPrice = () => includeEditedPhotos ? photos.length * 2.99 : 0;
  const getResolutionPrice = () => resolution === '1080P' ? 10 : 0;
  const getOrientationPrice = () => orientation === 'both' ? 15 : 0;
  const getUrlServicePrice = () => isUrlMode ? 25 : 0;
  const getTotalPrice = () => getBasePrice() + getBrandingPrice() + getVoiceoverPrice() + getEditedPhotosPrice() + getResolutionPrice() + getOrientationPrice() + getUrlServicePrice();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
          voiceover: voiceoverSelection === "voiceover",
          voiceoverScript,
          voiceoverVoice: selectedVoice,
          includeEditedPhotos,
          includeAddressOnCard,
          totalPrice: getTotalPrice(),
          specialInstructions: formData.notes,
        }),
      });

      const dbResult = await dbResponse.json();
      if (!dbResult.success) throw new Error(dbResult.error || "Failed to save to database");

      const createdOrderId = dbResult.data.orderId;

      const checkoutBody: any = {
        items: [
          {
            name: isUrlMode && listingPackage
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
      };

      // Brokerage bypass — skip Stripe
      if (brokerageInfo.isBrokerage && brokerageInfo.brokerage) {
        checkoutBody.brokerageId = brokerageInfo.brokerage.id;
      }

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutBody),
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
    if (mode === "upload") {
      setListingUrl("");
      setListingPackage(null);
      setListingPermission(false);
      setListingInstructions("");
    } else {
      setSequenceConfirmed(false);
    }
  };

  const showCustomizationOptions =
    (isUploadMode && photos.length > 0) || isUrlMode;

  return (
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4VFMMPJDBN"
        strategy="afterInteractive"
      />

      <div className="lg:col-span-2 space-y-6">
        {step === "upload" && (
          <div className="space-y-6">
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

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div id="order-form" className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-bold">Start by Uploading Your Photos</h2>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => handleModeSwitch("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-md transition-all ${
                    isUploadMode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload My Photos
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("url")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-md transition-all ${
                    isUrlMode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span>🔗 Use My Listing Link</span> <span className="text-green-600 font-medium">(+$25)</span>
                </button>
              </div>

              {/* Video Format Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold">I am making a...</h3>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setOrientation('landscape')}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                      orientation === 'landscape' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}>
                    <div className="text-2xl mb-1">📺</div>
                    <div className="font-semibold">Landscape Video</div>
                    <div className="text-xs text-muted-foreground mt-1">16:9 · MLS, Zillow, websites</div>
                  </button>
                  <button type="button" onClick={() => setOrientation('vertical')}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                      orientation === 'vertical' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}>
                    <div className="text-2xl mb-1">📱</div>
                    <div className="font-semibold">Vertical Video</div>
                    <div className="text-xs text-muted-foreground mt-1">9:16 · Reels, TikTok, Shorts</div>
                  </button>
                  <button type="button" onClick={() => setOrientation('both')}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                      orientation === 'both' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}>
                    <div className="text-2xl mb-1">🎬</div>
                    <div className="font-semibold">Both</div>
                    <div className="text-xs text-muted-foreground mt-1">Landscape + Vertical</div>
                    <div className="text-sm text-green-600 font-medium mt-1">+ $15</div>
                  </button>
                </div>
                <div className="pb-2" />
              </div>

              {/* Upload Mode */}
              {isUploadMode && (
                <PhotoUploader photos={photos} onPhotosChange={setPhotos} orientation={orientation} />
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
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll visit your listing page and download the photos on your behalf.
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
                          className={`flex flex-col items-center justify-center gap-1 py-4 px-2 rounded-xl border-2 font-semibold text-md transition-all ${
                            listingPackage?.photoCount === pkg.photoCount
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <span className="text-xl font-black text-foreground">
                            ${pkg.price}
                          </span>
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
                      Photo Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
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
                  <div className={`rounded-xl border-2 p-4 transition-colors ${
                    listingPermission
                      ? "bg-green-50/50 border-green-500"
                      : "bg-red-50/50 border-red-400"
                  }`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="listing-permission"
                        checked={listingPermission}
                        onCheckedChange={(checked) => setListingPermission(checked === true)}
                        className="h-8 w-8 mt-0.5 bg-white border-3 border-gray-500"
                      />
                      <label htmlFor="listing-permission" className="text-sm font-medium cursor-pointer leading-snug">
                        I give permission to select and sequence the photos from my listing as they see fit to create the best possible video.
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sequence confirmation — only in upload mode */}
            {isUploadMode && photos.length > 0 && (
              <div className={`rounded-2xl border-3 border-gray-500 p-6 transition-colors ${
                sequenceConfirmed ? "bg-green-50/50 border-green-500" : "bg-red-50/50 border-red-400"
              }`}>
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="confirm"
                    checked={sequenceConfirmed}
                    onCheckedChange={(checked) => setSequenceConfirmed(checked === true)}
                    className="h-8 w-8 bg-white"
                  />
                  <label htmlFor="confirm" className="font-medium cursor-pointer">
                    I confirm these photos & camera movements are in the correct sequence for my video.
                  </label>
                </div>
              </div>
            )}

            {/* Customization options */}
            {showCustomizationOptions && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-8">

                {/* Property Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Property Details</h3>
                  <p className="text-xs text-muted-foreground">*Used for order processing and video branding</p>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      placeholder="Property Address (e.g. 123 Main Street)"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                    />
                  </div>
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

                <div className="border-t pt-6 flex items-center justify-between p-4 bg-muted/80 rounded-xl">
                  <div className="pr-4">
                    <p className="font-bold">
                      Include Edited Photos {includeEditedPhotos && photos.length > 0 ? `(+$${(photos.length * 2.99).toFixed(2)})` : '(+$2.99/photo)'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Professional auto-correction: brightness, contrast, white balance, horizon straightening.
                    </p>
                  </div>
                  <Switch
                    checked={includeEditedPhotos}
                    onCheckedChange={setIncludeEditedPhotos}
                    className="scale-150 mr-2 data-[state=checked]:bg-primary border-1 border-slate-400"
                  />
                </div>

                {/* Resolution Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Video Resolution</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setResolution('768P')}
                      className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                        resolution === '768P'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="font-semibold">768P HD</div>
                      <div className="text-sm text-muted-foreground">Included</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolution('1080P')}
                      className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                        resolution === '1080P'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="font-semibold">1080P FULL HD</div>
                      <div className="text-sm text-green-600 font-medium">+ $10</div>
                    </button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <MusicSelector
                    selected={musicSelection}
                    onSelect={setMusicSelection}
                    customAudioFile={customAudioFile}
                    onCustomAudioChange={setCustomAudioFile}
                    photoCount={photos.length}
                  />
                </div>
                <div className="border-t pt-6">
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
                  />
                </div>
                <div className="border-t pt-6">
                  <VoiceoverSelector
                    selected={voiceoverSelection}
                    onSelect={setVoiceoverSelection}
                    script={voiceoverScript}
                    onScriptChange={setVoiceoverScript}
                    selectedVoice={selectedVoice}
                    onVoiceSelect={setSelectedVoice}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  {!musicSelection && (
                    <p className="text-xs text-red-500 italic text-right">* Please select a music track</p>
                  )}
                  {isUrlMode && !listingUrl.trim() && (
                    <p className="text-xs text-red-500 italic text-right">* Please paste your listing URL</p>
                  )}
                  {isUrlMode && !listingPackage && (
                    <p className="text-xs text-red-500 italic text-right">* Please select a package</p>
                  )}
                  {isUrlMode && !listingPermission && (
                    <p className="text-xs text-red-500 italic text-right">* Please confirm the permission checkbox</p>
                  )}

                  <Button
                    onClick={() => setStep("details")}
                    disabled={!canProceed}
                    className="w-full py-6 text-lg bg-accent"
                  >
                    Continue to Details <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <Button variant="ghost" onClick={() => setStep("upload")} className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Customization
            </Button>
            <h2 className="text-2xl font-bold">Your Details</h2>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone (Optional)</Label>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Special Instructions</Label>
                <Textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Add any specific requests here..." />
              </div>
            </div>

            {/* Photo Permission */}
            <div className={`rounded-2xl border-2 p-4 transition-colors ${
              photoPermission ? "bg-green-50/50 border-green-500" : "bg-red-50/50 border-red-400"
            }`}>
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

            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !formData.name || !formData.email || !photoPermission}
              className="w-full py-6 text-lg bg-accent"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 animate-spin" /> Processing Order...</>
              ) : (
                <>{brokerageInfo.isBrokerage ? "Submit Brokerage Order" : "Pay & Complete Order"} <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <OrderSummary
          photoCount={isUrlMode && listingPackage ? listingPackage.photoCount : photoCount}
          brandingOption={brandingSelection}
          voiceoverOption={voiceoverSelection}
          includeEditedPhotos={includeEditedPhotos}
          resolution={resolution}
          orientation={orientation}
          isUrlMode={isUrlMode}
        />
      </div>
    </div>
  );
}
