"use client";

import { useEffect, useState } from "react";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 44,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Random time between 40-48 hours (in milliseconds)
    const minHours = 40;
    const maxHours = 48;
    const randomHours = Math.random() * (maxHours - minHours) + minHours;
    const randomMs = randomHours * 60 * 60 * 1000;
    
    const endTime = new Date(Date.now() + randomMs);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1 bg-secondary/20 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-secondary animate-pulse">
        <div className="flex items-center gap-1 font-mono">
          <span className="text-2xl md:text-3xl font-bold text-secondary">--:--:--</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary/30 to-secondary/20 backdrop-blur-sm rounded-xl px-5 py-3 border-2 border-secondary shadow-lg shadow-secondary/25">
      <div className="flex items-center gap-1 font-mono">
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-3xl font-bold text-secondary drop-shadow-glow">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase text-secondary/70 font-medium">hrs</span>
        </div>
        <span className="text-2xl md:text-3xl font-bold text-secondary animate-pulse mx-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-3xl font-bold text-secondary drop-shadow-glow">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase text-secondary/70 font-medium">min</span>
        </div>
        <span className="text-2xl md:text-3xl font-bold text-secondary animate-pulse mx-1">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-3xl font-bold text-secondary drop-shadow-glow">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase text-secondary/70 font-medium">sec</span>
        </div>
      </div>
    </div>
  );
}
