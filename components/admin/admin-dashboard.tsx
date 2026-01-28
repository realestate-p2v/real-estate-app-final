"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, LayoutGrid, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronUp, ImageIcon, Globe, Copy,
  Mic, Brush, Music, Hash, Phone, Info, ExternalLink,
  Layers, CreditCard, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error("Database Error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const filtered = orders.filter(o => {
    const search = searchQuery.toLowerCase()
    return (
      (o.customer_name?.toLowerCase() || "").includes(search) ||
      (o.order_id?.toLowerCase() || "").includes(search) ||
      (o.customer_email?.toLowerCase() || "").includes(search)
    )
  })

  const active = filtered.filter(o => o.status !== "Delivered")
  const archived = filtered.filter(o => o.status === "Delivered")

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black p-3 md:p-6 lg:p-10 font-['Poppins']">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER AREA */}
        <header className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-2xl rotate-3">
                <LayoutGrid className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">Universal Command</h1>
                <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Cross-Platform Response v4.5</p>
              </div>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input 
                placeholder="Global filter..." 
                className="pl-12 h-14 bg-white dark:bg-zinc-900 border-none shadow-xl rounded-2xl text-base" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* RESPONSIVE DUAL COLUMN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          
          {/* QUEUE 1: ACTIVE */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-4 border-red-500 pb-4">
              <h2 className="text-red-600 font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Live Production
              </h2>
              <Badge className="bg-red-500 text-white font-bold h-7 px-4 rounded-full shadow-lg shadow-red-500/30">{active.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {active.map(order => <OrderCard key={order.id} order={order} theme="red" refresh={fetchOrders} />)}
            </div>
          </div>

          {/* QUEUE 2: ARCHIVE */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-4 border-green-500 pb-4">
              <h2 className="text-green-600 font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Delivered Archive
              </h2>
              <Badge className="bg-green-500 text-white font-bold h-7 px-4 rounded-full shadow-lg shadow-green-500/30">{archived.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {archived.map(order => <OrderCard key={order.id} order={order} theme="green" refresh={fetchOrders} />)}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, theme, refresh }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    if (!error) {
      refresh()
      toast.success(`Project moved to ${newStatus}`)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`group border-0 border-l-[6px] shadow-sm transition-all duration-300 hover:shadow-xl ${
        theme === 'red' ? 'border-l-red-500 bg-red-50/10' : 'border-l-green-500 bg-green-50/10'
      }`}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 md:p-6 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 relative overflow-hidden">
            
            {/* THUMBNAIL & STATUS (MOBILE COMPACT) */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-zinc-200 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                {order.photos?.[0]?.secure_url ? (
                  <img src={order.photos[0].secure_url} className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-500" alt="" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-400"><ImageIcon className="h-6 w-6" /></div>
                )}
              </div>
              <div className="sm:hidden flex-1">
                 <p className="font-black text-lg truncate uppercase">{order.customer_name || "Guest"}</p>
                 <p className="text-xl font-black text-zinc-900">${order.total_price}</p>
              </div>
            </div>

            {/* FRONT OF CARD DATA - PRIMARY */}
            <div className="flex-1 min-w-0 space-y-2 w-full">
              <div className="hidden sm:block">
                <p className="font-black text-xl md:text-2xl text-zinc-900 truncate uppercase leading-none mb-1">
                  {order.customer_name || "Guest Lead"}
                </p>
                <p className="text-xs font-medium text-zinc-500 truncate mb-3">{order.customer_email}</p>
              </div>

              {/* TACTICAL CHIPS (VISIBLE ON FRONT) */}
              <div className="flex flex-wrap gap-2">
                <Chip icon={<Layers className="h-3 w-3"/>} label={`${order.photo_count || 0} Ph.`} />
                <Chip icon={<Music className="h-3 w-3"/>} label={order.music_selection} color="text-blue-600 bg-blue-50" />
                <Chip icon={<Mic className="h-3 w-3"/>} label={order.voiceover} color="text-purple-600 bg-purple-50" />
                <Chip icon={<Brush className="h-3 w-3"/>} label={order.branding} color="text-pink-600 bg-pink-50" />
              </div>
            </div>

            {/* PRICE & TOGGLE */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-right">
                <p className="font-black text-2xl md:text-3xl text-zinc-900 tracking-tighter">${order.total_price || 0}</p>
                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest h-5">{order.payment_status}</Badge>
              </div>
              {isOpen ? <ChevronUp className="h-6 w-6 text-zinc-300" /> : <ChevronDown className="h-6 w-6 text-zinc-300 group-hover:text-zinc-900" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="p-4 md:p-8 bg-white border-t border-zinc-100 space-y-8 animate-in slide-in-from-top-2 duration-300">
          
          {/* EXPANDED GRID: 4 COLUMNS ON DESKTOP, 2 ON MOBILE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Detail label="Phone" value={order.customer_phone} icon={<Phone className="h-3 w-3"/>} />
            <Detail label="Created" value={order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'} icon={<Calendar className="h-3 w-3"/>} />
            <Detail label="Payment ID" value={order.order_id?.slice(-12)} icon={<CreditCard className="h-3 w-3"/>} />
            <Detail label="Status" value={order.status} icon={<Info className="h-3 w-3"/>} />
            
            {/* FULL DATA DUMP FIELD */}
            <div className="col-span-2 md:col-span-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
               <p className="text-[10px] font-black uppercase text-zinc-400 mb-2 flex items-center gap-2 tracking-widest"><Hash className="h-3 w-3"/> Branding & Special Instructions</p>
               <p className="text-sm font-medium text-zinc-700 leading-relaxed italic">
                 {order.branding || "No special branding instructions provided for this order."}
               </p>
            </div>
          </div>

          {/* ASSET CONTROL CENTER */}
          <div className="bg-zinc-900 rounded-[2rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" /> Cloudinary Data Pipeline
                  </p>
                  <h3 className="text-xl font-bold">{order.photo_count || 0} Assets Ready for Processing</h3>
                </div>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const urls = order.photos?.map((p: any) => p?.secure_url).filter(Boolean).join(", ");
                    navigator.clipboard.writeText(urls);
                    toast.success("Clipboard Optimized");
                  }}
                  className="bg-white text-black hover:bg-zinc-200 font-black px-8 h-14 rounded-2xl shadow-lg shadow-white/10"
                >
                  <Copy className="h-5 w-5 mr-3" /> COPY ALL LINKS
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 bg-white/5 border-white/10 text-white font-bold rounded-2xl hover:bg-white hover:text-black transition-all text-base" asChild>
                  <a href={order.photos_url || "#"} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5 mr-3" /> SOURCE FOLDER
                  </a>
                </Button>
                {theme === 'red' ? (
                  <Button onClick={() => updateStatus("Delivered")} className="h-16 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/40 text-base">
                    <CheckCircle2 className="h-5 w-5 mr-3" /> SHIP TO CLIENT
                  </Button>
                ) : (
                  <Button onClick={() => updateStatus("New")} className="h-16 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-2xl border border-white/5">
                    RETURN TO QUEUE
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function Chip({ icon, label, color = "bg-zinc-100 text-zinc-600" }: any) {
  if (!label || label === "None" || label === "N/A") return null;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-tight ${color} border border-transparent transition-all`}>
      {icon} {label}
    </div>
  )
}

function Detail({ label, value, icon }: any) {
  return (
    <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
        {icon} {label}
      </p>
      <p className="text-xs md:text-sm font-bold text-zinc-900 truncate">{value || "---"}</p>
    </div>
  )
}
