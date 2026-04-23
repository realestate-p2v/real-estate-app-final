// app/api/render/branded-flyer/route.tsx
//
// Server-side PNG renderer for first-buyer bonus content — the flyer.
// Mirrors the branded-vertical-overlay route pattern exactly.
//
// Differences vs. the vertical overlay:
//   - 2550x3300 canvas (US Letter at 300 DPI, portrait flyer)
//   - Pulls more data: description from lens_descriptions, amenities
//     and photos from agent_properties, listing URL from website_slug
//   - Renders ListingFlyerTemplateSatori (not the vertical overlay)
//   - Returns a full flyer PNG (not a transparent overlay)

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { ListingFlyerTemplateSatori } from "@/components/design-studio/listing-flyer-template-satori";

export const runtime = "edge";

const OUT_W = 2550;
const OUT_H = 3300;
const FONT_FAMILY = "DM Sans";
const ACCENT_FALLBACK = "#1e3a5f";

/**
 * Compute the origin this request came in on, so we can construct
 * absolute URLs to our own public/fonts assets.
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
  console.log(`[flyer-font] Loading: ${fontUrl}`);
  const res = await fetch(fontUrl);
  if (!res.ok) {
    throw new Error(`Font fetch failed: ${res.status} for ${fontUrl}`);
  }
  const data = await res.arrayBuffer();
  console.log(`[flyer-font] Loaded ${data.byteLength} bytes from ${filename}`);
  return data;
}

/**
 * Rewrite a Cloudinary URL to inject a sizing transform. Satori's Edge
 * runtime times out on slow/large image fetches — shrinking these before
 * Satori downloads them prevents empty photo slots from appearing when a
 * single image runs slow. Non-Cloudinary URLs pass through unchanged.
 *
 * The hero photo on the flyer renders at ~1400px wide at most, so 1400px
 * source resolution is more than enough. f_auto serves webp to modern
 * fetchers; q_auto picks the smallest quality that doesn't visibly degrade.
 */
function optimizeCloudinaryUrl(url: string, targetWidth: number): string {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) return url;
  // Skip if already transformed (don't stack transforms)
  if (/\/upload\/[a-z]_[^\/]+\//.test(url)) return url;
  return url.replace(
    "/upload/",
    `/upload/w_${targetWidth},c_fill,f_auto,q_auto/`
  );
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

  // Order + basic property context
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "user_id, agent_property_id, property_address, property_city, property_state, property_bedrooms, property_bathrooms, photos"
    )
    .eq("order_id", orderId)
    .maybeSingle();
  if (orderErr || !order) {
    return new Response(`Order not found: ${orderId}`, { status: 404 });
  }

  // Enrich from agent_properties if available
  let sqft: number | null = null;
  let price: number | null = null;
  let amenities: string[] = [];
  let websiteSlug: string | null = null;
  let websitePublished = false;

  if (order.agent_property_id) {
    const { data: prop } = await supabase
      .from("agent_properties")
      .select("sqft, price, amenities, website_slug, website_published")
      .eq("id", order.agent_property_id)
      .maybeSingle();
    if (prop) {
      sqft = prop.sqft ?? null;
      price = prop.price ?? null;
      amenities = Array.isArray(prop.amenities) ? prop.amenities : [];
      websiteSlug = prop.website_slug ?? null;
      websitePublished = prop.website_published ?? false;
    }
  }

  // Agent profile
  const { data: profile, error: profileErr } = await supabase
    .from("lens_usage")
    .select(
      "saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url, saved_logo_url, saved_brand_color_primary"
    )
    .eq("user_id", order.user_id)
    .maybeSingle();

  // Defense-in-depth: same gating as A4
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

  // Description (optional — flyer renders fine without it)
  let descriptionText: string | null = null;
  if (order.agent_property_id) {
    const { data: desc } = await supabase
      .from("lens_descriptions")
      .select("description")
      .eq("user_id", order.user_id)
      .eq("property_id", order.agent_property_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (desc?.description) {
      descriptionText = desc.description;
    }
  }

 // Photos — prefer order photos (already curated for video), fall back to
  // an empty array and let the template handle placeholders.
  // Each URL is shrunk via Cloudinary transforms before Satori fetches it.
  // The hero gets a larger target (1400px) than the secondary slots (800px)
  // since it renders at roughly 1.75x the size on the flyer.
  const rawPhotoUrls: string[] = Array.isArray(order.photos)
    ? order.photos
        .map((p: any) => p?.secure_url || p?.url)
        .filter(Boolean)
        .slice(0, 7)
    : [];
  const photoUrls: string[] = rawPhotoUrls.map((u, i) =>
    optimizeCloudinaryUrl(u, i === 0 ? 1400 : 800)
  );

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
    console.log("[flyer-font] Both weights loaded");
  } catch (err) {
    console.error("[flyer-font] Local font load failed:", err);
  }

  // ─── Build template props ──────────────────────────────────────────
  const cityState = [order.property_city, order.property_state]
    .filter(Boolean)
    .join(", ");

  const priceDisplay =
    typeof price === "number" && price > 0
      ? price.toLocaleString("en-US")
      : undefined;

  const accent =
    profile.saved_brand_color_primary || ACCENT_FALLBACK;

  const listingUrl =
    websitePublished && websiteSlug
      ? `https://${websiteSlug}.p2v.homes`
      : undefined;

  // ─── Render via @vercel/og ─────────────────────────────────────────
  return new ImageResponse(
    (
      <ListingFlyerTemplateSatori
        photos={photoUrls}
        headshot={profile.saved_headshot_url}
        logo={profile.saved_logo_url || null}
        address={order.property_address || ""}
        cityState={cityState}
        price={priceDisplay}
        beds={order.property_bedrooms ?? undefined}
        baths={order.property_bathrooms ?? undefined}
        sqft={sqft ?? undefined}
        description={descriptionText ?? undefined}
        amenities={amenities}
        agentName={profile.saved_agent_name}
        phone={profile.saved_phone || ""}
        email={profile.saved_email || ""}
        brokerage={profile.saved_company || ""}
        listingUrl={listingUrl}
        accentColor={accent}
        fontFamily={FONT_FAMILY}
      />
    ),
    {
      width: OUT_W,
      height: OUT_H,
      ...(fontsConfig.length > 0 ? { fonts: fontsConfig } : {}),
    }
  );
}
