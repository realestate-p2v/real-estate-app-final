import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-20 px-6">
      {/* 1. Background Video with Optimized Overlay */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/p2v-website-her-vid.mp4" type="video/mp4" />
        </video>
        {/* The Black Overlay: Adjusted to 50% for high contrast without being "too dark" */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* 2. Content Layer */}
      <div className="max-w-5xl mx-auto relative z-10 text-center">
        {/* Mosaic/Attention-Grabbing Headline */}
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-4 text-white leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400">
            Turn your Listing Photos into
          </span>
          <br />
          Professional Real Estate Videos
        </h1>
        
        {/* The 3 Steps: Re-imagined as a clean, horizontal flow for better UI */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-white/90 my-10 text-lg font-medium">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">1</span>
            Upload & Order
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">2</span>
            Choose Details
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">3</span>
            Review & Submit
          </div>
        </div>

        {/* The High-Conversion Green CTA */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/order" passHref>
            <Button 
              size="lg" 
              className="text-xl px-12 py-8 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold"
            >
              Get Started Now
            </Button>
          </Link>
          
          <p className="text-white/60 text-sm font-medium">
            HD Video Delivered within 72 Hours
          </p>
        </div>
      </div>

      {/* Subtle bottom fade for a smoother transition to the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </section>
  );
}
