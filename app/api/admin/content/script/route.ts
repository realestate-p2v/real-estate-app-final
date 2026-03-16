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
- Create 8-10 segments. Each is 3-4 seconds of video. Fast pace. Keep it tight — every segment must earn its place.
- Segment 1: direct hook to realtors — "Hey realtors!" + provocative question. Under 10 words.
- Segment 2: immediately deliver on the hook with a bold statement.
- Last segment CTA: narration must be ONLY "Like, follow, and subscribe to Real Estate Photo 2 Video for more do-it-yourself real estate photo tips" — this drives engagement and algorithm reach.

NARRATION:
- 1 SHORT sentence per segment, max 12 words. Punchy, conversational.
- No filler words. No "um," "so," "well."
- Write the full script as a naturally flowing conversation. Each segment should connect to the next — not feel like separate disconnected sentences. Think of it as one smooth monologue broken into visual beats.

═══ SCENE DESCRIPTION RULES (MOST IMPORTANT) ═══

The image_prompt is a SCENE DESCRIPTION that will be fed to an AI image generator (Minimax image-01) to create a photorealistic first-frame image, which then gets animated with camera motion. The quality of this description DIRECTLY determines video quality.

RULE 1 — EVERY image_prompt MUST be completely unique. NEVER repeat the same room, scene, or concept. If you have 10 segments, you need 10 DIFFERENT visual subjects.

RULE 2 — Describe a STATIC SCENE, not an action. The AI generates a photograph, not a movie. Describe what the camera SEES — furniture, materials, lighting, colors, architecture. Do NOT describe people moving, doors opening, or actions happening.
GOOD: "Bright modern kitchen with white marble countertops, stainless steel appliances, warm sunlight through large windows, fresh flowers on island"
GOOD: "Dark cramped bedroom with harsh overhead fluorescent light, cluttered surfaces, unmade bed, yellowed walls"
BAD: "A realtor walking through a kitchen" (AI can't animate actions well)
BAD: "Someone opening the front door" (describes motion, not a scene)
BAD: "kitchen" (too vague — no details for the AI to work with)

RULE 3 — Segment 1 should show a professional realtor standing confidently inside a luxury home, looking directly at camera. Describe the person AND the room: "Professional female realtor in navy blazer standing in bright modern living room with floor-to-ceiling windows, hardwood floors, neutral furniture, warm natural light"

RULE 4 — Keep descriptions 15-30 words. Include: the room/space type, 2-3 specific materials or objects, the lighting quality, and the overall mood.

RULE 5 — For EVERY scene, specify the lighting:
- Good scenes: "warm natural sunlight," "bright window light," "golden hour glow," "soft diffused daylight"
- Bad scenes: "harsh overhead fluorescent," "dim single bulb," "flat unflattering light," "dark shadows"

RULE 6 — NEVER describe text, logos, graphics, UI elements, or split screens. These are photorealistic scenes only — rooms, spaces, properties, and occasionally a person in a room.

RULE 7 — Avoid describing things the AI struggles with: hands holding objects, screens showing content, multiple people interacting, text on surfaces, mirrors, or reflections.

═══ COMPARISON SHOTS (CRITICAL) ═══

When the script has "before/after" or "bad vs good" comparisons (e.g., "this dark photo" then "now look at this bright photo"), you MUST use comparison groups so both shots show THE SAME ROOM.

How it works:
- Give both segments the same "comparison_group" number (1, 2, 3, etc.)
- Mark one as "comparison_role": "good" and the other as "comparison_role": "bad"
- The "good" segment's image_prompt describes the room looking BRIGHT, WARM, PROFESSIONAL
- The "bad" segment does NOT need its own image_prompt — the pipeline will automatically take the "good" clip and apply filters to make it look dark, desaturated, and amateur

This ensures both shots show the EXACT same room — the "bad" version is just the "good" version degraded with video filters.

Example:
Segment 3: {"comparison_group": 1, "comparison_role": "bad", "narration": "This is what your listing looks like now"}
Segment 4: {"comparison_group": 1, "comparison_role": "good", "narration": "This is what it could look like", "image_prompt": "Bright spacious master bedroom with king bed, white linens, warm natural light streaming through sheer curtains, hardwood floors, neutral decor"}

You can have multiple comparison groups in one script (group 1, group 2, etc.). Segments WITHOUT comparisons should NOT have comparison_group or comparison_role fields.

═══ CAMERA DIRECTIONS ═══
Vary these — don't repeat same direction more than twice:
- "push_in" — best for hero shots, dramatic reveals, kitchens and living rooms
- "pull_back" — great for wide reveals, showing full room scope
- "orbit_left" / "orbit_right" — works well for furniture, fixtures, focal points
- "tilt_up" — ideal for tall ceilings, chandeliers, two-story spaces
- "rise" — aerial/elevated perspective, great for exteriors and pools
- "pan_left" / "pan_right" — landscape views, panoramic rooms

Prefer "push_in" and "orbit" for interiors. Use "rise" and "pull_back" sparingly (1-2 times max).

═══ OUTPUT FORMAT ═══

Return a JSON array. Each object:
- "segment": number (1, 2, 3...)
- "narration": voiceover text (max 12 words)
- "image_prompt": detailed scene description for AI image generation (15-30 words, unique per segment, describes a STATIC SCENE not an action). OMIT for "bad" comparison segments.
- "camera_direction": one of the directions above
- "comparison_group": (optional) integer grouping paired comparison segments together
- "comparison_role": (optional) "good" or "bad" — only used with comparison_group

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
