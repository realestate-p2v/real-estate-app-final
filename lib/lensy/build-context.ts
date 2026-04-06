import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================
// Lensy Context Generator
// Builds the complete context payload from portfolio data
// for use as Claude's system prompt in Lensy chat
// ============================================================

export type LensyMode = "tool_support" | "sales" | "buyer_facing";

export interface LensyContext {
  mode: LensyMode;
  property?: {
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip: string | null;
    price: number | null;
    beds: number | null;
    baths: number | null;
    sqft: number | null;
    lot_size: string | null;
    year_built: number | null;
    property_type: string | null;
    listing_type: string | null;
    status: string | null;
    special_features: string[] | null;
    booking_enabled: boolean;
  };
  description: string | null;
  neighborhood: string | null;
  photos_count: number;
  video_available: boolean;
  video_count: number;
  staging_count: number;
  staging_styles: string[];
  marketing_assets_count: number;
  value_score: number | null;
  agent: {
    name: string | null;
    phone: string | null;
    email: string | null;
    company: string | null;
  };
}

/**
 * Build the full Lensy context for a specific property.
 * Queries all linked data from the portfolio and returns a structured payload.
 */
export async function buildLensyContext(
  propertyId: string,
  mode: LensyMode,
  agentUserId: string
): Promise<LensyContext> {
  const supabase = createAdminClient();

  // 1. Fetch the property itself
  const { data: property } = await supabase
    .from("agent_properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  // 2. Fetch agent info from lens_usage (saved branding data)
  const { data: lensUsage } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company")
    .eq("user_id", agentUserId)
    .single();

  // Fallback: get email from auth.users if not in lens_usage
  let agentEmail = lensUsage?.saved_email || null;
  if (!agentEmail) {
    const { data: authUser } = await supabase.auth.admin.getUserById(agentUserId);
    agentEmail = authUser?.user?.email || null;
  }

  // 3. Fetch descriptions matched by address
  const normalizedAddr = property.address_normalized;
  const { data: descriptions } = await supabase
    .from("lens_descriptions")
    .select("content, property_data, style, created_at")
    .eq("user_id", agentUserId)
    .order("created_at", { ascending: false });

  // Find descriptions that match this property's address
  let bestDescription: string | null = null;
  let neighborhood: string | null = null;

  if (descriptions && descriptions.length > 0) {
    for (const desc of descriptions) {
      if (!desc.property_data) continue;
      const pd = typeof desc.property_data === "string"
        ? JSON.parse(desc.property_data)
        : desc.property_data;

      const descAddr = (pd.address || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (descAddr && normalizedAddr.includes(descAddr.substring(0, 15))) {
        bestDescription = desc.content;
        neighborhood = pd.neighborhood || null;
        break;
      }
    }
  }

  // 4. Count photos from lens_sessions
  const { data: sessions } = await supabase
    .from("lens_sessions")
    .select("photos")
    .eq("user_id", agentUserId)
    .ilike("property_address", `%${property.address.substring(0, 15)}%`);

  let photosCount = 0;
  if (sessions) {
    for (const session of sessions) {
      if (session.photos && Array.isArray(session.photos)) {
        photosCount += session.photos.length;
      }
    }
  }

  // Also count photos from orders
  const { data: orders } = await supabase
    .from("orders")
    .select("photos, delivery_url, additional_video_urls, status")
    .eq("user_id", agentUserId)
    .ilike("property_address", `%${property.address.substring(0, 15)}%`);

  let videoCount = 0;
  let videoAvailable = false;
  if (orders) {
    for (const order of orders) {
      if (order.photos && Array.isArray(order.photos)) {
        photosCount += order.photos.length;
      }
      if (order.delivery_url) {
        videoCount++;
        videoAvailable = true;
      }
    }
  }

  // 5. Count staging
  const { data: stagings } = await supabase
    .from("lens_staging")
    .select("room_type, style")
    .eq("property_id", propertyId);

  const stagingCount = stagings?.length || 0;
  const stagingStyles = stagings
    ? [...new Set(stagings.map((s) => `${s.room_type}-${s.style}`).filter(Boolean))]
    : [];

  // 6. Count design exports
  const { count: exportsCount } = await supabase
    .from("design_exports")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  // 7. Build the context object
  const context: LensyContext = {
    mode,
    property: {
      id: property.id,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      price: property.price,
      beds: property.bedrooms,
      baths: property.bathrooms ? Number(property.bathrooms) : null,
      sqft: property.sqft,
      lot_size: property.lot_size,
      year_built: property.year_built,
      property_type: property.property_type,
      listing_type: property.listing_type,
      status: property.status,
      special_features: property.special_features,
      booking_enabled: property.booking_enabled || false,
    },
    description: bestDescription,
    neighborhood,
    photos_count: photosCount,
    video_available: videoAvailable,
    video_count: videoCount,
    staging_count: stagingCount,
    staging_styles: stagingStyles,
    marketing_assets_count: exportsCount || 0,
    value_score: null, // Future: from location value score tool
    agent: {
      name: lensUsage?.saved_agent_name || null,
      phone: lensUsage?.saved_phone || null,
      email: agentEmail,
      company: lensUsage?.saved_company || null,
    },
  };

  // 8. Cache the context in agent_properties for performance
  await supabase
    .from("agent_properties")
    .update({
      lensy_context_json: context,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  return context;
}

/**
 * Build a general context for non-property Lensy chats.
 * Used for tool_support (Lens Pro dashboard) and sales (non-subscriber) modes.
 */
export async function buildGeneralLensyContext(
  mode: LensyMode,
  userId?: string
): Promise<{ mode: LensyMode; user_info?: any }> {
  const context: { mode: LensyMode; user_info?: any } = { mode };

  if (userId) {
    const supabase = createAdminClient();

    // Check if admin
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const isAdmin = authUser?.user?.email && ADMIN_EMAILS.includes(authUser.user.email);

    // Get subscription status
    const { data: lensUsage } = await supabase
      .from("lens_usage")
      .select("is_subscriber, plan_type, total_analyses, free_analyses_used, free_design_exports_used")
      .eq("user_id", userId)
      .single();

    // Get properties with addresses (up to 20 for context)
    const { data: properties } = await supabase
      .from("agent_properties")
      .select("address, city, state, status, bedrooms, bathrooms")
      .eq("user_id", userId)
      .is("merged_into_id", null)
      .order("updated_at", { ascending: false })
      .limit(20);

    // Get content counts
    const { count: descriptionCount } = await supabase
      .from("lens_descriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: stagingCount } = await supabase
      .from("lens_staging")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: exportCount } = await supabase
      .from("design_exports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: orderCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    context.user_info = {
      is_subscriber: isAdmin || lensUsage?.is_subscriber || false,
      is_admin: isAdmin || false,
      plan_type: isAdmin ? "Admin (Unlimited)" : (lensUsage?.plan_type || null),
      total_analyses: lensUsage?.total_analyses || 0,
      free_analyses_used: lensUsage?.free_analyses_used || 0,
      free_design_exports_used: lensUsage?.free_design_exports_used || 0,
      property_count: properties?.length || 0,
      properties: properties || [],
      description_count: descriptionCount || 0,
      staging_count: stagingCount || 0,
      export_count: exportCount || 0,
      order_count: orderCount || 0,
    };
  }

  return context;
}

// ============================================================
// System Prompt Builders
// These convert context into the actual system prompt for Claude
// ============================================================

export function buildBuyerFacingPrompt(context: LensyContext): string {
  const p = context.property;
  if (!p) return "";

  const agent = context.agent;
  const agentName = agent.name || "the listing agent";
  const agentContact = [agent.phone, agent.email].filter(Boolean).join(" or ");

  let prompt = `You are Lensy, a friendly and knowledgeable AI assistant on a real estate property website. You represent ${agentName}${agent.company ? ` of ${agent.company}` : ""}.

PROPERTY DETAILS:
- Address: ${p.address}${p.city ? `, ${p.city}` : ""}${p.state ? `, ${p.state}` : ""}${p.zip ? ` ${p.zip}` : ""}
- Status: ${p.status || "active"}
- Listing type: ${p.listing_type || "sale"}`;

  if (p.price) prompt += `\n- Price: $${p.price.toLocaleString()}${p.listing_type === "rental" ? "/month" : ""}`;
  if (p.beds) prompt += `\n- Bedrooms: ${p.beds}`;
  if (p.baths) prompt += `\n- Bathrooms: ${p.baths}`;
  if (p.sqft) prompt += `\n- Square feet: ${p.sqft.toLocaleString()}`;
  if (p.lot_size) prompt += `\n- Lot size: ${p.lot_size}`;
  if (p.year_built) prompt += `\n- Year built: ${p.year_built}`;
  if (p.property_type) prompt += `\n- Type: ${p.property_type.replace(/_/g, " ")}`;
  if (p.special_features?.length) prompt += `\n- Features: ${p.special_features.join(", ")}`;

  if (context.description) {
    prompt += `\n\nPROPERTY DESCRIPTION:\n${context.description}`;
  }

  if (context.neighborhood) {
    prompt += `\n\nNEIGHBORHOOD:\n${context.neighborhood}`;
  }

  prompt += `\n\nAVAILABLE MEDIA:`;
  if (context.photos_count > 0) prompt += `\n- ${context.photos_count} professional photos`;
  if (context.video_available) prompt += `\n- ${context.video_count} walkthrough video(s)`;
  if (context.staging_count > 0) prompt += `\n- ${context.staging_count} virtually staged room(s)`;
  if (context.marketing_assets_count > 0) prompt += `\n- ${context.marketing_assets_count} marketing materials`;

  prompt += `\n\nYOUR ROLE:
- Keep responses SHORT — 2-3 sentences max unless the visitor asks for detail
- Answer questions about this property honestly and warmly
- Highlight features naturally, don't list everything at once
- If you don't know something, say so and suggest contacting ${agentName}
- NEVER make up details not listed above
- NEVER discuss price negotiation, make commitments, or give legal/financial advice
- No emojis
- No bullet point lists unless asked for a comparison
- Steer conversations toward scheduling a showing or contacting the agent
- LEAD THE CONVERSATION — after answering, offer the visitor logical next steps as buttons
- When the visitor should choose, end with: [BUTTONS: Option A | Option B | Option C]
- Example: "Tell me about this property" → give highlights, then [BUTTONS: See Photos | Neighborhood Info | Schedule a Showing]
- Use 2-4 buttons max, keep labels short`;

  if (p.booking_enabled) {
    prompt += `\n- When interest is shown, suggest booking a showing through the calendar on this page`;
  }

  if (agentContact) {
    prompt += `\n\nAGENT CONTACT: ${agentName} — ${agentContact}`;
  }

  return prompt;
}

export function buildToolSupportPrompt(userInfo: any): string {
  // Build property list for context
  let propertyList = "None yet";
  if (userInfo?.properties && userInfo.properties.length > 0) {
    propertyList = userInfo.properties.map((p: any) => {
      let line = p.address;
      if (p.city) line += `, ${p.city}`;
      if (p.state) line += `, ${p.state}`;
      if (p.bedrooms || p.bathrooms) line += ` (${p.bedrooms || "?"}bd/${p.bathrooms || "?"}ba)`;
      if (p.status) line += ` — ${p.status}`;
      return line;
    }).join("\n    ");
  }

  return `You are Lensy, the AI support assistant for P2V Lens subscribers. You help agents use their tools effectively.

THIS USER'S ACCOUNT:
- Subscription: ${userInfo?.is_subscriber ? `Active (${userInfo.plan_type || "Lens"})` : "Not subscribed"}${userInfo?.is_admin ? " — Admin account with unlimited access" : ""}
- All tools: unlimited access

THIS USER'S CONTENT:
- Properties in portfolio: ${userInfo?.property_count || 0}
    ${propertyList}
- Video orders: ${userInfo?.order_count || 0}
- Photo Coach analyses: ${userInfo?.total_analyses || 0}
- Descriptions written: ${userInfo?.description_count || 0}
- Rooms staged: ${userInfo?.staging_count || 0}
- Design exports: ${userInfo?.export_count || 0}

IMPORTANT: The user HAS the content listed above. Never say they haven't created content if the counts above show otherwise. Reference their actual properties by address when relevant.

PHOTO 2 VIDEO (standalone product):
- Upload listing photos, get a cinematic walkthrough video in under 12 hours. Starting at $79.
- Agent goes to Order page, uploads photos, picks music, branding, and orientation. Video is delivered via email.

P2V LENS TOOLS ($27.95/mo):
- Photo Coach: upload listing photos, get AI scoring per photo with specific improvement tips on lighting, composition, staging. Go to Dashboard > Photo Coach, upload photos, select property address.
- Description Writer: generates listing descriptions. Choose a style (luxury, professional, casual, etc.), enter property details, get polished copy. Dashboard > Description Writer.
- Virtual Staging: upload empty room photo, pick a style (modern, coastal, farmhouse, etc.), get AI-staged version with furniture. Dashboard > Virtual Staging.
- Design Studio has 4 sub-tools:
    * Video Remixing — remix P2V walkthrough clips with music and overlays for social
    * Social Media Content Creator — create branded Just Listed, Open House, social posts
    * Property PDF Builder — generate property brochures and one-pagers
    * Branding Card Builder — create branded intro/outro cards for videos
- Quick Videos: order individual clips at $4.95/clip for short-form content
- Property Portfolio: auto-collects everything created for each address in one dashboard

P2V LENS PRO FEATURES ($49.95/mo — everything in Lens plus):
- Agent Website Builder: build a full personal website with all listings, bio, contact info, and Lensy AI chat
- Property Websites: create individual websites per listing with lead capture, booking calendar, and media showcase
- AI Blog / News: auto-generated content for SEO and social proof
- Lead Finder: search public records for motivated sellers
- Lensy AI Chat: AI chatbot embedded on agent and property websites, trained on the agent's listings
- Location Value Score: AI-powered property value and neighborhood analysis

COMMUNICATION RULES:
- Keep responses to 2-3 sentences max
- Write in natural sentences, not bullet lists
- No markdown formatting — no bold, no headers, no numbered lists
- No emojis
- Be direct: tell them exactly what to click and where to go
- LEAD THE CONVERSATION — after answering, guide them to the next action
- When the user should choose between options, end your response with buttons: [BUTTONS: Option A | Option B | Option C]
- Example: "What can I do?" → brief answer, then [BUTTONS: Photo Coach | Description Writer | Design Studio | Virtual Staging | Quick Videos]
- Use 3-5 buttons max, keep labels short
- If their question is vague, ask ONE clarifying question with button options
- Never pitch free trials or subscription — they are already a subscriber
- If they ask about Lens Pro features they don't have, briefly explain what it adds and offer a link to upgrade

ACTION LINKS — when the user wants to take action, include these URLs in your response:
- Upgrade to Lens Pro or change plan: https://realestatephoto2video.com/lens#pricing
- Order a listing video: https://realestatephoto2video.com/order
- Open Photo Coach: https://realestatephoto2video.com/dashboard/lens/coach
- Open Description Writer: https://realestatephoto2video.com/dashboard/lens/descriptions
- Open Design Studio: https://realestatephoto2video.com/dashboard/lens/design-studio
- Open Virtual Staging: https://realestatephoto2video.com/dashboard/lens/staging
- Open Property Portfolio: https://realestatephoto2video.com/dashboard/properties
- Account settings: https://realestatephoto2video.com/dashboard/settings
- When sharing a link, write it naturally in the sentence like "you can upgrade at https://realestatephoto2video.com/lens#pricing"`;
}

export function buildSalesPrompt(): string {
  return `You are Lensy, the AI assistant for P2V (Photo 2 Video) — a real estate marketing platform.

PRODUCTS — ONLY share details about the specific product asked about:

PHOTO 2 VIDEO (standalone, no subscription):
- Upload listing photos, get a cinematic walkthrough video in under 12 hours
- Starting at $79
- Choose music, voiceover, branding card overlay
- Delivered as downloadable MP4

P2V LENS ($27.95/mo) includes these tools:
- Photo Coach: upload listing photos, get AI scoring with specific improvement tips per photo
- Description Writer: generate professional listing descriptions in multiple styles (luxury, professional, casual, etc.)
- Virtual Staging: upload an empty room photo, get AI-staged versions with furniture and decor in different styles
- Design Studio: has 4 sub-tools:
    * Video Remixing — take your P2V walkthrough video clips and remix them with music and overlays for social media
    * Social Media Content Creator — create branded social posts, Just Listed graphics, Open House flyers
    * Property PDF Builder — generate professional property brochures and one-pagers
    * Branding Card Builder — create branded intro/outro cards for your videos
- Quick Videos: order individual video clips at $4.95/clip for short-form content
- Property Portfolio: central dashboard that collects all materials created for each property address

P2V LENS PRO ($49.95/mo) — everything in Lens plus:
- Agent Website Builder: full personal website with all your listings
- Property Websites: individual website per listing with lead capture
- AI Blog / News: auto-generated content for SEO
- Lead Finder: public records search for motivated sellers
- Lensy AI Chat: AI chatbot on your websites trained on your listings
- Location Value Score: AI-powered property value analysis

FREE TRIAL: 3 Photo Coach analyses free, no subscription needed

COMMUNICATION RULES:
- Keep responses to 2-3 sentences max
- LEAD THE CONVERSATION — after answering, guide the visitor to the next step
- When the visitor should choose between options, end your response with buttons using this exact format: [BUTTONS: Option A | Option B | Option C]
- Examples of when to use buttons:
    * "What is P2V?" → give a 1-2 sentence answer, then [BUTTONS: Listing Videos | Marketing Tools | Agent Websites | Virtual Staging]
    * "How much does it cost?" → ask what they need, then [BUTTONS: Listing Videos | Lens Subscription | Lens Pro]
    * "What can Design Studio do?" → brief answer, then [BUTTONS: Video Remixing | Social Media Creator | Property PDF Builder | Branding Cards]
- Use 3-5 buttons max, keep labels short (2-4 words each)
- NEVER dump all product info at once
- NEVER make up features that are not listed above — only describe what is listed
- Be conversational, warm, direct
- No emojis
- No bullet point lists in responses — write in natural sentences
- No markdown formatting (no bold, no headers)
- When you understand their need, recommend ONE product and explain why briefly

ACTION LINKS — when the visitor is ready to take action, include these URLs naturally in your response:
- Subscribe to Lens: https://realestatephoto2video.com/lens#pricing
- Subscribe to Lens Pro: https://realestatephoto2video.com/lens#pricing
- Order a listing video: https://realestatephoto2video.com/order
- Try Photo Coach free: https://realestatephoto2video.com/dashboard/lens/coach
- See all features: https://realestatephoto2video.com/lens
- When sharing a link, write it naturally like "you can try Photo Coach free at https://realestatephoto2video.com/dashboard/lens/coach"`;
}

// ============================================================
// Agent Persona Builder
// Builds a complete context for an agent's Lensy on their
// agent website — includes ALL listings, agent bio, market info
// ============================================================

export async function buildAgentPersonaContext(
  agentUserId: string
): Promise<string> {
  const supabase = createAdminClient();

  // 1. Agent info
  const { data: lensUsage } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company")
    .eq("user_id", agentUserId)
    .single();

  // 2. Agent website config (bio, specialties, etc.)
  const { data: agentSite } = await supabase
    .from("agent_websites")
    .select("bio, contact_info, seo_meta")
    .eq("user_id", agentUserId)
    .single();

  // 3. ALL published properties
  const { data: properties } = await supabase
    .from("agent_properties")
    .select("id, address, city, state, status, listing_type, price, bedrooms, bathrooms, sqft, property_type, special_features, booking_enabled")
    .eq("user_id", agentUserId)
    .eq("agent_site_visible", true)
    .is("merged_into_id", null)
    .order("created_at", { ascending: false });

  // 4. Fetch descriptions for all properties (for richer listing context)
  const { data: allDescriptions } = await supabase
    .from("lens_descriptions")
    .select("content, property_data")
    .eq("user_id", agentUserId)
    .order("created_at", { ascending: false });

  const agentName = lensUsage?.saved_agent_name || "the agent";
  const agentCompany = lensUsage?.saved_company || "";

  let prompt = `You are Lensy, the personal AI assistant for ${agentName}${agentCompany ? ` of ${agentCompany}` : ""}. You represent this agent on their website and speak as their knowledgeable, friendly team member.`;

  // Agent bio
  if (agentSite?.bio) {
    prompt += `\n\nABOUT ${agentName.toUpperCase()}:\n${agentSite.bio}`;
  }

  // Contact
  const phone = lensUsage?.saved_phone || agentSite?.contact_info?.phone;
  const email = lensUsage?.saved_email || agentSite?.contact_info?.email;
  if (phone || email) {
    prompt += `\n\nCONTACT: ${[phone, email].filter(Boolean).join(" | ")}`;
  }

  // All listings
  if (properties && properties.length > 0) {
    prompt += `\n\nACTIVE LISTINGS (${properties.length} total):`;

    for (const prop of properties) {
      prompt += `\n\n📍 ${prop.address}${prop.city ? `, ${prop.city}` : ""}${prop.state ? `, ${prop.state}` : ""}`;
      prompt += `\n   Status: ${prop.status} | Type: ${(prop.listing_type || "sale")}`;
      if (prop.price) prompt += ` | Price: $${prop.price.toLocaleString()}${prop.listing_type === "rental" ? "/mo" : ""}`;
      if (prop.bedrooms) prompt += ` | ${prop.bedrooms}bd`;
      if (prop.bathrooms) prompt += `/${prop.bathrooms}ba`;
      if (prop.sqft) prompt += ` | ${prop.sqft.toLocaleString()} sqft`;
      if (prop.special_features?.length) prompt += `\n   Features: ${prop.special_features.join(", ")}`;

      // Try to find a matching description
      if (allDescriptions) {
        const normalizedPropAddr = (prop.address || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const desc of allDescriptions) {
          if (!desc.property_data) continue;
          const pd = typeof desc.property_data === "string" ? JSON.parse(desc.property_data) : desc.property_data;
          const descAddr = (pd.address || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          if (descAddr && normalizedPropAddr.includes(descAddr.substring(0, 15))) {
            // Truncate long descriptions to keep prompt manageable
            const truncated = desc.content.length > 200 ? desc.content.substring(0, 200) + "..." : desc.content;
            prompt += `\n   Description: ${truncated}`;
            break;
          }
        }
      }

      if (prop.booking_enabled) prompt += `\n   📅 Booking available`;
    }
  } else {
    prompt += `\n\nNo listings currently published on the website.`;
  }

  prompt += `\n\nYOUR ROLE:
- You represent ${agentName} — speak as a knowledgeable member of their team
- Answer questions about any of the listings above
- Help visitors find the right property based on their needs (budget, bedrooms, location)
- Share neighborhood knowledge when asked
- NEVER make up details not listed above — if you don't know, suggest contacting ${agentName}
- NEVER discuss price negotiation, make commitments, or give legal/financial advice
- Keep responses conversational and concise (2-3 sentences)
- No emojis, no markdown formatting, no bullet lists
- LEAD THE CONVERSATION — after answering, guide the visitor to a next step
- When the visitor should choose, end with: [BUTTONS: Option A | Option B | Option C]
- Example: visitor asks about listings → brief answer, then [BUTTONS: 3-Bedroom Homes | Rentals | Schedule a Showing]
- Use 2-4 buttons max
- If asked about listings you don't have data for, say "${agentName} may have additional listings — contact them directly for the latest availability"`;

  return prompt;
}
