"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ExternalLink, Loader2, 
  Music, Mic, Brush, ImageIcon, ArrowLeft, 
  Download, Hash, User, Building2, Laptop, Search, 
  Mail, Phone, Globe, FileText, CheckCircle2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

// Helper to unpack the branding JSON from your form
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
    <div className="min-h-screen bg-[#f1f5f9] pb-20">
      {/* NAVIGATION BAR WITH BRAND LOGO */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 h-20 flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="font-bold border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2"/> EXIT
            </Button>
          </Link>
          <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
             {/* Replace the URL below with your actual hosted logo path if different */}
             <img 
               src="/logo.png" 
               alt="Real Estate Photo 2 Video" 
               className="h-10 w-auto object-contain"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
             />
             <h1 className="font-black text-slate-900 tracking-tighter text-xl">COMMAND <span className="text-indigo-600">8.8</span></h1>
          </div>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search active orders..." 
            className="pl-10 bg-slate-50 border-slate-200 rounded-xl" 
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        <section>
          <div className="flex justify-between items-end mb-6 px-2">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Production Queue</h2>
              <p className="text-2xl font-black text-slate-900">Active Orders</p>
            </div>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 px-4 py-1 font-bold">{active.length} LIVE</Badge>
          </div>
          
          <div className="space-y-6">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500 w-10 h-10" /></div> : 
              active.map(o => <OrderRow key={o.id} order={o} isLive={true} />)}
          </div>
        </section>

        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-200 opacity-60 grayscale hover:grayscale-0 transition-all">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-400 tracking-[0.2em] px-2">Archived / Delivered</h2>
            <div className="space-y-4">
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
  const supabase = createClient()
  const b = getBranding(order.branding)

  const save = async () => {
    await supabase.from("orders").update({ delivery_url: url }).eq("id", order.id)
    toast.success("Fulfillment Link Updated")
  }

  const toggle = async (e: any) => {
    e.stopPropagation()
    const s = order.status === 'Delivered' ? 'New' : 'Delivered'
    await supabase.from("orders").update({ status: s }).eq("id", order.id)
    window.location.reload()
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border-none transition-all duration-300 ${open ? 'shadow-xl' : 'shadow-md'} 
        ${isLive ? 'ring-2 ring-emerald-400 shadow-[0_0_20px_-5px_rgba(52,211,153,0.4)]' : 'ring-1 ring-slate-200'}`}>
        
        <CollapsibleTrigger className="w-full p-6 flex items-center gap-6 text-left bg-white rounded-t-xl">
          <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
            {order.photos?.[0] && <img src={order.photos[0].secure_url} className="object-cover w-full h-full" />}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-none uppercase">{order.customer_name || "Client"}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest">ID: {order.order_id?.slice(0,8)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Revenue</p>
              <p className="text-lg font-black text-emerald-600">${order.total_price}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-slate-400 uppercase">Tier</p>
              <p className="text-xs font-black text-indigo-600 uppercase">{b.tier}</p>
            </div>
            <div className="flex justify-end pr-2">
              <ChevronDown className={`w-6 h-6 text-slate-300 transition-transform duration-300 ${open ? 'rotate-180 text-indigo-600' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="p-8 bg-white border-t border-slate-50 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Identity & Branding Unpacked */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase text-indigo-600 flex items-center gap-2 border-b border-indigo-50 pb-2">
              <Brush className="w-4 h-4"/> Branding Assets
            </h4>
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <DataLine label="Agent" value={b.agent} icon={<User className="w-3.5 h-3.5 text-slate-400"/>} />
              <DataLine label="Company" value={b.co} icon={<Building2 className="w-3.5 h-3.5 text-slate-400"/>} />
              <DataLine label="Website" value={b.web} icon={<Globe className="w-3.5 h-3.5 text-slate-400"/>} />
              {b.logo && (
                <a href={b.logo} target="_blank" className="flex items-center justify-between mt-4 p-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-colors">
                  Download Logo <Download className="w-4 h-4"/>
                </a>
              )}
            </div>
            <div className="space-y-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client Instructions</span>
               <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium italic text-slate-600 leading-relaxed min-h-[80px]">
                 {order.branding_instructions || "No custom instructions provided."}
               </div>
            </div>
          </div>

          {/* Audio & Script Section */}
          <div className="space-y-6">
             <h4 className="text-[11px] font-black uppercase text-blue-600 flex items-center gap-2 border-b border-blue-50 pb-2">
               <Mic className="w-4 h-4"/> Production Info
             </h4>
             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Voiceover</span>
                  <p className="text-[11px] font-black text-slate-800 uppercase">{order.voiceover || "—"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Music</span>
                  <p className="text-[11px] font-black text-slate-800 uppercase">{order.music_selection || "—"}</p>
                </div>
             </div>
             <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 text-xs font-medium text-slate-700 leading-loose max-h-48 overflow-y-auto pr-2">
                <span className="text-[9px] font-black text-blue-500 uppercase block mb-2">Final Script</span>
                {order.voiceover_script || "Refer to visual assets for manual script generation."}
             </div>
             <div className="flex gap-2">
                {order.music_file && <a href={order.music_file} target="_blank" className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-indigo-400 transition-all"><Music className="w-3.5 h-3.5"/> MUSIC</a>}
                {order.script_file && <a href={order.script_file} target="_blank" className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-indigo-400 transition-all"><FileText className="w-3.5 h-3.5"/> SCRIPT</a>}
             </div>
          </div>

          {/* Delivery & Logistics */}
          <div className="space-y-6 bg-slate-900 p-6 rounded-3xl shadow-2xl">
             <h4 className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
               <Globe className="w-4 h-4"/> Logistics
             </h4>
             <div className="text-[11px] space-y-2">
               <p className="text-slate-400 flex items-center gap-3 truncate"><Mail className="w-3.5 h-3.5 text-slate-600"/> {order.customer_email}</p>
               <p className="text-slate-400 flex items-center gap-3"><Phone className="w-3.5 h-3.5 text-slate-600"/> {order.customer_phone || "No Phone Provided"}</p>
             </div>
             <div className="space-y-3">
               <label className="text-[9px] font-black text-slate-500 uppercase">Final Output Link</label>
               <Input 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="Paste deliverable URL..." 
                  className="h-11 bg-slate-800 border-slate-700 text-white text-xs font-bold rounded-xl focus:ring-emerald-500"
               />
               <Button onClick={save} className="w-full bg-indigo-600 hover:bg-indigo-500 font-black h-11 rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/20">
                 UPDATE DELIVERY LINK
               </Button>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-2">
                <Button asChild variant="outline" className="h-12 text-[10px] font-black border-slate-700 text-white hover:bg-white/10 rounded-xl">
                  <a href={order.photos_url} target="_blank">RAW ASSETS</a>
                </Button>
                <Button onClick={toggle} className={`h-12 text-[10px] font-black rounded-xl transition-all shadow-lg ${isLive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-700 text-slate-300'}`}>
                  {isLive ? 'MARK DELIVERED' : 'RE-OPEN ORDER'}
                </Button>
             </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function DataLine({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-2 last:border-0">
      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
        {icon} {label}
      </div>
      <span className="text-[11px] font-black text-slate-800">{value}</span>
    </div>
  )
}
