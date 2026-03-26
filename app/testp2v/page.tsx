"use client";

import { useState } from "react";
import { SpinWheel } from "@/components/spin-wheel";
import type { WheelSegment } from "@/components/spin-wheel";

export default function TestP2VPage() {
  const [showWheel, setShowWheel] = useState(true);
  const [lastWin, setLastWin] = useState<string | null>(null);

  const handleResult = (segment: WheelSegment) => {
    setLastWin(segment.value === "jackpot" ? "JACKPOT" : `${segment.value}%`);
  };

  const handleClose = () => {
    setShowWheel(false);
  };

  const reset = () => {
    setLastWin(null);
    setShowWheel(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      {showWheel ? (
        <SpinWheel
          onResult={handleResult}
          onClose={handleClose}
          promoCode="RWH4KN7V3P2X9B"
        />
      ) : (
        <div className="text-center space-y-6">
          {lastWin && (
            <p className="text-white/60 text-lg">
              Last result: <span className="font-bold text-white">{lastWin}</span>
            </p>
          )}
          <button
            onClick={reset}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-black text-xl px-12 py-5 rounded-full shadow-2xl hover:scale-110 transition-all"
          >
            🎰 Spin Again
          </button>
        </div>
      )}
    </div>
  );
}
