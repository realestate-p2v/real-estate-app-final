"use client"

import React from "react"
import { Sparkles, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SaleBanner() {
  return (
    <div className="px-4 py-4"> {/* Wrapper to show off the rounded corners */}
      <div className="w-full max-w-7xl mx-auto bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 text-white py-8 px-6 relative overflow-hidden rounded-[2rem] border-2 border-emerald-400/30 shadow-2xl">
        
        {/* Subtle texture overlay to keep it "classy" */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue500/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto flex flex-col gap-8 relative z-10">
          
          {/* Stand-out Coupon Badge */}
          <div className="flex justify-center -mt-2">
            <div className="bg-blue-400 text-slate-900 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center gap-2 animate-bounce border-2 border-white/20">
              <Tag className="w-4 h-4 fill-slate-900" />
              <span className="text-xs md:text-sm font-black uppercase tracking-wider">
                Combine with coupon code for more savings!
              </span>
            </div>
          </div>

          {/* Title Row */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
            <div className="flex items-center gap-4">
              <Badge className="bg-emerald-500 text-white text-[12px] px-4 py-1.5 font-black tracking-widest rounded-lg shadow-lg border border-emerald-400">
                OFFER ACTIVE
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic">
                Exclusive <span className="text-emerald-400">Seasonal</span> Pricing
              </h2>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-[11px] font-black text-emerald-100 uppercase tracking-[0.2em]">
                Save $70 Per Tier
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-6 md:gap-4">
            
            {/* "Includes" Label */}
            <div className="flex justify-center md:justify-end">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500/50">
                Includes
              </span>
            </div>

            {/* Standard */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-slate-400 font-black line-through decoration-emerald-500/50 decoration-2">$149</span>
                <span className="text-white text-2xl font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] tracking-tighter">$79</span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Standard</span>
              <span className="text-[11px] font-bold text-slate-300">Up to 12 clips</span>
            </div>

            {/* Premium */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 transition-all hover:bg-white/10 shadow-xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-slate-400 font-black line-through decoration-emerald-500/50 decoration-2">$199</span>
                <span className="text-white text-2xl font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] tracking-tighter">$129</span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Premium</span>
              <span className="text-[11px] font-bold text-slate-300">Up to 25 clips</span>
            </div>

            {/* Professional */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-slate-400 font-black line-through decoration-emerald-500/50 decoration-2">$249</span>
                <span className="text-white text-2xl font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] tracking-tighter">$179</span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Professional</span>
              <span className="text-[11px] font-bold text-slate-300">Up to 35 clips</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
