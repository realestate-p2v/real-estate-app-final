import { NextResponse } from "next/server";

const MUSIC_SERVER = "http://134.209.39.83:5000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resp = await fetch(`${MUSIC_SERVER}/api/music/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await resp.json());
  } catch (error) {
    return NextResponse.json({ error: "Music generation failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const library = searchParams.get("library");
    const vibe = searchParams.get("vibe") || "";

    if (library === "true") {
      const resp = await fetch(`${MUSIC_SERVER}/api/music/library?vibe=${vibe}`);
      return NextResponse.json(await resp.json());
    }
    if (sessionId) {
      const resp = await fetch(`${MUSIC_SERVER}/api/music/status?sessionId=${sessionId}`);
      return NextResponse.json(await resp.json());
    }
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
