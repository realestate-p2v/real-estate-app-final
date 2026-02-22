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

                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="editedPhotos" 
                        checked={includeEditedPhotos}
                        onCheckedChange={(checked) => setIncludeEditedPhotos(!!checked)}
                        className="h-5 w-5 cursor-pointer"
                      />
                      <label 
                        htmlFor="editedPhotos" 
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Include Edited Photos Package (+$15)
                      </label>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setStep("details")}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    Next: Property Details
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROPERTY DETAILS */}
          {step === "details" && (
            <div className="bg-card rounded-2xl border border-border p-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <button
                onClick={() => setStep("upload")}
                className="text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
              >
                ← Back to uploads
              </button>
              
              <h2 className="text-2xl font-bold mb-6">Property Details</h2>
              <div className="p-12 border-2 border-dashed rounded-xl text-center space-y-4">
                <p className="text-muted-foreground">Address and Checkout fields will appear here.</p>
                <div className="h-4 w-48 bg-muted animate-pulse mx-auto rounded" />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <OrderSummary 
              photoCount={useUrl ? parseInt(urlPackage) : photos.length} 
              brandingOption={brandingSelection} 
              voiceoverOption={voiceoverSelection} 
              includeEditedPhotos={includeEditedPhotos} 
              isUrlMode={useUrl}
            />
          </div>
        </div>
        
      </div>
    </div>
  );
}
