// lib/remix-presets.ts
//
// Preset specifications for the Video Remix tool.
//
// This file is pure data + types. Zero runtime side effects, zero React.
// The renderer (lib/remix-renderer.ts, PR #2) consumes these specs to build
// FFmpeg filter chains. The modal (components/remix-preset-modal.tsx, PR #1)
// consumes them to render slot-assignment UI.
//
// Architectural rule (see handoff §4): v1 ships caption types, slot meanings,
// zoompan, xfade. v1.1 plug-ins (J-cuts, speed ramps, beat sync, frame freeze,
// match cuts, motion-blur transitions, SFX) are typed here as optional fields
// so the renderer can grow without rewriting consumers.

// ─── IDs ──────────────────────────────────────────────────────────────────────

export type RemixPresetId =
  | "just_listed"
  | "open_house"
  | "quick_tour"
  | "price_drop";

// Slot "meaning" drives default-fill heuristics (which clip gets auto-assigned).
// Caption display uses the agent's raw clip label, not these constants.
// `aerial_preferred` flag on the slot picks an aerial clip if available.
export type SlotMeaning =
  | "exterior_aerial_preferred" // Just Listed slot 1
  | "exterior"
  | "kitchen"
  | "living_room"
  | "primary_bedroom" // matches "Primary Bedroom" OR "Master Bedroom" in labels
  | "primary_bath" // matches "Primary Bath" OR "Master Bath" in labels
  | "bathroom"
  | "backyard_feature" // backyard / pool / patio / view
  | "feature_room" // any standout interior shot
  | "outdoor_feature"
  | "walkthrough_any" // Quick Tour — any clip, agent orders them
  | "best_or_aerial"; // Price Drop slot 5 — prefers aerial, falls back to best

// ─── Captions ─────────────────────────────────────────────────────────────────
//
// Caption styling pulls from `agentBranding.fontFamily`, `accentColor`, `barColor`
// at render time (handoff §2). The spec only declares TYPE of caption.

export type CaptionPosition =
  | "top"
  | "top-left"
  | "bottom-left"
  | "bottom-center"
  | "center";

export type SlotCaption =
  // Slab-font announcement. Full-frame intro then shrinks to a corner chip.
  // Examples: "JUST LISTED", "PRICE DROP", "OPEN HOUSE"
  | {
      kind: "hero_badge";
      text: string;
      heroDuration: number; // seconds at full size
      shrinkToChip?: CaptionPosition; // where the chip lands after shrink
    }
  // Property address, mixed case, bottom-left.
  | {
      kind: "address_line";
      fadeAfter: number; // seconds visible before fading
    }
  // Room name pulled from clip's raw label at render time. Two-line wrap before
  // truncate (handoff Q10 — never truncate without wrapping first).
  | {
      kind: "room_name";
      sourceField: "label";
      fadeAfter: number;
    }
  // Persistent banner across multiple slots.
  | {
      kind: "sticky_banner";
      text: string; // can include {day}, {time}, {oldPrice}, {newPrice} tokens
      position: "top" | "top-left";
    }
  // Animated price reveal, last few seconds of slot.
  | {
      kind: "price_reveal";
      animateInDuration: number; // seconds for the reveal animation
      // Old/new are pulled from PresetInputs at render time, not stored here.
      strikethroughOld?: boolean;
    }
  // Small action hint, agent-toggleable in modal.
  | {
      kind: "rsvp_hint";
      text: string; // e.g. "RSVP via link in bio"
    };

// ─── Slot ─────────────────────────────────────────────────────────────────────

export type SlotSpec = {
  meaning: SlotMeaning;
  // Default duration in seconds. Renderer trims clip to this length.
  defaultDuration: number;
  caption: SlotCaption | null;
  // v1 zoompan: subtle 1.05x slow zoom on every slot per handoff §4.
  zoom: {
    from: number;
    to: number;
    ease: "linear" | "easeIn" | "easeOut";
  };

  // ── v1.1 OPTIONAL FIELDS ────────────────────────────────────────────────
  // These are typed for forward-compat. v1 renderer ignores them entirely.
  // Adding them now keeps PRESETS data forward-compatible so v1.1 doesn't
  // require a renderer rewrite — just a serializer pass.

  // Variable playback rate within a single slot.
  // Example: { fromRate: 1.0, toRate: 1.4, startAt: 0.0, endAt: 0.8 } accelerates
  // from 1x to 1.4x over the last 0.8s of the slot.
  speedRamp?: {
    fromRate: number;
    toRate: number;
    startAt: number; // seconds from slot start
    endAt: number; // seconds from slot start
  };
  // J-cut: this slot's audio starts N seconds before its picture appears.
  // Implemented in the audio chain stitcher, not the slot fragment itself.
  jCutAudioOffset?: number;
  // Frame freeze sting at end of slot. Last frame holds for N seconds.
  frameFreeze?: {
    duration: number; // seconds to hold the last frame
  };
  // v1.1 — for match-cut sequencing on Open House.
  matchCutHint?: "horizontal" | "vertical" | "radial";
};

