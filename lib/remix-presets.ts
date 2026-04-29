// lib/remix-presets.ts
//
// Preset specifications for the Video Remix tool.
//
// This file is pure data + types. Zero runtime side effects, zero React.
// The renderer (lib/remix-renderer.ts, PR #2) consumes these specs to build
// FFmpeg filter chains. The modal (components/remix-preset-modal.tsx) consumes
// them to render slot-assignment UI.
//
// Architectural rule (see handoff §4): v1 ships caption types, slot meanings,
// zoompan, xfade. v1.1 plug-ins (J-cuts, speed ramps, beat sync, frame freeze,
// match cuts, motion-blur transitions, SFX) are typed here as optional fields
// so the renderer can grow without rewriting consumers.
//
// PACING DOCTRINE (the part that makes these scrollstopping):
//   - Hero title must land in the first 1–2 seconds of a video. Period.
//   - Slot durations are deliberately short (2.0–3.5s, not 6s).
//   - Source clips are 6s; we trim aggressively, never play full-length.
//   - paceMultiplier (Fast/Medium/Slow) scales slot durations globally per
//     draft. Hero badge `heroDuration` does NOT scale — the hook timing is
//     fixed regardless of pace.

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
  // heroDuration does NOT scale with paceMultiplier — title-in-1s is a rule.
  | {
      kind: "hero_badge";
      text: string;
      heroDuration: number; // seconds at full size — fixed, never scaled
      shrinkToChip?: CaptionPosition;
    }
  // Property address, mixed case, bottom-left.
  | {
      kind: "address_line";
      fadeAfter: number;
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
      animateInDuration: number;
      strikethroughOld?: boolean;
    }
  // Small action hint, agent-toggleable in modal.
  | {
      kind: "rsvp_hint";
      text: string;
    };

// ─── Slot ─────────────────────────────────────────────────────────────────────

export type SlotSpec = {
  meaning: SlotMeaning;
  // Default duration in seconds at pace=1.0 (Medium). Renderer multiplies by
  // the draft's paceMultiplier and clamps to [MIN_SCALED_DURATION, sourceClipDuration].
  defaultDuration: number;
  caption: SlotCaption | null;
  // v1 zoompan: subtle slow zoom on every slot per handoff §4.
  zoom: {
    from: number;
    to: number;
    ease: "linear" | "easeIn" | "easeOut";
  };

  // ── v1.1 OPTIONAL FIELDS ────────────────────────────────────────────────
  // These are typed for forward-compat. v1 renderer ignores them entirely.

  // Variable playback rate within a single slot.
  speedRamp?: {
    fromRate: number;
    toRate: number;
    startAt: number;
    endAt: number;
  };
  // J-cut: this slot's audio starts N seconds before its picture appears.
  jCutAudioOffset?: number;
  // Frame freeze sting at end of slot. Does NOT scale with pace.
  frameFreeze?: {
    duration: number;
  };
  // For match-cut sequencing on Open House.
  matchCutHint?: "horizontal" | "vertical" | "radial";
};

// ─── Pace ─────────────────────────────────────────────────────────────────────
//
// Per-draft pacing control. Multiplies slot durations globally.
// Hero badges, frame freezes, and other "fixed timing" elements are NOT scaled
// — the hook-in-1s rule is absolute.

export type PaceId = "fast" | "medium" | "slow";

export const PACE_PRESETS: Record<PaceId, number> = {
  fast: 0.75,
  medium: 1.0,
  slow: 1.4,
};

// Anything shorter than this reads as a glitch on social.
export const MIN_SCALED_DURATION = 1.2;

// Source clips from the orders pipeline are 6s. Never trim beyond this.
export const SOURCE_CLIP_DURATION = 6.0;

