// components/tool-header.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Home } from "lucide-react";

export type ToolHeaderProperty = {
  id: string;
  address: string;
  city?: string | null;
  state?: string | null;
};

export type ToolHeaderVideo = {
  id: string;
  label: string;
  createdAt?: string;
};

export type ToolHeaderProps = {
  // Property state — controlled from parent
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string | null) => void;
  properties: ToolHeaderProperty[];

  // Optional video picker (Video Remix only)
  videos?: ToolHeaderVideo[];
  selectedVideoId?: string | null;
  onSelectVideo?: (videoId: string | null) => void;

  // Optional override for back navigation (default: router.back())
  backHref?: string;

  // Optional "enter manually" escape hatch — if true, adds the "+ Enter manually"
  // option to the property dropdown, firing onSelectProperty with a sentinel value
  // (default: "__new__") so the parent can wipe its form state.
  allowManualEntry?: boolean;
  manualEntryValue?: string; // defaults to "__new__"
};

// Tailwind class strings hoisted to module scope — avoids Turbopack parser edge cases
// with long template-string interpolation inside JSX.
const BACK_BTN_CLASS =
  // Layout: self-start prevents full-width stretch on mobile; min-h ensures tap target.
  "group self-start inline-flex items-center gap-2 rounded-full " +
  "px-4 py-2.5 md:px-5 md:py-3 min-h-[44px] " +
  "text-[13px] md:text-sm font-semibold tracking-tight " +
  // Soft gradient pill with subtle inner highlight — reads as a polished UI element
  "bg-gradient-to-b from-white/[0.10] to-white/[0.04] " +
  "text-white/85 " +
  "ring-1 ring-white/[0.14] " +
  "shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_2px_8px_-2px_rgba(0,0,0,0.4)] " +
  // Hover: brighten gradient, strengthen ring/shadow, nudge arrow left
  "hover:from-white/[0.16] hover:to-white/[0.08] " +
  "hover:text-white hover:ring-white/[0.25] " +
  "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.14)_inset,0_4px_14px_-2px_rgba(0,0,0,0.5)] " +
  "active:scale-[0.97] " +
  "transition-all duration-200 ease-out " +
  "focus:outline-none focus:ring-2 focus:ring-white/50 " +
  "shrink-0";

const PROP_EYEBROW_CLASS =
  "text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-white/50 mb-1.5";

const PROP_SELECT_BASE =
  "w-full md:min-w-[320px] lg:min-w-[380px] md:w-auto " +
  "appearance-none cursor-pointer " +
  "rounded-xl px-5 pr-12 " +
  "min-h-[52px] " +
  "text-base font-bold text-white " +
  "bg-emerald-500/[0.08] " +
  "hover:bg-emerald-500/[0.12] " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-300/60 " +
  "transition-colors";

const PROP_SELECT_ACTIVE_RING = "ring-1 ring-emerald-400/40";

// Cyan pulse state when no property is selected — uses ring-2 to match the
// spec's "cyan pulse animation on the ring" direction and give it enough
// weight to read across the dark background.
const PROP_SELECT_EMPTY_RING =
  "ring-2 ring-cyan-400/60 animate-pulse";

const VIDEO_SELECT_CLASS =
  "w-full md:min-w-[260px] md:w-auto " +
  "appearance-none cursor-pointer " +
  "rounded-xl px-4 py-2.5 pr-11 " +
  "text-sm font-bold text-white " +
  "bg-violet-500/[0.08] ring-1 ring-violet-400/40 " +
  "hover:bg-violet-500/[0.12] " +
  "focus:outline-none focus:ring-2 focus:ring-violet-300/60 " +
  "transition-colors";

export function ToolHeader({
  selectedPropertyId,
  onSelectProperty,
  properties,
  videos,
  selectedVideoId,
  onSelectVideo,
  backHref,
  allowManualEntry = false,
  manualEntryValue = "__new__",
}: ToolHeaderProps) {
  const router = useRouter();
  const autoSelectedRef = useRef<string | null>(null);

  // Auto-select the sole video when exactly one is available and nothing is picked.
  // Guard with a ref so re-renders don't re-trigger the callback on the same id.
  useEffect(() => {
    if (!videos || !onSelectVideo) return;
    if (videos.length !== 1) return;
    if (selectedVideoId) return;
    const only = videos[0].id;
    if (autoSelectedRef.current === only) return;
    autoSelectedRef.current = only;
    onSelectVideo(only);
  }, [videos, selectedVideoId, onSelectVideo]);

  // Reset the auto-select guard if the video list changes shape
  useEffect(() => {
    if (!videos || videos.length !== 1) {
      autoSelectedRef.current = null;
    }
  }, [videos]);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") {
      onSelectProperty(null);
    } else if (allowManualEntry && value === manualEntryValue) {
      // Parent decides what manual-entry means (typically: clear form, keep id null)
      onSelectProperty(manualEntryValue);
    } else {
      onSelectProperty(value);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onSelectVideo) return;
    const value = e.target.value;
    onSelectVideo(value === "" ? null : value);
  };

  const isEmpty = !selectedPropertyId;
  const showVideoPicker = !!(videos && videos.length >= 2 && onSelectVideo);

  return (
    <div
      className="w-full mb-6"
      data-tool-header="true"
    >
      {/* Primary row: Back + Property */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className={BACK_BTN_CLASS}
          aria-label="Back to tools"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Back to tools</span>
        </button>

        {/* Property selector */}
        <div className="flex-1 md:flex-none">
          <div className="relative">
            <Home
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60"
              aria-hidden="true"
            />
            <select
              value={selectedPropertyId ?? ""}
              onChange={handlePropertyChange}
              aria-label="Select a property"
              style={{ colorScheme: "dark", paddingLeft: "2.5rem" }}
              className={
                PROP_SELECT_BASE +
                " " +
                (isEmpty ? PROP_SELECT_EMPTY_RING : PROP_SELECT_ACTIVE_RING)
              }
            >
              <option value="" className="bg-gray-900 text-white">
                {properties.length === 0
                  ? "No properties yet — add one from the dashboard"
                  : "Select a property..."}
              </option>
              {properties.map((p) => {
                const locality = [p.city, p.state].filter(Boolean).join(", ");
                const label = locality ? `${p.address}, ${locality}` : p.address;
                return (
                  <option key={p.id} value={p.id} className="bg-gray-900 text-white">
                    {label}
                  </option>
                );
              })}
              {allowManualEntry && (
                <option value={manualEntryValue} className="bg-gray-900 text-white">
                  ＋ Enter details manually
                </option>
              )}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Secondary row: Video picker (Video Remix only, 2+ videos) */}
      {showVideoPicker && (
        <div className="mt-3 md:mt-4 md:ml-[5.5rem]">
          <div className={PROP_EYEBROW_CLASS}>Which video?</div>
          <div className="relative inline-block w-full md:w-auto">
            <select
              value={selectedVideoId ?? ""}
              onChange={handleVideoChange}
              aria-label="Select a video"
              style={{ colorScheme: "dark" }}
              className={VIDEO_SELECT_CLASS}
            >
              <option value="" className="bg-gray-900 text-white">
                All videos for this property
              </option>
              {videos!.map((v) => (
                <option key={v.id} value={v.id} className="bg-gray-900 text-white">
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolHeader;
