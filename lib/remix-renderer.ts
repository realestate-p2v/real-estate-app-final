// lib/remix-renderer.ts
//
// Video Remix preset renderer. Builds an FFmpeg filter chain from a preset
// draft and runs the encode. Replaces the inline `exportRemix` chain for
// preset-driven drafts (manual drafts continue to use the old chain).
//
// ── Architectural rule (handoff §4) ──────────────────────────────────────────
// Each slot produces a SlotFragment with its own video/audio stream labels.
// v1 transformations: trim, zoompan, drawtext (captions). v1.1 plug-ins
// (J-cuts, speed ramps, beat sync, frame freeze, match cuts, motion blur,
// SFX) become additional fragment ops gated by feature flags. The stitcher
// is independent of the fragment ops, so adding v1.1 features = adding ops,
// not rewriting the stitcher.
//
// ── What this file owns ──────────────────────────────────────────────────────
// - Filter chain assembly (filter_complex)
// - Input arg ordering (-i clip_0.mp4 etc)
// - Output args (codec, preset, crf, etc)
// - Caption drawing (drawtext with time-gated `enable=between(t,a,b)`)
// - Two-line wrap for long address text (no truncation per Q10)
// - Music trim + fadeout
// - Token resolution for caption text ({day}/{time}/{oldPrice}/{newPrice}/address)
//
// ── What this file does NOT own ──────────────────────────────────────────────
// - FFmpeg WASM loading (caller provides loaded instance)
// - File I/O (caller writes input files, reads output file)
// - HTTP fetching (caller already proxied + wrote files)
// - Progress UI (caller passes callbacks)
// - Personal intro audio chain (v1.1 — Just Listed only)
//
// Public API:
//   renderPresetExport({ ffmpeg, draftClips, preset, presetMeta, branding,
//                        outputSize, hasMusic, totalDurationSec, onProgress,
//                        onStatus }) → Promise<Blob>

import {
  PresetSpec,
  PresetDraftMeta,
  PresetInputs,
  SlotSpec,
  SlotCaption,
  PaceId,
  scaleSlotDuration,
  extraSlotDuration,
  SOURCE_CLIP_DURATION,
} from "./remix-presets";

// ─── Types ────────────────────────────────────────────────────────────────────

// Subset of ffmpeg.wasm we use. Typing it here avoids importing @ffmpeg/ffmpeg
// types into every consumer (they pull DOM types and slow tsc).
export type FFmpegLike = {
  exec(args: string[]): Promise<number>;
  readFile(path: string): Promise<Uint8Array | string>;
  writeFile(path: string, data: Uint8Array | string): Promise<boolean>;
};

// Branding tokens passed in by the caller. All optional — caller resolves
// fallbacks (e.g. fontFamily defaults to system sans).
export type RenderBranding = {
  fontFamily: string;
  accentColor: string;
  barColor: string;
  address: string;       // for {address} token in captions
};

// One clip on the timeline. Mirrors RemixClip in page.tsx but without UI fields.
export type RenderClip = {
  // Path of the file already written to FFmpeg's virtual FS (e.g. "clip_0.mp4")
  fsPath: string;
  trimStart: number;
  trimEnd: number;
  // Raw label from the order pipeline. Used for room_name captions.
  label: string;
  isAerial: boolean;
};

export type RenderArgs = {
  ffmpeg: FFmpegLike;
  preset: PresetSpec;
  presetMeta: PresetDraftMeta;
  // Slot order — base slots first, then extras. Length should match the
  // sum of preset.slots.length + presetMeta.extraSlotsCount.
  draftClips: RenderClip[];
  branding: RenderBranding;
  // Output dimensions (from REMIX_SIZES in page.tsx).
  outputSize: { width: number; height: number };
  // True if caller has already written music.mp3 to FS.
  hasMusic: boolean;
  // Path inside FFmpeg's virtual FS to a TTF font file. Caller is responsible
  // for fetching + writing the font BEFORE calling renderPresetExport.
  // FFmpeg 5.x's drawtext filter requires an explicit font path — there is
  // no system font fallback in WASM. Defaults to "font.ttf" if omitted.
  fontFilePath?: string;
  // Output filename in the FFmpeg virtual FS.
  outputPath?: string;
  onProgress?(pct: number): void;
  onStatus?(msg: string): void;
};

