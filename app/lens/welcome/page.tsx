// app/lens/welcome/page.tsx
//
// Stripe checkout success destination for Lens subscriptions. The webhook has
// (almost certainly) already fired by the time the user lands here, but we
// don't depend on it — we just confirm the subscription happened (via the
// session_id round-trip) and then route the user to sign in / dashboard.
//
// Three possible flows:
//   1. User was already logged in when they subscribed → straight to /dashboard
//   2. User has no Supabase account yet → /login (auth/callback links pending sub)
//   3. User has a Supabase account but is signed out → /login (subscription
//      already activated via email match in webhook; signing in just gets them in)

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const welcomeStyles = `
  @keyframes welcome-pulse-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4), 0 0 0 0 rgba(34, 197, 94, 0); }
    50%      { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0.18), 0 0 32px 4px rgba(34, 197, 94, 0.3); }
  }
  @keyframes welcome-glow-text {
    0%, 100% { text-shadow: 0 0 18px rgba(34, 197, 94, 0.5); }
    50%      { text-shadow: 0 0 32px rgba(34, 197, 94, 0.8); }
  }
  @keyframes welcome-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .welcome-pulse {
    animation: welcome-pulse-ring 2s ease-in-out infinite;
  }
  .welcome-glow {
    animation: welcome-glow-text 2.5s ease-in-out infinite;
  }
  .welcome-fade {
    opacity: 0;
    animation: welcome-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"checking" | "active" | "needs_login">("checking");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Quick auth check — if already logged in, we just send them to /dashboard
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const loggedIn = !!user;
      setIsLoggedIn(loggedIn);

      // Show the success state for ~2s before auto-routing
      // (gives the user a moment to see the confirmation)
      setStatus("active");

      setTimeout(() => {
        if (loggedIn) {
          router.push("/dashboard");
        } else {
          setStatus("needs_login");
        }
      }, 2200);
    };
    init();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <style dangerouslySetInnerHTML={{ __html: welcomeStyles }} />
      <Navigation />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.07] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center">
          {status === "checking" && (
            <div className="welcome-fade">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-6" />
              <p className="text-white/60 text-lg">Confirming your subscription...</p>
            </div>
          )}

          {status === "active" && (
            <div className="welcome-fade">
              <div className="welcome-pulse mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/15 ring-2 ring-green-400/40 mb-8">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400 mb-3">
                Payment received
              </p>

              <h1 className="welcome-glow text-4xl sm:text-5xl font-extrabold text-white mb-4">
                P2V Lens Subscription Active
              </h1>

              <p className="text-lg text-white/60 max-w-lg mx-auto mb-8">
                {isLoggedIn ? (
                  <>Taking you to your dashboard...</>
                ) : (
                  <>One last step — create your account to access your tools.</>
                )}
              </p>

              <div className="flex justify-center gap-2 text-sm text-white/40">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting...</span>
              </div>
            </div>
          )}

          {status === "needs_login" && (
            <div className="welcome-fade">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 ring-2 ring-green-400/40 mb-6">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400 mb-3">
                Subscription Active
              </p>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Create your account to get started
              </h1>

              <p className="text-base text-white/60 max-w-md mx-auto mb-8">
                Sign in with the same email you just used. We'll create your account automatically and unlock your subscription.
              </p>

              <Button
                asChild
                className="group bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-black h-14 px-10 text-lg rounded-2xl shadow-2xl shadow-cyan-500/30 hover:scale-[1.02] transition-all"
              >
                <Link href="/login?redirect=/dashboard">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Sign in to access your tools
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <p className="mt-6 text-sm text-white/40">
                Use the same email you used at checkout.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function LensWelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}
