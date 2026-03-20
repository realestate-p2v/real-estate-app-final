import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(messages: any[], system?: string, maxTokens = 1024) {
  const body: any = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function analyzePhoto(photoUrl: string): Promise<string | null> {
  try {
    const result = await callClaude(
      [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: photoUrl,
              },
            },
            {
              type: "text",
              text: "You are a professional real estate photographer and listing agent. Describe this real estate photo in 2-3 sentences. Focus on: room type, notable features, condition, materials, finishes, lighting quality, and key selling points. If the photo is too dark, blurry, or unidentifiable as a real estate photo, respond with exactly: SKIP",
            },
          ],
        },
      ],
      undefined,
      300
    );
    if (result.trim().toUpperCase() === "SKIP") return null;
    return result.trim();
  } catch (err) {
    console.error("Photo analysis error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { photoUrls, propertyData, style, userId } = body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: "At least one photo URL is required" }, { status: 400 });
    }
    if (!propertyData) {
      return NextResponse.json({ error: "Property data is required" }, { status: 400 });
    }
    if (!style) {
      return NextResponse.json({ error: "Style is required" }, { status: 400 });
    }

    // Check free tier: if no userId, reject. If userId but no subscription, check usage count
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if non-subscriber has already used their free trial
    const { data: existingDescriptions, error: countError } = await supabaseAdmin
      .from("lens_descriptions")
      .select("id")
      .eq("user_id", userId);

    // TODO: Check actual subscription status once Stripe is wired
    // For now, allow 1 free use for non-subscribers
    const isSubscriber = false; // Replace with real check
    if (!isSubscriber && existingDescriptions && existingDescriptions.length >= 1) {
      return NextResponse.json(
        { error: "free_trial_used", message: "Subscribe to P2V Lens to generate more descriptions." },
        { status: 403 }
      );
    }

    // Step 1: Analyze each photo with Claude Vision (parallel, max 10)
    const photosToAnalyze = photoUrls.slice(0, 10);
    const analyses = await Promise.all(photosToAnalyze.map(analyzePhoto));

    // Filter out nulls (skipped photos)
    const validAnalyses = analyses.filter((a): a is string => a !== null);

    if (validAnalyses.length === 0) {
      return NextResponse.json(
        { error: "None of the uploaded photos could be analyzed. Please upload clear listing photos." },
        { status: 400 }
      );
    }

    // Step 2: Build the room descriptions
    const roomDescriptions = validAnalyses
      .map((analysis, i) => `Photo ${i + 1}: ${analysis}`)
      .join("\n");

    // Step 3: Generate the listing description
    const { beds, baths, sqft, lotSize, yearBuilt, price, neighborhood, specialFeatures, address } = propertyData;

    const styleGuide: Record<string, string> = {
      professional: "Write in a professional, polished tone suitable for MLS. Clear, factual, and appealing.",
      luxury: "Write in an elevated luxury tone. Emphasize premium finishes, exclusivity, and lifestyle. Use sophisticated vocabulary.",
      conversational: "Write in a warm, conversational tone as if a friendly agent is giving a tour. Approachable and engaging.",
      concise: "Write in a brief, punchy style. Short sentences. Key facts up front. No fluff. Perfect for social media or quick listings.",
    };

    const descriptionPrompt = `You are an expert real estate listing agent. Write a ${style} MLS listing description for this property.

Property Details:
- Address: ${address || "Not provided"}
- Bedrooms: ${beds || "N/A"}
- Bathrooms: ${baths || "N/A"}
- Square Feet: ${sqft || "N/A"}
- Lot Size: ${lotSize || "N/A"}
- Year Built: ${yearBuilt || "N/A"}
- Price: ${price || "N/A"}
- Neighborhood: ${neighborhood || "N/A"}
- Special Features: ${specialFeatures || "None specified"}

Room-by-Room Photo Analysis:
${roomDescriptions}

Style Guide: ${styleGuide[style] || styleGuide.professional}

Requirements:
- 150-250 words
- Highlight the strongest selling points from the photos
- Mention specific materials, finishes, and features you can see in the photos
- Do NOT fabricate features that aren't visible in the photos or listed in the property data
- Include a compelling opening line
- End with a call to action`;

    const description = await callClaude(
      [{ role: "user", content: descriptionPrompt }],
      "You are a top-producing real estate listing agent known for writing compelling property descriptions that sell homes fast.",
      600
    );

    // Step 4: Save to Supabase
    const { data: saved, error: saveError } = await supabaseAdmin
      .from("lens_descriptions")
      .insert({
        user_id: userId,
        property_data: propertyData,
        photo_analyses: validAnalyses,
        style,
        description: description.trim(),
        status: "complete",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      // Still return the description even if save fails
    }

    return NextResponse.json({
      success: true,
      description: description.trim(),
      photoAnalyses: validAnalyses,
      photosAnalyzed: validAnalyses.length,
      photosSkipped: photosToAnalyze.length - validAnalyses.length,
      id: saved?.id || null,
    });
  } catch (err: any) {
    console.error("Description API error:", err);
    return NextResponse.json(
      { error: "Failed to generate description. Please try again." },
      { status: 500 }
    );
  }
}
