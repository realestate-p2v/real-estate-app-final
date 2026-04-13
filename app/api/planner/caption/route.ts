// app/api/planner/caption/route.ts
// Enhanced caption generation with property-specific data and voice matching

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLATFORM_TONES: Record<string, string> = {
  instagram: "Casual, visual-first. Use line breaks for readability. 3-5 relevant hashtags at the end. Emoji sparingly — 1-2 max. Keep under 150 words.",
  facebook: "Conversational and warm. Slightly longer than Instagram. Include a clear call-to-action (schedule a showing, share with friends). No hashtags. 100-200 words.",
  linkedin: "Professional and authoritative. Position the agent as a market expert. Data-driven when possible. No emoji. No hashtags. 150-250 words.",
  blog: "Long-form, informative. 300-500 words. Include subheadings. SEO-friendly. Educational tone with local market expertise.",
};

const FALLBACK_TEMPLATES: Record<string, Record<string, string>> = {
  instagram: {
    new_listing: "✨ Just listed! This beautiful home features [key feature]. Don't miss your chance to see it.\n\nDM me for details or to schedule a private showing.\n\n#JustListed #RealEstate #DreamHome",
    just_sold: "🎉 SOLD! So happy for my clients who just closed on this beautiful home. Wishing them years of wonderful memories.\n\nThinking of buying or selling? Let's chat.\n\n#JustSold #RealEstate #Closing",
    price_reduced: "📉 Price improvement! This stunning home just got even more attractive. Now is the time to take a look.\n\nReach out for a private showing.\n\n#PriceReduced #RealEstate #Opportunity",
    default: "New on my feed today! Excited to share this with you. Questions? DM me anytime.\n\n#RealEstate #Homes",
  },
  facebook: {
    new_listing: "Excited to introduce my newest listing! This home has so much to offer — reach out if you'd like to learn more or schedule a showing. I'd love to show you around!",
    just_sold: "Another one closed! Congratulations to my wonderful clients on their new home. It was a pleasure working with you through the entire process. If you're thinking about making a move, I'd love to help you too!",
    default: "Have a real estate question? I'm always here to help. Don't hesitate to reach out!",
  },
  linkedin: {
    market_update: "The local real estate market continues to evolve. Here are some key trends I'm seeing in my day-to-day work with buyers and sellers. If you have questions about how these trends affect your plans, feel free to connect.",
    just_sold: "Pleased to announce another successful closing. This transaction reinforced the importance of proper preparation and market knowledge. If you're considering a real estate move, I'd welcome the opportunity to discuss your goals.",
    default: "Real estate is more than transactions — it's about helping people find their next chapter. Happy to connect with anyone who has questions about the market.",
  },
  blog: {
    default: "Welcome to my latest market update. In this post, I'll share insights from my recent experience helping buyers and sellers navigate today's real estate landscape.",
  },
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();
    const {
      propertyId,
      platform = "instagram",
      contentType = "new_listing",
      freeform,
      agentName,
      noEmoji = false,
    } = body;

    if (freeform) {
      return handleFreeform(freeform, userId, agentName || "Agent", supabase);
    }

    let propertyDetails = "";
    if (propertyId) {
      const { data: p } = await supabase
        .from("agent_properties")
        // FIXED: bedrooms/bathrooms not beds/baths (confirmed from schema)
        .select("address, city, state, status, bedrooms, bathrooms, sqft, price, special_features, optimized_photos")
        .eq("id", propertyId)
        .single();

      if (p) {
        propertyDetails = [
          p.address && `Address: ${p.address}`,
          p.city && p.state && `Location: ${p.city}, ${p.state}`,
          p.price && `Price: $${Number(p.price).toLocaleString()}`,
          p.bedrooms && `Bedrooms: ${p.bedrooms}`,
          p.bathrooms && `Bathrooms: ${p.bathrooms}`,
          p.sqft && `Square feet: ${Number(p.sqft).toLocaleString()}`,
          p.special_features && `Special features: ${p.special_features}`,
          p.status && `Status: ${p.status}`,
        ].filter(Boolean).join("\n");
      }
    }

    // Fetch agent's writing voice from previous descriptions
    // FIXED: description not content
    let voiceContext = "";
    const { data: descriptions } = await supabase
      .from("lens_descriptions")
      .select("description")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (descriptions && descriptions.length > 0) {
      const samples = descriptions.map((d: { description: string }) => d.description.slice(0, 200)).join("\n---\n");
      voiceContext = `\nThe agent's writing style (match this voice):\n${samples}`;
    }

    const { data: profile } = await supabase
      .from("lens_usage")
      .select("saved_agent_name, saved_company, saved_location")
      .eq("user_id", userId)
      .single();

    const agentInfo = [
      profile?.saved_agent_name && `Agent: ${profile.saved_agent_name}`,
      profile?.saved_company && `Company: ${profile.saved_company}`,
      profile?.saved_location && `Market area: ${profile.saved_location}`,
    ].filter(Boolean).join("\n");

    const platformTone = PLATFORM_TONES[platform] || PLATFORM_TONES.instagram;
    const emojiRule = noEmoji
      ? "\n- ABSOLUTELY NO EMOJI. Not a single one. Many brokerages prohibit emoji in marketing materials. Use words only."
      : "\n- Emoji sparingly — 1-2 max, only if natural for the platform.";

    const systemPrompt = `You are a real estate social media copywriter. Write a single ${platform} post for a real estate agent.

Rules:
- Write ONLY the caption text. No explanations, no options, no preamble.
- ${platformTone}${emojiRule}
- Be specific to this property — reference actual features, not generic placeholders.
- Sound like a real agent, not a template.
- Never use [brackets] or placeholder text.
${voiceContext}`;

    const userPrompt = `Write a ${contentType.replace(/_/g, " ")} post for ${platform}.

${agentInfo}
${propertyDetails ? `\nProperty details:\n${propertyDetails}` : "\nThis is a personal/brand post — not about a specific listing."}

Post type: ${contentType.replace(/_/g, " ")}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: platform === "blog" ? 800 : 300,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

      const data = await response.json();
      const caption = data.content?.[0]?.text || "";

      if (caption) {
        await supabase.from("marketing_actions").insert({
          user_id: userId,
          property_id: propertyId || null,
          action_type: "caption_generated",
          platform,
          content_type: contentType,
          metadata: { source: "planner_v2" },
        });
        return NextResponse.json({ caption });
      }

      throw new Error("Empty response from Claude");
    } catch (apiError) {
      console.error("Claude API error, using fallback:", apiError);
      const platformTemplates = FALLBACK_TEMPLATES[platform] || FALLBACK_TEMPLATES.instagram;
      const template = platformTemplates[contentType] || platformTemplates.default || "Check out this listing!";
      return NextResponse.json({ caption: template, fallback: true });
    }
  } catch (error) {
    console.error("Caption route error:", error);
    return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 });
  }
}

async function handleFreeform(
  message: string,
  userId: string,
  agentName: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const { data: profile } = await supabase
      .from("lens_usage")
      .select("saved_agent_name, saved_company, saved_location")
      .eq("user_id", userId)
      .single();

    const systemPrompt = `You are Lensy, the AI marketing assistant for a real estate agent named ${agentName}${profile?.saved_company ? ` at ${profile.saved_company}` : ""}${profile?.saved_location ? `, based in ${profile.saved_location}` : ""}. You help with:
- Writing social media captions for listings
- Suggesting marketing strategies
- Creating content ideas
- Answering marketing questions

Be concise, practical, and specific. Sound like a helpful marketing colleague, not a generic AI. Keep responses under 150 words unless the agent asks for something longer.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const caption = data.content?.[0]?.text || "I'm here to help with your marketing. Try asking me to write a caption or suggest what to post this week!";

    return NextResponse.json({ caption, response: caption });
  } catch {
    return NextResponse.json({
      caption: "I'm having a moment — try asking me again! I can help with captions, posting strategies, and marketing ideas.",
      response: "I'm having a moment — try asking me again!",
      fallback: true,
    });
  }
}