// Apply pace to a slot's defaultDuration. Used by both preview and renderer.
export function scaleSlotDuration(
  defaultDuration: number,
  pace: PaceId,
  sourceClipDuration: number = SOURCE_CLIP_DURATION
): number {
  const scaled = defaultDuration * PACE_PRESETS[pace];
  return Math.max(MIN_SCALED_DURATION, Math.min(scaled, sourceClipDuration));
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export type PresetInputKind =
  | "price_pair"
  | "price_single"
  | "day_time";

export type PresetInputDef = {
  kind: PresetInputKind;
  required: boolean;
};

export type PresetInputs = {
  newPrice?: string;
  oldPrice?: string;
  day?: string;
  time?: string;
  showRsvpHint?: boolean;
};

// ─── Preset ───────────────────────────────────────────────────────────────────

export type PresetSpec = {
  id: RemixPresetId;
  displayName: string;
  description: string;
  durationTarget: [number, number];
  outputSizeDefault: "square" | "landscape" | "portrait";
  musicVibeDefault: string;
  transitionDefault: { kind: "xfade"; duration: number };
  slots: SlotSpec[];
  maxExtraSlots: number;
  inputs: PresetInputDef[];
  introSupported: boolean;
  cardTheme: { gradientFrom: string; gradientTo: string };
};

// ─── Draft metadata ───────────────────────────────────────────────────────────

export type PresetDraftMeta = {
  id: RemixPresetId;
  inputs: PresetInputs;
  extraSlotsCount: number;
  pace: PaceId; // per-draft pace (Fast/Medium/Slow)
};

// Compute the duration for an EXTRA slot (one the agent appended beyond the
// preset's base slots). We use the average of the preset's slot durations so
// the extra matches the preset's overall pacing rhythm. Then pace is applied.
export function extraSlotDuration(presetId: RemixPresetId, pace: PaceId): number {
  const preset = PRESETS[presetId];
  const avg =
    preset.slots.reduce((sum, s) => sum + s.defaultDuration, 0) /
    preset.slots.length;
  return scaleSlotDuration(avg, pace);
}

// Caption easing — Material standard per handoff Q1.
export const CAPTION_EASING_IN = "cubic-bezier(0.4, 0, 0.2, 1)";
export const CAPTION_FADE_OUT_SECONDS = 0.3;

// ─── PRESETS ──────────────────────────────────────────────────────────────────
//
// All durations are at pace=1.0 (Medium). See PACING DOCTRINE at top of file.

export const PRESETS: Record<RemixPresetId, PresetSpec> = {
  // ── Just Listed ─────────────────────────────────────────────────────────
  // 6 slots. Stops the scroll on social.
  // Medium pace timing: 2.5 + (2.2×4) + 3.5 = 14.8s
  // Fast pace: ~11.1s. Slow pace: ~20.7s.
  just_listed: {
    id: "just_listed",
    displayName: "Just Listed",
    description: "Announce a new listing with maximum hook.",
    durationTarget: [13, 17],
    outputSizeDefault: "portrait",
    musicVibeDefault: "upbeat_modern",
    transitionDefault: { kind: "xfade", duration: 0.3 },
    maxExtraSlots: 3,
    introSupported: true,
    cardTheme: { gradientFrom: "#a855f7", gradientTo: "#ec4899" },
    inputs: [{ kind: "price_single", required: true }],
    slots: [
      // 1. Exterior wide / aerial if available — JUST LISTED hero badge.
      // Hero hits in 1s. Slot lasts 2.5s — title lands, scene establishes.
      {
        meaning: "exterior_aerial_preferred",
        defaultDuration: 2.5,
        caption: {
          kind: "hero_badge",
          text: "JUST LISTED",
          heroDuration: 1.0,
          shrinkToChip: "top-left",
        },
        zoom: { from: 1.0, to: 1.06, ease: "easeOut" },
      },
      // 2. Kitchen — address line.
      {
        meaning: "kitchen",
        defaultDuration: 2.2,
        caption: { kind: "address_line", fadeAfter: 1.5 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 3. Living room — room name.
      {
        meaning: "living_room",
        defaultDuration: 2.2,
        caption: { kind: "room_name", sourceField: "label", fadeAfter: 1.2 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 4. Primary bedroom — room name.
      {
        meaning: "primary_bedroom",
        defaultDuration: 2.2,
        caption: { kind: "room_name", sourceField: "label", fadeAfter: 1.2 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 5. Primary bath — room name.
      {
        meaning: "primary_bath",
        defaultDuration: 2.2,
        caption: { kind: "room_name", sourceField: "label", fadeAfter: 1.2 },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      // 6. Backyard / feature — animated price reveal.
      {
        meaning: "backyard_feature",
        defaultDuration: 3.5,
        caption: { kind: "price_reveal", animateInDuration: 1.5 },
        zoom: { from: 1.0, to: 1.08, ease: "easeOut" },
        speedRamp: { fromRate: 1.0, toRate: 1.4, startAt: 2.7, endAt: 3.5 },
        frameFreeze: { duration: 0.4 },
      },
    ],
  },

  // ── Open House Teaser ───────────────────────────────────────────────────
  // Medium pace timing: 3.0 + (2.8×4) + 2.5 = 16.7s
  open_house: {
    id: "open_house",
    displayName: "Open House",
    description: "Drive attendance to a specific date and time.",
    durationTarget: [15, 19],
    outputSizeDefault: "portrait",
    musicVibeDefault: "energetic_pop",
    transitionDefault: { kind: "xfade", duration: 0.25 },
    maxExtraSlots: 3,
    introSupported: false,
    cardTheme: { gradientFrom: "#f97316", gradientTo: "#fbbf24" },
    inputs: [{ kind: "day_time", required: true }],
    slots: [
      // 1. Exterior — OPEN HOUSE badge + day/time hero.
      {
        meaning: "exterior",
        defaultDuration: 3.0,
        caption: {
          kind: "hero_badge",
          text: "OPEN HOUSE",
          heroDuration: 1.5,
          shrinkToChip: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "easeOut" },
      },
      {
        meaning: "kitchen",
        defaultDuration: 2.8,
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
        defaultDuration: 2.8,
        caption: {
          kind: "sticky_banner",
          text: "OPEN HOUSE  ·  {day}  ·  {time}",
          position: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      {
        meaning: "primary_bedroom",
        defaultDuration: 2.8,
        caption: {
          kind: "sticky_banner",
          text: "OPEN HOUSE  ·  {day}  ·  {time}",
          position: "top-left",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      {
        meaning: "primary_bath",
        defaultDuration: 2.8,
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
        defaultDuration: 2.5,
        caption: { kind: "rsvp_hint", text: "RSVP via link in bio" },
        zoom: { from: 1.0, to: 1.05, ease: "easeOut" },
      },
    ],
  },

  // ── Quick Tour ──────────────────────────────────────────────────────────
  // 7 slots. Walkthrough story.
  // Medium pace timing: (2.8×6) + 4.0 = 20.8s
  quick_tour: {
    id: "quick_tour",
    displayName: "Quick Tour",
    description: "Virtual walkthrough, room by room.",
    durationTarget: [18, 24],
    outputSizeDefault: "portrait",
    musicVibeDefault: "chill_tropical",
    transitionDefault: { kind: "xfade", duration: 0.3 },
    maxExtraSlots: 3,
    introSupported: false,
    cardTheme: { gradientFrom: "#0ea5e9", gradientTo: "#14b8a6" },
    inputs: [],
    slots: [
      ...Array.from({ length: 7 }, (_, i) => {
        const isLast = i === 6;
        return {
          meaning: "walkthrough_any" as SlotMeaning,
          defaultDuration: isLast ? 4.0 : 2.8,
          caption: {
            kind: "room_name" as const,
            sourceField: "label" as const,
            fadeAfter: 1.5,
          },
          zoom: { from: 1.0, to: 1.05, ease: "linear" as const },
          jCutAudioOffset: i === 0 ? undefined : 0.4,
          speedRamp: isLast
            ? { fromRate: 1.0, toRate: 0.7, startAt: 3.0, endAt: 4.0 }
            : undefined,
        };
      }),
    ],
  },

  // ── Price Drop ──────────────────────────────────────────────────────────
  // 5 slots. Tightest, most urgent.
  // Medium pace timing: 2.0 + (2.2×3) + 3.0 = 11.6s
  price_drop: {
    id: "price_drop",
    displayName: "Price Drop",
    description: "Punchy, urgency-driven price-reduction announcement.",
    durationTarget: [10, 14],
    outputSizeDefault: "portrait",
    musicVibeDefault: "bold_cinematic",
    transitionDefault: { kind: "xfade", duration: 0.2 },
    maxExtraSlots: 3,
    introSupported: false,
    cardTheme: { gradientFrom: "#dc2626", gradientTo: "#f97316" },
    inputs: [{ kind: "price_pair", required: true }],
    slots: [
      // 1. Exterior — PRICE DROP slab smashes in fast. 0.8s hero.
      {
        meaning: "exterior",
        defaultDuration: 2.0,
        caption: {
          kind: "hero_badge",
          text: "PRICE DROP",
          heroDuration: 0.8,
          shrinkToChip: "top",
        },
        zoom: { from: 1.0, to: 1.1, ease: "easeOut" },
      },
      {
        meaning: "feature_room",
        defaultDuration: 2.2,
        caption: {
          kind: "sticky_banner",
          text: "WAS {oldPrice}  ·  NOW {newPrice}",
          position: "top",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      {
        meaning: "feature_room",
        defaultDuration: 2.2,
        caption: {
          kind: "sticky_banner",
          text: "WAS {oldPrice}  ·  NOW {newPrice}",
          position: "top",
        },
        zoom: { from: 1.0, to: 1.05, ease: "linear" },
      },
      {
        meaning: "outdoor_feature",
        defaultDuration: 2.2,
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
        caption: { kind: "address_line", fadeAfter: 2.2 },
        zoom: { from: 1.0, to: 1.08, ease: "easeOut" },
        speedRamp: { fromRate: 1.0, toRate: 1.3, startAt: 2.0, endAt: 3.0 },
      },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
//
// Real listing labels we've seen on production orders:
//   "Front Exterior", "Entryway", "Living Room", "Family Room", "Kitchen",
//   "Master Bedroom", "Master Bath", "Bedroom 2", "Bathroom 2",
//   "Dining Room", "Backyard", "Pool", "Patio"
//
// Both "Master ..." (legacy MLS) and "Primary ..." (modern MLS) match
// primary_bedroom / primary_bath. Caption display still uses the raw label.
//
// REGEX NOTE: `\bbed\b` does NOT match "bedroom" because there is no word
// boundary between "bed" and "room". Use `\bbed` (no trailing boundary) so
// both "bed" and "bedroom" match.
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
      // Trailing \b removed — "bedroom" has no word boundary between "bed"
      // and "room", so \bbed\b would miss it.
      return /\b(primary|master|owner'?s)\b.*\b(bed|suite)/.test(s);
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
      return !/\b(driveway|walkway|sidewalk)\b/.test(s);
    case "walkthrough_any":
      return true;
    case "best_or_aerial":
      return isAerial || /\b(exterior|backyard|pool|view|aerial)\b/.test(s);
    default:
      return false;
  }
}

// Secondary (looser) match used as a fallback when the strict matcher above
// finds nothing. Better to use a "Bedroom 2" clip for a Primary Bedroom slot
// than to fall through to a random non-aerial clip like "Entryway".
export function clipLooselyMatchesMeaning(
  label: string,
  isAerial: boolean,
  meaning: SlotMeaning
): boolean {
  if (!label) return false;
  const s = label.toLowerCase();

  switch (meaning) {
    case "primary_bedroom":
      return /\b(bed|suite)/.test(s);
    case "primary_bath":
      return /\b(bath|powder)/.test(s);
    case "bathroom":
      return /\b(bath|powder)/.test(s);
    case "exterior_aerial_preferred":
      return isAerial || /\b(yard|outdoor|driveway)\b/.test(s);
    case "backyard_feature":
    case "outdoor_feature":
      return /\b(yard|outdoor|driveway|landscape|porch|balcony)\b/.test(s);
    case "feature_room":
      return /\b(dining|family|great|den|office|study|library|foyer|hall|nook|loft)\b/.test(
        s
      );
    default:
      return false;
  }
}

// Anti-match: labels we should NEVER auto-pick for a given meaning, even as a
// last-resort fallback. Used by pickDefaultForSlot to skip "Entryway" when
// looking for a bedroom rather than picking it just because it was first.
export function clipShouldNotMatchMeaning(
  label: string,
  meaning: SlotMeaning
): boolean {
  if (!label) return false;
  const s = label.toLowerCase();

  switch (meaning) {
    case "primary_bedroom":
    case "primary_bath":
    case "bathroom":
      return /\b(exterior|front|facade|curb|driveway|entryway|entry|foyer|hallway)\b/.test(
        s
      );
    case "kitchen":
      return /\b(exterior|front|facade|curb|driveway|entryway|bath)\b/.test(s);
    case "living_room":
      return /\b(exterior|front|facade|curb|driveway|bath|bedroom)\b/.test(s);
    default:
      return false;
  }
}

// Slot is "aerial-preferring" — used by modal to suggest aerial clips first.
export function slotPrefersAerial(meaning: SlotMeaning): boolean {
  return meaning === "exterior_aerial_preferred" || meaning === "best_or_aerial";
}
