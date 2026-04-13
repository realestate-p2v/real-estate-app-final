// components/content-score.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Check, X, ArrowRight, BarChart3, Loader2, User, TrendingUp } from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScoreItem {
  key: string;
  label: string;
  points: number;
  earned: boolean;
  excluded: boolean;
  actionLabel?: string;
  actionHref?: string;
}

interface ContentScoreData {
  propertyId: string;
  propertyAddress: string;
  earned: number;
  possible: number;
  percentage: number;
  grade: string;
  items: ScoreItem[];
}

interface BrandScoreData {
  earned: number;
  possible: number;
  percentage: number;
  grade: string;
  items: ScoreItem[];
}

// ─── Compact Content Score (used in widget) ─────────────────────────────────

export function ContentScoreCompact({ propertyId, address, percentage, grade }: {
  propertyId: string;
  address: string;
  percentage: number;
  grade: string;
}) {
  const barColor =
    percentage >= 85 ? "bg-emerald-400" : percentage >= 70 ? "bg-cyan-400" : percentage >= 50 ? "bg-amber-400" : "bg-red-400";
  const gradeColor =
    percentage >= 70 ? "text-emerald-400" : percentage >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <Link href={`/dashboard/properties/${propertyId}`} className="group flex items-center gap-3 py-1">
      <span className="text-xs text-white/50 truncate flex-1 group-hover:text-white/70 transition-colors">
        {address.split(",")[0]}
      </span>
      <span className={`text-xs font-bold ${gradeColor}`}>{grade} ({percentage}%)</span>
      <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${percentage}%` }} />
      </div>
    </Link>
  );
}

// ─── Full Content Score Card (used on property detail page + planner) ───────

export function ContentScoreCard({ propertyId }: { propertyId: string }) {
  const [score, setScore] = useState<ContentScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/planner/score?propertyId=${propertyId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.scores && data.scores.length > 0) {
            setScore(data.scores[0]);
          }
        }
      } catch (err) {
        console.error("Score load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!score) return null;

  const ringColor =
    score.percentage >= 85 ? "text-emerald-400" : score.percentage >= 70 ? "text-cyan-400" : score.percentage >= 50 ? "text-amber-400" : "text-red-400";
  const ringStroke =
    score.percentage >= 85 ? "#34d399" : score.percentage >= 70 ? "#22d3ee" : score.percentage >= 50 ? "#fbbf24" : "#f87171";

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (score.percentage / 100) * circumference;
  const activeItems = score.items.filter((i) => !i.excluded);
  const completedCount = activeItems.filter((i) => i.earned).length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Content Score</p>
          <p className="text-[10px] text-white/30">{score.propertyAddress.split(",")[0]}</p>
        </div>
      </div>

      <div className="p-5">
        {/* Score Ring */}
        <div className="flex items-center gap-6 mb-5">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="40" fill="none" stroke={ringStroke} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${ringColor}`}>{score.grade}</span>
              <span className="text-[10px] text-white/30">{score.percentage}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-white/60">{completedCount} of {activeItems.length} items complete</p>
            <p className="text-xs text-white/30 mt-1">{score.earned} of {score.possible} points earned</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-1.5">
          {activeItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-2 py-1.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {item.earned ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-400/15 flex-shrink-0">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] flex-shrink-0">
                    <X className="h-3 w-3 text-white/20" />
                  </div>
                )}
                <span className={`text-xs ${item.earned ? "text-white/50" : "text-white/70"}`}>
                  {item.label}
                </span>
                <span className="text-[10px] text-white/20 flex-shrink-0">{item.points}pts</span>
              </div>
              {!item.earned && item.actionHref && (
                <Link
                  href={item.actionHref}
                  className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0"
                >
                  {item.actionLabel} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Brand Score Card ─────────────────────────────────────────────────

export function AgentBrandScoreCard() {
  const [score, setScore] = useState<BrandScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/planner/score");
        if (res.ok) {
          const data = await res.json();
          if (data.brandScore) {
            setScore(data.brandScore);
          }
        }
      } catch (err) {
        console.error("Brand score load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!score) return null;

  const gradeColor =
    score.percentage >= 70 ? "text-emerald-400" : score.percentage >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 ring-1 ring-violet-400/20">
          <User className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Agent Brand Score</p>
          <p className="text-[10px] text-white/30">Your personal marketing health</p>
        </div>
        <span className={`ml-auto text-lg font-black ${gradeColor}`}>{score.grade} <span className="text-xs font-medium text-white/30">({score.percentage}%)</span></span>
      </div>

      <div className="p-4 space-y-1.5">
        {score.items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-2 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {item.earned ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-400/15 flex-shrink-0">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] flex-shrink-0">
                  <X className="h-3 w-3 text-white/20" />
                </div>
              )}
              <span className={`text-xs ${item.earned ? "text-white/50" : "text-white/70"}`}>
                {item.label}
              </span>
            </div>
            {!item.earned && item.actionHref && (
              <Link
                href={item.actionHref}
                className="flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
              >
                {item.actionLabel} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
