"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ExternalLink, Loader2, 
  Music, Mic, Brush, ImageIcon, ArrowLeft, 
  Download, Hash, User, Building2, Laptop, Search, 
  Mail, Phone, Globe, FileText, CheckCircle2, Copy, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

const getBranding = (val: any) => {
  if (!val) return { tier: "Standard", agent: "—", co: "—", web: "—", logo: null };
  try {
    const d = typeof val === 'string' ? JSON.parse(val) : val;
    return {
      tier: d.type === 'custom' ? "Custom" : "Standard",
      agent: d.agentName || "—",
      co: d.company || "—",
      web: d.website || "—",
      logo: d.logoUrl || null
    };
  } catch {
    return { tier: "Standard", agent: "—", co: "—", web: "—", logo: null };
  }
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [supabase])

  if (!mounted) return null

  const filtered = orders.filter(o => (o.customer_name || "").toLowerCase().includes(search.toLowerCase()))
  const active = filtered.filter(o => o.status !== 'Delivered')
  const archived = filtered.filter(o => o.status === 'Delivered')

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-20 font-sans">
      {/* DARK NAV */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800 h-20 flex items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="font-bold border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2"/> EXIT
            </Button>
          </Link>
          <div className="flex items-center gap-3 border-l pl-6 border-slate-800">
             <img src="/logo.png" alt="Logo" className="h-8 w-auto invert brightness-200" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
             <h1 className="font-black text-white tracking-tighter text-xl uppercase">Command <span className="text-indigo-500 font-black">9.0</span></h1>
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search production..." 
            className="pl-10 bg-slate-900 border-slate-800 rounded-xl text-white focus:ring-indigo-500" 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        <section>
          <div className="flex justify-between items-end mb-6 px-2">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Live Production</h2>
              <p className="text-3xl font-black text-white tracking-tight">Active Queue</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1 font-black">{active.length} ACTIVE</Badge>
          </div>

          <div className="space-y-4">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500 w-10 h-10" /></div> : 
              active.map(o => <OrderRow key={o.id} order={o} isLive={true} />)}
          </div>
        </section>

        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-800">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-500 tracking-[0.3em] px-2">Archived Projects</h2>
            <div className="space-y-4 opacity-50 hover:opacity-100 transition-opacity">
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

  const copyAllImages = () => {
    if (!order.photos || order.photos.length === 0) return toast.error("No images");
    const urlList = order.photos.map((p: any) => p.secure_url).join('\n');
    navigator.clipboard.writeText(urlList);
    setCopied(true);
    toast.success("All URLs copied");
    setTimeout(() => setCopied(false), 2000);
  }

  const save = async () => {
    await supabase.from("orders").update({ delivery_url: url }).eq("id", order.id)
    toast.success("Delivery Link Synced")
  }

  const toggle = async (e: any) => {
    e.stopPropagation()
    const s = order.status === 'Delivered' ? 'New' : 'Delivered'
    await supabase.from("orders").update({ status: s }).eq("id", order.id)
    window.location.reload()
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border-none transition-all duration-300 overflow-hidden
        ${open ? 'bg-slate-900 shadow-2xl' : 'bg-[#0f172a] hover:bg-slate-800/50'} 
        ${isLive ? 'ring-1 ring-indigo-500/30' : 'ring-1 ring-slate-800'}`}>
        
        <CollapsibleTrigger className="w-full p-6 flex items-center gap-6 text-left">
          <div className="w-14 h-14 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
            {order.photos?.[0] && <img src={order.photos[0].secure_url} className="object-cover w-full h-full" />}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center gap-4">
            <div>
              <h3 className="font-black text-base text-white uppercase tracking-tight">{order.customer_name || "Client"}</h3>
              <p className="text-[9px] text-slate-500 font-black mt-1 uppercase tracking-widest">#{order.order_id?.slice(0,8)}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Payment</p>
              <p className="text-base font-black text-emerald-400">${order.total_price}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">License</p>
              <p className="text-[10px] font-black text-indigo-400 uppercase">{b.tier}</p>
            </div>
            <div className="flex justify-end pr-2">
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${open ? 'rotate-180 text-indigo-400' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="p-8 bg-[#020617]/40 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Identity Section */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Brush className="w-3.5 h-3.5"/> Client Identity
            </h4>
            <div className="space-y-3 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between text-[11px] border-b border-slate-800 pb-2">
                <span className="text-slate-500 font-black uppercase text-[8px]">Agent</span>
                <span className="text-white font-bold">{b.agent}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b border-slate-800 pb-2">
                <span className="text-slate-500 font-black uppercase text-[8px]">Company</span>
                <span className="text-white font-bold">{b.co}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 font-black uppercase text-[8px]">Web</span>
                <span className="text-white font-bold truncate max-w-[120px]">{b.web}</span>
              </div>
              {b.logo && <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 h-9 mt-4 text-[9px] font-black uppercase tracking-widest"><a href={b.logo} target="_blank">View Assets</a></Button>}
            </div>
            <div className="space-y-2">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Editor Notes</span>
               <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 italic leading-relaxed">
                 {order.branding_instructions || "No custom requirements."}
               </div>
            </div>
          </div>

          {/* Asset Management */}
          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-2">
               <ImageIcon className="w-3.5 h-3.5"/> Asset Control
             </h4>
             <Button 
                onClick={copyAllImages} 
                className="w-full h-12 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center gap-2 transition-all group"
             >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                <span className="text-[10px] font-black uppercase tracking-widest">Copy Image Bundle</span>
             </Button>

             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="text-[7px] font-black text-slate-500 uppercase block mb-1 tracking-tighter">Voice Choice</span>
                  <p className="text-[10px] font-black text-slate-300 truncate uppercase">{order.voiceover || "—"}</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="text-[7px] font-black text-slate-500 uppercase block mb-1 tracking-tighter">Music Track</span>
                  <p className="text-[10px] font-black text-slate-300 truncate uppercase">{order.music_selection || "—"}</p>
                </div>
             </div>
             
             <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl text-[11px] text-slate-400 leading-relaxed max-h-32 overflow-y-auto font-medium italic">
                {order.voiceover_script || "AI is drafting script..."}
             </div>

             <div className="flex gap-2">
                {order.music_file && <a href={order.music_file} target="_blank" className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[9px] font-black uppercase text-slate-300"><Music className="w-3 h-3"/> Music</a>}
                {order.script_file && <a href={order.script_file} target="_blank" className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[9px] font-black uppercase text-slate-300"><FileText className="w-3 h-3"/> Script</a>}
             </div>
          </div>

          {/* Delivery & Fulfillment */}
          <div className="space-y-6 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
             <div className="text-[9px] text-slate-500 font-black border-b border-slate-900 pb-4 space-y-2">
               <p className="flex items-center gap-2 uppercase tracking-tighter truncate"><Mail className="w-3.5 h-3.5 text-indigo-500"/> {order.customer_email}</p>
               <p className="flex items-center gap-2 uppercase tracking-tighter"><Phone className="w-3.5 h-3.5 text-indigo-500"/> {order.customer_phone || "No Phone"}</p>
             </div>
             <div className="space-y-3">
               <Input 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="Final Video Cloudinary Link" 
                  className="h-11 bg-slate-900 border-slate-800 text-white text-xs font-bold rounded-xl focus:ring-indigo-500"
               />
               <Button onClick={save} className="w-full bg-indigo-600 hover:bg-indigo-500 font-black h-11 rounded-xl text-xs tracking-widest transition-all shadow-lg shadow-indigo-600/20">
                 UPDATE DELIVERY
               </Button>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-2">
                <Button asChild variant="outline" className="h-12 text-[9px] font-black border-slate-800 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl uppercase tracking-widest">
                  <a href={order.photos_url} target="_blank">Cloudinary</a>
                </Button>
                <Button onClick={toggle} className={`h-12 text-[9px] font-black rounded-xl tracking-widest shadow-lg transition-all ${isLive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {isLive ? 'MARK DONE' : 'RE-OPEN'}
                </Button>
             </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
