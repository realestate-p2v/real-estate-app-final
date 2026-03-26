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

    const adminDb = createAdminClient();

    // Check if review already submitted for this platform by this user
    const { data: existing } = await adminDb
      .from("review_rewards")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .single();

    if (existing) {
      // Update with new screenshot
      await adminDb
        .from("review_rewards")
        .update({
          screenshot_url: screenshotUrl,
          order_id: orderId,
          verification_status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Insert new
      await adminDb.from("review_rewards").insert({
        user_id: user.id,
        order_id: orderId,
        platform,
        screenshot_url: screenshotUrl,
        verification_status: "pending",
        submitted_at: new Date().toISOString(),
      });
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
    const { data: reviews } = await adminDb
      .from("review_rewards")
      .select("*")
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
