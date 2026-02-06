"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SaleBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 text-white py-4 px-4 relative overflow-hidden border-b border-emerald-500/30">
      {/* Subtle texture overlay for a "classy" look */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col gap-4 relative z-10">
        {/* Top Row: Urgent Badge & Save Tag */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-[10px] font-black tracking-tighter rounded-md animate-pulse">
              LIMITED TIME
            </Badge>
            <span className="text-sm font-medium tracking-tight text-emerald-50 opacity-90">
              Exclusive Seasonal Pricing Live
            </span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">
              Save $70 On Every Tier
            </span>
          </div>
        </div>

        {/* Bottom Row: Pricing & Details */}
        <div className="flex items-center justify-center gap-4 md:gap-10">
          {/* "Includes" Label */}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mr-2">
            Includes
          </span>

          <div className="flex items-start gap-6 md:gap-12 text-xs md:text-sm font-bold uppercase tracking-widest">
            {/* Standard */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2">
                <span className="opacity-40 line-through text-[10px] text-slate-400">$149</span>
                <span className="text-emerald-400">$79 STANDARD</span>
              </div>
              <span className="text-[9px] font-medium normal-case tracking-normal text-slate-400 mt-0.5">Up to 12 clips</span>
            </div>

            <div className="w-px h-8 bg-white/10 hidden md:block self-center" />

            {/* Premium */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2">
                <span className="opacity-40 line-through text-[10px] text-slate-400">$199</span>
                <span className="text-emerald-400">$129 PREMIUM</span>
              </div>
              <span className="text-[9px] font-medium normal-case tracking-normal text-slate-400 mt-0.5">Up to 25 clips</span>
            </div>

            <div className="w-px h-8 bg-white/10 hidden md:block self-center" />

            {/* Professional */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2">
                <span className="opacity-40 line-through text-[10px] text-slate-400">$249</span>
                <span className="text-emerald-400">$179 PROFESSIONAL</span>
              </div>
              <span className="text-[9px] font-medium normal-case tracking-normal text-slate-400 mt-0.5">Up to 35 clips</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
