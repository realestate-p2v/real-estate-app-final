// components/design-studio/listing-flyer-template-satori.tsx
//
// SATORI-SPECIFIC variant of ListingFlyerTemplate — used exclusively by the
// server-side PNG renderer at /api/render/branded-flyer.
//
// Tweaks vs. the Design Studio version:
//   - Every multi-child div has explicit display:flex (Satori requirement)
//   - Emojis dropped from URL labels (Satori has no emoji font loaded)
//   - word-break:break-all → break-word (Satori-friendly wrapping)
//   - Bottom 4-photo row uses explicit marginRight per chip (not
//     justifyContent:space-between, which had a rendering bug where
//     the row drifted off-canvas) + wrapped in overflow:hidden guard
//   - Description split on \n and rendered as multiple <p> tags so
//     paragraph breaks from Claude-generated descriptions render
//   - Description line-height 1.5 for readable but compact paragraphs
//   - Header text sizes bumped for stronger agent presence
//   - Amenity IDs humanized ("water_heater" → "Water Heater"; "ac" → "AC")
//   - Font weights locked to 400/700 (matching loaded DM Sans)
//   - Hard-coded 2550x3300 canvas (matches print flyer aspect)

import { User, Image as ImageIcon } from "lucide-react";
import { isLightColor, hexToRgba, truncateText } from "./helpers";

export interface ListingFlyerTemplateSatoriProps {
  photos: string[];
  headshot?: string | null;
  logo?: string | null;
  address: string;
  cityState?: string;
  price?: string;
  beds?: string | number;
  baths?: string | number;
  sqft?: string | number;
  description?: string;
  amenities?: string[];
  agentName: string;
  phone?: string;
  email?: string;
  brokerage?: string;
  listingUrl?: string;
  videoUrl?: string;
  stagingUrl?: string;
  accentColor?: string;
  fontFamily?: string;
}

/**
 * Turn a raw amenity ID like "water_heater" into a display label.
 * Special-cases short acronyms that should render uppercase
 * ("ac" → "AC", "ev_charging" → "EV Charging").
 */
