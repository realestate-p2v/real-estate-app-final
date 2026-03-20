import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const SCORING_PROMPT = `You are a professional real estate photography coach reviewing a listing photo. 
Score this photo 1-10 and provide specific, actionable feedback.

EVALUATE:
- Lighting: natural light usage, shadows, exposure, window light
- Composition: angles, vertical lines, rule of thirds, room coverage
- Staging: clutter, personal items, distractions, doors (open fully or closed)
- Technical: focus, white balance, lens distortion, blur

CRITICAL RULES:
- Only penalize things the agent can fix RIGHT NOW on-site: camera angle, position, 
  opening/closing blinds, turning lights on/off, removing clutter, closing/opening doors,
  removing stickers/items, stepping back/forward, switching lenses
- Do NOT penalize things that require purchases or can't be changed: mismatched light bulb 
  colors, paint colors, furniture style, architectural features, countertop materials, 
  backsplash design. FLAG these as "noted for AI editing" but do not lower the score.
- Be specific: "Back up 2 feet" not "consider adjusting your position"
- Be encouraging but honest. This is a coach, not a critic.
- If score is 8+, explain what would make it a 10

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": 8,
  "summary": "Good shot! Strong natural light from the windows.",
  "fixable_issues": ["Back up 2 feet to capture the full kitchen island"],
  "flagged_issues": ["Slight warm/cool mismatch from different bulbs — AI Edit will fix"],
  "what_would_make_10": "Capture the full island and show more of the window wall",
  "approved": true
}

The "approved" field must be true if score >= 8, false otherwise.
The "fixable_issues" array should list things the agent can fix right now.
The "flagged_issues" array should list things that can't be fixed on-site but AI editing can handle later.
If score is below 8, "what_would_make_10" should still be included but focus on the most impactful fix.`;

async function callClaude(messages: any[], system?: string, maxTokens = 1024) {
  const body: any = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function deleteFromCloudinary(url: string): Promise<void> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary credentials not set — skipping photo deletion");
    return;
  }
  try {
    // Extract public_id from Cloudinary URL
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (!match) return;

    const publicId = match[1];
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest("hex");

    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("signature", signature);

    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: "POST", body: formData }
    );
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo_url, session_id, user_id } = body;

    if (!photo_url) {
      return NextResponse.json(
        { error: "photo_url is required" },
        { status: 400 }
      );
    }

    // Call Claude Vision for scoring
    const rawResult = await callClaude(
      [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: photo_url,
              },
            },
            {
              type: "text",
              text: SCORING_PROMPT,
            },
          ],
        },
      ],
      undefined,
      1024
    );

    // Parse the response
    let result;
    try {
      const cleaned = rawResult
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Claude response:", rawResult);
      throw new Error("Failed to parse scoring response");
    }

    // Validate and normalize
    const score = Math.min(10, Math.max(1, Math.round(result.score || 1)));
    const approved = score >= 8;

    const scoringResult = {
      score,
      summary: result.summary || "Photo analyzed.",
      fixable_issues: Array.isArray(result.fixable_issues)
        ? result.fixable_issues
        : [],
      flagged_issues: Array.isArray(result.flagged_issues)
        ? result.flagged_issues
        : [],
      what_would_make_10: result.what_would_make_10 || "",
      approved,
    };

    // NOTE: We do NOT auto-delete low-score photos. The client shows the user
    // "Reshoot" vs "Keep Anyway" options. Deletion only happens if the user
    // explicitly chooses to reshoot (via DELETE /api/lens/coach).
    return NextResponse.json(scoringResult);
  } catch (err: any) {
    console.error("Photo Coach API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze photo" },
      { status: 500 }
    );
  }
}

// DELETE — called when user explicitly chooses "Reshoot" on a low-score photo
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo_url } = body;

    if (!photo_url) {
      return NextResponse.json(
        { error: "photo_url is required" },
        { status: 400 }
      );
    }

    await deleteFromCloudinary(photo_url);
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    console.error("Photo deletion error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete photo" },
      { status: 500 }
    );
  }
}
