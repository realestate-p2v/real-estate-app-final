"use client";

import { Image as ImageIcon, User } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   SHARED TYPES
   ═══════════════════════════════════════════════════════ */

export interface SizeConfig {
  id: string;
  label: string;
  sublabel: string;
  width: number;
  height: number;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

export function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function lighten(hex: string, pct: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.min(255, (n >> 16) + Math.round(2.55 * pct))},${Math.min(255, ((n >> 8) & 0xff) + Math.round(2.55 * pct))},${Math.min(255, (n & 0xff) + Math.round(2.55 * pct))})`;
}

function darken(hex: string, pct: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.max(0, (n >> 16) - Math.round(2.55 * pct))},${Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * pct))},${Math.max(0, (n & 0xff) - Math.round(2.55 * pct))})`;
}

/** Scale font size down for long text — never truncate */
function responsiveSize(base: number, text: string, maxChars: number): number {
  if (!text || text.length <= maxChars) return base;
  const ratio = maxChars / text.length;
  return Math.max(base * 0.5, Math.round(base * Math.max(ratio, 0.55)));
}

/** Convert hex to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ═══════════════════════════════════════════════════════
   INFO BAR TEMPLATE (Just Listed, Price Reduced, Just Sold)
   ─────────────────────────────────────────────────────
   Redesigned with:
   • Floating pill badge bridging photo → bar
   • Frosted-glass info bar with accent top border
   • Vertical divider separating agent / property
   • Improved headshot ring with accent glow
   • Cinematic gradient transition from photo to bar
   • Better typography hierarchy & spacing
   ═══════════════════════════════════════════════════════ */

