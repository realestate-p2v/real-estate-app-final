// components/order-form/special-features-picker.tsx
// Phase 1A spec Section 3 — chip picker for special features.
// Output conforms to the locked JSONB schema in Appendix A1.
// Keys are fixed; empty chips are omitted from the final object.

"use client";

import { useState, useEffect } from "react";
import { Check, Plus } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Locked schema contract (Appendix A1). Do not rename, add, or remove keys
// without updating the master spec and notifying downstream consumers
// (Description Writer, Listing Flyer, Marketing Planner, website listing page,
//  social captions).
// ─────────────────────────────────────────────────────────────────────────────

export type SpecialFeatureKey =
  | "location_perks"
  | "recent_upgrades"
  | "financial_upside"
  | "outdoor_features"
  | "school_district"
  | "unique_features"
  | "income_potential"
  | "move_in_ready"
  | "views_privacy"
  | "other";

export type SpecialFeaturesValue = Partial<Record<SpecialFeatureKey, string>>;

interface ChipDef {
  key: SpecialFeatureKey;
  label: string;
  icon: string;
  placeholder: string;
}

const CHIPS: ChipDef[] = [
  {
    key: "location_perks",
    label: "Location perks",
    icon: "📍",
    placeholder: "e.g., 5 minutes to the beach, walkable to downtown, backs up to a park",
  },
  {
    key: "recent_upgrades",
    label: "Recent upgrades",
    icon: "🔨",
    placeholder: "e.g., new roof 2023, remodeled kitchen, new HVAC system",
  },
  {
    key: "financial_upside",
    label: "Financial upside",
    icon: "💰",
    placeholder: "e.g., strong rental comps, VA assumable, ADU potential",
  },
  {
    key: "outdoor_features",
    label: "Outdoor features",
    icon: "🌳",
    placeholder: "e.g., large backyard, pool and spa, outdoor kitchen, fruit trees",
  },
  {
    key: "school_district",
    label: "School district",
    icon: "🎓",
    placeholder: "e.g., blue ribbon elementary, top-rated high school",
  },
  {
    key: "unique_features",
    label: "Unique features",
    icon: "✨",
    placeholder: "e.g., wine cellar, custom library, primary suite on main",
  },
  {
    key: "income_potential",
    label: "Income potential",
    icon: "📈",
    placeholder: "e.g., rents at $4K/mo, Airbnb-ready, accessory dwelling unit",
  },
  {
    key: "move_in_ready",
    label: "Move-in ready",
    icon: "🔑",
    placeholder: "e.g., freshly painted, new appliances, warranty transfers",
  },
  {
    key: "views_privacy",
    label: "Views / privacy",
    icon: "🏞️",
    placeholder: "e.g., mountain views, no rear neighbors, gated street",
  },
  {
    key: "other",
    label: "Something else?",
    icon: "➕",
    placeholder: "Anything the categories above don't cover",
  },
];

interface SpecialFeaturesPickerProps {
  value: SpecialFeaturesValue;
  onChange: (next: SpecialFeaturesValue) => void;
}

/**
 * Returns true if at least one chip has a non-empty (trimmed) value.
 * Use this from the parent form for the "at least 1 chip filled" validation.
 */
export function hasAtLeastOneFeature(value: SpecialFeaturesValue): boolean {
  return Object.values(value).some((v) => typeof v === "string" && v.trim().length > 0);
}

/**
 * Count filled chips (for the encouragement micro-copy).
 */
export function countFilledFeatures(value: SpecialFeaturesValue): number {
  return Object.values(value).filter((v) => typeof v === "string" && v.trim().length > 0).length;
}

export function SpecialFeaturesPicker({ value, onChange }: SpecialFeaturesPickerProps) {
  // A chip is "expanded" (text field visible) if it has a value OR the user
  // just tapped it. Expansion is driven by the value prop so draft restore
  // shows previously filled chips open.
  const [expanded, setExpanded] = useState<Set<SpecialFeatureKey>>(() => {
    const s = new Set<SpecialFeatureKey>();
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "string" && v.trim()) s.add(k as SpecialFeatureKey);
    }
    return s;
  });

  // Re-sync expanded set when value prop changes (e.g. draft restore)
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const [k, v] of Object.entries(value)) {
        if (typeof v === "string" && v.trim()) next.add(k as SpecialFeatureKey);
      }
      return next;
    });
  }, [value]);

  const toggleChip = (key: SpecialFeatureKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Collapsing — also clear the value
        next.delete(key);
        const cleaned = { ...value };
        delete cleaned[key];
        onChange(cleaned);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const updateField = (key: SpecialFeatureKey, text: string) => {
    const next = { ...value };
    if (text.trim().length === 0) {
      delete next[key];
    } else {
      next[key] = text;
    }
    onChange(next);
  };

  const filledCount = countFilledFeatures(value);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">Special features</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The details that sell the house — we&apos;ll work these into your description, flyer, and website.
        </p>
      </div>

      {/* Chip grid */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const isExpanded = expanded.has(chip.key);
          const hasValue = !!(value[chip.key] && value[chip.key]!.trim().length > 0);
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => toggleChip(chip.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                hasValue
                  ? "bg-primary/10 border-primary text-primary"
                  : isExpanded
                  ? "bg-muted border-primary/40 text-foreground"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
              {hasValue ? (
                <Check className="h-3.5 w-3.5" />
              ) : isExpanded ? null : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded chip inputs */}
      {expanded.size > 0 && (
        <div className="space-y-3 pt-2">
          {CHIPS.filter((c) => expanded.has(c.key)).map((chip) => (
            <div key={chip.key} className="space-y-1.5">
              <label
                htmlFor={`sf-${chip.key}`}
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </label>
              <input
                id={`sf-${chip.key}`}
                type="text"
                value={value[chip.key] || ""}
                onChange={(e) => updateField(chip.key, e.target.value)}
                placeholder={chip.placeholder}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                maxLength={240}
              />
            </div>
          ))}
        </div>
      )}

      {/* Validation / encouragement micro-copy */}
      <p
        className={`text-xs italic ${
          filledCount === 0
            ? "text-red-500"
            : filledCount === 1
            ? "text-muted-foreground"
            : "text-green-600"
        }`}
      >
        {filledCount === 0
          ? "At least one helps us write a description that actually sells — two or three is better."
          : filledCount === 1
          ? "Nice. One more or two makes the description much stronger."
          : `${filledCount} features added — the description will be rich.`}
      </p>
    </div>
  );
}
