// components/calendar-view.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, X, Copy, Loader2 } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScheduleItem {
  id: string;
  property_id?: string;
  plan_id?: string;
  scheduled_date: string;
  platform: string;
  content_type: string;
  caption?: string;
  asset_url?: string;
  status: string;
  auto_generated: boolean;
}

interface CalendarViewProps {
  propertyId?: string;
  onAddPost: (date: string) => void;
  onItemAction: (id: string, action: "posted" | "skipped") => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "border-l-pink-400",
  facebook: "border-l-blue-400",
  linkedin: "border-l-sky-400",
  blog: "border-l-emerald-400",
};

const PLATFORM_SHORT: Record<string, string> = {
  instagram: "IG",
  facebook: "FB",
  linkedin: "LI",
  blog: "Blog",
};

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day); // Start on Sunday
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getMonthDates(baseDate: Date): Date[][] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const weeks: Date[][] = [];
  let current = new Date(firstDay);
  current.setDate(current.getDate() - startDay);

  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current.getMonth() > month && current.getDay() === 0) break;
  }
  return weeks;
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isToday(d: Date): boolean {
  return formatDateKey(d) === formatDateKey(new Date());
}

// ─── Day Cell ───────────────────────────────────────────────────────────────

function DayCell({
  date,
  items,
  isCurrentMonth,
  onAdd,
  onItemClick,
}: {
  date: Date;
  items: ScheduleItem[];
  isCurrentMonth: boolean;
  onAdd: () => void;
  onItemClick: (item: ScheduleItem) => void;
}) {
  const today = isToday(date);

  return (
    <div className={`min-h-[100px] border border-white/[0.04] p-1.5 ${isCurrentMonth ? "bg-white/[0.02]" : "bg-transparent"} ${today ? "ring-1 ring-emerald-400/30" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[11px] font-medium ${today ? "text-emerald-400 font-bold" : isCurrentMonth ? "text-white/50" : "text-white/15"}`}>
          {date.getDate()}
        </span>
        {isCurrentMonth && items.length === 0 && (
          <button onClick={onAdd} className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 p-0.5 rounded text-white/20 hover:text-emerald-400 transition-all">
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="space-y-1">
        {items.slice(0, 3).map((item) => {
          const borderColor = PLATFORM_COLORS[item.platform] || "border-l-white/20";
          const done = item.status === "posted";
          const skipped = item.status === "skipped";

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className={`w-full text-left px-1.5 py-1 rounded-md border-l-2 ${borderColor} ${done ? "bg-emerald-400/5 opacity-50" : skipped ? "bg-white/[0.01] opacity-30 line-through" : "bg-white/[0.04] hover:bg-white/[0.08]"} transition-colors`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-white/40">{PLATFORM_SHORT[item.platform] || item.platform}</span>
                {done && <Check className="h-2.5 w-2.5 text-emerald-400" />}
              </div>
              <p className="text-[10px] text-white/50 truncate">{item.content_type.replace(/_/g, " ")}</p>
            </button>
          );
        })}
        {items.length > 3 && (
          <p className="text-[9px] text-white/20 text-center">+{items.length - 3} more</p>
        )}
      </div>
    </div>
  );
}

// ─── Item Detail Popup ──────────────────────────────────────────────────────

function ItemDetail({
  item,
  onClose,
  onAction,
  onCopy,
}: {
  item: ScheduleItem;
  onClose: () => void;
  onAction: (id: string, action: "posted" | "skipped") => void;
  onCopy: (caption: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (item.caption) {
      onCopy(item.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-white/[0.08] rounded-2xl p-5 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-white/90">{item.content_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
            <p className="text-xs text-white/40">{PLATFORM_SHORT[item.platform] || item.platform} — {item.scheduled_date}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.05]">
            <X className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {item.caption && (
          <div className="mb-4">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Caption</p>
            <p className="text-xs text-white/60 leading-relaxed bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
              {item.caption}
            </p>
          </div>
        )}

        {item.asset_url && (
          <div className="mb-4">
            <img src={item.asset_url} alt="" className="w-full h-32 object-cover rounded-xl border border-white/[0.06]" />
          </div>
        )}

        <div className="flex items-center gap-2">
          {item.status === "pending" && (
            <>
              <button
                onClick={() => onAction(item.id, "posted")}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors"
              >
                Mark Done
              </button>
              {item.caption && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-white/60 border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
              <button
                onClick={() => onAction(item.id, "skipped")}
                className="px-3 py-2 rounded-xl text-xs font-medium text-white/30 hover:text-white/50 transition-colors"
              >
                Skip
              </button>
            </>
          )}
          {item.status !== "pending" && (
            <p className={`text-xs font-medium ${item.status === "posted" ? "text-emerald-400" : "text-white/30"}`}>
              {item.status === "posted" ? "Posted" : "Skipped"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar ──────────────────────────────────────────────────────────

export default function CalendarView({ propertyId, onAddPost, onItemAction }: CalendarViewProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [baseDate, setBaseDate] = useState(new Date());
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const dates = view === "week" ? getWeekDates(baseDate) : getMonthDates(baseDate).flat();
      const start = formatDateKey(dates[0]);
      const end = formatDateKey(dates[dates.length - 1]);

      let url = `/api/planner/schedule?start=${start}&end=${end}`;
      if (propertyId) url += `&propertyId=${propertyId}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [view, baseDate, propertyId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const navigate = (dir: -1 | 1) => {
    const d = new Date(baseDate);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setBaseDate(d);
  };

  const goToday = () => setBaseDate(new Date());

  const handleItemAction = async (id: string, action: "posted" | "skipped") => {
    onItemAction(id, action);
    setSelectedItem(null);
    await fetch("/api/planner/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: action }),
    });
    fetchSchedule();
  };

  const handleCopy = async (caption: string) => {
    await navigator.clipboard.writeText(caption);
  };

  const itemsByDate = items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    if (!acc[item.scheduled_date]) acc[item.scheduled_date] = [];
    acc[item.scheduled_date].push(item);
    return acc;
  }, {});

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentMonth = baseDate.getMonth();

  const headerLabel = view === "week"
    ? (() => {
        const week = getWeekDates(baseDate);
        const s = week[0];
        const e = week[6];
        if (s.getMonth() === e.getMonth()) {
          return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
        }
        return `${s.toLocaleDateString("en-US", { month: "short" })} ${s.getDate()} – ${e.toLocaleDateString("en-US", { month: "short" })} ${e.getDate()}, ${e.getFullYear()}`;
      })()
    : baseDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
            <ChevronLeft className="h-4 w-4 text-white/40" />
          </button>
          <button onClick={goToday} className="px-2 py-1 rounded-lg text-xs font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
            Today
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
            <ChevronRight className="h-4 w-4 text-white/40" />
          </button>
          <span className="text-sm font-bold text-white/80 ml-2">{headerLabel}</span>
          {loading && <Loader2 className="h-3.5 w-3.5 text-white/20 animate-spin" />}
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${view === "week" ? "bg-white/[0.08] text-white/80" : "text-white/30 hover:text-white/50"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${view === "month" ? "bg-white/[0.08] text-white/80" : "text-white/30 hover:text-white/50"}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {dayNames.map((name) => (
          <div key={name} className="px-2 py-1.5 text-center text-[10px] font-bold text-white/25 uppercase tracking-wider">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {view === "week" ? (
        <div className="grid grid-cols-7 group">
          {getWeekDates(baseDate).map((date) => (
            <DayCell
              key={formatDateKey(date)}
              date={date}
              items={itemsByDate[formatDateKey(date)] || []}
              isCurrentMonth={true}
              onAdd={() => onAddPost(formatDateKey(date))}
              onItemClick={setSelectedItem}
            />
          ))}
        </div>
      ) : (
        getMonthDates(baseDate).map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 group">
            {week.map((date) => (
              <DayCell
                key={formatDateKey(date)}
                date={date}
                items={itemsByDate[formatDateKey(date)] || []}
                isCurrentMonth={date.getMonth() === currentMonth}
                onAdd={() => onAddPost(formatDateKey(date))}
                onItemClick={setSelectedItem}
              />
            ))}
          </div>
        ))
      )}

      {/* Item detail popup */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAction={handleItemAction}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}
