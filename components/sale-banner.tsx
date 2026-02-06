"use client"

import React, { useState } from "react"
import { Sparkles, Tag, Check, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SaleBanner() {
  const [copied, setCopied] = useState(false)
  const couponCode = "p2v"

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
  }

  return (
    <div className="px-4 py-6">
      <div className="w-full max-w-7xl mx-auto relative overflow-hidden rounded-[2.5rem] border-2 border-white/10 shadow-2xl bg-black">
        
        {/* 1. Background Video Layer */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover grayscale-[0.2]"
          >
            <source src="/p2v-website-her-vid.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-slate-900/60 to-black/80" />
        </div>
        
        {/* 2. Content Layer */}
        <div className="max-w-6xl mx-auto flex flex-col gap-10 relative z-10 py-10 px-6">
          
          {/* Interactive Coupon Badge */}
          <div className="flex justify-center -mt-4">
            <button 
              onClick={handleCopy}
              className={`group transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                copied ? 'bg-white text-emerald-600' : 'bg-emerald-400 text-slate-900'
              } px-8 py-2.5 rounded-full shadow-[0_0_25px_rgba(52,211,153,0.4)] flex items-center gap-2 border-2 border-white/30 cursor-pointer`}
            >
              {copied ? (
                <Check className="w-5 h-5 animate-in zoom-in" />
              ) : (
                <Tag className="w-5 h-5 fill-current group-hover:rotate-12 transition-transform" />
              )}
              <span className="text-sm md:text-base font-black uppercase tracking-wider">
                {copied ? "CODE COPIED!" : `Use code: ${couponCode} for more savings!`}
              </span>
              {!copied && <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />}
            </button>
          </div>

          {/* Title Row */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <Badge className="bg-emerald-500 text-white text-[14px] px-5 py-2 font-black tracking-widest rounded-lg shadow-lg border border-emerald-400">
                OFFER ACTIVE
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">
                Exclusive <span className="text-emerald-400">Seasonal</span> Pricing
              </h2>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Standard Tier */}
            <div className="flex flex-col items-center p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 transition-all hover:bg-black/60 shadow-lg">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Standard</span>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg text-slate-400 font-black line-through decoration-emerald-500/50 decoration-2">$149</span>
                <span className="text-white text-4xl font-black drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] tracking-tighter">$79</span>
              </div>
              
              <div className="flex flex-col gap-2 text-center">
                <p className="text-[13px] font-bold text-white uppercase tracking-wide underline decoration-emerald-500/30 underline-offset-4">Up to 12 HD clips</p>
                <ul className="text-[12px] space-y-1.5 text-slate-200 font-bold mt-2">
                  <li>24 hour turnaround</li>
                  <li>Photo Enhancement</li>
                  <li>Choice of music</li>
                  <li>1 revision</li>
                </ul>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="flex flex-col items-center p-6 rounded-3xl bg-emerald-600/20 backdrop-blur-lg border-2 border-emerald-400/50 transition-all hover:bg-emerald-600/30 shadow-2xl relative scale-105 z-20">
              <div className="absolute -top-3 bg-emerald-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">Most Popular</div>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Premium</span>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg text-slate-400 font-black line-through decoration-emerald-500/50 decoration-2">$199</span>
                <span className="text-white text-4xl font-black drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] tracking-tighter">$129</span>
              </div>
              
              <div className="flex flex-col gap-2 text-center">
                <p className="text-[13px] font-bold text-white uppercase tracking-wide underline decoration-emerald-500/30 underline-offset-4">Up to 25 HD clips</p>
                <ul className="text-[12px] space-y-1.5 text-slate-100 font-bold mt-2">
                  <li>24 hour turnaround</li>
                  <li>Photo Enhancement</li>
                  <li>Choice of music</li>
                  <li>1 revision</li>
                </ul>
              </div>
            </div>

            {/* Professional Tier */}
            <div className="flex flex-col items-center p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 transition-all hover:bg-black/60 shadow-lg">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Professional</span>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg text-slate-400 font-black line-through decoration-emerald-500/50 decoration-2">$249</span>
                <span className="text-white text-4xl font-black drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] tracking-tighter">$179</span>
              </div>
              
              <div className="flex flex-col gap-2 text-center">
                <p className="text-[13px] font-bold text-white uppercase tracking-wide underline decoration-emerald-500/30 underline-offset-4">Up to 35 HD clips</p>
                <ul className="text-[12px] space-y-1.5 text-slate-200 font-bold mt-2">
                  <li>24 hour turnaround</li>
                  <li>Photo Enhancement</li>
                  <li>Choice of music</li>
                  <li>1 revision</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
