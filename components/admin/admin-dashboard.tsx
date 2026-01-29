"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ExternalLink, Loader2, 
  Music, Mic, Brush, ImageIcon, ArrowLeft, 
  Download, Hash, User, Building2, Laptop, Search, 
  Mail, Phone, Globe, FileText, CheckCircle2, Copy, Check, Clock, Flag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

function useCountdown(createdAt: string) {
  const [timeLeft, setTimeLeft] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const start = new Date(createdAt).getTime()
      const deadline = start + (72 * 60 * 60 * 1000)
      const now = new Date().getTime()
      const distance = deadline - now

      if (distance < 0) {
        setTimeLeft("OVERDUE")
        setIsUrgent(true)
        return
      }

      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours < 24) setIsUrgent(true)
      setTimeLeft(`${hours}h ${minutes}m`)
    }, 1000)

    return () => clearInterval(timer)
  }, [createdAt])

  return { timeLeft, isUrgent }
}

const getBranding = (val: any) => {
  if (!val) return { tier: "Standard", agent: "—", co: "—", web: "—", logo: null, phone: "—", email: "—" };
  try {
    const d = typeof val === 'string' ? JSON.parse(val) : val;
    return {
      tier: d.type === 'custom' ? "Custom" : "Standard",
      agent: d.agentName || "—",
      co: d.companyName || d.company || "—",
      web: d.website || "—",
      logo: d.logoUrl || null,
      phone: d.phone || "—",
      email: d.email || "—",
    };
  } catch {
    return { tier: "Standard", agent: "—", co: "—", web: "—", logo: null, phone: "—", email: "—" };
  }
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

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
        const supabase = createClient()
        const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
        setOrders(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (!mounted) return null

  const filtered = orders.filter(o => (o.customer_name || "").toLowerCase().includes(search.toLowerCase()))
  const active = filtered.filter(o => o.status !== 'Delivered')
  const archived = filtered.filter(o => o.status === 'Delivered')

  return (
    <div className="min-h-screen bg-[#eceef0] text-slate-700 pb-20 font-sans">
      <nav className="sticky top-0 z-50 bg-[#f4f5f6]/80 backdrop-blur-md border-b border-slate-300 h-20 flex items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="font-bold text-slate-500 hover:bg-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2"/> EXIT
            </Button>
          </Link>
          <div className="flex items-center gap-3 border-l pl-6 border-slate-300">
             <img src="/logo.png" alt="Logo" className="h-8 w-auto opacity-80" />
             <h1 className="font-black text-slate-800 tracking-tighter text-xl uppercase">Command <span className="text-emerald-500 font-black">10.0</span></h1>
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search orders..." 
            className="pl-10 bg-white/50 border-slate-300 rounded-xl focus:bg-white transition-all shadow-inner" 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        <section>
          <div className="flex justify-between items-end mb-6 px-2">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/70">Production</h2>
              <p className="text-3xl font-black text-slate-800 tracking-tight">Active Queue</p>
            </div>
            <Badge className="bg-emerald-500 text-white px-5 py-1.5 font-black rounded-full uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
              {active.length} Orders Live
            </Badge>
          </div>

          <div className="space-y-4">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div> : 
              active.map(o => <OrderRow key={o.id} order={o} isLive={true} />)}
          </div>
        </section>

        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-300">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-400 tracking-[0.3em] px-2 text-center">Completed Records</h2>
            <div className="space-y-4 opacity-60 grayscale hover:grayscale-0 transition-all">
              {archived.map(o => <OrderRow key={o.id} order={o} isLive={false} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function OrderRow({ order, isLive }: { order: any, isLive: boolean }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(order.delivery_url || "")
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const b = getBranding(order.branding)
  const { timeLeft, isUrgent } = useCountdown(order.created_at)

  const sortedPhotos = React.useMemo(() => {
    if (!order.photos) return [];
    return [...order.photos].sort((a: any, b: any) => {
      const nameA = a.original_filename || "";
      const nameB = b.original_filename || "";
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [order.photos]);

  const copyAllImages = () => {
    if (sortedPhotos.length === 0) return toast.error("Empty");
    const urlList = sortedPhotos.map((p: any) => p.secure_url).join('\n');
    navigator.clipboard.writeText(urlList);
    setCopied(true);
    toast.success("Numerical List Copied");
    setTimeout(() => setCopied(false), 2000);
  }

  const save = async () => {
    await supabase.from("orders").update({ delivery_url: url }).eq("id", order.id)
    toast.success("Delivery Link Saved")
  }

  const toggle = async (e: any) => {
    e.stopPropagation()
    const s = order.status === 'Delivered' ? 'New' : 'Delivered'
    await supabase.from("orders").update({ status: s }).eq("id", order.id)
    window.location.reload()
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border-none transition-all duration-300 overflow-hidden relative
        ${open ? 'bg-white shadow-2xl' : 'bg-[#fdfdfe] hover:bg-white shadow-sm'} 
        ${isLive ? 'ring-2 ring-emerald-400/50 border-l-[6px] border-l-emerald-500' : 'ring-1 ring-slate-200 border-l-[6px] border-l-slate-300'}`}>
        
        {!open && (
           <div className="absolute bottom-1.5 right-3 pointer-events-none">
             <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-300">click to open</span>
           </div>
        )}

        <CollapsibleTrigger className="w-full p-6 pb-7 flex items-center gap-6 text-left">
          <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border ${isLive ? 'border-emerald-200' : 'border-slate-200'}`}>
            {sortedPhotos[0] && <img src={sortedPhotos[0].secure_url} className="object-cover w-full h-full" />}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight leading-tight">{order.customer_name || "Client"}</h3>
              <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">ID: {order.order_id?.slice(0,8)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fee Paid</p>
              <p className={`text-xl font-black ${isLive ? 'text-emerald-600' : 'text-slate-500'}`}>${order.total_price}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Branding</p>
              <p className="text-sm font-black text-slate-700 uppercase">{b.tier}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Due In</p>
              <div className={`flex items-center gap-1.5 ${isUrgent && isLive ? 'text-red-600 font-black text-base scale-105 transition-all' : 'text-slate-500 font-bold text-sm'}`}>
                <Clock className={`w-3.5 h-3.5 ${isUrgent && isLive ? 'animate-pulse' : ''}`} />
                <span>{isLive ? timeLeft : "DELIVERED"}</span>
              </div>
            </div>
            <div className="flex justify-end pr-2">
              <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${open ? 'rotate-180 text-emerald-500' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="p-8 bg-[#f8f9fa] border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 border-b border-slate-200 pb-2 tracking-widest">
              <Brush className="w-3.5 h-3.5"/> Branding Section
            </h4>
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-inner">
              <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[8px]">Agent</span>
                <span className="text-slate-700 font-black">{b.agent}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[8px]">Company</span>
                <span className="text-slate-700 font-black">{b.co}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[8px]">Phone</span>
                <span className="text-slate-700 font-black">{b.phone}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[8px]">Email</span>
                <span className="text-slate-700 font-black">{b.email}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[8px]">Website</span>
                <span className="text-slate-700 font-black">{b.web}</span>
              </div>
              {b.logo && <Button asChild variant="outline" className="w-full bg-white border-emerald-200 text-emerald-600 h-9 mt-4 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors"><a href={b.logo} target="_blank">Download Logo</a></Button>}
            </div>
            <div className="p-4 bg-white/50 border border-slate-200 rounded-xl text-xs text-slate-500 italic leading-relaxed">
               <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Client Instructions</span>
               {order.special_instructions || "Standard production."}
            </div>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 border-b border-slate-200 pb-2 tracking-widest">
               <ImageIcon className="w-3.5 h-3.5"/> Asset Control ({sortedPhotos.length})
             </h4>

             <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-inner">
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 {sortedPhotos.map((img: any, i: number) => (
                   <a 
                     key={i} 
                     href={img.secure_url} 
                     target="_blank" 
                     className="relative group w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100 hover:border-emerald-500 transition-all shadow-sm"
                   >
                     <img src={img.secure_url} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0" />
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[8px] text-white font-black">{i + 1}</span>
                     </div>
                   </a>
                 ))}
               </div>
             </div>

             <Button 
                onClick={copyAllImages} 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all rounded-xl shadow-lg shadow-emerald-600/20"
             >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">copy image url list</span>
             </Button>

             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Voiceover</span>
                  <p className="text-[10px] font-black text-slate-600 truncate uppercase">{order.voiceover || "—"}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Music</span>
                  <p className="text-[10px] font-black text-slate-600 truncate uppercase">{order.music_selection || "—"}</p>
                </div>
             </div>
             
             <div className="bg-white border border-slate-200 p-4 rounded-xl text-[11px] text-slate-500 max-h-32 overflow-y-auto font-medium shadow-inner">
                <span className="text-[8px] font-black text-slate-300 uppercase block mb-1">Narrative Script</span>
                {order.voiceover_script || "No script content found."}
             </div>

             <div className="flex gap-2">
                {(order.custom_audio?.secure_url || order.music_file) && <a href={order.custom_audio?.secure_url || order.music_file} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 p-3 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-600 transition-colors"><Music className="w-3 h-3 text-emerald-500"/> Music</a>}
                {order.voiceover_script && <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(order.voiceover_script)}`} download={`order-${order.order_id?.slice(0, 8)}-script.txt`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-600 transition-colors"><FileText className="w-3 h-3 text-emerald-500"/> Script</a>}
             </div>
          </div>

          {/* Section 3: Finish Section */}
          <div className={`space-y-6 p-6 rounded-3xl border shadow-inner transition-colors ${isLive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-200 border-slate-300'}`}>
             <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 border-b border-emerald-100 pb-2 tracking-widest">
               <Flag className="w-3.5 h-3.5"/> Finish
             </h4>
             <div className="text-[9px] text-slate-400 font-black space-y-2">
               <p className="flex items-center gap-2 uppercase tracking-tighter truncate"><Mail className="w-3.5 h-3.5 text-emerald-400"/> {order.customer_email}</p>
               <p className="flex items-center gap-2 uppercase tracking-tighter"><Phone className="w-3.5 h-3.5 text-emerald-400"/> {order.customer_phone || "No Phone"}</p>
             </div>
             <div className="space-y-3">
               <Input 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="Paste Google Drive link..." 
                  className="h-11 bg-white border-emerald-200 text-slate-800 text-xs font-bold rounded-xl focus:ring-emerald-400"
               />
               <Button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 rounded-xl text-xs tracking-widest transition-all shadow-md">
                 SYNC DELIVERY
               </Button>
             </div>
             <div className="flex gap-3 pt-2">
                <Button onClick={toggle} className={`w-full h-12 text-[9px] font-black rounded-xl tracking-widest transition-all shadow-md ${isLive ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                  {isLive ? 'MARK AS DELIVERED' : 'RE-OPEN PRODUCTION'}
                </Button>
             </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
