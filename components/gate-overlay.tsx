"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type GateType = "buy_video" | "subscribe" | "upgrade_pro";

interface GateOverlayProps {
  gateType: GateType;
  toolName?: string;
  onClose: () => void;
}

export function GateOverlay({ gateType, toolName, onClose }: GateOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-gray-950 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── BUY VIDEO ── */}
        {gateType === "buy_video" && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎬</div>
              <h2 className="text-xl font-extrabold text-white">
                Order a Video to Get Started
              </h2>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">
                Your first video order unlocks 10 days of every AI marketing tool — including this one.
              </p>
            </div>
            <div className="space-y-2.5 mb-6">
              {[
                "Cinematic listing walkthrough from $79",
                "You own every clip",
                "Video Remix included — free forever",
                "10 days of all tools — no credit card",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span className="text-green-400 text-sm mt-0.5">✓</span>
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>
            <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-6 text-base">
              <Link href="/order">Order a Video — from $79</Link>
            </Button>
          </>
        )}

        {/* ── SUBSCRIBE ── */}
        {gateType === "subscribe" && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔒</div>
              <h2 className="text-xl font-extrabold text-white">
                Subscribe to Use This Tool
              </h2>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">
                Your 10-day trial has ended. Subscribe to keep unlimited access to all marketing tools.
              </p>
            </div>
            <div className="flex gap-3 mb-4">
              <Button asChild className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-6">
                <Link href="/lens#pricing">Lens Tools — $27/mo</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 border-white/[0.1] text-white/80 hover:bg-white/[0.06] font-bold py-6">
                <Link href="/lens#pricing">Lens Pro — $49/mo</Link>
              </Button>
            </div>
            <p className="text-xs text-white/30 text-center">
              Your videos and Video Remix are still available.
            </p>
          </>
        )}

        {/* ── UPGRADE PRO ── */}
        {gateType === "upgrade_pro" && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👑</div>
              <h2 className="text-xl font-extrabold text-white">
                Lens Pro Feature
              </h2>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">
                {toolName ? `${toolName} is` : "This tool is"} available with Lens Pro.
              </p>
            </div>
            <Button asChild className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-6 text-base">
              <Link href="/lens#pricing">Upgrade to Pro — $49/mo</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
