import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

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

async function analyzePhoto(photoUrl: string): Promise<string | null> {
  try {
    const result = await callClaude(
      [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: photoUrl,
              },
            },
            {
              type: "text",
              text: `You are a professional real estate photographer reviewing a listing photo. Describe ONLY what you can definitively see in this photo in 2-3 sentences.

Rules:
- State the room type and visible features
- Describe colors, textures, and finishes as they APPEAR — do not guess the specific material. Say "dark wood-toned cabinetry" not "mahogany cabinetry." Say "tile flooring" not "travertine tile" unless you are 100% certain.
- Do not invent features that are not clearly visible (e.g. do not say "exposed beams" unless beams are clearly visible, do not say "vaulted ceilings" unless the ceiling height is clearly visible)
- Note lighting quality and condition
- If the photo is too dark, blurry, or unidentifiable as a real estate photo, respond with exactly: SKIP`,
            },
          ],
        },
      ],
      undefined,
      300
    );
    if (result.trim().toUpperCase() === "SKIP") return null;
    return result.trim();
  } catch (err) {
    console.error("Photo analysis error:", err);
    return null;
  }
}

// Extract Cloudinary public_id from a secure_url
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary credentials not set — skipping photo deletion");
    return;
  }
  try {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { photoUrls, propertyData, style, userId, fromCoach } = body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: "At least one photo URL is required" }, { status: 400 });
    }
    if (!propertyData) {
      return NextResponse.json({ error: "Property data is required" }, { status: 400 });
    }
    if (!style) {
      return NextResponse.json({ error: "Style is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if non-subscriber has already used their free trial
    const { data: existingDescriptions, error: countError } = await supabaseAdmin
      .from("lens_descriptions")
      .select("id")
      .eq("user_id", userId);

    // Admin god mode — always treated as subscriber
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const isSubscriber = ADMIN_EMAILS.includes(userData?.user?.email || "");
    if (!isSubscriber && existingDescriptions && existingDescriptions.length >= 1) {
      return NextResponse.json(
        { error: "free_trial_used", message: "Subscribe to P2V Lens to generate more descriptions." },
        { status: 403 }
      );
    }

    // Step 1: Analyze each photo with Claude Vision (parallel, max 10)
    const photosToAnalyze = photoUrls.slice(0, 10);
    const analyses = await Promise.all(photosToAnalyze.map(analyzePhoto));

    const validAnalyses = analyses.filter((a): a is string => a !== null);

    if (validAnalyses.length === 0) {
      return NextResponse.json(
        { error: "None of the uploaded photos could be analyzed. Please upload clear listing photos." },
        { status: 400 }
      );
    }

    // Step 2: Build the room descriptions
    const roomDescriptions = validAnalyses
      .map((analysis, i) => `Photo ${i + 1}: ${analysis}`)
      .join("\n");

    // Step 3: Generate the listing description
    const { beds, baths, sqft, lotSize, yearBuilt, price, neighborhood, specialFeatures, address } = propertyData;

    const styleGuide: Record<string, string> = {
      professional: "Write in a professional, polished tone suitable for MLS. Clear, factual, and appealing.",
      luxury: "Write in an elevated luxury tone. Emphasize premium finishes, exclusivity, and lifestyle. Use sophisticated vocabulary.",
      conversational: "Write in a warm, conversational tone as if a friendly agent is giving a tour. Approachable and engaging.",
      concise: "Write in a brief, punchy style. Short sentences. Key facts up front. No fluff. Perfect for social media or quick listings.",
    };

    const descriptionPrompt = `You are an expert real estate listing agent. Write a ${style} MLS listing description for this property.

Property Details:
- Address: ${address || "Not provided"}
- Bedrooms: ${beds || "N/A"}
- Bathrooms: ${baths || "N/A"}
- Square Feet: ${sqft || "N/A"}
- Lot Size: ${lotSize || "N/A"}
- Year Built: ${yearBuilt || "N/A"}
- Price: ${price || "N/A"}
- Neighborhood: ${neighborhood || "N/A"}
- Special Features: ${specialFeatures || "None specified"}

Room-by-Room Photo Analysis:
${roomDescriptions}

Style Guide: ${styleGuide[style] || styleGuide.professional}

CRITICAL Requirements:
- 150-250 words
- Highlight the strongest selling points from the photos
- ONLY mention materials, finishes, and features that are explicitly described in the photo analyses above. If the analysis says "dark wood-toned cabinetry," write "dark wood-toned cabinetry" — do NOT upgrade it to "mahogany" or "cherry" or any specific wood species unless the analysis explicitly names it.
- Do NOT invent or embellish features. If the photo analyses do not mention exposed beams, vaulted ceilings, granite countertops, or any other feature, do NOT include it in the description. Stick strictly to what was observed.
- Do NOT guess at materials. Say "tile flooring" not "marble tile" unless the analysis specifically says marble. Say "wood cabinetry" not "oak cabinetry" unless oak is explicitly stated.
- You may use the property details (beds, baths, sqft, price, etc.) freely — those are facts provided by the agent.
- Include a compelling opening line
- End with a call to action`;

    const description = await callClaude(
      [{ role: "user", content: descriptionPrompt }],
      "You are a top-producing real estate listing agent known for writing accurate, compelling property descriptions. You never fabricate or embellish features — you only describe what has been verified in the photos and property data. Accuracy builds trust with buyers.",
      600
    );

    // Step 4: Save to Supabase (description + property data only, no photo URLs)
    const { data: saved, error: saveError } = await supabaseAdmin
      .from("lens_descriptions")
      .insert({
        user_id: userId,
        property_data: propertyData,
        photo_analyses: validAnalyses,
        style,
        description: description.trim(),
        status: "complete",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
    }

    // Step 5: Delete freshly uploaded photos from Cloudinary (not Photo Coach photos)
    const fromCoachFlags = fromCoach || new Array(photosToAnalyze.length).fill(false);
    const deletePromises: Promise<void>[] = [];

    photosToAnalyze.forEach((url, i) => {
      if (!fromCoachFlags[i]) {
        const publicId = extractPublicId(url);
        if (publicId) {
          deletePromises.push(deleteFromCloudinary(publicId));
        }
      }
    });

    if (deletePromises.length > 0) {
      Promise.all(deletePromises).catch((err) =>
        console.error("Cloudinary cleanup error:", err)
      );
    }

    return NextResponse.json({
      success: true,
      description: description.trim(),
      photoAnalyses: validAnalyses,
      photosAnalyzed: validAnalyses.length,
      photosSkipped: photosToAnalyze.length - validAnalyses.length,
      id: saved?.id || null,
    });
  } catch (err: any) {
    console.error("Description API error:", err);
    return NextResponse.json(
      { error: "Failed to generate description. Please try again." },
      { status: 500 }
    );
  }
}
