// app/api/render/branded-vertical-overlay/route.tsx
//
// Server-side PNG renderer for the first-buyer bonus content vertical social
// video. Renders the same InfoBarTemplate that Design Studio uses, at
// 1080×1920, with videoElement=undefined and listingPhoto=null so the
// background is transparent. video_brander.py (on the pipeline droplet)
// fetches this PNG and composites it over the ffmpeg-cropped vertical
// video via `ffmpeg -filter_complex "[0:v][1:v]overlay=0:0"`.
//
// Auth: the route is reachable only by callers that present
// `Authorization: Bearer ${RENDER_SECRET}` — the same secret is set on the
// droplet's systemd service environment.
//
// Data sources:
//   orders               — order metadata, property basics, agent_property_id
//   agent_properties     — sqft, price (fields the order form doesn't store)
//   lens_usage           — saved agent profile + extracted brand color
//
// Fonts: DM Sans (regular + bold) is resolved from the Google Fonts
// stylesheet at cold start. The stylesheet gives us live TTF URLs; we
// fetch those and pass the binary data to Satori. This avoids hard-
// coding URLs that Google rotates over time.

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { InfoBarTemplate } from "@/components/design-studio/info-bar-template";
import { getBadgeConfig } from "@/components/design-studio/helpers";

export const runtime = "edge";

const OUT_W = 1080;
const OUT_H = 1920;

const BAR_COLOR_FALLBACK = "#111827";
const ACCENT_COLOR = "#ffffff";
const BADGE = getBadgeConfig("just-listed");
const FONT_FAMILY = "DM Sans";

/**
 * Resolve a Google Font to its current TTF binary data.
 *
 * The /css2 endpoint returns a stylesheet referencing the current CDN
 * URLs. We parse the first src: url(...) that points to a .ttf, then
 * fetch that binary.
 */
async function loadGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  // Safari UA forces Google to serve TTFs (otherwise we get woff2,
  // which Satori can't decode in the Edge runtime).
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@${weight}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
      },
    }
  ).then((r) => r.text());

  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?truetype/);
  if (!match) {
    throw new Error(`Could not find TTF URL in Google Fonts CSS for ${family} ${weight}`);
  }
  const ttfUrl = match[1];
  const data = await fetch(ttfUrl).then((r) => r.arrayBuffer());
  return data;
}

export async function GET(request: Request) {
  // ─── Auth ───────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.RENDER_SECRET || ""}`;
  if (!process.env.RENDER_SECRET || authHeader !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ─── Parse orderId ──────────────────────────────────────────────────
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) {
    return new Response("Missing orderId query parameter", { status: 400 });
  }

  // ─── Supabase lookup ────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new Response("Supabase env vars not configured", { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "user_id, agent_property_id, property_address, property_city, property_state, property_bedrooms, property_bathrooms"
    )
    .eq("order_id", orderId)
    .maybeSingle();
  if (orderErr || !order) {
    return new Response(`Order not found: ${orderId}`, { status: 404 });
  }

  let sqft: number | null = null;
  let price: number | null = null;
  if (order.agent_property_id) {
    const { data: prop } = await supabase
      .from("agent_properties")
      .select("sqft, price")
      .eq("id", order.agent_property_id)
      .maybeSingle();
    if (prop) {
      sqft = prop.sqft ?? null;
      price = prop.price ?? null;
    }
  }

  const { data: profile, error: profileErr } = await supabase
    .from("lens_usage")
    .select(
      "saved_agent_name, saved_phone, saved_company, saved_headshot_url, saved_logo_url, saved_brand_color_primary"
    )
    .eq("user_id", order.user_id)
    .maybeSingle();

  if (!profile?.saved_agent_name || !profile?.saved_headshot_url) {
    return new Response(
      JSON.stringify(
        {
          reason: "Agent profile incomplete — bonus content not eligible",
          debug: {
            user_id: order.user_id,
            profile_returned:
              profile === null
                ? "null"
                : profile === undefined
                ? "undefined"
                : "object",
            has_agent_name: !!profile?.saved_agent_name,
            has_headshot: !!profile?.saved_headshot_url,
            supabase_error: profileErr ? profileErr.message : null,
          },
        },
        null,
        2
      ),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ─── Load DM Sans fonts via Google Fonts stylesheet lookup ─────────
  // If font loading fails for any reason, we fall back to a no-fonts
  // render rather than 500ing the whole request.
  let fontsConfig: { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[] = [];
  try {
    const [fontRegular, fontBold] = await Promise.all([
      loadGoogleFont("DM Sans", 400),
      loadGoogleFont("DM Sans", 700),
    ]);
    fontsConfig = [
      { name: "DM Sans", data: fontRegular, weight: 400, style: "normal" },
      { name: "DM Sans", data: fontBold, weight: 700, style: "normal" },
    ];
  } catch (err) {
    // Log but don't fail — Satori will use built-in fallback.
    console.error("[branded-vertical-overlay] Font load failed:", err);
  }

  // ─── Build the template props ───────────────────────────────────────
  const addressLine2 = [order.property_city, order.property_state]
    .filter(Boolean)
    .join(", ");

  const priceDisplay =
    typeof price === "number" && price > 0
      ? price.toLocaleString("en-US")
      : undefined;

  const barColor = profile.saved_brand_color_primary || BAR_COLOR_FALLBACK;

  // ─── Render to PNG via @vercel/og ────────────────────────────────────
  return new ImageResponse(
    (
      <InfoBarTemplate
        size={{ id: "story", width: OUT_W, height: OUT_H }}
        listingPhoto={null}
        videoElement={undefined}
        headshot={profile.saved_headshot_url}
        logo={profile.saved_logo_url || null}
        address={order.property_address || ""}
        addressLine2={addressLine2}
        beds={order.property_bedrooms ?? undefined}
        baths={order.property_bathrooms ?? undefined}
        sqft={sqft ?? undefined}
        price={priceDisplay}
        agentName={profile.saved_agent_name}
        phone={profile.saved_phone || ""}
        brokerage={profile.saved_company || ""}
        badgeText={BADGE.text}
        badgeColor={BADGE.color}
        fontFamily={FONT_FAMILY}
        barColor={barColor}
        accentColor={ACCENT_COLOR}
      />
    ),
    {
      width: OUT_W,
      height: OUT_H,
      ...(fontsConfig.length > 0 ? { fonts: fontsConfig } : {}),
    }
  );
}
