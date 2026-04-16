// app/api/planner/sprint/generate/route.ts
// Generates a 30-day marketing sprint with pre-selected media and captions
// POST { properties: [{ id, priority }], frequency: "daily" | "steady" | "light" }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SprintProperty {
  id: string;
  priority: "high" | "medium" | "low";
}

interface SprintInput {
  properties: SprintProperty[];
  frequency: "daily" | "steady" | "light";
}

// Post type rotation — varies content so it's never repetitive
const POST_TYPES = [
  { contentType: "listing_video", label: "Share listing video", platform: "instagram", mediaType: "video" },
  { contentType: "photo_feature", label: "Feature photo post", platform: "instagram", mediaType: "photo" },
  { contentType: "new_listing", label: "Just Listed announcement", platform: "facebook", mediaType: "photo" },
  { contentType: "photo_carousel", label: "Photo carousel", platform: "instagram", mediaType: "photo" },
  { contentType: "property_highlight", label: "Property highlights", platform: "linkedin", mediaType: "photo" },
  { contentType: "video_clip", label: "Short video clip", platform: "instagram", mediaType: "clip" },
  { contentType: "graphic_share", label: "Share marketing graphic", platform: "facebook", mediaType: "flyer" },
  { contentType: "neighborhood", label: "Neighborhood spotlight", platform: "instagram", mediaType: "photo" },
  { contentType: "open_house", label: "Open house invite", platform: "facebook", mediaType: "flyer" },
  { contentType: "agent_tip", label: "Agent tip / market insight", platform: "linkedin", mediaType: null },
];

// Days per week by frequency
const POSTS_PER_WEEK: Record<string, number> = {
  daily: 7,
  steady: 3,
  light: 2,
};

// Priority weight — high gets 3x slots, medium 2x, low 1x
const PRIORITY_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// Best posting days (Tue/Thu/Sat are peak engagement)
const PREFERRED_DAYS = [2, 4, 6, 0, 1, 3, 5]; // Tue, Thu, Sat, Sun, Mon, Wed, Fri

function generateCaptionForType(
  contentType: string,
  property: { address: string; city?: string; bedrooms?: number; bathrooms?: number; sqft?: number; price?: number; special_features?: string[] },
  agentName: string
): string {
  const city = property.city || "";
  const addr = property.address || "";
  const details = [
    property.bedrooms ? `${property.bedrooms} bed` : "",
    property.bathrooms ? `${property.bathrooms} bath` : "",
    property.sqft ? `${property.sqft.toLocaleString()} sq ft` : "",
  ].filter(Boolean).join(" · ");
  const price = property.price ? `$${property.price.toLocaleString()}` : "";
  const features = property.special_features?.slice(0, 3).join(", ") || "";
  const firstName = agentName.split(" ")[0] || "";
  const cityTag = city.replace(/\s/g, "");

  const templates: Record<string, string[]> = {
    listing_video: [
      `🎬 Take a virtual tour of ${addr}!\n${details}\n${price}\nSee why this ${city} home is turning heads.\nFull video tour — listing link in first comment!\n#VirtualTour #${cityTag}RealEstate #HomeTour`,
      `Walk through ${addr} from your couch 🏠\n${details} | ${price}\nThis video shows every angle of this beautiful home.\nListing link in first comment!\n#PropertyTour #${cityTag}Homes #RealEstate`,
    ],
    photo_feature: [
      `📸 One of my favorite shots from ${addr}\n${details}\n${price}\nSome homes just photograph beautifully. This is one of them.\nListing link in first comment!\n#RealEstatePhotography #${cityTag} #HomeDesign`,
      `Every room tells a story ✨\n${addr}, ${city}\n${details}\nWhich room would be your favorite?\nListing link in first comment!\n#InteriorDesign #${cityTag}Homes #DreamHome`,
    ],
    new_listing: [
      `✨ Just Listed in ${city}!\n${addr}\n${details}\n${price}${features ? `\n${features}` : ""}\nThis is the one you've been waiting for. Schedule your private tour today! 🔑\nListing link in first comment!\n#JustListed #${cityTag}RealEstate #NewListing`,
      `🏡 NEW — ${addr}\n${details}${price ? ` | ${price}` : ""}${features ? `\n✅ ${property.special_features?.join("\n✅ ") || ""}` : ""}\nLocated in beautiful ${city} — move-in ready.\nDM ${firstName || "me"} to see it! 📲\n#JustListed #RealEstate #${cityTag}`,
    ],
    photo_carousel: [
      `Swipe through ${addr} 👉\n${details} | ${price}\n${features ? `Highlights: ${features}\n` : ""}Which photo is your favorite? Drop a number below!\nListing link in first comment!\n#PhotoCarousel #${cityTag}Homes #RealEstate`,
    ],
    property_highlight: [
      `Property Spotlight: ${addr}\n${city}\n${details}\n${price}\n${features ? `Key features: ${features}\n` : ""}This home offers exceptional value in one of the area's most sought-after locations.\nInterested in learning more? Let's connect.\n#RealEstate #PropertySpotlight #${cityTag}`,
    ],
    video_clip: [
      `A quick peek inside ${addr} 👀\n${details} | ${price}\nSometimes 15 seconds is all you need to fall in love.\nFull tour — listing link in first comment!\n#QuickTour #${cityTag}RealEstate #HomeClip`,
    ],
    graphic_share: [
      `${addr} — all the details in one place 📋\n${details}\n${price}\nSave this post and share it with anyone house hunting in ${city}!\n#${cityTag}Homes #RealEstate #HomeBuyers`,
    ],
    neighborhood: [
      `Why ${city}? 🏘️\nGreat schools, amazing restaurants, and homes like ${addr} that make you never want to leave.\n${details} | ${price}\nLet me show you what this neighborhood has to offer.\n#${cityTag}Living #NeighborhoodGuide #RealEstate`,
    ],
    open_house: [
      `🏠 OPEN HOUSE — ${addr}\n${details} | ${price}\nCome see this beautiful home in person!\nDM ${firstName || "me"} for date & time details.\n#OpenHouse #${cityTag}RealEstate #HomeTour`,
    ],
    agent_tip: [
      `💡 Quick tip for buyers in today's market:\nDon't wait for the "perfect" time — the perfect time is when you find the right home.\nI have ${city} listings ready for showings right now. Let's find yours.\n#RealEstateTips #HomeBuying #${cityTag}`,
      `📊 Market insight:\nHomes in ${city} that are actively marketed on social media sell faster and closer to asking price.\nThat's why I invest in professional photography, video, and consistent posting for every listing.\n#MarketUpdate #RealEstateAgent #${cityTag}`,
    ],
  };

  const options = templates[contentType] || templates.new_listing;
  return options[Math.floor(Math.random() * options.length)];
}

