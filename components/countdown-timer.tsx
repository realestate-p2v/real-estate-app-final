"use client";

import { useEffect, useState, useMemo } from "react";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export function CountdownTimer() {
  // Target date: March 1st, 2026
  const targetDate = useMemo(() => new Date("2026-03-01T00:00:00").getTime(), []);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d.toString().padStart(2, "0"),
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-3">
      {/* Red Glow Label */}
      <span className="text-red-500 font-black uppercase tracking-tighter animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] text-base md:text-lg">
        February Offer:
      </span>

      {/* Large Timer Display */}
      <div className="flex items-center gap-2 font-mono text-xl md:text-2xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
        <div className="flex flex-col items-center">
          <span>{timeLeft.days}</span>
          <span className="text-[10px] font-sans font-bold -mt-1 opacity-80">DAYS</span>
        </div>
        <span className="animate-pulse">:</span>
        <div className="flex flex-col items-center">
          <span>{timeLeft.hours}</span>
          <span className="text-[10px] font-sans font-bold -mt-1 opacity-80">HRS</span>
        </div>
        <span className="animate-pulse">:</span>
        <div className="flex flex-col items-center">
          <span>{timeLeft.minutes}</span>
          <span className="text-[10px] font-sans font-bold -mt-1 opacity-80">MIN</span>
        </div>
        <span className="animate-pulse">:</span>
        <div className="flex flex-col items-center">
          <span>{timeLeft.seconds}</span>
          <span className="text-[10px] font-sans font-bold -mt-1 opacity-80">SEC</span>
        </div>
      </div>
    </div>
  );
}
