import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: videos, error } = await supabase
      .from("content_videos")
      .select("id, title, hook, drive_url, platforms, created_at")
      .not("drive_url", "is", null)
      .not("drive_url", "eq", "")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Tips API] Error:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch videos" }, { status: 500 });
    }

    return NextResponse.json({ success: true, videos: videos || [] });
  } catch (error) {
    console.error("[Tips API] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
