"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Volume2, VolumeX } from "lucide-react";

// ─── SEGMENTS (9 total, variable width) ───
// Total: 42×8 + 24 = 360°
const SEGMENTS = [
  { value: 20, label: "20%", color: "#dc2626", angle: 42 },
  { value: 25, label: "25%", color: "#16a34a", angle: 42 },
  { value: 30, label: "30%", color: "#2563eb", angle: 42 },
  { value: 22, label: "22%", color: "#d946ef", angle: 42 },
  { value: "jackpot", label: "FREE VIDEO", color: "#FFD700", angle: 24 },
  { value: 28, label: "28%", color: "#0d9488", angle: 42 },
  { value: 23, label: "23%", color: "#7c3aed", angle: 42 },
  { value: 26, label: "26%", color: "#e11d48", angle: 42 },
  { value: 21, label: "21%", color: "#ea580c", angle: 42 },
];

// ─── CONFETTI ───
interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rotation: number;
  rotationSpeed: number; life: number; shape: "rect" | "circle" | "strip";
}

interface SpinLog {
  spin: number;
  targetLabel: string;
  detectedLabel: string;
  match: boolean;
  finalDeg: number;
  normalizedDeg: number;
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

  win(isJackpot = false) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === "suspended") ctx.resume();

    const notes = isJackpot
      ? [523, 659, 784, 1047, 1175, 1319, 1568]
      : [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      osc.type = "triangle";
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(isJackpot ? 0.22 : 0.18, ctx.currentTime + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });

    setTimeout(() => {
      if (!ctx || this.muted) return;
      const sparkleCount = isJackpot ? 12 : 6;
      for (let i = 0; i < sparkleCount; i++) {
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
        this.applauseAudio.volume = isJackpot ? 0.85 : 0.7;
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

// ─── ANGLE MATH (variable-width segments) ───

/** Given final rotation (radians), which segment is under the pointer (top, 12 o'clock)? */
function getWinningIndex(finalRotationRad: number): number {
  const totalDeg = ((finalRotationRad * 180) / Math.PI) % 360;
  const normalizedDeg = ((360 - totalDeg) % 360 + 360) % 360;
  let cumulative = 0;
  for (let i = 0; i < SEGMENTS.length; i++) {
    cumulative += SEGMENTS[i].angle;
    if (normalizedDeg < cumulative) {
      return i;
    }
  }
  return 0;
}

/** Get the normalizedDeg value for debug logging */
function getNormalizedDeg(finalRotationRad: number): number {
  const totalDeg = ((finalRotationRad * 180) / Math.PI) % 360;
  return ((360 - totalDeg) % 360 + 360) % 360;
}

/** Calculate rotation target (radians) to land on a specific segment */
function getTargetRotation(targetIndex: number): number {
  let centerDeg = 0;
  for (let i = 0; i < targetIndex; i++) {
    centerDeg += SEGMENTS[i].angle;
  }
  centerDeg += SEGMENTS[targetIndex].angle / 2;

  const baseRotDeg = (360 - centerDeg + 360) % 360;
  const fullSpins = 9 + Math.random() * 5;
  const segHalfDeg = SEGMENTS[targetIndex].angle / 2;
  const jitter = (Math.random() - 0.5) * segHalfDeg * 0.7;

  return (fullSpins * 360 + baseRotDeg + jitter) * (Math.PI / 180);
}


// ═══════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════
export default function TestP2VPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const soundRef = useRef<SoundEngine>(new SoundEngine());
  const animationRef = useRef<number | null>(null);
  const confettiAnimRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const targetRotRef = useRef(0);
  const targetIndexRef = useRef(0);
  const lastTickRef = useRef(-1);
  const lastProgressRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  const [muted, setMuted] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [tickFlash, setTickFlash] = useState(0);
  const [wonSegment, setWonSegment] = useState<typeof SEGMENTS[0] | null>(null);
  const [spinLog, setSpinLog] = useState<SpinLog[]>([]);
  const [spinCount, setSpinCount] = useState(0);
  const [forceIndex, setForceIndex] = useState<number | null>(null);

  const CANVAS = 420;
  const DURATION = 7500;

  useEffect(() => {
    soundRef.current.muted = muted;
    if (soundRef.current.applauseAudio) {
      soundRef.current.applauseAudio.muted = muted;
    }
  }, [muted]);

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

    // Segments (variable width)
    let cumulativeAngle = 0;
    SEGMENTS.forEach((seg, i) => {
      const segRad = (seg.angle * Math.PI) / 180;
      const a1 = rotation + (cumulativeAngle * Math.PI) / 180 - Math.PI / 2;
      const a2 = a1 + segRad;
      const mid = a1 + segRad / 2;
      const isJackpotSeg = seg.value === "jackpot";

      const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, r);
      if (isJackpotSeg) {
        grad.addColorStop(0, "#FFF8DC");
        grad.addColorStop(0.35, "#FFD700");
        grad.addColorStop(0.7, "#DAA520");
        grad.addColorStop(1, "#B8860B");
      } else {
        grad.addColorStop(0, lighten(seg.color, 35));
        grad.addColorStop(0.35, seg.color);
        grad.addColorStop(1, darken(seg.color, 25));
      }

      ctx.beginPath();
      ctx.moveTo(cx, cx);
      ctx.arc(cx, cx, r, a1, a2);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isJackpotSeg) {
        ctx.beginPath();
        ctx.moveTo(cx, cx);
        ctx.arc(cx, cx, r, a1, a2);
        ctx.closePath();
        ctx.strokeStyle = "rgba(255,215,0,0.6)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.save();
      ctx.translate(cx, cx);
      ctx.rotate(mid);

      if (isJackpotSeg) {
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = "#78350f";
        ctx.font = `900 ${size * 0.035}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FREE", r * 0.65, -size * 0.015);
        ctx.fillText("VIDEO", r * 0.65, size * 0.02);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = "white";
        ctx.font = `900 ${size * 0.065}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(seg.label, r * 0.6, 0);
        ctx.shadowBlur = 0;
        ctx.font = `800 ${size * 0.028}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText("OFF", r * 0.6, size * 0.04);
      }
      ctx.restore();

      // Edge dot
      const dx = cx + Math.cos(a1) * (r - 7);
      const dy = cx + Math.sin(a1) * (r - 7);
      ctx.beginPath();
      ctx.arc(dx, dy, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fill();

      cumulativeAngle += seg.angle;
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

    // Pointer (top, 12 o'clock)
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
  }, []);

  // ─── CONFETTI ───
  const launchConfetti = useCallback((isJackpot = false) => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const colors = isJackpot
      ? ["#FFD700", "#FFA500", "#FF6347", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#fbbf24", "#DAA520"]
      : ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#fbbf24"];
    const count = isJackpot ? 300 : 150;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const speed = (isJackpot ? 7 : 5) + Math.random() * 12;
      particles.push({
        x: w / 2, y: h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * (isJackpot ? 10 : 8),
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
        p.rotation += p.rotationSpeed; p.life -= (isJackpot ? 0.004 : 0.006);
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

  // ─── INITIAL DRAW ───
  useEffect(() => { drawWheel(0); }, [drawWheel]);

  // ─── SPIN ───
  const spin = (overrideIndex?: number) => {
    if (spinning) return;
    soundRef.current.init();
    setSpinning(true);
    setFinished(false);
    setShowResult(false);
    setWonSegment(null);

    // Determine target segment
    const targetIdx = overrideIndex !== undefined && overrideIndex !== null
      ? overrideIndex
      : Math.floor(Math.random() * SEGMENTS.length);

    targetIndexRef.current = targetIdx;
    const target = getTargetRotation(targetIdx);
    targetRotRef.current = target;
    startTimeRef.current = performance.now();
    lastTickRef.current = -1;
    lastProgressRef.current = 0;

    const currentSpinNum = spinCount + 1;
    setSpinCount(currentSpinNum);

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const rotation = eased * target;
      const speed = progress < 0.98 ? (1 - progress) : 0;

      // Tick sound on segment boundary crossings
      const rotDeg = ((rotation * 180 / Math.PI) % 360 + 360) % 360;
      const tickIndex = Math.floor(rotDeg / (360 / SEGMENTS.length));
      if (tickIndex !== lastTickRef.current) {
        lastTickRef.current = tickIndex;
        if (progress < 0.97) {
          soundRef.current.tick(speed);
          setTickFlash((c) => c + 1);
        }
      }

      if (progress > 0.92 && progress < 0.93 && lastProgressRef.current <= 0.92) {
        soundRef.current.nearStop();
      }
      lastProgressRef.current = progress;

      drawWheel(rotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // ─── VERIFY: calculate winning index from ACTUAL final rotation ───
        const verifiedIndex = getWinningIndex(rotation);
        const winner = SEGMENTS[verifiedIndex];
        const isJackpot = winner.value === "jackpot";
        const finalDeg = ((rotation * 180 / Math.PI) % 360);
        const normDeg = getNormalizedDeg(rotation);

        // Log this spin
        const targetSeg = SEGMENTS[targetIdx];
        const logEntry: SpinLog = {
          spin: currentSpinNum,
          targetLabel: targetSeg.value === "jackpot" ? "JACKPOT" : `${targetSeg.value}%`,
          detectedLabel: winner.value === "jackpot" ? "JACKPOT" : `${winner.value}%`,
          match: verifiedIndex === targetIdx,
          finalDeg: Math.round(finalDeg * 100) / 100,
          normalizedDeg: Math.round(normDeg * 100) / 100,
        };

        setWonSegment(winner);
        setSpinning(false);
        setFinished(true);
        setSpinLog((prev) => [logEntry, ...prev]);

        if (soundRef.current.ctx && soundRef.current.ctx.state === "suspended") {
          soundRef.current.ctx.resume();
        }

        setTimeout(() => {
          soundRef.current.win(isJackpot);
          launchConfetti(isJackpot);
          setShowResult(true);
        }, 700);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    setSpinning(false);
    setFinished(false);
    setShowResult(false);
    setWonSegment(null);
    setTickFlash(0);
    lastTickRef.current = -1;
    lastProgressRef.current = 0;
    soundRef.current.stopApplause();
    drawWheel(0);
    if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    const cc = confettiCanvasRef.current;
    if (cc) {
      const ctx = cc.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, cc.width, cc.height);
    }
  };

  useEffect(() => {
    return () => {
      soundRef.current.stopApplause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    };
  }, []);

  const isJackpotWin = wonSegment?.value === "jackpot";
  const displayLabel = wonSegment
    ? (wonSegment.value === "jackpot" ? "🎰 JACKPOT — FREE VIDEO!" : `${wonSegment.value}% OFF`)
    : "";

  const mismatchCount = spinLog.filter((l) => !l.match).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Mute */}
      <button
        onClick={() => { soundRef.current.init(); setMuted(!muted); }}
        className={`fixed top-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
          muted ? "bg-red-600 hover:bg-red-700" : "bg-white/10 backdrop-blur hover:bg-white/20 border border-white/20"
        }`}
      >
        {muted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
      </button>

      {/* Confetti */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-40" />

      {/* Title */}
      <div className="text-center mb-6 relative z-10">
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">
          🎰 Spin Wheel — Test Page
        </h1>
        <p className="text-white/40 text-sm">
          Variable-width segments · Jackpot sliver · Angle verification
        </p>
      </div>

      {/* Wheel + Controls */}
      <div className="relative flex flex-col items-center gap-4 z-10">
        {!showResult ? (
          <>
            <div className="relative">
              <div className={`absolute -inset-5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 blur-xl transition-opacity duration-500 ${
                spinning ? "opacity-60 animate-pulse" : "opacity-15"
              }`} />

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

            {/* Spin buttons */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => spin(forceIndex !== null ? forceIndex : undefined)}
                disabled={spinning}
                className={`relative text-white font-black text-xl px-12 py-5 rounded-full shadow-2xl transition-all duration-300 z-10 ${
                  spinning
                    ? "bg-amber-700 cursor-not-allowed scale-95"
                    : "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 hover:scale-110 hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-95 animate-pulse"
                }`}
              >
                {spinning ? (
                  <span className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 animate-spin" /> Spinning...
                  </span>
                ) : (
                  <span>🎰 SPIN {forceIndex !== null ? `→ ${SEGMENTS[forceIndex].label}` : "(Random)"}</span>
                )}
              </button>

              {/* Force-target selector */}
              <div className="flex flex-wrap justify-center gap-1.5">
                <button
                  onClick={() => setForceIndex(null)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                    forceIndex === null ? "bg-white text-slate-900" : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  Random
                </button>
                {SEGMENTS.map((seg, i) => (
                  <button
                    key={i}
                    onClick={() => setForceIndex(i)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                      forceIndex === i ? "text-white ring-2 ring-white" : "text-white/60 hover:text-white"
                    }`}
                    style={{
                      backgroundColor: forceIndex === i ? seg.color : `${seg.color}33`,
                    }}
                  >
                    {seg.value === "jackpot" ? "🎰 JP" : `${seg.value}%`}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4 z-10 relative">
            <div className={`text-7xl ${isJackpotWin ? "animate-bounce" : "animate-bounce"}`}>
              {isJackpotWin ? "🎰" : "🎉"}
            </div>
            <h2 className={`text-4xl font-black tracking-tight ${isJackpotWin ? "text-yellow-300" : "text-white"}`}>
              {displayLabel}
            </h2>
            {isJackpotWin && (
              <p className="text-lg text-yellow-200 font-bold">Free 15-clip Standard video ($79 value)</p>
            )}
            <div className={`border-2 backdrop-blur-sm rounded-2xl p-6 shadow-2xl ${
              isJackpotWin
                ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-400/60"
                : "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-400/60"
            }`}>
              <div className={`inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-lg font-black shadow-lg ${
                isJackpotWin ? "bg-yellow-500" : "bg-green-500"
              }`}>
                {isJackpotWin ? "🎰 FREE VIDEO" : `🏷️ ${wonSegment?.value}% OFF`}
              </div>
            </div>
            <button
              onClick={reset}
              className="mt-3 text-white/50 hover:text-white text-sm underline underline-offset-4 transition-colors"
            >
              Reset & spin again
            </button>
          </div>
        )}
      </div>

      {/* ─── SPIN LOG TABLE ─── */}
      {spinLog.length > 0 && (
        <div className="relative z-10 mt-8 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm">
              Spin Log ({spinLog.length} spins · {mismatchCount === 0
                ? <span className="text-green-400">All matched ✓</span>
                : <span className="text-red-400">{mismatchCount} MISMATCHES ✗</span>
              })
            </h3>
            <button
              onClick={() => setSpinLog([])}
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              Clear log
            </button>
          </div>
          <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs text-white/70">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Target</th>
                  <th className="px-3 py-2 text-left">Detected</th>
                  <th className="px-3 py-2 text-center">Match</th>
                  <th className="px-3 py-2 text-right">Final°</th>
                  <th className="px-3 py-2 text-right">Norm°</th>
                </tr>
              </thead>
              <tbody>
                {spinLog.slice(0, 20).map((log, i) => (
                  <tr key={i} className={`border-b border-white/5 ${!log.match ? "bg-red-500/10" : ""}`}>
                    <td className="px-3 py-1.5">{log.spin}</td>
                    <td className="px-3 py-1.5 font-mono">{log.targetLabel}</td>
                    <td className="px-3 py-1.5 font-mono">{log.detectedLabel}</td>
                    <td className="px-3 py-1.5 text-center">
                      {log.match
                        ? <span className="text-green-400 font-bold">✓</span>
                        : <span className="text-red-400 font-bold">✗</span>
                      }
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">{log.finalDeg}°</td>
                    <td className="px-3 py-1.5 text-right font-mono">{log.normalizedDeg}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Segment reference */}
      <div className="relative z-10 mt-6 w-full max-w-2xl">
        <h3 className="text-white/40 font-bold text-xs mb-2">Segment Layout (clockwise from top)</h3>
        <div className="flex flex-wrap gap-1.5">
          {(() => {
            let cum = 0;
            return SEGMENTS.map((seg, i) => {
              const start = cum;
              cum += seg.angle;
              return (
                <div
                  key={i}
                  className="text-[10px] px-2 py-1 rounded font-mono text-white/80"
                  style={{ backgroundColor: `${seg.color}55` }}
                >
                  [{i}] {seg.value === "jackpot" ? "JP" : `${seg.value}%`} · {seg.angle}° · {start}°–{cum}°
                </div>
              );
            });
          })()}
        </div>
      </div>

      <p className="fixed bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/20 z-10">
        Test page — not linked publicly
      </p>
    </div>
  );
}
