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
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: `You are an expert at creating viral real estate short-form video scripts AND an expert at searching stock photo sites like Pexels.

Write a script for a 30-45 second vertical video (9:16).

Title: "${title}"
Hook: "${hook}"
Description: "${description}"

The video is for Real Estate Photo 2 Video (realestatephoto2video.com) — turns listing photos into professional walkthrough videos for $79-$179.

═══ CRITICAL RULES ═══

SEGMENTS:
- Create 10-14 segments. Each is 3-4 seconds of video. Fast pace.
- Segment 1: direct hook to realtors — "Hey realtors!" + provocative question. Under 10 words.
- Segment 2: immediately deliver on the hook with a bold statement.
- Last segment CTA: narration must be ONLY "realestatephoto2video dot com" (short enough to not get cut off).

NARRATION:
- 1 SHORT sentence per segment, max 12 words. Punchy, conversational.
- No filler words. No "um," "so," "well."

TEXT OVERLAYS:
- 3-6 words max. Bold, impactful, readable at a glance.

═══ IMAGE PROMPT RULES (MOST IMPORTANT) ═══

You are searching Pexels.com — a stock photo site. Your image_prompt is a SEARCH QUERY, not a creative brief.

RULE 1 — EVERY image_prompt MUST be completely unique. NEVER repeat the same room, scene, or concept. If you have 12 segments, you need 12 DIFFERENT visual subjects. NOT five variations of "kitchen" or three variations of "living room."

Good variety example for a "listing mistakes" video:
- "smartphone blurry photo dark room"
- "bright modern kitchen marble countertop"  
- "luxury bathroom freestanding tub"
- "curb appeal front porch landscaping"
- "aerial view suburban neighborhood homes"
- "open floor plan living dining room"
- "real estate for sale sign front yard"
- "home office modern desk natural light"
- "backyard patio outdoor dining set"
- "master bedroom king bed neutral decor"
- "professional camera tripod living room"
- "happy couple new home keys" (with_people mode)

RULE 2 — Search queries must describe WHAT IS VISIBLE in the photo, not abstract concepts. Pexels finds photos by matching visual descriptions.
BAD: "distorted wide angle lens effect" (Pexels can't find this)
GOOD: "smartphone blurry dark room photo" (Pexels CAN find this)
BAD: "overpriced listing that won't sell" (abstract concept)
GOOD: "empty house for sale sign price reduced" (visual description)

RULE 3 — Keep queries 3-6 words. Simpler queries get better Pexels results.
BAD: "beautiful luxury modern open concept kitchen with granite countertops and stainless steel appliances"
GOOD: "luxury modern kitchen granite countertop"

RULE 4 — For "before/after" or "bad vs good" comparisons:
- Bad photo: "dark cluttered messy room," "smartphone blurry photo," "poorly lit bedroom"
- Good photo: "bright professional real estate photo," "luxury staged living room," "professional kitchen photography"

═══ PEOPLE IN IMAGES ═══

For each segment, set "people_mode" to one of:
- "no_people" — DEFAULT. Most segments should use this. Pexels will filter out photos with people.
- "with_people" — Use ONLY when showing happy clients, agents celebrating, or lifestyle scenes. When using this mode, you MUST also set "people_action" describing what the people should be doing naturally: "couple smiling walking through doorway," "woman pointing excitedly at house," "family laughing in backyard." This tells the video AI how to animate them naturally instead of freezing them.

Most segments (8-10 out of 12) should be "no_people." Only use "with_people" for 2-3 high-impact moments.

═══ CAMERA DIRECTIONS ═══
Vary these — don't repeat same direction more than twice:
"push_in", "pull_back", "orbit_left", "orbit_right", "tilt_up", "rise", "pan_left", "pan_right"

═══ OUTPUT FORMAT ═══

Return a JSON array. Each object:
- "segment": number (1, 2, 3...)
- "narration": voiceover text (max 12 words)
- "text_overlay": on-screen text (3-6 words)
- "image_prompt": Pexels search query (3-6 words, unique per segment, visually descriptive)
- "camera_direction": one of the directions above
- "people_mode": "no_people" or "with_people"
- "people_action": (only when people_mode is "with_people") natural action description for animation

Return ONLY the JSON array. No other text. No markdown backticks.`,
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
