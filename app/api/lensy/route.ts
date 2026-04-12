import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildLensyContext,
  buildGeneralLensyContext,
  buildBuyerFacingPrompt,
  buildToolSupportPrompt,
  buildSalesPrompt,
  buildAgentPersonaContext,
  buildPortalPrompt,
  buildAgentSitePrompt,
  type LensyMode,
} from "@/lib/lensy/build-context";

// ============================================================
// POST /api/lensy
// Lensy AI Chat endpoint
// Accepts message + context, streams Claude response
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      history = [],
      propertyId = null,
      mode = "sales" as LensyMode,
      conversationId = null,
      visitorSession = null,
      agentUserId = null, // Required for buyer_facing + agent_site modes
      currentListingAddress = null, // Portal mode: current listing context
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // ── Determine auth context ──────────────────────────────
    // tool_support: user must be authenticated (subscriber)
    // sales, portal: works for anyone (logged in or not)
    // buyer_facing, agent_site: no auth required, but agentUserId must be provided
    let userId: string | null = null;

    if (mode === "buyer_facing" || mode === "agent_site") {
      if (!agentUserId) {
        return NextResponse.json({ error: "agentUserId is required for this mode" }, { status: 400 });
      }
    } else if (mode === "tool_support") {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    } else {
      // Sales + portal mode — try to get user but don't require it
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      } catch {
        // Anonymous visitor — that's fine
      }
    }

    const effectiveUserId = (mode === "buyer_facing" || mode === "agent_site") ? agentUserId : userId;

    // ── Build system prompt based on mode ───────────────────
    let systemPrompt = "";

    if (mode === "portal") {
      // ── Portal mode: p2v.homes public pages ──
      systemPrompt = buildPortalPrompt();

      // If viewing a specific listing, add context
      if (currentListingAddress) {
        const adminSupabase = createAdminClient();
        const { data: listing } = await adminSupabase
          .from("agent_properties")
          .select("address, city, state, price, bedrooms, bathrooms, sqft, status, special_features, amenities")
          .ilike("address", `%${currentListingAddress}%`)
          .eq("website_published", true)
          .is("merged_into_id", null)
          .limit(1)
          .single();
        if (listing) {
          systemPrompt += `\n\nTHE VISITOR IS CURRENTLY VIEWING:\n- Address: ${listing.address}`;
          if (listing.city) systemPrompt += `\n- City: ${listing.city}`;
          if (listing.state) systemPrompt += `\n- State: ${listing.state}`;
          if (listing.price) systemPrompt += `\n- Price: $${listing.price.toLocaleString()}`;
          if (listing.bedrooms) systemPrompt += `\n- Bedrooms: ${listing.bedrooms}`;
          if (listing.bathrooms) systemPrompt += `\n- Bathrooms: ${listing.bathrooms}`;
          if (listing.sqft) systemPrompt += `\n- Square feet: ${listing.sqft.toLocaleString()}`;
          if (listing.status) systemPrompt += `\n- Status: ${listing.status}`;
          if (listing.special_features?.length) systemPrompt += `\n- Features: ${listing.special_features.join(", ")}`;
          if (listing.amenities?.length) systemPrompt += `\n- Amenities: ${listing.amenities.join(", ")}`;
        }
      }

    } else if (mode === "agent_site") {
      // ── Agent site mode: [handle].p2v.homes or custom domain ──
      const adminSupabase = createAdminClient();

      const { data: agentUsage } = await adminSupabase
        .from("lens_usage")
        .select("saved_agent_name, saved_phone, saved_email, saved_company")
        .eq("user_id", agentUserId)
        .single();

      const { data: agentListings } = await adminSupabase
        .from("agent_properties")
        .select("address, city, state, price, bedrooms, bathrooms, sqft, status, special_features, website_slug")
        .eq("user_id", agentUserId)
        .eq("website_published", true)
        .is("merged_into_id", null);

      let currentProp = null;
      if (propertyId) {
        const { data: prop } = await adminSupabase
          .from("agent_properties")
          .select("address, price, bedrooms, bathrooms, sqft, special_features")
          .eq("id", propertyId)
          .single();
        // Column is "description" not "content"
        const { data: desc } = await adminSupabase
          .from("lens_descriptions")
          .select("description")
          .eq("user_id", agentUserId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (prop) currentProp = { ...prop, description: desc?.[0]?.description };
      }

      systemPrompt = buildAgentSitePrompt(
        {
          name: agentUsage?.saved_agent_name || "the agent",
          company: agentUsage?.saved_company,
          phone: agentUsage?.saved_phone,
          email: agentUsage?.saved_email,
        },
        (agentListings || []).map((l) => ({
          address: l.address,
          city: l.city,
          state: l.state,
          price: l.price,
          beds: l.bedrooms,
          baths: l.bathrooms,
          sqft: l.sqft,
          status: l.status,
          specialFeatures: l.special_features,
        })),
        currentProp
          ? {
              address: currentProp.address,
              price: currentProp.price,
              beds: currentProp.bedrooms,
              baths: currentProp.bathrooms,
              sqft: currentProp.sqft,
              specialFeatures: currentProp.special_features,
              description: currentProp.description,
            }
          : null
      );

    } else if (propertyId && (mode === "buyer_facing" || mode === "tool_support")) {
      // Property-specific chat (property website or support viewing a property)
      const context = await buildLensyContext(propertyId, mode, effectiveUserId!);

      if (mode === "buyer_facing") {
        systemPrompt = buildBuyerFacingPrompt(context);
      } else {
        // tool_support with property context — hybrid prompt
        const generalCtx = await buildGeneralLensyContext(mode, effectiveUserId!);
        systemPrompt = buildToolSupportPrompt(generalCtx.user_info);
        systemPrompt += `\n\nCURRENTLY VIEWING PROPERTY:\n${buildBuyerFacingPrompt(context).split("YOUR ROLE:")[0]}`;
      }
    } else if (mode === "buyer_facing" && agentUserId) {
      // Agent website — no specific property, trained on ALL listings
      systemPrompt = await buildAgentPersonaContext(agentUserId);
    } else if (mode === "tool_support") {
      const generalCtx = await buildGeneralLensyContext(mode, effectiveUserId!);
      systemPrompt = buildToolSupportPrompt(generalCtx.user_info);
    } else {
      // Sales mode (P2V public pages)
      systemPrompt = buildSalesPrompt();
    }

    // ── Build messages array for Claude ─────────────────────
    const messages = [];

    // Add conversation history (max last 20 messages to stay within context)
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Add the new message
    messages.push({ role: "user", content: message });

    // ── Call Claude API with streaming ──────────────────────
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: mode === "portal" || mode === "agent_site" ? 500 : 1024,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Claude API error:", errorText);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 500 }
      );
    }

    // ── Stream the response back ────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let fullResponse = "";
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const event = JSON.parse(data);

                if (event.type === "content_block_delta" && event.delta?.text) {
                  fullResponse += event.delta.text;
                  // Forward the text chunk to the client
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
                  );
                }

                if (event.type === "message_stop") {
                  // Save conversation after completion
                  saveConversation({
                    conversationId,
                    propertyId,
                    agentUserId: effectiveUserId,
                    visitorSession,
                    message,
                    response: fullResponse,
                    history: recentHistory,
                    source: mode === "portal"
                      ? "portal"
                      : mode === "agent_site"
                      ? "agent_website"
                      : mode === "buyer_facing"
                      ? (propertyId ? "property_website" : "agent_website")
                      : "dashboard",
                    mode,
                  }).catch((err) => console.error("Failed to save conversation:", err));
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Lensy API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// Save conversation to lensy_conversations table
// Runs async after response is streamed (non-blocking)
// ============================================================

async function saveConversation({
  conversationId,
  propertyId,
  agentUserId,
  visitorSession,
  message,
  response,
  history,
  source,
  mode,
}: {
  conversationId: string | null;
  propertyId: string | null;
  agentUserId: string | null;
  visitorSession: string | null;
  message: string;
  response: string;
  history: any[];
  source: string;
  mode: string;
}) {
  const supabase = createAdminClient();

  // Build the full message array
  const allMessages = [
    ...history,
    { role: "user", content: message, timestamp: new Date().toISOString() },
    { role: "assistant", content: response, timestamp: new Date().toISOString() },
  ];

  if (conversationId) {
    // Update existing conversation
    await supabase
      .from("lensy_conversations")
      .update({
        messages: allMessages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  } else {
    // Create new conversation
    const { data } = await supabase
      .from("lensy_conversations")
      .insert({
        property_id: propertyId || null,
        agent_user_id: agentUserId,
        visitor_session: visitorSession || crypto.randomUUID(),
        messages: allMessages,
        source,
        mode,
      })
      .select("id")
      .single();

    return data?.id;
  }
}

// ============================================================
// GET /api/lensy
// Fetch conversation history (for agent dashboard analytics)
// ============================================================

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const limit = parseInt(searchParams.get("limit") || "20");

  let query = supabase
    .from("lensy_conversations")
    .select("*")
    .eq("agent_user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data });
}
