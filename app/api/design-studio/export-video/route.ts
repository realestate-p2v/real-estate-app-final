import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { randomUUID } from "crypto";

const exec = promisify(execFile);

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const tmpDir = join("/tmp", "ds-export-" + randomUUID());

  try {
    await mkdir(tmpDir, { recursive: true });

    const formData = await req.formData();
    const overlayFile = formData.get("overlay") as File | null;
    const videoUrl = formData.get("videoUrl") as string | null;
    const width = parseInt((formData.get("width") as string) || "1080");
    const height = parseInt((formData.get("height") as string) || "1080");
    const regionX = parseInt((formData.get("regionX") as string) || "0");
    const regionY = parseInt((formData.get("regionY") as string) || "0");
    const regionW = parseInt((formData.get("regionW") as string) || String(width));
    const regionH = parseInt((formData.get("regionH") as string) || String(height));
    const musicUrl = formData.get("musicUrl") as string | null;

    if (!overlayFile || !videoUrl) {
      return NextResponse.json({ error: "Missing overlay or videoUrl" }, { status: 400 });
    }

    // 1. Save overlay PNG
    const overlayPath = join(tmpDir, "overlay.png");
    const overlayBuf = Buffer.from(await overlayFile.arrayBuffer());
    await writeFile(overlayPath, overlayBuf);

    // 2. Download source video
    const videoPath = join(tmpDir, "source.mp4");
    const videoResp = await fetch(videoUrl);
    if (!videoResp.ok) {
      return NextResponse.json({ error: `Video fetch failed: ${videoResp.status}` }, { status: 502 });
    }
    const videoBuf = Buffer.from(await videoResp.arrayBuffer());
    await writeFile(videoPath, videoBuf);

    // 3. Optionally download music
    let musicPath: string | null = null;
    if (musicUrl) {
      musicPath = join(tmpDir, "music.mp3");
      const musicResp = await fetch(musicUrl);
      if (!musicResp.ok) {
        console.warn(`Music fetch failed (${musicResp.status}), continuing without music`);
        musicPath = null;
      } else {
        const musicBuf = Buffer.from(await musicResp.arrayBuffer());
        await writeFile(musicPath, musicBuf);
      }
    }

    // 4. Get video duration
    let videoDuration = 30;
    try {
      const probe = await exec("ffprobe", [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "csv=p=0",
        videoPath,
      ]);
      const parsed = parseFloat(probe.stdout.trim());
      if (isFinite(parsed) && parsed > 0) videoDuration = parsed;
    } catch {}
    const duration = Math.min(videoDuration, 119);

    // 5. Build FFmpeg command
    //
    // The approach:
    //   - Input 0: source video
    //   - Input 1: overlay PNG
    //   - Input 2 (optional): music track
    //
    // Filter graph:
    //   a) Scale + crop source video to fit the video region (cover-fit)
    //   b) Create a blank canvas at the template resolution
    //   c) Place the video into the region on the canvas
    //   d) Overlay the PNG on top (it has transparency where the video shows through)
    //
    const outputPath = join(tmpDir, "output.mp4");

    // Cover-fit: scale video so it fills regionW x regionH, then center-crop
    const scaleFilter = `scale=${regionW}:${regionH}:force_original_aspect_ratio=increase,crop=${regionW}:${regionH}`;

    // Build the filter_complex
    // [0:v] = source video → scale/crop → [vid]
    // Create blank canvas → [bg]
    // Overlay [vid] onto [bg] at regionX,regionY → [base]
    // Overlay [1:v] (PNG) onto [base] → [out]
    const filterComplex = [
      `[0:v]${scaleFilter},setsar=1[vid]`,
      `color=c=black:s=${width}x${height}:d=${duration}[bg]`,
      `[bg][vid]overlay=${regionX}:${regionY}:shortest=1[base]`,
      `[base][1:v]overlay=0:0:format=auto[out]`,
    ].join(";");

    const ffmpegArgs: string[] = [
      "-y",
      // Input 0: source video (loop if shorter than duration)
      "-stream_loop", "-1",
      "-i", videoPath,
      // Input 1: overlay PNG
      "-i", overlayPath,
    ];

    // Input 2: music (optional, loop to fill duration)
    if (musicPath) {
      ffmpegArgs.push("-stream_loop", "-1", "-i", musicPath);
    }

    ffmpegArgs.push(
      "-filter_complex", filterComplex,
      "-map", "[out]",
    );

    if (musicPath) {
      // Map audio from input 2, apply fade-out in last 2 seconds
      const fadeStart = Math.max(0, duration - 2);
      ffmpegArgs.push(
        "-map", "2:a:0",
        "-c:a", "aac",
        "-b:a", "192k",
        "-af", `afade=t=out:st=${fadeStart}:d=2`,
      );
    } else {
      ffmpegArgs.push("-an"); // no audio
    }

    ffmpegArgs.push(
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-t", String(duration),
      "-movflags", "+faststart",
      outputPath,
    );

    try {
      await exec("ffmpeg", ffmpegArgs, { timeout: 90_000 });
    } catch (ffmpegErr: any) {
      console.error("FFmpeg stderr:", ffmpegErr.stderr?.slice(-1000));
      return NextResponse.json(
        { error: "FFmpeg failed", details: ffmpegErr.stderr?.slice(-500) || ffmpegErr.message },
        { status: 500 }
      );
    }

    // 6. Return the MP4
    const outputBuf = await readFile(outputPath);

    // Cleanup
    await Promise.allSettled([
      unlink(overlayPath),
      unlink(videoPath),
      musicPath ? unlink(musicPath) : Promise.resolve(),
      unlink(outputPath),
    ]);

    return new NextResponse(outputBuf, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="listing-video.mp4"`,
        "Content-Length": String(outputBuf.length),
      },
    });
  } catch (err: any) {
    console.error("Export video API error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
