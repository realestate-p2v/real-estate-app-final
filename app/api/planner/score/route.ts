// app/api/planner/score/route.ts
// Returns content scores for one or all properties + agent brand score
// GET /api/planner/score?propertyId=optional

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateContentScore, calculateBrandScore } from "@/lib/planner/score";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("propertyId");

    let propertyQuery = supabase
      .from("agent_properties")
      .select("id, address, status, photos, optimized_photos, website_published")
      .eq("user_id", userId)
      .is("merged_into_id", null);

    if (propertyId) {
      propertyQuery = propertyQuery.eq("id", propertyId);
    }

    const [propertiesRes, ordersRes, descriptionsRes, stagingRes, exportsRes, actionsRes, profileRes] = await Promise.all([
      propertyQuery,
      supabase.from("orders")
        .select("id, property_address, photos, delivery_url, clip_urls, payment_status")
        .eq("user_id", userId)
        .in("payment_status", ["paid", "admin_bypass"]),
      supabase.from("lens_descriptions").select("id, property_data").eq("user_id", userId),
      supabase.from("lens_staging").select("id, property_id").eq("user_id", userId),
      supabase.from("design_exports").select("id, property_id, template_type, export_url").eq("user_id", userId),
      supabase.from("marketing_actions").select("id, property_id, action_type, content_type, created_at").eq("user_id", userId),
      supabase.from("lens_usage")
        .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url, saved_logo_url, saved_website, saved_location")
        .eq("user_id", userId).single(),
    ]);

    const properties = propertiesRes.data || [];
    const orders = ordersRes.data || [];
    const descriptions = descriptionsRes.data || [];
    const staging = stagingRes.data || [];
    const exports_ = exportsRes.data || [];
    const actions = actionsRes.data || [];
    const profile = profileRes.data;

    const hasAgentWebsite = properties.some((p: { website_published?: boolean }) => p.website_published);

    // Normalize address for matching
    const normalizeAddr = (s: string) =>
      (s || "").toLowerCase().replace(/\bstreet\b/g, "st").replace(/\bavenue\b/g, "ave")
        .replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr")
        .replace(/\blane\b/g, "ln").replace(/\broad\b/g, "rd")
        .replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();

    const addressesMatch = (a: string, b: string) => {
      const na = normalizeAddr(a).split(",")[0];
      const nb = normalizeAddr(b).split(",")[0];
      return na.length > 3 && nb.length > 3 && (na.includes(nb) || nb.includes(na));
    };

    // Per-property content scores
    const scores = properties.map((property: any) => {
      const propOrders = orders.filter((o: any) => addressesMatch(o.property_address || "", property.address || ""));
      const propExports = exports_.filter((e: any) => e.property_id === property.id);
      const propStaging = staging.filter((s: any) => s.property_id === property.id);
      const propDescriptions = descriptions.filter((d: any) => {
        const descAddr = d.property_data?.address || "";
        return addressesMatch(descAddr, property.address || "");
      });
      const propActions = actions.filter((a: any) => a.property_id === property.id);

      const photoCount = Array.isArray(property.photos) ? property.photos.length : 0;

      return calculateContentScore(property, {
        hasOrder: propOrders.length > 0,
        hasVideoDelivery: propOrders.some((o: any) => !!o.delivery_url),
        hasRemix: propExports.some((e: any) => e.template_type?.includes("video_remix")),
        hasDescription: propDescriptions.length > 0,
        hasFlyer: propExports.some((e: any) => {
          const t = e.template_type || "";
          return t.includes("just_listed") || t.includes("just-listed") || t.includes("open_house") || t.includes("open-house") ||
            t.includes("price_reduced") || t.includes("price-reduced") || t.includes("just_sold") || t.includes("just-sold") ||
            t.includes("yard_sign") || t.includes("yard-sign") || t.includes("property_pdf");
        }),
        hasOptimizedPhotos: Array.isArray(property.optimized_photos) && property.optimized_photos.length > 0,
        hasSocialShare: propActions.some((a: any) => a.action_type === "social_share"),
        hasStaging: propStaging.length > 0,
        hasDroneAnnotation: propExports.some((e: any) => e.template_type?.includes("drone")),
        hasWebsite: !!property.website_published,
        hasBlogPost: false, // blog_posts table has no user_id — hardcoded false
        hasJustSoldGraphic: propExports.some((e: any) => e.template_type && (e.template_type.includes("sold") || e.template_type.includes("just-sold"))),
        hasPriceReducedGraphic: propExports.some((e: any) => e.template_type && (e.template_type.includes("price") || e.template_type.includes("price-reduced"))),
        photoCount,
        hasAgentWebsite,
        hasAerialPhotos: photoCount > 10,
        roomsAppearEmpty: photoCount < 15,
      });
    });

    // Brand score — based on 8 profile fields
    const brandScore = calculateBrandScore({
      hasName: !!(profile?.saved_agent_name),
      hasPhone: !!(profile?.saved_phone),
      hasEmail: !!(profile?.saved_email),
      hasCompany: !!(profile?.saved_company),
      hasHeadshot: !!(profile?.saved_headshot_url),
      hasLogo: !!(profile?.saved_logo_url),
      hasWebsite: !!(profile?.saved_website),
      hasLocation: !!(profile?.saved_location),
    });

    return NextResponse.json({ scores, brandScore });
  } catch (error) {
    console.error("Score API error:", error);
    return NextResponse.json({ error: "Failed to calculate scores" }, { status: 500 });
  }
}
