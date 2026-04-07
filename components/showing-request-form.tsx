"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Clock,
  User,
  Mail,
  Phone,
  Check,
  Trash2,
  CalendarDays,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingSlot {
  id: string;
  property_id: string;
  slot_date: string;
  slot_time: string;
  duration_min: number;
  status: string;
  booked_by_name?: string | null;
  booked_by_email?: string | null;
  booked_by_phone?: string | null;
  notes?: string | null;
}

interface BookingCalendarProps {
  mode: "manage" | "book";
  propertyId: string;
  propertyAddress?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { label: `${h}:00 ${ampm}`, value: `${i.toString().padStart(2, "0")}:00` };
}).filter((_, i) => i >= 7 && i <= 20); // 7 AM to 8 PM

const HALF_HOURS = HOURS.flatMap((h) => [
  h,
  {
    label: h.label.replace(":00", ":30"),
    value: h.value.replace(":00", ":30"),
  },
]);

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getWeekDates(baseDate: Date): string[] {
  const dates: string[] = [];
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export default function BookingCalendar({
  mode,
  propertyId,
  propertyAddress,
}: BookingCalendarProps) {
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null);

  // Add slot form
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotTime, setNewSlotTime] = useState("10:00");
  const [newSlotDuration, setNewSlotDuration] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState("1"); // Monday
  const [recurringWeeks, setRecurringWeeks] = useState(4);

  // Booking form (public mode)
  const [bookingSlot, setBookingSlot] = useState<BookingSlot | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const today = new Date().toISOString().split("T")[0];

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?propertyId=${propertyId}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, BookingSlot[]> = {};
    for (const slot of slots) {
      if (!map[slot.slot_date]) map[slot.slot_date] = [];
      map[slot.slot_date].push(slot);
    }
    // Sort each day's slots by time
    for (const date in map) {
      map[date].sort((a, b) => a.slot_time.localeCompare(b.slot_time));
    }
    return map;
  }, [slots]);

  async function handleAddSlot() {
    setAddingSlot(true);
    try {
      const body: any = { propertyId };

      if (isRecurring) {
        body.recurring = {
          dayOfWeek: parseInt(recurringDay),
          time: newSlotTime,
          durationMin: newSlotDuration,
          weeks: recurringWeeks,
        };
      } else {
        if (!newSlotDate) {
          setAddingSlot(false);
          return;
        }
        body.slots = [
          { date: newSlotDate, time: newSlotTime, durationMin: newSlotDuration },
        ];
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Failed: " + (data.error || "Unknown error"));
      } else {
        setShowAddSlot(false);
        setNewSlotDate("");
        setIsRecurring(false);
        await fetchSlots();
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
    setAddingSlot(false);
  }

  async function handleDeleteSlot(slotId: string) {
    setDeletingSlot(slotId);
    try {
      const res = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeletingSlot(null);
  }

  async function handleCancelBooking(slotId: string) {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, action: "cancel" }),
      });
      if (res.ok) {
        await fetchSlots();
      }
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  }

  async function handleBook() {
    if (!bookingSlot || !bookingForm.name.trim()) return;
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: bookingSlot.id,
          action: "book",
          visitorName: bookingForm.name.trim(),
          visitorEmail: bookingForm.email.trim() || undefined,
          visitorPhone: bookingForm.phone.trim() || undefined,
          notes: bookingForm.notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        setBookingSuccess(true);
        await fetchSlots();
      } else {
        const data = await res.json();
        alert("Booking failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Booking failed: " + err.message);
    }
    setBooking(false);
  }

  const inp =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  // ─── MANAGE MODE (Agent) ───
  if (mode === "manage") {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold text-foreground min-w-[180px] text-center">
              {formatDate(weekDates[0])} — {formatDate(weekDates[6])}
            </h3>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs font-semibold text-accent hover:text-accent/80"
              >
                Today
              </button>
            )}
          </div>
          <Button
            onClick={() => setShowAddSlot(true)}
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Slot
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const daySlots = slotsByDate[date] || [];
              const isToday = date === today;
              const isPast = date < today;
              return (
                <div key={date} className={`min-h-[120px] rounded-xl border p-2 ${isToday ? "border-accent/50 bg-accent/5" : "border-border"} ${isPast ? "opacity-50" : ""}`}>
                  <p className={`text-[10px] font-bold mb-1.5 ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                    {DAYS[new Date(date + "T12:00:00").getDay()]} {new Date(date + "T12:00:00").getDate()}
                  </p>
                  <div className="space-y-1">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`rounded-lg px-2 py-1.5 text-[10px] font-semibold group relative ${
                          slot.status === "booked"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        <p>{formatTime(slot.slot_time)}</p>
                        <p className="text-[9px] font-normal opacity-70">
                          {slot.duration_min}min
                        </p>
                        {slot.status === "booked" && slot.booked_by_name && (
                          <p className="text-[9px] font-semibold truncate mt-0.5">
                            {slot.booked_by_name}
                          </p>
                        )}
                        {/* Actions on hover */}
                        <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5">
                          {slot.status === "booked" && (
                            <button
                              onClick={() => handleCancelBooking(slot.id)}
                              className="p-0.5 rounded bg-white/80 hover:bg-white text-orange-600"
                              title="Cancel booking"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            disabled={deletingSlot === slot.id}
                            className="p-0.5 rounded bg-white/80 hover:bg-white text-red-500"
                            title="Delete slot"
                          >
                            {deletingSlot === slot.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add slot modal */}
        {showAddSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">Add Availability</h3>
                <button onClick={() => setShowAddSlot(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Toggle: single vs recurring */}
              <div className="flex items-center gap-3 mb-5 p-1 bg-muted/50 rounded-xl">
                <button
                  onClick={() => setIsRecurring(false)}
                  className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
                    !isRecurring ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5 inline mr-1.5" />
                  Single
                </button>
                <button
                  onClick={() => setIsRecurring(true)}
                  className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
                    isRecurring ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Repeat className="h-3.5 w-3.5 inline mr-1.5" />
                  Recurring
                </button>
              </div>

              {!isRecurring ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date</label>
                    <input
                      type="date"
                      value={newSlotDate}
                      onChange={(e) => setNewSlotDate(e.target.value)}
                      min={today}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Time</label>
                    <select
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className={inp}
                    >
                      {HALF_HOURS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Day of Week</label>
                    <select
                      value={recurringDay}
                      onChange={(e) => setRecurringDay(e.target.value)}
                      className={inp}
                    >
                      {FULL_DAYS.map((d, i) => (
                        <option key={i} value={i.toString()}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Time</label>
                    <select
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className={inp}
                    >
                      {HALF_HOURS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Repeat for</label>
                    <select
                      value={recurringWeeks}
                      onChange={(e) => setRecurringWeeks(parseInt(e.target.value))}
                      className={inp}
                    >
                      {[2, 4, 6, 8, 12].map((w) => (
                        <option key={w} value={w}>{w} weeks</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Duration</label>
                <div className="flex gap-2">
                  {[30, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setNewSlotDuration(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        newSlotDuration === d
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/40"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowAddSlot(false)}
                  variant="outline"
                  className="flex-1 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSlot}
                  disabled={addingSlot || (!isRecurring && !newSlotDate)}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                >
                  {addingSlot ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : isRecurring ? (
                    `Add ${recurringWeeks} Slots`
                  ) : (
                    "Add Slot"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── BOOK MODE (Public Visitor) ───
  const availableSlots = slots.filter((s) => s.status === "available");

  // Group available slots by date
  const availableByDate = useMemo(() => {
    const map: Record<string, BookingSlot[]> = {};
    for (const slot of availableSlots) {
      if (!map[slot.slot_date]) map[slot.slot_date] = [];
      map[slot.slot_date].push(slot);
    }
    const sortedDates = Object.keys(map).sort();
    return sortedDates.map((date) => ({
      date,
      slots: map[date].sort((a, b) => a.slot_time.localeCompare(b.slot_time)),
    }));
  }, [availableSlots]);

  if (bookingSuccess) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Showing Booked!</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          You&apos;re confirmed for{" "}
          <span className="font-semibold text-foreground">
            {bookingSlot && formatFullDate(bookingSlot.slot_date)} at{" "}
            {bookingSlot && formatTime(bookingSlot.slot_time)}
          </span>
          . The agent will be in touch.
        </p>
      </div>
    );
  }

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : availableByDate.length === 0 ? (
        <div className="text-center py-10">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No available time slots right now. Check back later.
          </p>
        </div>
      ) : bookingSlot ? (
        /* Booking form */
        <div>
          <button
            onClick={() => setBookingSlot(null)}
            className="text-sm font-semibold text-accent hover:text-accent/80 mb-4 flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to times
          </button>
          <div className="bg-muted/30 rounded-xl border border-border p-4 mb-5">
            <p className="text-sm font-bold text-foreground">
              {formatFullDate(bookingSlot.slot_date)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTime(bookingSlot.slot_time)} · {bookingSlot.duration_min} minutes
            </p>
            {propertyAddress && (
              <p className="text-xs text-muted-foreground mt-1">{propertyAddress}</p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                <User className="h-3 w-3 inline mr-1" />
                Your Name *
              </label>
              <input
                type="text"
                value={bookingForm.name}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, name: e.target.value })
                }
                placeholder="Jane Smith"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                <Mail className="h-3 w-3 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={bookingForm.email}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, email: e.target.value })
                }
                placeholder="jane@example.com"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                <Phone className="h-3 w-3 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                value={bookingForm.phone}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, phone: e.target.value })
                }
                placeholder="(512) 555-1234"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={bookingForm.notes}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, notes: e.target.value })
                }
                placeholder="Anything the agent should know?"
                rows={2}
                className={inp}
              />
            </div>
          </div>
          <Button
            onClick={handleBook}
            disabled={!bookingForm.name.trim() || booking}
            className="w-full mt-5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-full"
          >
            {booking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </div>
      ) : (
        /* Time slot selector */
        <div className="space-y-4">
          {availableByDate.map(({ date, slots: daySlots }) => (
            <div key={date}>
              <p className="text-sm font-bold text-foreground mb-2">
                {formatFullDate(date)}
              </p>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setBookingSlot(slot)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatTime(slot.slot_time)}
                    <span className="text-[10px] text-muted-foreground">
                      {slot.duration_min}m
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
