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
            content: `You are an elite SEO content writer specializing in real estate marketing. You write for Real Estate Photo 2 Video (realestatephoto2video.com) — a platform purpose-built for real estate agents by real estate marketing professionals. Not a generic AI tool — every feature is designed specifically for listing marketing.

═══ ABOUT THE PLATFORM (reference naturally, never pitch) ═══

LISTING VIDEOS:
- Agents upload listing photos and receive a cinematic walkthrough video
- Three tiers: Standard ($79, up to 15 clips) | Professional ($99, up to 25 clips) | Premium ($109, up to 35 clips)
- Delivery guaranteed under 12 hours
- Includes custom branding, licensed music, AI-generated camera movements, and human review
- Every order includes 1 free revision within 5 days

P2V LENS — AI Marketing Suite ($27.95/mo):
- AI Photo Coach: scores listing photos 1-10 with specific, actionable feedback agents can use on the spot during shoots
- AI Description Writer: analyzes listing photos and generates MLS-ready property descriptions in multiple styles
- Marketing Design Studio: creates Just Listed graphics, Open House flyers, yard signs, property PDFs, and branding cards
- Virtual Staging: AI-furnishes empty rooms while preserving the actual room architecture (walls, windows, floors stay real)
- Quick Videos: subscribers can order 5-14 clip short-form videos at $4.95/clip for social media teasers, listing refreshers, and open house promos
- Includes 10% off all video orders, priority processing, and free photo enhancement on video orders

POSITIONING: This platform is purpose-built for real estate — not a generic AI tool adapted for the industry. Every feature understands listings, MLS requirements, and what sells homes. When contextually relevant, present the tools as valuable assets agents can benefit from. Never pitch or hard-sell. Let the value speak for itself.

═══ BLOG POST REQUEST ═══

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

4. INTERNAL LINKS — MANDATORY:
   You MUST include at least 5 internal links woven naturally into the post content using markdown link syntax. Choose from these pages and link them where they fit contextually:

   Video service:
   - [create a listing video](/order) — when mentioning creating videos, getting started, or ordering
   - [browse our pricing](/order) — when discussing costs, packages, or value
   - [see examples in our portfolio](/portfolio) — when referencing video quality or sample work

   P2V Lens tools:
   - [P2V Lens](/lens) — when discussing AI tools, marketing automation, or the subscription platform
   - [AI Photo Coach](/dashboard/lens/coach) — when discussing photo quality, scoring, or shoot feedback
   - [AI Description Writer](/dashboard/lens/descriptions) — when discussing MLS descriptions or listing copy
   - [Marketing Design Studio](/dashboard/lens/design-studio) — when discussing marketing materials, graphics, flyers, or yard signs
   - [Virtual Staging](/dashboard/lens/staging) — when discussing staging, empty rooms, or furnishing digitally

   Resources:
   - [free photography guide](/resources/photography-guide) — when discussing photo tips, camera settings, lighting, or staging
   - [DIY photo tips](/tips) — when discussing photography techniques or improvement tips
   - [find a photographer near you](/directory) — when discussing hiring photographers
   - [photographer referral program](/partners) — when discussing photographer partnerships

   Support:
   - [contact support](/support) — when mentioning help or questions
   - [read more on our blog](/blog) — when referencing related articles

   RULES FOR INTERNAL LINKS:
   - Minimum 5 links per post, aim for 6-8
   - LINK LENGTH: Anchor text must be 2-7 words MAXIMUM. Never wrap a sentence or paragraph in a link. CORRECT: "check out our [free photography guide](/resources/photography-guide) for tips" — WRONG: "[Our free photography guide explains the optimal photo sequence that generic tools can't understand](/resources/photography-guide)"
   - Use descriptive anchor text — NOT "click here", use natural phrases like "our [AI Photo Coach](/dashboard/lens/coach) scores each shot"
   - Spread links throughout the post — do not cluster them in one section
   - The /order page link should appear at least twice (once in body, once near the end)
   - Links should feel helpful to the reader, not promotional
   - Link to Lens tools when naturally discussing the capability they provide — don't force them

5. EXTERNAL LINKS:
   - Use external links sparingly — only to authoritative industry sources (NAR, Zillow Research, Redfin, MLS organizations)
   - Maximum 1-2 external links per post
   - External links validate claims and boost credibility, but the focus is keeping readers on-site

6. READABILITY:
   - Short paragraphs (2-4 sentences max)
   - Conversational but authoritative tone
   - Use "you" to address realtors/agents directly
   - Include concrete examples and scenarios
   - 1,200-1,800 words target length

7. NATURAL PRODUCT REFERENCES:
   - When discussing a problem agents face, naturally mention the P2V tool that solves it — as a helpful resource, not an ad
   - Reference specific features by name (Photo Coach, Design Studio, etc.) when contextually relevant
   - Mention concrete details: "$4.95/clip Quick Videos" is more helpful than "affordable video options"
   - Under 12-hour delivery is a benefit worth mentioning in context, not as a sales pitch
   - Never use phrases like "sign up now", "don't miss out", "limited time", or other sales language
   - Position tools as things smart agents already use, not things you're trying to sell

═══ OUTPUT FORMAT ═══

Return a JSON object with these fields:
{
  "title": "SEO-optimized title under 60 chars",
  "slug": "url-friendly-slug",
  "meta_description": "155 character meta description with primary keyword",
  "excerpt": "2-3 sentence excerpt for blog listing cards",
  "content": "Full blog post in Markdown format with ## headers, **bold**, lists, [internal links](/path) with 2-7 word anchor text, etc. Must contain at least 5 internal links with short anchor text.",
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
