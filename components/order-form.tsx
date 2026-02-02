"use client";
import React, { useState } from "react";
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
import { ArrowRight, User, Mail, Phone, Loader2, ChevronLeft } from "lucide-react";
type OrderStep = "upload" | "details" | "payment";

 {/* Google Analytics Script */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4VFMMPJDBN"
        strategy="afterInteractive"
      />

export function OrderForm() {
  const [step, setStep] = useState<OrderStep>("upload");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
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
    if (photoCount === 1) return 1; // Test price
    if (photoCount <= 12) return 79;
    if (photoCount <= 25) return 129;
    if (photoCount <= 35) return 179;
    return 0;
  };
  const getBrandingPrice = () => brandingSelection === "custom" ? 25 : 0;
  const getVoiceoverPrice = () => voiceoverSelection === "voiceover" ? 25 : 0;
  const getEditedPhotosPrice = () => includeEditedPhotos ? 15 : 0;
  const getTotalPrice = () => getBasePrice() + getBrandingPrice() + getVoiceoverPrice() + getEditedPhotosPrice();
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
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { // Changed to /upload for audio support
        method: "POST",
        body: uploadData
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
      // 1. Upload Photos
      const uploadedPhotos = [];
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
      // 2. Upload Logo if needed
      let brandingLogoUrl = "";
      if (brandingData.logoFile) {
        const logoResult = await uploadToCloudinary(brandingData.logoFile, "logos");
        brandingLogoUrl = logoResult?.secure_url || "";
      }
      // 3. Upload Custom Audio if needed
      let musicFileUrl = "";
      if (customAudioFile) {
        const musicResult = await uploadToCloudinary(customAudioFile, "audio");
        musicFileUrl = musicResult?.secure_url || "";
      }
      // 4. SAVE TO DATABASE (CRITICAL STEP)
      const dbResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: formData.name, email: formData.email, phone: formData.phone },
          uploadedPhotos,
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
          totalPrice: getTotalPrice(),
          specialInstructions: formData.notes
        }),
      });
      const dbResult = await dbResponse.json();
      if (!dbResult.success) throw new Error(dbResult.error || "Failed to save to database");
      const createdOrderId = dbResult.data.orderId;
      // 5. INITIATE STRIPE CHECKOUT
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ name: `${photoCount} Photo Video Package`, amount: getTotalPrice() * 100 }],
          customerDetails: formData,
          orderData: { orderId: createdOrderId, photoCount },
        }),
      });
      const session = await checkoutResponse.json();
      if (!checkoutResponse.ok || !session.url) {
        throw new Error(session.error || "Checkout failed");
      }
      window.location.href = session.url;
    } catch (error: any) {
      alert("Error processing order: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 space-y-6">
        {step === "upload" && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-bold">Upload Your Photos</h2>
              </div>
              <PhotoUploader photos={photos} onPhotosChange={setPhotos} />
            </div>
            {photos.length > 0 && (
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
            {photos.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-8">
                <MusicSelector selected={musicSelection} onSelect={setMusicSelection} customAudioFile={customAudioFile} onCustomAudioChange={setCustomAudioFile} />
                <div className="border-t pt-6">
                  <BrandingSelector selected={brandingSelection} onSelect={setBrandingSelection} brandingData={brandingData} onBrandingDataChange={setBrandingData} />
                </div>
                <div className="border-t pt-6">
                  <VoiceoverSelector selected={voiceoverSelection} onSelect={setVoiceoverSelection} script={voiceoverScript} onScriptChange={setVoiceoverScript} selectedVoice={selectedVoice} onVoiceSelect={setSelectedVoice} />
                </div>
                <div className="border-t pt-6 flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div>
                    <p className="font-bold">Include Edited Photos (+$15)</p>
                    <p className="text-sm text-muted-foreground">Receive high-res professionally edited versions of your photos.</p>
                  </div>
                  <Switch checked={includeEditedPhotos} onCheckedChange={setIncludeEditedPhotos} />
                </div>
                <Button onClick={() => setStep("details")} disabled={!canProceed} className="w-full py-6 text-lg bg-accent">
                  Continue to Details <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
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
            <Button
                onClick={handleSubmitOrder}
                disabled={isSubmitting || !formData.name || !formData.email}
                className="w-full py-6 text-lg bg-accent"
            >
              {isSubmitting ? <><Loader2 className="mr-2 animate-spin" /> Processing Order...</> : <>Pay & Complete Order <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </div>
        )}
      </div>
      <div className="lg:col-span-1">
        <OrderSummary photoCount={photoCount} brandingOption={brandingSelection} voiceoverOption={voiceoverSelection} includeEditedPhotos={includeEditedPhotos} />
      </div>
    </div>
  );
}
