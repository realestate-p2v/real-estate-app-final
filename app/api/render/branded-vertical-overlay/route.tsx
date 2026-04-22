// app/api/render/branded-vertical-overlay/route.tsx
//
// Server-side PNG renderer for first-buyer bonus content.
// Loads DM Sans TTF from the repo's own /public/fonts directory —
// no external font CDN dependency, no regex fragility.

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
 * Compute the origin this request came in on, so we can construct
 * absolute URLs to our own public/fonts assets. Works both in
 * Vercel production (https://realestatephoto2video.com) and in
 * preview deployments (https://project-abc.vercel.app).
 */
function getOrigin(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function loadLocalFont(
  origin: string,
  filename: string
): Promise<ArrayBuffer> {
  const fontUrl = `${origin}/fonts/${filename}`;
  console.log(`[font] Loading: ${fontUrl}`);
  const res = await fetch(fontUrl);
  if (!res.ok) {
    throw new Error(`Font fetch failed: ${res.status} for ${fontUrl}`);
  }
  const data = await res.arrayBuffer();
  console.log(`[font] Loaded ${data.byteLength} bytes from ${filename}`);
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

  // ─── Load DM Sans from /public/fonts ───────────────────────────────
  const origin = getOrigin(request);
  let fontsConfig: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: "normal";
  }[] = [];
  try {
    const [fontRegular, fontBold] = await Promise.all([
      loadLocalFont(origin, "DMSans-Regular.ttf"),
      loadLocalFont(origin, "DMSans-Bold.ttf"),
    ]);
    fontsConfig = [
      { name: "DM Sans", data: fontRegular, weight: 400, style: "normal" },
      { name: "DM Sans", data: fontBold, weight: 700, style: "normal" },
    ];
    console.log(`[font] Both weights loaded — fontsConfig ready`);
  } catch (err) {
    console.error("[font] Local font load failed:", err);
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