// SlotFragment = the output of buildSlotFragment(). Contains the filter chain
// fragment for ONE slot's video processing, plus its declared output stream
// label and its target on-screen duration. The stitcher consumes these.
type SlotFragment = {
  // The filter chain text for this slot (e.g. `[0:v]trim=...,scale=...[v0]`)
  filterText: string;
  // The output video stream label (e.g. `[v0]`). Used by stitcher.
  outLabel: string;
  // Effective duration after pace scaling (used for xfade offset math).
  effectiveDuration: number;
  // Index of this slot in the input args (matches the FFmpeg `-i` index).
  inputIdx: number;
};

// ─── drawtext escaping ────────────────────────────────────────────────────────
//
// FFmpeg's drawtext filter has BRUTAL escaping rules. Special chars in text
// must be backslashed. Outside text= the value, certain chars (`:` `'` `\`)
// also need escaping. We use the `textfile=` approach for anything complex,
// but for simple captions we escape inline.
//
// Escapable in `text=`:
//   ' \ % :
// Inside the filter, comma `,` separates filter options, so commas in the
// text must be escaped too (`\\,` because the filter string is double-parsed
// when passed to -filter_complex via argv).
function escapeDrawtext(s: string): string {
  if (!s) return "";
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,")
    .replace(/%/g, "\\%");
}

// Resolve {day}/{time}/{oldPrice}/{newPrice}/{address} tokens in a sticky
// banner or other caption text. Tokens for missing values render as empty
// (caller is responsible for validating required inputs in the modal).
function resolveCaptionTokens(
  text: string,
  inputs: PresetInputs,
  address: string
): string {
  return text
    .replace(/\{day\}/g, inputs.day || "")
    .replace(/\{time\}/g, inputs.time || "")
    .replace(/\{oldPrice\}/g, inputs.oldPrice || "")
    .replace(/\{newPrice\}/g, inputs.newPrice || "")
    .replace(/\{address\}/g, address || "");
}

// ─── Two-line wrap for long text ──────────────────────────────────────────────
//
// drawtext doesn't wrap. For the address line, if the text is too long for
// 90% of frame width at our chosen font size, break it into two lines on a
// space boundary. We pick the break point that minimizes |line1.length - line2.length|.
// Caller draws line1 and line2 as separate drawtext layers stacked vertically.
//
// Char-width estimate is rough (we don't have a real font metric in the FFmpeg
// renderer). We use 0.55em as a working proxy for proportional sans, which is
// conservative — a too-wide estimate causes over-wrapping (acceptable). A
// too-narrow estimate causes overflow (bad). 0.55 errs on the safe side.
function maybeWrapTwoLines(
  text: string,
  fontSize: number,
  maxWidth: number
): string[] {
  const charProxy = fontSize * 0.55;
  const estWidth = text.length * charProxy;
  if (estWidth <= maxWidth) return [text];

  // Find best split point.
  const words = text.split(" ");
  if (words.length < 2) return [text]; // can't split a single word; let it overflow

  let bestIdx = -1;
  let bestDelta = Infinity;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(" ");
    const right = words.slice(i).join(" ");
    const delta = Math.abs(left.length - right.length);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) return [text];
  return [words.slice(0, bestIdx).join(" "), words.slice(bestIdx).join(" ")];
}

