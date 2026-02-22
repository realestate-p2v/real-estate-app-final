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
  // A user can only proceed if they've uploaded photos OR provided a URL
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
              {/* Photo Upload Section */}
              <PhotoUploader
                photos={photos}
                setPhotos={setPhotos}
                useUrl={useUrl}
                setUseUrl={setUseUrl}
                url={url}
                setUrl={setUrl}
                urlPackage={urlPackage}
                setUrlPackage={setUrlPackage}
              />

              {/* Only show Add-ons and Next button if they have started the order */}
              {canProceed && (
                <div className="bg-card rounded-2xl border border-border p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold border-b pb-4">Customize Your Video</h2>
                  
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
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="editedPhotos" 
                        checked={includeEditedPhotos}
                        onCheckedChange={(checked) => setIncludeEditedPhotos(!!checked)}
                        className="h-5 w-5"
                      />
                      <label 
                        htmlFor="editedPhotos" 
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Include Edited Photos Package (+$15)
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-8 mt-1">
                      Get the professionally edited still photos used in your video.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setStep("details")}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                  >
                    Next: Property Details
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROPERTY DETAILS (Placeholder for now) */}
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
                <div className="h-4 w-64 bg-muted animate-pulse mx-auto rounded" />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY (Sticky) */}
        <div className="lg:col-span-1">
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
  );
}
