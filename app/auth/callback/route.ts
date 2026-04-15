// app/auth/callback/route.ts
// Repo: realestatephoto2video.com (main app)
//
// Handles the OAuth callback from Supabase/Google.
// Reads `next` query param to determine where to redirect after auth.
// If `next` is an absolute URL (p2v.homes editor), forwards tokens as query params.
// If `next` is relative (dashboard), sets cookie and redirects normally.

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
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
    console.error("Auth callback error:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const { access_token, refresh_token } = data.session;

  // ─── Absolute URL: forward tokens to external domain (p2v.homes) ───
  if (next.startsWith("https://") || next.startsWith("http://")) {
    const url = new URL(next);
    url.searchParams.set("access_token", access_token);
    url.searchParams.set("refresh_token", refresh_token);
    return NextResponse.redirect(url.toString());
  }

  // ─── Relative URL: same domain, cookie already set ───
  return NextResponse.redirect(`${origin}${next}`);
}
