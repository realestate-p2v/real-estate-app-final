import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      actionType,
      propertyId,
      contentType,
      platform,
      metadata,
    } = body;

    if (!userId || !actionType) {
      return NextResponse.json(
        { error: "Missing userId or actionType" },
        { status: 400 }
      );
    }

    const validActions = [
      "social_share",
      "caption_generated",
      "caption_copied",
      "asset_downloaded",
      "email_sent",
      "blog_published",
      "website_published",
      "planner_item_completed",
      "planner_item_skipped",
    ];

    if (!validActions.includes(actionType)) {
      return NextResponse.json(
        { error: "Invalid action_type" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase.from("marketing_actions").insert({
      user_id: userId,
      property_id: propertyId || null,
      action_type: actionType,
      platform: platform || null,
      content_type: contentType || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error("Insert marketing_action error:", error);
      return NextResponse.json(
        { error: "Failed to record action" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Action recording error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
