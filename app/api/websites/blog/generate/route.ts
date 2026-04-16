// ============================================================
// FILE: app/api/websites/blog/generate/route.ts
// ============================================================
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    return data.user;
  }
  const { createServerClient } = await import("@supabase/ssr");
  const cookieSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data } = await cookieSupabase.auth.getUser();
  return data.user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, subject, subtopics, keywords, tone } = await request.json();
    if (!title && !subject) {
      return NextResponse.json({ success: false, error: "Title or subject required" }, { status: 400 });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: false, error: "Anthropic API key not configured" }, { status: 500 });
    }

    // Fetch agent profile + site info for personalization
    const [lensRes, siteRes] = await Promise.all([
      supabase
        .from("lens_usage")
        .select("saved_agent_name, saved_company, saved_phone, saved_email, saved_website")
        .eq("user_id", user.id)
        .limit(1),
      supabase
        .from("agent_websites")
        .select("handle, site_title, tagline, bio")
        .eq("user_id", user.id)
        .limit(1),
    ]);

    const agent = lensRes.data?.[0] || {};
    const site = siteRes.data?.[0] || {};
    const agentName = agent.saved_agent_name || "the agent";
    const company = agent.saved_company || "";
    const phone = agent.saved_phone || "";
    const email = agent.saved_email || "";
    const handle = site.handle || "";
    const siteTitle = site.site_title || agentName;
    const bio = site.bio || "";

    const topicText = title || subject;
    const keywordList = keywords ? `Target keywords: ${keywords}` : "";
    const subtopicList = subtopics ? `\nSub-topics to include (each should be a section or key point in the post):\n${subtopics}` : "";
    const toneText = tone || "professional yet personable — like a local expert sharing insight";

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
            content: `You are an SEO content writer creating a blog post for a real estate agent's personal website. The agent is the author and protagonist of this blog — write in their voice, for their audience, to help them build authority and attract clients.

═══ ABOUT THIS AGENT ═══

Name: ${agentName}
${company ? `Company: ${company}` : ""}
${phone ? `Phone: ${phone}` : ""}
${email ? `Email: ${email}` : ""}
${bio ? `Bio: ${bio}` : ""}
${siteTitle ? `Website brand: ${siteTitle}` : ""}

This is THEIR blog on THEIR website. Readers are prospective buyers, sellers, and clients evaluating whether to work with this agent. The goal is to position ${agentName} as a trustworthy local expert — not to promote any platform or third-party service.

═══ BLOG POST REQUEST ═══

Write a blog post on this topic: "${topicText}"
${subtopicList}
${keywordList}
Tone: ${toneText}

═══ SEO + AI SEARCH OPTIMIZATION RULES ═══

Your goal is to rank on Google AND get cited by AI assistants (ChatGPT, Gemini, Perplexity, Claude). Follow ALL of these rules:

1. STRUCTURE FOR FEATURED SNIPPETS + AI CITATIONS:
   - Start with a 2-3 sentence TL;DR paragraph that directly answers the main question. AI assistants cite concise, authoritative answers.
   - Use H2 headers as clear questions or topic phrases (e.g., "## What Should I Look For When Buying a First Home?" not "## Introduction")
   - Include at least one numbered list (steps, tips, or rankings) — Google and AI love structured lists
   - Include at least one bullet list for quick-scan content
   - Add a "Key Takeaways" or "Quick Summary" section with 4-6 bullet points near the end
   - End with an FAQ section using "## Frequently Asked Questions" with 3-5 Q&A pairs formatted as ### Question / Answer

2. CONTENT DEPTH FOR AI CITATION:
   - Include specific statistics with context when relevant (e.g., "According to the National Association of Realtors, the median home sells in 31 days")
   - Define key terms inline (AI assistants extract definitions)
   - Make authoritative declarative statements that AI can quote
   - Reference industry sources by name (NAR, Zillow, Redfin, MLS) for credibility
   - Include "What is [term]" explanations for technical concepts

3. SCHEMA-FRIENDLY FORMATTING:
   - Title should be under 60 characters if possible
   - First paragraph must contain the primary keyword naturally
   - Use H2 for main sections, H3 for subsections — clear hierarchy
   - Bold key phrases and definitions (not random words)

4. VOICE AND PERSONALIZATION:
   - Write in ${agentName}'s voice — first person "I" or "we" when appropriate
   - Reference local expertise when the topic allows ("In my years helping buyers in this market...")
   - Address the reader as "you" — they're a potential client reading this
   - Share practical insight — agents build authority by demonstrating what they know
   - Do NOT reference or promote any software, platform, or third-party service
   - Do NOT mention video creation services, AI tools, or photography platforms
   - Keep the focus on real estate advice, market insight, and the agent's expertise

5. INTERNAL LINKS — MANDATORY (agent's own site only):
   You MUST include at least 3-5 internal links woven naturally into the post. Choose from the agent's own pages:

   - [view current listings](/listings) — when discussing inventory, properties, or what's available
   - [learn more about me](/about) — when referencing experience or credentials
   - [get in touch](/contact) — when inviting questions or next steps
   - [schedule a consultation](/contact) — when discussing working together
   - [read more articles](/blog) — when referencing related topics
   - [see local area guides](/locations) — when discussing neighborhoods or regions (only if the agent has location pages)

   RULES FOR INTERNAL LINKS:
   - Minimum 3 links per post, aim for 4-5
   - LINK LENGTH: Anchor text must be 2-7 words MAXIMUM. Never wrap a sentence in a link.
   - Use descriptive anchor text — NOT "click here"
   - Spread links throughout the post
   - Contact link should appear once in the body and once near the end
   - Links should feel helpful, not pushy

6. EXTERNAL LINKS:
   - Use external links sparingly — only to authoritative industry sources (NAR, Zillow Research, Redfin, MLS organizations)
   - Maximum 1-2 external links per post
   - External links validate claims and boost credibility, but the focus is keeping readers on-site

7. READABILITY:
   - Short paragraphs (2-4 sentences max)
   - Conversational but authoritative tone
   - Include concrete local examples when relevant
   - 1,000-1,500 words target length

8. CALL TO ACTION:
   - End the post with a soft CTA inviting the reader to reach out
   - Reference the agent by name: "If you have questions about [topic], ${agentName} would love to help"
   - Include phone/email naturally if appropriate
   - Never use pushy sales language ("Call now!", "Limited time!", etc.)

═══ OUTPUT FORMAT ═══

Return a JSON object with these fields:
{
  "title": "SEO-optimized title under 60 chars",
  "slug": "url-friendly-slug",
  "meta_description": "155 character meta description with primary keyword",
  "excerpt": "2-3 sentence excerpt for blog listing cards",
  "content": "Full blog post in Markdown format with ## headers, **bold**, lists, [internal links](/path) with 2-7 word anchor text, etc. Must contain at least 3 internal links with short anchor text.",
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
    console.error("[Agent Blog Generate] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// CORS preflight for cross-domain editor
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
