"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Plus, X, Loader2, Check, Clock, User, Trash2, Repeat,
} from "lucide-react";

interface BookingSlot {
  id: string;
  property_id: string;
  slot_date: string;
  slot_time: string;
  duration_min: number;
  status: string;
  booked_by_name?: string;
  booked_by_email?: string;
  booked_by_phone?: string;
  notes?: string;
}

interface BookingCalendarProps {
  propertyId: string;
  mode: "manage" | "book";
  agentName?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: `${i.toString().padStart(2, "0")}:00`, label: `${h}:00 ${ampm}` };
}).filter((_, i) => i >= 8 && i <= 20); // 8 AM to 8 PM

const HALF_HOURS = HOURS.flatMap(h => {
  const base = parseInt(h.value.split(":")[0]);
  const bH = base % 12 || 12;
  const ampm = base < 12 ? "AM" : "PM";
  return [
    { value: `${base.toString().padStart(2, "0")}:00`, label: `${bH}:00 ${ampm}` },
    { value: `${base.toString().padStart(2, "0")}:30`, label: `${bH}:30 ${ampm}` },
  ];
});

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hr = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function BookingCalendar({ propertyId, mode, agentName }: BookingCalendarProps) {
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBooking, setShowBooking] = useState<BookingSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Add slot form
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("10:00");
  const [addDuration, setAddDuration] = useState(30);
  const [addRecurring, setAddRecurring] = useState(false);
  const [addRecurringDay, setAddRecurringDay] = useState(1); // Monday
  const [addRecurringWeeks, setAddRecurringWeeks] = useState(4);

  // Book form
  const [bookName, setBookName] = useState("");
  const [bookEmail, setBookEmail] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookNotes, setBookNotes] = useState("");

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  useEffect(() => {
    fetchSlots();
  }, [propertyId]);

  async function fetchSlots() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?propertyId=${propertyId}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (e) {
      console.error("Failed to fetch slots:", e);
    }
    setLoading(false);
  }

  async function handleAddSlots() {
    setSaving(true);
    const newSlots: { date: string; time: string; duration: number }[] = [];

    if (addRecurring) {
      for (let w = 0; w < addRecurringWeeks; w++) {
        const d = new Date();
        d.setDate(d.getDate() + ((addRecurringDay - d.getDay() + 7) % 7) + w * 7);
        if (d >= new Date()) {
          newSlots.push({ date: dateStr(d), time: addTime, duration: addDuration });
        }
      }
    } else if (addDate) {
      newSlots.push({ date: addDate, time: addTime, duration: addDuration });
    }

    if (newSlots.length === 0) { setSaving(false); return; }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, slots: newSlots }),
      });
      if (res.ok) {
        await fetchSlots();
        setShowAddSlot(false);
        setAddDate("");
        setAddRecurring(false);
      } else {
        const data = await res.json();
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
    setSaving(false);
  }

  async function handleBook() {
    if (!showBooking || !bookName || !bookEmail) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: showBooking.id,
          action: "book",
          visitorName: bookName,
          visitorEmail: bookEmail,
          visitorPhone: bookPhone || undefined,
          notes: bookNotes || undefined,
        }),
      });
      if (res.ok) {
        setBookingSuccess(true);
        await fetchSlots();
      } else {
        const data = await res.json();
        alert("Booking failed: " + (data.error || "This slot may no longer be available"));
      }
    } catch (e: any) {
      alert("Booking failed: " + e.message);
    }
    setSaving(false);
  }

  async function handleCancel(slotId: string) {
    try {
      await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, action: "cancel" }),
      });
      await fetchSlots();
    } catch (e) {
      console.error("Cancel failed:", e);
    }
  }

  async function handleDelete(slotId: string) {
    try {
      await fetch(`/api/bookings?slotId=${slotId}`, { method: "DELETE" });
      await fetchSlots();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }

  // Group slots by date for the current week
  const slotsByDate = useMemo(() => {
    const map: Record<string, BookingSlot[]> = {};
    slots.forEach(s => {
      if (!map[s.slot_date]) map[s.slot_date] = [];
      map[s.slot_date].push(s);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.slot_time.localeCompare(b.slot_time)));
    return map;
  }, [slots]);

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── MANAGE MODE (Agent) ───
  if (mode === "manage") {
    return (
      <div>
        {/* Week navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs font-semibold text-accent hover:text-accent/80 ml-2">Today</button>
            )}
          </div>
          <Button onClick={() => { setShowAddSlot(true); setAddDate(dateStr(new Date())); }} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add Slots
          </Button>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((d, i) => {
            const ds = dateStr(d);
            const daySlots = slotsByDate[ds] || [];
            const isToday = ds === dateStr(new Date());
            const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <div key={ds} className={`rounded-xl border p-2 min-h-[120px] ${isToday ? "border-accent/50 bg-accent/5" : "border-border"} ${isPast ? "opacity-50" : ""}`}>
                <p className={`text-[10px] font-bold text-center mb-1.5 ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                  {DAYS[i]} {d.getDate()}
                </p>
                <div className="space-y-1">
                  {daySlots.map(slot => (
                    <div key={slot.id} className={`rounded-lg px-1.5 py-1 text-[10px] ${
                      slot.status === "booked"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-50 text-blue-700"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{formatTime(slot.slot_time)}</span>
                        <div className="flex items-center gap-0.5">
                          {slot.status === "booked" && (
                            <button onClick={() => handleCancel(slot.id)} className="p-0.5 hover:bg-green-200 rounded" title="Cancel booking">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(slot.id)} className="p-0.5 hover:bg-red-100 rounded text-red-500" title="Remove slot">
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                      {slot.status === "booked" && slot.booked_by_name && (
                        <p className="truncate font-medium">{slot.booked_by_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add slot modal */}
        {showAddSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Add Availability</h3>
                <button onClick={() => setShowAddSlot(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Recurring toggle */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border cursor-pointer hover:border-accent/40 transition-all">
                  <input type="checkbox" checked={addRecurring} onChange={e => setAddRecurring(e.target.checked)} className="accent-[hsl(var(--accent))]" />
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Recurring weekly</span>
                </label>

                {addRecurring ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Day of week</label>
                      <select value={addRecurringDay} onChange={e => setAddRecurringDay(parseInt(e.target.value))} className={inp}>
                        {FULL_DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">For how many weeks</label>
                      <select value={addRecurringWeeks} onChange={e => setAddRecurringWeeks(parseInt(e.target.value))} className={inp}>
                        {[2, 4, 6, 8, 12].map(w => <option key={w} value={w}>{w} weeks</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Date</label>
                    <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} min={dateStr(new Date())} className={inp} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Time</label>
                    <select value={addTime} onChange={e => setAddTime(e.target.value)} className={inp}>
                      {HALF_HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Duration</label>
                    <select value={addDuration} onChange={e => setAddDuration(parseInt(e.target.value))} className={inp}>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowAddSlot(false)} variant="outline" className="flex-1 font-bold">Cancel</Button>
                <Button onClick={handleAddSlots} disabled={saving || (!addRecurring && !addDate)} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : addRecurring ? `Add ${addRecurringWeeks} Slots` : "Add Slot"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── BOOK MODE (Public Visitor) ───
  const availableSlots = slots.filter(s => s.status === "available");
  const groupedByDate: Record<string, BookingSlot[]> = {};
  availableSlots.forEach(s => {
    if (!groupedByDate[s.slot_date]) groupedByDate[s.slot_date] = [];
    groupedByDate[s.slot_date].push(s);
  });
  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div>
      {availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No available times right now. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const d = new Date(date + "T12:00:00");
            return (
              <div key={date}>
                <p className="text-xs font-bold text-muted-foreground mb-2">
                  {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupedByDate[date].map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => { setShowBooking(slot); setBookingSuccess(false); setBookName(""); setBookEmail(""); setBookPhone(""); setBookNotes(""); }}
                      className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all"
                    >
                      {formatTime(slot.slot_time)}
                      <span className="text-[10px] text-muted-foreground ml-1.5">{slot.duration_min}min</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking form modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl">
            {bookingSuccess ? (
              <div className="text-center py-4">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Booking Confirmed!</h3>
                <p className="text-sm text-muted-foreground">
                  Your showing is scheduled for {new Date(showBooking.slot_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(showBooking.slot_time)}.
                </p>
                {agentName && <p className="text-sm text-muted-foreground mt-1">{agentName} will be in touch.</p>}
                <Button onClick={() => { setShowBooking(null); setBookingSuccess(false); }} className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">Done</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Book a Showing</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(showBooking.slot_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(showBooking.slot_time)} ({showBooking.duration_min} min)
                    </p>
                  </div>
                  <button onClick={() => setShowBooking(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Your Name *</label>
                    <input type="text" value={bookName} onChange={e => setBookName(e.target.value)} placeholder="Jane Smith" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Email *</label>
                    <input type="email" value={bookEmail} onChange={e => setBookEmail(e.target.value)} placeholder="jane@example.com" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone</label>
                    <input type="tel" value={bookPhone} onChange={e => setBookPhone(e.target.value)} placeholder="(555) 123-4567" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
                    <textarea value={bookNotes} onChange={e => setBookNotes(e.target.value)} placeholder="Any questions or preferences..." rows={2} className={inp} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button onClick={() => setShowBooking(null)} variant="outline" className="flex-1 font-bold">Cancel</Button>
                  <Button onClick={handleBook} disabled={!bookName.trim() || !bookEmail.trim() || saving} className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
