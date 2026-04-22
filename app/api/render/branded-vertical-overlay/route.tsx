// app/api/render/branded-vertical-overlay/route.tsx
//
// Server-side PNG renderer for the first-buyer bonus content vertical
// social video. Renders the Satori-compatible variant of InfoBarTemplate
// (see components/design-studio/info-bar-template-satori.tsx for why
// this has its own variant) at 1080×1920.
//
// Auth: Authorization: Bearer ${RENDER_SECRET}
//
// Fonts: DM Sans loaded dynamically via Google Fonts CSS parse.
// Detailed logging so failures are debuggable in Vercel Runtime Logs.

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { InfoBarTemplateSatori } from "@/components/design-studio/info-bar-template-satori";
import { getBadgeConfig } from "@/components/design-studio/helpers";

export const runtime = "edge";

const OUT_W = 1080;
const OUT_H = 1920;

const BAR_COLOR_FALLBACK = "#111827";
const ACCENT_COLOR = "#ffffff";
const BADGE = getBadgeConfig("just-listed");
const FONT_FAMILY = "DM Sans";

/**
 * Fetch a Google Font as TTF binary data.
 * Uses an old-browser UA to force TTF (not woff2).
 * Permissive regex to find any .ttf URL in the returned stylesheet.
 * Full logging so font-load failures are visible in Vercel Logs.
 */
async function loadGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&display=swap`;

  console.log(`[font] Fetching CSS: ${cssUrl}`);

  const cssRes = await fetch(cssUrl, {
    headers: {
      "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)",
    },
  });
  const css = await cssRes.text();
  console.log(
    `[font] CSS length: ${css.length} bytes, preview: ${css.slice(0, 300)}`
  );

  const match = css.match(/url\(([^)]+\.ttf)\)/i);
  if (!match) {
    console.error(`[font] No .ttf URL in CSS for ${family} ${weight}`);
    throw new Error(`No TTF URL for ${family} ${weight}`);
  }
  const ttfUrl = match[1];
  console.log(`[font] TTF URL: ${ttfUrl}`);

  const ttfRes = await fetch(ttfUrl);
  if (!ttfRes.ok) {
    throw new Error(
      `TTF fetch failed: ${ttfRes.status} ${ttfRes.statusText} for ${ttfUrl}`
    );
  }
  const data = await ttfRes.arrayBuffer();
  console.log(`[font] Loaded ${data.byteLength} bytes for ${family} ${weight}`);
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

  // ─── Load DM Sans fonts (best-effort) ───────────────────────────────
  let fontsConfig: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: "normal";
  }[] = [];
  try {
    const [fontRegular, fontBold] = await Promise.all([
      loadGoogleFont("DM Sans", 400),
      loadGoogleFont("DM Sans", 700),
    ]);
    fontsConfig = [
      { name: "DM Sans", data: fontRegular, weight: 400, style: "normal" },
      { name: "DM Sans", data: fontBold, weight: 700, style: "normal" },
    ];
    console.log(`[font] Both weights loaded successfully`);
  } catch (err) {
    console.error("[font] Load failed, falling back:", err);
  }

  // ─── Build template props ──────────────────────────────────────────
  const addressLine2 = [order.property_city, order.property_state]
    .filter(Boolean)
    .join(", ");

  const priceDisplay =
    typeof price === "number" && price > 0
      ? price.toLocaleString("en-US")
      : undefined;

  const barColor = profile.saved_brand_color_primary || BAR_COLOR_FALLBACK;

  // ─── Render via @vercel/og ─────────────────────────────────────────
  return new ImageResponse(
    (
      <InfoBarTemplateSatori
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