// ─── Inputs ───────────────────────────────────────────────────────────────────
//
// Per-preset agent inputs collected in the modal at generation time.

export type PresetInputKind =
  | "price_pair" // old + new (Price Drop)
  | "price_single" // new only (Just Listed)
  | "day_time"; // day + time (Open House)

export type PresetInputDef = {
  kind: PresetInputKind;
  required: boolean;
};

// Concrete shape stored on the draft. All fields optional because not every
// preset needs every input.
export type PresetInputs = {
  newPrice?: string; // raw, displayed as entered (handoff Q4)
  oldPrice?: string;
  day?: string; // free text, e.g. "Saturday", "Sat May 3"
  time?: string; // free text, e.g. "1–3 PM"
  showRsvpHint?: boolean; // Open House toggle for slot 6
};

// ─── Preset ───────────────────────────────────────────────────────────────────

export type PresetSpec = {
  id: RemixPresetId;
  displayName: string;
  description: string; // 1-line for the preset card
  durationTarget: [number, number]; // min, max seconds — informational only
  outputSizeDefault: "square" | "landscape" | "portrait";
  musicVibeDefault: string; // matches existing VIBES `key` in page.tsx
  transitionDefault: { kind: "xfade"; duration: number };
  slots: SlotSpec[];
  // Agent can append up to N extra slots beyond the base count (handoff §3.5).
  maxExtraSlots: number;
  inputs: PresetInputDef[];
  introSupported: boolean; // v1: only Just Listed (handoff §3.2)
  // Themed colors for the preset card thumbnail (handoff Q6).
  cardTheme: { gradientFrom: string; gradientTo: string };
};

// ─── Draft metadata ───────────────────────────────────────────────────────────
//
// Stored on the draft state under state.preset when version === 2.
// v1 drafts have no preset field; v2 drafts may have preset === null (manual).

export type PresetDraftMeta = {
  id: RemixPresetId;
  inputs: PresetInputs;
  extraSlotsCount: number; // how many extras the agent added beyond base
};

// Caption easing — Material standard per handoff Q1.
export const CAPTION_EASING_IN = "cubic-bezier(0.4, 0, 0.2, 1)";
export const CAPTION_FADE_OUT_SECONDS = 0.3;

// ─── PRESETS ──────────────────────────────────────────────────────────────────

