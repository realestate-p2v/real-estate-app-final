"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUploader } from "@/components/photo-uploader";
import { OrderSummary } from "@/components/order-summary";
import { MusicSelector } from "@/components/music-selector";
import { BrandingSelector } from "@/components/branding-selector";
import { VoiceoverSelector } from "@/components/voiceover-selector";

export function OrderForm() {
  // 1. STATE MANAGEMENT
  const [step, setStep] = React.useState<"upload" | "details">("upload");
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [useUrl, setUseUrl] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [urlPackage, setUrlPackage] = React.useState("15");
  const [additionalInstructions, setAdditionalInstructions] = React.useState("");
  
  // Add-on Selections
  const [musicSelection, setMusicSelection] = React.useState("none");
  const [brandingSelection, setBrandingSelection] = React.useState("unbranded");
  const [voiceoverSelection, setVoiceoverSelection] = React.useState("none");
  const [includeEditedPhotos, setIncludeEditedPhotos] = React.useState(false);

  // 2. VALIDATION HELPERS
  const isUrlModeValid = useUrl && url.trim().length > 0;
  const isUploadModeValid = !useUrl && photos.length > 0;
  const canProceed = isUrlModeValid || isUploadModeValid;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: THE FORM */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STEP 1: UPLOAD & ADD-ONS */}
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
                /* Added relative z-10 and pointer-events-auto to ensure clicks register */
                <div className="relative z-10 pointer-events-auto bg-card rounded-2xl border border-border p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold border-b pb-4">Customize Your Video</h2>
                  
                  {/* Explicitly passing handlers to ensure they aren't "read-only" */}
                  <MusicSelector 
                    value={musicSelection} 
                    onValueChange={(val) => setMusicSelection(val)} 
                  />
                  
                  <div className="border-t pt-6">
                    <BrandingSelector 
                      value={brandingSelection} 
                      onValueChange={(val) => setBrandingSelection(val)} 
                    />
                  </div>

                  <div className="border-t pt-6">
                    <VoiceoverSelector 
                      value={voiceoverSelection} 
                      onValueChange={(val) => setVoiceoverSelection(val)} 
                    />
                  </div>

                 <div className="border-t pt-6 flex items-center justify-between p-4 bg-muted/80 rounded-xl">
                  <div className="pr-4">
                    <p className="font-bold">Include Edited Photos (+$15)</p>
                    <p className="text-sm text-muted-foreground">Receive high-res professionally edited files of your photos.</p>
                  </div>
                  <Switch 
                    checked={includeEditedPhotos} 
                    onCheckedChange={setIncludeEditedPhotos} // FIXED: Now correctly triggers the setter
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
          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
             <Button variant="ghost" onClick={() => setStep("upload")} className="mb-4">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Customization
             </Button>
            <h2 className="text-2xl font-bold">Your Details</h2>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label
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
