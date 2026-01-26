"use client";

import { useEffect, useState } from "react";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 48,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 48);

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

  return (
    <div className="flex items-center gap-1 font-mono">
      <span className="text-lg md:text-xl font-bold text-secondary">
        {String(timeLeft.hours).padStart(2, "0")}
      </span>
      <span className="text-lg md:text-xl font-bold text-secondary">:</span>
      <span className="text-lg md:text-xl font-bold text-secondary">
        {String(timeLeft.minutes).padStart(2, "0")}
      </span>
      <span className="text-lg md:text-xl font-bold text-secondary">:</span>
      <span className="text-lg md:text-xl font-bold text-secondary">
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