export const PRESETS: Record<RemixPresetId, PresetSpec> = {
  // ── Just Listed ─────────────────────────────────────────────────────────
  // Handoff §2 Preset 1. 6 slots. Stops the scroll on social.
  just_listed: {
    id: "just_listed",
    displayName: "Just Listed",
    description: "Announce a new listing with maximum hook.",
    durationTarget: [18, 22],
    outputSizeDefault: "portrait",
    musicVibeDefault: "upbeat_modern",
    transitionDefault: { kind: "xfade", duration: 0.4 },
    maxExtraSlots: 3,
    introSupported: true,
    cardTheme: { gradientFrom: "#a855f7", gradientTo: "#ec4899" }, // purple → pink
    inputs: [{ kind: "price_single", required: true }],
    slots: [
      // 1. Exterior wide / aerial if available — JUST LISTED hero badge.
      {
        meaning: "exterior_aerial_preferred",
        defaultDuration: 3.5,
        caption: {
          kind: "hero_badge",
          text: "JUST LISTED",
          heroDuration: 1.5,
          shrinkToChip: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "easeOut" },
        // v1.1: punch-zoom on last 0.5s + frame-freeze on text
        speedRamp: { fromRate: 1.0, toRate: 1.0, startAt: 0, endAt: 3.5 },
      },
      // 2. Kitchen — address line.
      {
        meaning: "kitchen",
        defaultDuration: 3.0,
        caption: { kind: "address_line", fadeAfter: 2.0 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 3. Living room — room name.
      {
        meaning: "living_room",
        defaultDuration: 3.0,
        caption: { kind: "room_name", sourceField: "label", fadeAfter: 1.5 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 4. Primary bedroom — room name.
      {
        meaning: "primary_bedroom",
        defaultDuration: 3.0,
        caption: { kind: "room_name", sourceField: "label", fadeAfter: 1.5 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 5. Primary bath — room name.
      {
        meaning: "primary_bath",
        defaultDuration: 3.0,
        caption: { kind: "room_name", sourceField: "label", fadeAfter: 1.5 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 6. Backyard / feature — animated price reveal.
      {
        meaning: "backyard_feature",
        defaultDuration: 4.0,
        caption: { kind: "price_reveal", animateInDuration: 2.0 },
        zoom: { from: 1.0, to: 1.08, ease: "easeOut" },
        // v1.1: speed ramp last 0.8s (1x → 1.4x) + frame-freeze 0.4s on price
        speedRamp: { fromRate: 1.0, toRate: 1.4, startAt: 3.2, endAt: 4.0 },
        frameFreeze: { duration: 0.4 },
      },
    ],
  },

  // ── Open House Teaser ───────────────────────────────────────────────────
  // Handoff §2 Preset 2. 6 slots. Drives RSVP for a specific date+time.
  open_house: {
    id: "open_house",
    displayName: "Open House",
    description: "Drive attendance to a specific date and time.",
    durationTarget: [22, 26],
    outputSizeDefault: "portrait",
    musicVibeDefault: "energetic_pop",
    transitionDefault: { kind: "xfade", duration: 0.3 },
    maxExtraSlots: 3,
    introSupported: false, // v1.1 will add intro support to remaining presets
    cardTheme: { gradientFrom: "#f97316", gradientTo: "#fbbf24" }, // orange → amber
    inputs: [{ kind: "day_time", required: true }],
    slots: [
      // 1. Exterior — OPEN HOUSE badge + day/time hero.
      {
        meaning: "exterior",
        defaultDuration: 3.5,
        caption: {
          kind: "hero_badge",
          text: "OPEN HOUSE",
          heroDuration: 2.0,
          shrinkToChip: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "easeOut" },
      },
      // 2-5. Interior highlights with sticky banner.
      // Sticky banner text uses {day}/{time} tokens, resolved at render time.
      {
        meaning: "kitchen",
        defaultDuration: 4.0,
        caption: {
          kind: "sticky_banner",
          text: "OPEN HOUSE  ·  {day}  ·  {time}",
          position: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
        matchCutHint: "horizontal",
      },
      {
        meaning: "living_room",
        defaultDuration: 4.0,
        caption: {
          kind: "sticky_banner",
          text: "OPEN HOUSE  ·  {day}  ·  {time}",
          position: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      {
        meaning: "primary_bedroom",
        defaultDuration: 4.0,
        caption: {
          kind: "sticky_banner",
          text: "OPEN HOUSE  ·  {day}  ·  {time}",
          position: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      {
        meaning: "primary_bath",
        defaultDuration: 4.0,
        caption: {
          kind: "sticky_banner",
          text: "OPEN HOUSE  ·  {day}  ·  {time}",
          position: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
        matchCutHint: "horizontal",
      },
      // 6. Outdoor — address + RSVP hint (toggleable).
      {
        meaning: "outdoor_feature",
        defaultDuration: 3.0,
        caption: { kind: "rsvp_hint", text: "RSVP via link in bio" },
        zoom: { from: 1.0, to: 1.05, ease: "easeOut" },
      },
    ],
  },

  // ── Quick Tour ──────────────────────────────────────────────────────────
  // Handoff §2 Preset 3. 7 slots. Walkthrough story.
  quick_tour: {
    id: "quick_tour",
    displayName: "Quick Tour",
    description: "Virtual walkthrough, room by room.",
    durationTarget: [24, 28],
    outputSizeDefault: "portrait",
    musicVibeDefault: "chill_tropical",
    transitionDefault: { kind: "xfade", duration: 0.3 },
    maxExtraSlots: 3,
    introSupported: false,
    cardTheme: { gradientFrom: "#0ea5e9", gradientTo: "#14b8a6" }, // blue → teal
    inputs: [], // no agent inputs needed
    slots: [
      // 7 walkthrough slots, agent-ordered. All same caption pattern.
      // Slot 7 v1.1: speed ramp 1x → 0.7x last 1s, dreamy outro.
      ...Array.from({ length: 7 }, (_, i) => ({
        meaning: "walkthrough_any" as SlotMeaning,
        defaultDuration: 3.5,
        caption: {
          kind: "room_name" as const,
          sourceField: "label" as const,
          fadeAfter: 2.0,
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" as const },
        // J-cut on every transition — v1.1
        jCutAudioOffset: i === 0 ? undefined : 0.5,
        // v1.1: dreamy outro on last slot only
        speedRamp:
          i === 6
            ? { fromRate: 1.0, toRate: 0.7, startAt: 2.5, endAt: 3.5 }
            : undefined,
      })),
    ],
  },

  // ── Price Drop ──────────────────────────────────────────────────────────
  // Handoff §2 Preset 4. 5 slots. Tightest, most urgent.
  price_drop: {
    id: "price_drop",
    displayName: "Price Drop",
    description: "Punchy, urgency-driven price-reduction announcement.",
    durationTarget: [14, 18],
    outputSizeDefault: "portrait",
    musicVibeDefault: "bold_cinematic",
    transitionDefault: { kind: "xfade", duration: 0.25 }, // fastest
    maxExtraSlots: 3,
    introSupported: false,
    cardTheme: { gradientFrom: "#dc2626", gradientTo: "#f97316" }, // red → orange
    inputs: [{ kind: "price_pair", required: true }],
    slots: [
      // 1. Exterior — PRICE DROP slab, full frame 1s.
      {
        meaning: "exterior",
        defaultDuration: 2.5,
        caption: {
          kind: "hero_badge",
          text: "PRICE DROP",
          heroDuration: 1.0,
          shrinkToChip: "top",
        },
        zoom: { from: 1.0, to: 1.1, ease: "easeOut" },
        // v1.1: aggressive punch zoom + animated overlay text smash-in
        speedRamp: { fromRate: 1.0, toRate: 1.0, startAt: 0, endAt: 2.5 },
      },
      // 2. Hero interior — sticky WAS/NOW banner with strikethrough.
      {
        meaning: "feature_room",
        defaultDuration: 3.0,
        caption: {
          kind: "sticky_banner",
          text: "WAS {oldPrice}  ·  NOW {newPrice}",
          position: "top",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 3. Feature room — banner persists.
      {
        meaning: "feature_room",
        defaultDuration: 3.0,
        caption: {
          kind: "sticky_banner",
          text: "WAS {oldPrice}  ·  NOW {newPrice}",
          position: "top",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 4. Outdoor / feature — banner persists.
      {
        meaning: "outdoor_feature",
        defaultDuration: 3.0,
        caption: {
          kind: "sticky_banner",
          text: "WAS {oldPrice}  ·  NOW {newPrice}",
          position: "top",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 5. Best clip / aerial if available — address bottom, prices fade out.
      {
        meaning: "best_or_aerial",
        defaultDuration: 3.0,
        caption: { kind: "address_line", fadeAfter: 2.5 },
        zoom: { from: 1.0, to: 1.08, ease: "easeOut" },
        // v1.1: speed ramp on slot 5
        speedRamp: { fromRate: 1.0, toRate: 1.3, startAt: 2.0, endAt: 3.0 },
      },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// True iff `label` plausibly matches `meaning`. Used by the modal's default-fill
// and Auto-Fill to pick a clip for each slot.
//
// Matching is intentionally loose. Real listing labels we've seen:
//   "Front Exterior", "Entryway", "Living Room", "Kitchen",
//   "Master Bedroom", "Master Bath", "Backyard", "Pool", "Patio"
// Both "Master ..." (legacy MLS) and "Primary ..." (modern MLS) match
// primary_bedroom / primary_bath. Caption display still uses the raw label.
export function clipMatchesMeaning(
  label: string,
  isAerial: boolean,
  meaning: SlotMeaning
): boolean {
  if (!label) return false;
  const s = label.toLowerCase();

  switch (meaning) {
    case "exterior_aerial_preferred":
      return (
        isAerial ||
        /\b(exterior|front|facade|curb|drive|entrance)\b/.test(s)
      );
    case "exterior":
      return /\b(exterior|front|facade|curb|drive|entrance)\b/.test(s);
    case "kitchen":
      return /\bkitchen\b/.test(s);
    case "living_room":
      return /\b(living|great\s?room|family\s?room|den)\b/.test(s);
    case "primary_bedroom":
      // Match BOTH "Primary Bedroom" (modern) and "Master Bedroom" (legacy).
      // Also catches "Owner's Suite".
      return /\b(primary|master|owner'?s)\b.*\b(bed|suite)\b/.test(s);
    case "primary_bath":
      return /\b(primary|master|owner'?s)\b.*\bbath/.test(s);
    case "bathroom":
      return /\bbath/.test(s);
    case "backyard_feature":
      return /\b(backyard|back\s?yard|pool|patio|deck|garden|view|outdoor)\b/.test(
        s
      );
    case "outdoor_feature":
      return /\b(backyard|back\s?yard|pool|patio|deck|garden|view|outdoor|landscape)\b/.test(
        s
      );
    case "feature_room":
      // Anything that isn't pure exterior/walkway. Permissive.
      return !/\b(driveway|walkway|sidewalk)\b/.test(s);
    case "walkthrough_any":
      return true;
    case "best_or_aerial":
      return isAerial || /\b(exterior|backyard|pool|view|aerial)\b/.test(s);
    default:
      return false;
  }
}

// Slot is "aerial-preferring" — used by modal to suggest aerial clips first.
export function slotPrefersAerial(meaning: SlotMeaning): boolean {
  return meaning === "exterior_aerial_preferred" || meaning === "best_or_aerial";
}
