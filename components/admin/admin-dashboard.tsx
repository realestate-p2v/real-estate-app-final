"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronDown, ExternalLink, Loader2,
  Music, Brush, ImageIcon, ArrowLeft,
  FileText, CheckCircle2, Copy, Check, Clock, Flag,
  Mail, Phone, TrendingUp, AlertTriangle, PackageCheck, DollarSign,
  Search, Link2, SortAsc, Filter, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
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
        setTimeLeft("OVERDUE")
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
  // URL-mode orders store the label explicitly — always trust this first
  if (order.listing_package_label) return order.listing_package_label

  // For upload orders, derive the tier from the base price paid.
  // We strip out known add-ons so photo count doesn't mislead us
  // (e.g. someone uploads 12 photos but paid for the 25-photo tier).
  const total = Number(order.total_price) || 0
  const voiceoverAddon = order.voiceover ? 25 : 0
  const editedPhotosAddon = order.include_edited_photos ? 15 : 0
  const basePrice = total - voiceoverAddon - editedPhotosAddon

  if (basePrice === 1)   return "Test Order"
  if (basePrice === 79)  return "Up to 15 Photos"
  if (basePrice === 129) return "Up to 25 Photos"
  if (basePrice === 179) return "Up to 35 Photos"

  // Fallback: derive from photo count if price doesn't match a known tier
  const count = order.photos?.length ?? 0
  if (count <= 15) return "Up to 15 Photos"
  if (count <= 25) return "Up to 25 Photos"
  if (count <= 35) return "Up to 35 Photos"
  return "Custom"
}

