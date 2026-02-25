"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronDown, ExternalLink, Loader2,
  Music, Brush, ImageIcon, ArrowLeft,
  FileText, CheckCircle2, Copy, Check, Clock, Flag,
  Mail, Phone, AlertTriangle, PackageCheck, DollarSign,
  Search, Link2, SortAsc, Filter, Eye, EyeOff, Lock,
  CalendarDays, Sun, Moon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"
import NextLink from "next/link"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SortMode   = "newest" | "urgent"
type FilterMode = "all" | "url" | "upload" | "overdue"

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
function useCountdown(createdAt: string) {
  const [timeLeft,  setTimeLeft]  = useState("")
  const [isUrgent,  setIsUrgent]  = useState(false)
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    const tick = () => {
      const start    = new Date(createdAt).getTime()
      const deadline = start + 24 * 60 * 60 * 1000
      const distance = deadline - Date.now()
      if (distance < 0) {
        setTimeLeft("Overdue"); setIsUrgent(true); setIsOverdue(true); return
      }
      const hours   = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      if (hours < 24) setIsUrgent(true)
      setTimeLeft(`${hours}h ${minutes}m`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [createdAt])

  return { timeLeft, isUrgent, isOverdue }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getBranding = (val: any) => {
  if (!val) return { agent: "—", co: "—", web: "—", logo: null, phone: "—", email: "—" }
  try {
    const d = typeof val === "string" ? JSON.parse(val) : val
    return {
      agent: d.agentName || "—",
      co:    d.companyName || d.company || "—",
      web:   d.website || "—",
      logo:  d.logoUrl || null,
      phone: d.phone || "—",
      email: d.email || "—",
    }
  } catch {
    return { agent: "—", co: "—", web: "—", logo: null, phone: "—", email: "—" }
  }
}

const VOICE_NAMES: Record<string, string> = {
  "male-1":   "Matt (Male)",
  "male-2":   "Blake (Male)",
  "female-1": "Maya (Female)",
  "female-2": "Amara (Female)",
}
function getVoiceDisplayName(voiceId?: string | null) {
  if (!voiceId) return "—"
  return VOICE_NAMES[voiceId] || voiceId
}

function getPackageLabel(order: any): string {
  if (order.listing_package_label) return order.listing_package_label
  const total            = Number(order.total_price) || 0
  const voiceoverAddon   = order.voiceover            ? 25 : 0
  const editedPhotosAddon = order.include_edited_photos ? 15 : 0
  const basePrice        = total - voiceoverAddon - editedPhotosAddon
  if (basePrice === 1)   return "Test Order"
  if (basePrice === 79)  return "Up to 15 Photos"
  if (basePrice === 129) return "Up to 25 Photos"
  if (basePrice === 179) return "Up to 35 Photos"
  const count = order.photos?.length ?? 0
  if (count <= 15) return "Up to 15 Photos"
  if (count <= 25) return "Up to 25 Photos"
  if (count <= 35) return "Up to 35 Photos"
  return "Custom"
}

function isOrderOverdue(createdAt: string) {
  return Date.now() > new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
}

// Change this PIN to whatever you like
const REVENUE_PIN = "2292"

function formatOrderDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  })
}

