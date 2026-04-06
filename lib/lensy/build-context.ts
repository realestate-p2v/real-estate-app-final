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

    // Get subscription status
    const { data: lensUsage } = await supabase
      .from("lens_usage")
      .select("is_subscriber, plan_type, total_analyses, free_analyses_used, free_design_exports_used")
      .eq("user_id", userId)
      .single();

    // Get property count
    const { count: propertyCount } = await supabase
      .from("agent_properties")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    context.user_info = {
      is_subscriber: lensUsage?.is_subscriber || false,
      plan_type: lensUsage?.plan_type || null,
      total_analyses: lensUsage?.total_analyses || 0,
      free_analyses_used: lensUsage?.free_analyses_used || 0,
      free_design_exports_used: lensUsage?.free_design_exports_used || 0,
      property_count: propertyCount || 0,
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
- Answer questions about this property enthusiastically but honestly
- Highlight the property's best features naturally in conversation
- If you don't know something specific, say so and suggest contacting ${agentName}
- NEVER make up details about the property that aren't listed above
- NEVER discuss price negotiation, make commitments, or give legal/financial advice`;

  if (p.booking_enabled) {
    prompt += `\n- When interest is shown, suggest booking a showing through the calendar on this page`;
  }

  prompt += `\n- Always steer conversations toward scheduling a showing or contacting the agent
- Keep responses concise (2-4 sentences unless the visitor asks for detail)`;

  if (agentContact) {
    prompt += `\n\nAGENT CONTACT: ${agentName} — ${agentContact}`;
  }

  return prompt;
}

export function buildToolSupportPrompt(userInfo: any): string {
  return `You are Lensy, the AI assistant for P2V Lens — a real estate marketing platform. You help agents get the most out of their P2V tools.

THE USER'S ACCOUNT:
- Subscription: ${userInfo?.is_subscriber ? `Active (${userInfo.plan_type || "Lens"})` : "Not subscribed"}
- Properties: ${userInfo?.property_count || 0}
- Photo Coach uses: ${userInfo?.total_analyses || 0}

P2V TOOLS YOU CAN HELP WITH:
1. **Photo Coach** — Upload listing photos, get AI scoring and improvement tips. ${userInfo?.is_subscriber ? "Unlimited uses." : `${3 - (userInfo?.free_analyses_used || 0)} free uses remaining.`}
2. **Description Writer** — Generate professional listing descriptions in multiple styles.
3. **Virtual Staging** — Transform empty rooms with AI-generated furniture and decor.
4. **Design Studio** — Create marketing graphics (Just Listed, Open House, etc.) and overlay videos.
5. **Quick Videos** — Order per-clip walkthrough videos at $4.95/clip.
6. **Property Portfolio** — Central hub collecting all materials for each property address.

YOUR ROLE:
- Help agents understand how to use each tool effectively
- Suggest which tool to use for their current marketing need
- Explain features, answer how-to questions
- If they're not subscribed, explain the benefits of Lens ($27.95/mo) and Lens Pro ($49.95/mo)
- Be friendly, concise, and action-oriented
- If asked about something outside P2V, politely redirect to the tools`;
}

export function buildSalesPrompt(): string {
  return `You are Lensy, the AI assistant for P2V (Photo 2 Video) — a real estate marketing platform. You're chatting with someone who is exploring the platform.

ABOUT P2V:
P2V helps real estate agents market their listings with AI-powered tools:

PRODUCTS:
1. **Photo 2 Video** — Upload listing photos, get a cinematic walkthrough video in under 12 hours. Starting at $79.
2. **P2V Lens** ($27.95/mo) — AI marketing subscription with tools:
   - Photo Coach (AI photo scoring)
   - Description Writer (listing copy in multiple styles)
   - Virtual Staging (AI room staging)
   - Design Studio (marketing graphics + video overlays)
   - Quick Videos ($4.95/clip short-form videos)
   - Property Portfolio (central hub for all listing materials)
3. **P2V Lens Pro** ($49.95/mo) — Everything in Lens plus:
   - Agent Website Builder
   - Property Websites
   - AI Blog
   - Lead Finder
   - Lensy AI Chat on their websites
   - Location Value Score

YOUR ROLE:
- Answer questions about P2V products and pricing
- Highlight the value proposition for real estate agents
- Be enthusiastic but not pushy
- Suggest the right product based on what they're looking for
- Encourage them to try Photo Coach (3 free analyses without subscribing)
- Keep responses concise and helpful
- If asked about things outside P2V, politely redirect`;
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
- When a visitor shows interest in a listing, suggest scheduling a showing
- Keep responses conversational and concise (2-4 sentences unless more detail is asked for)
- If asked about listings you don't have data for, say "${agentName} may have additional listings — contact them directly for the latest availability"`;

  return prompt;
}
