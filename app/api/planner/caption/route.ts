import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/client";

const anthropic = new Anthropic();

const platformTones: Record<string, string> = {
  instagram:
    "Visual, emoji-friendly, hashtag-heavy. 2-3 sentences max + 5-8 relevant hashtags. Engaging, lifestyle-focused. Use line breaks between sentences.",
  facebook:
    "Conversational, slightly longer. 3-4 sentences. Community-focused, shareable. Ask a question or invite engagement at the end.",
  linkedin:
    "Professional, market-savvy. 2-3 sentences. Business-oriented, no emojis. Include an industry insight or data point.",
  twitter:
    "Punchy, under 280 chars total. One strong hook. No hashtags unless they fit naturally.",
  blog:
    "Informative blog post, 200-300 words. Include a headline, 3-4 paragraphs, and a call-to-action. Market-focused, helpful tone.",
};

const contentTypePrompts: Record<string, string> = {
  new_listing:
    "Announce this new listing. Highlight the top 2-3 features that make it special.",
  just_sold:
    "Celebrate this sale. Express gratitude. Show success without being boastful.",
  open_house:
    "Invite people to the open house. Create urgency and excitement.",
  price_reduced:
    "Announce the price reduction. Emphasize value and opportunity.",
  staging_reveal:
    "Show the before/after staging transformation. Emphasize the visual impact.",
  video_share:
    "Promote the listing video. Tease what viewers will see inside.",
  neighborhood:
    "Talk about the neighborhood and lifestyle. Why people love living here.",
  market_update:
    "Share a market insight relevant to the local area. Be data-informed and helpful.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyAddress,
      agentName,
      platform = "instagram",
      contentType = "new_listing",
      userId,
    } = body;

    if (!propertyAddress || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Pull agent's past descriptions for voice matching
    const supabase = createClient();
    const { data: pastDescriptions } = await supabase
      .from("lens_descriptions")
      .select("content, style")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    const voiceContext =
      pastDescriptions?.length
        ? `\n\nAGENT'S WRITING STYLE (match this tone and voice):\n${pastDescriptions
            .map((d) => d.content)
            .join("\n---\n")}`
        : "";

    const platformTone = platformTones[platform] || platformTones.instagram;
    const contentPrompt =
      contentTypePrompts[contentType] || contentTypePrompts.new_listing;

    const systemPrompt = `You are a real estate marketing copywriter. Write social media captions for real estate agents.

Rules:
- Write ONLY the caption text. No explanations, no labels, no quotes around it.
- Use the agent's actual name, never say "the listing agent" or "your agent".
- Be authentic — avoid cliché real estate phrases like "don't miss out" or "won't last long".
- Match the platform tone exactly.
- Never include placeholder text like [insert X here].${voiceContext}`;

    const userPrompt = `Write a ${platform} caption for agent ${agentName || "the agent"}.

Property: ${propertyAddress}
Content type: ${contentType}
${contentPrompt}

Platform tone: ${platformTone}

Write the caption now:`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: platform === "blog" ? 800 : 400,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const caption =
      response.content[0]?.type === "text"
        ? response.content[0].text.trim()
        : "";

    return NextResponse.json({ caption, platform, contentType });
  } catch (error: any) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    );
  }
}
