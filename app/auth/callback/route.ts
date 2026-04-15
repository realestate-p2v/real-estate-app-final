// app/auth/callback/route.ts
// Repo: realestatephoto2video.com (main app)
//
// PURPOSE: Handles OAuth callback from Google/magic link.
// KEY CHANGE (Session 4): When `next` param is an absolute URL
// (e.g. https://mattsrealty.p2v.homes/editor/auth-callback),
// forward access_token + refresh_token as query params instead
// of setting a cookie (because the cookie domain won't match).

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    // No code present — redirect to login with error
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
            // Cookies can't be set in some contexts — that's OK
            // when we're redirecting to an external domain anyway
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

  // ─── KEY LOGIC: Absolute URL detection ───
  // If `next` is an absolute URL (starts with http:// or https://),
  // the target is on a different domain (e.g. p2v.homes subdomain).
  // We can't set cookies for that domain, so forward tokens as query params.
  if (next.startsWith("https://") || next.startsWith("http://")) {
    const url = new URL(next);
    url.searchParams.set("access_token", access_token);
    url.searchParams.set("refresh_token", refresh_token);
    return NextResponse.redirect(url.toString());
  }

  // ─── Standard flow: relative URL, same domain ───
  // Cookie was already set by the SSR client above.
  return NextResponse.redirect(`${origin}${next}`);
}
