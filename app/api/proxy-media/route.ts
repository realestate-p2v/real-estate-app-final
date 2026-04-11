import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  if (!url.includes("cloudinary.com") && !url.includes("res.cloudinary.com")) {
    return NextResponse.json({ error: "Only Cloudinary URLs allowed" }, { status: 403 });
  }
  try {
    const resp = await fetch(url);
    if (!resp.ok) return NextResponse.json({ error: `Upstream ${resp.status}` }, { status: resp.status });
    const buffer = await resp.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "application/octet-stream",
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
