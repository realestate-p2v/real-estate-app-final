"use client"

import React from "react"
import { Sparkles, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SaleBanner() {
  // Helper function for smooth scrolling
  const scrollToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("order-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="px-2 py-4 md:px-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto relative overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-blue-400/30 shadow-2xl bg-slate-900">
        
        {/* 1. Background Video Layer */}
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
          {/* Tint Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/90 via-slate-900/70 to-slate-800/90" />
        </div>
        
        {/* 2. Content Layer */}
        <div className="max-w-6xl mx-auto flex flex-col gap-6 md:gap-10 relative z-10 py-6 px-4 md:py-10 md:px-6">
          
          {/* Coupon Badge */}
          <div className="flex justify-center -mt-2 md:-mt-4">
            <div className="bg-blue-400 text-slate-900 px-4 py-2 md:px-8 md:py-2.5 rounded-full shadow-[0_0_25px_rgba(52,211,153,0.5)] flex items-center gap-2 animate-bounce border-2 border-white/30">
              <Tag className="w-4 h-4 md:w-5 md:h-5 fill-slate-900" />
              <span className="text-[10px] md:text-base font-black uppercase tracking-wider leading-tight">
                Use promo code <span className="font-black text-emerald-800 text-lg">p2v</span> for extra <span className="whitespace-nowrap">$30 off!</span>
              </span>
            </div>
          </div>

          {/* Title Row */}
          <div className="flex flex-col items-center justify-center gap-3 md:gap-6">
            <Badge className="bg-emerald-500 text-white text-[10px] md:text-[14px] px-3 py-1 md:px-5 md:py-2 font-black tracking-widest rounded-lg shadow-lg border border-emerald-400">
              OFFER ACTIVE
            </Badge>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase italic drop-shadow-lg text-center">
              Exclusive <span className="text-emerald-400">February</span> Pricing
            </h2>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            
            {/* Standard Tier */}
            <a 
              href="#order-form" 
              onClick={scrollToForm}
              className="flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/10 transition-all hover:bg-slate-900/60 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg"
            >
              <span className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Standard</span>
              <div className="flex items-center gap-3 mb-2 md:mb-4">
                <span className="text-base md:text-lg text-slate-300 font-black line-through decoration-emerald-500/50 decoration-2">$149</span>
                <span className="text-white text-3xl md:text-4xl font-black drop-shadow-[0_0_12px_rgba(52,211,153,0.9)] tracking-tighter">$79</span>
              </div>
              
              <div className="flex flex-col gap-1 md:gap-2 text-center">
                <p className="text-[11px] md:text-[13px] font-bold text-white uppercase tracking-wide">Up to 15 HD clips</p>
                <div className="h-px w-8 bg-emerald-500/30 mx-auto my-1" />
                <ul className="text-[10px] md:text-[12px] space-y-1 text-slate-200 font-bold opacity-90">
                  <li>24 hour turnaround</li>
                  <li>Photo Enhancement</li>
                  <li>Choice of music</li>
                  <li>Free Branding</li>
                  <li>1 revision</li>
                </ul>
              </div>
            </a>

            {/* Premium Tier */}
            <a 
              href="#order-form" 
              onClick={scrollToForm}
              className="flex flex-col items-center p-5 md:p-6 rounded-2xl md:rounded-3xl bg-blue-500/20 backdrop-blur-md border-2 border-emerald-400/50 transition-all hover:bg-blue-500/30 hover:scale-[1.07] active:scale-95 cursor-pointer shadow-2xl relative md:scale-105 z-20"
            >
              <div className="absolute -top-3 bg-emerald-400 text-slate-900 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Most Popular</div>
              <span className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Premium</span>
              <div className="flex items-center gap-3 mb-2 md:mb-4">
                <span className="text-base md:text-lg text-slate-300 font-black line-through decoration-emerald-500/50 decoration-2">$199</span>
                <span className="text-white text-3xl md:text-4xl font-black drop-shadow-[0_0_12px_rgba(52,211,153,0.9)] tracking-tighter">$129</span>
              </div>
              
              <div className="flex flex-col gap-1 md:gap-2 text-center">
                <p className="text-[11px] md:text-[13px] font-bold text-white uppercase tracking-wide">Up to 25 HD clips</p>
                <div className="h-px w-8 bg-emerald-500/30 mx-auto my-1" />
                <ul className="text-[10px] md:text-[12px] space-y-1 text-slate-100 font-bold">
                  <li>24 hour turnaround</li>
                  <li>Photo Enhancement</li>
                  <li>Choice of music</li>
                  <li>Free Branding</li>
                  <li>1 revision</li>
                </ul>
              </div>
            </a>

            {/* Professional Tier */}
            <a 
              href="#order-form" 
              onClick={scrollToForm}
              className="flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/10 transition-all hover:bg-slate-900/60 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg"
            >
              <span className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Professional</span>
              <div className="flex items-center gap-3 mb-2 md:mb-4">
                <span className="text-base md:text-lg text-slate-300 font-black line-through decoration-emerald-500/50 decoration-2">$249</span>
                <span className="text-white text-3xl md:text-4xl font-black drop-shadow-[0_0_12px_rgba(52,211,153,0.9)] tracking-tighter">$179</span>
              </div>
              
              <div className="flex flex-col gap-1 md:gap-2 text-center">
                <p className="text-[11px] md:text-[13px] font-bold text-white uppercase tracking-wide">Up to 35 HD clips</p>
                <div className="h-px w-8 bg-emerald-500/30 mx-auto my-1" />
                <ul className="text-[10px] md:text-[12px] space-y-1 text-slate-200 font-bold opacity-90">
                  <li>24 hour turnaround</li>
                  <li>Photo Enhancement</li>
                  <li>Choice of music</li>
                  <li>Free Branding</li>
                  <li>2 revisions</li>
                </ul>
              </div>
            </a>

          </div>
        </div>
      </div>
    </div>
  )
}