// ---------------------------------------------------------------------------
// Shared style helpers — keeps dark-mode logic in one place
// ---------------------------------------------------------------------------
const dk = {
  page:         (d: boolean) => d ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-800",
  nav:          (d: boolean) => d ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100",
  navText:      (d: boolean) => d ? "text-gray-200" : "text-gray-800",
  navMuted:     (d: boolean) => d ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800",
  divider:      (d: boolean) => d ? "bg-gray-700" : "bg-gray-200",
  pill:         (d: boolean) => d ? "bg-gray-800 border-gray-700 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600",
  card:         (d: boolean) => d ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100",
  cardHover:    (d: boolean) => d ? "hover:bg-gray-800" : "hover:bg-gray-50",
  panel:        (d: boolean) => d ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100",
  subCard:      (d: boolean) => d ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
  iconBox:      (d: boolean) => d ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100",
  label:        (d: boolean) => d ? "text-gray-400" : "text-gray-400",
  text:         (d: boolean) => d ? "text-gray-200" : "text-gray-700",
  muted:        (d: boolean) => d ? "text-gray-500" : "text-gray-400",
  input:        (d: boolean) => d ? "bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600 focus:border-emerald-500" : "bg-white border-gray-200 text-gray-800 focus:border-emerald-300",
  filterBtn:    (d: boolean, active: boolean) => active
    ? "bg-emerald-500 text-white shadow-sm"
    : d ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600",
  filterWrap:   (d: boolean) => d ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
  sectionBorder:(d: boolean) => d ? "border-gray-800" : "border-gray-200",
  rowDivide:    (d: boolean) => d ? "divide-gray-800" : "divide-gray-50",
  overdueBanner:(d: boolean) => d ? "bg-red-900/50 border-red-800 text-red-300" : "bg-red-50 border-red-100 text-red-600",
  deliveryBox:  (d: boolean, live: boolean) => live
    ? d ? "bg-gray-800 border-gray-700"  : "bg-white border-gray-100 shadow-sm"
    : d ? "bg-gray-900 border-gray-800"  : "bg-gray-100 border-gray-200",
  editedOn:     (d: boolean) => d ? "bg-emerald-900/40 border-emerald-800" : "bg-emerald-50 border-emerald-100",
  editedOff:    (d: boolean) => d ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100",
  contactBox:   (d: boolean) => d ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-100",
  linkBtn:      (d: boolean) => d ? "bg-emerald-900/40 border-emerald-700 text-emerald-400 hover:bg-emerald-900/70" : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100",
  assetLink:    (d: boolean) => d ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300" : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600",
  listingUrl:   (d: boolean) => d ? "bg-blue-900/30 border-blue-800" : "bg-blue-50 border-blue-100",
  amber:        (d: boolean) => d ? "bg-amber-900/30 border-amber-700" : "bg-amber-50 border-amber-200",
  pinOverlay:   (d: boolean) => d ? "bg-gray-900/95" : "bg-white/95",
  pinInput:     (d: boolean, shake: boolean) => shake
    ? "border-red-400 bg-red-50 dark:bg-red-900/30"
    : d ? "border-gray-600 bg-gray-800 text-gray-100 focus:border-emerald-400" : "border-gray-200 bg-gray-50 focus:border-emerald-400",
  emptyState:   (d: boolean) => d ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100",
}

