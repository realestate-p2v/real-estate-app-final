import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

// PATCH /api/admin/content/platform — update platform posting data
export async function PATCH(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { videoId, platform, url, views } = await request.json();
    if (!videoId || !platform) {
      return NextResponse.json({ success: false, error: "videoId and platform required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current platforms data
    const { data: video } = await supabase
      .from("content_videos")
      .select("platforms")
      .eq("id", videoId)
      .single();

    const platforms = video?.platforms || {};
    platforms[platform] = {
      posted: !!url,
      url: url || null,
      views: views || 0,
    };

    const { data, error } = await supabase
      .from("content_videos")
      .update({ platforms, updated_at: new Date().toISOString() })
      .eq("id", videoId)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, video: data });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
