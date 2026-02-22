"use client";

import React, { useState } from "react";
import Script from "next/script";
import { PhotoUploader, type PhotoItem } from "@/components/photo-uploader";
// ... other imports remain the same

export function OrderForm() {
  const [step, setStep] = useState<OrderStep>("upload");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  
  // NEW URL STATES
  const [useUrl, setUseUrl] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlPackage, setUrlPackage] = useState("15"); // Default to 15
  const [urlPermission, setUrlPermission] = useState(false);

  const [musicSelection, setMusicSelection] = useState("");
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [brandingSelection, setBrandingSelection] = useState("unbranded");
  const [brandingData, setBrandingData] = useState<BrandingData>({ type: "unbranded" });
  const [voiceoverSelection, setVoiceoverSelection] = useState("none");
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [includeEditedPhotos, setIncludeEditedPhotos] = useState(false);
  const [sequenceConfirmed, setSequenceConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });

  // UPDATED VALIDATION LOGIC
  const isUrlModeValid = useUrl && urlValue.length > 5 && urlPermission;
  const isUploadModeValid = !useUrl && photos.length > 0 && photos.length <= 35 && sequenceConfirmed;
  
  const canProceed = (isUrlModeValid || isUploadModeValid) && musicSelection !== "";

  // UPDATED PRICE CALCULATION
  const getBasePrice = () => {
    if (useUrl) {
      if (urlPackage === "15") return 79;
      if (urlPackage === "25") return 129;
      if (urlPackage === "35") return 179;
    } else {
      const count = photos.length;
      if (count === 0) return 0;
      if (count === 1) return 1; // Your test price
      if (count <= 15) return 79;
      if (count <= 25) return 129;
      if (count <= 35) return 179;
    }
    return 0;
  };

  const getVoiceoverPrice = () => voiceoverSelection === "voiceover" ? 25 : 0;
  const getEditedPhotosPrice = () => includeEditedPhotos ? 15 : 0;
  const getTotalPrice = () => getBasePrice() + getVoiceoverPrice() + getEditedPhotosPrice();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // UPDATED SUBMISSION LOGIC
  const handleSubmitOrder = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in your name and email.");
      return;
    }
    setIsSubmitting(true);
    try {
      let uploadedPhotos = [];
      
      // Only upload photos if NOT using URL
      if (!useUrl) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const blob = photo.file || await (await fetch(photo.preview)).blob();
          const result = await uploadToCloudinary(blob, "orders");
          if (result) {
            uploadedPhotos.push({
              public_id: result.public_id,
              secure_url: result.secure_url,
              order: i,
              description: photo.description || "",
            });
          }
        }
      }

      // ... existing branding/music upload logic ...

      const dbResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: formData.name, email: formData.email, phone: formData.phone },
          uploadedPhotos, // Will be empty if useUrl is true
          listingUrl: useUrl ? urlValue : null,
          photoPackage: useUrl ? urlPackage : photos.length,
          musicSelection,
          // ... rest of your payload ...
        }),
      });
      
      // ... rest of checkout logic ...
    } catch (error: any) {
      alert("Error processing order: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
      {/* ... Script tag ... */}

      <div className="lg:col-span-2 space-y-6">
        {step === "upload" && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div id="order-form" className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-bold">
                  {useUrl ? "Provide Listing Details" : "Start by uploading Your Photos"}
                </h2>
              </div>
              
              <PhotoUploader 
                photos={photos} 
                onPhotosChange={setPhotos} 
                useUrl={useUrl}
                onUseUrlChange={setUseUrl}
                urlValue={urlValue}
                onUrlValueChange={setUrlValue}
                urlPackage={urlPackage}
                onUrlPackageChange={setUrlPackage}
                urlPermission={urlPermission}
                onUrlPermissionChange={setUrlPermission}
              />
            </div>

            {/* Sequence Confirmation: Only show if NOT using URL and photos are uploaded */}
            {!useUrl && photos.length > 0 && (
              <div className={`rounded-2xl border-2 p-6 transition-colors ${sequenceConfirmed ? "bg-green-50/50 border-green-500" : "bg-red-50/50 border-red-400"}`}>
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="confirm"
                    checked={sequenceConfirmed}
                    onCheckedChange={(checked) => setSequenceConfirmed(checked === true)}
                    className="h-6 w-6 bg-white"
                  />
                  <label htmlFor="confirm" className="font-medium cursor-pointer">
                    I confirm these photos are in the correct sequence for my video.
                  </label>
                </div>
              </div>
            )}

            {/* Step 2 triggers if either mode is valid */}
           {(isUrlModeValid || isUploadModeValid) && (
  <div className="bg-card rounded-2xl border border-border p-6 space-y-8">
    <MusicSelector 
      value={musicSelection} 
      onValueChange={setMusicSelection} 
    />
    
    <div className="border-t pt-6">
      <BrandingSelector 
        value={brandingSelection} 
        onValueChange={setBrandingSelection} 
      />
    </div>

    <div className="border-t pt-6">
      <VoiceoverSelector 
        value={voiceoverSelection} 
        onValueChange={setVoiceoverSelection} 
      />
    </div>

    <div className="border-t pt-6">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="editedPhotos" 
          checked={includeEditedPhotos}
          onCheckedChange={(checked) => setIncludeEditedPhotos(!!checked)}
        />
        <label htmlFor="editedPhotos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Include Edited Photos Package (+$15)
        </label>
      </div>
    </div>
  </div>
)}
                <div className="border-t pt-6 flex items-center justify-between p-4 bg-muted/80 rounded-xl">
                    {/* Edited Photos Toggle */}
                </div>

                <div className="flex flex-col gap-2">
                  {!musicSelection && <p className="text-xs text-red-500 italic text-right">* Please select a music</p>}
                  <Button onClick={() => setStep("details")} disabled={!canProceed} className="w-full py-6 text-lg bg-accent">
                    Continue to Details <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ... step === "details" stays largely the same ... */}
      </div>
      <div className="lg:col-span-1">
        <OrderSummary 
          photoCount={useUrl ? parseInt(urlPackage) : photos.length} 
          brandingOption={brandingSelection} 
          voiceoverOption={voiceoverSelection} 
          includeEditedPhotos={includeEditedPhotos} 
        />
      </div>
    </div>
  );
}