// ---------------------------------------------------------------------------
// Revenue Tile — PIN protected
// ---------------------------------------------------------------------------
function RevenueTile({ totalRevenue, dark }: { totalRevenue: number; dark: boolean }) {
  const [visible,  setVisible]  = useState(false)
  const [showPin,  setShowPin]  = useState(false)
  const [pin,      setPin]      = useState("")
  const [shake,    setShake]    = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const openPinPrompt = () => { setPin(""); setShowPin(true); setTimeout(() => inputRef.current?.focus(), 50) }
  const handleHide    = () => { setVisible(false); setShowPin(false); setPin("") }
  const submitPin     = () => {
    if (pin === REVENUE_PIN) { setVisible(true); setShowPin(false); setPin("") }
    else { setShake(true); setPin(""); setTimeout(() => setShake(false), 600) }
  }

  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm flex items-center gap-4 relative overflow-hidden ${dk.card(dark)}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${dk.iconBox(dark)}`}>
        <DollarSign className="w-5 h-5 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold mb-0.5 ${dk.label(dark)}`}>Total Revenue</p>
        {visible
          ? <p className="text-2xl font-black text-emerald-500">${totalRevenue.toLocaleString()}</p>
          : <p className={`text-2xl font-black tracking-widest select-none ${dark ? "text-gray-700" : "text-gray-300"}`}>••••••</p>
        }
      </div>
      <button
        onClick={visible ? handleHide : openPinPrompt}
        className={`flex-shrink-0 h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${dk.iconBox(dark)} ${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
        title={visible ? "Hide revenue" : "Show revenue"}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      {/* PIN overlay */}
      {showPin && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl z-10 ${dk.pinOverlay(dark)}`}>
          <div className={`flex items-center gap-1.5 ${dk.muted(dark)}`}>
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Enter PIN</span>
          </div>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={e => e.key === "Enter" && submitPin()}
            className={`w-24 h-10 text-center text-lg font-black tracking-widest border-2 rounded-xl outline-none transition-all ${dk.pinInput(dark, shake)}`}
            placeholder="••••"
          />
          <div className="flex gap-2">
            <button onClick={submitPin}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors">
              Unlock
            </button>
            <button onClick={() => { setShowPin(false); setPin("") }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${dark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stats Bar
// ---------------------------------------------------------------------------
function StatsBar({ orders, dark }: { orders: any[]; dark: boolean }) {
  const active    = orders.filter(o => o.status !== "Delivered")
  const delivered = orders.filter(o => o.status === "Delivered")
  const overdue   = active.filter(o => isOrderOverdue(o.created_at))
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0)

  const stats = [
    { icon: <PackageCheck className="w-5 h-5 text-emerald-500" />,                           label: "Active Orders", value: active.length,    valueClass: "text-emerald-500" },
    { icon: <AlertTriangle className="w-5 h-5 text-red-400" />,                               label: "Overdue",       value: overdue.length,   valueClass: overdue.length > 0 ? "text-red-500" : dark ? "text-gray-600" : "text-gray-400" },
    { icon: <CheckCircle2  className={`w-5 h-5 ${dark ? "text-gray-500" : "text-gray-400"}`}/>, label: "Delivered",   value: delivered.length, valueClass: dark ? "text-gray-400" : "text-gray-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} className={`rounded-2xl border px-5 py-4 shadow-sm flex items-center gap-4 ${dk.card(dark)}`}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${dk.iconBox(dark)}`}>
            {s.icon}
          </div>
          <div>
            <p className={`text-sm font-semibold mb-0.5 ${dk.label(dark)}`}>{s.label}</p>
            <p className={`text-2xl font-black ${s.valueClass}`}>{s.value}</p>
          </div>
        </div>
      ))}
      <RevenueTile totalRevenue={totalRevenue} dark={dark} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function AdminDashboard() {
  const [mounted,    setMounted]    = useState(false)
  const [orders,     setOrders]     = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState("")
  const [sortMode,   setSortMode]   = useState<SortMode>("newest")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [dark,       setDark]       = useState(false)

  // Persist dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem("admin-dark")
    if (saved === "true") setDark(true)
  }, [])
  const toggleDark = () => {
    setDark(prev => {
      localStorage.setItem("admin-dark", String(!prev))
      return !prev
    })
  }

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      try {
        const res  = await fetch("/api/admin/orders")
        const json = await res.json()
        if (res.ok && json.orders) setOrders(json.orders)
        else {
          const { data } = await createClient().from("orders").select("*").order("created_at", { ascending: false })
          setOrders(data || [])
        }
      } catch {
        const { data } = await createClient().from("orders").select("*").order("created_at", { ascending: false })
        setOrders(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const updateOrderLocally = useCallback((id: string, patch: Partial<any>) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)))
  }, [])

  if (!mounted) return null

  const searched = orders.filter(o => {
    const q = search.toLowerCase()
    return (
      (o.customer_name  || "").toLowerCase().includes(q) ||
      (o.order_id       || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      getPackageLabel(o).toLowerCase().includes(q)
    )
  })

  const filtered = searched.filter(o => {
    if (filterMode === "url")     return !!o.listing_url
    if (filterMode === "upload")  return !o.listing_url
    if (filterMode === "overdue") return o.status !== "Delivered" && isOrderOverdue(o.created_at)
    return true
  })

  const sorted = [...filtered].sort((a, b) =>
    sortMode === "urgent"
      ? (new Date(a.created_at).getTime() + 72 * 60 * 60 * 1000) - (new Date(b.created_at).getTime() + 72 * 60 * 60 * 1000)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const active   = sorted.filter(o => o.status !== "Delivered")
  const archived = sorted.filter(o => o.status === "Delivered")

  const filterOptions: { value: FilterMode; label: string }[] = [
    { value: "all",     label: "All" },
    { value: "upload",  label: "Upload" },
    { value: "url",     label: "URL" },
    { value: "overdue", label: "Overdue" },
  ]

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${dk.page(dark)}`}>

      {/* ── Nav ── */}
      <nav className={`sticky top-0 z-50 border-b shadow-sm transition-colors duration-300 ${dk.nav(dark)}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NextLink href="/">
              <Button variant="ghost" size="sm" className={`font-semibold gap-2 ${dk.navMuted(dark)}`}>
                <ArrowLeft className="w-4 h-4" /> Exit
              </Button>
            </NextLink>
            <div className={`h-5 w-px ${dk.divider(dark)}`} />
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" className={`h-7 w-auto ${dark ? "brightness-90" : ""}`} />
              <span className={`font-bold ${dk.navText(dark)}`}>Command Center</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dk.pill(dark)}`}>v10</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dk.muted(dark)}`} />
              <Input
                placeholder="Search by name, email, ID…"
                className={`pl-9 rounded-xl text-sm transition-colors ${dk.input(dark)}`}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${dk.iconBox(dark)} ${dark ? "text-yellow-400 hover:text-yellow-300" : "text-gray-500 hover:text-gray-800"}`}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Stats */}
        {!loading && <StatsBar orders={orders} dark={dark} />}

        {/* Active Queue */}
        <section>
          <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Production</p>
              <h2 className={`text-2xl font-black ${dk.navText(dark)}`}>Active Queue</h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter pills */}
              <div className={`flex items-center gap-1 border rounded-xl p-1 shadow-sm ${dk.filterWrap(dark)}`}>
                <Filter className={`w-3.5 h-3.5 ml-1.5 ${dk.muted(dark)}`} />
                {filterOptions.map(f => (
                  <button key={f.value} onClick={() => setFilterMode(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dk.filterBtn(dark, filterMode === f.value)}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort pills */}
              <div className={`flex items-center gap-1 border rounded-xl p-1 shadow-sm ${dk.filterWrap(dark)}`}>
                <SortAsc className={`w-3.5 h-3.5 ml-1.5 ${dk.muted(dark)}`} />
                {(["newest", "urgent"] as SortMode[]).map(s => (
                  <button key={s} onClick={() => setSortMode(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${dk.filterBtn(dark, sortMode === s)}`}>
                    {s}
                  </button>
                ))}
              </div>

              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${dk.pill(dark)}`}>
                {active.length} live
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            ) : active.length === 0 ? (
              <div className={`rounded-2xl border py-20 text-center shadow-sm ${dk.emptyState(dark)}`}>
                <p className={`font-semibold ${dk.muted(dark)}`}>No active orders</p>
              </div>
            ) : (
              active.map(o => <OrderRow key={o.id} order={o} isLive={true} onUpdate={updateOrderLocally} dark={dark} />)
            )}
          </div>
        </section>

        {/* Completed */}
        {archived.length > 0 && (
          <section className={`pt-8 border-t ${dk.sectionBorder(dark)}`}>
            <p className={`text-xs font-semibold uppercase tracking-widest text-center mb-5 ${dk.muted(dark)}`}>
              Completed Records
            </p>
            <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {archived.map(o => <OrderRow key={o.id} order={o} isLive={false} onUpdate={updateOrderLocally} dark={dark} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OrderRow
// ---------------------------------------------------------------------------
function OrderRow({
  order, isLive, onUpdate, dark,
}: {
  order: any; isLive: boolean; onUpdate: (id: string, patch: any) => void; dark: boolean
}) {
  const [open,          setOpen]          = useState(false)
  const [url,           setUrl]           = useState(order.delivery_url || "")
  const [savedUrl,      setSavedUrl]      = useState(order.delivery_url || "")
  const [copied,        setCopied]        = useState(false)
  const [copiedIndex,   setCopiedIndex]   = useState<number | null>(null)
  const [confirmReopen, setConfirmReopen] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase      = createClient()
  const b             = getBranding(order.branding)
  const { timeLeft, isUrgent, isOverdue } = useCountdown(order.created_at)
  const packageLabel  = getPackageLabel(order)

  const sortedPhotos = React.useMemo(() => {
    if (!order.photos) return []
    return [...order.photos].sort((a: any, b: any) =>
      (a.original_filename || "").localeCompare(b.original_filename || "", undefined, { numeric: true, sensitivity: "base" })
    )
  }, [order.photos])

  // Auto-save delivery URL
  useEffect(() => {
    if (url === savedUrl) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      await supabase.from("orders").update({ delivery_url: url }).eq("id", order.id)
      setSavedUrl(url)
      onUpdate(order.id, { delivery_url: url })
      toast.success("Delivery link saved")
    }, 1200)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [url])

  const copyAllImages = () => {
    if (!sortedPhotos.length) return toast.error("No photos")
    navigator.clipboard.writeText(sortedPhotos.map((p: any) => p.secure_url).join("\n"))
    setCopied(true); toast.success("All URLs copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const copyOneImage = (e: React.MouseEvent, idx: number, imgUrl: string) => {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(imgUrl)
    setCopiedIndex(idx); toast.success(`Photo ${idx + 1} URL copied`)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLive) { setConfirmReopen(true); return }
    await supabase.from("orders").update({ status: "Delivered" }).eq("id", order.id)
    onUpdate(order.id, { status: "Delivered" })
    toast.success("Order marked as delivered")
  }

  const confirmReopenOrder = async () => {
    await supabase.from("orders").update({ status: "New" }).eq("id", order.id)
    onUpdate(order.id, { status: "New" })
    setConfirmReopen(false); toast.success("Order re-opened")
  }

  const cardBorder = isOverdue && isLive
    ? "border-l-4 border-l-red-500"
    : isLive
    ? "border-l-4 border-l-emerald-500"
    : `border-l-4 ${dark ? "border-l-gray-700" : "border-l-gray-200"}`

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border shadow-sm transition-all duration-200 overflow-hidden ${dk.card(dark)} ${cardBorder} ${!open ? dk.cardHover(dark) : ""}`}>

        {/* Overdue banner */}
        {isOverdue && isLive && (
          <div className={`border-b text-sm font-semibold text-center py-2 flex items-center justify-center gap-2 ${dk.overdueBanner(dark)}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Deadline has passed — this order is overdue
          </div>
        )}

        {/* Collapsed row */}
        <CollapsibleTrigger className="w-full px-6 py-4 flex items-center gap-5 text-left group cursor-pointer">
          {/* Thumbnail */}
          <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border ${dk.iconBox(dark)}`}>
            {sortedPhotos[0]
              ? <img src={sortedPhotos[0].secure_url} className="object-cover w-full h-full" alt="thumbnail" />
              : <div className="w-full h-full flex items-center justify-center"><Link2 className={`w-5 h-5 ${dk.muted(dark)}`} /></div>
            }
          </div>

          {/* Info grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 items-center gap-4">
            <div>
              <p className={`font-bold text-base leading-tight ${dk.text(dark)}`}>{order.customer_name || "Client"}</p>
              <p className={`text-xs mt-0.5 ${dk.muted(dark)}`}>#{order.order_id?.slice(0, 8)}</p>
            </div>
            <div>
              <p className={`text-xs font-medium mb-0.5 ${dk.label(dark)}`}>Fee paid</p>
              <p className={`text-2xl font-black ${isLive ? "text-emerald-500" : dark ? "text-gray-500" : "text-gray-400"}`}>
                ${order.total_price}
              </p>
            </div>
            <div className="hidden md:block">
              <p className={`text-xs font-medium mb-0.5 ${dk.label(dark)}`}>Package</p>
              <p className={`text-base font-semibold ${dk.text(dark)}`}>{packageLabel}</p>
            </div>
            <div className="hidden md:block">
              <p className={`text-xs font-medium mb-0.5 ${dk.label(dark)}`}>Due in</p>
              <div className={`flex items-center gap-1.5 text-base font-semibold ${
                isOverdue && isLive ? "text-red-500" : isUrgent && isLive ? "text-amber-500" : dk.muted(dark)}`}>
                <Clock className={`w-4 h-4 ${isUrgent && isLive ? "animate-pulse" : ""}`} />
                {isLive ? timeLeft : "Delivered"}
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 pr-1">
              <div className={`flex items-center gap-1.5 ${dk.muted(dark)}`}>
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{formatOrderDate(order.created_at)}</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : dk.muted(dark)}`} />
            </div>
            <div className={`flex md:hidden justify-end`}>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : dk.muted(dark)}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded panel */}
        <CollapsibleContent>
          <div className={`border-t p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 ${dk.panel(dark)} ${dark ? "border-gray-700" : "border-gray-100"}`}>

            {/* ── Col 1: Branding ── */}
            <div className="space-y-4">
              <h4 className={`text-base font-bold flex items-center gap-2 ${dk.text(dark)}`}>
                <Brush className={`w-4 h-4 ${dk.muted(dark)}`} /> Branding
              </h4>
              <div className={`rounded-2xl border shadow-sm ${dk.subCard(dark)} divide-y ${dk.rowDivide(dark)}`}>
                {[
                  { label: "Agent",   value: b.agent },
                  { label: "Company", value: b.co    },
                  { label: "Phone",   value: b.phone },
                  { label: "Email",   value: b.email },
                  { label: "Website", value: b.web   },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-4 py-3">
                    <span className={`text-sm font-semibold ${dk.label(dark)}`}>{row.label}</span>
                    <span className={`text-sm font-bold text-right max-w-[60%] truncate ${dk.text(dark)}`}>{row.value}</span>
                  </div>
                ))}
                {b.logo && (
                  <div className="px-4 py-3">
                    <Button asChild variant="outline" className="w-full h-9 text-xs font-semibold text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl">
                      <a href={b.logo} target="_blank" rel="noreferrer">Download Logo</a>
                    </Button>
                  </div>
                )}
              </div>
              <div className={`rounded-2xl border shadow-sm p-4 ${dk.subCard(dark)}`}>
                <p className={`text-sm font-semibold mb-2 ${dk.label(dark)}`}>Client Instructions</p>
                <p className={`text-sm leading-relaxed italic ${dark ? "text-gray-400" : "text-gray-600"}`}>
                  {order.special_instructions || "No special instructions."}
                </p>
              </div>
            </div>

            {/* ── Col 2: Assets ── */}
            <div className="space-y-4">
              <h4 className={`text-base font-bold flex items-center gap-2 ${dk.text(dark)}`}>
                <ImageIcon className={`w-4 h-4 ${dk.muted(dark)}`} /> Assets
                <span className={`ml-auto text-sm font-semibold ${dk.muted(dark)}`}>{sortedPhotos.length} photos</span>
              </h4>

              {/* Listing URL card */}
              {order.listing_url && sortedPhotos.length === 0 && (
                <div className={`rounded-2xl border p-4 space-y-2 ${dk.listingUrl(dark)}`}>
                  <p className={`text-xs font-bold ${dark ? "text-blue-400" : "text-blue-500"}`}>🔗 Listing URL Order</p>
                  <p className={`text-xs ${dk.muted(dark)}`}>No photos uploaded — download from the listing link.</p>
                  <a href={order.listing_url} target="_blank" rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 font-semibold text-xs underline underline-offset-2 break-all ${dark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />{order.listing_url}
                  </a>
                </div>
              )}

              {/* Photo strip */}
              <div className={`rounded-2xl border p-3 shadow-sm ${dk.subCard(dark)}`}>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {sortedPhotos.map((img: any, i: number) => (
                    <div key={i} className="relative group w-16 h-16 flex-shrink-0">
                      <a href={img.secure_url} target="_blank" rel="noreferrer"
                        title={img.description ? `#${i + 1}: ${img.description}` : `Photo ${i + 1}`}
                        className={`block w-full h-full rounded-xl overflow-hidden border transition-all ${dark ? "border-gray-700 hover:border-emerald-500" : "border-gray-100 hover:border-emerald-400"}`}>
                        <img src={img.secure_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" alt={`Photo ${i + 1}`} />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-center pb-1">
                          <span className="text-[9px] text-white font-bold">{i + 1}</span>
                        </div>
                      </a>
                      <button onClick={e => copyOneImage(e, i, img.secure_url)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
                        title="Copy URL">
                        {copiedIndex === i ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo descriptions */}
              <div className={`rounded-2xl border p-4 shadow-sm ${dk.subCard(dark)}`}>
                <p className={`text-sm font-semibold mb-2 ${dk.label(dark)}`}>Photo Descriptions</p>
                <ul className={`text-sm space-y-1.5 max-h-28 overflow-y-auto ${dark ? "text-gray-400" : "text-gray-600"}`}>
                  {sortedPhotos.map((img: any, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className={`font-bold w-5 flex-shrink-0 ${dk.muted(dark)}`}>{i + 1}.</span>
                      <span>{img.description || "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={copyAllImages}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-sm gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy All Image URLs
              </Button>

              {/* Audio tiles */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Voiceover", value: order.voiceover ? "Yes" : "No" },
                  { label: "Voice",     value: getVoiceDisplayName(order.voiceover_voice) },
                  { label: "Music",     value: order.music_selection || "—" },
                ].map(item => (
                  <div key={item.label} className={`rounded-xl border shadow-sm p-3 text-center ${dk.subCard(dark)}`}>
                    <p className={`text-xs font-semibold mb-1 ${dk.label(dark)}`}>{item.label}</p>
                    <p className={`text-sm font-bold truncate ${dk.text(dark)}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Script */}
              <div className={`rounded-xl border p-4 shadow-sm ${dk.subCard(dark)}`}>
                <p className={`text-sm font-semibold mb-2 ${dk.label(dark)}`}>Narrative Script</p>
                <p className={`text-sm max-h-28 overflow-y-auto leading-relaxed ${dk.muted(dark)}`}>
                  {order.voiceover_script || "No script provided."}
                </p>
              </div>

              {/* Download links */}
              <div className="flex gap-2">
                {(order.custom_audio?.secure_url || order.music_file) && (
                  <a href={order.custom_audio?.secure_url || order.music_file} target="_blank" rel="noreferrer"
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm font-semibold transition-colors ${dk.assetLink(dark)}`}>
                    <Music className="w-3.5 h-3.5 text-emerald-500" /> Music File
                  </a>
                )}
                {order.voiceover_script && (
                  <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(order.voiceover_script)}`}
                    download={`order-${order.order_id?.slice(0, 8)}-script.txt`}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm font-semibold transition-colors ${dk.assetLink(dark)}`}>
                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> Script
                  </a>
                )}
              </div>
            </div>

            {/* ── Col 3: Delivery ── */}
            <div className={`space-y-4 p-5 rounded-2xl border ${dk.deliveryBox(dark, isLive)}`}>
              <h4 className={`text-base font-bold flex items-center gap-2 ${dk.text(dark)}`}>
                <Flag className={`w-4 h-4 ${dk.muted(dark)}`} /> Delivery
              </h4>

              {/* Edited photos add-on */}
              {order.include_edited_photos ? (
                <div className={`flex items-center gap-3 border rounded-xl p-3 ${dk.editedOn(dark)}`}>
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Brush className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${dark ? "text-emerald-400" : "text-emerald-700"}`}>High-Res Editing</p>
                    <p className="text-xs text-emerald-500">Paid add-on included</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
                </div>
              ) : (
                <div className={`flex items-center gap-3 border rounded-xl p-3 opacity-50 ${dk.editedOff(dark)}`}>
                  <ImageIcon className={`w-4 h-4 ${dk.muted(dark)}`} />
                  <p className={`text-xs font-semibold ${dk.muted(dark)}`}>Standard quality only</p>
                </div>
              )}

              {/* Contact */}
              <div className={`rounded-xl border p-3 space-y-2 ${dk.contactBox(dark)}`}>
                <p className={`flex items-center gap-2 text-sm font-semibold ${dk.text(dark)}`}>
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />{order.customer_email}
                </p>
                <p className={`flex items-center gap-2 text-sm font-semibold ${dk.text(dark)}`}>
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />{order.customer_phone || "No phone on file"}
                </p>
              </div>

              {/* Delivery URL */}
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${dk.label(dark)}`}>Delivery Link</label>
                <div className="relative">
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Paste Google Drive link…"
                    className={`h-10 text-sm rounded-xl pr-9 transition-colors ${dk.input(dark)}`}
                  />
                  {url && url === savedUrl && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <p className={`text-sm ${dk.muted(dark)}`}>
                  {url === savedUrl && savedUrl ? "✓ Saved" : url !== savedUrl ? "Saving…" : "Auto-saves when you stop typing"}
                </p>
                {savedUrl && (
                  <a href={savedUrl} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-2 p-2.5 border rounded-xl text-sm font-semibold transition-colors ${dk.linkBtn(dark)}`}>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{savedUrl}</span>
                  </a>
                )}
              </div>

              {/* Mark delivered / re-open */}
              {confirmReopen ? (
                <div className={`border rounded-xl p-4 space-y-3 ${dk.amber(dark)}`}>
                  <p className={`text-sm font-bold ${dark ? "text-amber-400" : "text-amber-700"}`}>Re-open this order?</p>
                  <p className={`text-sm ${dark ? "text-amber-500" : "text-amber-600"}`}>This will move it back to the active production queue.</p>
                  <div className="flex gap-2">
                    <Button onClick={confirmReopenOrder}
                      className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg">
                      Yes, Re-open
                    </Button>
                    <Button onClick={() => setConfirmReopen(false)} variant="outline"
                      className={`flex-1 h-9 text-sm font-semibold rounded-lg ${dark ? "border-amber-700 text-amber-400 hover:bg-amber-900/30" : "border-amber-200 text-amber-600 hover:bg-amber-50"}`}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={toggle}
                    disabled={isLive && !savedUrl}
                    title={isLive && !savedUrl ? "Add a delivery link before marking as delivered" : undefined}
                    className={`w-full h-11 text-sm font-semibold rounded-xl transition-all ${
                      isLive
                        ? dark
                          ? "bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          : "bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    {isLive ? "Mark as Delivered" : "Re-open Production"}
                  </Button>
                  {isLive && !savedUrl && (
                    <p className={`text-xs font-semibold text-center flex items-center justify-center gap-1.5 ${dark ? "text-amber-400" : "text-amber-600"}`}>
                      <Flag className="w-3 h-3" /> Paste a delivery link above first
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
