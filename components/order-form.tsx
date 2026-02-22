"use client";

import * as React from "react";
import { PhotoUploader } from "@/components/photo-uploader";
import { OrderSummary } from "@/components/order-summary";
import { MusicSelector } from "@/components/music-selector";
import { BrandingSelector } from "@/components/branding-selector";
import { VoiceoverSelector } from "@/components/voiceover-selector";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";

export function OrderForm() {
  // 1. STATE MANAGEMENT
  const [step, setStep] = React.useState<"upload" | "details">("upload");
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [useUrl, setUseUrl] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [urlPackage, setUrlPackage] = React.useState("15");
  const [additionalInstructions, setAdditionalInstructions] = React.useState("");
  
  const [musicSelection, setMusicSelection] = React.useState("none");
  const [brandingSelection, setBrandingSelection] = React.useState("unbranded");
  const [voiceoverSelection, setVoiceoverSelection] = React.useState("none");
  const [includeEditedPhotos, setIncludeEditedPhotos] = React.useState(false);

  // 2. FORM DATA STATE
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    // Simulation of submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    alert("Order submitted! (Logic for payment goes here)");
  };

  // 3. VALIDATION HELPERS
  const isUrlModeValid = useUrl && url.trim().length > 0;
  const isUploadModeValid = !useUrl && photos.length > 0;
  const canProceed = isUrlModeValid || isUploadModeValid;
  const photoCount = useUrl ? parseInt(urlPackage) : photos.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {step === "upload" && (
            <div className="space-y-8">
              <PhotoUploader
                photos={photos}
                setPhotos={setPhotos}
                useUrl={useUrl}
                setUseUrl={setUseUrl}
                url={url}
                setUrl={setUrl}
                urlPackage={urlPackage}
                setUrlPackage={setUrlPackage}
                instructions={additionalInstructions}
                setInstructions={setAdditionalInstructions}
              />

              {canProceed && (
                <div className="bg-card rounded-2xl border border-border p-6 space-y-8 relative z-10">
                  <h2 className="text-xl font-bold border-b pb-4">Customize Your Video</h2>
                  
                  <MusicSelector value={musicSelection} onValueChange={setMusicSelection} />
                  
                  <div className="border-t pt-6">
                    <BrandingSelector value={brandingSelection} onValueChange={setBrandingSelection} />
                  </div>

                  <div className="border-t pt-6">
                    <VoiceoverSelector value={voiceoverSelection} onValueChange={setVoiceoverSelection} />
                  </div>

                  {/* Edited Photos Section */}
                  <div className="border-t pt-6 flex items-center justify-between p-4 bg-muted/80 rounded-xl">
                    <div className="pr-4">
                      <p className="font-bold">Include Edited Photos (+$15)</p>
                      <p className="text-sm text-muted-foreground">Receive high-res professionally edited files of your photos.</p>
                    </div>
                    <Switch 
                      checked={includeEditedPhotos} 
                      onCheckedChange={setIncludeEditedPhotos}
                      className="scale-150 mr-2 data-[state=checked]:bg-primary border-1 border-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {!musicSelection && (
                      <p className="text-xs text-red-500 italic text-right">* Please select a music</p>
                    )}
                    
                    <Button onClick={() => setStep("details")} disabled={!canProceed} className="w-full py-6 text-lg bg-accent">
                      Continue to Details <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "details" && (
