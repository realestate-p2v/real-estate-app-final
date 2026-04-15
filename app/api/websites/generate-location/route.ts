// app/api/websites/generate-location/route.ts
// Generates SEO-optimized location page content using Claude API
// Called from the editor when an agent enters a location name

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location_name, region, country, agent_name, company, handle, user_id } = body;

    if (!location_name || !user_id || !handle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate slug
    const location_slug = location_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Call Claude API to generate content
    const prompt = `You are writing an SEO-optimized location page for a real estate agent's website. The agent helps people buy and sell property in this area.

Location: ${location_name}
Region: ${region || ""}
Country: ${country || "Costa Rica"}
Agent: ${agent_name || ""}
Company: ${company || ""}

Write a comprehensive, engaging location page. Respond ONLY with a JSON object (no markdown, no backticks) with these exact fields:

{
  "page_title": "SEO title tag, 50-60 chars, include location + real estate keywords",
  "meta_description": "Meta description, 150-160 chars, compelling with location + real estate keywords",
  "hero_heading": "H1 heading for the page, engaging and location-specific",
  "intro_text": "Opening paragraph (2-3 sentences) that hooks visitors and mentions the location's appeal for real estate buyers",
  "body_content": "Full location writeup in markdown format. Include sections with ## headings covering: Overview & Lifestyle, Real Estate Market, Neighborhoods & Areas, Amenities & Infrastructure, Things to Do, Climate & Environment, Investment Potential. Write 800-1200 words total. Be specific, informative, and genuinely useful. Include real estate-relevant details like property types, price ranges if known, proximity to amenities.",
  "highlights": ["5-7 key selling points about this location for property buyers, each 1 short sentence"],
  "keywords": ["10-15 SEO keywords relevant to this location + real estate, e.g. 'playa hermosa real estate', 'homes for sale playa hermosa', 'playa hermosa costa rica property'"],
  "photo_suggestions": ["5-6 descriptions of ideal photos for this page, written as detailed alt text, e.g. 'Aerial view of Playa Hermosa beach with turquoise water and green hillsides'"]
}`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text();
      console.error("Claude API error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content
      .map((item: any) => item.type === "text" ? item.text : "")
      .join("");

    // Parse the JSON response
    let content;
    try {
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      content = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Claude response:", responseText.substring(0, 500));
      return NextResponse.json({ error: "Failed to parse generated content" }, { status: 500 });
    }

    // Get the website ID
    const { data: siteRows } = await supabase
      .from("agent_websites")
      .select("id")
      .eq("handle", handle)
      .limit(1);

    const website_id = siteRows?.[0]?.id || null;

    // Save to database
    const { data: page, error: saveErr } = await supabase
      .from("agent_location_pages")
      .upsert({
        user_id,
        website_id,
        handle,
        location_name,
        location_slug,
        region: region || null,
        country: country || "Costa Rica",
        page_title: content.page_title,
        meta_description: content.meta_description,
        hero_heading: content.hero_heading,
        intro_text: content.intro_text,
        body_content: content.body_content,
        highlights: content.highlights || [],
        keywords: content.keywords || [],
        photos: (content.photo_suggestions || []).map((alt: string) => ({
          url: null,
          alt,
          caption: alt,
        })),
        published: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "handle,location_slug",
      })
      .select()
      .limit(1);

    if (saveErr) {
      console.error("Save error:", saveErr.message);
      return NextResponse.json({ error: "Failed to save location page" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      page: page?.[0] || null,
      content,
    });

  } catch (err: any) {
    console.error("Generate location error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
