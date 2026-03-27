"use client";

import { useState, useEffect } from "react";
import { SpinWheel } from "@/components/spin-wheel";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SIGNUP_SEGMENTS = [
  { value: 10,          label: "$10\nOFF",   color: "#3b82f6", angle: 56 },
  { value: 15,          label: "15%\nOFF",   color: "#8b5cf6", angle: 52 },
  { value: 10,          label: "$10\nOFF",   color: "#06b6d4", angle: 56 },
  { value: 20,          label: "20%\nOFF",   color: "#f59e0b", angle: 63 },
  { value: 10,          label: "$10\nOFF",   color: "#22c55e", angle: 56 },
  { value: 15,          label: "15%\nOFF",   color: "#ec4899", angle: 52 },
  { value: "free_lens", label: "FREE\nLENS", color: "#14b8a6", angle: 25 },
];
// Total: 56+52+56+63+56+52+25 = 360 ✓

export function SignupSpin({ userId }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [prizeResult, setPrizeResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("lens_usage")
        .select("signup_spin_used")
        .eq("user_id", userId)
        .maybeSingle();

      // Show welcome if no row exists OR signup_spin_used is false
      if (!data || !data.signup_spin_used) {
        setTimeout(() => setShowWelcome(true), 1500);
      }
    };
    checkEligibility();
  }, [userId]);

  const handleSpinClick = () => {
    setShowWelcome(false);
    setShowWheel(true);
  };

  const handlePrizeWon = async (segment) => {
    setSaving(true);
    try {
      const res = await fetch("/api/signup-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prize: segment.value, emailOptIn }),
      });
      const data = await res.json();
      if (data.success) {
        setPrizeResult({ label: data.prizeLabel, code: data.promoCode });
      }
    } catch (err) {
      console.error("Signup spin error:", err);
    } finally {
      setSaving(false);
      setShowWheel(false);
    }
  };

  // Welcome modal
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-5 relative">
          <button
            onClick={() => setShowWelcome(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Gift className="h-8 w-8 text-accent" />
          </div>

          <h2 className="text-2xl font-black text-foreground">Welcome to P2V!</h2>

          <p className="text-muted-foreground">
            Spin the wheel to win a discount on your first order. Every spin wins!
          </p>

          <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
              className="rounded border-border"
            />
            Send me occasional tips and deals (you can unsubscribe anytime)
          </label>

          <Button
            onClick={handleSpinClick}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black px-8 py-6 text-lg rounded-full w-full"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            SPIN TO WIN!
          </Button>
        </div>
      </div>
    );
  }

  // Spin wheel
  if (showWheel) {
    return (
      <SpinWheel
        title="🎉 Welcome! Spin for Your Discount!"
        segments={SIGNUP_SEGMENTS}
        onResult={handlePrizeWon}
        onClose={() => setShowWheel(false)}
      />
    );
  }

  // Nothing to show
  return null;
}
