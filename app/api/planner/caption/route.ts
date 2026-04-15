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

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();
    const {
      propertyId,
      propertyAddress,
      propertyDetails,
      platform = "instagram",
      contentType = "new_listing",
      freeform,
      message,
      agentName,
      noEmoji = false,
    } = body;

    if (freeform) {
      return handleFreeform(message || freeform, userId, agentName || "Agent", propertyAddress, supabase);
    }

    // Build property details string — prefer body.propertyDetails, fall back to DB lookup
    let propertyInfo = "";

    if (propertyDetails) {
      // Planner page sends property details directly
      propertyInfo = [
        propertyAddress && `Address: ${propertyAddress}`,
        propertyDetails.city && `City: ${propertyDetails.city}`,
        propertyDetails.state && `State: ${propertyDetails.state}`,
        propertyDetails.price && `Price: $${Number(propertyDetails.price).toLocaleString()}`,
        propertyDetails.bedrooms && `Bedrooms: ${propertyDetails.bedrooms}`,
        propertyDetails.bathrooms && `Bathrooms: ${propertyDetails.bathrooms}`,
        propertyDetails.sqft && `Square feet: ${Number(propertyDetails.sqft).toLocaleString()}`,
        propertyDetails.special_features?.length > 0 && `Special features: ${Array.isArray(propertyDetails.special_features) ? propertyDetails.special_features.join(", ") : propertyDetails.special_features}`,
      ].filter(Boolean).join("\n");
    } else if (propertyId) {
      // Legacy: look up from DB by propertyId
      const { data: p } = await supabase
        .from("agent_properties")
        .select("address, city, state, status, bedrooms, bathrooms, sqft, price, special_features")
        .eq("id", propertyId)
        .single();

      if (p) {
        propertyInfo = [
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
    } else if (propertyAddress) {
      // Minimal: just the address
      propertyInfo = `Address: ${propertyAddress}`;
    }

    // Fetch agent's writing voice from previous descriptions
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

    const finalAgentName = agentName || profile?.saved_agent_name || "the agent";
    const agentInfo = [
      `Agent: ${finalAgentName}`,
      profile?.saved_company && `Company: ${profile.saved_company}`,
      profile?.saved_location && `Market area: ${profile.saved_location}`,
    ].filter(Boolean).join("\n");

    const platformTone = PLATFORM_TONES[platform] || PLATFORM_TONES.instagram;
    const emojiRule = noEmoji
      ? "\n- ABSOLUTELY NO EMOJI. Not a single one."
      : "\n- Emoji sparingly — 1-2 max, only if natural for the platform.";

    const systemPrompt = `You are a real estate social media copywriter. Write a single ${platform} post for a real estate agent.

Rules:
- Write ONLY the caption text. No explanations, no options, no preamble.
- ${platformTone}${emojiRule}
- Be specific to this property — reference the actual address, bedrooms, bathrooms, price, and features provided.
- Sound like a real agent, not a template. Be authentic and engaging.
- NEVER use [brackets] or placeholder text like [key feature] or [insert here].
- Use the agent's actual name, never say "the listing agent".
- Make each post feel unique — vary your opening hooks.
${voiceContext}`;

    const userPrompt = `Write a ${contentType.replace(/_/g, " ")} post for ${platform}.

${agentInfo}

Property details:
${propertyInfo || "No specific property — write a personal brand post about real estate expertise."}

Post type: ${contentType.replace(/_/g, " ")}

Remember: Use the ACTUAL property details above. Do not use placeholders.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("Missing ANTHROPIC_API_KEY");
      return NextResponse.json({ caption: generateFallbackCaption(contentType, propertyAddress, propertyDetails, finalAgentName), fallback: true });
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: platform === "blog" ? 800 : 300,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Claude API error:", response.status, errText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const caption = data.content?.[0]?.text || "";

      if (caption && !caption.includes("[key feature]") && !caption.includes("[insert")) {
        await supabase.from("marketing_actions").insert({
          user_id: userId,
          property_id: propertyId || null,
          action_type: "caption_generated",
          platform,
          content_type: contentType,
          metadata: { source: "planner_v3" },
        }).catch(() => {});

        return NextResponse.json({ caption });
      }

      throw new Error("Caption contained placeholders");
    } catch (apiError) {
      console.error("Claude API error, using fallback:", apiError);
      return NextResponse.json({
        caption: generateFallbackCaption(contentType, propertyAddress, propertyDetails, finalAgentName),
        fallback: true,
      });
    }
  } catch (error) {
    console.error("Caption route error:", error);
    return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 });
  }
}

// Generate a real caption with actual property data — no placeholders ever
function generateFallbackCaption(
  contentType: string,
  address?: string,
  details?: { bedrooms?: number; bathrooms?: number; sqft?: number; price?: number; city?: string; state?: string; special_features?: string[] },
  agentName?: string
): string {
  const addr = address || "this beautiful property";
  const city = details?.city || "";
  const price = details?.price ? `$${Number(details.price).toLocaleString()}` : "";
  const beds = details?.bedrooms || "";
  const baths = details?.bathrooms || "";
  const sqft = details?.sqft ? Number(details.sqft).toLocaleString() : "";
  const features = Array.isArray(details?.special_features) ? details.special_features.slice(0, 3).join(", ") : "";
  const firstName = (agentName || "").split(" ")[0] || "";
  const detailLine = [beds && `${beds} bed`, baths && `${baths} bath`, sqft && `${sqft} sq ft`].filter(Boolean).join(" · ");

  switch (contentType) {
    case "new_listing":
      return `✨ Just listed in ${city || "a great neighborhood"}!\n\n${addr}\n${detailLine}\n${price ? `Offered at ${price}` : ""}\n${features ? `\nHighlights: ${features}` : ""}\n\nThis home checks every box. Schedule your private tour today!\n\nDM ${firstName || "me"} for details 🔑\n\n#JustListed #RealEstate #${(city || "Home").replace(/\s/g, "")}`;
    case "just_sold":
      return `🎉 SOLD — ${addr}!\n\nCongratulations to my amazing clients on closing this ${beds ? beds + "-bedroom " : ""}home${city ? ` in ${city}` : ""}.\n\nAnother dream home, another happy family. This is why I love what I do.\n\nThinking of making a move? Let's talk! 📞\n\n#JustSold #ClosingDay #RealEstate`;
    case "price_reduced":
      return `⚡ Price improved — ${addr}\n\n${detailLine}\n${price ? `Now ${price}` : ""}\n${features ? `\n${features}` : ""}\n\nThis ${city || ""} gem just became an even better value. Don't wait!\n\nDM ${firstName || "me"} to schedule a tour\n\n#PriceReduced #RealEstate #Opportunity`;
    case "coming_soon":
      return `👀 Coming soon to ${city || "the market"}...\n\n${addr}\n${detailLine}\n${price ? `Expected at ${price}` : ""}\n\nGet on the early access list before this one goes public!\n\nDM ${firstName || "me"} for details 🔥\n\n#ComingSoon #ExclusiveListing #RealEstate`;
    default:
      return `🏡 ${addr}\n\n${detailLine}\n${price || ""}\n\nInterested? Reach out — I'd love to show you around!\n\n#RealEstate #NewListing`;
  }
}

