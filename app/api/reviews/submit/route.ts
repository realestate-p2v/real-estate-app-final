import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, platform, screenshotUrl } = await request.json();

    if (!platform || !screenshotUrl) {
      return NextResponse.json({ error: "Platform and screenshot required" }, { status: 400 });
    }

    // order_id column is uuid type — only pass valid UUIDs, otherwise null
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeOrderId = orderId && uuidRegex.test(orderId) ? orderId : null;

    const adminDb = createAdminClient();

    // Check if review already submitted for this platform by this user
    // Use .maybeSingle() to avoid throwing when no row exists
    const { data: existing, error: lookupError } = await adminDb
      .from("review_rewards")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .maybeSingle();

    if (lookupError) {
      console.error("Review lookup error:", lookupError);
      return NextResponse.json({ error: "Failed to check existing review" }, { status: 500 });
    }

    if (existing) {
      // Update with new screenshot
      const { error: updateError } = await adminDb
        .from("review_rewards")
        .update({
          screenshot_url: screenshotUrl,
          order_id: safeOrderId,
          verification_status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Review update error:", updateError);
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
      }
    } else {
      // Insert new
      const { error: insertError } = await adminDb.from("review_rewards").insert({
        user_id: user.id,
        order_id: safeOrderId,
        platform,
        screenshot_url: screenshotUrl,
        verification_status: "pending",
        submitted_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Review insert error:", insertError);
        return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review submit error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

// GET — fetch user's review statuses
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminDb = createAdminClient();
    const { data: reviews, error } = await adminDb
      .from("review_rewards")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Review fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
