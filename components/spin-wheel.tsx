"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpinWheelProps {
  /** The pre-determined winning discount percent (20-30) */
  winningPercent: number;
  /** The promo code to display after spin */
  promoCode: string;
  /** Called when the wheel finishes spinning */
  onComplete?: () => void;
}

// Wheel segments — 8 slices with varied prizes
const SEGMENTS = [
  { percent: 20, color: "#f59e0b", label: "20%" },
  { percent: 25, color: "#22c55e", label: "25%" },
  { percent: 22, color: "#3b82f6", label: "22%" },
  { percent: 30, color: "#ef4444", label: "30%" },
  { percent: 21, color: "#a855f7", label: "21%" },
  { percent: 28, color: "#14b8a6", label: "28%" },
  { percent: 23, color: "#f97316", label: "23%" },
  { percent: 26, color: "#ec4899", label: "26%" },
];

export function SpinWheel({ winningPercent, promoCode, onComplete }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);

  const segmentAngle = (2 * Math.PI) / SEGMENTS.length;

  // Draw the wheel
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 8;

      ctx.clearRect(0, 0, size, size);

      // Draw segments
      SEGMENTS.forEach((seg, i) => {
        const startAngle = rotation + i * segmentAngle - Math.PI / 2;
        const endAngle = startAngle + segmentAngle;

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        // Segment border
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = `bold ${size * 0.055}px system-ui, -apple-system, sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 3;
        ctx.fillText(seg.label, radius * 0.65, 0);
        ctx.shadowBlur = 0;

        // "OFF" text below percentage
        ctx.font = `bold ${size * 0.03}px system-ui, -apple-system, sans-serif`;
        ctx.fillText("OFF", radius * 0.65, size * 0.04);
        ctx.restore();
      });

      // Center circle
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.18, 0, 2 * Math.PI);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center emoji
      ctx.font = `${size * 0.07}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎁", center, center);

      // Pointer (top, pointing down)
      const pointerSize = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(center, 4);
      ctx.lineTo(center - pointerSize, -pointerSize * 0.4 + 4);
      ctx.lineTo(center + pointerSize, -pointerSize * 0.4 + 4);
      ctx.closePath();
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      // Pointer triangle pointing into wheel
      ctx.beginPath();
      ctx.moveTo(center, pointerSize + 4);
      ctx.lineTo(center - pointerSize * 0.7, 4);
      ctx.lineTo(center + pointerSize * 0.7, 4);
      ctx.closePath();
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [segmentAngle]
  );

  // Initial draw
  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  const spin = () => {
    if (spinning || finished) return;
    setSpinning(true);

    // Find the segment index that matches the winning percent
    let winIndex = SEGMENTS.findIndex((s) => s.percent === winningPercent);
    if (winIndex === -1) winIndex = 0; // fallback

    // Calculate target rotation:
    // The pointer is at top (12 o'clock = -PI/2), we want the winning segment's center there.
    // Segment center angle = winIndex * segmentAngle + segmentAngle / 2
    // We need to rotate so this center aligns with the top.
    // Add several full rotations for drama (5-8 full spins)
    const fullSpins = 6 + Math.random() * 3; // 6-9 full rotations
    const segmentCenter = winIndex * segmentAngle + segmentAngle / 2;
    // Target = full spins * 2PI - segmentCenter (negative because we want the segment at top)
    const target = fullSpins * 2 * Math.PI + (2 * Math.PI - segmentCenter);

    targetRotationRef.current = target;
    startTimeRef.current = performance.now();

    const DURATION = 5000; // 5 seconds

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      // Easing: cubic ease-out for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const rotation = eased * targetRotationRef.current;

      setCurrentRotation(rotation);
      drawWheel(rotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {!finished ? (
        <>
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 blur-lg opacity-30 animate-pulse" />

            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="relative z-10 w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]"
            />
          </div>

          <Button
            onClick={spin}
            disabled={spinning}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg px-10 py-6 rounded-full shadow-lg shadow-amber-500/30 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
          >
            {spinning ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 animate-spin" />
                Spinning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Spin the Wheel!
              </span>
            )}
          </Button>
        </>
      ) : (
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-5xl mb-2">🎉</div>
          <h3 className="text-2xl font-black text-foreground">
            You won {winningPercent}% off!
          </h3>
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 inline-block">
            <p className="text-sm text-green-700 mb-1">Your discount code:</p>
            <p className="font-mono text-2xl font-black text-green-800 tracking-wider">
              {promoCode}
            </p>
            <p className="text-sm text-green-600 mt-1 font-semibold">
              {winningPercent}% off your next order
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            We&apos;ve also emailed this code to you. Use it at checkout on your next video order.
          </p>
        </div>
      )}
    </div>
  );
}
