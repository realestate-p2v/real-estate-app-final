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
   ═══════════════════════════════════════════════════════ */

export function OpenHouseTemplate({ size, listingPhoto, videoElement, headshot, logo, address, beds, baths, sqft, price, date, time, agentName, phone, brokerage, fontFamily, barColor, accentColor }: {
  size: SizeConfig; listingPhoto: string | null; videoElement?: React.ReactNode; headshot: string | null; logo: string | null; address: string; beds: string; baths: string; sqft: string; price: string; date: string; time: string; agentName: string; phone: string; brokerage: string; fontFamily: string; barColor: string; accentColor: string;
}) {
  const w = size.width, h = size.height, isStory = size.id === "story", unit = w / 1080;
  const accent = accentColor || "#ffffff";
  const badgeBg = accentColor || "#059669";
  const pad = Math.round(40 * unit);

  const agentNameText = agentName || "Agent Name";
  const addressText = address || "123 Main Street";
  const contactLine = [brokerage, phone].filter(Boolean).join("  ·  ") || "Brokerage  ·  (555) 000-0000";

  const addressFontSize = responsiveSize(Math.round(30 * unit), addressText, 24);
  const agentFontSize = responsiveSize(Math.round(24 * unit), agentNameText, 20);
  const contactFontSize = responsiveSize(Math.round(20 * unit), contactLine, 35);

  return (
    <div className="relative overflow-hidden bg-gray-900" style={{ width: w, height: h, fontFamily }}>
      {videoElement ? (
        <div className="absolute inset-0">{videoElement}</div>
      ) : listingPhoto ? (
        <img src={listingPhoto} alt="Listing" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gray-700 flex items-center justify-center"><ImageIcon className="text-gray-500" style={{ width: 100 * unit, height: 100 * unit }} /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80" />
      <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-center text-center text-white" style={{ height: isStory ? "28%" : "36%", padding: `0 ${pad}px` }}>
        <div className="inline-block text-white font-black uppercase tracking-[0.15em] rounded-sm" style={{ fontSize: Math.round(36 * unit), padding: `${Math.round(8 * unit)}px ${Math.round(24 * unit)}px`, backgroundColor: badgeBg }}>Open House</div>
        <p className="font-bold text-white" style={{ fontSize: Math.round(32 * unit), marginTop: Math.round(16 * unit) }}>{date || "Saturday, March 22"}</p>
        <p className="text-white/80 font-semibold" style={{ fontSize: Math.round(26 * unit), marginTop: Math.round(4 * unit) }}>{time || "1:00 PM – 4:00 PM"}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ padding: `0 ${pad}px` }}>
        <div className="text-center text-white" style={{ marginBottom: Math.round(12 * unit) }}>
          <p className="font-bold leading-tight" style={{ fontSize: addressFontSize, overflowWrap: "break-word" }}>{addressText}</p>
          <p className="text-white/80" style={{ fontSize: Math.round(24 * unit), marginTop: Math.round(4 * unit) }}>{[beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`].filter(Boolean).join("  ·  ") || "3 BD  ·  2 BA  ·  1,800 SF"}</p>
          <p className="font-black" style={{ fontSize: Math.round(44 * unit), marginTop: Math.round(8 * unit), lineHeight: 1.1, color: accent }}>{price ? `$${price}` : "$000,000"}</p>
        </div>
        <div className="flex items-center justify-center backdrop-blur-sm rounded-t-xl" style={{ padding: `${Math.round(14 * unit)}px ${Math.round(20 * unit)}px`, gap: Math.round(14 * unit), backgroundColor: barColor + "cc" }}>
          {headshot ? <img src={headshot} alt="Agent" className="rounded-full object-cover flex-shrink-0" style={{ width: Math.round(90 * unit), height: Math.round(90 * unit), border: `${Math.round(3 * unit)}px solid rgba(255,255,255,0.3)` }} /> : <div className="rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0" style={{ width: Math.round(90 * unit), height: Math.round(90 * unit) }}><User className="text-gray-400" style={{ width: 32 * unit, height: 32 * unit }} /></div>}
          <div className="text-white min-w-0">
            <p className="font-bold" style={{ fontSize: agentFontSize, overflowWrap: "break-word" }}>{agentNameText}</p>
            <p className="text-white/60" style={{ fontSize: contactFontSize, overflowWrap: "break-word" }}>{contactLine}</p>
          </div>
          {logo && <img src={logo} alt="Logo" className="object-contain flex-shrink-0 ml-auto" style={{ maxWidth: Math.round(120 * unit), maxHeight: Math.round(56 * unit), opacity: 1 }} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   YARD SIGN — SPLIT BAR
   ═══════════════════════════════════════════════════════ */

export function YardSignSplitBar({ width, height, headshot, logo, agentName, phone, email, brokerage, officeName, officePhone, headerText, topColor, bottomColor, fontFamily, qrDataUrl }: {
  width: number; height: number; headshot: string | null; logo: string | null; agentName: string; phone: string; email: string; brokerage: string; officeName: string; officePhone: string; headerText: string; topColor: string; bottomColor: string; fontFamily: string; qrDataUrl: string | null;
}) {
  const topH = Math.round(height * 0.18);
  const bottomH = Math.round(height * 0.18);
  const centerH = height - topH - bottomH;
  const headshotSz = Math.round(centerH * 0.55);
  const topLight = isLightColor(topColor);
  const bottomLight = isLightColor(bottomColor);

  const nameText = agentName || "AGENT NAME";
  const phoneText = phone || "321-555-4321";
  const officeText = officeName || brokerage || "OFFICE NAME";

  const headerSz = Math.round(topH * 0.50);
  const nameSz = responsiveSize(Math.round(centerH * 0.12), nameText, 16);
  const phoneSz = Math.round(centerH * 0.10);
  const detailSz = Math.round(centerH * 0.055);
  const bottomNameSz = responsiveSize(Math.round(bottomH * 0.28), officeText, 18);
  const bottomPhoneSz = Math.round(bottomH * 0.24);

  return (
    <div style={{ width, height, fontFamily, display: "flex", flexDirection: "column" }}>
      <div style={{ height: topH, backgroundColor: topColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: headerSz, fontWeight: 900, color: topLight ? "#000" : "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>{headerText || "FOR SALE"}</p>
      </div>
      <div style={{ height: centerH, backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: Math.round(width * 0.05), gap: Math.round(width * 0.05) }}>
        <div style={{ flexShrink: 0 }}>
          {headshot ? <img src={headshot} alt="Agent" style={{ width: headshotSz, height: headshotSz, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: headshotSz, height: headshotSz, backgroundColor: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><User style={{ width: headshotSz * 0.4, height: headshotSz * 0.4, color: "#9ca3af" }} /></div>}
        </div>
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: nameSz, fontWeight: 800, color: "#111", lineHeight: 1.15, overflowWrap: "break-word" }}>{nameText}</p>
          <p style={{ fontSize: phoneSz, fontWeight: 700, color: "#111", marginTop: Math.round(height * 0.012) }}>{phoneText}</p>
          {email && <p style={{ fontSize: detailSz, color: "#555", marginTop: Math.round(height * 0.006), overflowWrap: "break-word" }}>{email}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: Math.round(width * 0.02), marginTop: Math.round(height * 0.015) }}>
            {logo && <img src={logo} alt="Logo" style={{ maxHeight: Math.round(centerH * 0.15), maxWidth: Math.round(width * 0.2), objectFit: "contain" }} />}
            {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: Math.round(centerH * 0.15), height: Math.round(centerH * 0.15), borderRadius: 4 }} />}
          </div>
        </div>
      </div>
      <div style={{ height: bottomH, backgroundColor: bottomColor, display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(width * 0.04), padding: `0 ${Math.round(width * 0.06)}px` }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: bottomNameSz, fontWeight: 800, color: bottomLight ? "#000" : "#fff", overflowWrap: "break-word" }}>{officeText}</p>
          {officePhone && <p style={{ fontSize: bottomPhoneSz, fontWeight: 700, color: bottomLight ? "#000" : "#fff", marginTop: 4 }}>{officePhone}</p>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   YARD SIGN — SIDEBAR
   ═══════════════════════════════════════════════════════ */

export function YardSignSidebar({ width, height, headshot, logo, agentName, phone, email, brokerage, website, headerText, sidebarColor, mainBgColor, fontFamily, qrDataUrl }: {
  width: number; height: number; headshot: string | null; logo: string | null; agentName: string; phone: string; email: string; brokerage: string; website: string; headerText: string; sidebarColor: string; mainBgColor: string; fontFamily: string; qrDataUrl: string | null;
}) {
  const sideW = Math.round(width * 0.18);
  const mainW = width - sideW;
  const sideLight = isLightColor(sidebarColor);
  const mainLight = isLightColor(mainBgColor);
  const mainText = mainLight ? "#111" : "#fff";
  const mainMuted = mainLight ? "#555" : "rgba(255,255,255,0.65)";
  const headshotSz = Math.round(mainW * 0.52);
  const headerSz = Math.round(height * 0.04);
  const logoSz = Math.round(sideW * 0.6);

  const nameText = agentName || "AGENT NAME";
  const phoneText = phone || "206.866.6678";
  const brokerageText = brokerage || "BROKERAGE";

  const nameSz = responsiveSize(Math.round(height * 0.048), nameText, 16);
  const phoneSz = Math.round(height * 0.038);
  const detailSz = Math.round(height * 0.024);

  return (
    <div style={{ width, height, fontFamily, display: "flex" }}>
      <div style={{ width: sideW, height, backgroundColor: sidebarColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: `${Math.round(height * 0.04)}px ${Math.round(sideW * 0.1)}px` }}>
        {logo && <img src={logo} alt="Logo" style={{ width: logoSz, height: logoSz, objectFit: "contain" }} />}
        <p style={{ fontSize: Math.round(sideW * 0.22), fontWeight: 800, color: sideLight ? "#000" : "#fff", writingMode: "vertical-rl", textOrientation: "mixed", letterSpacing: "0.12em", textTransform: "uppercase" }}>{brokerageText}</p>
        {logo && <img src={logo} alt="Logo" style={{ width: logoSz, height: logoSz, objectFit: "contain" }} />}
      </div>
      <div style={{ width: mainW, height, backgroundColor: mainBgColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: Math.round(width * 0.04), textAlign: "center" }}>
        {headshot ? <img src={headshot} alt="Agent" style={{ width: headshotSz, height: headshotSz, objectFit: "cover", borderRadius: "50%", border: `${Math.round(width * 0.01)}px solid ${sidebarColor}` }} /> : <div style={{ width: headshotSz, height: headshotSz, borderRadius: "50%", backgroundColor: mainLight ? "#e5e7eb" : "rgba(255,255,255,0.1)", border: `${Math.round(width * 0.01)}px solid ${sidebarColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}><User style={{ width: headshotSz * 0.35, height: headshotSz * 0.35, color: mainMuted }} /></div>}
        <p style={{ fontSize: nameSz, fontWeight: 800, color: mainText, marginTop: Math.round(height * 0.025), overflowWrap: "break-word" }}>{nameText}</p>
        <p style={{ fontSize: detailSz, color: mainMuted, marginTop: Math.round(height * 0.005), textTransform: "uppercase", letterSpacing: "0.05em" }}>Real Estate Agent</p>
        <p style={{ fontSize: phoneSz, fontWeight: 700, color: mainText, marginTop: Math.round(height * 0.02) }}>{phoneText}</p>
        {website && <p style={{ fontSize: detailSz, color: mainMuted, marginTop: Math.round(height * 0.008), overflowWrap: "break-word" }}>{website}</p>}
        {email && <p style={{ fontSize: detailSz, color: mainMuted, marginTop: Math.round(height * 0.005), overflowWrap: "break-word" }}>{email}</p>}
        {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: Math.round(height * 0.08), height: Math.round(height * 0.08), marginTop: Math.round(height * 0.015), borderRadius: 4 }} />}
        <div style={{ marginTop: Math.round(height * 0.03), backgroundColor: sidebarColor, padding: `${Math.round(height * 0.012)}px ${Math.round(width * 0.06)}px`, borderRadius: 4 }}>
          <p style={{ fontSize: headerSz, fontWeight: 900, color: sideLight ? "#000" : "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>{headerText || "FOR SALE"}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   YARD SIGN — TOP HEAVY
   ═══════════════════════════════════════════════════════ */

export function YardSignTopHeavy({ width, height, headshot, logo, agentName, phone, email, brokerage, headerText, topColor, bottomColor, fontFamily, qrDataUrl }: {
  width: number; height: number; headshot: string | null; logo: string | null; agentName: string; phone: string; email: string; brokerage: string; headerText: string; topColor: string; bottomColor: string; fontFamily: string; qrDataUrl: string | null;
}) {
  const topH = Math.round(height * 0.42);
  const bottomH = height - topH;
  const topLight = isLightColor(topColor);
  const bottomLight = isLightColor(bottomColor);
  const headerSz = Math.round(topH * 0.28);
  const logoMaxH = Math.round(topH * 0.22);
  const logoMaxW = Math.round(width * 0.45);
  const headshotSz = Math.round(bottomH * 0.50);
  const bottomText = bottomLight ? "#111" : "#fff";
  const bottomMuted = bottomLight ? "#555" : "rgba(255,255,255,0.65)";

  const nameText = agentName || "Agent Name";
  const phoneText = phone || "305.555.7315";
  const brokerageText = brokerage || "";

  const nameSz = responsiveSize(Math.round(bottomH * 0.10), nameText, 16);
  const phoneSz = Math.round(bottomH * 0.075);
  const detailSz = Math.round(bottomH * 0.05);

  return (
    <div style={{ width, height, fontFamily, display: "flex", flexDirection: "column" }}>
      <div style={{ height: topH, backgroundColor: topColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: Math.round(width * 0.06), textAlign: "center" }}>
        <p style={{ fontSize: headerSz, fontWeight: 900, color: topLight ? "#000" : "#fff", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.0 }}>{headerText || "FOR SALE"}</p>
        {logo && <img src={logo} alt="Logo" style={{ maxHeight: logoMaxH, maxWidth: logoMaxW, objectFit: "contain", marginTop: Math.round(topH * 0.08) }} />}
        {!logo && brokerageText && <p style={{ fontSize: Math.round(topH * 0.10), fontWeight: 700, color: topLight ? "#000" : "#fff", marginTop: Math.round(topH * 0.06), textTransform: "uppercase", letterSpacing: "0.08em" }}>{brokerageText}</p>}
      </div>
      <div style={{ height: bottomH, backgroundColor: bottomColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: Math.round(width * 0.06), textAlign: "center" }}>
        {headshot ? <img src={headshot} alt="Agent" style={{ width: headshotSz, height: headshotSz, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: headshotSz, height: headshotSz, backgroundColor: bottomLight ? "#e5e7eb" : "rgba(255,255,255,0.08)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><User style={{ width: headshotSz * 0.35, height: headshotSz * 0.35, color: bottomMuted }} /></div>}
        <p style={{ fontSize: nameSz, fontWeight: 800, color: bottomText, marginTop: Math.round(bottomH * 0.04), lineHeight: 1.1, overflowWrap: "break-word" }}>{nameText}</p>
        <p style={{ fontSize: detailSz, color: bottomMuted, marginTop: Math.round(bottomH * 0.01), textTransform: "uppercase", letterSpacing: "0.05em" }}>Real Estate Agent</p>
        <p style={{ fontSize: phoneSz, fontWeight: 700, color: bottomText, marginTop: Math.round(bottomH * 0.025) }}>{phoneText}</p>
        {email && <p style={{ fontSize: detailSz, color: bottomMuted, marginTop: Math.round(bottomH * 0.01), overflowWrap: "break-word" }}>{email}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(width * 0.04), marginTop: Math.round(bottomH * 0.025) }}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: Math.round(bottomH * 0.12), height: Math.round(bottomH * 0.12), borderRadius: 4 }} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROPERTY PDF PAGE
   ═══════════════════════════════════════════════════════ */

export function PropertyPdfPage({ pageNumber, address, cityStateZip, price, beds, baths, sqft, description, features, photos, accentColor, fontFamily }: {
  pageNumber: number; address: string; cityStateZip: string; price: string; beds: string; baths: string; sqft: string; description: string; features: string; photos: string[]; accentColor: string; fontFamily: string;
}) {
  const W = 2550;
  const H = 3300;
  const accent = accentColor || "#1a8a8a";

  if (pageNumber === 0) {
    const heroPhoto = photos[0] || null;
    const photo2 = photos[1] || null;
    const photo3 = photos[2] || null;
    const leftW = Math.round(W * 0.45);
    const rightW = W - leftW;
    const pad = 120;

    return (
      <div style={{ width: W, height: H, backgroundColor: "#f8f7f2", fontFamily, display: "flex" }}>
        <div style={{ width: leftW, padding: pad, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 72, color: accent, fontWeight: 700, fontStyle: "italic", lineHeight: 1.1 }}>Introducing</p>
          <p style={{ fontSize: responsiveSize(130, address || "Property Name", 14), color: accent, fontStyle: "italic", lineHeight: 0.95, marginTop: 4, overflowWrap: "break-word" }}>{address || "Property Name"}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 40, color: accent }}>📍</span>
            <p style={{ fontSize: 40, color: accent, fontWeight: 600 }}>{cityStateZip || "City, State"}</p>
          </div>
          <p style={{ fontSize: 44, fontWeight: 800, color: "#333", letterSpacing: "0.04em", marginTop: 50 }}>OFFERED AT:</p>
          <div style={{ backgroundColor: accent, display: "inline-block", padding: "16px 60px 16px 30px", marginTop: 12, marginLeft: -30, clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)" }}>
            <p style={{ fontSize: 120, fontWeight: 300, color: "#ffffff", lineHeight: 1.0 }}>{price ? `$${price}` : "$000,000"}</p>
          </div>
          {(beds || baths || sqft) && (
            <p style={{ fontSize: 40, color: "#555", marginTop: 16, fontWeight: 600 }}>
              {[beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`].filter(Boolean).join("  ·  ")}
            </p>
          )}
          {features && (
            <div>
              <p style={{ fontSize: 44, fontWeight: 800, color: "#333", marginTop: 44, marginBottom: 20 }}>
                {address ? `${address.toUpperCase()} FEATURES:` : "FEATURES:"}
              </p>
              <div style={{ fontSize: 38, color: "#444", lineHeight: 2.0 }}>
                {features.split("\n").filter(Boolean).map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ color: "#444", flexShrink: 0 }}>•</span>
                    <span>{f.replace(/^[•\-*]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {description && (
            <div>
              <p style={{ fontSize: 44, fontWeight: 800, color: accent, marginTop: 44, marginBottom: 20 }}>ABOUT THIS PROPERTY:</p>
              <div style={{ fontSize: 36, color: "#444", lineHeight: 1.8, overflowWrap: "break-word", overflowWrap: "break-word" }}>
                {description.split("\n").filter(Boolean).map((p, i) => (
                  <p key={i} style={{ marginBottom: 14 }}>{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ width: rightW, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 55, overflow: "hidden" }}>
            {heroPhoto ? <img src={heroPhoto} alt="Hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#e8e6e0", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#bbb", fontSize: 48 }}>Photo 1</span></div>}
          </div>
          <div style={{ flex: 45, display: "flex" }}>
            <div style={{ flex: 1, overflow: "hidden" }}>{photo2 ? <img src={photo2} alt="Photo 2" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#e0ded8", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#bbb", fontSize: 44 }}>Photo 2</span></div>}</div>
            <div style={{ flex: 1, overflow: "hidden" }}>{photo3 ? <img src={photo3} alt="Photo 3" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#e8e6e0", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#bbb", fontSize: 44 }}>Photo 3</span></div>}</div>
          </div>
        </div>
      </div>
    );
  }

  const startIdx = 3 + (pageNumber - 1) * 6;
  const pagePhotos = photos.slice(startIdx, startIdx + 6);
  const pgPad = 120;
  const pgGap = 30;
  const colW = Math.round((W - pgPad * 2 - pgGap) / 2);
  const photoH = Math.round((H - pgPad * 2 - pgGap * 2 - 80) / 3);

  return (
    <div style={{ width: W, height: H, backgroundColor: "#f8f7f2", fontFamily, padding: pgPad, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", gap: pgGap }}>
        <div style={{ width: colW, display: "flex", flexDirection: "column", gap: pgGap }}>
          {[0, 2, 4].map((idx) => { const photo = pagePhotos[idx]; return (<div key={idx} style={{ height: photoH, borderRadius: 12, overflow: "hidden", backgroundColor: photo ? undefined : "#f8f7f2" }}>{photo && <img src={photo} alt={`Photo ${startIdx + idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>); })}
        </div>
        <div style={{ width: colW, display: "flex", flexDirection: "column", gap: pgGap }}>
          {[1, 3, 5].map((idx) => { const photo = pagePhotos[idx]; return (<div key={idx} style={{ height: photoH, borderRadius: 12, overflow: "hidden", backgroundColor: photo ? undefined : "#f8f7f2" }}>{photo && <img src={photo} alt={`Photo ${startIdx + idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>); })}
        </div>
      </div>
      <p style={{ fontSize: 36, color: "#9ca3af", textAlign: "center", marginTop: 30 }}>
        {address}{cityStateZip ? ` · ${cityStateZip}` : ""}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BRANDING CARD TEMPLATE
   ═══════════════════════════════════════════════════════ */

export function BrandingCardTemplate({ orientation, logo, headshot, agentName, phone, email, brokerage, tagline, address, cityState, price, features, bgColor, accentColor, bgPhoto, fontFamily }: {
  orientation: { width: number; height: number; id: string }; logo: string | null; headshot: string | null; agentName: string; phone: string; email: string; brokerage: string; tagline: string; address: string; cityState: string; price: string; features: string; bgColor: string; accentColor: string; bgPhoto: string | null; fontFamily: string;
}) {
  const w = orientation.width, h = orientation.height, isVertical = orientation.id === "vertical";
  const isLightBg = bgColor && !bgPhoto ? isLightColor(bgColor) : false;
  const textColor = isLightBg ? "#1a1a2e" : "#ffffff";
  const textMuted = isLightBg ? "rgba(26,26,46,0.6)" : "rgba(255,255,255,0.7)";
  const borderColor = isLightBg ? "rgba(0,0,0,0.2)" : "rgba(180,180,180,0.5)";
  const accent = accentColor || textColor;

  if (isVertical) {
    const u = w / 1080;
    const inset = Math.round(24 * u), radius = Math.round(30 * u), border = Math.round(4 * u), pad = Math.round(56 * u);
    const headshotSz = Math.round(520 * u), frameBorder = Math.round(10 * u);

    const nameText = agentName || "Agent Name";
    const nameFontSize = responsiveSize(Math.round(52 * u), nameText, 18);

    return (
      <div style={{ width: w, height: h, background: "transparent" }}>
        <div style={{ position: "absolute", inset, borderRadius: radius, border: `${border}px solid ${borderColor}`, backgroundColor: bgColor || "#14532d", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: pad, fontFamily }}>
          {bgPhoto && <><img src={bgPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)" }} /></>}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%" }}>
            {headshot ? <img src={headshot} alt="Agent" style={{ width: headshotSz, height: headshotSz, objectFit: "cover", border: `${frameBorder}px solid white`, margin: "0 auto", display: "block" }} /> : <div style={{ width: headshotSz, height: headshotSz, backgroundColor: "rgba(255,255,255,0.08)", border: `${frameBorder}px solid ${borderColor}`, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}><User style={{ width: 100 * u, height: 100 * u, color: textMuted }} /></div>}
            <p style={{ fontSize: nameFontSize, fontWeight: 700, color: accent, marginTop: Math.round(20 * u), overflowWrap: "break-word" }}>{nameText}</p>
            {logo && <img src={logo} alt="Logo" style={{ maxWidth: Math.round(400 * u), maxHeight: Math.round(180 * u), objectFit: "contain", margin: `${Math.round(32 * u)}px auto`, display: "block" }} />}
            {address && <p style={{ fontSize: responsiveSize(Math.round(80 * u), address, 16), fontWeight: 800, color: textColor, marginTop: Math.round(28 * u), lineHeight: 1.05, overflowWrap: "break-word" }}>{address}</p>}
            {cityState && <p style={{ fontSize: Math.round(48 * u), fontWeight: 600, color: textColor, marginTop: Math.round(10 * u) }}>{cityState}</p>}
            {price && <p style={{ fontSize: Math.round(68 * u), fontWeight: 800, color: accent, marginTop: Math.round(24 * u) }}>${price}</p>}
            {features && <div style={{ marginTop: Math.round(22 * u), color: textMuted, fontSize: Math.round(40 * u), lineHeight: 1.6 }}>{features.split("\n").map((f, i) => <div key={i}>{f}</div>)}</div>}
            <div style={{ marginTop: Math.round(36 * u), display: "flex", justifyContent: "center", gap: Math.round(28 * u), flexWrap: "wrap" }}>
              {phone && <span style={{ fontSize: Math.round(34 * u), color: textMuted }}>{phone}</span>}
              {email && <span style={{ fontSize: Math.round(34 * u), color: textMuted, overflowWrap: "break-word" }}>{email}</span>}
            </div>
            {brokerage && <p style={{ fontSize: Math.round(34 * u), color: textMuted, marginTop: Math.round(8 * u), overflowWrap: "break-word" }}>{brokerage}</p>}
            {tagline && <p style={{ fontSize: Math.round(32 * u), color: accentColor || textMuted, fontStyle: "italic", marginTop: Math.round(10 * u) }}>{tagline}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Landscape
  const u = w / 1920, uh = h / 1080;
  const inset = Math.round(48 * u), radius = Math.round(48 * u), borderW = Math.round(7 * u);
  const contentPadX = Math.round(72 * u), contentPadY = Math.round(52 * uh);
  const innerH = h - inset * 2 - borderW * 2, innerW = w - inset * 2 - borderW * 2;
  const frameH = Math.round(innerH * 0.82), frameW = Math.round(innerW * 0.237), frameBorder = Math.round(10 * u);

  const nameText = agentName || "Your Name";
  const addrFontSize = responsiveSize(Math.round(h * 0.11), address || nameText, 14);

  return (
    <div style={{ width: w, height: h, background: "transparent" }}>
      <div style={{ position: "absolute", inset, borderRadius: radius, border: `${borderW}px solid ${borderColor}`, backgroundColor: bgColor || "#14532d", overflow: "hidden", fontFamily }}>
        {bgPhoto && <><img src={bgPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)" }} /></>}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "stretch", width: "100%", height: "100%", padding: `${contentPadY}px ${contentPadX}px` }}>
          <div style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: Math.round(20 * u), minWidth: 0 }}>
            {address ? <p style={{ fontSize: addrFontSize, fontWeight: 800, color: textColor, lineHeight: 1.05, margin: 0, overflowWrap: "break-word" }}>{address}</p> : <p style={{ fontSize: addrFontSize, fontWeight: 800, color: accent, lineHeight: 1.05, margin: 0, overflowWrap: "break-word" }}>{nameText}</p>}
            {cityState && <p style={{ fontSize: Math.round(h * 0.067), fontWeight: 600, color: textColor, margin: 0, marginTop: Math.round(h * 0.035) }}>{cityState}</p>}
            {price && <p style={{ fontSize: Math.round(h * 0.089), fontWeight: 800, color: accent, margin: 0, marginTop: Math.round(h * 0.045) }}>${price}</p>}
            {features && <div style={{ marginTop: Math.round(h * 0.04), color: textMuted, fontSize: Math.round(h * 0.050), lineHeight: 1.55 }}>{features.split("\n").map((f, i) => <div key={i}>{f}</div>)}</div>}
            {!address && tagline && <p style={{ fontSize: Math.round(h * 0.067), color: accentColor || textMuted, fontStyle: "italic", margin: 0, marginTop: Math.round(h * 0.03) }}>{tagline}</p>}
            {!address && brokerage && <p style={{ fontSize: Math.round(h * 0.050), color: textMuted, margin: 0, marginTop: Math.round(h * 0.02), overflowWrap: "break-word" }}>{brokerage}</p>}
            {!address && phone && <p style={{ fontSize: Math.round(h * 0.050), color: textMuted, margin: 0, marginTop: Math.round(h * 0.015) }}>{phone}</p>}
            {!address && email && <p style={{ fontSize: Math.round(h * 0.050), color: textMuted, margin: 0, marginTop: Math.round(h * 0.010), overflowWrap: "break-word" }}>{email}</p>}
          </div>
          <div style={{ flex: "0 0 24%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {logo ? <img src={logo} alt="Logo" style={{ maxWidth: Math.round(innerW * 0.18), maxHeight: Math.round(innerH * 0.50), objectFit: "contain" }} /> : <div style={{ width: Math.round(120 * u), height: Math.round(120 * u), borderRadius: "50%", border: `3px dashed ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon style={{ width: 40 * u, height: 40 * u, color: textMuted }} /></div>}
            {brokerage && address && <p style={{ fontSize: Math.round(h * 0.035), color: textMuted, marginTop: Math.round(16 * u), textAlign: "center", overflowWrap: "break-word" }}>{brokerage}</p>}
            {tagline && address && <p style={{ fontSize: Math.round(h * 0.032), color: accentColor || textMuted, fontStyle: "italic", marginTop: Math.round(10 * u), textAlign: "center", maxWidth: Math.round(innerW * 0.18) }}>{tagline}</p>}
          </div>
          <div style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {headshot ? <img src={headshot} alt="Agent" style={{ width: frameW, height: frameH, objectFit: "cover", border: `${frameBorder}px solid white` }} /> : <div style={{ width: frameW, height: frameH, backgroundColor: "rgba(255,255,255,0.06)", border: `${frameBorder}px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}><User style={{ width: 80 * u, height: 80 * u, color: textMuted }} /></div>}
            <p style={{ fontSize: responsiveSize(Math.round(h * 0.055), address ? (agentName || "Agent Name") : "", 18), fontWeight: 600, color: accent, marginTop: Math.round(10 * uh), textAlign: "center", overflowWrap: "break-word" }}>{address ? (agentName || "Agent Name") : ""}</p>
            {address && phone && <p style={{ fontSize: Math.round(h * 0.035), color: textMuted, marginTop: Math.round(4 * uh), textAlign: "center" }}>{phone}</p>}
            {address && email && <p style={{ fontSize: Math.round(h * 0.035), color: textMuted, marginTop: Math.round(2 * uh), textAlign: "center", overflowWrap: "break-word" }}>{email}</p>}
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