// ─── Color helpers ────────────────────────────────────────────────────────────
//
// drawtext uses `fontcolor=` with hex like `0xFFFFFF` (no leading #) and
// `fontcolor=white@0.85` for alpha. We accept #RRGGBB and convert.
function hexToFFColor(hex: string): string {
  const c = hex.replace(/^#/, "").toUpperCase();
  if (c.length === 6) return `0x${c}`;
  return "0xFFFFFF";
}

function isLightHex(hex: string): boolean {
  const c = hex.replace(/^#/, "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

// ─── Caption rendering ────────────────────────────────────────────────────────
//
// Each caption emits one or more `drawtext` filter clauses appended to the
// slot's filter chain. Time-gating is via `enable='between(t,start,end)'` so
// captions appear/disappear without needing extra streams.
//
// Coordinates: x=center → `(w-text_w)/2`. y=top → `h*0.07`. Etc.
// Font size is computed from frame height at render time (responsive).
//
// Caption styling derives from branding tokens:
//   - hero badge → padded pill in accentColor
//   - address line / room name → white text + dark text shadow
//   - sticky banner → narrow bar across top with accent backdrop

type CaptionContext = {
  outW: number;
  outH: number;
  branding: RenderBranding;
  inputs: PresetInputs;
  // Slot's effective on-screen duration (post pace scaling). Used to compute
  // caption end times relative to slot start.
  slotDuration: number;
  // Path to TTF font in FFmpeg's virtual FS. drawtext requires this.
  fontFilePath: string;
};

function buildCaptionFilters(
  caption: SlotCaption | null,
  ctx: CaptionContext,
  clipLabel: string
): string[] {
  if (!caption) return [];

  const { outW, outH, branding, inputs, slotDuration, fontFilePath } = ctx;
  const accent = branding.accentColor || "#A855F7";
  const bar = branding.barColor || "#111827";
  const fontFamily = branding.fontFamily || "sans-serif";
  // FFmpeg drawtext doesn't accept arbitrary fontFamily — it needs a font
  // FILE path. WASM build of FFmpeg ships with default sans. We can't reliably
  // load custom fonts in the browser. So fontFamily is effectively a hint
  // we pass into `font=` (some builds support font name resolution, most don't).
  // We rely on the default and let the rest of the styling carry the brand.
  void fontFamily;

  const txtFilters: string[] = [];

  switch (caption.kind) {
    case "hero_badge": {
      const fontSize = Math.round(outH * 0.075);
      const padX = Math.round(outW * 0.04);
      const padY = Math.round(fontSize * 0.35);
      // boxborderw in FFmpeg 5.x only accepts a single int (uniform border).
      // Average the intended H/V pad — slightly tighter sides, slightly more
      // top/bottom, but visually within ~10px of the design intent.
      const padHero = Math.round((padX + padY) / 2);
      const pillBg = hexToFFColor(accent);
      const pillTxt = isLightHex(accent) ? "0x111111" : "0xFFFFFF";
      const text = escapeDrawtext(caption.text);
      const heroEnd = Math.min(caption.heroDuration, slotDuration);
      // Center the badge for the heroDuration window.
      txtFilters.push(
        `drawtext=fontfile=${fontFilePath}:text='${text}':` +
          `fontsize=${fontSize}:` +
          `fontcolor=${pillTxt}:` +
          `x=(w-text_w)/2:y=(h-text_h)/2:` +
          `box=1:boxcolor=${pillBg}:boxborderw=${padHero}:` +
          `enable='between(t,0,${heroEnd.toFixed(2)})'`
      );
      // After hero window, optionally shrink to a corner chip.
      if (caption.shrinkToChip) {
        const chipFontSize = Math.round(fontSize * 0.42);
        const chipPadX = Math.round(chipFontSize * 0.5);
        const chipPadY = Math.round(chipFontSize * 0.3);
        const chipPad = Math.round((chipPadX + chipPadY) / 2);
        let cx = "(w-text_w)/2", cy = "h*0.05";
        if (caption.shrinkToChip === "top-left") {
          cx = `${Math.round(outW * 0.04)}`;
          cy = `${Math.round(outH * 0.05)}`;
        } else if (caption.shrinkToChip === "top") {
          cx = "(w-text_w)/2";
          cy = `${Math.round(outH * 0.05)}`;
        }
        txtFilters.push(
          `drawtext=fontfile=${fontFilePath}:text='${text}':` +
            `fontsize=${chipFontSize}:` +
            `fontcolor=${pillTxt}:` +
            `x=${cx}:y=${cy}:` +
            `box=1:boxcolor=${pillBg}:boxborderw=${chipPad}:` +
            `enable='between(t,${heroEnd.toFixed(2)},${slotDuration.toFixed(2)})'`
        );
      }
      break;
    }

    case "address_line": {
      const fontSize = Math.round(outH * 0.038);
      const text = branding.address || "";
      if (!text) break;
      const maxW = Math.round(outW * 0.9);
      const lines = maybeWrapTwoLines(text, fontSize, maxW);
      const lineH = Math.round(fontSize * 1.25);
      // Bottom-left, two lines stacked.
      lines.forEach((ln, i) => {
        const y = outH - Math.round(outH * 0.08) - (lines.length - 1 - i) * lineH;
        const fadeEnd = Math.min(caption.fadeAfter, slotDuration);
        txtFilters.push(
          `drawtext=fontfile=${fontFilePath}:text='${escapeDrawtext(ln)}':` +
            `fontsize=${fontSize}:fontcolor=white:` +
            `x=${Math.round(outW * 0.05)}:y=${y}:` +
            `shadowcolor=black@0.6:shadowx=2:shadowy=2:` +
            `enable='between(t,0,${fadeEnd.toFixed(2)})'`
        );
      });
      break;
    }

    case "room_name": {
      const fontSize = Math.round(outH * 0.034);
      const text = clipLabel || "";
      if (!text) break;
      const fadeEnd = Math.min(caption.fadeAfter, slotDuration);
      txtFilters.push(
        `drawtext=fontfile=${fontFilePath}:text='${escapeDrawtext(text)}':` +
          `fontsize=${fontSize}:fontcolor=white:` +
          `x=${Math.round(outW * 0.05)}:y=${outH - Math.round(outH * 0.08)}:` +
          `shadowcolor=black@0.6:shadowx=2:shadowy=2:` +
          `enable='between(t,0,${fadeEnd.toFixed(2)})'`
      );
      break;
    }

    case "sticky_banner": {
      const fontSize = Math.round(outH * 0.028);
      const resolved = resolveCaptionTokens(caption.text, inputs, branding.address);
      if (!resolved.trim()) break;
      const text = escapeDrawtext(resolved);
      const padX = Math.round(fontSize * 0.7);
      const padY = Math.round(fontSize * 0.3);
      const padBanner = Math.round((padX + padY) / 2);
      const bg = hexToFFColor(bar);
      const txt = isLightHex(bar) ? "0x111111" : "0xFFFFFF";
      let xExpr = "(w-text_w)/2", yExpr = `${Math.round(outH * 0.04)}`;
      if (caption.position === "top-left") {
        xExpr = `${Math.round(outW * 0.04)}`;
      }
      txtFilters.push(
        `drawtext=fontfile=${fontFilePath}:text='${text}':` +
          `fontsize=${fontSize}:fontcolor=${txt}:` +
          `x=${xExpr}:y=${yExpr}:` +
          `box=1:boxcolor=${bg}@0.85:boxborderw=${padBanner}`
      );
      break;
    }

    case "price_reveal": {
      const newPrice = inputs.newPrice || "";
      if (!newPrice.trim()) break;
      const fontSize = Math.round(outH * 0.10);
      const padX = Math.round(fontSize * 0.4);
      const padY = Math.round(fontSize * 0.25);
      const padPrice = Math.round((padX + padY) / 2);
      const bg = hexToFFColor(accent);
      const txt = isLightHex(accent) ? "0x111111" : "0xFFFFFF";
      // Reveal animates in at start of last animateInDuration seconds of slot.
      const revealStart = Math.max(0, slotDuration - caption.animateInDuration);
      const text = escapeDrawtext(newPrice);
      txtFilters.push(
        `drawtext=fontfile=${fontFilePath}:text='${text}':` +
          `fontsize=${fontSize}:fontcolor=${txt}:` +
          `x=(w-text_w)/2:y=(h-text_h)/2:` +
          `box=1:boxcolor=${bg}:boxborderw=${padPrice}:` +
          `enable='between(t,${revealStart.toFixed(2)},${slotDuration.toFixed(2)})'`
      );
      // Old price strikethrough (if applicable) — drawn smaller above.
      if (caption.strikethroughOld && inputs.oldPrice?.trim()) {
        const oldFontSize = Math.round(fontSize * 0.5);
        const oldText = escapeDrawtext(inputs.oldPrice);
        txtFilters.push(
          `drawtext=fontfile=${fontFilePath}:text='${oldText}':` +
            `fontsize=${oldFontSize}:fontcolor=white@0.6:` +
            `x=(w-text_w)/2:y=((h-text_h)/2)-${Math.round(fontSize * 0.9)}:` +
            `shadowcolor=black@0.6:shadowx=2:shadowy=2:` +
            `enable='between(t,${revealStart.toFixed(2)},${slotDuration.toFixed(2)})'`
        );
      }
      break;
    }

    case "rsvp_hint": {
      // Skip if agent toggled off in the modal.
      if (inputs.showRsvpHint === false) break;
      const fontSize = Math.round(outH * 0.026);
      const text = escapeDrawtext(caption.text);
      txtFilters.push(
        `drawtext=fontfile=${fontFilePath}:text='${text}':` +
          `fontsize=${fontSize}:fontcolor=white@0.85:` +
          `x=(w-text_w)/2:y=h-${Math.round(outH * 0.06)}:` +
          `shadowcolor=black@0.6:shadowx=2:shadowy=2`
      );
      break;
    }
  }

  return txtFilters;
}

// ─── Slot fragment builder ────────────────────────────────────────────────────
//
// Builds the filter chain for ONE slot:
//   trim → scale+crop → zoompan → drawtext (captions) → output label
//
// Returns the filter text + its output stream label + effective duration.
//
// IMPORTANT: This function does NOT include xfade — that's the stitcher's job.
// Each slot ends with a clean, padded video of `effectiveDuration` seconds.
function buildSlotFragment(
  slot: SlotSpec | null,         // null for extra slots
  clip: RenderClip,
  inputIdx: number,
  outputSize: { width: number; height: number },
  branding: RenderBranding,
  inputs: PresetInputs,
  pace: PaceId,
  presetIdForExtras: PresetSpec["id"],
  fontFilePath: string
): SlotFragment {
  const { width: outW, height: outH } = outputSize;

  // Effective duration: scaled by pace, clamped to source clip length.
  // Extras use the preset's avg slot duration × pace.
  const effectiveDuration = slot
    ? scaleSlotDuration(slot.defaultDuration, pace, SOURCE_CLIP_DURATION)
    : extraSlotDuration(presetIdForExtras, pace);

  // Trim: respect the agent-set trimStart, end at trimStart + effectiveDuration
  // (clamped to clip's actual trimEnd which is already the source clip duration).
  const trimStart = clip.trimStart;
  const trimEnd = Math.min(
    clip.trimStart + effectiveDuration,
    clip.trimEnd,
    SOURCE_CLIP_DURATION
  );

  // Zoompan: the slot's defined zoom (or a default 1.0→1.05 for extras).
  // We render zoompan via a single zoompan filter at output framerate.
  // FFmpeg zoompan needs a per-frame zoom expression and total frames.
  // 24 fps × duration = total frames.
  const fps = 24;
  const totalFrames = Math.max(1, Math.round(effectiveDuration * fps));
  const zoom = slot?.zoom || { from: 1.0, to: 1.05, ease: "linear" as const };
  // Linear zoom expression: zoom from→to over totalFrames-1 steps.
  // FFmpeg zoompan's `on` is the current frame index (0-based).
  const zoomExpr = `${zoom.from}+(${zoom.to - zoom.from})*on/${totalFrames - 1}`;

  // Build the slot's filter chain.
  // Pipeline:
  //   [in:v] trim → setpts → scale to outer → crop to output size →
  //          zoompan → setsar=1 → drawtext... → [vN]
  //
  // The zoompan inner s=WxH must match output to avoid letterboxing.
  let chain =
    `[${inputIdx}:v]` +
    `trim=start=${trimStart.toFixed(3)}:end=${trimEnd.toFixed(3)},` +
    `setpts=PTS-STARTPTS,` +
    `scale=${outW}:${outH}:force_original_aspect_ratio=increase,` +
    `crop=${outW}:${outH},` +
    `zoompan=z='${zoomExpr}':d=1:s=${outW}x${outH}:fps=${fps},` +
    `setsar=1,` +
    `format=yuv420p`;

  // Append captions if this slot has one.
  if (slot?.caption) {
    const captionFilters = buildCaptionFilters(
      slot.caption,
      { outW, outH, branding, inputs, slotDuration: effectiveDuration, fontFilePath },
      clip.label
    );
    if (captionFilters.length > 0) {
      chain += "," + captionFilters.join(",");
    }
  }

  const outLabel = `[v${inputIdx}]`;
  chain += outLabel;

  return {
    filterText: chain,
    outLabel,
    effectiveDuration,
    inputIdx,
  };
}

// ─── Stitcher ─────────────────────────────────────────────────────────────────
//
// Chains slot fragments via cascaded xfade. xfade is binary, so for N slots
// we produce N-1 xfade nodes. Each xfade has an `offset` = cumulative duration
// of all PREVIOUS slots minus the transition duration (because xfade overlaps).
//
// Example for 3 slots A(3s), B(2s), C(4s) with 0.3s transitions:
//   [v0][v1] xfade=duration=0.3:offset=2.7 → [vAB]
//   [vAB][v2] xfade=duration=0.3:offset=4.4 → [vout]
//                                ^^^ 3+2-0.3-0.3 = 4.4
//
// Total final duration = sum(durations) - (N-1)*transition.
function buildStitcher(
  fragments: SlotFragment[],
  transitionDuration: number
): { stitcherFilter: string; finalLabel: string; totalDuration: number } {
  if (fragments.length === 0) {
    throw new Error("[remix-renderer] Cannot stitch zero fragments.");
  }
  if (fragments.length === 1) {
    return {
      stitcherFilter: "",
      finalLabel: fragments[0].outLabel,
      totalDuration: fragments[0].effectiveDuration,
    };
  }

  const parts: string[] = [];
  let prevLabel = fragments[0].outLabel;
  let cumulativeOffset = fragments[0].effectiveDuration - transitionDuration;
  let cumulativeDur = fragments[0].effectiveDuration;

  for (let i = 1; i < fragments.length; i++) {
    const isLast = i === fragments.length - 1;
    const nextLabel = isLast ? "[vout]" : `[vx${i}]`;
    const f = fragments[i];
    parts.push(
      `${prevLabel}${f.outLabel}xfade=transition=fade:` +
        `duration=${transitionDuration.toFixed(2)}:` +
        `offset=${cumulativeOffset.toFixed(3)}${nextLabel}`
    );
    prevLabel = nextLabel;
    cumulativeDur += f.effectiveDuration - transitionDuration;
    cumulativeOffset = cumulativeDur - transitionDuration;
  }

  return {
    stitcherFilter: parts.join(";"),
    finalLabel: "[vout]",
    totalDuration: cumulativeDur,
  };
}

// ─── Audio chain (v1) ─────────────────────────────────────────────────────────
//
// v1: music only. Trim source track to total duration, fade out last 1.5s
// (per Q2 — confirmed). Source clips' audio is dropped (concat a=0 pattern,
// because we use xfade for video which doesn't carry audio anyway).
//
// v1.1 inserts: intro audio mix, music ducking, SFX layers, J-cut offsets.
// All of those slot in by replacing this single function — the rest of the
// renderer doesn't change.
function buildAudioChain(
  hasMusic: boolean,
  musicInputIdx: number,
  totalDurationSec: number
): { audioFilter: string; finalAudioLabel: string | null } {
  if (!hasMusic) return { audioFilter: "", finalAudioLabel: null };

  const fadeStart = Math.max(0, totalDurationSec - 1.5);
  // Trim from start, fade out last 1.5s.
  const audioFilter =
    `[${musicInputIdx}:a]` +
    `volume=0.85,` +
    `atrim=0:${totalDurationSec.toFixed(3)},` +
    `asetpts=PTS-STARTPTS,` +
    `afade=t=out:st=${fadeStart.toFixed(3)}:d=1.5` +
    `[aout]`;

  return { audioFilter, finalAudioLabel: "[aout]" };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function renderPresetExport(args: RenderArgs): Promise<Blob> {
  const {
    ffmpeg,
    preset,
    presetMeta,
    draftClips,
    branding,
    outputSize,
    hasMusic,
    fontFilePath = "font.ttf",
    outputPath = "output.mp4",
    onProgress,
    onStatus,
  } = args;

  if (draftClips.length === 0) {
    throw new Error("[remix-renderer] draftClips is empty.");
  }

  onStatus?.("Building filter chain...");
  onProgress?.(32);

  const baseSlotCount = preset.slots.length;
  const inputArgs: string[] = [];
  const fragments: SlotFragment[] = [];

  // Build per-slot fragments. Input ordering: clip 0 → input 0, clip 1 → input 1, etc.
  for (let i = 0; i < draftClips.length; i++) {
    const clip = draftClips[i];
    inputArgs.push("-i", clip.fsPath);
    const slot = i < baseSlotCount ? preset.slots[i] : null;
    fragments.push(
      buildSlotFragment(
        slot,
        clip,
        i,
        outputSize,
        branding,
        presetMeta.inputs,
        presetMeta.pace,
        preset.id,
        fontFilePath
      )
    );
  }

  // Stitch fragments via xfade.
  const transitionDuration = preset.transitionDefault.duration;
  const { stitcherFilter, finalLabel, totalDuration } = buildStitcher(
    fragments,
    transitionDuration
  );

  // Music input goes AFTER all video inputs.
  const musicInputIdx = draftClips.length;
  if (hasMusic) {
    inputArgs.push("-i", "music.mp3");
  }
  const { audioFilter, finalAudioLabel } = buildAudioChain(
    hasMusic,
    musicInputIdx,
    totalDuration
  );

  // Compose final filter_complex.
  const fragmentChains = fragments.map((f) => f.filterText).join(";");
  let filterComplex = fragmentChains;
  if (stitcherFilter) {
    filterComplex += ";" + stitcherFilter;
  }
  if (audioFilter) {
    filterComplex += ";" + audioFilter;
  }

  // Final ffmpeg argv.
  const cmdArgs: string[] = [
    ...inputArgs,
    "-filter_complex",
    filterComplex,
    "-map",
    finalLabel,
  ];
  if (finalAudioLabel) {
    cmdArgs.push("-map", finalAudioLabel);
  }
  cmdArgs.push(
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "24",
    "-vsync",
    "cfr"
  );
  if (finalAudioLabel) {
    cmdArgs.push("-c:a", "aac", "-b:a", "128k");
  }
  cmdArgs.push(
    "-movflags",
    "+faststart",
    "-t",
    Math.ceil(totalDuration).toString(),
    "-y",
    outputPath
  );

  // Console log the chain so debugging matches the existing `[ffmpeg]`/`[remix]` format.
  console.log("[remix-preset] filter_complex:", filterComplex);
  console.log("[remix-preset] argv length:", cmdArgs.length);
  console.log("[remix-preset] total duration:", totalDuration.toFixed(2), "s");

  onStatus?.("Encoding video...");
  onProgress?.(35);

  await ffmpeg.exec(cmdArgs);

  onStatus?.("Reading output...");
  onProgress?.(90);

  const data = await ffmpeg.readFile(outputPath);
  // ffmpeg.readFile returns Uint8Array | string. We always write binary, so
  // it's Uint8Array. Defensive check anyway.
  if (typeof data === "string") {
    throw new Error("[remix-renderer] Expected binary output, got string.");
  }
  return new Blob([data], { type: "video/mp4" });
}

// ─── Page-side wiring helper ──────────────────────────────────────────────────
//
// Exported because page.tsx will call this from inside its `exportRemix`
// function once it's identified the draft as a preset draft. Keeps the
// page-side change minimal:
//
//   if (currentPresetMeta) {
//     const blob = await renderPresetExport({...});
//     // ...download blob, mark exported_at as before
//     return;
//   }
//   // ...otherwise existing manual chain
//
// We don't export the helper functions (buildSlotFragment, buildStitcher,
// buildCaptionFilters) — they're internal. Keep the public surface small.
