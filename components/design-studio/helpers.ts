// components/design-studio/helpers.ts
//
// Shared pure utility functions used by all Design Studio templates AND
// by the server-side bonus-content render route. Single source of truth —
// if you tweak one of these, every consumer updates at once.
//
// Do not add helpers that depend on React, browser APIs, or Next.js
// primitives here. This file must be safely importable from a Node-side
// @vercel/og runtime.

/**
 * True if the hex color is on the light end of the luminance scale.
 * Used throughout templates to pick legible text colors on colored bars.
 * Accepts 3- or 6-character hex (with or without leading #); falls back
 * to "light" for anything shorter so text defaults to dark.
 */
export function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

/**
 * Convert a hex color to an rgba() string with the given alpha.
 * Falls back to black at the requested alpha on malformed input.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(c.substring(0, 2), 16)},${parseInt(c.substring(2, 4), 16)},${parseInt(c.substring(4, 6), 16)},${alpha})`;
}

/**
 * Shrink a font size so long strings still fit their allotted row.
 * `base` is the size used when text fits within `maxChars`; as text
 * grows past that, size is scaled down linearly but floored at 55%
 * of base so nothing ever becomes unreadable.
 */
export function responsiveSize(base: number, text: string, maxChars: number): number {
  if (!text || text.length <= maxChars) return base;
  return Math.max(base * 0.5, Math.round(base * Math.max(maxChars / text.length, 0.55)));
}

/**
 * Return a darker shade of the given hex, expressed as rgb().
 * `pct` is 0–100 — the amount to subtract from each channel, scaled.
 * Used by YardSignSidebar for its gradient background.
 */
export function darken(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.max(0, (n >> 16) - Math.round(2.55 * pct))},${Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * pct))},${Math.max(0, (n & 0xff) - Math.round(2.55 * pct))})`;
}

/**
 * Badge config lookup — each template ID maps to a display label
 * (e.g. "JUST LISTED") and a badge color. Falls back to "just-listed"
 * if the ID isn't recognized.
 */
export function getBadgeConfig(id: string): { text: string; color: string } {
  const m: Record<string, { text: string; color: string }> = {
    "just-listed": { text: "JUST LISTED", color: "#2563eb" },
    "open-house": { text: "OPEN HOUSE", color: "#059669" },
    "price-reduced": { text: "PRICE REDUCED", color: "#dc2626" },
    "just-sold": { text: "JUST SOLD", color: "#d97706" },
    "for-rent": { text: "FOR RENT", color: "#16a34a" },
    "magazine-cover": { text: "JUST LISTED", color: "#2563eb" },
    "magazine-rent": { text: "FOR RENT", color: "#16a34a" },
    "stamp-listed": { text: "JUST LISTED", color: "#2563eb" },
    "stamp-reduced": { text: "PRICE REDUCED", color: "#dc2626" },
    "stamp-rent": { text: "FOR RENT", color: "#16a34a" },
    "cinematic-listed": { text: "JUST LISTED", color: "#2563eb" },
    "cinematic-reduced": { text: "PRICE REDUCED", color: "#dc2626" },
    "cinematic-rent": { text: "FOR RENT", color: "#16a34a" },
    "bold-frame": { text: "PRICE REDUCED", color: "#dc2626" },
    "frame-rent": { text: "FOR RENT", color: "#16a34a" },
  };
  return m[id] || m["just-listed"];
}

/**
 * Hard-cap text to `max` characters, stripping markdown asterisks first
 * and appending an ellipsis when truncated. Used by ListingFlyer to
 * prevent long descriptions from overflowing the fixed template area.
 */
export function truncateText(text: string, max: number): string {
  if (!text) return text;
  const clean = text.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");
  if (clean.length <= max) return clean;
  return clean.substring(0, max).trimEnd() + "\u2026";
}
