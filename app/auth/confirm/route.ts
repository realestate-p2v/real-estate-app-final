// app/auth/confirm/route.ts
// Repo: real-estate-app-final
//
// Server-side magic-link / email-OTP verification endpoint.
//
// Why this exists: Supabase's default `action_link` from `auth.admin.generate_link`
// returns tokens in the URL hash fragment (implicit flow), which never reaches
// the server and doesn't persist a session via cookies. This route implements
// the PKCE-compatible server verification flow documented at
// https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
//
// Flow:
//   1. Sender (e.g. delivery_email.py) builds URL:
//      /auth/confirm?token_hash=<hashed_token>&type=magiclink&next=<path>
//   2. User clicks, this route runs verifyOtp server-side
//   3. Supabase SSR client writes session cookies onto the response
//   4. We redirect the (now authenticated) user to `next`
//
// Cookies must be attached to the redirect response — same pattern as
// /auth/callback/route.ts.

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[auth/confirm] token_hash:", token_hash ? "present" : "missing");
  console.log("[auth/confirm] type:", type);
  console.log("[auth/confirm] next:", next);

  if (!token_hash || !type) {
    console.error("[auth/confirm] Missing token_hash or type");
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // Placeholder response — cookies written by Supabase during verifyOtp are
  // mirrored here, then copied onto the redirect response so the browser
  // actually receives Set-Cookie.
  const response = NextResponse.next();

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
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // OK — cookieStore.set may throw in some contexts
            }
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error("[auth/confirm] verifyOtp failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=verify_failed&next=${encodeURIComponent(next)}`
    );
  }

  // Build redirect — only allow relative paths, never absolute URLs, to
  // prevent open-redirect abuse.
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  console.log("[auth/confirm] Redirecting to:", `${origin}${safeNext}`);
  const redirectResponse = NextResponse.redirect(`${origin}${safeNext}`);

  // Transfer session cookies onto the redirect response
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
