// components/marketing-planner-widget.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, ChevronDown, ChevronUp, Copy, Check, ArrowRight, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";

interface ScheduleItem {
  id: string;
  property_id?: string;
  propertyAddress: string;
  scheduled_date: string;
  platform: string;
  content_type: string;
  caption?: string;
  status: string;
}

interface WidgetData {
  today: ScheduleItem[];
  tomorrow: ScheduleItem[];
  overdue: ScheduleItem[];
  todayDate: string;
  tomorrowDate: string;
}

interface ContentScoreCompact {
  propertyId: string;
  propertyAddress: string;
  percentage: number;
  grade: string;
}

interface MarketingPlannerWidgetProps {
  isSubscriber: boolean;
  isTrial: boolean;
  scores?: ContentScoreCompact[];
}

const PLATFORM_LABELS: Record<string, { short: string; color: string }> = {
  instagram: { short: "IG", color: "text-pink-400" },
  facebook: { short: "FB", color: "text-blue-400" },
  linkedin: { short: "LI", color: "text-sky-400" },
  blog: { short: "Blog", color: "text-emerald-400" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function ScheduleRow({
  item,
  isOverdue,
  onDone,
  onSkip,
  onCopy,
}: {
  item: ScheduleItem;
  isOverdue?: boolean;
  onDone: (id: string) => void;
  onSkip: (id: string) => void;
  onCopy: (id: string, caption: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const plat = PLATFORM_LABELS[item.platform] || { short: item.platform, color: "text-white/60" };

  const handleCopy = () => {
    if (item.caption) {
      onCopy(item.id, item.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addressShort = item.propertyAddress.split(",")[0] || item.propertyAddress;

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl ${isOverdue ? "bg-red-500/5 border border-red-500/10" : "bg-white/[0.03] border border-white/[0.04]"}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
        <span className={`text-[11px] font-bold tracking-wide ${plat.color} flex-shrink-0`}>{plat.short}</span>
        <span className="text-sm text-white/70 truncate">
          {addressShort} — {item.content_type.replace(/_/g, " ")}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {item.caption && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
        {isOverdue ? (
          <Link
            href="/dashboard/planner"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 hover:bg-emerald-400/10 transition-colors"
          >
            Do It <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <>
            <button
              onClick={() => onDone(item.id)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 hover:bg-emerald-400/10 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => onSkip(item.id)}
              className="px-2 py-1 rounded-lg text-[11px] font-medium text-white/20 hover:text-white/40 transition-colors"
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ address, percentage, grade }: { address: string; percentage: number; grade: string }) {
  const addressShort = address.split(",")[0] || address;
  const barColor =
    percentage >= 85 ? "bg-emerald-400" : percentage >= 70 ? "bg-cyan-400" : percentage >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <Link href="/dashboard/planner" className="group flex items-center gap-3">
      <span className="text-xs text-white/50 truncate flex-1 group-hover:text-white/70 transition-colors">{addressShort}</span>
      <span className={`text-[11px] font-bold ${percentage >= 70 ? "text-emerald-400" : percentage >= 50 ? "text-amber-400" : "text-red-400"}`}>
        {grade}
      </span>
      <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${percentage}%` }} />
      </div>
    </Link>
  );
}

export default function MarketingPlannerWidget({ isSubscriber, isTrial, scores }: MarketingPlannerWidgetProps) {
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/planner/widget");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Widget fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDone = async (id: string) => {
    await fetch("/api/planner/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "posted" }),
    });
    fetchData();
  };

  const handleSkip = async (id: string) => {
    await fetch("/api/planner/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "skipped" }),
    });
    fetchData();
  };

  const handleCopy = async (id: string, caption: string) => {
    await navigator.clipboard.writeText(caption);
    await fetch("/api/planner/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType: "caption_copied", metadata: { schedule_id: id } }),
    });
  };

  if (!isSubscriber && !isTrial) return null;

  const totalItems = data ? data.today.length + data.tomorrow.length + data.overdue.length : 0;
  const needsAttention = data ? data.overdue.length : 0;

  return (
    <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden" style={{ animationDelay: "0.19s" }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white/90">Marketing Planner</p>
            <p className="text-[10px] text-white/30">Your daily marketing calendar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-3.5 w-3.5 text-white/20 animate-spin" />}
          {!loading && totalItems > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              {totalItems} items
            </span>
          )}
          {!loading && needsAttention > 0 && (
            <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
              {needsAttention} overdue
            </span>
          )}
          {collapsed ? <ChevronDown className="h-4 w-4 text-white/20" /> : <ChevronUp className="h-4 w-4 text-white/20" />}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="border-t border-white/[0.06] px-4 pb-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
            </div>
          ) : data && totalItems === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-white/40">No scheduled posts yet</p>
              <Link
                href="/dashboard/planner"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Open Full Planner <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : data ? (
            <>
              {/* Today */}
              {data.today.length > 0 && (
                <div className="pt-3 space-y-2">
                  <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider px-1">Today — {formatDate(data.todayDate)}</p>
                  {data.today.map((item) => (
                    <ScheduleRow key={item.id} item={item} onDone={handleDone} onSkip={handleSkip} onCopy={handleCopy} />
                  ))}
                </div>
              )}

              {/* Tomorrow */}
              {data.tomorrow.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider px-1">Tomorrow — {formatDate(data.tomorrowDate)}</p>
                  {data.tomorrow.map((item) => (
                    <ScheduleRow key={item.id} item={item} onDone={handleDone} onSkip={handleSkip} onCopy={handleCopy} />
                  ))}
                </div>
              )}

              {/* Overdue */}
              {data.overdue.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-red-400/70 uppercase tracking-wider px-1">
                    Overdue ({data.overdue.length})
                  </p>
                  {data.overdue.map((item) => (
                    <ScheduleRow key={item.id} item={item} isOverdue onDone={handleDone} onSkip={handleSkip} onCopy={handleCopy} />
                  ))}
                </div>
              )}

              {/* Content Scores */}
              {scores && scores.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 px-1">
                    <BarChart3 className="h-3 w-3 text-white/20" />
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider">Content Scores</p>
                  </div>
                  {scores.map((s) => (
                    <ScoreBar key={s.propertyId} address={s.propertyAddress} percentage={s.percentage} grade={s.grade} />
                  ))}
                </div>
              )}

              {/* Footer CTA */}
              {needsAttention > 0 && (
                <div className="pt-1">
                  <Link
                    href="/dashboard/planner"
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 border border-emerald-400/10 transition-colors"
                  >
                    {needsAttention} items need attention — Open Full Planner <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </>
          ) : null}

          {/* Always show planner link */}
          {!loading && totalItems > 0 && needsAttention === 0 && (
            <div className="pt-1">
              <Link
                href="/dashboard/planner"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
              >
                Open Full Planner <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
