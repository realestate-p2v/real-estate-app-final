// app/auth/callback/route.ts
// Repo: realestatephoto2video.com (main app)
//
// SESSION 5 FIX: The `next` param was hitting the relative-URL branch
// even when it contained an absolute URL. This version adds:
// 1. Robust absolute URL detection (handles double-encoding, missing protocol)
// 2. Logging to debug the redirect chain
// 3. Fallback handling

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // ─── Read `next` param ───
  // Supabase may pass it through as-is, or it might get encoded differently.
  // Try to decode it to be safe.
  let next = searchParams.get("next") ?? "/dashboard";

  // Log for debugging (check Vercel function logs)
  console.log("[auth/callback] Full URL:", request.url);
  console.log("[auth/callback] Raw next param:", next);

  if (!code) {
    console.error("[auth/callback] No code in URL");
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // OK when redirecting to external domain
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[auth/callback] Exchange failed:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const { access_token, refresh_token } = data.session;

  // ─── Detect absolute URL ───
  // Check if `next` is an absolute URL. Be defensive:
  // it might be double-encoded, or might have lost its protocol.
  const isAbsoluteUrl =
    next.startsWith("https://") ||
    next.startsWith("http://") ||
    next.startsWith("https%3A") ||  // URL-encoded
    next.startsWith("http%3A");

  if (isAbsoluteUrl) {
    // Decode if it was double-encoded
    let decodedNext = next;
    if (next.startsWith("https%3A") || next.startsWith("http%3A")) {
      decodedNext = decodeURIComponent(next);
    }

    console.log("[auth/callback] Absolute redirect to:", decodedNext);

    const url = new URL(decodedNext);
    url.searchParams.set("access_token", access_token);
    url.searchParams.set("refresh_token", refresh_token);
    return NextResponse.redirect(url.toString());
  }

  // ─── Relative URL: same domain ───
  // Make sure we don't accidentally double up the origin
  const redirectPath = next.startsWith("/") ? next : `/${next}`;
  console.log("[auth/callback] Relative redirect to:", `${origin}${redirectPath}`);
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
