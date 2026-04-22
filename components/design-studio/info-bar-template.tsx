// components/design-studio/info-bar-template.tsx
//
// SATORI-COMPATIBLE version of the "Just Listed" Design Studio template.
// Every <div> with multiple children has an explicit display:flex. No
// calc(), no inline-flex. Ffmpeg-composited-friendly (transparent bg
// when videoElement/listingPhoto are null).

import { User, Image as ImageIcon } from "lucide-react";
import type { ReactNode } from "react";
import { isLightColor, hexToRgba, responsiveSize } from "./helpers";

export interface InfoBarSize {
  id: string;
  width: number;
  height: number;
}

export interface InfoBarTemplateProps {
  size: InfoBarSize;
  listingPhoto?: string | null;
  videoElement?: ReactNode;
  headshot?: string | null;
  logo?: string | null;
  address?: string;
  addressLine2?: string;
  beds?: string | number;
  baths?: string | number;
  sqft?: string | number;
  price?: string | number;
  agentName?: string;
  phone?: string;
  brokerage?: string;
  badgeText?: string;
  badgeColor?: string;
  fontFamily?: string;
  barColor?: string;
  accentColor?: string;
}

export function InfoBarTemplate({
  size,
  listingPhoto,
  videoElement,
  headshot,
  logo,
  address,
  addressLine2,
  beds,
  baths,
  sqft,
  price,
  agentName,
  phone,
  brokerage,
  badgeText,
  badgeColor,
  fontFamily,
  barColor,
  accentColor,
}: InfoBarTemplateProps) {
  const w = size.width;
  const h = size.height;
  const isStory = size.id === "story";
  const isPostcard = size.id === "postcard";
  const unit = w / 1080;

  const accent = accentColor || "#ffffff";
  const usedBadge = accentColor || badgeColor;
  const barLight = isLightColor(barColor || "#111827");

  const tp = barLight ? "#111827" : "#ffffff";
  const ts = barLight ? "rgba(17,24,39,0.55)" : "rgba(255,255,255,0.55)";
  const tm = barLight ? "rgba(17,24,39,0.40)" : "rgba(255,255,255,0.35)";
  const dc = barLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)";

  const an = agentName || "Agent Name";
  const br = brokerage || "Brokerage";
  const ph = phone || "(555) 000-0000";
  const ad = address || "123 Main Street";
  const ad2 = addressLine2 || "";

  const det =
    [beds && `${beds} BD`, baths && `${baths} BA`, sqft && `${sqft} SF`]
      .filter(Boolean)
      .join("  \u00b7  ") || "3 BD  \u00b7  2 BA  \u00b7  1,800 SF";
  const pr = price ? `$${price}` : "$000,000";

  const pp = isPostcard ? 55 : 58;
  const barH = h * (1 - pp / 100);
  const px = Math.round((isPostcard ? 44 : isStory ? 56 : 36) * unit);
  const py = Math.round((isStory ? 28 : 20) * unit);

  const hs = Math.round(barH * (isStory ? 0.36 : isPostcard ? 0.78 : 0.52));
  const hb = Math.round((isStory ? 4 : isPostcard ? 4 : 3) * unit);
  const bH = Math.round(barH * (isStory ? 0.072 : isPostcard ? 0.16 : 0.14));
  const bF = Math.round(barH * (isStory ? 0.036 : isPostcard ? 0.065 : 0.052));
  const anF = responsiveSize(
    Math.round(barH * (isStory ? 0.08 : isPostcard ? 0.125 : 0.082)),
    an,
    14
  );
  const brF = responsiveSize(
    Math.round(barH * (isStory ? 0.056 : isPostcard ? 0.08 : 0.055)),
    br,
    24
  );
  const phF = Math.round(barH * (isStory ? 0.054 : isPostcard ? 0.074 : 0.052));
  const adF = responsiveSize(
    Math.round(barH * (isStory ? 0.072 : isPostcard ? 0.11 : 0.094)),
    ad,
    16
  );
  const dtF = Math.round(barH * (isStory ? 0.048 : isPostcard ? 0.074 : 0.055));
  const prF = Math.round(barH * (isStory ? 0.105 : isPostcard ? 0.185 : 0.15));

  // Pre-computed values (Satori does not support calc()).
  const badgeTop = Math.round((h * pp) / 100 - bH * 0.5);
  const photoHeight = Math.round((h * pp) / 100);
  const infoBarHeight = Math.round((h * (100 - pp)) / 100);

  const ad2F = Math.round(adF * 0.75);

  // ─── Headshot subcomponent ───
  const Headshot = () =>
    headshot ? (
      <div
        style={{
          display: "flex",
          width: hs,
          height: hs,
          borderRadius: "50%",
          padding: hb,
          background: accentColor
            ? `linear-gradient(135deg,${accentColor},${hexToRgba(accentColor, 0.4)})`
            : barLight
            ? "linear-gradient(135deg,rgba(0,0,0,0.15),rgba(0,0,0,0.05))"
            : "linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.1))",
          flexShrink: 0,
        }}
      >
        <img
          src={headshot}
          alt=""
          width={hs - hb * 2}
          height={hs - hb * 2}
          style={{
            width: hs - hb * 2,
            height: hs - hb * 2,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          width: hs,
          height: hs,
          borderRadius: "50%",
          backgroundColor: barLight
            ? "rgba(0,0,0,0.06)"
            : "rgba(255,255,255,0.06)",
          border: `${hb}px solid ${dc}`,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <User style={{ width: hs * 0.38, height: hs * 0.38, color: tm }} />
      </div>
    );

  // ─── Photo subcomponent (with gradient overlay) ───
  const Photo = () => (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: photoHeight,
      }}
    >
      {videoElement ? (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {videoElement}
        </div>
      ) : listingPhoto ? (
        <img
          src={listingPhoto}
          alt=""
          width={w}
          height={photoHeight}
          style={{
            width: w,
            height: photoHeight,
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#1a1a2e",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageIcon
            style={{
              width: 64 * unit,
              height: 64 * unit,
              color: "rgba(255,255,255,0.12)",
            }}
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Math.round(140 * unit),
          backgroundImage: `linear-gradient(to top,${barColor || "#111827"} 0%,${hexToRgba(
            barColor || "#111827",
            0.85
          )} 30%,${hexToRgba(barColor || "#111827", 0.4)} 65%,transparent 100%)`,
        }}
      />
    </div>
  );

  // ─── Badge subcomponent ───
  // Outer wrapper spans the full canvas width so the pill can size
  // naturally and right-align via justify-content without overflowing
  // beyond the visible frame.
  const Badge = () => (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: badgeTop,
        left: 0,
        right: 0,
        paddingRight: px,
        justifyContent: "flex-end",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: bH,
          padding: `0 ${Math.round(22 * unit)}px`,
          backgroundColor: usedBadge,
          borderRadius: Math.round(4 * unit),
          boxShadow: `0 ${Math.round(4 * unit)}px ${Math.round(
            20 * unit
          )}px ${hexToRgba(usedBadge || "#2563eb", 0.45)}`,
        }}
      >
        <span
          style={{
            fontSize: bF,
            fontWeight: 800,
            color: isLightColor(usedBadge || "#2563eb") ? "#111" : "#fff",
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            lineHeight: 1,
          }}
        >
          {badgeText}
        </span>
      </div>
    </div>
  );

  // ─── Right column (property address + details + price) ───
  const RightCol = () => (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column" as const,
        justifyContent: "center",
        textAlign: "right" as const,
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontSize: adF,
          fontWeight: 700,
          color: tp,
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        {ad}
      </p>
      {ad2 && (
        <p
          style={{
            fontSize: ad2F,
            fontWeight: 500,
            color: ts,
            lineHeight: 1.3,
            margin: 0,
            marginTop: Math.round(2 * unit),
          }}
        >
          {ad2}
        </p>
      )}
      <p
        style={{
          fontSize: dtF,
          fontWeight: 500,
          color: ts,
          lineHeight: 1.3,
          margin: 0,
          marginTop: Math.round(6 * unit),
          letterSpacing: "0.04em",
        }}
      >
        {det}
      </p>
      <div
        style={{
          display: "flex",
          width: Math.round(60 * unit),
          height: Math.round(2 * unit),
          backgroundColor: accentColor || dc,
          marginLeft: "auto",
          marginTop: Math.round(10 * unit),
          marginBottom: Math.round(8 * unit),
          borderRadius: 1,
          opacity: accentColor ? 0.7 : 1,
        }}
      />
      <p
        style={{
          fontSize: prF,
          fontWeight: 800,
          color: accent,
          lineHeight: 1.0,
          margin: 0,
          letterSpacing: "-0.01em",
          textShadow:
            accentColor && !barLight
              ? `0 ${Math.round(2 * unit)}px ${Math.round(
                  12 * unit
                )}px ${hexToRgba(accentColor, 0.3)}`
              : "none",
        }}
      >
        {pr}
      </p>
    </div>
  );

  // ─── Story (vertical 1080x1920) layout ───
  if (isStory) {
    return (
      <div
        style={{
          display: "flex",
          position: "relative",
          overflow: "hidden",
          width: w,
          height: h,
          fontFamily,
        }}
      >
        <Photo />
        <Badge />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: infoBarHeight,
            backgroundColor: barColor || "#111827",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: Math.round(3 * unit),
              backgroundColor: accent,
              opacity: accentColor ? 0.8 : 0.15,
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: barLight
                ? "linear-gradient(to bottom,rgba(0,0,0,0.03) 0%,transparent 40%)"
                : "linear-gradient(to bottom,rgba(255,255,255,0.04) 0%,transparent 40%)",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              padding: `${py}px ${Math.round(44 * unit)}px ${py}px ${px}px`,
              gap: Math.round(20 * unit),
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                justifyContent: "center",
                minWidth: 0,
                gap: Math.round(12 * unit),
              }}
            >
              <Headshot />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <p
                  style={{
                    fontSize: anF,
                    fontWeight: 700,
                    color: tp,
                    lineHeight: 1.15,
                    margin: 0,
                    whiteSpace: "nowrap",
                    textAlign: "center" as const,
                  }}
                >
                  {an}
                </p>
                <p
                  style={{
                    fontSize: brF,
                    fontWeight: 500,
                    color: ts,
                    lineHeight: 1.3,
                    margin: 0,
                    marginTop: Math.round(5 * unit),
                    wordBreak: "break-word" as const,
                    textAlign: "center" as const,
                  }}
                >
                  {br}
                </p>
                <p
                  style={{
                    fontSize: phF,
                    fontWeight: 500,
                    color: ts,
                    lineHeight: 1.3,
                    margin: 0,
                    marginTop: Math.round(3 * unit),
                    textAlign: "center" as const,
                  }}
                >
                  {ph}
                </p>
              </div>
              {logo && (
                <img
                  src={logo}
                  alt=""
                  style={{
                    maxWidth: Math.round(hs * 1.3),
                    maxHeight: Math.round(barH * 0.14),
                    objectFit: "contain" as const,
                    marginTop: Math.round(6 * unit),
                  }}
                />
              )}
            </div>
            <RightCol />
          </div>
        </div>
      </div>
    );
  }

  // ─── Square / Postcard layout ───
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        overflow: "hidden",
        width: w,
        height: h,
        fontFamily,
      }}
    >
      <Photo />
      <Badge />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: infoBarHeight,
          backgroundColor: barColor || "#111827",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: Math.round(3 * unit),
            backgroundColor: accent,
            opacity: accentColor ? 0.8 : 0.15,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: barLight
              ? "linear-gradient(to bottom,rgba(0,0,0,0.03) 0%,transparent 40%)"
              : "linear-gradient(to bottom,rgba(255,255,255,0.04) 0%,transparent 40%)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            padding: `${py}px ${px}px`,
            gap: Math.round(16 * unit),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: Math.round(18 * unit),
              flex: 1,
              minWidth: 0,
            }}
          >
            <Headshot />
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                minWidth: 0,
                flex: 1,
              }}
            >
              <p
                style={{
                  fontSize: anF,
                  fontWeight: 700,
                  color: tp,
                  lineHeight: 1.15,
                  margin: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {an}
              </p>
              <p
                style={{
                  fontSize: brF,
                  fontWeight: 500,
                  color: ts,
                  lineHeight: 1.3,
                  margin: 0,
                  marginTop: Math.round(4 * unit),
                  wordBreak: "break-word" as const,
                }}
              >
                {br}
              </p>
              <p
                style={{
                  fontSize: phF,
                  fontWeight: 500,
                  color: ts,
                  lineHeight: 1.3,
                  margin: 0,
                  marginTop: Math.round(2 * unit),
                }}
              >
                {ph}
              </p>
            </div>
          </div>
          <RightCol />
        </div>
        {logo && (
          <img
            src={logo}
            alt=""
            style={{
              position: "absolute",
              bottom: Math.round(20 * unit),
              right: px,
              maxWidth: Math.round(barH * 0.3),
              maxHeight: Math.round(barH * 0.16),
              objectFit: "contain" as const,
            }}
          />
        )}
      </div>
    </div>
  );
}
