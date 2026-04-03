"use client";

import { useState, useEffect } from "react";
import { Camera, MessageSquare, PenTool, Sofa, CheckCircle, Sparkles, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpinWheel, type WheelSegment } from "@/components/spin-wheel";

interface TrialFeature {
  key: string;
  label: string;
  icon: React.ElementType;
  tried: boolean;
}

const TRIAL_SPIN_SEGMENTS: WheelSegment[] = [
  { value: 10, label: "10%", color: "#2563eb", angle: 90 },
  { value: 15, label: "15%", color: "#16a34a", angle: 80 },
  { value: 20, label: "20%", color: "#7c3aed", angle: 70 },
  { value: 25, label: "25%", color: "#ea580c", angle: 50 },
  { value: "free_lens", label: "1 MONTH FREE", color: "#0891b2", angle: 40 },
  { value: 50, label: "50%", color: "#FFD700", angle: 30 },
];

export function LensTrialBanner() {
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [features, setFeatures] = useState<TrialFeature[]>([
    { key: "coach", label: "Photo Coach", icon: Camera, tried: false },
    { key: "descriptions", label: "Description Writer", icon: MessageSquare, tried: false },
    { key: "design", label: "Design Studio", icon: PenTool, tried: false },
    { key: "staging", label: "Virtual Staging", icon: Sofa, tried: false },
  ]);
  const [showWheel, setShowWheel] = useState(false);
  const [spinResult, setSpinResult] = useState<{ type: string; label: string; code?: string } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [winningValue, setWinningValue] = useState<number | string | undefined>(undefined);
  const [promoCode, setPromoCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        setUserId(user.id);

        // Check if subscriber or already spun
        const { data: usage } = await supabase
          .from("lens_usage")
          .select("is_subscriber, trial_spin_used")
          .eq("user_id", user.id)
          .single();

        if (!usage || usage.is_subscriber || usage.trial_spin_used) {
          setLoading(false);
          return;
        }

        // Check each feature usage
        const [coachResult, descResult, designResult, stagingResult] = await Promise.all([
          supabase.from("lens_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("lens_descriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("lens_usage").select("free_design_exports_used").eq("user_id", user.id).single(),
          supabase.from("lens_staging").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        const coachTried = (coachResult.count || 0) > 0;
        const descTried = (descResult.count || 0) > 0;
        const designTried = (designResult.data?.free_design_exports_used || 0) > 0;
        const stagingTried = (stagingResult.count || 0) > 0;

        setFeatures([
          { key: "coach", label: "Photo Coach", icon: Camera, tried: coachTried },
          { key: "descriptions", label: "Description Writer", icon: MessageSquare, tried: descTried },
          { key: "design", label: "Design Studio", icon: PenTool, tried: designTried },
          { key: "staging", label: "Virtual Staging", icon: Sofa, tried: stagingTried },
        ]);

        setVisible(true);
      } catch (err) {
        console.error("Trial banner init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const triedCount = features.filter((f) => f.tried).length;
  const allTried = triedCount === 4;

  const handleSpinClick = async () => {
    if (!userId || spinning) return;
    setSpinning(true);

    try {
      const res = await fetch("/api/trial-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Something went wrong. Please try again.");
        setSpinning(false);
        return;
      }

      // Set the winning value and promo code before showing the wheel
      setWinningValue(data.prize.type === "free_lens" ? "free_lens" : data.prize.value);
      setPromoCode(data.prize.code || "");
      setSpinResult(data.prize);
      setShowWheel(true);
    } catch (err) {
      console.error("Trial spin error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSpinning(false);
    }
  };

  const handleWheelClose = () => {
    setShowWheel(false);
    setVisible(false);
  };

  if (loading || !visible) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-2xl p-5 sm:p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Gift className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg">Try All 4 Features — Unlock a Reward</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {allTried
                ? "All features tried! Spin the wheel for your discount."
                : `${triedCount} of 4 features tried — try them all to unlock a reward!`
              }
            </p>

            {/* Feature checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.key}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all ${
                      feature.tried
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-border"
                    }`}
                  >
                    {feature.tried ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${feature.tried ? "text-green-600" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium truncate ${feature.tried ? "text-green-700" : "text-muted-foreground"}`}>
                        {feature.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spin button — only when all 4 tried */}
            {allTried && (
              <Button
                onClick={handleSpinClick}
                disabled={spinning}
                className="mt-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-black px-6 py-5 text-base rounded-full shadow-lg animate-pulse"
              >
                {spinning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing your reward...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Spin for Your Reward
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Spin wheel modal */}
      {showWheel && (
        <SpinWheel
          winningPercent={winningValue as any}
          promoCode={promoCode}
          segments={TRIAL_SPIN_SEGMENTS}
          title="🎉 All Features Tried! Spin for Your Reward!"
          onClose={handleWheelClose}
        />
      )}
    </>
  );
}
