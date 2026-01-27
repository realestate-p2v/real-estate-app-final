"use client";

import { Check, Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const voiceoverOptions = [
  {
    id: "none",
    name: "No Voiceover",
    description: "Music only",
    price: 0,
  },
  {
    id: "voiceover",
    name: "Professional Voiceover",
    description: "AI-generated narration describing the property",
    price: 25,
  },
];

interface VoiceoverSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  script?: string;
  onScriptChange?: (script: string) => void;
}

export function VoiceoverSelector({ 
  selected, 
  onSelect, 
  script,
  onScriptChange 
}: VoiceoverSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Voiceover</h3>
          <p className="text-sm text-muted-foreground">Add narration to your video</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {voiceoverOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              selected === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {selected === option.id && (
              <div className="absolute top-3 right-3">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <p className="font-semibold text-foreground pr-6">{option.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
            <p className="text-sm font-semibold text-primary mt-2">
              {option.price === 0 ? "Included" : `+$${option.price}`}
            </p>
          </button>
        ))}
      </div>

      {/* Voiceover Script Input */}
      {selected === "voiceover" && (
        <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border space-y-3">
          <div className="space-y-2">
            <Label htmlFor="voiceoverScript">Voiceover Script (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Provide a custom script or leave blank and we will create one for you based on the property photos.
            </p>
            <Textarea
              id="voiceoverScript"
              placeholder="Welcome to this stunning 4-bedroom home in the heart of..."
              rows={4}
              value={script || ""}
              onChange={(e) => onScriptChange?.(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
