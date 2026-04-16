// ============================================================
// FILE: app/api/websites/blog/images/route.ts
// ============================================================
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    return data.user;
  }
  const { createServerClient } = await import("@supabase/ssr");
  const cookieSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data } = await cookieSupabase.auth.getUser();
  return data.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);

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
    console.error("[Agent Blog Images] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to search images" }, { status: 500 });
  }
}

// CORS preflight for cross-domain editor
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
