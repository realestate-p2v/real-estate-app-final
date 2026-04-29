"use client";
// components/remix-preset-modal.tsx
//
// Slot-assignment UX for Video Remix presets. Pure UI + state.
// Parent (app/dashboard/lens/remix/page.tsx) owns persistence — this modal
// emits an onGenerate callback with the chosen slots + inputs, and the parent
// builds a v2 draft, saves it, and loads it into the editor.
//
// Architecture notes:
// - Bottom sheet on mobile (<768px), centered modal on desktop. Q2 confirmed.
// - Drone-aware default for aerial-preferring slots.
// - Broken-clip fallback in default selection (skips ids in brokenClipIds).
// - "Auto-Fill" (Lens-only) — random valid clip per slot, drone-aware.
// - Manual mode escape — closes modal and emits onEditManually so parent can
//   load slots into the editor without preset metadata.
// - Switch-preset confirmation lives in the PARENT, not here. The modal
//   doesn't know about currentPresetMeta. It just opens cleanly.

import { useEffect, useMemo, useState } from "react";
import {
  X, Check, Plus, Film, Sparkles, AlertTriangle, Lock,
  ArrowRight, Shuffle, Pencil, ChevronDown,
} from "lucide-react";
import {
  PRESETS,
  RemixPresetId,
  PresetSpec,
  PresetInputs,
  SlotMeaning,
  clipMatchesMeaning,
  slotPrefersAerial,
} from "@/lib/remix-presets";

// ─── Types ────────────────────────────────────────────────────────────────────

// Source clip shape — matches what page.tsx already produces in
// remixClipSources[].clips[]. Flattened: parent passes a single array of clips
// from the selected property (and optionally cross-property fallbacks).
export type RemixSourceClip = {
  url: string;
  thumbnail: string | null;
  label: string;       // raw clip description from the order pipeline
  isAerial: boolean;
  orderId: string;
  orderDate: string;
  propertyDisplayName: string;  // for cross-property labeling in picker
};

// What the modal emits to parent on Generate. One entry per chosen slot,
// in slot order (extras appended at end). Parent maps these into RemixClips.
export type GeneratedSlot = {
  slotIndex: number;          // 0..N-1 for base slots, then base..base+extras
  isExtra: boolean;
  meaning: SlotMeaning | null; // null for extras
  source: RemixSourceClip;
};

export type GenerateResult = {
  slots: GeneratedSlot[];
  inputs: PresetInputs;
  // For naming the resulting draft.
  presetId: RemixPresetId;
  propertyDisplayName: string | null;
};

