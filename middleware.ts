import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Domain constants ──────────────────────────────────────────
const MAIN_SITE_HOSTS = [
  "realestatephoto2video.com",
  "www.realestatephoto2video.com",
  "localhost",
  "127.0.0.1",
];

// Paths that are served identically on both domains (same app pages)
const SHARED_PATHS = [
  "/dashboard",
  "/lens",
  "/order",
  "/api",
  "/account",
];

// ── Helpers ───────────────────────────────────────────────────
function isMainSite(hostname: string): boolean {
  return (
    MAIN_SITE_HOSTS.some((h) => hostname.includes(h)) ||
    hostname.includes("vercel.app")
  );
}

function isP2vHomesBare(hostname: string): boolean {
  return hostname === "p2v.homes" || hostname === "www.p2v.homes";
}

function isP2vHomesSubdomain(hostname: string): boolean {
  return hostname.endsWith(".p2v.homes") && !isP2vHomesBare(hostname);
}

function isSharedPath(pathname: string): boolean {
  return SHARED_PATHS.some((p) => pathname.startsWith(p));
}

// ── Middleware ─────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ── 1. Custom domain (not p2v.homes, not main site) ──
  // Rewrite to /site/_custom/[domain]/[path] BEFORE Supabase auth
  // These are public agent sites — no auth needed
  if (!isMainSite(hostname) && !isP2vHomesBare(hostname) && !isP2vHomesSubdomain(hostname)) {
    return NextResponse.rewrite(
      new URL(`/site/_custom/${encodeURIComponent(hostname)}${pathname}`, request.url)
    );
  }

  // ── 2. [handle].p2v.homes subdomain → agent website or editor ──
  if (isP2vHomesSubdomain(hostname)) {
    const handle = hostname.split(".")[0];
    if (handle && handle !== "www") {
      // Editor routes: [handle].p2v.homes/editor/* → /editor/[handle]/*
      // Catches /editor, /editor/, and /editor/[handle]/auth-callback
      if (pathname === "/editor" || pathname === "/editor/") {
        return NextResponse.rewrite(
          new URL(`/editor/${handle}`, request.url)
        );
      }
      if (pathname.startsWith("/editor/")) {
        // e.g. /editor/mattsrealty/auth-callback → /editor/mattsrealty/auth-callback
        // The path already matches the app directory structure, just pass through
        return NextResponse.rewrite(
          new URL(pathname, request.url)
        );
      }
      // Everything else → public agent site
      return NextResponse.rewrite(
        new URL(`/site/${handle}${pathname}`, request.url)
      );
    }
  }

  // ── 3. Bare p2v.homes — portal pages ──
  if (isP2vHomesBare(hostname)) {
    // 3a. Login/signup → redirect to main site with return URL
    if (pathname === "/login" || pathname === "/signup") {
      const returnUrl =
        request.nextUrl.searchParams.get("redirect") ||
        "https://p2v.homes/dashboard";
      return NextResponse.redirect(
        new URL(
          `https://realestatephoto2video.com${pathname}?redirect=${encodeURIComponent(returnUrl)}`
        )
      );
    }

    // 3b. Shared paths → serve from main app (same pages, fall through to auth below)
    if (isSharedPath(pathname)) {
      // Don't rewrite — let the request continue to Supabase auth logic below
      // so dashboard/admin protection still works on p2v.homes
    } else {
      // 3c. Everything else → portal pages
      return NextResponse.rewrite(
        new URL(`/portal${pathname === "/" ? "" : pathname}`, request.url)
      );
    }
  }

  // ── 4. Supabase auth (runs for main site + p2v.homes shared paths) ──
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very
  // hard to debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard routes - redirect to /login if not authenticated
  if (!user && pathname.startsWith("/dashboard")) {
    // On p2v.homes, redirect to main site login with return to p2v.homes/dashboard
    if (isP2vHomesBare(hostname)) {
      return NextResponse.redirect(
        new URL(
          `https://realestatephoto2video.com/login?redirect=${encodeURIComponent(`https://p2v.homes${pathname}`)}`
        )
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Protect /admin routes - redirect to /login if not authenticated
  if (!user && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If logged in user visits /login, redirect to the redirect param or /dashboard
  // ─── SESSION 5 FIX: Handle absolute URLs (e.g. p2v.homes editor auth callback) ───
  if (user && pathname === "/login") {
    const redirectTo = request.nextUrl.searchParams.get("redirect");

    if (redirectTo && (redirectTo.startsWith("https://") || redirectTo.startsWith("http://"))) {
      // Absolute URL (cross-domain, e.g. p2v.homes editor)
      // Send through /auth/callback so it can forward session tokens
      const callbackUrl = request.nextUrl.clone();
      callbackUrl.pathname = "/auth/callback";
      callbackUrl.search = `?next=${encodeURIComponent(redirectTo)}`;
      return NextResponse.redirect(callbackUrl);
    }

    // Relative URL → same domain redirect
    const url = request.nextUrl.clone();
    url.pathname = redirectTo || "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Allow FFmpeg WASM on Design Studio + Remix (requires eval for WebAssembly)
  if (
    pathname.startsWith("/dashboard/lens/design-studio") ||
    pathname.startsWith("/dashboard/lens/remix")
  ) {
    supabaseResponse.headers.set(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://*.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://connect.facebook.net blob:; worker-src 'self' blob:; default-src 'self'; connect-src * blob:; img-src * data: blob:; media-src * blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com data:; frame-src 'self' https://accounts.google.com blob:;"
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)",
  ],
};