// Generate Cloudinary video thumbnail
function cloudinaryVideoThumb(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return null;
  return url.replace("/video/upload/", "/video/upload/so_0,w_400,h_300,c_fill/").replace(/\.mp4$/i, ".jpg");
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const body: SprintInput = await req.json();
    const { properties: sprintProps, frequency } = body;

    if (!sprintProps || sprintProps.length === 0) {
      return NextResponse.json({ error: "No properties selected" }, { status: 400 });
    }

    const postsPerWeek = POSTS_PER_WEEK[frequency] || 3;

    // Fetch property details and media
    const propertyIds = sprintProps.map(p => p.id);
    const [propsRes, ordersRes, exportsRes, profileRes] = await Promise.all([
      supabase.from("agent_properties")
        .select("id, address, city, state, status, price, bedrooms, bathrooms, sqft, special_features")
        .in("id", propertyIds),
      supabase.from("orders")
        .select("id, property_address, photos, delivery_url, clip_urls, created_at")
        .eq("user_id", userId)
        .in("payment_status", ["paid", "admin_bypass"]),
      supabase.from("design_exports")
        .select("id, property_id, template_type, export_url, export_format")
        .eq("user_id", userId)
        .in("property_id", propertyIds)
        .not("template_type", "eq", "branding_card"),
      supabase.from("lens_usage")
        .select("saved_agent_name")
        .eq("user_id", userId).single(),
    ]);

    const propertiesData = propsRes.data || [];
    const allOrders = ordersRes.data || [];
    const allExports = exportsRes.data || [];
    const agentName = profileRes.data?.saved_agent_name || "Agent";

    // Build media map per property
    const normalizeAddr = (s: string) =>
      (s || "").toLowerCase().replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();

    const propertyMediaMap = new Map<string, { photos: string[]; videos: string[]; clips: string[]; flyers: string[] }>();

    propertiesData.forEach((prop: any) => {
      const media = { photos: [] as string[], videos: [] as string[], clips: [] as string[], flyers: [] as string[] };
      const propNorm = normalizeAddr(prop.address).split(",")[0];

      // Match orders by address
      allOrders.forEach((order: any) => {
        const orderNorm = normalizeAddr(order.property_address).split(",")[0];
        if (propNorm.length > 3 && orderNorm.length > 3 && (propNorm.includes(orderNorm) || orderNorm.includes(propNorm))) {
          // Photos
          if (Array.isArray(order.photos)) {
            order.photos.forEach((p: any) => {
              const url = typeof p === "string" ? p : p?.secure_url || p?.url || "";
              if (url) media.photos.push(url);
            });
          }
          // Video
          if (order.delivery_url) media.videos.push(order.delivery_url);
          // Clips
          if (Array.isArray(order.clip_urls)) {
            order.clip_urls.forEach((c: any) => {
              const url = c?.url || c?.clip_file || "";
              if (url) media.clips.push(url);
            });
          }
        }
      });

      // Design exports
      allExports.filter((e: any) => e.property_id === prop.id).forEach((e: any) => {
        if (e.export_url) media.flyers.push(e.export_url);
      });

      propertyMediaMap.set(prop.id, media);
    });

    // Build weighted property rotation
    const weightedPropertyIds: string[] = [];
    sprintProps.forEach(sp => {
      const weight = PRIORITY_WEIGHT[sp.priority] || 1;
      for (let i = 0; i < weight; i++) weightedPropertyIds.push(sp.id);
    });

    // Generate 30 days of schedule
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // start tomorrow
    const scheduleRows: any[] = [];
    let postTypeIndex = 0;

    for (let week = 0; week < 5; week++) { // 5 weeks ≈ 30+ days
      // Pick which days this week to post
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + week * 7);

      const postDays = PREFERRED_DAYS.slice(0, postsPerWeek);

      postDays.forEach((dayOfWeek) => {
        const postDate = new Date(weekStart);
        // Find next occurrence of this day of week
        const currentDay = postDate.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7;
        postDate.setDate(postDate.getDate() + daysUntil);

        // Don't go past 35 days
        const daysDiff = Math.floor((postDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 35) return;

        // Pick property (weighted rotation)
        const propId = weightedPropertyIds[scheduleRows.length % weightedPropertyIds.length];
        const prop = propertiesData.find((p: any) => p.id === propId);
        if (!prop) return;

        // Pick post type (rotate through all types)
        const postType = POST_TYPES[postTypeIndex % POST_TYPES.length];
        postTypeIndex++;

        // Pick best media for this post type
        const media = propertyMediaMap.get(propId) || { photos: [], videos: [], clips: [], flyers: [] };
        let assetUrl = "";
        if (postType.mediaType === "video" && media.videos.length > 0) {
          assetUrl = media.videos[0];
        } else if (postType.mediaType === "clip" && media.clips.length > 0) {
          assetUrl = media.clips[scheduleRows.length % media.clips.length];
        } else if (postType.mediaType === "flyer" && media.flyers.length > 0) {
          assetUrl = media.flyers[scheduleRows.length % media.flyers.length];
        } else if (media.photos.length > 0) {
          assetUrl = media.photos[scheduleRows.length % media.photos.length];
        }

        // Generate caption
        const caption = generateCaptionForType(postType.contentType, prop, agentName);

        scheduleRows.push({
          user_id: userId,
          property_id: propId,
          scheduled_date: postDate.toISOString().split("T")[0],
          platform: postType.platform,
          content_type: postType.contentType,
          caption,
          asset_url: assetUrl,
          status: "pending",
          auto_generated: true,
        });
      });
    }

    // Sort by date
    scheduleRows.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

    // Create the marketing plan
    const { data: plan, error: planError } = await supabase
      .from("marketing_plans")
      .insert({
        user_id: userId,
        name: `30-Day Sprint — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        description: `${frequency} posting · ${sprintProps.length} ${sprintProps.length === 1 ? "property" : "properties"} · ${scheduleRows.length} posts`,
        property_ids: propertyIds,
        auto_generated: true,
        status: "active",
      })
      .select("id")
      .single();

    if (planError) {
      console.error("Failed to create plan:", planError);
      return NextResponse.json({ error: "Failed to create sprint plan" }, { status: 500 });
    }

    // Add plan_id to all schedule rows
    const rowsWithPlan = scheduleRows.map(row => ({ ...row, plan_id: plan.id }));

    // Insert schedule rows
    const { error: scheduleError } = await supabase
      .from("marketing_schedule")
      .insert(rowsWithPlan);

    if (scheduleError) {
      console.error("Failed to create schedule:", scheduleError);
      return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
    }

    return NextResponse.json({
      planId: plan.id,
      totalPosts: scheduleRows.length,
      startDate: scheduleRows[0]?.scheduled_date,
      endDate: scheduleRows[scheduleRows.length - 1]?.scheduled_date,
      schedule: scheduleRows.map(r => ({
        date: r.scheduled_date,
        platform: r.platform,
        contentType: r.content_type,
        propertyId: r.property_id,
        caption: r.caption.slice(0, 80) + "...",
      })),
    });
  } catch (error) {
    console.error("Sprint generation error:", error);
    return NextResponse.json({ error: "Failed to generate sprint" }, { status: 500 });
  }
}
