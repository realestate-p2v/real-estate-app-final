import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { topic } = await request.json();
    if (!topic) return NextResponse.json({ success: false, error: "Topic required" }, { status: 400 });

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
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You are a viral real estate content strategist. Generate exactly 5 short-form video ideas (30-60 seconds, vertical 9:16) about the topic: "${topic}"

These videos are for Real Estate Photo 2 Video, a service that turns listing photos into professional walkthrough videos for $79-$179.

Target audience: real estate agents who want to market listings better.

For each idea, return a JSON array with exactly 5 objects. Each object has:
- "title": catchy video title (max 60 chars)
- "hook": the opening line that stops the scroll (max 80 chars)  
- "description": brief description of what the video shows (1-2 sentences)

Return ONLY the JSON array, no other text. No markdown backticks.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";

    let ideas;
    try {
      ideas = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      ideas = [];
    }

    return NextResponse.json({ success: true, ideas });
  } catch (error) {
    console.error("[Content Ideas] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
