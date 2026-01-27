"use client";

import React from "react";
import StripePayment from "@/components/stripe-payment"; // Import StripePayment component
import { GripVertical } from "lucide-react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhotoUploader, type PhotoItem } from "@/components/photo-uploader";
import { MusicSelector } from "@/components/music-selector";
import { BrandingSelector, type BrandingData } from "@/components/branding-selector";
import { VoiceoverSelector } from "@/components/voiceover-selector";
import { OrderSummary } from "@/components/order-summary";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, User, Mail, Phone, Loader2 } from "lucide-react";

type OrderStep = "upload" | "details" | "payment";

export function OrderForm() {
  const [step, setStep] = useState<OrderStep>("upload");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [musicSelection, setMusicSelection] = useState("");
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [brandingSelection, setBrandingSelection] = useState("unbranded");
  const [brandingData, setBrandingData] = useState<BrandingData>({ type: "unbranded" });
  const [voiceoverSelection, setVoiceoverSelection] = useState("none");
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [includeEditedPhotos, setIncludeEditedPhotos] = useState(false);
  const [sequenceConfirmed, setSequenceConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const photoCount = photos.length;
  const canProceed = photoCount > 0 && photoCount <= 35 && sequenceConfirmed && musicSelection;

  const getBasePrice = () => {
    if (photoCount === 1) return 1;
    if (photoCount <= 12) return 99;
    if (photoCount <= 25) return 149;
    if (photoCount <= 35) return 199;
    return 0;
  };

  const getBrandingPrice = () => {
    return brandingSelection === "custom" ? 25 : 0;
  };

  const getVoiceoverPrice = () => {
    return voiceoverSelection === "voiceover" ? 25 : 0;
  };

  const getEditedPhotosPrice = () => {
    return includeEditedPhotos ? 15 : 0;
  };

  const getTotalPrice = () => {
    return getBasePrice() + getBrandingPrice() + getVoiceoverPrice() + getEditedPhotosPrice();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinueToDetails = () => {
    if (canProceed) {
      setStep("details");
    }
  };

  // Upload a single file directly to Cloudinary using signed upload
  const uploadToCloudinary = async (file: Blob, folder: string): Promise<{
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  } | null> => {
    try {
      // Get signature from our API
      const sigResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `photo2video/${folder}` }),
      });
      
      const sigData = await sigResponse.json();
      if (!sigData.success) {
        throw new Error(sigData.error || "Failed to get upload signature");
      }

      const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;

      // Upload directly to Cloudinary with signature
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folderPath);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary upload failed:", errorText);
        return null;
      }

      const result = await response.json();
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width || 0,
        height: result.height || 0,
      };
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleContinueToPayment = async () => {
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    console.log("[v0] Starting order submission...");

    try {
      // Upload photos directly to Cloudinary from the client
      console.log("[v0] Uploading", photos.length, "photos to Cloudinary...");
      const uploadedPhotos: Array<{
        public_id: string;
        secure_url: string;
        width: number;
        height: number;
        order: number;
      }> = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        console.log(`[v0] Uploading photo ${i + 1}/${photos.length}...`);
        
        // Get the file blob
        let blob: Blob;
        if (photo.file) {
          blob = photo.file;
        } else {
          const response = await fetch(photo.preview);
          blob = await response.blob();
        }

        // Upload directly to Cloudinary
        const result = await uploadToCloudinary(blob, "orders");
        
        if (result) {
          uploadedPhotos.push({
            ...result,
            order: i,
          });
        }
      }

      console.log(`[v0] Successfully uploaded ${uploadedPhotos.length} photos`);

      if (uploadedPhotos.length === 0) {
        throw new Error("Failed to upload photos. Please check your internet connection and try again.");
      }

      // Upload custom audio if present
      let customAudioUrl: string | undefined;
      let customAudioFilename: string | undefined;
      if (customAudioFile) {
        console.log("[v0] Uploading custom audio...");
        const audioResult = await uploadToCloudinary(customAudioFile, "audio");
        if (audioResult) {
          customAudioUrl = audioResult.secure_url;
          customAudioFilename = customAudioFile.name;
        }
      }

      // Upload branding logo if present
      let brandingLogoUrl: string | undefined;
      if (brandingData.logoFile) {
        console.log("[v0] Uploading branding logo...");
        const logoResult = await uploadToCloudinary(brandingData.logoFile, "logos");
        if (logoResult) {
          brandingLogoUrl = logoResult.secure_url;
        }
      }

      // Create order in database with already-uploaded photos
      console.log("[v0] Creating order in database...");
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          uploadedPhotos,
          musicSelection,
          customAudioUrl,
          customAudioFilename,
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
  voiceoverScript: voiceoverSelection === "voiceover" ? voiceoverScript : undefined,
  includeEditedPhotos,
  specialInstructions: formData.notes,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      setOrderId(orderData.data.orderId);
      setStep("payment");
    } catch (error) {
      console.error("[v0] Error creating order:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create order";
      alert(errorMessage + ". Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "details") setStep("upload");
    if (step === "payment") setStep("details");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Step 1: Upload Photos */}
        {step === "upload" && (
          <>
            {/* Step 1: Upload */}
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Upload Your Photos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select the photos for your walkthrough video
                  </p>
                </div>
              </div>

              <PhotoUploader photos={photos} onPhotosChange={setPhotos} />
            </div>

            {/* Step 2: Confirm Sequence (shows when photos are uploaded) */}
            {photos.length > 0 && (
              <div className={`rounded-2xl border-2 p-4 sm:p-6 md:p-8 transition-colors ${
                sequenceConfirmed 
                  ? "bg-green-50 border-green-500 dark:bg-green-950/30 dark:border-green-600" 
                  : "bg-amber-50 border-amber-400 dark:bg-amber-950/30 dark:border-amber-500"
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                    sequenceConfirmed 
                      ? "bg-green-500 text-white" 
                      : "bg-amber-500 text-white"
                  }`}>
                    2
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      Confirm Photo Sequence
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Drag photos above to reorder, then confirm below
                    </p>
                  </div>
                </div>
                <label
                  htmlFor="sequence-confirmed"
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
                    sequenceConfirmed 
                      ? "bg-green-100 dark:bg-green-900/40" 
                      : "bg-amber-100 dark:bg-amber-900/40"
                  }`}
                >
                  <Checkbox
                    id="sequence-confirmed"
                    checked={sequenceConfirmed}
                    onCheckedChange={(checked) => setSequenceConfirmed(checked === true)}
                    className={`mt-1 h-6 w-6 border-2 ${
                      sequenceConfirmed 
                        ? "border-green-600 data-[state=checked]:bg-green-600" 
                        : "border-amber-600"
                    }`}
                  />
                  <span className={`text-base font-medium leading-relaxed ${
                    sequenceConfirmed ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-200"
                  }`}>
                    I confirm that I have uploaded all photos and arranged them in the desired sequence/order for my video.
                  </span>
                </label>
              </div>
            )}

            {/* Options Section */}
            {photos.length > 0 && photos.length <= 35 && (
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 md:p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      Customize Your Video
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Select music, branding, and voiceover options
                    </p>
                  </div>
                </div>

                <MusicSelector
                  selected={musicSelection}
                  onSelect={setMusicSelection}
                  customAudioFile={customAudioFile}
                  onCustomAudioChange={setCustomAudioFile}
                />

                {musicSelection && (
                  <>
                    <div className="border-t border-border pt-6">
<BrandingSelector
  selected={brandingSelection}
  onSelect={setBrandingSelection}
  brandingData={brandingData}
  onBrandingDataChange={setBrandingData}
  />
                    </div>

                    <div className="border-t border-border pt-6">
<VoiceoverSelector
  selected={voiceoverSelection}
  onSelect={setVoiceoverSelection}
  script={voiceoverScript}
  onScriptChange={setVoiceoverScript}
  />
                    </div>

                    {/* Include Edited Photos Option */}
                    <div className="border-t border-border pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-foreground">
                            Include Edited Photos
                          </h3>
                          <span className="text-sm font-medium text-primary">+$15</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Receive professionally enhanced versions of all your photos along with your video.
                        </p>
                        <label
                          htmlFor="include-edited-photos"
                          className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors border-2 ${
                            includeEditedPhotos 
                              ? "bg-primary/10 border-primary" 
                              : "bg-muted/30 border-transparent hover:border-border"
                          }`}
                        >
                          <Checkbox
                            id="include-edited-photos"
                            checked={includeEditedPhotos}
                            onCheckedChange={(checked) => setIncludeEditedPhotos(checked === true)}
                            className="h-5 w-5"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-foreground">
                              Yes, include edited photos with my order
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {canProceed && (
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
                <Button
                  onClick={handleContinueToDetails}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-lg"
                >
                  Continue to Details
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Contact Details */}
        {step === "details" && (
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Your Details
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number (optional)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Instructions (optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special requests or notes about your video..."
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 py-6 bg-transparent"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinueToPayment}
                  disabled={!formData.name || !formData.email || isSubmitting}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading Photos...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && (
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Payment
              </h2>
            </div>

            <StripePayment
              amount={getTotalPrice()}
              customerName={formData.name}
              customerEmail={formData.email}
              photoCount={photoCount}
              orderId={orderId}
              onBack={handleBack}
            />
          </div>
        )}
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <OrderSummary
          photoCount={photoCount}
          brandingOption={brandingSelection}
          voiceoverOption={voiceoverSelection}
          includeEditedPhotos={includeEditedPhotos}
        />
      </div>
    </div>
  );
}
