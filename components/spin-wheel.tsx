"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Gift, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpinWheelProps {
  winningPercent: number;
  promoCode: string;
  onComplete?: () => void;
  onClose?: () => void;
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

interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rotation: number;
  rotationSpeed: number; life: number; shape: "rect" | "circle" | "strip";
}

// ─── SOUND ENGINE ───
class SoundEngine {
  public ctx: AudioContext | null = null;
  public muted = false;
  public applauseAudio: HTMLAudioElement | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    // Play a silent buffer to permanently unlock audio playback
    const silent = this.ctx.createBuffer(1, 1, 22050);
    const src = this.ctx.createBufferSource();
    src.buffer = silent;
    src.connect(this.ctx.destination);
    src.start(0);
    // Pre-load applause
    if (!this.applauseAudio) {
      this.applauseAudio = new Audio("/crowd-applause.mp3");
      this.applauseAudio.load();
    }
  }

  tick(speed: number) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800 + speed * 2000, ctx.currentTime);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  nearStop() {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  win() {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === "suspended") ctx.resume();

    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      osc.type = "triangle";
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });

    setTimeout(() => {
      if (!ctx || this.muted) return;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(2000 + Math.random() * 3000, ctx.currentTime + i * 0.05);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.03, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.15);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.15);
      }
    }, 600);

    setTimeout(() => {
      if (this.muted) return;
      if (this.applauseAudio) {
        this.applauseAudio.currentTime = 0;
        this.applauseAudio.volume = 0.7;
        this.applauseAudio.play().catch(() => {});
      } else {
        this.applauseAudio = new Audio("/crowd-applause.mp3");
        this.applauseAudio.volume = 0.7;
        this.applauseAudio.play().catch(() => {});
      }
    }, 300);
  }

  stopApplause() {
    if (this.applauseAudio) {
      this.applauseAudio.pause();
      this.applauseAudio.currentTime = 0;
    }
  }
}

