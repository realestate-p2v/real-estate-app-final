
"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  MoveHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoSection() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle the dragging logic
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
    <section id="demo" className="bg-muted py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
            The Transformation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Drag the slider to see how we turn flat listing photos into cinematic walkthroughs.
          </p>
        </div>

        {/* INTERACTIVE SLIDER CONTAINER */}
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
          {/* "After" Image (The Video Result) */}
          <div className="absolute inset-0">
            <Image
              src="/images/master-long-9.jpg" // High-end/Edited version
              alt="After Transformation"
              fill
              className="object-cover"
            />
            <div className="absolute top-4 right-6 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              After (Video Frame)
            </div>
          </div>

          {/* "Before" Image (The Original Photo) */}
          <div 
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <Image
              src="/images/front-door-2.jpg" // Raw/Original version
              alt="Before Transformation"
              fill
              className="object-cover grayscale-[0.5]"
            />
            <div className="absolute top-4 left-6 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Before (Original)
            </div>
          </div>

          {/* Slider Handle Line */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.3)] z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Handle Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-muted">
              <MoveHorizontal className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* THE MEGA GREEN BUTTON FOOTER */}
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

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5 text-[#FFDADA]" />
              100% Satisfaction
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider">
              <Clock className="h-5 w-5 text-[#FFDADA]" />
              Fast 72h Delivery
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-5 w-5 text-[#FFDADA]" />
              Secure Checkout
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
