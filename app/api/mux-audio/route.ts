import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { randomUUID } from "crypto";

const exec = promisify(execFile);

export const maxDuration = 120; // Vercel function timeout (Pro plan)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const tmpDir = join("/tmp", "mux-" + randomUUID());

  try {
    await mkdir(tmpDir, { recursive: true });

    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const musicUrl = formData.get("musicUrl") as string | null;
    const duration = parseFloat((formData.get("duration") as string) || "30");
    const fadeOutSec = parseFloat((formData.get("fadeOutSec") as string) || "2");

    if (!videoFile) {
      return NextResponse.json({ error: "No video file" }, { status: 400 });
    }
    if (!musicUrl) {
      return NextResponse.json({ error: "No music URL" }, { status: 400 });
    }

    // 1. Write video blob to disk
    const videoPath = join(tmpDir, "input.webm");
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(videoPath, videoBuffer);

    // 2. Download the music file
    const musicPath = join(tmpDir, "music.mp3");
    const musicResp = await fetch(musicUrl);
    if (!musicResp.ok) {
      return NextResponse.json(
        { error: `Failed to fetch music: ${musicResp.status}` },
        { status: 502 }
      );
    }
    const musicBuffer = Buffer.from(await musicResp.arrayBuffer());
    await writeFile(musicPath, musicBuffer);

    // 3. Run FFmpeg to combine video + audio
    //    - Loop the audio to match video duration
    //    - Fade out audio over the last N seconds
    //    - Output as MP4 (H.264 + AAC)
    const outputPath = join(tmpDir, "output.mp4");
    const fadeStart = Math.max(0, duration - fadeOutSec);

    const ffmpegArgs = [
      "-y",
      // Input 0: video
      "-i", videoPath,
      // Input 1: audio (loop it, limit to video duration)
      "-stream_loop", "-1",
      "-i", musicPath,
      // Map video from input 0, audio from input 1
      "-map", "0:v:0",
      "-map", "1:a:0",
      // Video: copy if possible, otherwise re-encode
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      // Audio: AAC with fade-out
      "-c:a", "aac",
      "-b:a", "192k",
      "-af", `afade=t=out:st=${fadeStart}:d=${fadeOutSec}`,
      // Duration limit
      "-t", String(duration),
      // Movflag for streaming-friendly MP4
      "-movflags", "+faststart",
      outputPath,
    ];

    try {
      await exec("ffmpeg", ffmpegArgs, { timeout: 90_000 });
    } catch (ffmpegErr: any) {
      console.error("FFmpeg error:", ffmpegErr.stderr || ffmpegErr.message);
      return NextResponse.json(
        { error: "FFmpeg failed", details: ffmpegErr.stderr?.slice(-500) || ffmpegErr.message },
        { status: 500 }
      );
    }

    // 4. Read the output and return it
    const outputBuffer = await readFile(outputPath);

    // 5. Cleanup temp files
    await Promise.allSettled([
      unlink(videoPath),
      unlink(musicPath),
      unlink(outputPath),
    ]);

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="listing-video.mp4"`,
        "Content-Length": String(outputBuffer.length),
      },
    });
  } catch (err: any) {
    console.error("Mux API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
