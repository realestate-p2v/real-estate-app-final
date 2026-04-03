"use client";

import { useState } from "react";
import { Camera, MessageSquare, PenTool, Sofa, CheckCircle, Sparkles, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpinWheel, type WheelSegment } from "@/components/spin-wheel";

const TRIAL_SPIN_SEGMENTS: WheelSegment[] = [
  { value: 10, label: "10%", color: "#2563eb", angle: 90 },
  { value: 15, label: "15%", color: "#16a34a", angle: 80 },
  { value: 20, label: "20%", color: "#7c3aed", angle: 70 },
  { value: 25, label: "25%", color: "#ea580c", angle: 50 },
  { value: "free_lens", label: "1 MONTH FREE", color: "#0891b2", angle: 40 },
  { value: 50, label: "50%", color: "#FFD700", angle: 30 },
];

interface MockFeature {
  key: string;
  label: string;
  icon: React.ElementType;
  tried: boolean;
}

export default function TestP2VPage() {
  const [features, setFeatures] = useState<MockFeature[]>([
    { key: "coach", label: "Photo Coach", icon: Camera, tried: false },
    { key: "descriptions", label: "Description Writer", icon: MessageSquare, tried: false },
    { key: "design", label: "Design Studio", icon: PenTool, tried: false },
    { key: "staging", label: "Virtual Staging", icon: Sofa, tried: false },
  ]);
  const [showWheel, setShowWheel] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [result, setResult] = useState<{ label: string; value: number | string } | null>(null);

  const toggleFeature = (key: string) => {
    if (hasSpun) return;
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, tried: !f.tried } : f))
    );
  };

  const triedCount = features.filter((f) => f.tried).length;
  const allTried = triedCount === 4;

  const handleSpin = () => {
    setShowWheel(true);
  };

  const handleWheelResult = (segment: WheelSegment) => {
    setResult({ label: segment.label, value: segment.value });
    setHasSpun(true);
  };

  const handleReset = () => {
    setFeatures((prev) => prev.map((f) => ({ ...f, tried: false })));
    setShowWheel(false);
    setHasSpun(false);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">Trial Gamification Demo</h1>
          <p className="text-muted-foreground mt-2">
            Toggle the checkboxes below to simulate trying each Lens tool. When all 4 are checked, the spin button unlocks.
          </p>
        </div>

        {/* ═══ TRIAL BANNER (mock) ═══ */}
        <div className="bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-2xl p-5 sm:p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg">Try All 4 Features — Unlock a Reward</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasSpun
                  ? "You've already spun! Your reward is below."
                  : allTried
                  ? "All features tried! Spin the wheel for your discount."
                  : `${triedCount} of 4 features tried — try them all to unlock a reward!`}
              </p>

              {/* Feature checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.key}
                      type="button"
                      onClick={() => toggleFeature(feature.key)}
                      disabled={hasSpun}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all text-left ${
                        feature.tried
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-border hover:border-purple-300"
                      } ${hasSpun ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {feature.tried ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon
                          className={`h-3.5 w-3.5 flex-shrink-0 ${
                            feature.tried ? "text-green-600" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium truncate ${
                            feature.tried ? "text-green-700" : "text-muted-foreground"
                          }`}
                        >
                          {feature.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${(triedCount / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Spin button */}
              {allTried && !hasSpun && (
                <Button
                  onClick={handleSpin}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-black px-6 py-5 text-base rounded-full shadow-lg animate-pulse"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Spin for Your Reward
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ RESULT DISPLAY ═══ */}
        {hasSpun && result && (
          <div className="bg-card rounded-2xl border border-green-200 p-6 sm:p-8 mb-8 text-center">
            <div className="text-5xl mb-4">
              {result.value === "free_lens" ? "🎰" : "🎉"}
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">
              {result.value === "free_lens"
                ? "You Won 1 Month Free!"
                : `You Won ${result.label} Off!`}
            </h2>
            <p className="text-muted-foreground">
              {result.value === "free_lens"
                ? "In production, this grants 30 days of free P2V Lens access."
                : `In production, this creates a single-use Stripe coupon for ${result.label} off the first month.`}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 font-mono font-bold text-lg px-4 py-2 rounded-xl">
              {result.value === "free_lens" ? "FREE-LENS-30DAY" : `TRIAL${result.value}-DEMO`}
            </div>
          </div>
        )}

        {/* ═══ RESET BUTTON ═══ */}
        <div className="text-center">
          <Button variant="outline" onClick={handleReset} className="font-bold">
            Reset Demo
          </Button>
        </div>

        {/* ═══ IMPLEMENTATION NOTES ═══ */}
        <div className="mt-12 bg-muted/50 rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-3">Implementation Notes</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>In production:</strong> Checkboxes are replaced by real database queries — each feature is marked as &ldquo;tried&rdquo; when the user has at least one row in the corresponding table.</p>
            <p><strong>Photo Coach:</strong> <code>lens_sessions</code> table has a row for this user</p>
            <p><strong>Description Writer:</strong> <code>lens_descriptions</code> table has a row for this user</p>
            <p><strong>Design Studio:</strong> <code>lens_usage.free_design_exports_used &gt; 0</code></p>
            <p><strong>Virtual Staging:</strong> <code>lens_staging</code> table has a row for this user</p>
            <p><strong>Spin prevention:</strong> <code>lens_usage.trial_spin_used = true</code> after spinning</p>
            <p><strong>Visibility:</strong> Banner only shows for non-subscribers with <code>trial_spin_used = false</code></p>
          </div>
        </div>
      </div>

      {/* Spin wheel modal */}
      {showWheel && (
        <SpinWheel
          segments={TRIAL_SPIN_SEGMENTS}
          title="🎉 All Features Tried! Spin for Your Reward!"
          onResult={handleWheelResult}
          onClose={() => setShowWheel(false)}
        />
      )}
    </div>
  );
}
