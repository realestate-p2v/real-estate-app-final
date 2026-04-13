// app/api/planner/score/route.ts
// Returns content scores for one or all properties + agent brand score
// GET /api/planner/score?propertyId=optional

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateContentScore, calculateBrandScore } from "@/lib/planner/score";
import { daysSince } from "@/lib/planner/self-marketing";

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
      .eq("user_id", userId);

    if (propertyId) {
      propertyQuery = propertyQuery.eq("id", propertyId);
    }

    const [
      propertiesRes,
      ordersRes,
      descriptionsRes,
      stagingRes,
      exportsRes,
      actionsRes,
      profileRes,
    ] = await Promise.all([
      propertyQuery,
      // FIXED: removed branded_video_url (doesn't exist); clip_urls is correct
      supabase.from("orders").select("id, property_address, photos, delivery_url, clip_urls, payment_status").eq("user_id", userId),
      // FIXED: property_data (JSONB) not property_address
      supabase.from("lens_descriptions").select("id, property_data").eq("user_id", userId),
      supabase.from("lens_staging").select("id, property_id").eq("user_id", userId),
      supabase.from("design_exports").select("id, property_id, template_type, export_url").eq("user_id", userId),
      supabase.from("marketing_actions").select("id, property_id, action_type, content_type, created_at").eq("user_id", userId),
      // REMOVED: blog_posts query — table has no user_id or property_id
      supabase.from("lens_usage").select("saved_headshot_url, saved_logo_url, saved_company, saved_agent_name").eq("user_id", userId).single(),
    ]);

    const properties = propertiesRes.data || [];
    const orders = ordersRes.data || [];
    const descriptions = descriptionsRes.data || [];
    const staging = stagingRes.data || [];
    const exports_ = exportsRes.data || [];
    const actions = actionsRes.data || [];
    const profile = profileRes.data;

    const hasAgentWebsite = properties.some((p: { website_published?: boolean }) => p.website_published);

    const scores = properties.map((prop: {
      id: string;
      address: string;
      status: string;
      photos: unknown[] | null;
      optimized_photos: unknown[] | null;
      website_published?: boolean;
    }) => {
      const propOrders = orders.filter((o: { property_address?: string }) =>
        o.property_address && prop.address &&
        o.property_address.toLowerCase().includes(prop.address.toLowerCase().split(",")[0])
      );
      const paidOrder = propOrders.find((o: { payment_status?: string }) => o.payment_status === "paid");
      const propExports = exports_.filter((e: { property_id?: string }) => e.property_id === prop.id);
      const propActions = actions.filter((a: { property_id?: string }) => a.property_id === prop.id);
      const propStaging = staging.filter((s: { property_id?: string }) => s.property_id === prop.id);
      const photoCount = prop.photos ? prop.photos.length : 0;

      return calculateContentScore(prop, {
        hasOrder: propOrders.length > 0,
        hasVideoDelivery: !!(paidOrder && (paidOrder as { delivery_url?: string }).delivery_url),
        hasRemix: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("video_remix")),
        // FIXED: property_data is JSONB — extract .address
        hasDescription: descriptions.some((d: { property_data?: { address?: string } }) => {
          const descAddr = d.property_data?.address || "";
          return descAddr && prop.address &&
            descAddr.toLowerCase().includes(prop.address.toLowerCase().split(",")[0]);
        }),
        hasFlyer: propExports.some((e: { template_type?: string }) => e.template_type && !e.template_type.includes("video_remix") && !e.template_type.includes("drone")),
        hasOptimizedPhotos: !!(prop.optimized_photos && prop.optimized_photos.length > 0),
        hasSocialShare: propActions.some((a: { action_type?: string }) => a.action_type === "social_share"),
        hasStaging: propStaging.length > 0,
        hasDroneAnnotation: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("drone")),
        hasWebsite: !!prop.website_published,
        hasBlogPost: false, // blog_posts has no user_id/property_id — not queryable per agent
        hasJustSoldGraphic: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("sold")),
        hasPriceReducedGraphic: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("price")),
        photoCount,
        hasAgentWebsite,
        hasAerialPhotos: photoCount > 10,
        roomsAppearEmpty: photoCount < 15,
      });
    });

    const personalActions = actions.filter((a: { property_id?: string | null }) => !a.property_id);
    const lastPersonalPost = personalActions
      .filter((a: { action_type?: string }) => a.action_type === "social_share")
      .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const lastMarketUpdate = personalActions
      .filter((a: { content_type?: string }) => a.content_type === "market_update")
      .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const brandScore = calculateBrandScore({
      hasHeadshot: !!(profile && profile.saved_headshot_url),
      hasLogo: !!(profile && profile.saved_logo_url),
      hasCompany: !!(profile && profile.saved_company),
      hasBio: !!(profile && profile.saved_agent_name),
      hasPublishedWebsite: hasAgentWebsite,
      daysSincePersonalPost: daysSince(lastPersonalPost ? lastPersonalPost.created_at : null),
      daysSinceMarketUpdate: daysSince(lastMarketUpdate ? lastMarketUpdate.created_at : null),
    });

    return NextResponse.json({ scores, brandScore });
  } catch (error) {
    console.error("Score API error:", error);
    return NextResponse.json({ error: "Failed to calculate scores" }, { status: 500 });
  }
}
