import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { title, hook, description } = await request.json();
    if (!title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: false, error: "Anthropic API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        messages: [
          {
            role: "user",
            content: `You are a viral real estate video scriptwriter specializing in fast-paced, scroll-stopping short-form content.

Write a script for a 30-45 second vertical video (9:16).

Title: "${title}"
Hook: "${hook}"
Description: "${description}"

The video is for Real Estate Photo 2 Video (realestatephoto2video.com), a service that turns listing photos into professional walkthrough videos for $79-$179.

CRITICAL RULES:
- Create 10-14 segments. Each segment is 3-4 seconds of video. Fast pace is essential.
- Segment 1 MUST be a direct hook addressing realtors. Example: "Hey realtors!" followed by a provocative question. Keep it under 10 words.
- Segment 2 should immediately deliver on the hook with a bold statement.
- NO PEOPLE in image prompts. Ever. Only show properties, rooms, exteriors, architecture, real estate signs, staging, decor, aerial views.
- Image prompts MUST be real estate photography. Always include "real estate photography" or "listing photo" in the prompt. Examples: "beautiful modern kitchen real estate photography", "luxury living room listing photo wide angle", "curb appeal front exterior real estate".
- DO NOT use abstract, metaphorical, or literal interpretations. If the script says "listing looks bad" do NOT show an ugly room — show a bad phone photo of a nice room vs a professional photo.
- Text overlays should be 3-6 words max. Bold, impactful, easy to read at a glance.
- Narration should be punchy and conversational. 1 short sentence per segment. No filler words.
- The last segment CTA must be SHORT: "realestatephoto2video.com" — that's it. Do not write a long URL or sentence that will get cut off.
- Camera directions should vary. Don't repeat the same direction more than twice.

Return a JSON array where each object has:
- "segment": segment number (1, 2, 3...)
- "narration": the voiceover text (1 SHORT sentence, max 12 words)
- "text_overlay": bold text on screen (3-6 words max)
- "image_prompt": Pexels search query for a real estate photo with NO people (include "real estate" in every prompt)
- "camera_direction": one of "push_in", "pull_back", "orbit_left", "orbit_right", "tilt_up", "rise", "pan_left", "pan_right"

Return ONLY the JSON array, no other text. No markdown backticks.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";

    let script;
    try {
      script = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      script = [];
    }

    return NextResponse.json({ success: true, script });
  } catch (error) {
    console.error("[Content Script] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
