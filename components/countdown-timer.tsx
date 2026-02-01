"use client";

import { useEffect, useState, useMemo } from "react";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export function CountdownTimer() {
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
    <div className="flex items-center gap-4">
      {/* Muted Glowing Label */}
      <span className="text-red-900/80 font-bold uppercase tracking-widest text-sm drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]">
        February Offer
      </span>

      {/* Elegant Deep Red Timer */}
      <div className="flex items-center gap-2 font-mono text-xl md:text-2xl font-bold text-red-800/90 drop-shadow-[0_0_12px_rgba(220,38,38,0.3)]">
        <div className="flex flex-col items-center">
          <span>{timeLeft.days}</span>
          <span className="text-[9px] font-sans font-medium opacity-60">DAYS</span>
        </div>
        <span className="opacity-40">:</span>
        <div className="flex flex-col items-center">
          <span>{timeLeft.hours}</span>
          <span className="text-[9px] font-sans font-medium opacity-60">HRS</span>
        </div>
        <span className="opacity-40">:</span>
        <div className="flex flex-col items-center">
          <span>{timeLeft.minutes}</span>
          <span className="text-[9px] font-sans font-medium opacity-60">MIN</span>
        </div>
        <span className="opacity-40">:</span>
        <div className="flex flex-col items-center">
          <span>{timeLeft.seconds}</span>
          <span className="text-[9px] font-sans font-medium opacity-60">SEC</span>
        </div>
      </div>
    </div>
  );
}
