// app/api/planner/suggestions/route.ts
// Server-side suggestion engine for the marketing planner

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateContentScore, calculateBrandScore } from "@/lib/planner/score";
import { checkSelfMarketingNudge, daysSince } from "@/lib/planner/self-marketing";

export interface Suggestion {
  id: string;
  type: "action" | "nudge" | "status_trigger" | "self_marketing" | "calendar";
  priority: number;
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

    const [
      propertiesRes, ordersRes, descriptionsRes, stagingRes,
      exportsRes, actionsRes, scheduleRes, profileRes,
    ] = await Promise.all([
      supabase.from("agent_properties").select("id, address, status, photos, optimized_photos, website_published, updated_at")
        .eq("user_id", userId).is("merged_into_id", null),
      supabase.from("orders").select("id, property_address, photos, delivery_url, clip_urls, payment_status, created_at")
        .eq("user_id", userId).in("payment_status", ["paid", "admin_bypass"]),
      supabase.from("lens_descriptions").select("id, property_data").eq("user_id", userId),
      supabase.from("lens_staging").select("id, property_id, created_at").eq("user_id", userId),
      supabase.from("design_exports").select("id, property_id, template_type, export_url, created_at").eq("user_id", userId),
      supabase.from("marketing_actions").select("id, property_id, action_type, content_type, platform, created_at").eq("user_id", userId),
      supabase.from("marketing_schedule").select("*").eq("user_id", userId).gte("scheduled_date", today).order("scheduled_date", { ascending: true }).limit(10),
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
        description: item.caption || `Your audience is waiting — posting consistently builds trust and keeps your listings top of mind.`,
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
          const shortAddr = prop.address.split(",")[0] || prop.address;
          suggestions.push({
            id: nextId(),
            type: "status_trigger",
            priority: 2,
            propertyId: prop.id,
            propertyAddress: prop.address,
            contentType: prop.status === "sold" ? "just_sold" : "price_reduced",
            title:
              prop.status === "sold"
                ? `🎉 ${shortAddr} is sold — let's celebrate!`
                : `Fresh opportunity at ${shortAddr}`,
            description:
              prop.status === "sold"
                ? "A Just Sold post builds your reputation and shows future clients you get results. Let's make it shine."
                : "A Price Reduced post can reignite interest and bring in new buyers who were on the fence.",
            actionLabel: "Create Post",
            actionType: "create_post",
            buttons: ["Create Post", "Skip"],
          });
        }
      }
    });

    // 3. Unshared staging content
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
            title: "Your virtual staging is ready to wow buyers",
            description: `Before/after staging posts consistently rank as top-performing real estate content. Share it now and watch the engagement roll in.`,
            actionLabel: "Share Now",
            actionType: "share_staging",
            buttons: ["Write Caption", "Schedule", "Skip"],
          });
        }
      });

    // 4. Stale/untouched listings
    properties
      .filter((p: { status: string }) => p.status === "active" || p.status === "new" || p.status === "coming_soon")
      .forEach((prop: { id: string; address: string; photos: unknown[] | null }) => {
        const propActions = actions.filter((a: { property_id?: string }) => a.property_id === prop.id);
        const propOrders = orders.filter((o: { property_address?: string }) =>
          o.property_address && prop.address &&
          o.property_address.toLowerCase().includes(prop.address.toLowerCase().split(",")[0])
        );
        const propExports = exports_.filter((e: { property_id?: string }) => e.property_id === prop.id);
        const propStaging = staging.filter((s: { property_id?: string }) => s.property_id === prop.id);
        const propDescs = descriptions.filter((d: { property_data?: { address?: string } }) => {
          const descAddr = d.property_data?.address || "";
          return descAddr && prop.address &&
            descAddr.toLowerCase().includes(prop.address.toLowerCase().split(",")[0]);
        });
        const hasVideo = propOrders.some((o: { delivery_url?: string }) => o.delivery_url);
        const hasClips = propOrders.some((o: { clip_urls?: unknown }) => Array.isArray(o.clip_urls) && o.clip_urls.length > 0);
        const hasPhotos = (prop.photos && prop.photos.length > 0) || propOrders.length > 0;
        const photoCount = prop.photos ? prop.photos.length : 0;

        const lastAction = propActions
          .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        const daysSinceAction = lastAction ? daysSince(lastAction.created_at) : null;
        const addressShort = prop.address.split(",")[0] || prop.address;

        // ZERO TOUCH
        if (propActions.length === 0 && propExports.length === 0 && propStaging.length === 0 && propDescs.length === 0) {
          if (hasVideo || hasPhotos) {
            suggestions.push({
              id: nextId(), type: "nudge", priority: 3, propertyId: prop.id, propertyAddress: prop.address,
              title: `${addressShort} is ready for its debut`,
              description: `You have ${hasVideo ? "a video and " : ""}${photoCount > 0 ? photoCount + " photos" : "great content"} ready to go — consistent marketing gets listings sold faster.`,
              actionLabel: "Start Marketing", actionType: "zero_touch",
              buttons: [hasVideo ? "Create a story reel" : "Make a photo teaser", "Create a Just Listed graphic", "Write a listing description", "This listing is no longer active"],
            });
          } else {
            suggestions.push({
              id: nextId(), type: "nudge", priority: 4, propertyId: prop.id, propertyAddress: prop.address,
              title: `Let's build momentum for ${addressShort}`,
              description: `Every great listing starts with great content. Adding photos and a video can increase showing requests by up to 40%.`,
              actionLabel: "Get Started", actionType: "no_content",
              buttons: ["Order a listing video", "Upload photos", "Skip"],
            });
          }
          return;
        }

        // STALE — 14+ days
        if (daysSinceAction !== null && daysSinceAction > 14) {
          const specificButtons: string[] = [];
          if (hasPhotos && photoCount >= 5) specificButtons.push(`Create a ${photoCount >= 8 ? "photo carousel" : "5-photo teaser"} for socials`);
          if (hasVideo && !propExports.some((e: { template_type?: string }) => e.template_type?.includes("video_remix"))) specificButtons.push("Make a story reel from the video");
          if (hasClips) specificButtons.push("Create a remix with the Just Listed template");
          if (propStaging.length > 0 && !propActions.some((a: { content_type?: string }) => a.content_type === "staging_reveal")) specificButtons.push("Share the staging before/after");
          if (propDescs.length === 0) specificButtons.push("Write a listing description first");
          if (specificButtons.length === 0) { specificButtons.push("Write a new caption"); specificButtons.push("Create a price update graphic"); }
          specificButtons.push("This listing is no longer active");

          suggestions.push({
            id: nextId(), type: "nudge", priority: 4, propertyId: prop.id, propertyAddress: prop.address,
            title: `${addressShort} deserves some fresh attention`,
            description: `It's been ${daysSinceAction} days since your last push — listings that stay active on social sell faster. One post today could make all the difference.`,
            actionLabel: "Promote Now", actionType: "stale_listing",
            buttons: specificButtons.slice(0, 4),
          });
        }

        // HAS CONTENT NEVER SHARED
        if (daysSinceAction === null || daysSinceAction <= 14) {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const recentUnsharedExports = propExports.filter(
            (e: { created_at: string; template_type?: string }) =>
              e.created_at > sevenDaysAgo &&
              !propActions.some((a: { content_type?: string; created_at: string }) =>
                a.created_at > e.created_at && a.content_type === "social_share"
              )
          );
          if (recentUnsharedExports.length > 0) {
            suggestions.push({
              id: nextId(), type: "nudge", priority: 5, propertyId: prop.id, propertyAddress: prop.address,
              title: `${addressShort} has content ready to impress`,
              description: `You created ${recentUnsharedExports.length} marketing graphic${recentUnsharedExports.length > 1 ? "s" : ""} this week — sharing them now builds visibility while the listing is fresh.`,
              actionLabel: "Share Now", actionType: "unshared_content",
              buttons: ["Post to Instagram", "Post to Facebook", "Schedule for later", "Skip"],
            });
          }
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
        id: nextId(), type: "self_marketing", priority: 5,
        title: "Your audience wants to hear from you",
        description: nudge.message,
        actionLabel: "Write a Post", actionType: "self_marketing",
        buttons: nudge.suggestedTypes.slice(0, 4).map((t) => t.label).concat(["Not now"]),
      });
    }

    suggestions.sort((a, b) => a.priority - b.priority);
    const capped = suggestions.slice(0, 8);

    // Content scores (compact)
    const scores = properties
      .filter((p: { status: string }) => p.status === "active" || p.status === "new" || p.status === "coming_soon")
      .slice(0, 5)
      .map((prop: any) => {
        const propOrders = orders.filter((o: any) =>
          o.property_address && prop.address &&
          o.property_address.toLowerCase().includes(prop.address.toLowerCase().split(",")[0])
        );
        const propExports = exports_.filter((e: any) => e.property_id === prop.id);
        const propActions = actions.filter((a: any) => a.property_id === prop.id);
        const propStaging = staging.filter((s: any) => s.property_id === prop.id);
        const photoCount = prop.photos ? prop.photos.length : 0;

        return calculateContentScore(prop, {
          hasOrder: propOrders.length > 0,
          hasVideoDelivery: propOrders.some((o: any) => !!o.delivery_url),
          hasRemix: propExports.some((e: any) => e.template_type?.includes("video_remix")),
          hasDescription: descriptions.some((d: any) => {
            const descAddr = d.property_data?.address || "";
            return descAddr && prop.address && descAddr.toLowerCase().includes(prop.address.toLowerCase().split(",")[0]);
          }),
          hasFlyer: propExports.some((e: any) => {
            const t = e.template_type || "";
            return t.includes("just_listed") || t.includes("just-listed") || t.includes("open_house") || t.includes("open-house") ||
              t.includes("price_reduced") || t.includes("price-reduced") || t.includes("just_sold") || t.includes("just-sold") ||
              t.includes("yard_sign") || t.includes("yard-sign") || t.includes("property_pdf");
          }),
          hasOptimizedPhotos: !!(prop.optimized_photos && prop.optimized_photos.length > 0),
          hasSocialShare: propActions.some((a: any) => a.action_type === "social_share"),
          hasStaging: propStaging.length > 0,
          hasDroneAnnotation: propExports.some((e: any) => e.template_type?.includes("drone")),
          hasWebsite: !!prop.website_published,
          hasBlogPost: false,
          hasJustSoldGraphic: propExports.some((e: any) => e.template_type && (e.template_type.includes("sold") || e.template_type.includes("just-sold"))),
          hasPriceReducedGraphic: propExports.some((e: any) => e.template_type && (e.template_type.includes("price") || e.template_type.includes("price-reduced"))),
          photoCount,
          hasAgentWebsite,
          hasAerialPhotos: photoCount > 10,
          roomsAppearEmpty: photoCount < 15,
        });
      });

    // Brand score — 8 profile fields
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

    return NextResponse.json({ suggestions: capped, scores, brandScore, agentName });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}
