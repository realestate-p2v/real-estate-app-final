import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildLensyContext,
  buildGeneralLensyContext,
  buildBuyerFacingPrompt,
  buildToolSupportPrompt,
  buildSalesPrompt,
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
      agentUserId = null, // Required for buyer_facing mode (public visitors)
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // ── Determine auth context ──────────────────────────────
    // For tool_support and sales: user must be authenticated
    // For buyer_facing: no auth required (public visitors), but agentUserId must be provided
    let userId: string | null = null;

    if (mode === "buyer_facing") {
      if (!agentUserId) {
        return NextResponse.json({ error: "agentUserId is required for buyer_facing mode" }, { status: 400 });
      }
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    }

    const effectiveUserId = mode === "buyer_facing" ? agentUserId : userId;

    // ── Build system prompt based on mode ───────────────────
    let systemPrompt = "";

    if (propertyId && (mode === "buyer_facing" || mode === "tool_support")) {
      // Property-specific chat
      const context = await buildLensyContext(propertyId, mode, effectiveUserId!);

      if (mode === "buyer_facing") {
        systemPrompt = buildBuyerFacingPrompt(context);
      } else {
        // tool_support with property context — hybrid prompt
        const generalCtx = await buildGeneralLensyContext(mode, effectiveUserId!);
        systemPrompt = buildToolSupportPrompt(generalCtx.user_info);
        systemPrompt += `\n\nCURRENTLY VIEWING PROPERTY:\n${buildBuyerFacingPrompt(context).split("YOUR ROLE:")[0]}`;
      }
    } else if (mode === "tool_support") {
      const generalCtx = await buildGeneralLensyContext(mode, effectiveUserId!);
      systemPrompt = buildToolSupportPrompt(generalCtx.user_info);
    } else {
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
        max_tokens: 1024,
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
                    source: mode === "buyer_facing"
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

    // Return the conversation ID — the client should store this
    // for subsequent messages in the same chat session
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
