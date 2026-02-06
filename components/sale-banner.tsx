"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SaleBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 text-white py-6 px-4 relative overflow-hidden border-b border-emerald-500/30">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
        {/* Top Row: Urgent Badge & Save Tag */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-[12px] px-3 py-1 font-black tracking-tighter rounded-md animate-pulse">
              LIMITED TIME
            </Badge>
            <span className="text-lg font-bold tracking-tight text-emerald-50">
              Exclusive Seasonal Pricing Live
            </span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/40">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-200 uppercase tracking-[0.15em]">
              Save $70 On Every Tier
            </span>
          </div>
        </div>

        {/* Bottom Row: Pricing & Details */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
          {/* "Includes" Label */}
          <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500/60 md:mr-8">
            Includes
          </span>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 font-bold uppercase tracking-widest">
            {/* Standard */}
            <div className="flex flex-col items-center md:items-start group">
              <div className="flex items-center gap-3">
                <span className="opacity-40 line-through text-xs text-slate-400">$149</span>
                <span className="text-emerald-400 text-base md:text-lg font-black">$79 STANDARD</span>
              </div>
              <span className="text-[11px] font-bold normal-case tracking-wider text-slate-300 mt-1 opacity-80">Up to 12 clips</span>
            </div>

            <div className="w-px h-10 bg-white/20 hidden md:block self-center" />

            {/* Premium */}
            <div className="flex flex-col items-center md:items-start group">
              <div className="flex items-center gap-3">
                <span className="opacity-40 line-through text-xs text-slate-400">$199</span>
                <span className="text-emerald-400 text-base md:text-lg font-black">$129 PREMIUM</span>
              </div>
              <span className="text-[11px] font-bold normal-case tracking-wider text-slate-300 mt-1 opacity-80">Up to 25 clips</span>
            </div>

            <div className="w-px h-10 bg-white/20 hidden md:block self-center" />

            {/* Professional */}
            <div className="flex flex-col items-center md:items-start group">
              <div className="flex items-center gap-3">
                <span className="opacity-40 line-through text-xs text-slate-400">$249</span>
                <span className="text-emerald-400 text-base md:text-lg font-black">$179 PROFESSIONAL</span>
              </div>
              <span className="text-[11px] font-bold normal-case tracking-wider text-slate-300 mt-1 opacity-80">Up to 35 clips</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
