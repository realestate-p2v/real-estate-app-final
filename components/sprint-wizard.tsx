// components/sprint-wizard.tsx
// 3-step wizard modal for creating a 30-day marketing sprint
// + Sprint calendar view showing the generated plan

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X, Loader2, Check, Sparkles, ChevronLeft, ChevronRight,
  Calendar, Flame, Star, Trophy,
} from "lucide-react";

interface Property {
  id: string;
  address: string;
  city?: string;
  status: string;
}

interface SprintProperty {
  id: string;
  address: string;
  selected: boolean;
  priority: "high" | "medium" | "low";
}

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

interface SprintPlan {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

const PRIORITY_COLORS = {
  high: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400", label: "High" },
  medium: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400", label: "Medium" },
  low: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400", label: "Low" },
};

const FREQUENCY_OPTIONS = [
  { key: "daily", label: "Aggressive", desc: "Post every day", posts: "~30 posts" },
  { key: "steady", label: "Steady", desc: "3 times per week", posts: "~15 posts" },
  { key: "light", label: "Light", desc: "2 times per week", posts: "~10 posts" },
];

// ─── Sprint Wizard Modal ────────────────────────────────────────────────────

export function SprintWizardModal({
  open,
  onClose,
  properties,
  onSprintCreated,
}: {
  open: boolean;
  onClose: () => void;
  properties: Property[];
  onSprintCreated: (planId: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [sprintProps, setSprintProps] = useState<SprintProperty[]>([]);
  const [frequency, setFrequency] = useState("steady");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Initialize sprint props from properties
  useEffect(() => {
    if (open) {
      setStep(1);
      setError("");
      setSprintProps(
        properties
          .filter(p => p.status === "active" || p.status === "new" || p.status === "coming_soon")
          .map(p => ({ id: p.id, address: p.address, selected: true, priority: "medium" }))
      );
    }
  }, [open, properties]);

  const toggleProperty = (id: string) => {
    setSprintProps(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const setPriority = (id: string, priority: "high" | "medium" | "low") => {
    setSprintProps(prev => prev.map(p => p.id === id ? { ...p, priority } : p));
  };

  const selectedCount = sprintProps.filter(p => p.selected).length;

  const handleGenerate = async () => {
    const selected = sprintProps.filter(p => p.selected);
    if (selected.length === 0) { setError("Select at least one property"); return; }
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/planner/sprint/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: selected.map(p => ({ id: p.id, priority: p.priority })),
          frequency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSprintCreated(data.planId);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to generate sprint");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setIsGenerating(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900 z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-[16px] font-extrabold text-white">Create Marketing Sprint</h2>
              <p className="text-[11px] text-gray-500">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Step 1: Select properties */}
          {step === 1 && (
            <>
              <h3 className="text-[14px] font-bold text-white mb-1">Which properties to include?</h3>
              <p className="text-[12px] text-gray-400 mb-4">Active listings are pre-selected. Uncheck any you want to skip.</p>
              <div className="space-y-2 mb-5">
                {sprintProps.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleProperty(p.id)}
                    className={`w-full px-4 py-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      p.selected ? "border-emerald-500/40 bg-emerald-950/30" : "border-gray-600 bg-gray-800 opacity-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      p.selected ? "border-emerald-400 bg-emerald-400" : "border-gray-500"
                    }`}>
                      {p.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[13px] font-semibold text-gray-200 truncate">{p.address}</span>
                  </button>
                ))}
              </div>
              {sprintProps.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No active properties found. Add a property first.</p>
              )}
            </>
          )}

          {/* Step 2: Set priority */}
          {step === 2 && (
            <>
              <h3 className="text-[14px] font-bold text-white mb-1">Set priority for each listing</h3>
              <p className="text-[12px] text-gray-400 mb-4">High priority listings get more posts and better time slots.</p>
              <div className="space-y-3 mb-5">
                {sprintProps.filter(p => p.selected).map(p => (
                  <div key={p.id} className="px-4 py-3 rounded-xl border border-gray-600 bg-gray-800">
                    <p className="text-[13px] font-semibold text-gray-200 mb-2 truncate">{p.address}</p>
                    <div className="flex gap-2">
                      {(["high", "medium", "low"] as const).map(pri => {
                        const c = PRIORITY_COLORS[pri];
                        const isActive = p.priority === pri;
                        return (
                          <button
                            key={pri}
                            onClick={() => setPriority(p.id, pri)}
                            className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all ${
                              isActive ? `${c.bg} ${c.border} ${c.text}` : "border-gray-600 text-gray-500 hover:border-gray-500"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 3: Frequency */}
          {step === 3 && (
            <>
              <h3 className="text-[14px] font-bold text-white mb-1">How often should Lensy post?</h3>
              <p className="text-[12px] text-gray-400 mb-4">You can always skip or reschedule individual posts.</p>
              <div className="space-y-2 mb-5">
                {FREQUENCY_OPTIONS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFrequency(f.key)}
                    className={`w-full px-4 py-4 rounded-xl border text-left transition-all ${
                      frequency === f.key ? "border-blue-500 bg-blue-950/30" : "border-gray-600 bg-gray-800 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[14px] font-bold text-white">{f.label}</p>
                        <p className="text-[12px] text-gray-400">{f.desc}</p>
                      </div>
                      <span className="text-[12px] font-semibold text-gray-500">{f.posts}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 mb-4">
                <p className="text-[12px] font-semibold text-gray-400 mb-1">Sprint Summary</p>
                <p className="text-[13px] text-gray-200">
                  {selectedCount} {selectedCount === 1 ? "property" : "properties"} · {
                    FREQUENCY_OPTIONS.find(f => f.key === frequency)?.label
                  } posting · 30 days
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Lensy will create ready-to-post content with captions and media for each scheduled day.
                </p>
              </div>

              {error && (
                <p className="text-[12px] text-red-400 font-medium mb-3">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-between items-center sticky bottom-0 bg-gray-900 rounded-b-2xl">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="text-[13px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && selectedCount === 0}
              className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white transition-colors flex items-center gap-2"
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Sprint...</> : <><Sparkles className="w-4 h-4" /> Launch Sprint</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sprint Calendar ────────────────────────────────────────────────────────

export function SprintCalendar({
  onPostClick,
}: {
  onPostClick: (scheduleId: string) => void;
}) {
  const [plan, setPlan] = useState<SprintPlan | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [properties, setProperties] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadActiveSprint();
  }, []);

  const loadActiveSprint = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [planRes, scheduleRes, propsRes] = await Promise.all([
        supabase.from("marketing_plans")
          .select("id, name, description, status, created_at")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase.from("marketing_schedule")
          .select("id, property_id, scheduled_date, platform, content_type, caption, asset_url, status")
          .eq("user_id", session.user.id)
          .order("scheduled_date", { ascending: true }),
        supabase.from("agent_properties")
          .select("id, address")
          .eq("user_id", session.user.id)
          .is("merged_into_id", null),
      ]);

      if (planRes.data?.[0]) setPlan(planRes.data[0]);
      setSchedule(scheduleRes.data || []);
      const propMap = new Map<string, string>();
      (propsRes.data || []).forEach((p: any) => propMap.set(p.id, p.address.split(",")[0]));
      setProperties(propMap);
    } catch (err) {
      console.error("Failed to load sprint:", err);
    }
    setLoading(false);
  };

  const handleMarkPosted = async (id: string) => {
    const supabase = createClient();
    await supabase.from("marketing_schedule").update({ status: "posted" }).eq("id", id);
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, status: "posted" } : s));
  };

  const handleSkip = async (id: string) => {
    const supabase = createClient();
    await supabase.from("marketing_schedule").update({ status: "skipped" }).eq("id", id);
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, status: "skipped" } : s));
  };

  const [confirmReset, setConfirmReset] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSprint = async () => {
    if (!plan) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/planner/sprint/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      if (res.ok) {
        setPlan(null);
        setSchedule([]);
        setConfirmReset(false);
      }
    } catch {}
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading calendar...
      </div>
    );
  }

  if (!plan || schedule.length === 0) return null;

  // Calculate weekly stats
  const today = new Date().toISOString().split("T")[0];
  const getWeekStart = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + offset * 7); // Sunday start
    return d;
  };

  const weekStart = getWeekStart(weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const weekSchedule = schedule.filter(s => weekDays.includes(s.scheduled_date));
  const weekPosted = weekSchedule.filter(s => s.status === "posted").length;
  const weekTotal = weekSchedule.length;
  const weekPct = weekTotal > 0 ? Math.round((weekPosted / weekTotal) * 100) : 0;

  // Week score label
  const getWeekLabel = () => {
    if (weekTotal === 0) return "";
    if (weekPct === 100) return "🔥 Perfect Week!";
    if (weekPct >= 75) return "⭐ Strong Week";
    if (weekPct >= 50) return "Good Start";
    if (weekPct > 0) return "Let's bounce back!";
    return "";
  };

  // Overall sprint stats
  const totalPosts = schedule.length;
  const totalPosted = schedule.filter(s => s.status === "posted").length;
  const totalSkipped = schedule.filter(s => s.status === "skipped").length;
  const overdue = schedule.filter(s => s.scheduled_date < today && s.status === "pending").length;

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const PLATFORM_ICONS: Record<string, string> = {
    instagram: "📷", facebook: "📘", linkedin: "💼",
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
      {/* Sprint header */}
      <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-[15px] font-extrabold text-white">{plan.name}</h3>
            <p className="text-[11px] text-gray-500">{plan.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[13px] font-bold text-emerald-400">{totalPosted}/{totalPosts} posted</p>
            {overdue > 0 && <p className="text-[11px] text-amber-400">{overdue} ready to go</p>}
          </div>
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button onClick={handleDeleteSprint} disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white transition-colors">
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-600 bg-gray-800 text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-600 bg-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-colors">
              Reset Sprint
            </button>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
        <button onClick={() => setWeekOffset(weekOffset - 1)}
          className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-[13px] font-bold text-white">
            {MONTH_NAMES[weekStart.getMonth()]} {weekStart.getDate()} – {MONTH_NAMES[new Date(weekStart.getTime() + 6 * 86400000).getMonth()]} {new Date(weekStart.getTime() + 6 * 86400000).getDate()}
          </p>
          {getWeekLabel() && (
            <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">{getWeekLabel()} · {weekPosted}/{weekTotal}</p>
          )}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)}
          className="text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 divide-x divide-gray-700">
        {weekDays.map((day, i) => {
          const dayPosts = weekSchedule.filter(s => s.scheduled_date === day);
          const isToday = day === today;
          const isPast = day < today;

          return (
            <div key={day} className={`min-h-[120px] p-2 ${isToday ? "bg-blue-950/20" : ""}`}>
              {/* Day header */}
              <div className="text-center mb-2">
                <p className="text-[10px] text-gray-500 font-semibold">{DAY_NAMES[i]}</p>
                <p className={`text-[13px] font-bold ${isToday ? "text-blue-400" : isPast ? "text-gray-500" : "text-gray-300"}`}>
                  {parseInt(day.split("-")[2])}
                </p>
              </div>

              {/* Posts for this day */}
              {dayPosts.map(post => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post.id)}
                  className={`w-full mb-1.5 px-2 py-1.5 rounded-lg text-left text-[10px] border transition-all ${
                    post.status === "posted"
                      ? "bg-green-900/30 border-green-700/40 text-green-300"
                      : post.status === "skipped"
                      ? "bg-gray-800 border-gray-600 text-gray-500 line-through"
                      : isPast
                      ? "bg-amber-900/20 border-amber-600/30 text-amber-300"
                      : "bg-gray-800 border-gray-600 text-gray-300 hover:border-blue-500"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{PLATFORM_ICONS[post.platform] || "📌"}</span>
                    <span className="truncate font-semibold">{properties.get(post.property_id) || "Post"}</span>
                  </div>
                  {post.status === "posted" && <span className="text-green-400">✓ Posted</span>}
                  {post.status === "pending" && isPast && <span className="text-amber-400">Ready</span>}
                </button>
              ))}

              {dayPosts.length === 0 && !isPast && (
                <div className="text-center text-[10px] text-gray-600 mt-4">—</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Week score bar */}
      {weekTotal > 0 && (
        <div className="px-5 py-3 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${weekPct === 100 ? "bg-emerald-400" : weekPct >= 50 ? "bg-blue-400" : "bg-amber-400"}`}
                style={{ width: `${weekPct}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-gray-400">{weekPct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
