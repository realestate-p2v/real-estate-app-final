import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

// ── Cloudinary config ──
cloudinary.config({
  cloud_name:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Upload a buffer to Cloudinary and return the secure URL */
async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `photo2video/${folder}`,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Pick the best image size based on aspect ratio.
 * Supported: "1024x1024", "1536x1024" (landscape), "1024x1536" (portrait), "auto"
 */
function detectAspectSize(
  width: number,
  height: number
): "1024x1024" | "1536x1024" | "1024x1536" {
  const ratio = width / height;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 0.87) return "1024x1536";
  return "1024x1024";
}

export async function POST(request: Request) {
  try {
    const { photo_url, room_type, style, user_id, user_email } =
      await request.json();

    if (!photo_url || !room_type || !style || !user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: photo_url, room_type, style, user_id",
        },
        { status: 400 }
      );
    }

    // ── Require OpenAI key ──
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Staging] OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "Virtual staging is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ── Paywall check ──
    const isAdmin = user_email && ADMIN_EMAILS.includes(user_email);

    if (!isAdmin) {
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber")
        .eq("user_id", user_id)
        .single();

      const isSubscriber = usage?.is_subscriber === true;

      if (!isSubscriber) {
        const { count } = await supabase
          .from("lens_staging")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user_id);

        if ((count || 0) >= 1) {
          return NextResponse.json(
            {
              success: false,
              error: "free_limit_reached",
              message:
                "You've used your free staging. Subscribe to P2V Lens for unlimited virtual staging.",
            },
            { status: 403 }
          );
        }
      } else {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from("lens_staging")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user_id)
          .gte("created_at", monthStart.toISOString());

        if ((count || 0) >= 25) {
          return NextResponse.json(
            {
              success: false,
              error: "monthly_limit_reached",
              message:
                "You've reached the 25 staging limit for this month. Resets on the 1st.",
            },
            { status: 403 }
          );
        }
      }
    }

    // ── Step 1: Claude Vision analyzes the empty room ──
    const roomLabel = room_type.replace(/_/g, " ");

    const visionResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: photo_url } },
              {
                type: "text",
                text: `You are a virtual staging interior designer. Analyze this empty room photo and provide TWO sections:

SECTION 1 - ROOM DESCRIPTION:
Briefly describe the room's dimensions, floor type/color, wall color, windows, lighting, and architectural features.

SECTION 2 - FURNITURE STAGING PLAN for a ${roomLabel} in ${style} style:
List exactly which furniture pieces and decor items should be placed in this room, with specific placement. Be very detailed about the furniture. For example:
- "A large king-size bed with upholstered headboard centered on the back wall"
- "Two matching nightstands flanking the bed"
- "A plush area rug under the bed extending 2 feet on each side"
- "Floor-length curtains on both windows"
Include at least 8-12 specific items with materials, colors, and placement.`,
              },
            ],
          },
        ],
      }),
    });

    const visionData = await visionResponse.json();

    if (!visionResponse.ok || !visionData.content?.[0]?.text) {
      console.error("[Staging] Claude Vision error:", JSON.stringify(visionData));
      return NextResponse.json(
        { success: false, error: "Failed to analyze room photo. Please try again." },
        { status: 500 }
      );
    }

    const roomAnalysis = visionData.content[0].text;

    // ── Step 2: Download the original photo ──
    const photoResponse = await fetch(photo_url);
    if (!photoResponse.ok) {
      throw new Error(`Failed to download original photo: ${photoResponse.status}`);
    }
    const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());

    // Detect aspect ratio from Cloudinary URL transforms, default landscape
    let aspectSize: "1024x1024" | "1536x1024" | "1024x1536" = "1536x1024";
    try {
      const urlMatch = photo_url.match(/\/upload\/.*?w_(\d+),h_(\d+)/);
      if (urlMatch) {
        aspectSize = detectAspectSize(parseInt(urlMatch[1]), parseInt(urlMatch[2]));
      }
    } catch {
      // keep default landscape — most common for real estate photos
    }

    // ── Step 3: OpenAI gpt-image-1.5 Edit API ──
    const trimmedAnalysis =
      roomAnalysis.length > 2000 ? roomAnalysis.slice(0, 2000) : roomAnalysis;

    const editPrompt = `Add furniture and decor to this empty room in ${style} style.
Room details from analysis: ${trimmedAnalysis}
Keep all existing architectural features exactly as they are — walls, windows, floors, ceiling, doors, fixtures.
Only add: furniture, rugs, art, plants, decorative items, and soft furnishings appropriate for a ${roomLabel}.
The result should look like a professional interior design photograph, photorealistic, magazine-quality.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = new File([photoBuffer], "room.png", { type: "image/png" });

    const openaiResponse = await openai.images.edit({
      model: "gpt-image-1-mini",
      image: file,
      prompt: editPrompt,
      size: aspectSize,
    } as any);
    
    const base64Image = openaiResponse.data?.[0]?.b64_json;

    if (!base64Image) {
      console.error("[Staging] OpenAI returned no image data:", JSON.stringify(openaiResponse));
      return NextResponse.json(
        { success: false, error: "Image generation failed. Please try again." },
        { status: 500 }
      );
    }

    // ── Step 4: Upload to Cloudinary ──
    const imageBuffer = Buffer.from(base64Image, "base64");
    const publicId = `staging_${user_id}_${Date.now()}`;
    const stagedImageUrl = await uploadBufferToCloudinary(imageBuffer, "staging", publicId);

    // ── Step 5: Save to Supabase ──
    const { error: insertError } = await supabase
      .from("lens_staging")
      .insert({
        user_id,
        original_url: photo_url,
        staged_url: stagedImageUrl,
        room_type,
        style,
        room_analysis: roomAnalysis,
      });

    if (insertError) {
      console.error("[Staging] Supabase insert error:", insertError);
    }

    return NextResponse.json({
      success: true,
      staged_url: stagedImageUrl,
      room_analysis: roomAnalysis,
    });
  } catch (error: any) {
    console.error("[Staging] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
