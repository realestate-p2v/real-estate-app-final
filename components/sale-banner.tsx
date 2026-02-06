"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SaleBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 text-white py-3 px-4 relative overflow-hidden border-b border-emerald-500/30">
      {/* Subtle texture overlay for a "classy" look */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 relative z-10">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-[10px] font-black tracking-tighter rounded-md animate-pulse">
            LIMITED TIME
          </Badge>
          <span className="text-sm font-medium tracking-tight text-emerald-50 opacity-90">
            Exclusive Seasonal Pricing Live
          </span>
        </div>

        {/* Price Points */}
        <div className="flex items-center gap-4 text-xs md:text-sm font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="opacity-50 line-through text-slate-400">$149</span>
            <span className="text-emerald-400">$79 STANDARD</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="opacity-50 line-through text-slate-400">$199</span>
            <span className="text-emerald-400">$129 PREMIUM</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="opacity-50 line-through text-slate-400">$249</span>
            <span className="text-emerald-400">$179 PROFESSIONAL</span>
          </div>
        </div>

        {/* High Conversion "Save" Tag */}
        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">
            Save $70 On Every Tier
          </span>
        </div>
      </div>
    </div>
  )
}
