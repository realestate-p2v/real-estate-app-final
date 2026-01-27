import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Hero Content with Video Background */}
      <div className="relative min-h-[500px] md:min-h-[600px] flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source
              src="https://videos.pexels.com/video-files/7578554/7578554-uhd_2560_1440_30fps.mp4"
              type="video/mp4"
            />
          </video>
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-foreground/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl text-balance">
              Transform Your Listing Photos Into{" "}
              <span className="text-secondary">Stunning Walkthrough Videos</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl text-pretty">
              Perfect for social media, YouTube, and client presentations.
              Professional HD walkthrough videos from your existing photos,
              delivered in just 72 hours.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6"
              >
                <Link href="/order">
                  Order Now - Starting at <span className="line-through opacity-70 mx-1">$149</span> $99
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-foreground bg-white/10"
              >
                <a href="#demo">
                  <Play className="mr-2 h-5 w-5" />
                  View Sample
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
