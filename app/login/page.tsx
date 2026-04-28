// app/login/page.tsx
// Repo: real-estate-app-final
//
// Sign in / sign up combined page. Magic-link or Google OAuth.
// Auth flow unchanged from prior version — only visual refinements:
//   • Larger logo as focal point
//   • Subtle gradient background
//   • Stronger card presence (shadow + spacing)
//   • Bigger headline + heavier primary button

"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Subtle gradient backdrop — keeps it friendly, adds depth */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-primary/[0.06] via-primary/[0.02] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-400/[0.04] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <div className="w-20" />
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          {/* Logo as focal point */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Real Estate Photo 2 Video"
                width={240}
                height={96}
                className="h-20 sm:h-24 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-[2.75rem] font-extrabold text-foreground tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Sign in to view your videos, manage orders, and access your tools.
            </p>
          </div>

          {magicLinkSent ? (
            <div className="bg-card rounded-2xl border border-border shadow-xl shadow-foreground/[0.04] p-8 sm:p-10 text-center space-y-5">
              <div className="h-16 w-16 rounded-full bg-green-100 ring-4 ring-green-50 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
                <p className="mt-2 text-muted-foreground">
                  We sent a sign-in link to{" "}
                  <span className="font-semibold text-foreground">{email}</span>.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Don't see it? Check your spam folder.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setMagicLinkSent(false); setEmail(""); }}
                className="mt-2"
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-xl shadow-foreground/[0.04] p-7 sm:p-8 space-y-6">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl border-2 border-border font-semibold text-foreground hover:bg-muted/60 hover:border-border/80 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-card px-4 text-muted-foreground/70 font-semibold">or</span>
                </div>
              </div>

              {/* Magic Link Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="[email protected]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleMagicLink(e); }}
                    className="h-12 text-base"
                  />
                </div>
                <Button
                  onClick={handleMagicLink}
                  disabled={loading || !email.trim()}
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-5 w-5" />
                  )}
                  Send magic link
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  No password needed — we'll email you a secure sign-in link.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
                  {error}
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account? Just sign in — we'll create one for you automatically.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
