// lib/brand-color-extraction.ts
// Extracts the dominant non-grayscale color from a logo image.
// Per Phase 1A spec Section 6:
//   1. Ignore pure white, pure black, and near-grayscale (lum >95% or <5%, sat <10%)
//   2. Fall back to deep navy #1e3a8a if no usable color is found
//   3. Never block the order flow — all errors silently default to navy

const NAVY_FALLBACK = "#1e3a8a";
const WHITE_SECONDARY = "#ffffff";

// Luminance thresholds (0-1 scale)
const LUM_TOO_LIGHT = 0.95;
const LUM_TOO_DARK = 0.05;

// Saturation threshold (0-1 scale): below this is considered grayscale
const SAT_MIN = 0.1;

// Downscale target for faster pixel sampling
const SAMPLE_MAX_DIM = 64;

export interface ExtractedBrandColor {
  primary: string;
  secondary: string;
  /** 'extracted' | 'fallback_navy' */
  source: "extracted" | "fallback_navy";
}

/**
 * Extract brand color from an image File or Blob (client-side).
 * Returns `{ primary, secondary, source }`. Never throws.
 */
export async function extractBrandColor(
  file: File | Blob
): Promise<ExtractedBrandColor> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const color = await extractFromUrl(url);
      return color;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("[brand-color] extraction failed:", err);
    return navyFallback();
  }
}

/**
 * Extract brand color from an image URL (client-side).
 * Works for same-origin or CORS-enabled URLs. Returns navy fallback on CORS
 * errors or any other failure.
 */
export async function extractBrandColorFromUrl(
  imageUrl: string
): Promise<ExtractedBrandColor> {
  try {
    return await extractFromUrl(imageUrl);
  } catch (err) {
    console.error("[brand-color] URL extraction failed:", err);
    return navyFallback();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core extraction
// ─────────────────────────────────────────────────────────────────────────────

function extractFromUrl(url: string): Promise<ExtractedBrandColor> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(navyFallback());
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const { width, height } = scaleDimensions(
          img.naturalWidth,
          img.naturalHeight,
          SAMPLE_MAX_DIM
        );
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(navyFallback());
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let pixels: Uint8ClampedArray;
        try {
          pixels = ctx.getImageData(0, 0, width, height).data;
        } catch {
          // Tainted canvas (CORS) — fall back
          resolve(navyFallback());
          return;
        }
        const color = pickDominantColor(pixels);
        resolve(color);
      } catch (err) {
        console.error("[brand-color] canvas error:", err);
        resolve(navyFallback());
      }
    };

    img.onerror = () => resolve(navyFallback());
    img.src = url;
  });
}

/**
 * Quantize sampled pixels into color buckets, filter out grayscale / too-light
 * / too-dark / transparent, and return the most-frequent qualifying color.
 */
function pickDominantColor(pixels: Uint8ClampedArray): ExtractedBrandColor {
  // Bucket key: 5-bit R, 5-bit G, 5-bit B (32^3 buckets).
  // Rough quantization is deliberate — avoids over-counting micro-variations
  // in gradients / JPEG artifacts.
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Skip transparent pixels — common in logo PNGs
    if (a < 128) continue;

    const { l, s } = rgbToHsl(r, g, b);
    if (l > LUM_TOO_LIGHT) continue; // near-white
    if (l < LUM_TOO_DARK) continue; // near-black
    if (s < SAT_MIN) continue; // grayscale

    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  if (buckets.size === 0) return navyFallback();

  // Pick the bucket with the most pixels
  let top: { r: number; g: number; b: number; n: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!top || bucket.n > top.n) top = bucket;
  }
  if (!top) return navyFallback();

  const r = Math.round(top.r / top.n);
  const g = Math.round(top.g / top.n);
  const b = Math.round(top.b / top.n);

  return {
    primary: rgbToHex(r, g, b),
    secondary: WHITE_SECONDARY,
    source: "extracted",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function navyFallback(): ExtractedBrandColor {
  return {
    primary: NAVY_FALLBACK,
    secondary: WHITE_SECONDARY,
    source: "fallback_navy",
  };
}

function scaleDimensions(
  w: number,
  h: number,
  max: number
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w / h;
  if (w >= h) return { width: max, height: Math.round(max / ratio) };
  return { width: Math.round(max * ratio), height: max };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Returns hue, saturation, lightness — each in 0-1 range. */
function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

/**
 * Persist the extracted color to lens_usage. Safe to call whenever a logo
 * is uploaded — on the order form, on the delivery page, or from profile
 * settings. Silently no-ops if the user isn't logged in.
 */
export async function saveBrandColorToProfile(
  supabase: {
    from: (table: string) => {
      update: (data: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: unknown }>;
      };
    };
  },
  userId: string,
  color: ExtractedBrandColor
): Promise<void> {
  try {
    await supabase
      .from("lens_usage")
      .update({
        saved_brand_color_primary: color.primary,
        saved_brand_color_secondary: color.secondary,
        brand_color_source: color.source,
      })
      .eq("user_id", userId);
  } catch (err) {
    console.error("[brand-color] save failed:", err);
  }
}
