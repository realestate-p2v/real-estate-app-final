import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { title, hook, narrations } = await request.json();
    if (!title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: false, error: "Anthropic API key not configured" }, { status: 500 });
    }

    const scriptContext = narrations && narrations.length > 0
      ? `\nThe video script says: "${narrations.join(' ')}"`
      : "";

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
            content: `You are a viral social media copywriter for real estate content. Write 3 different social media post captions for this video:

Title: "${title}"
Hook: "${hook}"${scriptContext}

The video is from Real Estate Photo 2 Video (@realestatephoto2video) — turns listing photos into pro walkthrough videos for $79-$179.

═══ RULES ═══

Write 3 DIFFERENT approaches. Each should:
- Open with a scroll-stopping first line (question, bold claim, or controversial take)
- Be 2-4 short paragraphs (not a wall of text)
- Include 1-2 relevant emojis (not overdone)
- End with a clear CTA: "Follow @realestatephoto2video for more tips" or "Link in bio"
- Include 3-5 relevant hashtags at the end
- Work across Instagram, TikTok, Facebook, and LinkedIn
- Sound human and conversational, NOT corporate or AI-generated
- Reference specific value from the video content

The 3 approaches should be:
1. CONTROVERSIAL/BOLD — strong opinion that sparks debate and comments
2. EDUCATIONAL/VALUE — teach something specific, position as authority
3. RELATABLE/STORY — personal angle, "I see agents do this all the time..."

Return a JSON array with exactly 3 objects:
[
  {
    "style": "bold",
    "caption": "The full post text including hashtags",
    "preview": "First 10 words for preview display"
  }
]

Return ONLY the JSON array. No markdown backticks. No other text.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";

    let posts;
    try {
      posts = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      posts = [];
    }

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("[Content Social] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
