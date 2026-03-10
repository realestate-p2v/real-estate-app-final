import { NextResponse } from "next/server";

const SUNO_API_URL = "https://apibox.erweima.ai/api/v1/generate";
const SUNO_POLL_URL = "https://apibox.erweima.ai/api/v1/generate/record-info";

const VIBE_PROMPTS: Record<string, { style: string; title: string }> = {
  upbeat_modern: {
    style: "upbeat happy modern pop instrumental, energetic bright professional real estate background",
    title: "Upbeat Modern",
  },
  chill_tropical: {
    style: "mellow relaxed tropical instrumental, soft warm breezy island vibes real estate background",
    title: "Chill Tropical",
  },
  energetic_pop: {
    style: "energetic driving pop electronic instrumental, bold confident dynamic real estate background",
    title: "Energetic Pop",
  },
  elegant_classical: {
    style: "elegant calm classical piano instrumental, sophisticated refined gentle real estate background",
    title: "Elegant Classical",
  },
  warm_acoustic: {
    style: "warm happy acoustic guitar instrumental, friendly inviting organic real estate background",
    title: "Warm Acoustic",
  },
  bold_cinematic: {
    style: "bold cinematic orchestral instrumental, dramatic sweeping grand real estate background",
    title: "Bold Cinematic",
  },
  funky_groove: {
    style: "funky groovy instrumental, confident cool rhythmic bass-driven real estate background",
    title: "Funky Groove",
  },
  smooth_jazz: {
    style: "smooth jazz instrumental, relaxed sophisticated lounge real estate background",
    title: "Smooth Jazz",
  },
};

// POST — Start generation (fires 2 Suno calls = 4 tracks)
export async function POST(req: Request) {
  try {
    const { vibe, photoCount } = await req.json();

    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 });
    }

    const vibeConfig = VIBE_PROMPTS[vibe] || VIBE_PROMPTS.upbeat_modern;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://realestatephoto2video.com"}/api/suno-callback`;

    // Fire 2 generation requests (each returns 2 tracks = 4 total)
    const results = await Promise.all(
      [1, 2].map(async (n) => {
        const resp = await fetch(SUNO_API_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({
            customMode: true,
            instrumental: true,
            style: vibeConfig.style,
            title: `${vibeConfig.title} ${n}`,
            model: "V4",
            callBackUrl: callbackUrl,
          }),
        });
        const data = await resp.json();
        if (data.code !== 200) {
          console.error("[generate-music] Suno error:", data);
          return null;
        }
        return data.data.taskId;
      })
    );

    const taskIds = results.filter(Boolean) as string[];

    if (taskIds.length === 0) {
      return NextResponse.json({ error: "Failed to start music generation" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      taskIds,
      vibe,
      photoCount,
    });
  } catch (error) {
    console.error("[generate-music] Error:", error);
    return NextResponse.json({ error: "Music generation failed" }, { status: 500 });
  }
}

// GET — Poll for results
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskIds = searchParams.get("taskIds")?.split(",") || [];

    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 });
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    const results = await Promise.all(
      taskIds.map(async (taskId) => {
        const resp = await fetch(`${SUNO_POLL_URL}?taskId=${taskId}`, { headers });
        const data = await resp.json();
        if (data.code !== 200) return { taskId, status: "error", tracks: [] };

        const taskData = data.data;
        const status = taskData.status;

        if (status === "SUCCESS" && taskData.response?.sunoData) {
          const tracks = taskData.response.sunoData.map((track: any) => ({
            id: track.id,
            audioUrl: track.audioUrl,
            streamUrl: track.streamAudioUrl,
            title: track.title,
            duration: track.duration,
            imageUrl: track.imageUrl,
          }));
          return { taskId, status: "complete", tracks };
        }

        if (status.includes("FAILED")) {
          return { taskId, status: "failed", error: taskData.errorMessage, tracks: [] };
        }

        return { taskId, status: "pending", tracks: [] };
      })
    );

    const allComplete = results.every((r) => r.status === "complete" || r.status === "failed");
    const allTracks = results.flatMap((r) => r.tracks);

    return NextResponse.json({
      complete: allComplete,
      tracks: allTracks,
      results,
    });
  } catch (error) {
    console.error("[generate-music] Poll error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
