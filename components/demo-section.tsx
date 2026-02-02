"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Images, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  MoveHorizontal 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const listingPhotos = [
  { src: "/images/drone-1.jpg", alt: "Exterior drone view at sunset" },
  { src: "/images/front-door-2.jpg", alt: "Entry foyer with stairway" },
  { src: "/images/library-3.jpg", alt: "Library with built-in bookshelves" },
  { src: "/images/tv-room-4.jpg", alt: "Living room with fireplace" },
  { src: "/images/dining-5.jpg", alt: "Formal dining room" },
  { src: "/images/kitchen-6.jpg", alt: "Kitchen with island" },
  { src: "/images/dining-7.jpg", alt: "Breakfast nook" },
  { src: "/images/stairway-8.jpg", alt: "Stairway" },
  { src: "/images/master-long-9.jpg", alt: "Master bedroom" },
];

export function DemoSection() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slider Logic
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX);
  const onTouchMove = (e: TouchEvent) => isDragging && handleMove(e.touches[0].clientX);

  return (
    <section id="demo" className="bg-muted py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* 1. Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-foreground text-balance tracking-tight">
            See the Transformation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From a collection of listing photos to a professional walkthrough video
          </p>
        </div>

        {/* 2. Comparison Grid */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-center mb-20">
          <div className="w-full">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Images className="h-6 w-6 text-primary" />
                <span className="font-semibold text-foreground">Your Listing Photos</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {listingPhotos.map((photo, i) => (
                  <div key={i} className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    <Image
                      src={photo.src || "/placeholder.svg"}
                      alt={photo.alt}
                      width={200}
                      height={150}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="bg-secondary rounded-full p-3 md:p-4">
              <ArrowRight className="h-6 w-6 md:h-8 md:w-8 text-secondary-foreground rotate-90 md:rotate-0" />
            </div>
          </div>

          <div className="w-full">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Play className="h-6 w-6 text-accent" />
                <span className="font-semibold text-foreground">Your HD Walkthrough Video</span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-foreground/5">
                <iframe 
                  width="100%" height="100%" 
                  src="https://www.youtube.com/embed/3jdoPBu7hVo?si=ZQxY9Ow2nF_n6k2q" 
                  title="YouTube video player" frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE SLIDER (The "Dragging Thing") */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-foreground">Interactive Side-by-Side</h3>
          <p className="text-sm text-muted-foreground">Drag the handle to compare raw photo vs. video frame</p>
        </div>

        <div 
          ref={containerRef}
          className="relative aspect-video w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl cursor-ew-resize select-none border-4 border-white"
          onMouseMove={onMouseMove}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={onTouchMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* After Image */}
          <div className="absolute inset-0">
            <Image
              src="/images/master-long-9.jpg" 
              alt="After Transformation"
              fill
              className="object-cover"
            />
            <div className="absolute top-4 right-6 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              After (Video)
            </div>
          </div>

          {/* Before Image */}
          <div 
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <Image
              src="/images/kitchen-6.jpg" 
              alt="Before Transformation"
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-6 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Before (Photo)
            </div>
          </div>

          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.3)] z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-muted">
              <MoveHorizontal className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* 4. MEGA GREEN BUTTON INTEGRATION */}
        <div className="mt-20 flex flex-col items-center gap-6">
          <Button
            asChild
            size="lg"
            className="group bg-[#22c55e] hover:bg-[#16a34a] text-white text-xl md:text-2xl px-12 py-10 md:py-12 rounded-2xl shadow-[0_20px_50px_rgba(34,197,94,0.3)] hover:shadow-[0_20px_50px_rgba(34,197,94,0.5)] transition-all duration-300 hover:-translate-y-1 active:scale-95 w-full md:w-auto font-black italic"
          >
            <Link href="/order" className="flex items-center justify-center gap-3">
              GET STARTED NOW — <span className="line-through opacity-60 font-normal">$149</span> $79
              <ArrowRight className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5 text-[#FFDADA] drop-shadow-sm" />
              100% Satisfaction
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider">
              <Clock className="h-5 w-5 text-[#FFDADA] drop-shadow-sm" />
              Fast 72h Delivery
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-5 w-5 text-[#FFDADA] drop-shadow-sm" />
              Secure Checkout
            </div>
          </div>

          <p className="mt-4 text-muted-foreground/60 text-xs text-center">
            No subscription required. One-time payment per listing.
          </p>
        </div>
      </div>
    </section>
  );
}
