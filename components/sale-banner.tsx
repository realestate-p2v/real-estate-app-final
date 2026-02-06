"use client"

import React from "react"
import { Sparkles, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SaleBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-orange-500 via-indigo-600 to-blue-700 text-white py-6 px-4 relative overflow-hidden border-b-2 border-orange-400">
      {/* Decorative background flare */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* New Stand-out Badge Row */}
        <div className="flex justify-center -mt-2">
          <div className="bg-white text-indigo-700 px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce border-2 border-orange-300">
            <Tag className="w-4 h-4 fill-indigo-700" />
            <span className="text-xs md:text-sm font-black uppercase tracking-tight">
              Combine with coupon code for more savings!
            </span>
          </div>
        </div>

        {/* Top Row: Title & Save Info */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-400 hover:bg-orange-500 text-white text-[12px] px-3 py-1 font-black tracking-tighter rounded-md shadow-md">
              SALE IS LIVE
            </Badge>
            <span className="text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-md">
              Exclusive Seasonal Pricing
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-orange-300" />
            <span className="text-xs font-black text-white uppercase tracking-[0.15em]">
              Save $70 On Every Tier
            </span>
          </div>
        </div>

        {/* Bottom Row: Pricing & Details */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-200 md:mr-8">
            Includes
          </span>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 font-bold uppercase tracking-widest">
            {/* Standard */}
            <div className="flex flex-col items-center md:items-start group">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white font-bold line-through decoration-orange-400 decoration-2 opacity-100">$149</span>
                <span className="text-white text-xl md:text-2xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">$79 STANDARD</span>
              </div>
              <span className="text-xs font-black normal-case tracking-wider text-orange-100 mt-1">Up to 12 clips</span>
            </div>

            <div className="w-px h-10 bg-white/30 hidden md:block self-center" />

            {/* Premium */}
            <div className="flex flex-col items-center md:items-start group">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white font-bold line-through decoration-orange-400 decoration-2 opacity-100">$199</span>
                <span className="text-white text-xl md:text-2xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">$129 PREMIUM</span>
              </div>
              <span className="text-xs font-black normal-case tracking-wider text-orange-100 mt-1">Up to 25 clips</span>
            </div>

            <div className="w-px h-10 bg-white/30 hidden md:block self-center" />

            {/* Professional */}
            <div className="flex flex-col items-center md:items-start group">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white font-bold line-through decoration-orange-400 decoration-2 opacity-100">$249</span>
                <span className="text-white text-xl md:text-2xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">$179 PROFESSIONAL</span>
              </div>
              <span className="text-xs font-black normal-case tracking-wider text-orange-100 mt-1">Up to 35 clips</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
