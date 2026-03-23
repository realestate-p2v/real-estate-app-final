import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

export async function POST(request: Request) {
  try {
    const { photo_url, room_type, style, user_id, user_email } = await request.json();

    if (!photo_url || !room_type || !style || !user_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: photo_url, room_type, style, user_id" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
        // Free trial: 1 staging allowed
        const { count } = await supabase
          .from("lens_staging")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user_id);

        if ((count || 0) >= 1) {
          return NextResponse.json(
            { success: false, error: "free_limit_reached", message: "You've used your free staging. Subscribe to P2V Lens for unlimited virtual staging." },
            { status: 403 }
          );
        }
      } else {
        // Subscriber cap: 20/month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from("lens_staging")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user_id)
          .gte("created_at", monthStart.toISOString());

        if ((count || 0) >= 20) {
          return NextResponse.json(
            { success: false, error: "monthly_limit_reached", message: "You've reached the 20 staging limit for this month. Resets on the 1st." },
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

    // ── Step 2: Build Minimax prompt from analysis + style + room type ──
    // Minimax has a 1500 char limit. Our framing text is ~250 chars, so cap analysis at 1200.
    const trimmedAnalysis = roomAnalysis.length > 1200 ? roomAnalysis.slice(0, 1200) : roomAnalysis;
    const constructedPrompt = `A beautifully furnished ${roomLabel} in ${style} style. FULLY FURNISHED with furniture, rugs, curtains, artwork, lamps, plants. ${trimmedAnalysis}. Photorealistic interior design photography, professionally staged, Architectural Digest quality, warm natural lighting.`;

    // Safety check: hard truncate if still over 1500
    const finalPrompt = constructedPrompt.length > 1500 ? constructedPrompt.slice(0, 1497) + "..." : constructedPrompt;

    // ── Step 3: Minimax image-01 generation ──
    const minimaxResponse = await fetch("https://api.minimax.io/v1/image_generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: "image-01",
        prompt: finalPrompt,
        aspect_ratio: "4:3",
        response_format: "url",
        n: 1,
        prompt_optimizer: true,
      }),
    });

    const minimaxData = await minimaxResponse.json();

    const stagedImageUrl = minimaxData?.data?.image_urls?.[0] || minimaxData?.data?.image_url;

    if (!stagedImageUrl) {
      console.error("[Staging] Minimax error:", JSON.stringify(minimaxData));
      return NextResponse.json(
        { success: false, error: "Image generation failed. Please try again." },
        { status: 500 }
      );
    }

    // ── Step 4: Save to Supabase ──
    const { error: insertError } = await supabase.from("lens_staging").insert({
      user_id,
      original_url: photo_url,
      staged_url: stagedImageUrl,
      room_type,
      style,
      room_analysis: roomAnalysis,
    });

    if (insertError) {
      console.error("[Staging] Supabase insert error:", insertError);
      // Don't fail the request — the user still gets the image
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
