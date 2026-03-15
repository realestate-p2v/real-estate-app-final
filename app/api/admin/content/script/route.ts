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
            content: `You are an expert at creating viral real estate short-form video scripts for AI-generated video content.

Write a script for a 30-45 second vertical video (9:16).

Title: "${title}"
Hook: "${hook}"
Description: "${description}"

The video is for Real Estate Photo 2 Video (realestatephoto2video.com) — a resource for DIY real estate photography tips and a service that turns listing photos into professional walkthrough videos.

═══ CRITICAL RULES ═══

SEGMENTS:
- Create 10-14 segments. Each is 3-4 seconds of video. Fast pace.
- Segment 1: direct hook to realtors — "Hey realtors!" + provocative question. Under 10 words.
- Segment 2: immediately deliver on the hook with a bold statement.
- Last segment CTA: narration must be ONLY "For more DIY real estate photo tips, visit realestatephoto2video dot com" — this drives traffic with value, not a sales pitch.

NARRATION:
- 1 SHORT sentence per segment, max 12 words. Punchy, conversational.
- No filler words. No "um," "so," "well."
- Write the full script as a naturally flowing conversation. Each segment should connect to the next — not feel like separate disconnected sentences. Think of it as one smooth monologue broken into visual beats.

═══ SCENE DESCRIPTION RULES (MOST IMPORTANT) ═══

The image_prompt is a SCENE DESCRIPTION for AI video generation (Minimax). The AI will generate a hyper-realistic image from this description, then animate it with camera motion. Write vivid, specific, visual descriptions.

RULE 1 — EVERY image_prompt MUST be completely unique. NEVER repeat the same room, scene, or concept. If you have 12 segments, you need 12 DIFFERENT visual subjects.

RULE 2 — Describe EXACTLY what should be visible in the scene. Be specific about lighting, materials, colors, and composition.
GOOD: "Bright modern kitchen with white marble countertops, stainless steel appliances, warm sunlight through large windows, fresh flowers on island"
GOOD: "Dark cramped bedroom with harsh overhead fluorescent light, cluttered surfaces, unmade bed, poor composition"
BAD: "kitchen" (too vague)
BAD: "nice room" (not descriptive enough)

RULE 3 — For "before/after" or "bad vs good" comparisons:
- Bad scenes: describe dark, cluttered, poorly lit, harsh shadows, messy, cramped
- Good scenes: describe bright, warm, naturally lit, staged, spacious, inviting, professional

RULE 4 — Segment 1 should show a professional realtor inside a luxury home, looking inquisitive or pondering while demonstrating the action described in the narration. For example, if the video is about phone photography, show a realtor holding up their smartphone in a beautiful room. If it is about staging, show a realtor examining furniture placement.

RULE 5 — Keep descriptions under 30 words. Focus on the most visually important elements.

═══ CAMERA DIRECTIONS ═══
Vary these — don't repeat same direction more than twice:
"push_in", "pull_back", "orbit_left", "orbit_right", "tilt_up", "rise", "pan_left", "pan_right"

═══ OUTPUT FORMAT ═══

Return a JSON array. Each object:
- "segment": number (1, 2, 3...)
- "narration": voiceover text (max 12 words)
- "image_prompt": detailed scene description for AI video generation (10-30 words, unique per segment, visually specific)
- "camera_direction": one of the directions above

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
