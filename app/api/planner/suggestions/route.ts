// app/api/planner/suggestions/route.ts
// Server-side suggestion engine for the marketing planner
// Replaces client-side loadSuggestions() from v1
// All Supabase queries in parallel via Promise.all()

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateContentScore, calculateBrandScore } from "@/lib/planner/score";
import { checkSelfMarketingNudge, daysSince } from "@/lib/planner/self-marketing";

export interface Suggestion {
  id: string;
  type: "action" | "nudge" | "status_trigger" | "self_marketing" | "calendar";
  priority: number; // lower = higher priority
  propertyId?: string;
  propertyAddress?: string;
  platform?: string;
  contentType?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: string;
  buttons?: string[];
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();
    const agentName = body.agentName || "Agent";

    const today = new Date().toISOString().split("T")[0];
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // All queries in parallel
    const [
      propertiesRes,
      ordersRes,
      descriptionsRes,
      stagingRes,
      exportsRes,
      actionsRes,
      blogRes,
      scheduleRes,
      profileRes,
    ] = await Promise.all([
      supabase.from("agent_properties").select("id, address, status, photos, optimized_photos, website_published, updated_at").eq("user_id", userId),
      supabase.from("orders").select("id, property_address, photos, delivery_url, branded_video_url, clip_urls, payment_status, created_at").eq("user_id", userId),
      supabase.from("lens_descriptions").select("id, property_address").eq("user_id", userId),
      supabase.from("lens_staging").select("id, property_id, created_at").eq("user_id", userId),
      supabase.from("design_exports").select("id, property_id, template_type, export_url, created_at").eq("user_id", userId),
      supabase.from("marketing_actions").select("id, property_id, action_type, content_type, platform, created_at").eq("user_id", userId),
      supabase.from("blog_posts").select("id, property_id, created_at").eq("user_id", userId),
      supabase.from("marketing_schedule").select("*").eq("user_id", userId).gte("scheduled_date", today).order("scheduled_date", { ascending: true }).limit(10),
      supabase.from("profiles").select("headshot_url, logo_url, company, bio").eq("id", userId).single(),
    ]);

    const properties = propertiesRes.data || [];
    const orders = ordersRes.data || [];
    const descriptions = descriptionsRes.data || [];
    const staging = stagingRes.data || [];
    const exports_ = exportsRes.data || [];
    const actions = actionsRes.data || [];
    const blogs = blogRes.data || [];
    const schedule = scheduleRes.data || [];
    const profile = profileRes.data;
    const hasAgentWebsite = properties.some((p: { website_published?: boolean }) => p.website_published);

    const suggestions: Suggestion[] = [];
    let idCounter = 0;
    const nextId = () => `sug-${++idCounter}`;

    // 1. Today's calendar items
    const todayItems = schedule.filter((s: { scheduled_date: string }) => s.scheduled_date === today);
    todayItems.forEach((item: { platform: string; content_type: string; caption?: string; property_id?: string }) => {
      const prop = properties.find((p: { id: string }) => p.id === item.property_id);
      suggestions.push({
        id: nextId(),
        type: "calendar",
        priority: 1,
        propertyId: item.property_id || undefined,
        propertyAddress: prop ? (prop as { address: string }).address : undefined,
        platform: item.platform,
        contentType: item.content_type,
        title: `${item.platform.charAt(0).toUpperCase() + item.platform.slice(1)} post scheduled for today`,
        description: item.caption || `Time to post your ${item.content_type.replace(/_/g, " ")}`,
        actionLabel: "Post Now",
        actionType: "post_now",
        buttons: ["Post Now", "Copy Caption", "Skip"],
      });
    });

    // 2. Status triggers (sold or price_reduced in last 14 days)
    properties.forEach((prop: { id: string; address: string; status: string; updated_at: string }) => {
      if (
        (prop.status === "sold" || prop.status === "price_reduced") &&
        prop.updated_at > twoWeeksAgo
      ) {
        const hasStatusAction = actions.some(
          (a: { property_id?: string; content_type?: string }) =>
            a.property_id === prop.id &&
            (a.content_type === "just_sold" || a.content_type === "price_reduced")
        );
        if (!hasStatusAction) {
          suggestions.push({
            id: nextId(),
            type: "status_trigger",
            priority: 2,
            propertyId: prop.id,
            propertyAddress: prop.address,
            contentType: prop.status === "sold" ? "just_sold" : "price_reduced",
            title:
              prop.status === "sold"
                ? `Celebrate! ${prop.address} is sold`
                : `Price reduced on ${prop.address}`,
            description:
              prop.status === "sold"
                ? "Create a Just Sold graphic and share the good news"
                : "Create a Price Reduced graphic to generate new interest",
            actionLabel: "Create Post",
            actionType: "create_post",
            buttons: ["Create Post", "Skip"],
          });
        }
      }
    });

    // 3. Unshared content (created but not posted)
    staging
      .filter((s: { created_at: string }) => s.created_at > twoWeeksAgo)
      .forEach((s: { property_id?: string; id: string }) => {
        const shared = actions.some(
          (a: { property_id?: string; content_type?: string }) =>
            a.property_id === s.property_id && a.content_type === "staging_reveal"
        );
        if (!shared && s.property_id) {
          const prop = properties.find((p: { id: string }) => p.id === s.property_id);
          suggestions.push({
            id: nextId(),
            type: "nudge",
            priority: 3,
            propertyId: s.property_id,
            propertyAddress: prop ? (prop as { address: string }).address : "Unknown",
            contentType: "staging_reveal",
            title: "Share your virtual staging",
            description: `You staged a room but haven't shared it yet. Before/after posts get great engagement.`,
            actionLabel: "Share Now",
            actionType: "share_staging",
            buttons: ["Write Caption", "Schedule", "Skip"],
          });
        }
      });

