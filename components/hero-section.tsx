"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
  Sparkles,
  Camera,
  PenTool,
  FileText,
} from "lucide-react";

export function HeroSection() {
  const [activeHero, setActiveHero] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextHero = useCallback(() => {
    setActiveHero((prev) => (prev === 0 ? 1 : 0));
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextHero, 10000);
    return () => clearInterval(interval);
  }, [isPaused, nextHero]);

  return (
    <section
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Shared Background Video */}
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

      {/* Hero 1: Photo 2 Video */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center py-20 px-6 transition-opacity duration-1000 ease-in-out ${
          activeHero === 0
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-7xl font-extrabold tracking-tight mb-4 text-white leading-tight px-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-yellow-300 to-cyan-400">
              Turn your Listing Photos into
            </span>
            <br />
            Professional Real Estate Videos
          </h1>

          <div className="bg-primary/5 border border-primary/20 rounded-xl px-6 py-3 text-center max-w-xl mx-auto mt-6">
            <p className="text-lg font-bold text-white">
              Listings with video get{" "}
              <span className="text-green-300">400% more inquiries</span>
            </p>
            <p className="text-xs text-white mt-1">
              — National Association of Realtors
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-white/90 my-10 text-lg font-medium">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">
                1
              </span>
              Upload Photos
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">
                2
              </span>
              Choose Details
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">
                3
              </span>
              Review & Submit
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <Link href="/order" passHref>
              <Button
                size="lg"
                className="group text-xl px-10 py-9 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
              >
                <span className="text-xs uppercase tracking-widest opacity-90 mb-1 font-black">
                  Limited Time Offer
                </span>
                <div className="flex items-center gap-3">
                  <span>Create My Listing Video</span>
                  <span className="flex items-center">
                    <span className="line-through text-white/50 text-base mr-2 font-medium">
                      $119
                    </span>
                    <span className="text-2xl">$79</span>
                  </span>
                </div>
              </Button>
            </Link>

            <div className="flex flex-wrap justify-center items-center gap-6 text-white/70">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>100% Satisfaction Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-5 h-5 text-green-400" />
                <span>Guaranteed Under 12h Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-5 h-5 text-green-400" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero 2: P2V Lens */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center py-20 px-6 transition-opacity duration-1000 ease-in-out ${
          activeHero === 1
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            NEW
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-7xl font-extrabold tracking-tight mb-4 text-white leading-tight px-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-yellow-300 to-cyan-400">
              Introducing P2V Lens
            </span>
            <br />
            Your AI-Powered Marketing Suite
          </h1>

          <div className="bg-primary/5 border border-primary/20 rounded-xl px-6 py-3 text-center max-w-xl mx-auto mt-6">
            <p className="text-lg font-bold text-white">
              Professional photos sell{" "}
              <span className="text-green-300">32% faster</span>
            </p>
            <p className="text-xs text-white mt-1">
              — Real Estate Staging Association
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-white/90 my-10 text-lg font-medium">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">
                <Camera className="w-4 h-4" />
              </span>
              AI Photo Coach
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">
                <PenTool className="w-4 h-4" />
              </span>
              AI Design Studio
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold border border-white/30">
                <FileText className="w-4 h-4" />
              </span>
              AI Description Writer
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <Link href="/lens" passHref>
              <Button
                size="lg"
                className="group text-xl px-10 py-9 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 rounded-full font-bold flex flex-col items-center justify-center border-none"
              >
                <span className="text-xs uppercase tracking-widest opacity-90 mb-1 font-black">
                  AI-Powered Tools
                </span>
                <div className="flex items-center gap-3">
                  <span>Explore P2V Lens</span>
                  <span className="text-2xl">$27.95/mo</span>
                </div>
              </Button>
            </Link>

            <div className="flex flex-wrap justify-center items-center gap-6 text-white/70">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Camera className="w-5 h-5 text-green-400" />
                <span>200 Analyses/Month</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <button
          onClick={() => setActiveHero(0)}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            activeHero === 0
              ? "bg-white scale-125"
              : "bg-white/40 hover:bg-white/60"
          }`}
          aria-label="Show Photo 2 Video"
        />
        <button
          onClick={() => setActiveHero(1)}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            activeHero === 1
              ? "bg-white scale-125"
              : "bg-white/40 hover:bg-white/60"
          }`}
          aria-label="Show P2V Lens"
        />
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-50 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-0" />
    </section>
  );
}
