import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all reviews for this user
    const { data: reviews, error } = await supabase
      .from("review_rewards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get user's promo codes from reviews
    const { data: promoCodes } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("source", "review")
      .order("created_at", { ascending: false });

    // Count approved reviews to determine discount tier
    const approvedCount = (reviews || []).filter(r => r.verification_status === "approved").length;
    const pendingCount = (reviews || []).filter(r => r.verification_status === "pending").length;

    let discountTier = "none";
    let discountPercent = 0;
    if (approvedCount >= 3) {
      discountTier = "all_three";
      discountPercent = 25;
    } else if (approvedCount >= 2) {
      discountTier = "two";
      discountPercent = 15;
    } else if (approvedCount >= 1) {
      discountTier = "one";
      discountPercent = 10;
    }

    // Get platforms already reviewed
    const reviewedPlatforms = (reviews || []).map(r => r.platform);

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      promoCodes: promoCodes || [],
      reviewedPlatforms,
      approvedCount,
      pendingCount,
      discountTier,
      discountPercent,
    });
  } catch (error) {
    console.error("[Reviews API] GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { platform, screenshotUrl, orderId } = await request.json();

    if (!platform || !["google", "facebook", "zillow"].includes(platform)) {
      return NextResponse.json({ success: false, error: "Invalid platform" }, { status: 400 });
    }

    if (!screenshotUrl) {
      return NextResponse.json({ success: false, error: "Screenshot required" }, { status: 400 });
    }

    // Check if already submitted for this platform
    const { data: existing } = await supabase
      .from("review_rewards")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: "You've already submitted a review for this platform" }, { status: 400 });
    }

    // Get the user's most recent order if orderId not provided
    let reviewOrderId = orderId;
    if (!reviewOrderId) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (orders && orders.length > 0) {
        reviewOrderId = orders[0].id;
      }
    }

    // Create review reward entry
    const { data: review, error } = await supabase
      .from("review_rewards")
      .insert({
        user_id: user.id,
        order_id: reviewOrderId || null,
        platform,
        screenshot_url: screenshotUrl,
        verification_status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[Reviews API] Insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Check how many approved + pending reviews the user now has
    const { data: allReviews } = await supabase
      .from("review_rewards")
      .select("id, verification_status")
      .eq("user_id", user.id);

    const totalSubmitted = (allReviews || []).length;

    return NextResponse.json({
      success: true,
      review,
      totalSubmitted,
      message: `Review screenshot submitted for ${platform}! We'll verify it within 24 hours.`,
    });
  } catch (error) {
    console.error("[Reviews API] POST error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
