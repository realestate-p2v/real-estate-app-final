import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

const SELLER_SYSTEM_PROMPT = `You are a real estate market expert writing a professional seller's guide. The report will be delivered as a branded PDF from the listing agent to their seller client.

Write in a warm, professional, encouraging tone. The seller should feel confident and well-prepared after reading this.

Generate the following sections. Each section should be 150-300 words. Use natural paragraphs, not bullet lists. Write as if you are the agent's team — say "we" and "our team."

SECTIONS TO GENERATE (in this order, each as a separate clearly labeled section):

1. MARKET SNAPSHOT
Current real estate market conditions in the property's area. Include context about whether it's a buyer's or seller's market. Mention typical days on market and price trends. Be realistic but optimistic — focus on opportunities. If you don't have exact data, speak in general terms about the market type (suburban, urban, etc.) and current national/regional trends.

2. PRE-LISTING PREPARATION
Room-by-room guide for getting the home ready for listing photos and showings. Cover: decluttering, deep cleaning, minor repairs, curb appeal, staging tips, lighting, depersonalizing. Be specific to the property type and condition noted. Include a priority checklist at the end.

3. PHOTO DAY GUIDE
What the seller should do before the photographer arrives. Cover: final cleaning touches, hide personal items and pets, open blinds/curtains, turn on all lights, remove cars from driveway, mow lawn (if applicable), stage key rooms. Time of day recommendations. What to expect during the shoot.

4. PRICING STRATEGY
How the asking price should be determined. Discuss comp analysis, pricing psychology (pricing just below round numbers), the danger of overpricing, and how the first 2 weeks on market are critical. If an asking price was provided, frame the strategy around it. Be tactful — don't say "your price is wrong," say "here's how we position for maximum interest."

5. YOUR MARKETING PLAN
What the agent and their tools will do to market this listing. Include: professional photography, cinematic walkthrough video, virtual staging, property website with lead capture, social media marketing, MLS syndication, email campaigns, open house strategy. This section naturally showcases the agent's full marketing toolkit.

6. TIMELINE TO CLOSE
Week-by-week overview from listing to closing. Cover: pre-listing prep (week 1-2), active marketing (week 2-4), showings and offers (week 3-6), under contract (week 6-10), closing (week 10-12). Adjust based on the seller's stated timeline. Mention typical contingencies and what to expect at each stage.

Do NOT include a cover page or agent contact section — those are handled separately.
Do NOT use markdown formatting. Write in plain text with clear section headers.
Each section header should be on its own line, in ALL CAPS, like: MARKET SNAPSHOT`;

const BUYER_SYSTEM_PROMPT = `You are a real estate market expert writing a professional buyer's guide. The report will be delivered as a branded PDF from the buyer's agent to their client.

Write in a warm, encouraging, confident tone. The buyer should feel excited and informed after reading this. Pros should always outweigh cons. Frame everything positively — even challenges should be presented as opportunities.

Generate the following sections. Each section should be 150-300 words. Use natural paragraphs, not bullet lists. Write as if you are the agent's team — say "we" and "our team."

SECTIONS TO GENERATE (in this order, each as a separate clearly labeled section):

1. AREA SPOTLIGHT
Highlight the best features of the desired area/neighborhood. Cover: lifestyle, dining, entertainment, parks, schools (if relevant to buyer type), transit/commute, safety, community vibe. Paint a picture of what living there feels like. Be enthusiastic but authentic.

2. MARKET CONDITIONS
Current market conditions in the target area. Is it a buyer's or seller's market? Average days on market, price trends, inventory levels. Frame positively — in a seller's market: "acting now locks in value before further appreciation." In a buyer's market: "you have leverage to negotiate." Include context about mortgage rates if relevant.

3. WHAT YOUR BUDGET GETS YOU
Based on the buyer's budget range, describe what types of properties are typically available. Beds, baths, sqft, common features at their price point. Mention what a stretch of 5-10% more could unlock. Be specific to the area they want.

4. HIDDEN VALUE OPPORTUNITIES
Suggest adjacent neighborhoods or property types that offer better value. Mention up-and-coming areas, fixer-upper potential, or property types they may not have considered (townhouse vs single family, slightly farther from city center, etc.). Frame as exciting discoveries, not compromises.

5. THE BUYING PROCESS
Step-by-step from pre-approval to keys. Cover: mortgage pre-approval, house hunting, making an offer, negotiation, inspection, appraisal, final walkthrough, closing. Demystify for first-time buyers, refresh for experienced buyers. Mention the agent's role at each step.

6. FINANCIAL SNAPSHOT
Estimated monthly payment scenarios at their budget (use current approximate rates). Show 5%, 10%, and 20% down payment scenarios. Mention closing costs estimate (2-5% of purchase price). Property tax estimate. Insurance estimate. HOA if applicable. Present as a helpful planning tool, not financial advice.

7. WHY NOW IS THE RIGHT TIME
Gentle urgency — not pushy. Discuss: building equity vs renting, rate environment, appreciation potential, lifestyle benefits of homeownership, tax advantages. If the buyer said "just exploring," be softer. If they said "ASAP," reinforce their decision. Always end with "the best time to buy is when you're ready — and we're here to make it happen."

Do NOT include a cover page or agent contact section — those are handled separately.
Do NOT use markdown formatting. Write in plain text with clear section headers.
Each section header should be on its own line, in ALL CAPS, like: AREA SPOTLIGHT
Pros should ALWAYS outweigh cons. Never list more than 1-2 minor cons, and always follow with a positive reframe.`;

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscription check
    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
    if (!isAdmin) {
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber")
        .eq("user_id", user.id)
        .single();
      if (!usage?.is_subscriber) {
        return NextResponse.json({ error: "Subscription required" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { reportType, regenerateSection, ...formFields } = body;

    const isSeller = reportType === "Seller Guide";
    const systemPrompt = isSeller ? SELLER_SYSTEM_PROMPT : BUYER_SYSTEM_PROMPT;

    // Build user prompt
    let userPrompt = "";

    if (regenerateSection) {
      // Regenerate a single section
      userPrompt = `Regenerate ONLY the following section of the report. Do not include any other sections.

Section to regenerate: ${regenerateSection}

Report type: ${reportType}
Client name: ${formFields.clientName || ""}
`;
      // Add all form fields
      Object.entries(formFields).forEach(([key, value]) => {
        if (value && key !== "clientName" && key !== "agentName" && key !== "agentCompany") {
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
          userPrompt += `${label}: ${value}\n`;
        }
      });
      userPrompt += `\nAgent name: ${formFields.agentName || ""}
Agent company: ${formFields.agentCompany || ""}

Write ONLY the "${regenerateSection}" section. Start with the section header in ALL CAPS on its own line, then the content. 150-300 words.`;
    } else {
      // Full generation
      userPrompt = `Generate the report based on these details:\n\nReport type: ${reportType}\nClient name: ${formFields.clientName || ""}\n`;

      Object.entries(formFields).forEach(([key, value]) => {
        if (value && key !== "clientName" && key !== "agentName" && key !== "agentCompany") {
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
          userPrompt += `${label}: ${value}\n`;
        }
      });

      userPrompt += `\nAgent name: ${formFields.agentName || ""}
Agent company: ${formFields.agentCompany || ""}`;
    }

    // Call Claude API with streaming
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        stream: true,
      }),
    });

    if (!claudeRes.ok) {
      const errorText = await claudeRes.text();
      console.error("Claude API error:", errorText);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    // Stream the response through to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = claudeRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE events
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    controller.enqueue(encoder.encode(parsed.delta.text));
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Reports API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
