import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const SCORING_PROMPT = `You are a professional real estate photography coach. Score this listing photo out of 10 using ONLY the 5 categories below. Each category is worth 0-2 points.

═══════════════════════════════════════
SCORING CATEGORIES (2 points each, 10 total)
═══════════════════════════════════════

1. LIGHTING (0-2)
   Score: Are lights turned on? Are blinds/curtains open? Is exposure correct (not too dark, not blown out)? Are there harsh flash shadows?
   Ignore: Window view quality, time of day, natural light color temperature.

2. COMPOSITION (0-2)
   Score: Is the camera at correct height (chest height, ~4 feet)? Does the shot show room depth? Are vertical lines straight? Is the shot centered and level?
   Ignore: Room size, room layout, architectural style.

3. CAMERA SETTINGS (0-2)
   Score: Is the image in focus? Is white balance reasonable? Was HDR used when needed (bright windows + dark interior)? Is resolution sufficient?
   Ignore: Camera model or quality, lens type.

4. STAGING & TIDINESS (0-2)
   Score: Is visible clutter removed (shoes, bags, cables, mail, remotes, personal toiletries, clothing, toys on floor)? Are toilet lids down? Are personal items hidden (family photos, medications, mail with addresses)? Are beds made?
   Ignore: Furniture quality, age, style, or condition. Decorative items (vases, candles, styled books, small plants, artwork, decorative bowls, picture frames) are INTENTIONAL STAGING — do NOT flag them as clutter.

5. COMPLETENESS (0-2)
   Score: Is the full room shown (not cutting off major features)? Are key selling features visible (fireplace, built-ins, large windows)? Is anything important cut off at the frame edge?
   Ignore: What features the room happens to have. Score whether the photographer captured what's there, not what's there.

═══════════════════════════════════════
FEEDBACK RULES — READ CAREFULLY
═══════════════════════════════════════

Every piece of feedback MUST be something the photographer can do RIGHT NOW during the shoot:
- "Turn on the overhead light and open the blinds on the south wall"
- "Step back 3 feet into the doorway and lower the camera to chest height"
- "Remove the shoes by the front door and close the closet on the left"
- "Rotate slightly left to include the fireplace that's cut off at the frame edge"

NEVER suggest any of the following — these are NOT photographer-controllable:
- Renovating, replacing, upgrading, or buying anything ("updated countertops", "new fixtures", "add a plant")
- Changing the property itself ("the small room limits options", "dated finishes")
- Anything about furniture quality, paint colors, appliance age, or architectural features
- Anything about the view outside windows
- Weather, season, or time of day

ACCURACY RULES — do NOT give bad advice:
- DOORS: Not all doors are hinged. Sliding doors, pocket doors, barn doors, and bifold doors look different when fully open. Do NOT tell the agent to "open or close" a door unless you are confident it is a standard hinged door that is clearly partially open. When in doubt, do not mention it.
- LIGHTS: A lamp is ON if you see ANY glow on the shade, warm light cast on nearby surfaces, an illuminated bulb, or any light from the fixture. Bedside lamps in real estate photos are almost always already on. Do NOT suggest "turn on the lamp" unless it is clearly dark with zero glow. When in doubt, assume it is ON.
- SPATIAL AWARENESS: Before suggesting "step back," check for cues that the photographer is already against a wall: headboard at frame edge = wall behind photographer; two walls meeting at a corner near camera = shooting from corner; very wide-angle with walls on both sides = doorway or tight space. Instead suggest adjusting angle or moving slightly left/right.
- CLUTTER vs DECOR: If items on a surface look arranged or styled, they are decor, not clutter. Only flag genuinely messy or personal items.
- GENERAL: If you are not certain about the state of something, do NOT mention it. False advice wastes time and erodes trust.

TONE: Be encouraging but honest. This is a coach, not a critic. Be specific ("back up 2 feet") not vague ("consider adjusting").

AI EDITING NOTE: Do NOT lower the score for things AI editing will fix post-shoot:
- Lens distortion / barrel distortion / wide-angle vertical line bowing
- Slightly tilted horizon
- Mixed lighting color temperatures (warm/cool mismatch from different bulbs)
- Minor white balance shifts
FLAG these in flagged_issues as "noted for AI editing" but do NOT deduct points.

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

First, identify the room type. Then score each of the 5 categories. Then provide feedback.

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": 7,
  "room_type": "Kitchen",
  "categories": [
    { "name": "Lighting", "score": 2, "max": 2, "note": "All lights on, blinds open, good exposure" },
    { "name": "Composition", "score": 1, "max": 2, "note": "Camera too high — lower to chest height for better depth" },
    { "name": "Camera Settings", "score": 2, "max": 2, "note": "Sharp focus, good white balance" },
    { "name": "Staging & Tidiness", "score": 1, "max": 2, "note": "Mail and keys visible on counter" },
    { "name": "Completeness", "score": 1, "max": 2, "note": "Pantry wall cut off on the right" }
  ],
  "feedback": [
    "Lower the camera to chest height (~4 feet) and step back into the doorway to show full room depth",
    "Remove the mail and keys from the kitchen counter",
    "Rotate slightly right to include the pantry wall that's cut off"
  ],
  "flagged_issues": ["Slight warm/cool mismatch from recessed lights vs window light — AI Edit will fix"],
  "summary": "Good lighting and sharp focus. Lower the camera, clear the counter, and widen the frame to capture the full kitchen.",
  "what_would_make_10": "Chest-height angle showing full room depth with clean counters and complete room coverage",
  "approved": true
}

FIELD RULES:
- "score": sum of all 5 category scores (0-10)
- "room_type": identify the room (Kitchen, Living Room, Master Bedroom, Bathroom, Exterior, etc.)
- "categories": exactly 5 objects, one per category, each with name/score/max/note
- "feedback": array of specific, actionable instructions the photographer can do RIGHT NOW. Empty array if score is 10.
- "flagged_issues": things AI editing will handle post-shoot. Empty array if none.
- "summary": 1-2 sentence overview
- "what_would_make_10": what a perfect version of this shot looks like
- "approved": true if score >= 8, false otherwise`;

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
    const { photo_url, session_id, user_id, hdr_detected } = body;

    if (!photo_url) {
      return NextResponse.json(
        { error: "photo_url is required" },
        { status: 400 }
      );
    }

    // Build the prompt — add HDR note if not detected
    let prompt = SCORING_PROMPT;
    if (hdr_detected === false) {
      prompt += `\n\nIMPORTANT: This photo was NOT shot in HDR mode. Add this to the flagged_issues array: "Enable HDR mode in your camera settings for better dynamic range — especially important for rooms with windows where inside is dark and outside is bright." Do NOT lower the score for missing HDR.`;
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
              text: prompt,
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

    // Normalize categories — ensure we have exactly 5 with correct structure
    const defaultCategories = [
      { name: "Lighting", score: 0, max: 2, note: "" },
      { name: "Composition", score: 0, max: 2, note: "" },
      { name: "Camera Settings", score: 0, max: 2, note: "" },
      { name: "Staging & Tidiness", score: 0, max: 2, note: "" },
      { name: "Completeness", score: 0, max: 2, note: "" },
    ];

    const categories = Array.isArray(result.categories) && result.categories.length === 5
      ? result.categories.map((cat: any, i: number) => ({
          name: cat.name || defaultCategories[i].name,
          score: Math.min(2, Math.max(0, Math.round(cat.score ?? 0))),
          max: 2,
          note: cat.note || "",
        }))
      : defaultCategories;

    const scoringResult = {
      score,
      room_type: result.room_type || "Room",
      categories,
      summary: result.summary || "Photo analyzed.",
      feedback: Array.isArray(result.feedback)
        ? result.feedback
        : [],
      flagged_issues: Array.isArray(result.flagged_issues)
        ? result.flagged_issues
        : [],
      what_would_make_10: result.what_would_make_10 || "",
      approved,
    };

    // ── Surprise discount — 1-in-500 chance ──
    // Subscriber check is done on the frontend before showing the wheel.
    // Backend just rolls the dice.
    const surprise = Math.random() < 0.002;

    // NOTE: We do NOT auto-delete low-score photos. The client shows the user
    // "Reshoot" vs "Keep Anyway" options. Deletion only happens if the user
    // explicitly chooses to reshoot (via DELETE /api/lens/coach).
    return NextResponse.json({ ...scoringResult, surprise });
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
