// app/auth/callback/route.ts
// Repo: real-estate-app-final
//
// Handles two scenarios:
// A) OAuth / magic-link callback: has ?code= → exchange for session, redirect with tokens
// B) Already authenticated: no ?code=, has ?next= absolute URL → get existing session, forward tokens
//
// Scenario B happens when middleware detects user is logged in at /login
// and redirects here to forward tokens to an external domain (p2v.homes).
//
// IMPORTANT: cookies set during exchangeCodeForSession must be attached to the
// redirect response, not just to the request's cookieStore — otherwise the
// browser never receives them and the session doesn't persist. We build a
// NextResponse upfront and mirror every cookie write onto it, then copy those
// cookies onto the final redirect response.
//
// NEW: After successful auth, we link any pending Lens subscription that was
// created via the email-only checkout flow. See linkPendingLensSubscription
// at the bottom of this file.

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

  // Placeholder response — cookies written here will be copied onto the
  // final redirect response so the browser actually receives Set-Cookie.
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
          // Mirror writes to both the request cookieStore (preserves existing
          // Scenario B behavior) and the response (fixes redirect cookie loss).
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // OK when redirecting to external domain
            }
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ─── Scenario A: OAuth / magic-link code exchange ───
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) {
      console.error("[auth/callback] Exchange failed:", error?.message);
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }

    // Link any pending Lens subscription to this user.
    // Best-effort — failures here should not block sign-in.
    await linkPendingLensSubscription(data.session.user.id, data.session.user.email);

    return handleRedirect(
      next,
      data.session.access_token,
      data.session.refresh_token,
      origin,
      response
    );
  }

  // ─── Scenario B: Already authenticated, forward tokens ───
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error("[auth/callback] No code and no existing session");
    return NextResponse.redirect(`${origin}/login?error=no_session`);
  }

  console.log("[auth/callback] Using existing session for token forwarding");
  return handleRedirect(
    next,
    session.access_token,
    session.refresh_token,
    origin,
    response
  );
}

// ─── Pending-subscription linker ───
// When a user signs in for the first time after subscribing to Lens via the
// email-only flow, this finds the pending row by email and activates the
// subscription on their lens_usage. Idempotent — safe to call on every sign-in.
//
// Uses service-role key (bypasses RLS on lens_pending_subscriptions, which has
// RLS enabled with no policies — server-side access only).
async function linkPendingLensSubscription(userId: string, email: string | undefined) {
  if (!email) return;

  try {
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const normalizedEmail = email.toLowerCase();

    // Find the most recent unlinked pending row for this email
    const { data: pending } = await admin
      .from("lens_pending_subscriptions")
      .select("*")
      .eq("email", normalizedEmail)
      .is("linked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pending) return;

    // Check if user is already subscribed (defense in depth — webhook
    // could have already activated via email match if user existed earlier)
    const { data: existingUsage } = await admin
      .from("lens_usage")
      .select("is_subscriber")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingUsage?.is_subscriber) {
      // Already activated via email match in webhook — just mark pending as linked
      await admin
        .from("lens_pending_subscriptions")
        .update({ linked_at: new Date().toISOString(), linked_user_id: userId })
        .eq("id", pending.id);
      console.log(`[auth/callback] Pending ${pending.id} marked linked (user already active)`);
      return;
    }

    // Activate subscription on lens_usage
    const { error: upsertError } = await admin
      .from("lens_usage")
      .upsert(
        {
          user_id: userId,
          is_subscriber: true,
          subscription_tier: pending.subscription_tier,
          subscription_plan: pending.subscription_plan,
          stripe_customer_id: pending.stripe_customer_id,
          stripe_subscription_id: pending.stripe_subscription_id,
          subscription_started_at: pending.created_at,
          subscription_renews_at: pending.subscription_renews_at,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[auth/callback] Failed to activate Lens subscription:", upsertError);
      return;
    }

    // Mark pending row as linked
    await admin
      .from("lens_pending_subscriptions")
      .update({ linked_at: new Date().toISOString(), linked_user_id: userId })
      .eq("id", pending.id);

    console.log(`[auth/callback] ✅ Linked pending Lens subscription ${pending.id} to user ${userId}`);
  } catch (err) {
    // Best-effort — never block sign-in
    console.error("[auth/callback] linkPendingLensSubscription error:", err);
  }
}

// ─── Shared redirect logic ───
// Copies any cookies written to `sourceResponse` onto the final redirect
// response so the browser receives them.
function handleRedirect(
  next: string,
  access_token: string,
  refresh_token: string,
  origin: string,
  sourceResponse: NextResponse
) {
  // Detect absolute URL (handles both raw and URL-encoded)
  const isAbsoluteUrl =
    next.startsWith("https://") ||
    next.startsWith("http://") ||
    next.startsWith("https%3A") ||
    next.startsWith("http%3A");

  let redirectResponse: NextResponse;

  if (isAbsoluteUrl) {
    let decodedNext = next;
    if (next.startsWith("https%3A") || next.startsWith("http%3A")) {
      decodedNext = decodeURIComponent(next);
    }
    console.log("[auth/callback] Absolute redirect to:", decodedNext);
    const url = new URL(decodedNext);
    url.searchParams.set("access_token", access_token);
    url.searchParams.set("refresh_token", refresh_token);
    redirectResponse = NextResponse.redirect(url.toString());
  } else {
    const redirectPath = next.startsWith("/") ? next : `/${next}`;
    console.log("[auth/callback] Relative redirect to:", `${origin}${redirectPath}`);
    redirectResponse = NextResponse.redirect(`${origin}${redirectPath}`);
  }

  // Transfer cookies from the source response (set by Supabase during
  // exchangeCodeForSession) onto the actual redirect response.
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
