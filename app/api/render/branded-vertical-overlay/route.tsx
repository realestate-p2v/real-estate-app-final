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
// The InfoBarTemplate "story" size layout (1080×1920, stacked agent-above-
// property) is the one rendered here. Badge is always "JUST LISTED".
// Accent color is always "#ffffff" per product decision. Bar color is the
// agent's extracted brand color (lens_usage.saved_brand_color_primary) with
// a dark-slate fallback for the edge case where extraction never ran.

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { InfoBarTemplate } from "@/components/design-studio/info-bar-template";
import { getBadgeConfig } from "@/components/design-studio/helpers";

// @vercel/og / next/og runs on the Edge runtime by default. Edge is fine
// here — we only do three Supabase reads, no heavy compute.
export const runtime = "edge";

// Output dimensions — must match the cropped vertical video ffmpeg produces
// in pipeline.py's crop_clips_to_vertical() helper. 1080×1920 = 9:16.
const OUT_W = 1080;
const OUT_H = 1920;

const BAR_COLOR_FALLBACK = "#111827"; // slate-900 — for agents with no
                                      // extracted brand color yet
const ACCENT_COLOR = "#ffffff";       // locked per product decision
const BADGE = getBadgeConfig("just-listed"); // { text: "JUST LISTED", color: "#2563eb" }
const FONT_FAMILY =
  "'DM Sans', -apple-system, 'Helvetica Neue', Arial, sans-serif";

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
  // Service-role key so we can read across user rows without an auth session.
  // This endpoint is already gated by RENDER_SECRET so it's safe to use here.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new Response("Supabase env vars not configured", { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // 1) Order — get property basics + user_id + agent_property_id
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

  // 2) agent_properties — sqft + price (fields not stored on orders)
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

  // 3) lens_usage — saved agent profile + brand color
  const { data: profile, error: profileErr } = await supabase
    .from("lens_usage")
    .select(
      "saved_agent_name, saved_phone, saved_company, saved_headshot_url, saved_logo_url, saved_brand_color_primary"
    )
    .eq("user_id", order.user_id)
    .maybeSingle();

  // Defense-in-depth: bonus content is only supposed to render for users
  // who completed Your Info. sample_worker.py is responsible for that
  // gating — but we re-check here in case something slips through, so
  // we don't produce an empty-branded overlay.
  if (!profile?.saved_agent_name || !profile?.saved_headshot_url) {
    return new Response(
      JSON.stringify({
        reason: "Agent profile incomplete — bonus content not eligible",
        debug: {
          user_id: order.user_id,
          profile_returned: profile === null ? "null" : profile === undefined ? "undefined" : "object",
          has_agent_name: !!profile?.saved_agent_name,
          has_headshot: !!profile?.saved_headshot_url,
          supabase_error: profileErr ? profileErr.message : null,
        },
      }, null, 2),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ─── Build the template props ───────────────────────────────────────
  const addressLine2 = [order.property_city, order.property_state]
    .filter(Boolean)
    .join(", ");

  // Format price with thousands separators for display.
  // agent_properties.price is stored as plain integer (e.g. 425000).
  const priceDisplay =
    typeof price === "number" && price > 0
      ? price.toLocaleString("en-US")
      : undefined;

  const barColor = profile.saved_brand_color_primary || BAR_COLOR_FALLBACK;

  // ─── Render to PNG via @vercel/og ────────────────────────────────────
  // Size id "story" triggers the 1080×1920 stacked layout in InfoBarTemplate.
  // videoElement and listingPhoto are both undefined/null so the Photo
  // subcomponent renders its placeholder area transparent-over-gradient.
  // ffmpeg composites the real video frame underneath at runtime.
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
      // Important: the Photo subcomponent still renders a placeholder
      // background (#1a1a2e) when neither videoElement nor listingPhoto
      // is provided. That's fine — ffmpeg overlays the PNG on top of the
      // real video, so only the non-placeholder regions (the info bar,
      // badge, and gradient overlay at the photo/bar boundary) are
      // visible. See video_brander.py for the compositing logic.
      //
      // We intentionally do NOT set a headers.Cache-Control here — each
      // bonus content render is one-shot. video_brander.py fetches once,
      // composites, and we never regenerate for the same order unless the
      // agent updates their profile (logged follow-up).
    }
  );
}
