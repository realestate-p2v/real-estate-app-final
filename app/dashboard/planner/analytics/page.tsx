// app/dashboard/planner/analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3, TrendingUp, TrendingDown, Flame, Calendar,
  Loader2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AnalyticsData {
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  streak: number;
  byPlatform: Record<string, number>;
  byProperty: { address: string; count: number }[];
  weeklyActivity: { day: string; count: number }[];
}

// ─── Analytics Page ─────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [actionsRes, propertiesRes] = await Promise.all([
        supabase
          .from("marketing_actions")
          .select("id, property_id, action_type, platform, content_type, created_at")
          .eq("user_id", userId)
          .gte("created_at", startOfLastWeek.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("agent_properties")
          .select("id, address")
          .eq("user_id", userId),
      ]);

      const actions = actionsRes.data || [];
      const properties = propertiesRes.data || [];
      const propMap = new Map(properties.map((p: { id: string; address: string }) => [p.id, p.address]));

      // This week vs last week
      const thisWeekActions = actions.filter(
        (a: { created_at: string }) => new Date(a.created_at) >= startOfWeek
      );
      const lastWeekActions = actions.filter(
        (a: { created_at: string }) => {
          const d = new Date(a.created_at);
          return d >= startOfLastWeek && d < startOfWeek;
        }
      );

      // This month (re-fetch if needed, but approximate from last 2 weeks)
      const thisMonthActions = actions.filter(
        (a: { created_at: string }) => new Date(a.created_at) >= startOfMonth
      );

      // Streak — consecutive days with actions
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 60; i++) {
        const checkDay = new Date(today);
        checkDay.setDate(today.getDate() - i);
        const dayStr = checkDay.toISOString().split("T")[0];
        const hasAction = actions.some((a: { created_at: string }) => a.created_at.startsWith(dayStr));
        if (hasAction) streak++;
        else if (i > 0) break; // Allow today to be empty
      }

      // By platform
      const byPlatform: Record<string, number> = {};
      thisWeekActions.forEach((a: { platform?: string }) => {
        if (a.platform) {
          byPlatform[a.platform] = (byPlatform[a.platform] || 0) + 1;
        }
      });

      // By property
      const propCounts: Record<string, number> = {};
      thisWeekActions.forEach((a: { property_id?: string }) => {
        if (a.property_id) {
          propCounts[a.property_id] = (propCounts[a.property_id] || 0) + 1;
        }
      });
      const byProperty = Object.entries(propCounts)
        .map(([id, count]) => ({ address: propMap.get(id) || "Unknown", count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Weekly activity (last 7 days)
      const weeklyActivity: { day: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        const count = actions.filter((a: { created_at: string }) => a.created_at.startsWith(dayStr)).length;
        weeklyActivity.push({ day: dayLabel, count });
      }

      setData({
        thisWeek: thisWeekActions.length,
        lastWeek: lastWeekActions.length,
        thisMonth: thisMonthActions.length,
        streak,
        byPlatform,
        byProperty,
        weeklyActivity,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const weekChange = data.thisWeek - data.lastWeek;
  const weekChangePercent = data.lastWeek > 0 ? Math.round((weekChange / data.lastWeek) * 100) : 0;
  const maxBarValue = Math.max(...data.weeklyActivity.map((d) => d.count), 1);

  const PLATFORM_COLORS: Record<string, string> = {
    instagram: "bg-pink-400",
    facebook: "bg-blue-400",
    linkedin: "bg-sky-400",
    blog: "bg-emerald-400",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/planner" className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
            <ArrowLeft className="h-4 w-4 text-white/40" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 ring-1 ring-violet-400/20">
            <BarChart3 className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white/90">Marketing Analytics</h1>
            <p className="text-xs text-white/30">Track your marketing activity</p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* This week */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-1">This Week</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white/90">{data.thisWeek}</span>
              {weekChange !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${weekChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {weekChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {weekChange > 0 ? "+" : ""}{weekChangePercent}%
                </span>
              )}
            </div>
          </div>

          {/* Last week */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-1">Last Week</p>
            <span className="text-3xl font-black text-white/50">{data.lastWeek}</span>
          </div>

          {/* This month */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-1">This Month</p>
            <span className="text-3xl font-black text-white/90">{data.thisMonth}</span>
          </div>

          {/* Streak */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-1">Streak</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-amber-400">{data.streak}</span>
              <Flame className="h-5 w-5 text-amber-400 mb-1" />
            </div>
            <p className="text-[10px] text-white/20 mt-0.5">consecutive days</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Weekly activity bar chart */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-sm font-bold text-white/70 mb-4">Weekly Activity</p>
            <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
              {data.weeklyActivity.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-white/30 font-medium">{d.count}</span>
                  <div
                    className="w-full rounded-t-md bg-emerald-400/30 transition-all duration-500"
                    style={{ height: `${(d.count / maxBarValue) * 80}px`, minHeight: d.count > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-white/25">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By platform */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-sm font-bold text-white/70 mb-4">By Platform</p>
            <div className="space-y-3">
              {Object.entries(data.byPlatform).length === 0 ? (
                <p className="text-xs text-white/20">No activity this week</p>
              ) : (
                Object.entries(data.byPlatform)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => {
                    const total = Object.values(data.byPlatform).reduce((s, c) => s + c, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={platform} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60 capitalize">{platform}</span>
                          <span className="text-xs text-white/30">{count}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${PLATFORM_COLORS[platform] || "bg-white/20"} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* By property */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 lg:col-span-2">
            <p className="text-sm font-bold text-white/70 mb-4">By Property</p>
            {data.byProperty.length === 0 ? (
              <p className="text-xs text-white/20">No property-specific activity this week</p>
            ) : (
              <div className="space-y-2.5">
                {data.byProperty.map((p) => (
                  <div key={p.address} className="flex items-center justify-between">
                    <span className="text-xs text-white/60">{p.address.split(",")[0]}</span>
                    <span className="text-xs font-bold text-white/40">{p.count} actions</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