export function InfoBarTemplate({ size, listingPhoto, videoElement, headshot, logo, address, beds, baths, sqft, price, agentName, phone, brokerage, badgeText, badgeColor, fontFamily, barColor, accentColor }: {
  size: SizeConfig; listingPhoto: string | null; videoElement?: React.ReactNode; headshot: string | null; logo: string | null; address: string; beds: string; baths: string; sqft: string; price: string; agentName: string; phone: string; brokerage: string; badgeText: string; badgeColor: string; fontFamily: string; barColor: string; accentColor: string;
}) {
  const w = size.width, h = size.height;
  const isStory = size.id === "story";
  const isPostcard = size.id === "postcard";
  const unit = w / 1080;

  // Colors (shared across all layouts)
  const accent = accentColor || "#ffffff";
  const usedBadgeColor = accentColor || badgeColor;
  const barLight = isLightColor(barColor);
  const barTextPrimary = barLight ? "#111827" : "#ffffff";
  const barTextSecondary = barLight ? "rgba(17,24,39,0.55)" : "rgba(255,255,255,0.55)";
  const barTextMuted = barLight ? "rgba(17,24,39,0.40)" : "rgba(255,255,255,0.35)";
  const dividerColor = barLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)";

  // Text content with fallbacks (shared)
  const agentNameText = agentName || "Agent Name";
  const brokerageText = brokerage || "Brokerage";
  const phoneText = phone || "(555) 000-0000";
  const addressText = address || "123 Main Street";
  const detailsText = [beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`].filter(Boolean).join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF";
  const priceText = price ? `$${price}` : "$000,000";

  // ── Shared sub-components ──

  const renderPhoto = (photoHeight: string) => (
    <div className="absolute inset-x-0 top-0" style={{ height: photoHeight }}>
      {videoElement ? (
        <div className="w-full h-full" style={{ position: "relative", overflow: "hidden" }}>{videoElement}</div>
      ) : listingPhoto ? (
        <img src={listingPhoto} alt="Listing" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(12 * unit) }}>
            <ImageIcon style={{ width: 64 * unit, height: 64 * unit, color: "rgba(255,255,255,0.12)" }} />
            <span style={{ fontSize: Math.round(16 * unit), color: "rgba(255,255,255,0.18)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Listing Photo</span>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0" style={{
        height: Math.round(140 * unit),
        backgroundImage: `linear-gradient(to top, ${barColor} 0%, ${hexToRgba(barColor, 0.85)} 30%, ${hexToRgba(barColor, 0.4)} 65%, transparent 100%)`
      }} />
    </div>
  );

  const renderHeadshot = (sz: number, border: number) => (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {headshot ? (
        <div style={{
          width: sz, height: sz, borderRadius: "50%", padding: border,
          background: accentColor
            ? `linear-gradient(135deg, ${accentColor}, ${hexToRgba(accentColor, 0.4)})`
            : barLight
              ? "linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05))"
              : "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))",
        }}>
          <img src={headshot} alt="Agent" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }} />
        </div>
      ) : (
        <div style={{
          width: sz, height: sz, borderRadius: "50%",
          backgroundColor: barLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
          border: `${border}px solid ${dividerColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <User style={{ width: sz * 0.38, height: sz * 0.38, color: barTextMuted }} />
        </div>
      )}
    </div>
  );

  const renderBarChrome = (bH: number) => (
    <>
      <div className="absolute inset-x-0 top-0" style={{ height: Math.round(3 * unit), backgroundColor: accent, opacity: accentColor ? 0.8 : 0.15 }} />
      <div className="absolute inset-0" style={{
        backgroundImage: barLight
          ? "linear-gradient(to bottom, rgba(0,0,0,0.03) 0%, transparent 40%)"
          : "linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 40%)",
      }} />
    </>
  );

  const renderBadge = (photoPercent: number, badgeH: number, fontSize: number, padRight: number) => {
    const offsetY = Math.round(badgeH * 0.5);
    return (
      <div className="absolute inset-x-0" style={{ top: `calc(${photoPercent}% - ${offsetY}px)`, zIndex: 10, display: "flex", justifyContent: "flex-end", paddingRight: padRight }}>
        <div style={{
          display: "inline-flex", alignItems: "center", height: badgeH,
          padding: `0 ${Math.round(22 * unit)}px`,
          backgroundColor: usedBadgeColor,
          borderRadius: Math.round(4 * unit),
          boxShadow: `0 ${Math.round(4 * unit)}px ${Math.round(20 * unit)}px ${hexToRgba(usedBadgeColor, 0.45)}`,
        }}>
          <span style={{ fontSize, fontWeight: 800, color: isLightColor(usedBadgeColor) ? "#111" : "#fff", letterSpacing: "0.14em", textTransform: "uppercase" as const, lineHeight: 1 }}>{badgeText}</span>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     STORY LAYOUT (1080×1920)
     Agent info stacked vertically: headshot centered,
     name/brokerage/phone below. Property info on right side.
     ═══════════════════════════════════════════════════════ */
  if (isStory) {
    const photoPercent = 58;
    const barH = h * (1 - photoPercent / 100);
    const barPadLeft = Math.round(56 * unit);
    const barPadRight = Math.round(44 * unit);
    const barPadY = Math.round(28 * unit);
    const headshotSize = Math.round(barH * 0.36);
    const headshotBorder = Math.round(4 * unit);

    const badgeH = Math.round(barH * 0.072);
    const badgeFontSz = Math.round(barH * 0.036);

    const agentNameFontSize = responsiveSize(Math.round(barH * 0.080), agentNameText, 18);
    const brokerageFontSize = responsiveSize(Math.round(barH * 0.056), brokerageText, 24);
    const phoneFontSize = Math.round(barH * 0.054);
    const addressFontSize = responsiveSize(Math.round(barH * 0.072), addressText, 20);
    const detailsFontSize = Math.round(barH * 0.048);
    const priceFontSize = Math.round(barH * 0.105);

    return (
      <div className="relative overflow-hidden" style={{ width: w, height: h, fontFamily }}>
        {renderPhoto(`${photoPercent}%`)}
        {renderBadge(photoPercent, badgeH, badgeFontSz, barPadRight)}

        {/* ── INFO BAR ── */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: `${100 - photoPercent}%`, backgroundColor: barColor }}>
          {renderBarChrome(barH)}

          {/* Content: two-column with agent stacked on left, property on right */}
          <div className="absolute inset-0" style={{
            display: "flex",
            padding: `${barPadY}px ${barPadRight}px ${barPadY}px ${barPadLeft}px`,
            gap: Math.round(28 * unit),
          }}>
            {/* LEFT: Agent — stacked vertically */}
            <div style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "44%",
              gap: Math.round(12 * unit),
            }}>
              {renderHeadshot(headshotSize, headshotBorder)}
              <div style={{ textAlign: "center", minWidth: 0 }}>
                <p style={{ fontSize: agentNameFontSize, fontWeight: 700, color: barTextPrimary, lineHeight: 1.15, margin: 0, whiteSpace: "nowrap" }}>{agentNameText}</p>
                <p style={{ fontSize: brokerageFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(5 * unit), overflowWrap: "break-word" }}>{brokerageText}</p>
                <p style={{ fontSize: phoneFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(3 * unit), letterSpacing: "0.02em" }}>{phoneText}</p>
              </div>
              {/* Logo under agent info */}
              {logo && (
                <img src={logo} alt="Logo" style={{
                  maxWidth: Math.round(headshotSize * 1.3),
                  maxHeight: Math.round(barH * 0.14),
                  objectFit: "contain" as const,
                  opacity: 1,
                  marginTop: Math.round(6 * unit),
                }} />
              )}
            </div>

            {/* VERTICAL DIVIDER */}
            <div style={{
              width: Math.round(1.5 * unit),
              alignSelf: "stretch",
              margin: `${Math.round(barH * 0.08)}px 0`,
              backgroundColor: dividerColor,
              flexShrink: 0,
            }} />

            {/* RIGHT: Property Info */}
            <div style={{
              flex: 1, textAlign: "right", minWidth: 0,
              display: "flex", flexDirection: "column", justifyContent: "center",
            }}>
              <p style={{ fontSize: addressFontSize, fontWeight: 700, color: barTextPrimary, lineHeight: 1.25, margin: 0, overflowWrap: "break-word" }}>{addressText}</p>
              <p style={{ fontSize: detailsFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(8 * unit), letterSpacing: "0.04em" }}>{detailsText}</p>
              <div style={{ width: Math.round(60 * unit), height: Math.round(2 * unit), backgroundColor: accentColor || dividerColor, marginLeft: "auto", marginTop: Math.round(14 * unit), marginBottom: Math.round(10 * unit), borderRadius: 1, opacity: accentColor ? 0.7 : 1 }} />
              <p style={{
                fontSize: priceFontSize, fontWeight: 800, color: accent, lineHeight: 1.0, margin: 0, letterSpacing: "-0.01em",
                textShadow: accentColor && !barLight ? `0 ${Math.round(2 * unit)}px ${Math.round(12 * unit)}px ${hexToRgba(accentColor, 0.3)}` : "none",
              }}>{priceText}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     POSTCARD LAYOUT (1800×1200)
     Wider format — everything needs to be bigger.
     Uses a taller bar percentage and bigger font multipliers.
     ═══════════════════════════════════════════════════════ */
  if (isPostcard) {
    const photoPercent = 55;
    const barH = h * (1 - photoPercent / 100);
    const barPadX = Math.round(44 * unit);
    const barPadY = Math.round(20 * unit);
    const headshotSize = Math.round(barH * 0.78);
    const headshotBorder = Math.round(4 * unit);

    const badgeH = Math.round(barH * 0.16);
    const badgeFontSz = Math.round(barH * 0.065);

    const agentNameFontSize = responsiveSize(Math.round(barH * 0.125), agentNameText, 18);
    const brokerageFontSize = responsiveSize(Math.round(barH * 0.080), brokerageText, 24);
    const phoneFontSize = Math.round(barH * 0.074);
    const addressFontSize = responsiveSize(Math.round(barH * 0.110), addressText, 20);
    const detailsFontSize = Math.round(barH * 0.074);
    const priceFontSize = Math.round(barH * 0.185);

    return (
      <div className="relative overflow-hidden" style={{ width: w, height: h, fontFamily }}>
        {renderPhoto(`${photoPercent}%`)}
        {renderBadge(photoPercent, badgeH, badgeFontSz, barPadX)}

        {/* ── INFO BAR ── */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: `${100 - photoPercent}%`, backgroundColor: barColor }}>
          {renderBarChrome(barH)}

          <div className="absolute inset-0 flex items-center" style={{
            padding: `${barPadY}px ${barPadX}px`,
            gap: Math.round(28 * unit),
          }}>
            {/* LEFT: Agent Info */}
            <div style={{
              display: "flex", alignItems: "center",
              gap: Math.round(22 * unit),
              flex: "0 0 auto", maxWidth: "44%",
            }}>
              {renderHeadshot(headshotSize, headshotBorder)}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: agentNameFontSize, fontWeight: 700, color: barTextPrimary, lineHeight: 1.15, margin: 0, whiteSpace: "nowrap" }}>{agentNameText}</p>
                <p style={{ fontSize: brokerageFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(5 * unit), overflowWrap: "break-word" }}>{brokerageText}</p>
                <p style={{ fontSize: phoneFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(3 * unit), letterSpacing: "0.02em" }}>{phoneText}</p>
              </div>
            </div>

            {/* VERTICAL DIVIDER */}
            <div style={{ width: Math.round(1.5 * unit), alignSelf: "stretch", margin: `${Math.round(barH * 0.12)}px 0`, backgroundColor: dividerColor, flexShrink: 0 }} />

            {/* RIGHT: Property Info */}
            <div style={{ flex: 1, textAlign: "right", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: addressFontSize, fontWeight: 700, color: barTextPrimary, lineHeight: 1.25, margin: 0, overflowWrap: "break-word" }}>{addressText}</p>
              <p style={{ fontSize: detailsFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(6 * unit), letterSpacing: "0.04em" }}>{detailsText}</p>
              <div style={{ width: Math.round(60 * unit), height: Math.round(2 * unit), backgroundColor: accentColor || dividerColor, marginLeft: "auto", marginTop: Math.round(10 * unit), marginBottom: Math.round(8 * unit), borderRadius: 1, opacity: accentColor ? 0.7 : 1 }} />
              <p style={{
                fontSize: priceFontSize, fontWeight: 800, color: accent, lineHeight: 1.0, margin: 0, letterSpacing: "-0.01em",
                textShadow: accentColor && !barLight ? `0 ${Math.round(2 * unit)}px ${Math.round(12 * unit)}px ${hexToRgba(accentColor, 0.3)}` : "none",
              }}>{priceText}</p>
            </div>
          </div>

          {/* Logo — bottom-right */}
          {logo && (
            <img src={logo} alt="Logo" className="absolute object-contain" style={{
              bottom: Math.round(20 * unit), right: barPadX,
              maxWidth: Math.round(barH * 0.34), maxHeight: Math.round(barH * 0.18),
              opacity: 1,
            }} />
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     SQUARE LAYOUT (1080×1080) — DEFAULT
     The original design that works perfectly. Unchanged.
     ═══════════════════════════════════════════════════════ */
  const photoPercent = 58;
  const barH = h * (1 - photoPercent / 100);
  const barPadX = Math.round(36 * unit);
  const barPadY = Math.round(20 * unit);
  const headshotSize = Math.round(barH * 0.52);
  const headshotBorder = Math.round(3 * unit);

  const badgeH = Math.round(barH * 0.14);
  const badgeFontSz = Math.round(barH * 0.052);

  const agentNameFontSize = responsiveSize(Math.round(barH * 0.082), agentNameText, 18);
  const brokerageFontSize = responsiveSize(Math.round(barH * 0.055), brokerageText, 24);
  const phoneFontSize = Math.round(barH * 0.052);
  const addressFontSize = responsiveSize(Math.round(barH * 0.094), addressText, 20);
  const detailsFontSize = Math.round(barH * 0.055);
  const priceFontSize = Math.round(barH * 0.15);

  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h, fontFamily }}>
      {renderPhoto(`${photoPercent}%`)}
      {renderBadge(photoPercent, badgeH, badgeFontSz, barPadX)}

      {/* ── INFO BAR ── */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: `${100 - photoPercent}%`, backgroundColor: barColor }}>
        {renderBarChrome(barH)}

        <div className="absolute inset-0 flex items-center" style={{
          padding: `${barPadY}px ${barPadX}px`,
          gap: Math.round(24 * unit),
        }}>
          {/* LEFT: Agent Info */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: Math.round(18 * unit),
            flex: "0 0 auto", maxWidth: "44%",
          }}>
            {renderHeadshot(headshotSize, headshotBorder)}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: agentNameFontSize, fontWeight: 700, color: barTextPrimary, lineHeight: 1.15, margin: 0, whiteSpace: "nowrap" }}>{agentNameText}</p>
              <p style={{ fontSize: brokerageFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(4 * unit), overflowWrap: "break-word" }}>{brokerageText}</p>
              <p style={{ fontSize: phoneFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(2 * unit), letterSpacing: "0.02em" }}>{phoneText}</p>
            </div>
          </div>

          {/* VERTICAL DIVIDER */}
          <div style={{ width: Math.round(1.5 * unit), alignSelf: "stretch", margin: `${Math.round(barH * 0.12)}px 0`, backgroundColor: dividerColor, flexShrink: 0 }} />

          {/* RIGHT: Property Info */}
          <div style={{ flex: 1, textAlign: "right", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: addressFontSize, fontWeight: 700, color: barTextPrimary, lineHeight: 1.25, margin: 0, overflowWrap: "break-word" }}>{addressText}</p>
            <p style={{ fontSize: detailsFontSize, fontWeight: 500, color: barTextSecondary, lineHeight: 1.3, margin: 0, marginTop: Math.round(6 * unit), letterSpacing: "0.04em" }}>{detailsText}</p>
            <div style={{ width: Math.round(60 * unit), height: Math.round(2 * unit), backgroundColor: accentColor || dividerColor, marginLeft: "auto", marginTop: Math.round(10 * unit), marginBottom: Math.round(8 * unit), borderRadius: 1, opacity: accentColor ? 0.7 : 1 }} />
            <p style={{
              fontSize: priceFontSize, fontWeight: 800, color: accent, lineHeight: 1.0, margin: 0, letterSpacing: "-0.01em",
              textShadow: accentColor && !barLight ? `0 ${Math.round(2 * unit)}px ${Math.round(12 * unit)}px ${hexToRgba(accentColor, 0.3)}` : "none",
            }}>{priceText}</p>
          </div>
        </div>

        {/* Logo — bottom-right */}
        {logo && (
          <img src={logo} alt="Logo" className="absolute object-contain" style={{
            bottom: Math.round(20 * unit), right: barPadX,
            maxWidth: Math.round(barH * 0.30), maxHeight: Math.round(barH * 0.16),
            opacity: 1,
          }} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   OPEN HOUSE TEMPLATE
   ─────────────────────────────────────────────────────
   Redesigned with:
   • Sophisticated multi-layer gradient + radial vignette
   • Frosted pill badge with letter-spacing & glow
   • Horizontal rule separating date/time from property info
   • Defined agent bar with rounded top, border, lifted feel
   • Text shadows for legibility on any photo
   • Date bolder than time for hierarchy
   • whiteSpace nowrap on agent name
   ═══════════════════════════════════════════════════════ */

export function OpenHouseTemplate({ size, listingPhoto, videoElement, headshot, logo, address, beds, baths, sqft, price, date, time, agentName, phone, brokerage, fontFamily, barColor, accentColor }: {
  size: SizeConfig; listingPhoto: string | null; videoElement?: React.ReactNode; headshot: string | null; logo: string | null; address: string; beds: string; baths: string; sqft: string; price: string; date: string; time: string; agentName: string; phone: string; brokerage: string; fontFamily: string; barColor: string; accentColor: string;
}) {
  const w = size.width, h = size.height, isStory = size.id === "story", isPostcard = size.id === "postcard", unit = w / 1080;
  const accent = accentColor || "#ffffff";
  const badgeBg = accentColor || "#059669";
  const barLight = isLightColor(barColor);
  const pad = Math.round(44 * unit);

  const agentNameText = agentName || "Agent Name";
  const addressText = address || "123 Main Street";
  const dateText = date || "Saturday, March 22";
  const timeText = time || "1:00 PM – 4:00 PM";
  const detailsText = [beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`].filter(Boolean).join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF";
  const priceText = price ? `$${price}` : "$000,000";
  const contactLine = [brokerage, phone].filter(Boolean).join("  ·  ") || "Brokerage  ·  (555) 000-0000";

  // Size-aware scaling — story gets ~2x to fill the tall frame
  const badgeFontSize = Math.round((isStory ? 68 : isPostcard ? 42 : 36) * unit);
  const badgePadY = Math.round((isStory ? 16 : isPostcard ? 12 : 8) * unit);
  const badgePadX = Math.round((isStory ? 44 : isPostcard ? 32 : 24) * unit);
  const dateFontSize = Math.round((isStory ? 58 : isPostcard ? 36 : 32) * unit);
  const timeFontSize = Math.round((isStory ? 44 : isPostcard ? 28 : 24) * unit);
  const addressFontSize = responsiveSize(Math.round((isStory ? 58 : isPostcard ? 36 : 32) * unit), addressText, 22);
  const detailsFontSz = Math.round((isStory ? 44 : isPostcard ? 28 : 24) * unit);
  const priceFontSize = Math.round((isStory ? 86 : isPostcard ? 52 : 46) * unit);
  const agentFontSize = responsiveSize(Math.round((isStory ? 52 : isPostcard ? 34 : 30) * unit), agentNameText, 20);
  const contactFontSize = responsiveSize(Math.round((isStory ? 40 : isPostcard ? 26 : 22) * unit), contactLine, 35);
  const headshotSz = Math.round((isStory ? 180 : isPostcard ? 120 : 110) * unit);
  const logoMaxW = Math.round((isStory ? 260 : isPostcard ? 160 : 150) * unit);
  const logoMaxH = Math.round((isStory ? 110 : isPostcard ? 72 : 64) * unit);

  // Agent bar height
  const agentBarH = Math.round((isStory ? 220 : isPostcard ? 140 : 130) * unit);
  const agentBarRadius = Math.round(14 * unit);

  const textShadow = `0 ${Math.round(2 * unit)}px ${Math.round(8 * unit)}px rgba(0,0,0,0.5)`;

  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h, fontFamily }}>

      {/* ── PHOTO ── */}
      {videoElement ? (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }}>{videoElement}</div>
      ) : listingPhoto ? (
        <img src={listingPhoto} alt="Listing" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(12 * unit) }}>
            <ImageIcon style={{ width: 64 * unit, height: 64 * unit, color: "rgba(255,255,255,0.12)" }} />
            <span style={{ fontSize: Math.round(16 * unit), color: "rgba(255,255,255,0.18)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Listing Photo</span>
          </div>
        </div>
      )}

      {/* ── GRADIENT OVERLAYS — lighter for more photo visibility ── */}
      {/* Top gradient for badge/date readability */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 25%, transparent 40%)",
      }} />
      {/* Bottom gradient for property info + agent bar */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 20%, transparent 45%)",
      }} />
      {/* Radial vignette — subtle */}
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.20) 100%)",
      }} />

      {/* ── TOP SECTION: Badge + Date/Time ── */}
      <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-center text-center" style={{
        height: isStory ? "26%" : "34%",
        padding: `0 ${pad}px`,
      }}>
        {/* Frosted pill badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          padding: `${badgePadY}px ${badgePadX}px`,
          backgroundColor: badgeBg,
          borderRadius: Math.round(6 * unit),
          boxShadow: `0 ${Math.round(4 * unit)}px ${Math.round(24 * unit)}px ${hexToRgba(badgeBg, 0.4)}`,
        }}>
          <span style={{
            fontSize: badgeFontSize,
            fontWeight: 800,
            color: isLightColor(badgeBg) ? "#111" : "#fff",
            letterSpacing: "0.16em",
            textTransform: "uppercase" as const,
            lineHeight: 1,
          }}>Open House</span>
        </div>

        {/* Date — bold, prominent */}
        <p style={{
          fontSize: dateFontSize,
          fontWeight: 800,
          color: "#ffffff",
          margin: 0,
          marginTop: Math.round(18 * unit),
          textShadow,
          letterSpacing: "0.02em",
        }}>{dateText}</p>

        {/* Time — lighter weight, smaller */}
        <p style={{
          fontSize: timeFontSize,
          fontWeight: 500,
          color: "rgba(255,255,255,0.75)",
          margin: 0,
          marginTop: Math.round(6 * unit),
          textShadow,
          letterSpacing: "0.03em",
        }}>{timeText}</p>
      </div>

      {/* ── BOTTOM SECTION: Property Info + Agent Bar ── */}
      <div className="absolute inset-x-0 bottom-0" style={{ padding: `0 ${pad}px` }}>

        {/* Property info block */}
        <div style={{ textAlign: "center", marginBottom: Math.round(14 * unit) }}>

          {/* Thin horizontal rule */}
          <div style={{
            width: Math.round(60 * unit),
            height: Math.round(1.5 * unit),
            backgroundColor: "rgba(255,255,255,0.25)",
            margin: `0 auto ${Math.round(16 * unit)}px`,
            borderRadius: 1,
          }} />

          {/* Address */}
          <p style={{
            fontSize: addressFontSize,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            margin: 0,
            textShadow,
            overflowWrap: "break-word",
          }}>{addressText}</p>

          {/* Details */}
          <p style={{
            fontSize: detailsFontSz,
            fontWeight: 500,
            color: "rgba(255,255,255,0.70)",
            margin: 0,
            marginTop: Math.round(6 * unit),
            letterSpacing: "0.04em",
            textShadow,
          }}>{detailsText}</p>

          {/* Thin accent rule above price */}
          <div style={{
            width: Math.round(50 * unit),
            height: Math.round(2 * unit),
            backgroundColor: accentColor || "rgba(255,255,255,0.20)",
            margin: `${Math.round(10 * unit)}px auto ${Math.round(8 * unit)}px`,
            borderRadius: 1,
            opacity: accentColor ? 0.7 : 1,
          }} />

          {/* Price */}
          <p style={{
            fontSize: priceFontSize,
            fontWeight: 800,
            color: accent,
            lineHeight: 1.0,
            margin: 0,
            letterSpacing: "-0.01em",
            textShadow: accentColor
              ? `0 ${Math.round(2 * unit)}px ${Math.round(14 * unit)}px ${hexToRgba(accentColor, 0.35)}`
              : textShadow,
          }}>{priceText}</p>
        </div>

        {/* ── Agent bar — frosted, defined shape ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(14 * unit),
          height: agentBarH,
          padding: `0 ${Math.round(24 * unit)}px`,
          backgroundColor: hexToRgba(barColor, 0.88),
          borderRadius: `${agentBarRadius}px ${agentBarRadius}px 0 0`,
          borderTop: `${Math.round(1.5 * unit)}px solid ${barLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.10)"}`,
        }}>
          {/* Headshot */}
          {headshot ? (
            <img src={headshot} alt="Agent" style={{
              width: headshotSz,
              height: headshotSz,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              border: `${Math.round(2.5 * unit)}px solid ${accentColor ? hexToRgba(accentColor, 0.5) : "rgba(255,255,255,0.25)"}`,
            }} />
          ) : (
            <div style={{
              width: headshotSz,
              height: headshotSz,
              borderRadius: "50%",
              backgroundColor: barLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
              border: `${Math.round(2.5 * unit)}px solid ${barLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <User style={{ width: headshotSz * 0.38, height: headshotSz * 0.38, color: barLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)" }} />
            </div>
          )}

          {/* Agent text */}
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: agentFontSize,
              fontWeight: 700,
              color: barLight ? "#111827" : "#ffffff",
              margin: 0,
              whiteSpace: "nowrap",
            }}>{agentNameText}</p>
            <p style={{
              fontSize: contactFontSize,
              fontWeight: 500,
              color: barLight ? "rgba(17,24,39,0.50)" : "rgba(255,255,255,0.50)",
              margin: 0,
              marginTop: Math.round(2 * unit),
              overflowWrap: "break-word",
            }}>{contactLine}</p>
          </div>

          {/* Logo */}
          {logo && (
            <img src={logo} alt="Logo" style={{
              maxWidth: logoMaxW,
              maxHeight: logoMaxH,
              objectFit: "contain" as const,
              flexShrink: 0,
              marginLeft: "auto",
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   YARD SIGN — SPLIT BAR
   ═══════════════════════════════════════════════════════ */

export function YardSignSplitBar({ width, height, headshot, logo, agentName, phone, email, brokerage, officeName, officePhone, headerText, topColor, bottomColor, fontFamily, qrDataUrl, bulletPoints }: {
  width: number; height: number; headshot: string | null; logo: string | null; agentName: string; phone: string; email: string; brokerage: string; officeName: string; officePhone: string; headerText: string; topColor: string; bottomColor: string; fontFamily: string; qrDataUrl: string | null; bulletPoints?: string[];
}) {
  const topH = Math.round(height * 0.15);
  const bottomH = Math.round(height * 0.15);
  const centerH = height - topH - bottomH;
  const topLight = isLightColor(topColor);
  const bottomLight = isLightColor(bottomColor);
  const u = width / 5400;

  const nameText = agentName || "AGENT NAME";
  const phoneText = phone || "321-555-4321";
  const officeText = officeName || brokerage || "OFFICE NAME";
  const showBothLines = !!(officeName && brokerage && officeName !== brokerage);
  const headerLabel = headerText || "FOR SALE";

  const headerSz = Math.round(topH * 0.48);
  const nameSz = responsiveSize(Math.round(centerH * 0.072), nameText, 16);
  const phoneSz = Math.round(centerH * 0.058);
  const detailSz = Math.round(centerH * 0.038);
  const bottomNameSz = responsiveSize(Math.round(bottomH * 0.30), officeText, 18);
  const bottomPhoneSz = Math.round(bottomH * 0.22);
  const headshotSz = Math.round(centerH * 0.42);

  const topTextColor = topLight ? "#000" : "#fff";
  const bottomTextColor = bottomLight ? "#000" : "#fff";
  const topRuleColor = topLight ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.30)";
  const bottomRuleColor = bottomLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)";

  return (
    <div style={{ width, height, fontFamily, display: "flex", flexDirection: "column" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        height: topH, backgroundColor: topColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(width * 0.03) }}>
          <div style={{ width: Math.round(width * 0.07), height: Math.round(3 * u), backgroundColor: topRuleColor }} />
          <p style={{
            fontSize: headerSz, fontWeight: 900, color: topTextColor,
            letterSpacing: "0.14em", textTransform: "uppercase" as const,
            margin: 0, lineHeight: 1,
          }}>{headerLabel}</p>
          <div style={{ width: Math.round(width * 0.07), height: Math.round(3 * u), backgroundColor: topRuleColor }} />
        </div>
      </div>

      {/* ── CENTER SECTION — stacked vertically, centered ── */}
      <div style={{
        height: centerH, backgroundColor: "#ffffff",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: `${Math.round(centerH * 0.06)}px ${Math.round(width * 0.08)}px`,
        gap: Math.round(centerH * 0.03),
        position: "relative",
      }}>
        {/* Subtle top border accent */}
        <div style={{ position: "absolute", top: 0, left: Math.round(width * 0.1), right: Math.round(width * 0.1), height: Math.round(4 * u), backgroundColor: topColor, opacity: 0.15 }} />

        {/* Headshot — rounded, with shadow */}
        {headshot ? (
          <img src={headshot} alt="Agent" style={{
            width: headshotSz, height: headshotSz, objectFit: "cover",
            borderRadius: "50%",
            border: `${Math.round(6 * u)}px solid ${topColor}`,
            boxShadow: `0 ${Math.round(8 * u)}px ${Math.round(28 * u)}px rgba(0,0,0,0.15)`,
          }} />
        ) : (
          <div style={{
            width: headshotSz, height: headshotSz,
            backgroundColor: "#f3f4f6", borderRadius: "50%",
            border: `${Math.round(6 * u)}px solid ${topColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User style={{ width: headshotSz * 0.35, height: headshotSz * 0.35, color: "#9ca3af" }} />
          </div>
        )}

        {/* Agent name */}
        <p style={{
          fontSize: nameSz, fontWeight: 800, color: "#111",
          lineHeight: 1.1, margin: 0, textAlign: "center",
          letterSpacing: "0.05em", textTransform: "uppercase" as const,
          whiteSpace: "nowrap",
        }}>{nameText}</p>

        {/* Accent line */}
        <div style={{
          width: Math.round(width * 0.10), height: Math.round(4 * u),
          backgroundColor: topColor, borderRadius: 2,
        }} />

        {/* Phone */}
        <p style={{
          fontSize: phoneSz, fontWeight: 600, color: "#333",
          margin: 0, textAlign: "center", letterSpacing: "0.04em",
        }}>{phoneText}</p>

        {/* Email */}
        {email && (
          <p style={{
            fontSize: detailSz, fontWeight: 400, color: "#666",
            margin: 0, textAlign: "center",
            overflowWrap: "break-word",
          }}>{email}</p>
        )}

        {/* Bullet points */}
        {bulletPoints && bulletPoints.filter(Boolean).length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(width * 0.02), marginTop: Math.round(centerH * 0.01) }}>
            {bulletPoints.filter(Boolean).map((bp, i) => (
              <span key={i} style={{ fontSize: detailSz, fontWeight: 600, color: "#444", textTransform: "uppercase" as const, letterSpacing: "0.03em" }}>
                {i > 0 && <span style={{ margin: `0 ${Math.round(width * 0.01)}px`, color: topColor }}>·</span>}
                {bp}
              </span>
            ))}
          </div>
        )}

        {/* Logo + QR row */}
        {(logo || qrDataUrl) && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: Math.round(width * 0.03),
            marginTop: Math.round(centerH * 0.01),
          }}>
            {logo && (
              <img src={logo} alt="Logo" style={{
                maxHeight: Math.round(centerH * 0.12),
                maxWidth: Math.round(width * 0.25),
                objectFit: "contain" as const,
              }} />
            )}
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR" style={{
                width: Math.round(centerH * 0.22),
                height: Math.round(centerH * 0.22),
                borderRadius: Math.round(4 * u),
              }} />
            )}
          </div>
        )}

        {/* Subtle bottom border accent */}
        <div style={{ position: "absolute", bottom: 0, left: Math.round(width * 0.1), right: Math.round(width * 0.1), height: Math.round(4 * u), backgroundColor: bottomColor, opacity: 0.15 }} />
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{
        height: bottomH, backgroundColor: bottomColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: `0 ${Math.round(width * 0.06)}px`,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(width * 0.025) }}>
            <div style={{ width: Math.round(width * 0.05), height: Math.round(2 * u), backgroundColor: bottomRuleColor }} />
            <div>
              {showBothLines ? (
                <>
                  <p style={{
                    fontSize: bottomNameSz, fontWeight: 800, color: bottomTextColor,
                    margin: 0, letterSpacing: "0.05em",
                    overflowWrap: "break-word",
                  }}>{brokerage}</p>
                  <p style={{
                    fontSize: Math.round(bottomNameSz * 0.7), fontWeight: 600, color: bottomTextColor,
                    margin: 0, marginTop: Math.round(height * 0.004),
                    letterSpacing: "0.03em", opacity: 0.8,
                    overflowWrap: "break-word",
                  }}>{officeName}</p>
                </>
              ) : (
                <p style={{
                  fontSize: bottomNameSz, fontWeight: 800, color: bottomTextColor,
                  margin: 0, letterSpacing: "0.05em",
                  overflowWrap: "break-word",
                }}>{officeText}</p>
              )}
            </div>
            <div style={{ width: Math.round(width * 0.05), height: Math.round(2 * u), backgroundColor: bottomRuleColor }} />
          </div>
          {officePhone && (
            <p style={{
              fontSize: bottomPhoneSz, fontWeight: 600, color: bottomTextColor,
              margin: 0, marginTop: Math.round(height * 0.008),
              letterSpacing: "0.03em",
            }}>{officePhone}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   YARD SIGN — SIDEBAR
   ─────────────────────────────────────────────────────
   Redesigned with:
   • Gradient sidebar with subtle depth
   • Header badge at top of main area (most important)
   • Decorative lines above/below agent name
   • Better visual flow: header → headshot → name → contact
   • Bullet points for property features
   • Tracked uppercase labels
   ═══════════════════════════════════════════════════════ */

export function YardSignSidebar({ width, height, headshot, logo, agentName, phone, email, brokerage, website, headerText, sidebarColor, mainBgColor, fontFamily, qrDataUrl, bulletPoints }: {
  width: number; height: number; headshot: string | null; logo: string | null; agentName: string; phone: string; email: string; brokerage: string; website: string; headerText: string; sidebarColor: string; mainBgColor: string; fontFamily: string; qrDataUrl: string | null; bulletPoints?: string[];
}) {
  const sideW = Math.round(width * 0.16);
  const mainW = width - sideW;
  const sideLight = isLightColor(sidebarColor);
  const mainLight = isLightColor(mainBgColor);
  const mainText = mainLight ? "#111" : "#fff";
  const mainMuted = mainLight ? "#555" : "rgba(255,255,255,0.55)";
  const u = width / 5400;

  const nameText = agentName || "AGENT NAME";
  const phoneText = phone || "206.866.6678";
  const brokerageText = brokerage || "BROKERAGE";
  const headerLabel = headerText || "FOR SALE";

  const headshotSz = Math.round(mainW * 0.38);
  const headerSz = Math.round(height * 0.042);
  const nameSz = responsiveSize(Math.round(height * 0.044), nameText, 16);
  const phoneSz = Math.round(height * 0.034);
  const detailSz = Math.round(height * 0.022);
  const bulletSz = Math.round(height * 0.020);
  const logoSz = Math.round(sideW * 0.55);

  const sideTextColor = sideLight ? "#000" : "#fff";
  const sideMuted = sideLight ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.20)";

  return (
    <div style={{ width, height, fontFamily, display: "flex" }}>

      {/* ── SIDEBAR — with subtle gradient ── */}
      <div style={{
        width: sideW, height,
        background: `linear-gradient(to bottom, ${sidebarColor}, ${darken(sidebarColor, 12)})`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: `${Math.round(height * 0.04)}px ${Math.round(sideW * 0.08)}px`,
      }}>
        {/* Top logo */}
        {logo && <img src={logo} alt="Logo" style={{ width: logoSz, height: logoSz, objectFit: "contain" as const }} />}

        {/* Vertical brokerage text */}
        <p style={{
          fontSize: Math.round(sideW * 0.20), fontWeight: 800,
          color: sideTextColor, writingMode: "vertical-rl" as any,
          textOrientation: "mixed" as any,
          letterSpacing: "0.14em", textTransform: "uppercase" as const,
          opacity: 0.9,
        }}>{brokerageText}</p>

        {/* Bottom logo */}
        {logo && <img src={logo} alt="Logo" style={{ width: logoSz, height: logoSz, objectFit: "contain" as const }} />}

        {/* Decorative line at bottom of sidebar */}
        {!logo && <div style={{ width: Math.round(sideW * 0.4), height: Math.round(2 * u), backgroundColor: sideMuted }} />}
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{
        width: mainW, height, backgroundColor: mainBgColor,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: `${Math.round(height * 0.02)}px ${Math.round(width * 0.04)}px`,
        textAlign: "center",
        position: "relative",
        gap: Math.round(height * 0.008),
      }}>
        {/* Subtle accent line at left edge */}
        <div style={{
          position: "absolute", top: Math.round(height * 0.06), bottom: Math.round(height * 0.06),
          left: 0, width: Math.round(4 * u),
          backgroundColor: sidebarColor, opacity: 0.15,
        }} />

        {/* Header badge — at top, most prominent */}
        <div style={{
          backgroundColor: sidebarColor,
          padding: `${Math.round(height * 0.012)}px ${Math.round(width * 0.06)}px`,
          borderRadius: Math.round(6 * u),
          marginBottom: Math.round(height * 0.012),
        }}>
          <p style={{
            fontSize: headerSz, fontWeight: 900,
            color: sideLight ? "#000" : "#fff",
            letterSpacing: "0.12em", textTransform: "uppercase" as const,
            margin: 0, lineHeight: 1,
          }}>{headerLabel}</p>
        </div>

        {/* Headshot — circular with colored border */}
        {headshot ? (
          <img src={headshot} alt="Agent" style={{
            width: headshotSz, height: headshotSz, objectFit: "cover",
            borderRadius: "50%",
            border: `${Math.round(6 * u)}px solid ${sidebarColor}`,
            boxShadow: `0 ${Math.round(6 * u)}px ${Math.round(20 * u)}px rgba(0,0,0,0.12)`,
          }} />
        ) : (
          <div style={{
            width: headshotSz, height: headshotSz,
            borderRadius: "50%",
            backgroundColor: mainLight ? "#e5e7eb" : "rgba(255,255,255,0.08)",
            border: `${Math.round(6 * u)}px solid ${sidebarColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User style={{ width: headshotSz * 0.35, height: headshotSz * 0.35, color: mainMuted }} />
          </div>
        )}

        {/* Decorative line above name */}
        <div style={{
          width: Math.round(width * 0.08), height: Math.round(3 * u),
          backgroundColor: sidebarColor, opacity: 0.4,
          marginTop: Math.round(height * 0.01), marginBottom: Math.round(height * 0.006),
        }} />

        {/* Agent name */}
        <p style={{
          fontSize: nameSz, fontWeight: 800, color: mainText,
          margin: 0, letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          whiteSpace: "nowrap",
        }}>{nameText}</p>

        {/* Subtitle */}
        <p style={{
          fontSize: detailSz, color: mainMuted,
          margin: 0, marginTop: Math.round(height * 0.005),
          textTransform: "uppercase" as const,
          letterSpacing: "0.08em", fontWeight: 500,
        }}>Real Estate Agent</p>

        {/* Decorative line below name */}
        <div style={{
          width: Math.round(width * 0.08), height: Math.round(3 * u),
          backgroundColor: sidebarColor, opacity: 0.4,
          marginTop: Math.round(height * 0.006), marginBottom: Math.round(height * 0.008),
        }} />

        {/* Phone */}
        <p style={{
          fontSize: phoneSz, fontWeight: 700, color: mainText,
          margin: 0, letterSpacing: "0.04em",
        }}>{phoneText}</p>

        {/* Website */}
        {website && (
          <p style={{
            fontSize: detailSz, color: mainMuted,
            margin: 0, marginTop: Math.round(height * 0.008),
            overflowWrap: "break-word",
          }}>{website}</p>
        )}

        {/* Email */}
        {email && (
          <p style={{
            fontSize: detailSz, color: mainMuted,
            margin: 0, marginTop: Math.round(height * 0.005),
            overflowWrap: "break-word",
          }}>{email}</p>
        )}

        {/* Bullet points */}
        {bulletPoints && bulletPoints.filter(Boolean).length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: Math.round(width * 0.015),
            marginTop: Math.round(height * 0.015),
            flexWrap: "wrap",
          }}>
            {bulletPoints.filter(Boolean).map((bp, i) => (
              <span key={i} style={{ fontSize: bulletSz, fontWeight: 600, color: mainText, opacity: 0.7, letterSpacing: "0.02em" }}>
                {i > 0 && <span style={{ margin: `0 ${Math.round(width * 0.008)}px`, color: sidebarColor }}>·</span>}
                {bp}
              </span>
            ))}
          </div>
        )}

        {/* QR Code */}
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR" style={{
            width: Math.round(height * 0.12), height: Math.round(height * 0.12),
            marginTop: Math.round(height * 0.015),
            borderRadius: Math.round(4 * u),
          }} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   YARD SIGN — TOP HEAVY
   ═══════════════════════════════════════════════════════ */

export function YardSignTopHeavy({ width, height, headshot, logo, agentName, phone, email, brokerage, headerText, topColor, bottomColor, fontFamily, qrDataUrl, bulletPoints }: {
  width: number; height: number; headshot: string | null; logo: string | null; agentName: string; phone: string; email: string; brokerage: string; headerText: string; topColor: string; bottomColor: string; fontFamily: string; qrDataUrl: string | null; bulletPoints?: string[];
}) {
  const topH = Math.round(height * 0.38);
  const bottomH = height - topH;
  const topLight = isLightColor(topColor);
  const bottomLight = isLightColor(bottomColor);
  const headerSz = Math.round(topH * 0.28);
  const logoMaxH = Math.round(topH * 0.22);
  const logoMaxW = Math.round(width * 0.45);
  const headshotSz = Math.round(bottomH * 0.38);
  const bottomText = bottomLight ? "#111" : "#fff";
  const bottomMuted = bottomLight ? "#555" : "rgba(255,255,255,0.65)";

  const nameText = agentName || "Agent Name";
  const phoneText = phone || "305.555.7315";
  const brokerageText = brokerage || "";

  const nameSz = responsiveSize(Math.round(bottomH * 0.08), nameText, 16);
  const phoneSz = Math.round(bottomH * 0.065);
  const detailSz = Math.round(bottomH * 0.04);

  return (
    <div style={{ width, height, fontFamily, display: "flex", flexDirection: "column" }}>
      <div style={{ height: topH, backgroundColor: topColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: Math.round(width * 0.06), textAlign: "center" }}>
        <p style={{ fontSize: headerSz, fontWeight: 900, color: topLight ? "#000" : "#fff", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.0 }}>{headerText || "FOR SALE"}</p>
        {logo && <img src={logo} alt="Logo" style={{ maxHeight: logoMaxH, maxWidth: logoMaxW, objectFit: "contain", marginTop: Math.round(topH * 0.08) }} />}
        {!logo && brokerageText && <p style={{ fontSize: Math.round(topH * 0.10), fontWeight: 700, color: topLight ? "#000" : "#fff", marginTop: Math.round(topH * 0.06), textTransform: "uppercase", letterSpacing: "0.08em" }}>{brokerageText}</p>}
      </div>
      <div style={{ height: bottomH, backgroundColor: bottomColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `${Math.round(width * 0.03)}px ${Math.round(width * 0.06)}px`, textAlign: "center", gap: Math.round(bottomH * 0.01) }}>
        {headshot ? <img src={headshot} alt="Agent" style={{ width: headshotSz, height: headshotSz, objectFit: "cover", borderRadius: "50%", border: `${Math.round(width / 5400 * 6)}px solid ${topColor}` }} /> : <div style={{ width: headshotSz, height: headshotSz, backgroundColor: bottomLight ? "#e5e7eb" : "rgba(255,255,255,0.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><User style={{ width: headshotSz * 0.35, height: headshotSz * 0.35, color: bottomMuted }} /></div>}
        <p style={{ fontSize: nameSz, fontWeight: 800, color: bottomText, lineHeight: 1.1, overflowWrap: "break-word", margin: 0 }}>{nameText}</p>
        <p style={{ fontSize: detailSz, color: bottomMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Real Estate Agent</p>
        <p style={{ fontSize: phoneSz, fontWeight: 700, color: bottomText, margin: 0 }}>{phoneText}</p>
        {email && <p style={{ fontSize: detailSz, color: bottomMuted, overflowWrap: "break-word", margin: 0 }}>{email}</p>}
        {bulletPoints && bulletPoints.filter(Boolean).length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(width * 0.02), marginTop: Math.round(bottomH * 0.015), flexWrap: "wrap" }}>
            {bulletPoints.filter(Boolean).map((bp, i) => (
              <span key={i} style={{ fontSize: detailSz, fontWeight: 600, color: bottomText, opacity: 0.7, letterSpacing: "0.02em" }}>
                {i > 0 && <span style={{ margin: `0 ${Math.round(width * 0.008)}px`, color: topColor }}>·</span>}
                {bp}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(width * 0.04) }}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: Math.round(bottomH * 0.18), height: Math.round(bottomH * 0.18), borderRadius: 4 }} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROPERTY PDF PAGE
   ─────────────────────────────────────────────────────
   • Full-width hero, editorial details below
   • Description overflow continues to page 2
   • Photo grid with rounded corners + page footer
   ═══════════════════════════════════════════════════════ */

export function PropertyPdfPage({ pageNumber, address, cityStateZip, price, beds, baths, sqft, description, features, photos, accentColor, fontFamily }: {
  pageNumber: number; address: string; cityStateZip: string; price: string; beds: string; baths: string; sqft: string; description: string; features: string; photos: string[]; accentColor: string; fontFamily: string;
}) {
  const W = 2550;
  const H = 3300;
  const accent = accentColor || "#0e7490";
  const headerBarH = 14;
  const margin = 80;

  // Estimate description overflow
  const featureLines = features ? features.split("\n").filter(Boolean).length : 0;
  const descLines = description ? description.split("\n").filter(Boolean) : [];
  const estimatedFeatureH = featureLines * 70 + (featureLines > 0 ? 80 : 0);
  const maxDescH = 1400 - estimatedFeatureH;
  const descLineH = 52;
  const maxDescLines = Math.floor(maxDescH / descLineH);

  let page1Desc = descLines;
  let overflowDesc: string[] = [];
  if (descLines.length > maxDescLines && maxDescLines > 0) {
    page1Desc = descLines.slice(0, maxDescLines);
    overflowDesc = descLines.slice(maxDescLines);
  }

  const hasOverflow = overflowDesc.length > 0;
  const page2PhotoSlots = hasOverflow ? 4 : 6;

  if (pageNumber === 0) {
    const heroPhoto = photos[0] || null;
    const photo2 = photos[1] || null;
    const photo3 = photos[2] || null;
    const pad = 100;
    const photoGap = 10;
    const heroH = Math.round(H * 0.42);
    const leftW = Math.round(W * 0.48);
    const rightW = W - leftW;
    const addressText = address || "Property Name";
    const cityText = cityStateZip || "City, State";
    const priceText = price ? `$${price}` : "$000,000";
    const detailsText = [beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`].filter(Boolean).join("  ·  ");

    return (
      <div style={{ width: W, height: H, backgroundColor: "#ffffff", fontFamily, position: "relative", padding: margin }}>
        <div style={{ position: "absolute", top: margin, left: margin, right: margin, height: headerBarH, backgroundColor: accent }} />
        <div style={{ position: "absolute", top: margin + headerBarH, left: margin, right: margin, height: heroH, overflow: "hidden" }}>
          {heroPhoto ? (
            <img src={heroPhoto} alt="Hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", backgroundColor: "#f0efea", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#ccc", fontSize: 48, fontWeight: 500, letterSpacing: "0.08em" }}>HERO PHOTO</span>
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundImage: "linear-gradient(to top, rgba(255,255,255,0.6), transparent)" }} />
        </div>
        <div style={{ position: "absolute", top: heroH + headerBarH + margin, left: margin, right: margin, bottom: margin + headerBarH, display: "flex" }}>
          <div style={{ width: leftW, padding: `${pad * 0.6}px ${pad * 0.6}px ${pad * 0.5}px ${pad * 0.3}px`, display: "flex", flexDirection: "column", justifyContent: "flex-start", overflow: "hidden" }}>
            <p style={{ fontSize: 42, color: accent, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, margin: 0, lineHeight: 1 }}>Introducing</p>
            <p style={{ fontSize: responsiveSize(88, addressText, 18), color: "#1a1a1a", fontWeight: 800, lineHeight: 1.05, margin: 0, marginTop: 12, overflowWrap: "break-word" }}>{addressText}</p>
            <p style={{ fontSize: 36, color: "#666", fontWeight: 500, margin: 0, marginTop: 10, letterSpacing: "0.02em" }}>{cityText}</p>
            <div style={{ width: 70, height: 4, backgroundColor: accent, marginTop: 28, borderRadius: 2 }} />
            <p style={{ fontSize: 96, fontWeight: 800, color: accent, margin: 0, marginTop: 14, lineHeight: 1.0, letterSpacing: "-0.02em" }}>{priceText}</p>
            {detailsText && <p style={{ fontSize: 36, color: "#555", fontWeight: 600, margin: 0, marginTop: 10, letterSpacing: "0.06em" }}>{detailsText}</p>}
            {features && (
              <div style={{ marginTop: 36 }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#333", letterSpacing: "0.10em", textTransform: "uppercase" as const, margin: 0, marginBottom: 16 }}>Key Features</p>
                <div style={{ fontSize: 32, color: "#444", lineHeight: 2.0 }}>
                  {features.split("\n").filter(Boolean).map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <span style={{ color: accent, flexShrink: 0, fontWeight: 700, fontSize: 24, marginTop: 5 }}>—</span>
                      <span style={{ fontWeight: 500 }}>{f.replace(/^[•\-*]\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {page1Desc.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#333", letterSpacing: "0.10em", textTransform: "uppercase" as const, margin: 0, marginBottom: 14 }}>About This Property</p>
                <div style={{ fontSize: 30, color: "#555", lineHeight: 1.7, overflowWrap: "break-word" }}>
                  {page1Desc.map((p, i) => <p key={i} style={{ margin: 0, marginBottom: 10 }}>{p}</p>)}
                </div>
              </div>
            )}
          </div>
          <div style={{ width: 3, backgroundColor: accent, opacity: 0.15, marginTop: Math.round(pad * 0.5), marginBottom: Math.round(pad * 0.5), flexShrink: 0 }} />
          <div style={{ width: rightW, display: "flex", flexDirection: "column", padding: `${Math.round(pad * 0.4)}px ${Math.round(pad * 0.3)}px ${Math.round(pad * 0.4)}px ${Math.round(pad * 0.4)}px`, gap: photoGap }}>
            <div style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
              {photo2 ? <img src={photo2} alt="Photo 2" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f0efea", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#ccc", fontSize: 38, fontWeight: 500 }}>Photo 2</span></div>}
            </div>
            <div style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
              {photo3 ? <img src={photo3} alt="Photo 3" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f0", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#ccc", fontSize: 38, fontWeight: 500 }}>Photo 3</span></div>}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: margin, left: margin, right: margin, height: headerBarH, backgroundColor: accent }} />
      </div>
    );
  }

  /* ═══════════════════════════════════════
     PHOTO GRID PAGES (page 2+) with overflow
     ═══════════════════════════════════════ */
  const isFirstGridPage = pageNumber === 1;
  const showOverflow = isFirstGridPage && hasOverflow;
  let startIdx: number;
  if (pageNumber === 1) { startIdx = 3; }
  else if (hasOverflow) { startIdx = 3 + page2PhotoSlots + (pageNumber - 2) * 6; }
  else { startIdx = 3 + (pageNumber - 1) * 6; }
  const slotsOnPage = (isFirstGridPage && hasOverflow) ? page2PhotoSlots : 6;
  const pagePhotos = photos.slice(startIdx, startIdx + slotsOnPage);
  const pgPad = 100;
  const pgGap = 24;
  const footerH = 80;
  const overflowH = showOverflow ? 600 : 0;
  const gridH = H - pgPad * 2 - footerH - headerBarH - overflowH;
  const colW = Math.round((W - pgPad * 2 - pgGap) / 2);
  const rows = showOverflow ? 2 : 3;
  const photoH = Math.round((gridH - pgGap * (rows - 1)) / rows);
  const photoRadius = 16;
  const photosAfterPage1 = Math.max(0, photos.length - 3);
  let totalPages: number;
  if (hasOverflow) { const pAP2 = Math.max(0, photosAfterPage1 - page2PhotoSlots); totalPages = 2 + Math.ceil(pAP2 / 6); }
  else { totalPages = 1 + Math.ceil(photosAfterPage1 / 6); }

  return (
    <div style={{ width: W, height: H, backgroundColor: "#ffffff", fontFamily, position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: headerBarH, backgroundColor: accent }} />
      {showOverflow && (
        <div style={{ padding: `${pgPad + headerBarH}px ${pgPad}px 0`, height: overflowH }}>
          <div style={{ fontSize: 30, color: "#555", lineHeight: 1.7, overflowWrap: "break-word" }}>
            {overflowDesc.map((p, i) => <p key={i} style={{ margin: 0, marginBottom: 10 }}>{p}</p>)}
          </div>
        </div>
      )}
      <div style={{ padding: `${showOverflow ? pgGap : pgPad + headerBarH}px ${pgPad}px ${pgPad}px`, display: "flex", flexDirection: "column", height: gridH + (showOverflow ? 0 : pgPad) }}>
        <div style={{ flex: 1, display: "flex", gap: pgGap }}>
          <div style={{ width: colW, display: "flex", flexDirection: "column", gap: pgGap }}>
            {Array.from({ length: rows }, (_, r) => r * 2).map((idx) => {
              const photo = pagePhotos[idx];
              return (<div key={idx} style={{ height: photoH, borderRadius: photoRadius, overflow: "hidden", backgroundColor: photo ? undefined : "#f5f5f0" }}>{photo && <img src={photo} alt={`Photo ${startIdx + idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>);
            })}
          </div>
          <div style={{ width: colW, display: "flex", flexDirection: "column", gap: pgGap }}>
            {Array.from({ length: rows }, (_, r) => r * 2 + 1).map((idx) => {
              const photo = pagePhotos[idx];
              return (<div key={idx} style={{ height: photoH, borderRadius: photoRadius, overflow: "hidden", backgroundColor: photo ? undefined : "#f5f5f0" }}>{photo && <img src={photo} alt={`Photo ${startIdx + idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>);
            })}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: footerH + headerBarH, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: headerBarH }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 40, height: 2, backgroundColor: "#ddd" }} />
          <p style={{ fontSize: 30, color: "#999", fontWeight: 500, letterSpacing: "0.06em", margin: 0 }}>{address}{cityStateZip ? ` · ${cityStateZip}` : ""}</p>
          <div style={{ width: 40, height: 2, backgroundColor: "#ddd" }} />
          <p style={{ fontSize: 28, color: "#bbb", fontWeight: 500, margin: 0 }}>Page {pageNumber + 1} of {totalPages}</p>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: headerBarH, backgroundColor: accent }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BRANDING CARD TEMPLATE
   ─────────────────────────────────────────────────────
   • Agent info is the HERO — name under headshot, prominent
   • Rounded headshot with accent border
   • Corner accent marks for premium frame
   • Property info is secondary, shown below agent
   ═══════════════════════════════════════════════════════ */

export function BrandingCardTemplate({ orientation, logo, headshot, agentName, phone, email, brokerage, tagline, address, cityState, price, features, bgColor, accentColor, bgPhoto, fontFamily }: {
  orientation: { width: number; height: number; id: string }; logo: string | null; headshot: string | null; agentName: string; phone: string; email: string; brokerage: string; tagline: string; address: string; cityState: string; price: string; features: string; bgColor: string; accentColor: string; bgPhoto: string | null; fontFamily: string;
}) {
  const w = orientation.width, h = orientation.height, isVertical = orientation.id === "vertical";
  const isLightBg = bgColor && !bgPhoto ? isLightColor(bgColor) : false;
  const textColor = isLightBg ? "#1a1a2e" : "#ffffff";
  const textMuted = isLightBg ? "rgba(26,26,46,0.50)" : "rgba(255,255,255,0.55)";
  const borderColor = isLightBg ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
  const accent = accentColor || textColor;
  const cornerLen = isVertical ? 40 : 50;
  const cornerW = 2;
  const hasProperty = !!(address || price);

  const renderCorners = (ix: number, iy: number) => (
    <>
      <div style={{ position: "absolute", top: iy, left: ix, width: cornerLen, height: cornerW, backgroundColor: accent, opacity: 0.35 }} />
      <div style={{ position: "absolute", top: iy, left: ix, width: cornerW, height: cornerLen, backgroundColor: accent, opacity: 0.35 }} />
      <div style={{ position: "absolute", top: iy, right: ix, width: cornerLen, height: cornerW, backgroundColor: accent, opacity: 0.35 }} />
      <div style={{ position: "absolute", top: iy, right: ix, width: cornerW, height: cornerLen, backgroundColor: accent, opacity: 0.35 }} />
      <div style={{ position: "absolute", bottom: iy, left: ix, width: cornerLen, height: cornerW, backgroundColor: accent, opacity: 0.35 }} />
      <div style={{ position: "absolute", bottom: iy, left: ix, width: cornerW, height: cornerLen, backgroundColor: accent, opacity: 0.35 }} />
      <div style={{ position: "absolute", bottom: iy, right: ix, width: cornerLen, height: cornerW, backgroundColor: accent, opacity: 0.35 }} />
      <div style={{ position: "absolute", bottom: iy, right: ix, width: cornerW, height: cornerLen, backgroundColor: accent, opacity: 0.35 }} />
    </>
  );

  const nameText = agentName || "Agent Name";

  /* ══════════ VERTICAL (1080×1920) ══════════ */
  if (isVertical) {
    const u = w / 1080;
    const inset = Math.round(24 * u), radius = Math.round(24 * u), border = Math.round(3 * u), pad = Math.round(44 * u);
    const headshotSz = Math.round(400 * u), frameBorder = Math.round(6 * u);
    const nameFontSize = responsiveSize(Math.round(60 * u), nameText, 16);

    return (
      <div style={{ width: w, height: h, background: "transparent" }}>
        <div style={{ position: "absolute", inset, borderRadius: radius, border: `${border}px solid ${borderColor}`, backgroundColor: bgColor || "#14532d", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: pad, fontFamily }}>
          {bgPhoto && <><img src={bgPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)" }} /></>}
          {renderCorners(Math.round(36 * u), Math.round(36 * u))}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(6 * u) }}>
            {/* Logo at top */}
            {logo && <img src={logo} alt="Logo" style={{ maxWidth: Math.round(320 * u), maxHeight: Math.round(120 * u), objectFit: "contain" as const, marginBottom: Math.round(16 * u) }} />}
            {/* Headshot — rounded with accent ring */}
            {headshot ? (
              <div style={{ padding: frameBorder, background: accentColor ? `linear-gradient(135deg, ${accentColor}, ${hexToRgba(accentColor, 0.3)})` : borderColor, borderRadius: Math.round(20 * u) }}>
                <img src={headshot} alt="Agent" style={{ width: headshotSz, height: headshotSz, objectFit: "cover", borderRadius: Math.round(16 * u), display: "block" }} />
              </div>
            ) : (
              <div style={{ width: headshotSz, height: headshotSz, backgroundColor: "rgba(255,255,255,0.06)", border: `${frameBorder}px solid ${borderColor}`, borderRadius: Math.round(20 * u), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: 80 * u, height: 80 * u, color: textMuted }} />
              </div>
            )}
            {/* Agent Name — HERO */}
            <p style={{ fontSize: nameFontSize, fontWeight: 800, color: accent, margin: 0, marginTop: Math.round(14 * u), whiteSpace: "nowrap" }}>{nameText}</p>
            {/* Accent rule */}
            <div style={{ width: Math.round(60 * u), height: 2, backgroundColor: accent, opacity: 0.4, margin: `${Math.round(4 * u)}px 0` }} />
            {/* Brokerage */}
            {brokerage && <p style={{ fontSize: Math.round(34 * u), color: textMuted, margin: 0, fontWeight: 500 }}>{brokerage}</p>}
            {/* Contact — prominent */}
            <div style={{ display: "flex", justifyContent: "center", gap: Math.round(20 * u), flexWrap: "wrap", marginTop: Math.round(4 * u) }}>
              {phone && <span style={{ fontSize: Math.round(32 * u), color: textColor, fontWeight: 600 }}>{phone}</span>}
              {email && <span style={{ fontSize: Math.round(30 * u), color: textMuted }}>{email}</span>}
            </div>
            {/* Tagline */}
            {tagline && <p style={{ fontSize: Math.round(28 * u), color: accentColor || textMuted, fontStyle: "italic", margin: 0, marginTop: Math.round(6 * u) }}>{tagline}</p>}
            {/* Property info — secondary, below a divider */}
            {hasProperty && (
              <div style={{ marginTop: Math.round(24 * u), paddingTop: Math.round(20 * u), borderTop: `1px solid ${borderColor}`, width: "80%" }}>
                {address && <p style={{ fontSize: responsiveSize(Math.round(54 * u), address, 18), fontWeight: 700, color: textColor, margin: 0, lineHeight: 1.1, overflowWrap: "break-word" }}>{address}</p>}
                {cityState && <p style={{ fontSize: Math.round(36 * u), fontWeight: 500, color: textMuted, margin: 0, marginTop: Math.round(6 * u) }}>{cityState}</p>}
                {price && <p style={{ fontSize: Math.round(50 * u), fontWeight: 800, color: accent, margin: 0, marginTop: Math.round(12 * u) }}>${price}</p>}
                {features && <div style={{ marginTop: Math.round(10 * u), color: textMuted, fontSize: Math.round(30 * u), lineHeight: 1.6 }}>{features.split("\n").filter(Boolean).map((f, i) => <div key={i}>{f}</div>)}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════ LANDSCAPE (1920×1080) ══════════ */
  const u = w / 1920, uh = h / 1080;
  const inset = Math.round(36 * u), radius = Math.round(36 * u), borderW = Math.round(4 * u);
  const contentPadX = Math.round(60 * u), contentPadY = Math.round(44 * uh);
  const innerH = h - inset * 2 - borderW * 2;
  const innerW = w - inset * 2 - borderW * 2;
  const headshotSz = Math.round(innerH * 0.55);
  const frameBorder = Math.round(6 * u);
  const nameFontSize = responsiveSize(Math.round(h * 0.065), nameText, 16);

  return (
    <div style={{ width: w, height: h, background: "transparent" }}>
      <div style={{ position: "absolute", inset, borderRadius: radius, border: `${borderW}px solid ${borderColor}`, backgroundColor: bgColor || "#14532d", overflow: "hidden", fontFamily }}>
        {bgPhoto && <><img src={bgPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)" }} /></>}
        {renderCorners(Math.round(28 * u), Math.round(28 * u))}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", width: "100%", height: "100%", padding: `${contentPadY}px ${contentPadX}px` }}>

          {/* LEFT — Agent headshot + name (HERO) */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginRight: Math.round(40 * u) }}>
            {headshot ? (
              <div style={{ padding: frameBorder, background: accentColor ? `linear-gradient(135deg, ${accentColor}, ${hexToRgba(accentColor, 0.3)})` : `linear-gradient(135deg, ${borderColor}, transparent)`, borderRadius: Math.round(16 * u) }}>
                <img src={headshot} alt="Agent" style={{ width: headshotSz, height: headshotSz, objectFit: "cover", borderRadius: Math.round(12 * u), display: "block" }} />
              </div>
            ) : (
              <div style={{ width: headshotSz, height: headshotSz, backgroundColor: "rgba(255,255,255,0.04)", border: `${frameBorder}px solid ${borderColor}`, borderRadius: Math.round(16 * u), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: 80 * u, height: 80 * u, color: textMuted }} />
              </div>
            )}
            {/* Name under photo */}
            <p style={{ fontSize: nameFontSize, fontWeight: 800, color: accent, margin: 0, marginTop: Math.round(12 * uh), textAlign: "center", whiteSpace: "nowrap" }}>{nameText}</p>
          </div>

          {/* RIGHT — Info */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            {/* Logo */}
            {logo && <img src={logo} alt="Logo" style={{ maxWidth: Math.round(innerW * 0.22), maxHeight: Math.round(innerH * 0.16), objectFit: "contain" as const, marginBottom: Math.round(16 * u) }} />}
            {/* Brokerage */}
            {brokerage && <p style={{ fontSize: Math.round(h * 0.042), color: textMuted, margin: 0 }}>{brokerage}</p>}
            {/* Contact */}
            <div style={{ display: "flex", gap: Math.round(20 * u), marginTop: Math.round(h * 0.012), flexWrap: "wrap" }}>
              {phone && <span style={{ fontSize: Math.round(h * 0.042), color: textColor, fontWeight: 600 }}>{phone}</span>}
              {email && <span style={{ fontSize: Math.round(h * 0.038), color: textMuted }}>{email}</span>}
            </div>
            {/* Tagline */}
            {tagline && <p style={{ fontSize: Math.round(h * 0.038), color: accentColor || textMuted, fontStyle: "italic", margin: 0, marginTop: Math.round(h * 0.012) }}>{tagline}</p>}
            {/* Property info — secondary, below divider */}
            {hasProperty && (
              <div style={{ marginTop: Math.round(h * 0.03), paddingTop: Math.round(h * 0.025), borderTop: `1px solid ${borderColor}` }}>
                {address && <p style={{ fontSize: responsiveSize(Math.round(h * 0.072), address, 18), fontWeight: 700, color: textColor, margin: 0, lineHeight: 1.1, overflowWrap: "break-word" }}>{address}</p>}
                {cityState && <p style={{ fontSize: Math.round(h * 0.042), fontWeight: 500, color: textMuted, margin: 0, marginTop: Math.round(h * 0.01) }}>{cityState}</p>}
                {price && <p style={{ fontSize: Math.round(h * 0.065), fontWeight: 800, color: accent, margin: 0, marginTop: Math.round(h * 0.015) }}>${price}</p>}
                {features && <div style={{ marginTop: Math.round(h * 0.015), color: textMuted, fontSize: Math.round(h * 0.036), lineHeight: 1.5 }}>{features.split("\n").filter(Boolean).map((f, i) => <div key={i}>{f}</div>)}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BADGE CONFIG
   ═══════════════════════════════════════════════════════ */

export type TemplateType = "just-listed" | "open-house" | "price-reduced" | "just-sold";

export function getBadgeConfig(templateId: TemplateType) {
  switch (templateId) {
    case "just-listed": return { text: "JUST LISTED", color: "#2563eb" };
    case "open-house": return { text: "OPEN HOUSE", color: "#059669" };
    case "price-reduced": return { text: "PRICE REDUCED", color: "#dc2626" };
    case "just-sold": return { text: "JUST SOLD", color: "#d97706" };
  }
}