function humanizeAmenity(raw: string): string {
  if (!raw) return raw;
  const ACRONYMS = new Set(["ac", "ev", "hoa", "hvac"]);
  return raw
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Split a description on newlines into paragraphs. Collapses multiple
 * blank lines so \n\n and \n both act as paragraph breaks.
 */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function ListingFlyerTemplateSatori({
  photos,
  headshot,
  logo,
  address,
  cityState,
  price,
  beds,
  baths,
  sqft,
  description,
  amenities,
  agentName,
  phone,
  email,
  brokerage,
  listingUrl,
  videoUrl,
  stagingUrl,
  accentColor,
  fontFamily,
}: ListingFlyerTemplateSatoriProps) {
  const W = 2550;
  const H = 3300;
  const M = 60; // outer margin

  const accent = accentColor || "#1e3a5f";
  const accentLight = isLightColor(accent);
  const accentText = accentLight ? "#111111" : "#ffffff";
  const accentTextRgb = accentLight ? "0,0,0" : "255,255,255";

  const ACCENT_BAR = 12;
  const BRAND_H = 240;
  const PHOTO_H = 1240;

  const ad = address || "123 Main Street";
  const cs = cityState || "City, State";
  const pr = price ? `$${price}` : "$000,000";
  const an = agentName || "Agent Name";

  const det =
    [
      beds && `${beds} BD`,
      baths && `${baths} BA`,
      sqft && `${sqft} SF`,
    ]
      .filter(Boolean)
      .join("  \u00b7  ") || "3 BD  \u00b7  2 BA  \u00b7  1,800 SF";

  const amList = Array.isArray(amenities)
    ? amenities.filter(Boolean).map(humanizeAmenity)
    : [];

  const descParagraphs = splitParagraphs(truncateText(description || "", 1536));

  const photoCount = (photos || []).length;
  const p1 = photos?.[0] || null;
  const p2 = photos?.[1] || null;
  const p3 = photos?.[2] || null;
  const bottomRow = photos?.slice(3, 7) || [];
  const showBottomRow = photoCount > 3 && bottomRow.length > 0;
  const bottomPhotoH = showBottomRow ? 340 : 0;

  const urlRows: { label: string; url: string }[] = [];
  if (listingUrl) urlRows.push({ label: "View full listing:", url: listingUrl });
  if (videoUrl) urlRows.push({ label: "Watch the video tour:", url: videoUrl });
  if (stagingUrl) urlRows.push({ label: "See the staged rooms:", url: stagingUrl });
  const hasUrls = urlRows.length > 0;

  const hsz = BRAND_H - 40;

  // Photo block layout (pre-computed, Satori prefers px over %)
  const photoBlockW = W - M * 2;
  const leftPhotoW = Math.round(photoBlockW * 0.58);
  const PHOTO_GAP = 20;
  const rightPhotoW = photoBlockW - leftPhotoW - PHOTO_GAP;
  const rightPhotoH = Math.round((PHOTO_H - PHOTO_GAP) / 2);
  // Bottom row: 4 chips with 3 gaps. Use floor so total width never exceeds
  // the container; any leftover pixels accumulate on the right edge as white.
  const bottomPhotoW = Math.floor((photoBlockW - PHOTO_GAP * 3) / 4);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: W,
        height: H,
        backgroundColor: "#ffffff",
        fontFamily: fontFamily || "DM Sans",
        position: "relative",
      }}
    >
      {/* ─── TOP ACCENT BAR ─── */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: M,
          left: M,
          right: M,
          height: ACCENT_BAR,
          backgroundColor: accent,
        }}
      />

      {/* ─── BRAND STRIP ─── */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: M + ACCENT_BAR,
          left: M,
          right: M,
          height: BRAND_H,
          backgroundColor: accent,
          alignItems: "center",
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        {headshot ? (
          <img
            src={headshot}
            alt=""
            width={hsz}
            height={hsz}
            style={{
              width: hsz,
              height: hsz,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              border: `4px solid rgba(255,255,255,0.3)`,
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: hsz,
              height: hsz,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.12)",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User
              style={{
                width: hsz * 0.4,
                height: hsz * 0.4,
                color: "rgba(255,255,255,0.4)",
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            marginLeft: 28,
          }}
        >
          <p
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: accentText,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {an}
          </p>
          <p
            style={{
              fontSize: 46,
              fontWeight: 400,
              color: `rgba(${accentTextRgb},0.75)`,
              margin: 0,
              marginTop: 8,
            }}
          >
            {brokerage || "Real Estate"}
          </p>
          {(phone || email) && (
            <div
              style={{
                display: "flex",
                marginTop: 10,
              }}
            >
              {phone && (
                <span
                  style={{
                    fontSize: 44,
                    color: `rgba(${accentTextRgb},0.90)`,
                    fontWeight: 700,
                    marginRight: 36,
                  }}
                >
                  {phone}
                </span>
              )}
              {email && (
                <span
                  style={{
                    fontSize: 44,
                    color: `rgba(${accentTextRgb},0.80)`,
                    fontWeight: 400,
                  }}
                >
                  {email}
                </span>
              )}
            </div>
          )}
        </div>

        {logo && (
          <img
            src={logo}
            alt=""
            style={{
              maxWidth: 280,
              maxHeight: BRAND_H - 60,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* ─── PHOTO BLOCK ─── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: M + ACCENT_BAR + BRAND_H,
          left: M,
          width: photoBlockW,
          overflow: "hidden",
        }}
      >
        {/* Top row: hero + 2 stacked */}
        <div
          style={{
            display: "flex",
            width: photoBlockW,
            height: PHOTO_H,
          }}
        >
          {/* Hero photo */}
          <div
            style={{
              display: "flex",
              width: leftPhotoW,
              height: PHOTO_H,
              overflow: "hidden",
              flexShrink: 0,
              marginRight: PHOTO_GAP,
            }}
          >
            {p1 ? (
              <img
                src={p1}
                alt=""
                width={leftPhotoW}
                height={PHOTO_H}
                style={{
                  width: leftPhotoW,
                  height: PHOTO_H,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#1e293b",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ImageIcon
                  style={{
                    width: 80,
                    height: 80,
                    color: "rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            )}
          </div>

          {/* Right stack */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: rightPhotoW,
              height: PHOTO_H,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                width: rightPhotoW,
                height: rightPhotoH,
                overflow: "hidden",
                marginBottom: PHOTO_GAP,
              }}
            >
              {p2 ? (
                <img
                  src={p2}
                  alt=""
                  width={rightPhotoW}
                  height={rightPhotoH}
                  style={{
                    width: rightPhotoW,
                    height: rightPhotoH,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#263045",
                  }}
                />
              )}
            </div>
            <div
              style={{
                display: "flex",
                width: rightPhotoW,
                height: rightPhotoH,
                overflow: "hidden",
              }}
            >
              {p3 ? (
                <img
                  src={p3}
                  alt=""
                  width={rightPhotoW}
                  height={rightPhotoH}
                  style={{
                    width: rightPhotoW,
                    height: rightPhotoH,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#1e293b",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: 4 photos, explicit marginRight per chip */}
        {showBottomRow && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: photoBlockW,
              height: bottomPhotoH,
              marginTop: PHOTO_GAP,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {[0, 1, 2, 3].map((i) => {
              const photo = bottomRow[i] || null;
              const isLast = i === 3;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    width: bottomPhotoW,
                    height: bottomPhotoH,
                    overflow: "hidden",
                    flexShrink: 0,
                    marginRight: isLast ? 0 : PHOTO_GAP,
                  }}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      width={bottomPhotoW}
                      height={bottomPhotoH}
                      style={{
                        width: bottomPhotoW,
                        height: bottomPhotoH,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#1e293b",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── DETAILS BLOCK ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: photoBlockW,
            backgroundColor: "#ffffff",
            paddingTop: 40,
            paddingRight: 60,
            paddingBottom: 28,
            paddingLeft: 60,
            borderBottom: `3px solid ${hexToRgba(accent, 0.12)}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minWidth: 0,
                marginRight: 40,
              }}
            >
              <p
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  color: "#111111",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {ad}
              </p>
              <p
                style={{
                  fontSize: 46,
                  fontWeight: 400,
                  color: "#555555",
                  margin: 0,
                  marginTop: 8,
                }}
              >
                {cs}
              </p>
              <p
                style={{
                  fontSize: 42,
                  fontWeight: 400,
                  color: "#444444",
                  margin: 0,
                  marginTop: 10,
                  letterSpacing: "0.04em",
                }}
              >
                {det}
              </p>
            </div>
            <p
              style={{
                fontSize: 148,
                fontWeight: 700,
                color: accent,
                margin: 0,
                lineHeight: 1.0,
                flexShrink: 0,
              }}
            >
              {pr}
            </p>
          </div>

          {amList.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              {amList.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingLeft: 22,
                    paddingRight: 22,
                    borderRadius: 40,
                    border: `2px solid ${hexToRgba(accent, 0.25)}`,
                    backgroundColor: hexToRgba(accent, 0.05),
                    marginRight: 12,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: accent,
                    }}
                  >
                    {a}
                  </span>
                </div>
              ))}
            </div>
          )}

          {descParagraphs.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 22,
              }}
            >
              {descParagraphs.map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 38,
                    color: "#555555",
                    lineHeight: 1.5,
                    margin: 0,
                    marginTop: i === 0 ? 0 : 18,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── URL FOOTER ─── */}
      {hasUrls && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            bottom: M + ACCENT_BAR,
            left: M,
            right: M,
            paddingTop: 24,
            paddingRight: 60,
            paddingBottom: 24,
            paddingLeft: 60,
            borderTop: `3px solid ${hexToRgba(accent, 0.10)}`,
            backgroundColor: hexToRgba(accent, 0.03),
          }}
        >
          {urlRows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: i === 0 ? 0 : 8,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#444444",
                  marginRight: 14,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 400,
                  color: accent,
                  wordBreak: "break-word",
                }}
              >
                {row.url}
              </span>
            </div>
          ))}
        </div>
      )}

      {!hasUrls && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "absolute",
            bottom: M + ACCENT_BAR,
            left: M,
            right: M,
            paddingTop: 20,
            paddingRight: 60,
            paddingBottom: 20,
            paddingLeft: 60,
            borderTop: `3px solid ${hexToRgba(accent, 0.10)}`,
            backgroundColor: hexToRgba(accent, 0.03),
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#333333",
            }}
          >
            {an}
          </span>
          {phone && (
            <span
              style={{
                fontSize: 36,
                fontWeight: 400,
                color: "#555555",
              }}
            >
              {phone}
            </span>
          )}
          {email && (
            <span
              style={{
                fontSize: 36,
                fontWeight: 400,
                color: "#555555",
              }}
            >
              {email}
            </span>
          )}
          {brokerage && (
            <span
              style={{
                fontSize: 36,
                fontWeight: 400,
                color: "#888888",
              }}
            >
              {brokerage}
            </span>
          )}
        </div>
      )}

      {/* ─── BOTTOM ACCENT BAR ─── */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: M,
          left: M,
          right: M,
          height: ACCENT_BAR,
          backgroundColor: accent,
        }}
      />
    </div>
  );
}
