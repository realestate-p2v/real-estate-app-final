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
    <div className="flex items-center gap-1 font-mono font-bold text-secondary">
      <div className="flex flex-col items-center">
        <span>{timeLeft.days}</span>
        <span className="text-[8px] uppercase opacity-60 -mt-1 font-sans">d</span>
      </div>
      <span className="opacity-50 mb-1">:</span>
      <div className="flex flex-col items-center">
        <span>{timeLeft.hours}</span>
        <span className="text-[8px] uppercase opacity-60 -mt-1 font-sans">h</span>
      </div>
      <span className="opacity-50 mb-1">:</span>
      <div className="flex flex-col items-center">
        <span>{timeLeft.minutes}</span>
        <span className="text-[8px] uppercase opacity-60 -mt-1 font-sans">m</span>
      </div>
      <span className="opacity-50 mb-1">:</span>
      <div className="flex flex-col items-center animate-pulse">
        <span>{timeLeft.seconds}</span>
        <span className="text-[8px] uppercase opacity-60 -mt-1 font-sans">s</span>
      </div>
    </div>
  );
}