async function handleFreeform(
  message: string,
  userId: string,
  agentName: string,
  propertyAddress: string | undefined,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const { data: profile } = await supabase
      .from("lens_usage")
      .select("saved_agent_name, saved_company, saved_location")
      .eq("user_id", userId)
      .single();

    const systemPrompt = `You are Lensy, the AI marketing assistant for a real estate agent named ${agentName}${profile?.saved_company ? ` at ${profile.saved_company}` : ""}${profile?.saved_location ? `, based in ${profile.saved_location}` : ""}.${propertyAddress ? ` The agent is currently working on a post for ${propertyAddress}.` : ""}

You help with:
- Writing social media captions for listings
- Suggesting marketing strategies and content ideas
- Adjusting post tone (luxury, casual, open house invite, etc.)
- Answering marketing questions

Be uplifting, practical, and specific. Sound like a helpful marketing colleague. Keep responses under 150 words unless asked for more.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        caption: "I can help with that! Try selecting a photo and generating a post, or tell me what style you'd like.",
        fallback: true,
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I can help with that! Select a photo and hit Generate, or tell me what kind of post you'd like.";

    return NextResponse.json({ caption: reply, response: reply });
  } catch {
    return NextResponse.json({
      caption: "I'm here to help! Try asking me to write a caption or suggest what to post this week.",
      response: "I'm here to help! Try asking me to write a caption or suggest what to post this week.",
      fallback: true,
    });
  }
}
