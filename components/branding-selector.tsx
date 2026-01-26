"use client";

import { Check, ImageIcon } from "lucide-react";

const brandingOptions = [
  {
    id: "unbranded",
    name: "Unbranded",
    description: "Clean video without any branding",
    price: 0,
  },
  {
    id: "basic",
    name: "Basic Branding",
    description: "Your logo in the corner of the video",
    price: 0,
  },
  {
    id: "custom",
    name: "Custom Branding",
    description: "Custom intro/outro with your branding",
    price: 25,
  },
];

interface BrandingSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function BrandingSelector({ selected, onSelect }: BrandingSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Branding Options</h3>
          <p className="text-sm text-muted-foreground">Add your logo to the video</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {brandingOptions.map((option) => (
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
              {option.price === 0 ? "Free" : `+$${option.price}`}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
