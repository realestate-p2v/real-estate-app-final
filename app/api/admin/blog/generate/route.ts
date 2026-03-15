import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { title, subject, subtopics, keywords, tone } = await request.json();
    if (!title && !subject) {
      return NextResponse.json({ success: false, error: "Title or subject required" }, { status: 400 });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: false, error: "Anthropic API key not configured" }, { status: 500 });
    }

    const topicText = title || subject;
    const keywordList = keywords ? `Target keywords: ${keywords}` : "";
    const subtopicList = subtopics ? `\nSub-topics to include (each should be a section or key point in the post):\n${subtopics}` : "";
    const toneText = tone || "professional yet conversational — like a knowledgeable friend in real estate";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are an elite SEO content writer specializing in real estate marketing. You write for Real Estate Photo 2 Video (realestatephoto2video.com) — a service that turns listing photos into professional cinematic walkthrough videos ($79-$179/listing, 24-hour delivery).

Write a blog post on this topic: "${topicText}"
${subtopicList}
${keywordList}
Tone: ${toneText}

═══ SEO + AI SEARCH OPTIMIZATION RULES ═══

Your goal is to rank on Google AND get cited by AI assistants (ChatGPT, Gemini, Perplexity, Claude). Follow ALL of these rules:

1. STRUCTURE FOR FEATURED SNIPPETS + AI CITATIONS:
   - Start with a 2-3 sentence TL;DR paragraph that directly answers the main question. AI assistants cite concise, authoritative answers.
   - Use H2 headers as clear questions or topic phrases (e.g., "## Why Do Listing Photos Matter?" not "## Introduction")
   - Include at least one numbered list (steps, tips, or rankings) — Google and AI love structured lists
   - Include at least one bullet list for quick-scan content
   - Add a "Key Takeaways" or "Quick Summary" section with 4-6 bullet points near the end
   - End with an FAQ section using "## Frequently Asked Questions" with 3-5 Q&A pairs formatted as ### Question / Answer

2. CONTENT DEPTH FOR AI CITATION:
   - Include specific statistics with context (e.g., "Listings with video receive 403% more inquiries according to the National Association of Realtors")
   - Define key terms inline (AI assistants extract definitions)
   - Make authoritative declarative statements that AI can quote (e.g., "The ideal number of photos for a listing video is 15-25, covering every room plus 2-3 exterior angles")
   - Reference industry sources by name (NAR, Zillow, Redfin, MLS) for credibility
   - Include "What is [term]" explanations for technical concepts

3. SCHEMA-FRIENDLY FORMATTING:
   - Title should be under 60 characters if possible
   - First paragraph must contain the primary keyword naturally
   - Use H2 for main sections, H3 for subsections — clear hierarchy
   - Bold key phrases and definitions (not random words)
   - Internal link opportunities: mention "walkthrough video," "listing video," "photo-to-video" (we'll link these to /order)
   - External authority references: mention NAR statistics, MLS data, Zillow studies

4. READABILITY:
   - Short paragraphs (2-4 sentences max)
   - Conversational but authoritative tone
   - Use "you" to address realtors/agents directly
   - Include concrete examples and scenarios
   - 1,200-1,800 words target length

5. CALL TO ACTION (subtle, not salesy):
   - Naturally mention that turning photos into video is now affordable ($79-$179)
   - Reference 24-hour delivery as a benefit in context
   - Don't hard-sell — position P2V as the obvious solution when discussing photo-to-video conversion

═══ OUTPUT FORMAT ═══

Return a JSON object with these fields:
{
  "title": "SEO-optimized title under 60 chars",
  "slug": "url-friendly-slug",
  "meta_description": "155 character meta description with primary keyword",
  "excerpt": "2-3 sentence excerpt for blog listing cards",
  "content": "Full blog post in Markdown format with ## headers, **bold**, lists, etc.",
  "tags": ["tag1", "tag2", "tag3"],
  "suggested_images": [
    {
      "search_query": "Pexels search query for a relevant image",
      "alt_text": "Descriptive alt text for this image",
      "placement": "Description of where in the post this image should go"
    }
  ]
}

Return ONLY the JSON object. No markdown backticks. No other text.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";

    let result;
    try {
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json({ success: false, error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Blog Generate] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
