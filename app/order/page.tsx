import Image from "next/image";
import Link from "next/link";
import { OrderForm } from "@/components/order-form";
import { ArrowLeft, Crown, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Order Your Video | Real Estate Photo 2 Video",
  description:
    "Upload your listing photos, select music, and order your professional walkthrough video. Fast 24-hour delivery.",
};

export default async function OrderPage() {
  // Check subscriber status server-side so we can swap the banner
  let isSubscriber = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber")
        .eq("user_id", user.id)
        .single();
      isSubscriber = !!usage?.is_subscriber;
    }
  } catch {
    // If anything fails, fall back to treating as non-subscriber (shows sale banner)
    isSubscriber = false;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Real Estate Photo 2 Video"
                width={120}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* New marketing header — replaces the old EXCLUSIVE PRICING tier banner */}
        <div className="mx-auto max-w-3xl text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Upload your photos. We'll handle the rest.
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed">
            Cinematic real estate walkthroughs in minutes + free remixes of your clips for social posts for IG, TikTok, YouTube Shorts, and more.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/80">
            <span className="font-semibold text-foreground/70">$4 per clip</span>
            <span className="mx-2">·</span>
            <span>1 free revision</span>
            <span className="mx-2">·</span>
            <span>Clips ready for our AI Tools Suite</span>
          </p>
        </div>

        {/* Subscriber gets a Lens perks pill; non-subscribers see no banner — pricing speaks for itself */}
        {isSubscriber && (
          <div className="mb-6 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-400/10 to-indigo-400/10 px-5 py-2.5 backdrop-blur-sm shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/20 ring-1 ring-cyan-400/40">
                <Crown className="h-3.5 w-3.5 text-cyan-500" />
              </div>
              <div className="text-sm">
                <span className="font-bold text-cyan-700 dark:text-cyan-300">Lens Subscriber Perk:</span>{" "}
                <span className="font-semibold text-foreground/80">10% off every video</span>
                <span className="hidden sm:inline text-muted-foreground">
                  {" "}· applied at checkout
                </span>
              </div>
              <Sparkles className="h-4 w-4 text-cyan-500/70" />
            </div>
          </div>
        )}

        <OrderForm />
      </div>
    </main>
  );
}
