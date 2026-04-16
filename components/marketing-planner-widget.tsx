// components/marketing-planner-widget.tsx
// Dashboard widget — greeting, this week's sprint calendar, brand score
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, Loader2, Sparkles, ChevronRight, Home, Check, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ScheduleItem {
  id: string;
  property_id: string;
  scheduled_date: string;
  platform: string;
  content_type: string;
  caption: string;
  asset_url: string;
  status: "pending" | "posted" | "skipped";
}

interface BrandScore {
  percentage: number;
  grade: string;
}

interface MarketingPlannerWidgetProps {
  isSubscriber: boolean;
  isTrial: boolean;
  scores?: any[];
}

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const firstName = name?.split(" ")[0] || "there";
  return `Good ${time}, ${firstName}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📷", facebook: "📘", linkedin: "💼",
};

export default function MarketingPlannerWidget({ isSubscriber, isTrial }: MarketingPlannerWidgetProps) {
  const [agentName, setAgentName] = useState("");
  const [brandScore, setBrandScore] = useState<BrandScore | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<ScheduleItem[]>([]);
  const [propertyMap, setPropertyMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hasSprint, setHasSprint] = useState(false);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];

      const [profileRes, scheduleRes, propsRes, planRes, scoreRes] = await Promise.all([
        supabase.from("lens_usage").select("saved_agent_name").eq("user_id", userId).single(),
        supabase.from("marketing_schedule")
          .select("id, property_id, scheduled_date, platform, content_type, caption, asset_url, status")
          .eq("user_id", userId)
          .gte("scheduled_date", startStr)
          .lte("scheduled_date", endStr)
          .order("scheduled_date", { ascending: true }),
        supabase.from("agent_properties")
          .select("id, address")
          .eq("user_id", userId)
          .is("merged_into_id", null),
        supabase.from("marketing_plans")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1),
        fetch("/api/planner/score").then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (profileRes.data?.saved_agent_name) setAgentName(profileRes.data.saved_agent_name);
      setWeekSchedule(scheduleRes.data || []);
      setHasSprint(!!(planRes.data && planRes.data.length > 0));

      const pMap = new Map<string, string>();
      (propsRes.data || []).forEach((p: any) => pMap.set(p.id, p.address.split(",")[0]));
      setPropertyMap(pMap);

      if (scoreRes?.brandScore) setBrandScore(scoreRes.brandScore);
    } catch (err) {
      console.error("Widget load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isSubscriber && !isTrial) return null;

  const greeting = getGreeting(agentName);
  const today = new Date().toISOString().split("T")[0];

  // Build week days
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // Week stats
  const weekPosted = weekSchedule.filter(s => s.status === "posted").length;
  const weekTotal = weekSchedule.length;
  const weekPct = weekTotal > 0 ? Math.round((weekPosted / weekTotal) * 100) : 0;
  const todayPosts = weekSchedule.filter(s => s.scheduled_date === today && s.status === "pending");
  const overduePosts = weekSchedule.filter(s => s.scheduled_date < today && s.status === "pending");

  const getWeekLabel = () => {
    if (weekTotal === 0) return null;
    if (weekPct === 100) return { text: "🔥 Perfect Week!", color: "text-emerald-400" };
    if (weekPct >= 75) return { text: "⭐ Strong Week", color: "text-emerald-400" };
    if (weekPct >= 50) return { text: "Good Start", color: "text-blue-400" };
    if (weekPct > 0) return { text: "Let's keep going!", color: "text-amber-400" };
    return { text: "Fresh week — let's go!", color: "text-gray-400" };
  };
  const weekLabel = getWeekLabel();

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              {loading ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 text-white/20 animate-spin" />
                  <span className="text-sm text-white/30">Loading your planner...</span>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-bold text-emerald-400/70 uppercase tracking-wider mb-0.5">
                    Lensy · Marketing Planner
                  </p>
                  <p className="text-base font-bold text-white/90">{greeting}</p>
                  <p className="text-sm mt-1 leading-relaxed text-white/50">
                    {todayPosts.length > 0
                      ? `You have ${todayPosts.length} ${todayPosts.length === 1 ? "post" : "posts"} ready for today — let's get them out there!`
                      : overduePosts.length > 0
                      ? `${overduePosts.length} ${overduePosts.length === 1 ? "post is" : "posts are"} ready to go — posting consistently keeps you top of mind!`
                      : hasSprint
                      ? "Your sprint is rolling — consistent agents build the strongest brands!"
                      : "Create a 30-day sprint to keep your listings in front of buyers every day."}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Brand score pill */}
          {!loading && brandScore && (
            <Link href="/dashboard/planner"
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <span className={`text-lg font-black ${brandScore.percentage >= 62 ? "text-emerald-400" : brandScore.percentage >= 37 ? "text-amber-400" : "text-red-400"}`}>
                {brandScore.grade}
              </span>
              <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Brand</span>
            </Link>
          )}
        </div>
      </div>

      {/* This Week's Calendar */}
      {!loading && weekSchedule.length > 0 && (
        <div className="border-t border-white/[0.05] px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <p className="text-[12px] font-bold text-white/70 uppercase tracking-wider">This Week</p>
            </div>
            {weekLabel && (
              <p className={`text-[13px] font-bold ${weekLabel.color}`}>{weekLabel.text} · {weekPosted}/{weekTotal}</p>
            )}
          </div>

          {/* Mini week grid */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {weekDays.map((day, i) => {
              const dayPosts = weekSchedule.filter(s => s.scheduled_date === day);
              const isToday = day === today;
              const isPast = day < today;
              const allPosted = dayPosts.length > 0 && dayPosts.every(s => s.status === "posted");
              const hasPending = dayPosts.some(s => s.status === "pending");
              const allSkipped = dayPosts.length > 0 && dayPosts.every(s => s.status === "skipped");

              return (
                <Link key={day} href={dayPosts.length > 0 ? `/dashboard/planner?post=${dayPosts[0].id}` : "/dashboard/planner"} className="text-center block">
                  <p className="text-[11px] text-white/50 font-bold mb-1.5">{DAY_NAMES[i]}</p>
                  <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-[13px] font-extrabold border transition-all ${
                    allPosted
                      ? "bg-emerald-500/30 border-emerald-400/60 text-emerald-300"
                      : hasPending && isPast
                      ? "bg-amber-500/30 border-amber-400/60 text-amber-300"
                      : hasPending && isToday
                      ? "bg-blue-500/30 border-blue-400/70 text-blue-200 ring-2 ring-blue-400/40"
                      : hasPending
                      ? "bg-white/[0.08] border-white/[0.15] text-white/70"
                      : allSkipped
                      ? "bg-white/[0.04] border-white/[0.08] text-white/30 line-through"
                      : "bg-white/[0.02] border-white/[0.04] text-white/20"
                  }`}>
                    {allPosted ? <Check className="w-4 h-4" /> : dayPosts.length > 0 ? dayPosts.length : "—"}
                  </div>
                  {dayPosts.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dayPosts.slice(0, 3).map(p => (
                        <span key={p.id} className="text-[22px] leading-none">{PLATFORM_ICONS[p.platform] || "📌"}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Week progress bar */}
          {weekTotal > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${weekPct === 100 ? "bg-emerald-400" : weekPct >= 50 ? "bg-blue-400" : "bg-amber-400"}`}
                  style={{ width: `${weekPct}%` }}
                />
              </div>
              <span className="text-[12px] font-bold text-white/60">{weekPct}%</span>
            </div>
          )}

          {/* Today's posts — quick action */}
          {todayPosts.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {todayPosts.slice(0, 2).map(post => (
                <Link
                  key={post.id}
                  href={`/dashboard/planner?post=${post.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-blue-500/20 bg-blue-950/20 hover:bg-blue-950/30 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm">{PLATFORM_ICONS[post.platform] || "📌"}</span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-white/80 truncate">
                        {propertyMap.get(post.property_id) || "Post"} — {post.content_type?.replace(/[-_]/g, " ")}
                      </p>
                      <p className="text-[10px] text-white/30 truncate">{post.caption?.slice(0, 60)}...</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-400 shrink-0 group-hover:text-blue-300">Post →</span>
                </Link>
              ))}
            </div>
          )}

          {/* Overdue posts */}
          {todayPosts.length === 0 && overduePosts.length > 0 && (
            <div className="mt-3">
              <Link
                href={`/dashboard/planner?post=${overduePosts[0].id}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-950/20 hover:bg-amber-950/30 transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm">{PLATFORM_ICONS[overduePosts[0].platform] || "📌"}</span>
                  <p className="text-[12px] font-semibold text-white/80 truncate">
                    {overduePosts.length} {overduePosts.length === 1 ? "post" : "posts"} ready to go
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-400 shrink-0">Catch up →</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* No sprint yet — CTA to create one */}
      {!loading && weekSchedule.length === 0 && !hasSprint && (
        <div className="border-t border-white/[0.05] px-4 py-3">
          <Link href="/dashboard/planner"
            className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 hover:bg-emerald-950/30 transition-all group">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🚀</span>
              <div>
                <p className="text-[13px] font-bold text-white/80">Create a 30-Day Marketing Sprint</p>
                <p className="text-[11px] text-white/30">Lensy plans your posts — you just hit share</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      )}

      {/* Open Planner CTA */}
      <div className="border-t border-white/[0.05] px-4 py-3">
        <Link href="/dashboard/planner"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm font-bold hover:bg-emerald-400/15 transition-colors">
          <Sparkles className="h-4 w-4" />
          Open Marketing Planner
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