function isOrderOverdue(createdAt: string) {
  return Date.now() > new Date(createdAt).getTime() + 72 * 60 * 60 * 1000
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
    { icon: <PackageCheck className="w-4 h-4" />, label: "Active", value: active.length, color: "text-emerald-600" },
    { icon: <AlertTriangle className="w-4 h-4" />, label: "Overdue", value: overdue.length, color: overdue.length > 0 ? "text-red-500" : "text-slate-400" },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Delivered", value: delivered.length, color: "text-slate-500" },
    { icon: <DollarSign className="w-4 h-4" />, label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, color: "text-emerald-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className={`${s.color} opacity-70`}>{s.icon}</div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        </div>
      ))}
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

  // Search across name, order ID, email, package
  const searched = orders.filter(o => {
    const q = search.toLowerCase()
    return (
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.order_id || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      getPackageLabel(o).toLowerCase().includes(q)
    )
  })

  // Filter
  const filtered = searched.filter(o => {
    if (filterMode === "url") return !!o.listing_url
    if (filterMode === "upload") return !o.listing_url
    if (filterMode === "overdue") return o.status !== "Delivered" && isOrderOverdue(o.created_at)
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "urgent") {
      const deadlineA = new Date(a.created_at).getTime() + 72 * 60 * 60 * 1000
      const deadlineB = new Date(b.created_at).getTime() + 72 * 60 * 60 * 1000
      return deadlineA - deadlineB
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
    <div className="min-h-screen bg-[#eceef0] text-slate-700 pb-20 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#f4f5f6]/80 backdrop-blur-md border-b border-slate-300 h-20 flex items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <NextLink href="/">
            <Button variant="ghost" size="sm" className="font-bold text-slate-500 hover:bg-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" /> EXIT
            </Button>
          </NextLink>
          <div className="flex items-center gap-3 border-l pl-6 border-slate-300">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto opacity-80" />
            <h1 className="font-black text-slate-800 tracking-tighter text-xl uppercase">
              Command Center <span className="text-emerald-500 font-black">1.4</span>
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search name, email, ID, package…"
            className="pl-10 bg-white/50 border-slate-300 rounded-xl focus:bg-white transition-all shadow-inner"
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        {/* Stats */}
        {!loading && <StatsBar orders={orders} />}

        {/* Active Queue */}
        <section>
          <div className="flex flex-wrap justify-between items-end mb-6 px-2 gap-4">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/70">Production</h2>
              <p className="text-3xl font-black text-slate-800 tracking-tight">Active Queue</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <Filter className="w-3 h-3 text-slate-400 ml-2" />
                {filterOptions.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterMode(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterMode === f.value
                        ? "bg-emerald-500 text-white shadow"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <SortAsc className="w-3 h-3 text-slate-400 ml-2" />
                {(["newest", "urgent"] as SortMode[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortMode(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      sortMode === s
                        ? "bg-emerald-500 text-white shadow"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <Badge className="bg-emerald-500 text-white px-5 py-1.5 font-black rounded-full uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
                {active.length} Orders Live
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
              </div>
            ) : active.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest text-sm">
                No active orders
              </div>
            ) : (
              active.map(o => (
                <OrderRow key={o.id} order={o} isLive={true} onUpdate={updateOrderLocally} />
              ))
            )}
          </div>
        </section>

        {/* Archived */}
        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-300">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-400 tracking-[0.3em] px-2 text-center">
              Completed Records
            </h2>
            <div className="space-y-4 opacity-60 grayscale hover:grayscale-0 transition-all">
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
      toast.success("Delivery link auto-saved")
    }, 1200)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
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
    // Require confirmation before re-opening a delivered order
    if (!isLive) {
      setConfirmReopen(true)
      return
    }
    const newStatus = "Delivered"
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    onUpdate(order.id, { status: newStatus })
    toast.success("Order marked as delivered")
  }

  const confirmReopenOrder = async () => {
    await supabase.from("orders").update({ status: "New" }).eq("id", order.id)
    onUpdate(order.id, { status: "New" })
    setConfirmReopen(false)
    toast.success("Order re-opened")
  }

  // Overdue pulse ring
  const overdueRing = isOverdue && isLive
    ? "ring-2 ring-red-500/70 border-l-[6px] border-l-red-500 animate-[pulse_2s_ease-in-out_infinite]"
    : isLive
    ? "ring-2 ring-emerald-400/50 border-l-[6px] border-l-emerald-500"
    : "ring-1 ring-slate-200 border-l-[6px] border-l-slate-300"

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border-none transition-all duration-300 overflow-hidden relative ${open ? "bg-white shadow-2xl" : "bg-[#fdfdfe] hover:bg-white shadow-sm"} ${overdueRing}`}>
        {!open && (
          <div className="absolute bottom-1.5 right-3 pointer-events-none">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-300">click to open</span>
          </div>
        )}

        {/* Overdue banner */}
        {isOverdue && isLive && (
          <div className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest text-center py-1">
            ⚠ Overdue — Deadline Passed
          </div>
        )}

        <CollapsibleTrigger className="w-full p-6 pb-7 flex items-center gap-6 text-left">
          {/* Thumbnail */}
          <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border ${isLive ? "border-emerald-200" : "border-slate-200"}`}>
            {sortedPhotos[0] ? (
              <img src={sortedPhotos[0].secure_url} className="object-cover w-full h-full" alt="thumbnail" />
            ) : (
              // Placeholder for URL-mode orders with no uploaded photos
              <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-blue-300" />
              </div>
            )}
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight leading-tight">
                {order.customer_name || "Client"}
              </h3>
              <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">
                ID: {order.order_id?.slice(0, 8)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fee Paid</p>
              <p className={`text-xl font-black ${isLive ? "text-emerald-600" : "text-slate-500"}`}>
                ${order.total_price}
              </p>
            </div>
            <div className="hidden md:block">
              <p className="text-[11px] font-black text-slate-400 uppercase mb-1">Package</p>
              <p className="text-sm font-black text-slate-700 uppercase leading-tight">{packageLabel}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Due In</p>
              <div className={`flex items-center gap-1.5 ${isUrgent && isLive ? "text-red-600 font-black text-base scale-105" : "text-slate-500 font-bold text-sm"}`}>
                <Clock className={`w-3.5 h-3.5 ${isUrgent && isLive ? "animate-pulse" : ""}`} />
                <span>{isLive ? timeLeft : "DELIVERED"}</span>
              </div>
            </div>
            <div className="flex justify-end pr-2">
              <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${open ? "rotate-180 text-emerald-500" : ""}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="p-8 bg-[#f8f9fa] border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Col 1: Branding ── */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2 border-b border-slate-200 pb-2 tracking-widest">
              <Brush className="w-3.5 h-3.5" /> Branding Section
            </h4>
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-inner">
              {[
                { label: "Agent", value: b.agent },
                { label: "Company", value: b.co },
                { label: "Phone", value: b.phone },
                { label: "Email", value: b.email },
                { label: "Website", value: b.web },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[12px] border-b border-slate-100 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">{row.label}</span>
                  <span className="text-slate-700 font-black">{row.value}</span>
                </div>
              ))}
              {b.logo && (
                <Button asChild variant="outline" className="w-full bg-white border-emerald-200 text-emerald-600 h-9 mt-4 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50">
                  <a href={b.logo} target="_blank">Download Logo</a>
                </Button>
              )}
            </div>
            <div className="p-4 bg-white/50 border border-slate-200 rounded-xl text-sm text-slate-500 italic leading-relaxed">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Client Instructions</span>
              {order.special_instructions || "Standard production."}
            </div>
          </div>

          {/* ── Col 2: Assets ── */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 border-b border-slate-200 pb-2 tracking-widest">
              <ImageIcon className="w-3.5 h-3.5" /> Asset Control ({sortedPhotos.length})
            </h4>

            {/* Listing URL indicator */}
            {order.listing_url && sortedPhotos.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">🔗 Listing URL Order</span>
                <p className="text-[11px] text-slate-500 italic">No photos uploaded — download from the listing link below.</p>
                <a href={order.listing_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 font-black text-[11px] underline underline-offset-2 hover:text-blue-800 break-all">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  {order.listing_url}
                </a>
              </div>
            )}

            {/* Photo grid — each photo has a copy URL button on hover */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-inner">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {sortedPhotos.map((img: any, i: number) => (
                  <div key={i} className="relative group w-16 h-16 flex-shrink-0">
                    <a
                      href={img.secure_url}
                      target="_blank"
                      rel="noreferrer"
                      title={img.description ? `#${i + 1}: ${img.description}` : `Photo ${i + 1}`}
                      className="block w-full h-full rounded-lg overflow-hidden border border-slate-100 hover:border-emerald-500 transition-all shadow-sm"
                    >
                      <img src={img.secure_url} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0" alt={`Photo ${i + 1}`} />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1 rounded-lg">
                        <span className="text-[8px] text-white font-black">{i + 1}</span>
                      </div>
                    </a>
                    {/* Per-photo copy button */}
                    <button
                      onClick={e => copyOneImage(e, i, img.secure_url)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                      title="Copy URL"
                    >
                      {copiedIndex === i ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo descriptions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-inner">
              <span className="text-[12px] font-black text-slate-400 uppercase block mb-2">Photo descriptions</span>
              <ul className="text-[12px] text-slate-600 space-y-1.5 max-h-32 overflow-y-auto">
                {sortedPhotos.map((img: any, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-black text-slate-400 w-5 flex-shrink-0">{i + 1}.</span>
                    <span className="font-medium">{img.description || "—"}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={copyAllImages}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all rounded-xl shadow-lg shadow-emerald-600/20"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="text-[12px] font-black uppercase tracking-widest">copy all image urls</span>
            </Button>

            {/* Audio / Script info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Voiceover", value: order.voiceover ? "Yes" : "No" },
                { label: "Voice", value: getVoiceDisplayName(order.voiceover_voice) },
                { label: "Music", value: order.music_selection || "—" },
              ].map(item => (
                <div key={item.label} className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">{item.label}</span>
                  <p className="text-[12px] font-black text-slate-600 truncate uppercase">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl text-[12px] text-slate-500 max-h-32 overflow-y-auto font-medium shadow-inner">
              <span className="text-[10px] font-black text-slate-300 uppercase block mb-1">Narrative Script</span>
              {order.voiceover_script || "No script content found."}
            </div>

            <div className="flex gap-2">
              {(order.custom_audio?.secure_url || order.music_file) && (
                <a href={order.custom_audio?.secure_url || order.music_file} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 transition-colors">
                  <Music className="w-3 h-3 text-emerald-500" /> Music
                </a>
              )}
              {order.voiceover_script && (
                <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(order.voiceover_script)}`}
                  download={`order-${order.order_id?.slice(0, 8)}-script.txt`}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 transition-colors">
                  <FileText className="w-3 h-3 text-emerald-500" /> Script
                </a>
              )}
            </div>
          </div>

          {/* ── Col 3: Finish ── */}
          <div className={`space-y-6 p-6 rounded-3xl border shadow-inner transition-colors ${isLive ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-200 border-slate-300"}`}>
            <h4 className="text-[12px] font-black uppercase text-slate-400 flex items-center gap-2 border-b border-emerald-100 pb-2 tracking-widest">
              <Flag className="w-3.5 h-3.5" /> Finish
            </h4>

            {/* Edited photos add-on */}
            {order.include_edited_photos ? (
              <div className="bg-emerald-500 text-white p-3 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Brush className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-tighter leading-none">High-Res Editing</p>
                    <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Paid Add-on</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 opacity-50" />
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-200 text-slate-400 p-3 rounded-xl flex items-center gap-2 opacity-60">
                <ImageIcon className="w-4 h-4 opacity-40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Standard Quality Only</span>
              </div>
            )}

            <div className="text-[10px] text-slate-400 font-black space-y-2">
              <p className="flex items-center gap-2 uppercase tracking-tighter truncate">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> {order.customer_email}
              </p>
              <p className="flex items-center gap-2 uppercase tracking-tighter">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> {order.customer_phone || "No Phone"}
              </p>
            </div>

            {/* Delivery URL — auto-saves, shows preview chip when saved */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Paste Google Drive link…"
                  className="h-11 bg-white border-emerald-200 text-slate-800 text-xs font-bold rounded-xl focus:ring-emerald-400 pr-10"
                />
                {url && url === savedUrl && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">
                {url === savedUrl && savedUrl ? "✓ Auto-saved" : url !== savedUrl ? "Saving…" : "Paste link above"}
              </p>

              {/* Saved URL preview chip */}
              {savedUrl && (
                <a
                  href={savedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2.5 bg-white border border-emerald-200 rounded-xl text-[10px] font-black text-emerald-700 hover:bg-emerald-50 transition-colors truncate"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{savedUrl}</span>
                </a>
              )}
            </div>

            {/* Toggle / confirm */}
            {confirmReopen ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                <p className="text-[11px] font-black text-amber-700 uppercase tracking-wide">Re-open this order?</p>
                <p className="text-[10px] text-amber-600">This will move it back to the active queue.</p>
                <div className="flex gap-2">
                  <Button
                    onClick={confirmReopenOrder}
                    className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black rounded-lg"
                  >
                    Yes, Re-open
                  </Button>
                  <Button
                    onClick={() => setConfirmReopen(false)}
                    variant="outline"
                    className="flex-1 h-9 text-[9px] font-black rounded-lg border-amber-300 text-amber-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={toggle}
                className={`w-full h-12 text-[9px] font-black rounded-xl tracking-widest transition-all shadow-md ${
                  isLive
                    ? "bg-slate-800 text-white hover:bg-slate-900"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                {isLive ? "MARK AS DELIVERED" : "RE-OPEN PRODUCTION"}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
