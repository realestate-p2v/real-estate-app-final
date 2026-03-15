import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const perPage = searchParams.get("per_page") || "12";

    if (!query) {
      return NextResponse.json({ success: false, error: "Search query required" }, { status: 400 });
    }

    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    if (!PEXELS_API_KEY) {
      return NextResponse.json({ success: false, error: "Pexels API key not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_API_KEY },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    const images = (data.photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x || photo.src.large,
      medium: photo.src.medium,
      small: photo.src.small,
      thumbnail: photo.src.tiny,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      width: photo.width,
      height: photo.height,
    }));

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("[Blog Images] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to search images" }, { status: 500 });
  }
}