    // 4. Stale listings (no action in 14+ days)
    properties
      .filter((p: { status: string }) => p.status === "active" || p.status === "new" || p.status === "coming_soon")
      .forEach((prop: { id: string; address: string }) => {
        const lastAction = actions
          .filter((a: { property_id?: string }) => a.property_id === prop.id)
          .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (!lastAction || lastAction.created_at < twoWeeksAgo) {
          suggestions.push({
            id: nextId(),
            type: "nudge",
            priority: 4,
            propertyId: prop.id,
            propertyAddress: prop.address,
            title: `${prop.address} needs attention`,
            description: lastAction
              ? `No marketing activity in ${daysSince(lastAction.created_at)} days`
              : "No marketing activity recorded yet",
            actionLabel: "Plan Posts",
            actionType: "plan_posts",
            buttons: ["Write Caption", "View Content Score", "Skip"],
          });
        }
      });

    // 5. Self-marketing nudge
    const personalActions = actions.filter((a: { property_id?: string | null }) => !a.property_id);
    const lastPersonal = personalActions
      .filter((a: { action_type?: string }) => a.action_type === "social_share")
      .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const nudge = checkSelfMarketingNudge(daysSince(lastPersonal ? lastPersonal.created_at : null));

    if (nudge.shouldNudge) {
      suggestions.push({
        id: nextId(),
        type: "self_marketing",
        priority: 5,
        title: "Time to market yourself",
        description: nudge.message,
        actionLabel: "Write a Post",
        actionType: "self_marketing",
        buttons: nudge.suggestedTypes.slice(0, 4).map((t) => t.label).concat(["Not now"]),
      });
    }

    // Sort by priority, cap at 8
    suggestions.sort((a, b) => a.priority - b.priority);
    const capped = suggestions.slice(0, 8);

    // Calculate content scores (compact for suggestions response)
    const scores = properties
      .filter((p: { status: string }) => p.status === "active" || p.status === "new" || p.status === "coming_soon")
      .slice(0, 5)
      .map((prop: { id: string; address: string; status: string; photos: unknown[] | null; optimized_photos: unknown[] | null; website_published?: boolean }) => {
        const propOrders = orders.filter((o: { property_address?: string; payment_status?: string }) =>
          o.property_address && prop.address &&
          o.property_address.toLowerCase().includes(prop.address.toLowerCase().split(",")[0])
        );
        const paidOrder = propOrders.find((o: { payment_status?: string }) => o.payment_status === "paid");
        const propExports = exports_.filter((e: { property_id?: string }) => e.property_id === prop.id);
        const propActions = actions.filter((a: { property_id?: string }) => a.property_id === prop.id);
        const propStaging = staging.filter((s: { property_id?: string }) => s.property_id === prop.id);
        const propBlogs = blogs.filter((b: { property_id?: string }) => b.property_id === prop.id);
        const photoCount = prop.photos ? prop.photos.length : 0;

        return calculateContentScore(prop, {
          hasOrder: propOrders.length > 0,
          hasVideoDelivery: !!(paidOrder && (paidOrder as { delivery_url?: string }).delivery_url),
          hasRemix: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("video_remix")),
          hasDescription: descriptions.some((d: { property_address?: string }) =>
            d.property_address && prop.address &&
            d.property_address.toLowerCase().includes(prop.address.toLowerCase().split(",")[0])
          ),
          hasFlyer: propExports.some((e: { template_type?: string }) => e.template_type && !e.template_type.includes("video_remix") && !e.template_type.includes("drone")),
          hasOptimizedPhotos: !!(prop.optimized_photos && prop.optimized_photos.length > 0),
          hasSocialShare: propActions.some((a: { action_type?: string }) => a.action_type === "social_share"),
          hasStaging: propStaging.length > 0,
          hasDroneAnnotation: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("drone")),
          hasWebsite: !!prop.website_published,
          hasBlogPost: propBlogs.length > 0,
          hasJustSoldGraphic: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("sold")),
          hasPriceReducedGraphic: propExports.some((e: { template_type?: string }) => e.template_type && e.template_type.includes("price")),
          photoCount,
          hasAgentWebsite,
          hasAerialPhotos: photoCount > 10,
          roomsAppearEmpty: photoCount < 15,
        });
      });

    // Brand score
    const lastMarket = personalActions
      .filter((a: { content_type?: string }) => a.content_type === "market_update")
      .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const brandScore = calculateBrandScore({
      hasHeadshot: !!(profile && profile.headshot_url),
      hasLogo: !!(profile && profile.logo_url),
      hasCompany: !!(profile && profile.company),
      hasBio: !!(profile && profile.bio),
      hasPublishedWebsite: hasAgentWebsite,
      daysSincePersonalPost: daysSince(lastPersonal ? lastPersonal.created_at : null),
      daysSinceMarketUpdate: daysSince(lastMarket ? lastMarket.created_at : null),
    });

    return NextResponse.json({
      suggestions: capped,
      scores,
      brandScore,
      agentName,
    });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}
