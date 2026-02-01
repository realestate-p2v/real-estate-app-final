import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden py-20 px-6">
      {/* 1. The Background Video */}
      <div className="absolute inset-0 z-0 bg-white">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30"
        >
          <source src="/p2v-website-her-vid.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 2. The Content Layer */}
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          Professional Real Estate Videos
        </h1>
        
        <div className="text-xl md:text-2xl text-gray-800 mb-10 space-y-2 font-medium">
          <p>Step 1: Upload your photos and put them in order.</p>
          <p>Step 2: Choose details like music and voiceover options.</p>
          <p>Step 3: Review and submit your order.</p>
        </div>

        {/* 3. The Green Button linked to /order */}
        <div className="flex justify-center">
          <Link href="/order" passHref>
            <Button 
              size="lg" 
              className="text-xl px-10 py-7 bg-green-600 hover:bg-green-700 text-white shadow-xl transition-transform hover:scale-105"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