type Props = {
  presetId: RemixPresetId;
  // Clips of the currently selected property (preferred), pre-flattened.
  primaryClips: RemixSourceClip[];
  // Clips from ALL OTHER properties — used only when primary is short
  // and the agent opts into cross-property fill (Q8 path, NEVER black frames).
  crossPropertyClips: RemixSourceClip[];
  selectedPropertyDisplayName: string | null;
  brokenClipIds: Set<string>;     // page.tsx tracks these by RemixClip.id;
                                  // here we use sourceUrl as the equivalent key
  brokenSourceUrls: Set<string>;  // alternative key — pass either or both
  isLensSubscriber: boolean;
  onClose(): void;
  onGenerate(result: GenerateResult): void;
  // Manual-mode downgrade: close modal and pass the chosen slots without
  // preset metadata so the parent loads them as a vanilla manual draft.
  onEditManually(result: GenerateResult): void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Pick a default clip for a slot meaning, preferring:
// 1. aerial clips for aerial-preferring slots
// 2. label match via clipMatchesMeaning
// 3. fallback to any non-broken unused clip
// Returns null if no eligible clip exists (modal renders "Pick a clip").
function pickDefaultForSlot(
  meaning: SlotMeaning,
  pool: RemixSourceClip[],
  alreadyUsed: Set<string>,
  isBroken: (c: RemixSourceClip) => boolean
): RemixSourceClip | null {
  const available = pool.filter(
    (c) => !alreadyUsed.has(c.url) && !isBroken(c)
  );
  if (available.length === 0) return null;

  // Aerial-preferring: try aerial clips first.
  if (slotPrefersAerial(meaning)) {
    const aerial = available.find((c) => c.isAerial);
    if (aerial) return aerial;
  }

  const matched = available.find((c) =>
    clipMatchesMeaning(c.label, c.isAerial, meaning)
  );
  if (matched) return matched;

  // Last-resort fallback: first available clip that ISN'T aerial (preserve
  // aerials for slots that actually want them).
  const nonAerial = available.find((c) => !c.isAerial);
  return nonAerial || available[0];
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RemixPresetModal(props: Props) {
  const {
    presetId,
    primaryClips,
    crossPropertyClips,
    selectedPropertyDisplayName,
    brokenSourceUrls,
    isLensSubscriber,
    onClose,
    onGenerate,
    onEditManually,
  } = props;

  const preset: PresetSpec = PRESETS[presetId];
  const baseSlotCount = preset.slots.length;

  const [isMobile, setIsMobile] = useState(isMobileViewport());
  useEffect(() => {
    const handler = () => setIsMobile(isMobileViewport());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Chosen clip per base slot. null = "Pick a clip".
  const [chosen, setChosen] = useState<(RemixSourceClip | null)[]>([]);
  // Extras the agent appended (max preset.maxExtraSlots).
  const [extras, setExtras] = useState<RemixSourceClip[]>([]);

  // Inputs collected from the agent.
  const [inputs, setInputs] = useState<PresetInputs>({});

  // Are we using the cross-property pool? Toggled by the under-clip warning.
  const [useCrossProperty, setUseCrossProperty] = useState(false);

  // Currently-open clip picker (slot index, or null).
  // -1 means "extra slot" picker.
  const [pickerForSlot, setPickerForSlot] = useState<number | null>(null);

  const isBroken = (c: RemixSourceClip) => brokenSourceUrls.has(c.url);

  // Effective pool = primary (+ cross if opted in).
  const pool = useMemo(() => {
    return useCrossProperty
      ? [...primaryClips, ...crossPropertyClips]
      : primaryClips;
  }, [useCrossProperty, primaryClips, crossPropertyClips]);

  const eligiblePoolCount = useMemo(
    () => pool.filter((c) => !isBroken(c)).length,
    [pool, brokenSourceUrls]
  );

  // Initialize / re-initialize defaults whenever pool changes (i.e. cross
  // toggle flips) OR preset changes (preset is locked here, but defensive).
  useEffect(() => {
    const used = new Set<string>();
    const initial: (RemixSourceClip | null)[] = [];
    for (const slot of preset.slots) {
      const pick = pickDefaultForSlot(slot.meaning, pool, used, isBroken);
      if (pick) used.add(pick.url);
      initial.push(pick);
    }
    setChosen(initial);
    setExtras([]);
    // Don't reset inputs on cross-toggle; agent may have typed price already.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId, pool]);

  // Stats / warnings.
  const filledCount = chosen.filter(Boolean).length;
  const missing = baseSlotCount - filledCount;
  const underClipped = filledCount < baseSlotCount;

  // Validate inputs per preset.
  const inputsValid = useMemo(() => {
    for (const def of preset.inputs) {
      if (!def.required) continue;
      if (def.kind === "price_pair") {
        if (!inputs.oldPrice?.trim() || !inputs.newPrice?.trim()) return false;
      } else if (def.kind === "price_single") {
        if (!inputs.newPrice?.trim()) return false;
      } else if (def.kind === "day_time") {
        if (!inputs.day?.trim() || !inputs.time?.trim()) return false;
      }
    }
    return true;
  }, [preset.inputs, inputs]);

  const canGenerate = filledCount === baseSlotCount && inputsValid;

  // ── Auto-Fill (Lens-only) ──────────────────────────────────────────────
  // Random valid clip per slot, drone-aware on aerial slots, broken-aware.
  // Different from the default fill: random ordering of the pool, so subsequent
  // taps surface different combinations.
  const autoFill = () => {
    if (!isLensSubscriber) return;
    const used = new Set<string>();
    const shuffled = [...pool]
      .filter((c) => !isBroken(c))
      .sort(() => Math.random() - 0.5);
    const next: (RemixSourceClip | null)[] = [];
    for (const slot of preset.slots) {
      // First aerial if slot prefers it
      let pick: RemixSourceClip | undefined;
      if (slotPrefersAerial(slot.meaning)) {
        pick = shuffled.find((c) => c.isAerial && !used.has(c.url));
      }
      if (!pick) {
        pick = shuffled.find(
          (c) =>
            !used.has(c.url) &&
            clipMatchesMeaning(c.label, c.isAerial, slot.meaning)
        );
      }
      if (!pick) {
        pick = shuffled.find((c) => !used.has(c.url));
      }
      if (pick) used.add(pick.url);
      next.push(pick || null);
    }
    setChosen(next);
  };

  // ── Picker handlers ────────────────────────────────────────────────────
  const openPicker = (slotIdx: number) => setPickerForSlot(slotIdx);
  const closePicker = () => setPickerForSlot(null);
  const handlePick = (clip: RemixSourceClip) => {
    if (pickerForSlot === null) return;
    if (pickerForSlot === -1) {
      // Add as extra.
      setExtras((prev) => [...prev, clip]);
    } else {
      setChosen((prev) => {
        const next = [...prev];
        next[pickerForSlot] = clip;
        return next;
      });
    }
    setPickerForSlot(null);
  };

  const removeExtra = (idx: number) =>
    setExtras((prev) => prev.filter((_, i) => i !== idx));

  // ── Build result for emit ──────────────────────────────────────────────
  const buildResult = (): GenerateResult => {
    const slots: GeneratedSlot[] = [];
    chosen.forEach((c, i) => {
      if (c) {
        slots.push({
          slotIndex: i,
          isExtra: false,
          meaning: preset.slots[i].meaning,
          source: c,
        });
      }
    });
    extras.forEach((c, i) => {
      slots.push({
        slotIndex: baseSlotCount + i,
        isExtra: true,
        meaning: null,
        source: c,
      });
    });
    return {
      slots,
      inputs,
      presetId,
      propertyDisplayName: selectedPropertyDisplayName,
    };
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    onGenerate(buildResult());
  };

  const handleEditManually = () => {
    // Even if not all base slots are filled, we still emit what we have —
    // parent loads them into a manual timeline.
    onEditManually(buildResult());
  };

  // ── Styling tokens to match the rest of the app ────────────────────────
  const theme = preset.cardTheme;
  const wrapStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "92vh",
        background: "var(--sb)",
        borderRadius: "16px 16px 0 0",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(720px, 92vw)",
        maxHeight: "88vh",
        background: "var(--sb)",
        borderRadius: 16,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        border: "1px solid var(--sbr)",
      };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 99,
          backdropFilter: "blur(4px)",
        }}
      />
      <div style={wrapStyle} role="dialog" aria-modal="true">
        {/* Header */}
        <div
          style={{
            position: "relative",
            padding: "18px 20px 16px",
            borderBottom: "1px solid var(--sbr)",
            background: `linear-gradient(135deg, ${theme.gradientFrom}1a, ${theme.gradientTo}1a)`,
            borderRadius: isMobile ? "16px 16px 0 0" : "16px 16px 0 0",
            flexShrink: 0,
          }}
        >
          {isMobile && (
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.25)",
                margin: "0 auto 12px",
              }}
            />
          )}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 4px 16px ${theme.gradientFrom}55`,
              }}
            >
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--st)",
                  margin: 0,
                  fontFamily: "var(--sf)",
                }}
              >
                {preset.displayName}
              </h2>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--std)",
                  margin: 0,
                  marginTop: 3,
                  fontFamily: "var(--sf)",
                }}
              >
                {baseSlotCount} clips · ~
                {Math.round(
                  (preset.durationTarget[0] + preset.durationTarget[1]) / 2
                )}
                s · {preset.outputSizeDefault}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid var(--sbr)",
                background: "rgba(255,255,255,0.04)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--std)",
                flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Auto-Fill bar (Lens-only) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 10,
              background: isLensSubscriber
                ? "rgba(99,102,241,0.08)"
                : "rgba(255,255,255,0.03)",
              border: isLensSubscriber
                ? "1px solid rgba(99,102,241,0.25)"
                : "1px solid var(--sbr)",
            }}
          >
            <Shuffle
              size={14}
              color={isLensSubscriber ? "var(--sa)" : "var(--std)"}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--st)",
                  margin: 0,
                  fontFamily: "var(--sf)",
                }}
              >
                Auto-Fill {!isLensSubscriber && <Lock size={9} style={{ marginLeft: 4, marginBottom: -1 }} />}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--std)",
                  margin: 0,
                  marginTop: 1,
                  fontFamily: "var(--sf)",
                }}
              >
                {isLensSubscriber
                  ? "Pick clips for every slot in one tap. Tap again to reshuffle."
                  : "Lens subscribers can fill every slot in one tap."}
              </p>
            </div>
            <button
              onClick={autoFill}
              disabled={!isLensSubscriber || eligiblePoolCount === 0}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background:
                  isLensSubscriber && eligiblePoolCount > 0
                    ? "var(--sa)"
                    : "rgba(255,255,255,0.06)",
                color:
                  isLensSubscriber && eligiblePoolCount > 0
                    ? "#fff"
                    : "var(--std)",
                fontSize: 11,
                fontWeight: 700,
                cursor:
                  isLensSubscriber && eligiblePoolCount > 0
                    ? "pointer"
                    : "not-allowed",
                fontFamily: "var(--sf)",
                flexShrink: 0,
              }}
            >
              Auto-Fill
            </button>
          </div>

          {/* Under-clipped warning */}
          {underClipped && (
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <AlertTriangle
                size={14}
                color="#f59e0b"
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#f59e0b",
                    margin: 0,
                    fontFamily: "var(--sf)",
                  }}
                >
                  {missing} slot{missing !== 1 ? "s" : ""} need a clip
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--std)",
                    margin: 0,
                    marginTop: 2,
                    lineHeight: 1.5,
                    fontFamily: "var(--sf)",
                  }}
                >
                  This property doesn't have enough clips for{" "}
                  {preset.displayName}. Pick clips manually below, allow clips
                  from other properties, or switch to manual mode.
                </p>
                {!useCrossProperty && crossPropertyClips.length > 0 && (
                  <button
                    onClick={() => setUseCrossProperty(true)}
                    style={{
                      marginTop: 8,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(245,158,11,0.4)",
                      background: "rgba(245,158,11,0.1)",
                      color: "#f59e0b",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--sf)",
                    }}
                  >
                    Allow clips from other properties (
                    {crossPropertyClips.length} available)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Inputs (price, day/time) */}
          {preset.inputs.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--sbr)",
              }}
            >
              {preset.inputs.map((def, i) => {
                if (def.kind === "price_single") {
                  return (
                    <div key={i}>
                      <label
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--std)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontFamily: "var(--sf)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Price {def.required && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <input
                        className="fi"
                        value={inputs.newPrice || ""}
                        onChange={(e) =>
                          setInputs((p) => ({ ...p, newPrice: e.target.value }))
                        }
                        placeholder="$1,250,000"
                      />
                    </div>
                  );
                }
                if (def.kind === "price_pair") {
                  return (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--std)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontFamily: "var(--sf)",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Was {def.required && <span style={{ color: "#ef4444" }}>*</span>}
                        </label>
                        <input
                          className="fi"
                          value={inputs.oldPrice || ""}
                          onChange={(e) =>
                            setInputs((p) => ({ ...p, oldPrice: e.target.value }))
                          }
                          placeholder="$1,400,000"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--std)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontFamily: "var(--sf)",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Now {def.required && <span style={{ color: "#ef4444" }}>*</span>}
                        </label>
                        <input
                          className="fi"
                          value={inputs.newPrice || ""}
                          onChange={(e) =>
                            setInputs((p) => ({ ...p, newPrice: e.target.value }))
                          }
                          placeholder="$1,250,000"
                        />
                      </div>
                    </div>
                  );
                }
                if (def.kind === "day_time") {
                  return (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--std)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontFamily: "var(--sf)",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Day {def.required && <span style={{ color: "#ef4444" }}>*</span>}
                        </label>
                        <input
                          className="fi"
                          value={inputs.day || ""}
                          onChange={(e) =>
                            setInputs((p) => ({ ...p, day: e.target.value }))
                          }
                          placeholder="Saturday"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--std)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontFamily: "var(--sf)",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Time {def.required && <span style={{ color: "#ef4444" }}>*</span>}
                        </label>
                        <input
                          className="fi"
                          value={inputs.time || ""}
                          onChange={(e) =>
                            setInputs((p) => ({ ...p, time: e.target.value }))
                          }
                          placeholder="1–3 PM"
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
              {presetId === "open_house" && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    color: "var(--st)",
                    fontFamily: "var(--sf)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={inputs.showRsvpHint ?? true}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, showRsvpHint: e.target.checked }))
                    }
                  />
                  Show "RSVP via link in bio" hint on closing slot
                </label>
              )}
            </div>
          )}

          {/* Slot rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {preset.slots.map((slot, i) => {
              const c = chosen[i];
              const slotLabel = humanLabelForMeaning(slot.meaning);
              const aerialPref = slotPrefersAerial(slot.meaning);
              return (
                <SlotRow
                  key={i}
                  index={i + 1}
                  slotLabel={slotLabel}
                  aerialPref={aerialPref}
                  clip={c}
                  onChange={() => openPicker(i)}
                  onClear={() =>
                    setChosen((prev) => {
                      const next = [...prev];
                      next[i] = null;
                      return next;
                    })
                  }
                />
              );
            })}

            {/* Extras */}
            {extras.map((c, i) => (
              <SlotRow
                key={`extra-${i}`}
                index={baseSlotCount + i + 1}
                slotLabel="Extra clip"
                aerialPref={false}
                clip={c}
                isExtra
                onChange={() => {
                  // Replace extra: open picker tagged as "extra at index i"
                  // We use the simpler approach of remove+re-add for now.
                  removeExtra(i);
                  setPickerForSlot(-1);
                }}
                onClear={() => removeExtra(i)}
              />
            ))}

            {/* Add-extra button */}
            {extras.length < preset.maxExtraSlots && (
              <button
                onClick={() => setPickerForSlot(-1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px dashed var(--sbr)",
                  background: "rgba(255,255,255,0.02)",
                  color: "var(--std)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--sf)",
                }}
              >
                <Plus size={12} />
                Add another clip ({extras.length} of {preset.maxExtraSlots})
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 20px",
            borderTop: "1px solid var(--sbr)",
            background: "rgba(0,0,0,0.18)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleEditManually}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--sbr)",
              background: "none",
              color: "var(--std)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--sf)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Pencil size={12} />
            Edit manually
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: canGenerate
                ? `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`
                : "rgba(255,255,255,0.06)",
              color: canGenerate ? "#fff" : "var(--std)",
              fontSize: 12,
              fontWeight: 700,
              cursor: canGenerate ? "pointer" : "not-allowed",
              fontFamily: "var(--sf)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: canGenerate
                ? `0 4px 16px ${theme.gradientFrom}55`
                : "none",
            }}
          >
            Generate
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Clip picker drawer (rendered above modal body when open) */}
        {pickerForSlot !== null && (
          <ClipPicker
            pool={pool}
            brokenSourceUrls={brokenSourceUrls}
            slotMeaning={
              pickerForSlot >= 0 ? preset.slots[pickerForSlot].meaning : null
            }
            crossPropertyEnabled={useCrossProperty}
            onPick={handlePick}
            onClose={closePicker}
          />
        )}
      </div>
    </>
  );
}

// ─── SlotRow ──────────────────────────────────────────────────────────────────

function SlotRow({
  index,
  slotLabel,
  aerialPref,
  clip,
  isExtra,
  onChange,
  onClear,
}: {
  index: number;
  slotLabel: string;
  aerialPref: boolean;
  clip: RemixSourceClip | null;
  isExtra?: boolean;
  onChange(): void;
  onClear(): void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid var(--sbr)",
        background: clip
          ? "rgba(255,255,255,0.03)"
          : "rgba(245,158,11,0.06)",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: "rgba(255,255,255,0.06)",
          color: "var(--std)",
          fontSize: 11,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: "var(--sf)",
        }}
      >
        {index}
      </div>
      <div
        style={{
          width: 56,
          height: 36,
          borderRadius: 6,
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {clip?.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Film size={14} color="rgba(255,255,255,0.18)" />
        )}
        {clip?.isAerial && (
          <div
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              padding: "1px 4px",
              borderRadius: 3,
              background: "rgba(8,145,178,0.85)",
              fontSize: 7,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.05em",
            }}
          >
            AIR
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--st)",
            margin: 0,
            fontFamily: "var(--sf)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clip ? clip.label : `Pick a ${slotLabel.toLowerCase()} clip`}
          {isExtra && (
            <span
              style={{
                marginLeft: 6,
                padding: "1px 5px",
                borderRadius: 4,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "var(--std)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              EXTRA
            </span>
          )}
        </p>
        <p
          style={{
            fontSize: 9,
            color: "var(--std)",
            margin: 0,
            marginTop: 1,
            fontFamily: "var(--sf)",
          }}
        >
          Slot {index} · {slotLabel}
          {aerialPref && " · prefers aerial"}
          {clip?.propertyDisplayName && ` · ${clip.propertyDisplayName}`}
        </p>
      </div>
      <button
        onClick={onChange}
        style={{
          padding: "5px 9px",
          borderRadius: 6,
          border: "1px solid var(--sbr)",
          background: "rgba(255,255,255,0.04)",
          color: "var(--st)",
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "var(--sf)",
          flexShrink: 0,
        }}
      >
        {clip ? "Change" : "Pick"}
      </button>
      {clip && (
        <button
          onClick={onClear}
          aria-label="Remove clip"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            border: "1px solid var(--sbr)",
            background: "rgba(255,255,255,0.02)",
            cursor: "pointer",
            color: "var(--std)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// ─── ClipPicker drawer ────────────────────────────────────────────────────────

function ClipPicker({
  pool,
  brokenSourceUrls,
  slotMeaning,
  crossPropertyEnabled,
  onPick,
  onClose,
}: {
  pool: RemixSourceClip[];
  brokenSourceUrls: Set<string>;
  slotMeaning: SlotMeaning | null;
  crossPropertyEnabled: boolean;
  onPick(c: RemixSourceClip): void;
  onClose(): void;
}) {
  const [filterAerial, setFilterAerial] = useState(false);
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});

  // Sort: matched-by-meaning first, then aerials (if slot prefers), then rest.
  const sorted = useMemo(() => {
    const eligible = pool.filter((c) => !brokenSourceUrls.has(c.url));
    const filtered = filterAerial ? eligible.filter((c) => c.isAerial) : eligible;
    if (!slotMeaning) return filtered;
    const score = (c: RemixSourceClip) => {
      if (slotPrefersAerial(slotMeaning) && c.isAerial) return 0;
      if (clipMatchesMeaning(c.label, c.isAerial, slotMeaning)) return 1;
      return 2;
    };
    return [...filtered].sort((a, b) => score(a) - score(b));
  }, [pool, brokenSourceUrls, filterAerial, slotMeaning]);

  // Group by property for clarity when cross-property is enabled.
  const groups = useMemo(() => {
    const map = new Map<string, RemixSourceClip[]>();
    for (const c of sorted) {
      const k = c.propertyDisplayName || "Unknown";
      const arr = map.get(k) || [];
      arr.push(c);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [sorted]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(15,15,20,0.96)",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        borderRadius: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 20px",
          borderBottom: "1px solid var(--sbr)",
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "var(--st)",
            margin: 0,
            flex: 1,
            fontFamily: "var(--sf)",
          }}
        >
          Pick a clip
        </p>
        {slotMeaning && slotPrefersAerial(slotMeaning) && (
          <button
            onClick={() => setFilterAerial((v) => !v)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: filterAerial
                ? "1px solid rgba(8,145,178,0.6)"
                : "1px solid var(--sbr)",
              background: filterAerial ? "rgba(8,145,178,0.15)" : "none",
              color: filterAerial ? "#22d3ee" : "var(--std)",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--sf)",
            }}
          >
            Aerial only
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close picker"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "1px solid var(--sbr)",
            background: "rgba(255,255,255,0.04)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--std)",
          }}
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
        {sorted.length === 0 ? (
          <div
            style={{
              padding: "40px 0",
              textAlign: "center",
              color: "var(--std)",
              fontSize: 12,
              fontFamily: "var(--sf)",
            }}
          >
            No clips available.
          </div>
        ) : crossPropertyEnabled && groups.length > 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {groups.map(([propName, clips], gi) => {
              const isOpen = groupOpen[propName] ?? gi === 0;
              return (
                <div key={propName}>
                  <button
                    onClick={() =>
                      setGroupOpen((p) => ({ ...p, [propName]: !isOpen }))
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "6px 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--st)",
                      fontFamily: "var(--sf)",
                    }}
                  >
                    <ChevronDown
                      size={12}
                      style={{
                        transform: isOpen ? "none" : "rotate(-90deg)",
                        transition: "transform 0.15s",
                      }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 700, flex: 1, textAlign: "left" }}>
                      {propName}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--std)", fontWeight: 600 }}>
                      {clips.length}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        marginTop: 6,
                      }}
                    >
                      {clips.map((c, ci) => (
                        <PickerCard key={`${c.url}-${ci}`} clip={c} onPick={onPick} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
            }}
          >
            {sorted.map((c, ci) => (
              <PickerCard key={`${c.url}-${ci}`} clip={c} onPick={onPick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PickerCard({
  clip,
  onPick,
}: {
  clip: RemixSourceClip;
  onPick(c: RemixSourceClip): void;
}) {
  return (
    <button
      onClick={() => onPick(clip)}
      style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--sbr)",
        background: "rgba(255,255,255,0.02)",
        cursor: "pointer",
        padding: 0,
        fontFamily: "var(--sf)",
        textAlign: "left",
      }}
    >
      <div
        style={{
          aspectRatio: "16/9",
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        {clip.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Film size={20} color="rgba(255,255,255,0.18)" />
          </div>
        )}
        {clip.isAerial && (
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              padding: "1px 5px",
              borderRadius: 3,
              background: "rgba(8,145,178,0.85)",
              fontSize: 8,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.05em",
            }}
          >
            AERIAL
          </div>
        )}
      </div>
      <div style={{ padding: "5px 7px" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--st)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clip.label}
        </p>
        <p
          style={{
            fontSize: 9,
            color: "var(--std)",
            margin: 0,
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clip.propertyDisplayName}
        </p>
      </div>
    </button>
  );
}

// ─── Slot meaning → human label for UI ────────────────────────────────────────
function humanLabelForMeaning(m: SlotMeaning): string {
  switch (m) {
    case "exterior_aerial_preferred":
      return "Exterior (aerial preferred)";
    case "exterior":
      return "Exterior";
    case "kitchen":
      return "Kitchen";
    case "living_room":
      return "Living room";
    case "primary_bedroom":
      return "Primary bedroom";
    case "primary_bath":
      return "Primary bath";
    case "bathroom":
      return "Bathroom";
    case "backyard_feature":
      return "Backyard / feature";
    case "outdoor_feature":
      return "Outdoor space";
    case "feature_room":
      return "Feature room";
    case "walkthrough_any":
      return "Walkthrough";
    case "best_or_aerial":
      return "Best clip";
    default:
      return "Clip";
  }
}
