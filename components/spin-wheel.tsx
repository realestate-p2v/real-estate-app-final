"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Gift, Sparkles, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpinWheelProps {
  winningPercent: number;
  promoCode: string;
  onComplete?: () => void;
}

const SEGMENTS = [
  { percent: 20, color: "#dc2626", label: "20%" },
  { percent: 25, color: "#16a34a", label: "25%" },
  { percent: 22, color: "#2563eb", label: "22%" },
  { percent: 30, color: "#d946ef", label: "30%" },
  { percent: 21, color: "#ea580c", label: "21%" },
  { percent: 28, color: "#0d9488", label: "28%" },
  { percent: 23, color: "#7c3aed", label: "23%" },
  { percent: 26, color: "#e11d48", label: "26%" },
];

// Confetti particle
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

export function SpinWheel({ winningPercent, promoCode, onComplete }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const confettiRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const lastTickRef = useRef<number>(-1);
  const particlesRef = useRef<Particle[]>([]);

  const segmentAngle = (2 * Math.PI) / SEGMENTS.length;
  const CANVAS_SIZE = 400;

  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = CANVAS_SIZE;
      const center = size / 2;
      const radius = center - 16;

      ctx.clearRect(0, 0, size, size);

      // Outer ring glow
      ctx.beginPath();
      ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(234, 179, 8, 0.3)";
      ctx.lineWidth = 12;
      ctx.stroke();

      // Outer metallic ring
      const ringGrad = ctx.createLinearGradient(0, 0, size, size);
      ringGrad.addColorStop(0, "#fbbf24");
      ringGrad.addColorStop(0.3, "#fef3c7");
      ringGrad.addColorStop(0.5, "#f59e0b");
      ringGrad.addColorStop(0.7, "#fef3c7");
      ringGrad.addColorStop(1, "#d97706");
      ctx.beginPath();
      ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Draw segments
      SEGMENTS.forEach((seg, i) => {
        const startAngle = rotation + i * segmentAngle - Math.PI / 2;
        const endAngle = startAngle + segmentAngle;

        // Gradient fill per segment
        const midAngle = startAngle + segmentAngle / 2;
        const gx = center + Math.cos(midAngle) * radius * 0.5;
        const gy = center + Math.sin(midAngle) * radius * 0.5;
        const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
        grad.addColorStop(0, lighten(seg.color, 30));
        grad.addColorStop(0.4, seg.color);
        grad.addColorStop(1, darken(seg.color, 20));

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Segment border
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(midAngle);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Text shadow
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = "white";
        ctx.font = `900 ${size * 0.065}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(seg.label, radius * 0.62, 0);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.font = `800 ${size * 0.028}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText("OFF", radius * 0.62, size * 0.04);
        ctx.restore();
      });

      // Inner shadow ring
      const innerShadow = ctx.createRadialGradient(center, center, radius * 0.15, center, center, radius * 0.25);
      innerShadow.addColorStop(0, "rgba(0,0,0,0.3)");
      innerShadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.25, 0, 2 * Math.PI);
      ctx.fillStyle = innerShadow;
      ctx.fill();

      // Center hub
      const hubGrad = ctx.createRadialGradient(center - 4, center - 4, 0, center, center, radius * 0.2);
      hubGrad.addColorStop(0, "#fef3c7");
      hubGrad.addColorStop(0.5, "#f59e0b");
      hubGrad.addColorStop(1, "#92400e");
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.2, 0, 2 * Math.PI);
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center text
      ctx.font = `${size * 0.09}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎁", center, center + 2);

      // Pointer — big dramatic triangle
      const pw = size * 0.06;
      const ph = size * 0.08;
      ctx.beginPath();
      ctx.moveTo(center, ph + 2);
      ctx.lineTo(center - pw, 2);
      ctx.lineTo(center + pw, 2);
      ctx.closePath();

      const pointerGrad = ctx.createLinearGradient(center, 0, center, ph);
      pointerGrad.addColorStop(0, "#fbbf24");
      pointerGrad.addColorStop(1, "#dc2626");
      ctx.fillStyle = pointerGrad;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pointer dot
      ctx.beginPath();
      ctx.arc(center, 8, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();

      // Tick dots around edge (like a casino wheel)
      for (let i = 0; i < SEGMENTS.length; i++) {
        const angle = rotation + i * segmentAngle - Math.PI / 2;
        const dx = center + Math.cos(angle) * (radius - 6);
        const dy = center + Math.sin(angle) * (radius - 6);
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fill();
      }
    },
    [segmentAngle]
  );

  // Color helpers
  function lighten(hex: string, pct: number) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * pct));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * pct));
    const b = Math.min(255, (num & 0xff) + Math.round(2.55 * pct));
    return `rgb(${r},${g},${b})`;
  }
  function darken(hex: string, pct: number) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - Math.round(2.55 * pct));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * pct));
    const b = Math.max(0, (num & 0xff) - Math.round(2.55 * pct));
    return `rgb(${r},${g},${b})`;
  }

  // Confetti burst
  const launchConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
    const particles: Particle[] = [];

    for (let i = 0; i < 120; i++) {
      const angle = (Math.PI * 2 * i) / 120 + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 10;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        life: 1,
      });
    }
    particlesRef.current = particles;

    const animateConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.life -= 0.008;

        if (p.life <= 0) continue;
        alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        // Mix rectangles and circles for variety
        if (p.size > 7) {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive) {
        confettiRef.current = requestAnimationFrame(animateConfetti);
      }
    };
    confettiRef.current = requestAnimationFrame(animateConfetti);
  };

  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  const spin = () => {
    if (spinning || finished) return;
    setSpinning(true);

    let winIndex = SEGMENTS.findIndex((s) => s.percent === winningPercent);
    if (winIndex === -1) winIndex = 0;

    const fullSpins = 8 + Math.random() * 4; // 8-12 full rotations for more drama
    const segmentCenter = winIndex * segmentAngle + segmentAngle / 2;
    const target = fullSpins * 2 * Math.PI + (2 * Math.PI - segmentCenter);

    targetRotationRef.current = target;
    startTimeRef.current = performance.now();
    lastTickRef.current = -1;

    const DURATION = 7000; // 7 seconds — longer for suspense

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      // Custom easing: fast start, dramatic slowdown at end
      // Use quartic ease-out for that "almost stopping... keeps going..." feeling
      const eased = 1 - Math.pow(1 - progress, 4);
      const rotation = eased * target;

      // Ticker click sound effect — detect segment crossings
      const currentSegment = Math.floor(((rotation % (2 * Math.PI)) / segmentAngle)) % SEGMENTS.length;
      if (currentSegment !== lastTickRef.current && progress < 0.95) {
        lastTickRef.current = currentSegment;
        // Visual tick feedback
        setTickCount((c) => c + 1);
      }

      drawWheel(rotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        // Delay result reveal for dramatic pause
        setTimeout(() => {
          launchConfetti();
          setShowResult(true);
          onComplete?.();
        }, 600);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (confettiRef.current) cancelAnimationFrame(confettiRef.current);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-5">
      {/* Confetti overlay */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {!showResult ? (
        <>
          <div className="relative">
            {/* Animated glow ring */}
            <div
              className={`absolute -inset-4 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 blur-xl transition-opacity duration-300 ${
                spinning ? "opacity-50 animate-pulse" : "opacity-20"
              }`}
            />

            {/* Light dots around the wheel */}
            <div className="absolute -inset-3 z-0">
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * 360;
                const delay = i * 0.08;
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      top: `${50 - 49 * Math.cos((angle * Math.PI) / 180)}%`,
                      left: `${50 + 49 * Math.sin((angle * Math.PI) / 180)}%`,
                      backgroundColor: spinning
                        ? i % 2 === (tickCount % 2) ? "#fbbf24" : "#ef4444"
                        : "#fbbf24",
                      opacity: spinning ? 0.9 : 0.4,
                      transition: "background-color 0.1s, opacity 0.3s",
                      boxShadow: spinning ? "0 0 6px 2px rgba(251,191,36,0.6)" : "none",
                    }}
                  />
                );
              })}
            </div>

            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="relative z-10 w-[300px] h-[300px] sm:w-[380px] sm:h-[380px]"
            />
          </div>

          <Button
            onClick={spin}
            disabled={spinning}
            className={`relative text-white font-black text-xl px-12 py-7 rounded-full shadow-xl transition-all ${
              spinning
                ? "bg-amber-600 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 hover:scale-110 hover:shadow-2xl hover:shadow-orange-500/40 animate-pulse"
            }`}
          >
            {spinning ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 animate-spin" />
                Spinning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Gift className="h-6 w-6" />
                🎰 SPIN THE WHEEL!
              </span>
            )}
          </Button>
        </>
      ) : (
        <div className="text-center space-y-5 z-10">
          <div className="text-7xl animate-bounce">🎉</div>
          <h3 className="text-4xl font-black text-foreground tracking-tight">
            YOU WON {winningPercent}% OFF!
          </h3>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-3 border-green-400 rounded-2xl p-6 shadow-lg shadow-green-500/20">
            <p className="text-sm text-green-600 font-semibold mb-2">Your exclusive discount code:</p>
            <p className="font-mono text-3xl font-black text-green-800 tracking-widest mb-2">
              {promoCode}
            </p>
            <div className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-full text-lg font-black">
              {winningPercent}% OFF YOUR NEXT ORDER
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            We&apos;ve also emailed this code to you. Use it at checkout!
          </p>
        </div>
      )}
    </div>
  );
}
