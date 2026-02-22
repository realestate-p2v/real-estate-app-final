"use client";

import React, { useState } from "react";
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
import { ArrowRight, Loader2, ChevronLeft } from "lucide-react";

type OrderStep = "upload" | "details";

export function OrderForm() {
  const [step, setStep] = useState<OrderStep>("upload");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  
  // URL STATES
  const [useUrl, setUseUrl] = useState(false);
  const [listingUrl, setListingUrl] = useState("");
  const [urlInstructions, setUrlInstructions] = useState("");
  const [selectedUrlPackage, setSelectedUrlPackage] = useState(15);
  
  // MUSIC STATES (Fixed: Added customAudioFile state)
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

  // DYNAMIC PHOTO COUNT logic for Saylor 1.0
  const photoCount = useUrl ? selectedUrlPackage : photos.length;
  
  const canProceed = musicSelection && (useUrl ? listingUrl.length > 5 : (photos.length > 0 && sequenceConfirmed));

  const getBasePrice = () => {
    if (photoCount === 1) return 1; // Test mode
    if (photoCount <= 15) return 79;
    if (photoCount <= 25) return 129;
    if (photoCount <= 35) return 179;
    return 179;
  };

  const getTotalPrice = () => getBasePrice() + (voiceoverSelection === "voiceover" ? 25 : 0) + (includeEditedPhotos ? 15 : 0);

  const uploadToCloudinary = async (file: Blob, folder: string) => {
    try {
      const sigResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `photo2video/${folder}` }),
      });
      const sigData = await sigResponse.json();
      const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;
      
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", timestamp.toString());
      uploadData.append("signature", signature);
      uploadData.append("folder", folderPath);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { 
        method: "POST", 
        body: uploadData 
      });
      return await response.json();
    } catch (e) { 
      console.error("Cloudinary error:", e);
      return null; 
    }
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const uploadedPhotos = [];
      let customAudioUrl = null;

      // 1. UPLOAD CUSTOM AUDIO IF SELECTED
      if (musicSelection === "custom" && customAudioFile) {
        const audioResult = await uploadToCloudinary(customAudioFile, "audio");
        if (audioResult) {
          customAudioUrl = audioResult.secure_url;
        }
      }
      
      // 2. UPLOAD PHOTOS
      if (!useUrl) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const blob = photo.file || await (await fetch(photo.preview)).blob();
          const result = await uploadToCloudinary(blob, "orders");
          if (result) uploadedPhotos.push({ 
            public_id: result.public_id, 
            secure_url: result.secure_url, 
            order: i, 
            description: photo.description 
          });
        }
      }

      const finalNotes = useUrl 
        ? `PACKAGE: ${selectedUrlPackage} Photos\nURL: ${listingUrl}\nINSTRUCTIONS: ${urlInstructions}\n---\nNOTES: ${formData.notes}`
        : formData.notes;

      // 3. SEND TO DATABASE (Now including customAudioUrl)
      const dbResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: formData.name, email: formData.email, phone: formData.phone },
          uploadedPhotos,
          photoCount,
          musicSelection: musicSelection === "custom" ? "Custom Upload" : musicSelection,
          customAudioUrl, // Added this field for Supabase
          branding: { type: brandingSelection, ...brandingData },
          voiceover: voiceoverSelection === "voiceover",
          voiceoverScript,
          voiceoverVoice: selectedVoice,
          includeEditedPhotos,
          totalPrice: getTotalPrice(),
          specialInstructions: finalNotes
        }),
      });

      const dbResult = await dbResponse.json();
      if (!dbResult.success) throw new Error(dbResult.error);

      // 4. CHECKOUT
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ name: `${photoCount} Photo Video Package`, amount: getTotalPrice() * 100 }],
          customerDetails: formData,
          orderData: { orderId: dbResult.data.orderId, photoCount },
        }),
      });
      const session = await checkoutResponse.json();
      window.location.href = session.url;
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 py-8">
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-4VFMMPJDBN" strategy="afterInteractive" />
      <div className="lg:col-span-2 space-y-6">
        {step === "upload" && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border p-6">
              <h2 className="text-xl font-bold mb-6">Step 1: Photos</h2>
              
              <PhotoUploader 
                photos={photos} 
                onPhotosChange={setPhotos}
                useUrl={useUrl} 
                onUseUrlChange={setUseUrl}
                url={listingUrl} 
                onUrlChange={setListingUrl}
                urlInstructions={urlInstructions} 
                onUrlInstructionsChange={setUrlInstructions}
                selectedUrlPackage={selectedUrlPackage} 
                onUrlPackageChange={(val) => setSelectedUrlPackage(val)}
              />
            </div>
            
            {(photos.length > 0 || useUrl) && (
              <div className="bg-card rounded-2xl border p-6 space-y-8 animate-in fade-in">
                {!useUrl && (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <Checkbox id="confirm" checked={sequenceConfirmed} onCheckedChange={(c) => setSequenceConfirmed(c === true)} />
                    <label htmlFor="confirm" className="text-sm font-medium">I confirm the photo sequence is correct.</label>
                  </div>
                )}
                
                {/* FIXED: Passing custom audio props to MusicSelector */}
                <MusicSelector 
                  selected={musicSelection} 
                  onSelect={setMusicSelection} 
                  customAudioFile={customAudioFile}
                  onCustomAudioChange={setCustomAudioFile}
                />

                <BrandingSelector selected={brandingSelection} onSelect={setBrandingSelection} brandingData={brandingData} onBrandingDataChange={setBrandingData} />
                <VoiceoverSelector selected={voiceoverSelection} onSelect={setVoiceoverSelection} script={voiceoverScript} onScriptChange={setVoiceoverScript} selectedVoice={selectedVoice} onVoiceSelect={setSelectedVoice} />
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div><p className="font-bold text-sm">Include Edited Photos (+$15)</p></div>
                  <Switch checked={includeEditedPhotos} onCheckedChange={setIncludeEditedPhotos} />
                </div>
                
                <Button onClick={() => setStep("details")} disabled={!canProceed} className="w-full py-6 bg-accent text-white font-bold text-lg">
                  Continue <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="bg-card rounded-2xl border p-8 space-y-6 animate-in slide-in-from-right-4">
            <Button variant="ghost" onClick={() => setStep("upload")} className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Customization
            </Button>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number (Optional)</Label>
                <Input type="tel" placeholder="(555) 000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Additional Order Notes</Label>
                <Textarea placeholder="Any specific requests for our editors?" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>
            <Button onClick={handleSubmitOrder} disabled={isSubmitting || !formData.name || !formData.email} className="w-full py-6 bg-accent text-white font-bold text-lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Order...
                </>
              ) : (
                `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(getTotalPrice())} & Complete Order`
              )}
            </Button>
          </div>
        )}
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <OrderSummary 
            photoCount={photoCount} 
            brandingOption={brandingSelection} 
            voiceoverOption={voiceoverSelection} 
            includeEditedPhotos={includeEditedPhotos} 
          />
        </div>
      </div>
    </div>
  );
}
