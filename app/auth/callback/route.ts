// app/auth/callback/route.ts
// Repo: real-estate-app-final
//
// Handles two scenarios:
// A) OAuth callback: has ?code= → exchange for session, redirect with tokens
// B) Already authenticated: no ?code=, has ?next= absolute URL → get existing session, forward tokens
//
// Scenario B happens when middleware detects user is logged in at /login
// and redirects here to forward tokens to an external domain (p2v.homes).

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[auth/callback] Full URL:", request.url);
  console.log("[auth/callback] code:", code ? "present" : "missing");
  console.log("[auth/callback] next:", next);

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

  // ─── Scenario A: OAuth code exchange ───
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      console.error("[auth/callback] Exchange failed:", error?.message);
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }

    return handleRedirect(next, data.session.access_token, data.session.refresh_token, origin);
  }

  // ─── Scenario B: Already authenticated, forward tokens ───
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error("[auth/callback] No code and no existing session");
    return NextResponse.redirect(`${origin}/login?error=no_session`);
  }

  console.log("[auth/callback] Using existing session for token forwarding");
  return handleRedirect(next, session.access_token, session.refresh_token, origin);
}

// ─── Shared redirect logic ───
function handleRedirect(next: string, access_token: string, refresh_token: string, origin: string) {
  // Detect absolute URL (handles both raw and URL-encoded)
  const isAbsoluteUrl =
    next.startsWith("https://") ||
    next.startsWith("http://") ||
    next.startsWith("https%3A") ||
    next.startsWith("http%3A");

  if (isAbsoluteUrl) {
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

  // Relative URL
  const redirectPath = next.startsWith("/") ? next : `/${next}`;
  console.log("[auth/callback] Relative redirect to:", `${origin}${redirectPath}`);
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
