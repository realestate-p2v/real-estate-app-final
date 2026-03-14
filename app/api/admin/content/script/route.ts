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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a viral real estate video scriptwriter. Write a script for a 30-60 second vertical video (9:16).

Title: "${title}"
Hook: "${hook}"
Description: "${description}"

The video is for Real Estate Photo 2 Video (realestatephoto2video.com), a service that turns listing photos into professional walkthrough videos for $79-$179.

Create 6-10 segments. Each segment is ~5 seconds of video.

Return a JSON array where each object has:
- "segment": segment number (1, 2, 3...)
- "narration": the voiceover text for this segment (1-2 sentences, conversational)
- "text_overlay": bold text shown on screen (5-8 words max, impactful)
- "image_prompt": description of the stock image/video to show (specific, searchable on Pexels — e.g. "modern kitchen with granite countertops", "real estate agent showing home to couple", "aerial view of suburban neighborhood")
- "camera_direction": suggested Minimax camera movement ("push_in", "pull_back", "orbit_left", "orbit_right", "tilt_up", "rise")

Segment 1 MUST use the hook as narration. Last segment should be a CTA mentioning realestatephoto2video.com.

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
