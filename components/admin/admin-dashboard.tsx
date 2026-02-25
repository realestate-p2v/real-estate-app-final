"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronDown, ExternalLink, Loader2,
  Music, Brush, ImageIcon, ArrowLeft,
  FileText, CheckCircle2, Copy, Check, Clock, Flag,
  Mail, Phone, AlertTriangle, PackageCheck, DollarSign,
  Search, Link2, SortAsc, Filter, Eye, EyeOff, Lock, CalendarDays,
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
type SortMode = "newest" | "urgent"
type FilterMode = "all" | "url" | "upload" | "overdue"

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
function useCountdown(createdAt: string) {
  const [timeLeft, setTimeLeft] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    const tick = () => {
      const start = new Date(createdAt).getTime()
      const deadline = start + 72 * 60 * 60 * 1000
      const now = Date.now()
      const distance = deadline - now
      if (distance < 0) {
        setTimeLeft("Overdue")
        setIsUrgent(true)
        setIsOverdue(true)
        return
      }
      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      if (hours < 24) setIsUrgent(true)
      setTimeLeft(`${hours}h ${minutes}m`)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [createdAt])

  return { timeLeft, isUrgent, isOverdue }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getBranding = (val: any) => {
  if (!val) return { tier: "Standard", agent: "—", co: "—", web: "—", logo: null, phone: "—", email: "—" }
  try {
    const d = typeof val === "string" ? JSON.parse(val) : val
    return {
      tier: d.type === "custom" ? "Custom" : "Standard",
      agent: d.agentName || "—",
      co: d.companyName || d.company || "—",
      web: d.website || "—",
      logo: d.logoUrl || null,
      phone: d.phone || "—",
      email: d.email || "—",
    }
  } catch {
    return { tier: "Standard", agent: "—", co: "—", web: "—", logo: null, phone: "—", email: "—" }
  }
}

const VOICE_NAMES: Record<string, string> = {
  "male-1": "Matt (Male)",
  "male-2": "Blake (Male)",
  "female-1": "Maya (Female)",
  "female-2": "Amara (Female)",
}

function getVoiceDisplayName(voiceId?: string | null) {
  if (!voiceId) return "—"
  return VOICE_NAMES[voiceId] || voiceId
}

function getPackageLabel(order: any): string {
  if (order.listing_package_label) return order.listing_package_label
  const total = Number(order.total_price) || 0
  const voiceoverAddon = order.voiceover ? 25 : 0
  const editedPhotosAddon = order.include_edited_photos ? 15 : 0
  const basePrice = total - voiceoverAddon - editedPhotosAddon
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
  return Date.now() > new Date(createdAt).getTime() + 72 * 60 * 60 * 1000
}

// Change this to whatever PIN you want
const REVENUE_PIN = "1234"

function formatOrderDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// ---------------------------------------------------------------------------
// Revenue Tile — PIN protected
// ---------------------------------------------------------------------------
function RevenueTile({ totalRevenue }: { totalRevenue: number }) {
  const [visible, setVisible] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState("")
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const openPinPrompt = () => {
    setPin("")
    setShowPin(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleHide = () => {
    setVisible(false)
    setShowPin(false)
    setPin("")
  }

  const submitPin = () => {
    if (pin === REVENUE_PIN) {
      setVisible(true)
      setShowPin(false)
      setPin("")
    } else {
      setShake(true)
      setPin("")
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
        <DollarSign className="w-5 h-5 text-emerald-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-400 mb-0.5">Total Revenue</p>
        {visible ? (
          <p className="text-2xl font-black text-emerald-600">${totalRevenue.toLocaleString()}</p>
        ) : (
          <p className="text-2xl font-black text-gray-300 tracking-widest select-none">••••••</p>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={visible ? handleHide : openPinPrompt}
        className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        title={visible ? "Hide revenue" : "Show revenue"}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      {/* PIN overlay */}
      {showPin && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-2xl z-10">
          <div className="flex items-center gap-1.5 text-gray-500">
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
            onKeyDown={e => { if (e.key === "Enter") submitPin() }}
            className={`w-24 h-10 text-center text-lg font-black tracking-widest border-2 rounded-xl outline-none transition-all
              ${shake ? "border-red-400 bg-red-50 animate-[shake_0.5s_ease-in-out]" : "border-gray-200 focus:border-emerald-400 bg-gray-50"}`}
            placeholder="••••"
          />
          <div className="flex gap-2">
            <button onClick={submitPin}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors">
              Unlock
            </button>
            <button onClick={() => { setShowPin(false); setPin("") }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-semibold rounded-lg transition-colors">
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
function StatsBar({ orders }: { orders: any[] }) {
  const active = orders.filter(o => o.status !== "Delivered")
  const delivered = orders.filter(o => o.status === "Delivered")
  const overdue = active.filter(o => isOrderOverdue(o.created_at))
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0)

  const stats = [
    {
      icon: <PackageCheck className="w-5 h-5 text-emerald-500" />,
      label: "Active Orders",
      value: active.length,
      valueClass: "text-emerald-600",
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      label: "Overdue",
      value: overdue.length,
      valueClass: overdue.length > 0 ? "text-red-500" : "text-gray-400",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-gray-400" />,
      label: "Delivered",
      value: delivered.length,
      valueClass: "text-gray-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
            {s.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-0.5">{s.label}</p>
            <p className={`text-2xl font-black ${s.valueClass}`}>{s.value}</p>
          </div>
        </div>
      ))}
      <RevenueTile totalRevenue={totalRevenue} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortMode, setSortMode] = useState<SortMode>("newest")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      try {
        const res = await fetch("/api/admin/orders")
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
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.order_id || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      getPackageLabel(o).toLowerCase().includes(q)
    )
  })

  const filtered = searched.filter(o => {
    if (filterMode === "url") return !!o.listing_url
    if (filterMode === "upload") return !o.listing_url
    if (filterMode === "overdue") return o.status !== "Delivered" && isOrderOverdue(o.created_at)
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "urgent") {
      return (new Date(a.created_at).getTime() + 72 * 60 * 60 * 1000) -
             (new Date(b.created_at).getTime() + 72 * 60 * 60 * 1000)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const active = sorted.filter(o => o.status !== "Delivered")
  const archived = sorted.filter(o => o.status === "Delivered")

  const filterOptions: { value: FilterMode; label: string }[] = [
    { value: "all", label: "All" },
    { value: "upload", label: "Upload" },
    { value: "url", label: "URL" },
    { value: "overdue", label: "Overdue" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Nav — mirrors landing page: white, border-b, shadow-sm */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NextLink href="/">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800 font-semibold gap-2">
                <ArrowLeft className="w-4 h-4" /> Exit
              </Button>
            </NextLink>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
              <span className="font-bold text-gray-800">Command Center</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                v10
              </span>
            </div>
          </div>

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, ID…"
              className="pl-9 bg-gray-50 border-gray-200 rounded-xl text-sm focus:bg-white transition-colors"
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Stats */}
        {!loading && <StatsBar orders={orders} />}

        {/* Active Queue */}
        <section>
          <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Production</p>
              <h2 className="text-2xl font-black text-gray-800">Active Queue</h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <Filter className="w-3.5 h-3.5 text-gray-300 ml-1.5" />
                {filterOptions.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterMode(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === f.value
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <SortAsc className="w-3.5 h-3.5 text-gray-300 ml-1.5" />
                {(["newest", "urgent"] as SortMode[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortMode(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      sortMode === s
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
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
              <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center shadow-sm">
                <p className="text-gray-400 font-semibold">No active orders</p>
              </div>
            ) : (
              active.map(o => (
                <OrderRow key={o.id} order={o} isLive={true} onUpdate={updateOrderLocally} />
              ))
            )}
          </div>
        </section>

        {/* Completed */}
        {archived.length > 0 && (
          <section className="pt-8 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-5">
              Completed Records
            </p>
            <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {archived.map(o => (
                <OrderRow key={o.id} order={o} isLive={false} onUpdate={updateOrderLocally} />
              ))}
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
  order,
  isLive,
  onUpdate,
}: {
  order: any
  isLive: boolean
  onUpdate: (id: string, patch: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(order.delivery_url || "")
  const [savedUrl, setSavedUrl] = useState(order.delivery_url || "")
  const [copied, setCopied] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [confirmReopen, setConfirmReopen] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()
  const b = getBranding(order.branding)
  const { timeLeft, isUrgent, isOverdue } = useCountdown(order.created_at)
  const packageLabel = getPackageLabel(order)

  const sortedPhotos = React.useMemo(() => {
    if (!order.photos) return []
    return [...order.photos].sort((a: any, b: any) =>
      (a.original_filename || "").localeCompare(b.original_filename || "", undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )
  }, [order.photos])

  // Auto-save delivery URL with debounce
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
    if (sortedPhotos.length === 0) return toast.error("No photos")
    navigator.clipboard.writeText(sortedPhotos.map((p: any) => p.secure_url).join("\n"))
    setCopied(true)
    toast.success("All URLs copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const copyOneImage = (e: React.MouseEvent, idx: number, imgUrl: string) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(imgUrl)
    setCopiedIndex(idx)
    toast.success(`Photo ${idx + 1} URL copied`)
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
    setConfirmReopen(false)
    toast.success("Order re-opened")
  }

  // Left border accent colour — keeps the red/green signal
  const cardBorder = isOverdue && isLive
    ? "border-l-4 border-l-red-400"
    : isLive
    ? "border-l-4 border-l-emerald-400"
    : "border-l-4 border-l-gray-200"

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden ${cardBorder}`}>

        {/* Overdue banner — red, clear, not garish */}
        {isOverdue && isLive && (
          <div className="bg-red-50 border-b border-red-100 text-red-600 text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Deadline has passed — this order is overdue
          </div>
        )}

        {/* Collapsed row */}
        <CollapsibleTrigger className="w-full px-6 py-4 flex items-center gap-5 text-left group cursor-pointer">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50">
            {sortedPhotos[0] ? (
              <img src={sortedPhotos[0].secure_url} className="object-cover w-full h-full" alt="thumbnail" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Link2 className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>

          {/* Info columns */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 items-center gap-4">
            <div>
              <p className="font-bold text-base text-gray-800 leading-tight">{order.customer_name || "Client"}</p>
              <p className="text-xs text-gray-400 mt-0.5">#{order.order_id?.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Fee paid</p>
              <p className={`text-2xl font-black ${isLive ? "text-emerald-600" : "text-gray-500"}`}>
                ${order.total_price}
              </p>
            </div>
            <div className="hidden md:block">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Package</p>
              <p className="text-base font-semibold text-gray-700">{packageLabel}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Due in</p>
              <div className={`flex items-center gap-1.5 text-base font-semibold ${
                isOverdue && isLive ? "text-red-500" :
                isUrgent && isLive  ? "text-amber-500" :
                "text-gray-500"
              }`}>
                <Clock className={`w-4 h-4 ${isUrgent && isLive ? "animate-pulse" : ""}`} />
                {isLive ? timeLeft : "Delivered"}
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 pr-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{formatOrderDate(order.created_at)}</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : ""}`} />
            </div>
            {/* Mobile chevron */}
            <div className="flex md:hidden justify-end">
              <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : ""}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded panel */}
        <CollapsibleContent>
          <div className="border-t border-gray-100 bg-gray-50 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Col 1: Branding ── */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-gray-700 flex items-center gap-2">
                <Brush className="w-4 h-4 text-gray-400" /> Branding
              </h4>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {[
                  { label: "Agent", value: b.agent },
                  { label: "Company", value: b.co },
                  { label: "Phone", value: b.phone },
                  { label: "Email", value: b.email },
                  { label: "Website", value: b.web },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm font-semibold text-gray-400">{row.label}</span>
                    <span className="text-sm font-bold text-gray-700 text-right max-w-[60%] truncate">{row.value}</span>
                  </div>
                ))}
                {b.logo && (
                  <div className="px-4 py-3">
                    <Button asChild variant="outline" className="w-full h-9 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl">
                      <a href={b.logo} target="_blank" rel="noreferrer">Download Logo</a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-400 mb-2">Client Instructions</p>
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  {order.special_instructions || "No special instructions."}
                </p>
              </div>
            </div>

            {/* ── Col 2: Assets ── */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-gray-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gray-400" /> Assets
                <span className="ml-auto text-sm font-semibold text-gray-400">{sortedPhotos.length} photos</span>
              </h4>

              {/* Listing URL card */}
              {order.listing_url && sortedPhotos.length === 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-blue-500">🔗 Listing URL Order</p>
                  <p className="text-xs text-gray-500">No photos uploaded — download from the listing link.</p>
                  <a href={order.listing_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-xs underline underline-offset-2 hover:text-blue-800 break-all">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    {order.listing_url}
                  </a>
                </div>
              )}

              {/* Photo strip with per-photo copy */}
              <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {sortedPhotos.map((img: any, i: number) => (
                    <div key={i} className="relative group w-16 h-16 flex-shrink-0">
                      <a href={img.secure_url} target="_blank" rel="noreferrer"
                        title={img.description ? `#${i + 1}: ${img.description}` : `Photo ${i + 1}`}
                        className="block w-full h-full rounded-xl overflow-hidden border border-gray-100 hover:border-emerald-400 transition-all">
                        <img src={img.secure_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" alt={`Photo ${i + 1}`} />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-center pb-1">
                          <span className="text-[9px] text-white font-bold">{i + 1}</span>
                        </div>
                      </a>
                      <button
                        onClick={e => copyOneImage(e, i, img.secure_url)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
                        title="Copy URL"
                      >
                        {copiedIndex === i ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-400 mb-2">Photo Descriptions</p>
                <ul className="text-sm text-gray-600 space-y-1.5 max-h-28 overflow-y-auto">
                  {sortedPhotos.map((img: any, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}.</span>
                      <span>{img.description || "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={copyAllImages}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-sm gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy All Image URLs
              </Button>

              {/* Audio / voice / music tiles */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Voiceover", value: order.voiceover ? "Yes" : "No" },
                  { label: "Voice", value: getVoiceDisplayName(order.voiceover_voice) },
                  { label: "Music", value: order.music_selection || "—" },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
                    <p className="text-xs font-semibold text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-gray-600 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-400 mb-2">Narrative Script</p>
                <p className="text-sm text-gray-500 max-h-28 overflow-y-auto leading-relaxed">
                  {order.voiceover_script || "No script provided."}
                </p>
              </div>

              <div className="flex gap-2">
                {(order.custom_audio?.secure_url || order.music_file) && (
                  <a href={order.custom_audio?.secure_url || order.music_file} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-colors">
                    <Music className="w-3.5 h-3.5 text-emerald-500" /> Music File
                  </a>
                )}
                {order.voiceover_script && (
                  <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(order.voiceover_script)}`}
                    download={`order-${order.order_id?.slice(0, 8)}-script.txt`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> Script
                  </a>
                )}
              </div>
            </div>

            {/* ── Col 3: Delivery ── */}
            <div className={`space-y-4 p-5 rounded-2xl border ${
              isLive ? "bg-white border-gray-100 shadow-sm" : "bg-gray-100 border-gray-200"
            }`}>
              <h4 className="text-base font-bold text-gray-700 flex items-center gap-2">
                <Flag className="w-4 h-4 text-gray-400" /> Delivery
              </h4>

              {/* Edited photos add-on indicator */}
              {order.include_edited_photos ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Brush className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">High-Res Editing</p>
                    <p className="text-xs text-emerald-500">Paid add-on included</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 opacity-60">
                  <ImageIcon className="w-4 h-4 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-400">Standard quality only</p>
                </div>
              )}

              {/* Contact details */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  {order.customer_email}
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {order.customer_phone || "No phone on file"}
                </p>
              </div>

              {/* Delivery URL — auto-saves */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">Delivery Link</label>
                <div className="relative">
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Paste Google Drive link…"
                    className="h-10 bg-white border-gray-200 text-sm rounded-xl pr-9 focus:border-emerald-300"
                  />
                  {url && url === savedUrl && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {url === savedUrl && savedUrl
                    ? "✓ Saved"
                    : url !== savedUrl
                    ? "Saving…"
                    : "Auto-saves when you stop typing"}
                </p>
                {savedUrl && (
                  <a href={savedUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{savedUrl}</span>
                  </a>
                )}
              </div>

              {/* Mark delivered / re-open */}
              {confirmReopen ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-amber-700">Re-open this order?</p>
                  <p className="text-sm text-amber-600">This will move it back to the active production queue.</p>
                  <div className="flex gap-2">
                    <Button onClick={confirmReopenOrder}
                      className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg">
                      Yes, Re-open
                    </Button>
                    <Button onClick={() => setConfirmReopen(false)} variant="outline"
                      className="flex-1 h-9 text-sm font-semibold rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={toggle}
                  className={`w-full h-11 text-sm font-semibold rounded-xl transition-all ${
                    isLive
                      ? "bg-gray-800 hover:bg-gray-900 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {isLive ? "Mark as Delivered" : "Re-open Production"}
                </Button>
              )}
            </div>

          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