// ─── COLOR HELPERS ───
function lighten(hex: string, pct: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.min(255, (n >> 16) + Math.round(2.55 * pct))},${Math.min(255, ((n >> 8) & 0xff) + Math.round(2.55 * pct))},${Math.min(255, (n & 0xff) + Math.round(2.55 * pct))})`;
}
function darken(hex: string, pct: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.max(0, (n >> 16) - Math.round(2.55 * pct))},${Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * pct))},${Math.max(0, (n & 0xff) - Math.round(2.55 * pct))})`;
}

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════
export function SpinWheel({ winningPercent, promoCode, onComplete, onClose }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const soundRef = useRef(new SoundEngine());
  const animationRef = useRef<number | null>(null);
  const confettiAnimRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const targetRotRef = useRef(0);
  const lastTickSegRef = useRef(-1);
  const lastSpeedRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  const [muted, setMuted] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [tickFlash, setTickFlash] = useState(0);

  const segAngle = (2 * Math.PI) / SEGMENTS.length;
  const CANVAS = 420;
  const DURATION = 7500;

  useEffect(() => {
    soundRef.current.muted = muted;
    if (soundRef.current.applauseAudio) {
      soundRef.current.applauseAudio.muted = muted;
    }
  }, [muted]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ─── DRAW ───
  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = CANVAS;
    const cx = size / 2;
    const r = cx - 18;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cx, r + 10, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(251,191,36,0.25)";
    ctx.lineWidth = 16;
    ctx.stroke();

    // Gold ring
    const ringG = ctx.createLinearGradient(0, 0, size, size);
    ringG.addColorStop(0, "#fbbf24");
    ringG.addColorStop(0.3, "#fef3c7");
    ringG.addColorStop(0.5, "#f59e0b");
    ringG.addColorStop(0.7, "#fef3c7");
    ringG.addColorStop(1, "#d97706");
    ctx.beginPath();
    ctx.arc(cx, cx, r + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = ringG;
    ctx.lineWidth = 9;
    ctx.stroke();

    // Segments
    SEGMENTS.forEach((seg, i) => {
      const a1 = rotation + i * segAngle - Math.PI / 2;
      const a2 = a1 + segAngle;
      const mid = a1 + segAngle / 2;

      const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, r);
      grad.addColorStop(0, lighten(seg.color, 35));
      grad.addColorStop(0.35, seg.color);
      grad.addColorStop(1, darken(seg.color, 25));

      ctx.beginPath();
      ctx.moveTo(cx, cx);
      ctx.arc(cx, cx, r, a1, a2);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cx);
      ctx.rotate(mid);
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "white";
      ctx.font = `900 ${size * 0.07}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(seg.label, r * 0.6, 0);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.font = `800 ${size * 0.03}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText("OFF", r * 0.6, size * 0.042);
      ctx.restore();

      // Edge dot
      const dx = cx + Math.cos(a1) * (r - 7);
      const dy = cx + Math.sin(a1) * (r - 7);
      ctx.beginPath();
      ctx.arc(dx, dy, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fill();
    });

    // Inner shadow
    const iS = ctx.createRadialGradient(cx, cx, r * 0.14, cx, cx, r * 0.26);
    iS.addColorStop(0, "rgba(0,0,0,0.35)");
    iS.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(cx, cx, r * 0.26, 0, 2 * Math.PI);
    ctx.fillStyle = iS;
    ctx.fill();

    // Hub
    const hG = ctx.createRadialGradient(cx - 5, cx - 5, 0, cx, cx, r * 0.22);
    hG.addColorStop(0, "#fef3c7");
    hG.addColorStop(0.5, "#f59e0b");
    hG.addColorStop(1, "#78350f");
    ctx.beginPath();
    ctx.arc(cx, cx, r * 0.22, 0, 2 * Math.PI);
    ctx.fillStyle = hG;
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = `${size * 0.1}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎁", cx, cx + 2);

    // Pointer
    const pw = size * 0.065;
    const ph = size * 0.09;
    ctx.beginPath();
    ctx.moveTo(cx, ph + 3);
    ctx.lineTo(cx - pw, 3);
    ctx.lineTo(cx + pw, 3);
    ctx.closePath();
    const pG = ctx.createLinearGradient(cx, 0, cx, ph);
    pG.addColorStop(0, "#fbbf24");
    pG.addColorStop(1, "#dc2626");
    ctx.fillStyle = pG;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, 9, 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
  }, [segAngle]);

  // ─── CONFETTI ───
  const launchConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#fbbf24"];
    const particles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      const angle = (Math.PI * 2 * i) / 150 + (Math.random() - 0.5) * 0.8;
      const speed = 5 + Math.random() * 12;
      particles.push({
        x: w / 2, y: h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        life: 1,
        shape: ["rect", "circle", "strip"][Math.floor(Math.random() * 3)] as any,
      });
    }
    particlesRef.current = particles;
    const anim = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.985;
        p.rotation += p.rotationSpeed; p.life -= 0.006;
        if (p.life <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.min(1, p.life * 1.5);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else if (p.shape === "strip") ctx.fillRect(-p.size / 2, -1.5, p.size, 3);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI); ctx.fill(); }
        ctx.restore();
      }
      if (alive) confettiAnimRef.current = requestAnimationFrame(anim);
    };
    confettiAnimRef.current = requestAnimationFrame(anim);
  }, []);

  useEffect(() => { drawWheel(0); }, [drawWheel]);

  // ─── SPIN ───
  const spin = () => {
    if (spinning || finished) return;
    soundRef.current.init();
    setSpinning(true);

    let winIdx = SEGMENTS.findIndex((s) => s.percent === winningPercent);
    if (winIdx === -1) winIdx = 0;

    const fullSpins = 9 + Math.random() * 5;
    const segCenter = winIdx * segAngle + segAngle / 2;
    const target = fullSpins * 2 * Math.PI + (2 * Math.PI - segCenter);

    targetRotRef.current = target;
    startTimeRef.current = performance.now();
    lastTickSegRef.current = -1;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const rotation = eased * target;
      const speed = progress < 0.98 ? (1 - progress) : 0;

      const curSeg = Math.floor(((rotation % (2 * Math.PI)) / segAngle)) % SEGMENTS.length;
      if (curSeg !== lastTickSegRef.current) {
        lastTickSegRef.current = curSeg;
        if (progress < 0.97) {
          soundRef.current.tick(speed);
          setTickFlash((c) => c + 1);
        }
      }

      if (progress > 0.92 && progress < 0.93 && lastSpeedRef.current <= 0.92) {
        soundRef.current.nearStop();
      }
      lastSpeedRef.current = progress;

      drawWheel(rotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        if (soundRef.current.ctx && soundRef.current.ctx.state === "suspended") {
          soundRef.current.ctx.resume();
        }
        setTimeout(() => {
          soundRef.current.win();
          launchConfetti();
          setShowResult(true);
          onComplete?.();
        }, 700);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleClose = () => {
    soundRef.current.stopApplause();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    onClose?.();
  };

  useEffect(() => {
    return () => {
      soundRef.current.stopApplause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Confetti canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* Mute button */}
      <button
        onClick={() => {
          soundRef.current.init(); // Init audio on this user gesture too
          setMuted(!muted);
        }}
        className={`fixed top-5 right-5 z-50 h-12 w-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
          muted
            ? "bg-red-600 hover:bg-red-700"
            : "bg-white/10 backdrop-blur hover:bg-white/20 border border-white/20"
        }`}
      >
        {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </button>

      {/* Close button (only after result) */}
      {showResult && (
        <button
          onClick={handleClose}
          className="fixed top-5 left-5 z-50 h-12 w-12 rounded-full flex items-center justify-center text-white bg-white/10 backdrop-blur hover:bg-white/20 border border-white/20 transition-all shadow-lg"
        >
          <X className="h-6 w-6" />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 p-6 pb-12 my-auto">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight">
          🎉 All 3 Reviews Verified! Spin for Your Discount!
        </h2>

        {!showResult ? (
          <>
            <div className="relative">
              {/* Glow */}
              <div
                className={`absolute -inset-5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 blur-xl transition-opacity duration-500 ${
                  spinning ? "opacity-60 animate-pulse" : "opacity-15"
                }`}
              />

              {/* Chase lights */}
              <div className="absolute -inset-4 z-0">
                {Array.from({ length: 28 }).map((_, i) => {
                  const a = (i / 28) * 360;
                  return (
                    <div
                      key={i}
                      className="absolute w-2.5 h-2.5 rounded-full transition-all duration-75"
                      style={{
                        top: `${50 - 49 * Math.cos((a * Math.PI) / 180)}%`,
                        left: `${50 + 49 * Math.sin((a * Math.PI) / 180)}%`,
                        backgroundColor: spinning
                          ? i % 3 === tickFlash % 3 ? "#fbbf24" : i % 3 === (tickFlash + 1) % 3 ? "#ef4444" : "#7c3aed"
                          : i % 2 === 0 ? "#fbbf24" : "#78350f",
                        opacity: spinning ? 1 : 0.5,
                        boxShadow: spinning ? `0 0 8px 3px ${i % 3 === tickFlash % 3 ? "rgba(251,191,36,0.8)" : "rgba(239,68,68,0.5)"}` : "none",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  );
                })}
              </div>

              <canvas
                ref={canvasRef}
                width={CANVAS}
                height={CANVAS}
                className="relative z-10 w-[300px] h-[300px] sm:w-[380px] sm:h-[380px]"
              />
            </div>

            <button
              onClick={spin}
              disabled={spinning || finished}
              className={`relative text-white font-black text-xl sm:text-2xl px-12 sm:px-16 py-6 sm:py-7 rounded-full shadow-2xl transition-all duration-300 z-10 ${
                spinning
                  ? "bg-amber-700 cursor-not-allowed scale-95"
                  : "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 hover:scale-110 hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-95 animate-pulse"
              }`}
            >
              {spinning ? (
                <span className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 animate-spin" />
                  Spinning...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  🎰 SPIN THE WHEEL!
                </span>
              )}
            </button>
          </>
        ) : (
          <div className="text-center space-y-5 z-10">
            <div className="text-8xl animate-bounce">🎉</div>
            <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              YOU WON {winningPercent}% OFF!
            </h3>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-400/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl shadow-green-500/20">
              <p className="text-green-300 font-semibold text-sm mb-2">Your exclusive discount code:</p>
              <p className="font-mono text-3xl sm:text-4xl font-black text-white tracking-widest mb-3">
                {promoCode}
              </p>
              <div className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-full text-lg font-black shadow-lg">
                🏷️ {winningPercent}% OFF YOUR NEXT ORDER
              </div>
            </div>
            <p className="text-white/40 text-sm">
              We&apos;ve also emailed this code to you. Use it at checkout!
            </p>
            <button
              onClick={handleClose}
              className="mt-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-full border border-white/20 transition-all"
            >
              Close
            </button>
          </div>
        )}

        {/* Attribution */}
        <p className="text-[10px] text-white/15 mt-4">
          Applause sound by u_1s41v2luip from Pixabay
        </p>
      </div>
    </div>
  );
}
