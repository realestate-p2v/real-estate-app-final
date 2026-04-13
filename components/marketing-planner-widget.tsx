// components/marketing-planner-widget.tsx
// Conversational marketing copilot — sits at the top of the dashboard
// Greets the agent by name, shows what needs doing today, offers quick actions
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, AlertTriangle, Loader2, Sparkles, Calendar, BarChart3, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface WidgetSuggestion {
  id: string;
  title: string;
  description: string;
  buttons?: string[];
  propertyAddress?: string;
  type: string;
}

interface BrandScore {
  percentage: number;
  grade: string;
}

interface MarketingPlannerWidgetProps {
  isSubscriber: boolean;
  isTrial: boolean;
  scores?: { propertyId: string; propertyAddress: string; percentage: number; grade: string }[];
}

const QUICK_ACTIONS = [
  { label: "Make a video remix", href: "/dashboard/lens/remix", color: "text-purple-400 border-purple-400/20 bg-purple-400/5 hover:bg-purple-400/10" },
  { label: "Write a listing description", href: "/dashboard/lens/descriptions", color: "text-sky-400 border-sky-400/20 bg-sky-400/5 hover:bg-sky-400/10" },
  { label: "Create a graphic", href: "/dashboard/lens/design-studio", color: "text-indigo-400 border-indigo-400/20 bg-indigo-400/5 hover:bg-indigo-400/10" },
  { label: "Stage a room", href: "/dashboard/lens/staging", color: "text-violet-400 border-violet-400/20 bg-violet-400/5 hover:bg-violet-400/10" },
  { label: "Build a listing site", href: "/dashboard/properties", color: "text-cyan-400 border-cyan-400/20 bg-cyan-400/5 hover:bg-cyan-400/10" },
  { label: "See full planner", href: "/dashboard/planner", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10" },
];

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const firstName = name?.split(" ")[0] || "there";
  return `Good ${time}, ${firstName}`;
}

function getStatusMessage(suggestions: WidgetSuggestion[], overdueCount: number, todayCount: number): string {
  if (overdueCount > 0) return `You have ${overdueCount} overdue post${overdueCount > 1 ? "s" : ""} that need attention.`;
  if (todayCount > 0) return `You have ${todayCount} post${todayCount > 1 ? "s" : ""} scheduled for today.`;
  if (suggestions.length > 0) return suggestions[0].description;
  return "Your marketing is looking good — what are we working on today?";
}

export default function MarketingPlannerWidget({ isSubscriber, isTrial }: MarketingPlannerWidgetProps) {
  const [agentName, setAgentName] = useState("");
  const [suggestions, setSuggestions] = useState<WidgetSuggestion[]>([]);
  const [brandScore, setBrandScore] = useState<BrandScore | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get agent name
      const { data: profile } = await supabase
        .from("lens_usage")
        .select("saved_agent_name")
        .eq("user_id", session.user.id)
        .single();
      if (profile?.saved_agent_name) setAgentName(profile.saved_agent_name);

      // Get today's schedule counts
      const today = new Date().toISOString().split("T")[0];
      const { data: schedule } = await supabase
        .from("marketing_schedule")
        .select("id, scheduled_date, status")
        .eq("user_id", session.user.id)
        .eq("status", "pending");

      if (schedule) {
        setTodayCount(schedule.filter((s: { scheduled_date: string }) => s.scheduled_date === today).length);
        setOverdueCount(schedule.filter((s: { scheduled_date: string }) => s.scheduled_date < today).length);
      }

      // Get suggestions + brand score
      const res = await fetch("/api/planner/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: profile?.saved_agent_name || "Agent" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions((data.suggestions || []).slice(0, 2));
        setBrandScore(data.brandScore || null);
      }
    } catch (err) {
      console.error("Widget load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isSubscriber && !isTrial) return null;

  const greeting = getGreeting(agentName);
  const statusMessage = getStatusMessage(suggestions, overdueCount, todayCount);
  const hasUrgent = overdueCount > 0;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm overflow-hidden">
      {/* ── Copilot header ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Lensy avatar */}
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
                  {/* Greeting */}
                  <p className="text-[11px] font-bold text-emerald-400/70 uppercase tracking-wider mb-0.5">Lensy · Your Marketing Copilot</p>
                  <p className="text-base font-bold text-white/90">{greeting} — what are we working on today?</p>
                  {/* Status message */}
                  <p className={`text-sm mt-1 leading-relaxed ${hasUrgent ? "text-red-400" : "text-white/50"}`}>
                    {hasUrgent && <AlertTriangle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                    {statusMessage}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Brand score pill */}
          {!loading && brandScore && (
            <Link href="/dashboard/planner" className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <span className={`text-lg font-black ${brandScore.percentage >= 70 ? "text-emerald-400" : brandScore.percentage >= 50 ? "text-amber-400" : "text-red-400"}`}>
                {brandScore.grade}
              </span>
              <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Brand</span>
            </Link>
          )}
        </div>

        {/* Top suggestions */}
        {!loading && suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {suggestions.map((s) => (
              <Link
                key={s.id}
                href="/dashboard/planner"
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-400/20 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white/80 group-hover:text-white/95 transition-colors truncate">{s.title}</p>
                  {s.propertyAddress && (
                    <p className="text-[11px] text-white/30 truncate">{s.propertyAddress.split(",")[0]}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-emerald-400/60 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick action buttons ── */}
      <div className="border-t border-white/[0.05] px-4 py-3">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2.5">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${action.color}`}
            >
              {action.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stats footer ── */}
      {!loading && (todayCount > 0 || overdueCount > 0) && (
        <div className="border-t border-white/[0.05] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {todayCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-400/60" />
                <span className="text-xs text-white/40">{todayCount} scheduled today</span>
              </div>
            )}
            {overdueCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400/70" />
                <span className="text-xs text-red-400/70">{overdueCount} overdue</span>
              </div>
            )}
          </div>
          <Link href="/dashboard/planner" className="flex items-center gap-1 text-xs font-semibold text-white/25 hover:text-emerald-400/70 transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
