import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

// POST /api/admin/content/generate — trigger video generation for a scripted video
// For now, updates status to "generating" — actual pipeline integration comes next
export async function POST(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { videoId } = await request.json();
    if (!videoId) return NextResponse.json({ success: false, error: "videoId required" }, { status: 400 });

    const supabase = await createClient();

    // Verify video exists and is in scripted status
    const { data: video } = await supabase
      .from("content_videos")
      .select("*")
      .eq("id", videoId)
      .single();

    if (!video) return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    if (video.status !== "scripted") {
      return NextResponse.json({ success: false, error: "Video must be in 'scripted' status to generate" }, { status: 400 });
    }

    // Update status to generating
    await supabase
      .from("content_videos")
      .update({ status: "generating", updated_at: new Date().toISOString() })
      .eq("id", videoId);

    // TODO: Trigger server-side pipeline
    // This will:
    // 1. For each script segment:
    //    a. Search Pexels API for matching stock image/video
    //    b. Send image to Minimax with camera_direction for motion
    //    c. Generate voiceover with ElevenLabs
    // 2. Add text overlays with FFmpeg
    // 3. Add music track
    // 4. Add branded intro/outro
    // 5. Assemble final video with FFmpeg
    // 6. Upload to Google Drive
    // 7. Update content_videos row with drive_url + status = "complete"
    //
    // For now, the pipeline integration will be built on the server
    // similar to the order pipeline. The Supabase status change
    // ("generating") can be picked up by the server pipeline.

    return NextResponse.json({ 
      success: true, 
      message: "Video generation queued. The server pipeline will pick it up.",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
