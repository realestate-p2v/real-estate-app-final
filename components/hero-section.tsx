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
        
        {/* The 3 Steps */}
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

        {/* The High-Conversion Green CTA with Dynamic Pricing */}
        <div className="flex flex-col justify-center items-center gap-6">
          <Link href="/order" passHref>
            <Button 
              size="lg" 
              className="group text-xl px-10 py-9 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center"
            >
              <span className="text-xs uppercase tracking-widest opacity-90 mb-1 font-black">Limited Time Offer</span>
              <div className="flex items-center gap-3">
                <span>Get Started Now —</span>
                <span className="flex items-center">
                  <span className="line-through text-white/50 text-base mr-2 font-medium">$149</span>
                  <span className="text-2xl">$79</span>
                </span>
              </div>
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 text-white/70 text-sm font-semibold uppercase tracking-tighter">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            HD Video Delivered within 72 Hours
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </section>
  );
}
