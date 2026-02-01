import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-20 px-6">
      {/* --- Background Video Section --- */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40" // Adjust opacity to make text readable
        >
          <source src="/your-video.mp4" type="video/mp4" />
          {/* Replace "/your-video.mp4" with your actual video link or file path */}
        </video>
        <div className="absolute inset-0 bg-black/20" /> {/* Dark overlay for contrast */}
      </div>

      {/* --- Content Section --- */}
      <div className="max-w-4xl mx-auto relative z-10 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
          Professional Real Estate Videos
        </h1>
        
        <p className="text-xl md:text-2xl mb-10 leading-relaxed font-medium drop-shadow-md">
          Step 1: Upload your photos and put them in order. <br className="hidden md:block" />
          Step 2: Choose details like music and voiceover options. <br className="hidden md:block" />
          Step 3: Review and submit your order.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/order" passHref>
            <Button 
              size="lg" 
              className="text-xl px-10 py-7 bg-green-600 hover:bg-green-700 text-white border-none shadow-xl transition-transform hover:scale-105"
            >
              Get Started
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="text-xl px-10 py-7 bg-white/10 backdrop-blur-md text-white border-white hover:bg-white/20"
          >
            View Samples
          </Button>
        </div>
      </div>
    </section>
  );
}
