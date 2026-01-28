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
    <div className="min-h-screen bg-[#f1f5f9] pb-20">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 h-20 flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="font-bold border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2"/> EXIT
            </Button>
          </Link>
          <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
             <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
             <h1 className="font-black text-slate-900 tracking-tighter text-xl">COMMAND <span className="text-indigo-600">8.9</span></h1>
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search orders..." className="pl-10 bg-slate-50 border-slate-200 rounded-xl" onChange={(e) => setSearch(e.target.value)} />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        <section>
          <div className="flex justify-between items-end mb-6 px-2">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Production Queue</h2>
              <p className="text-2xl font-black text-slate-900">Active Orders</p>
            </div>
            <Badge className="bg-emerald-500 px-4 py-1 font-bold">{active.length} LIVE</Badge>
          </div>
          <div className="space-y-6">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500 w-10 h-10" /></div> : 
              active.map(o => <OrderRow key={o.id} order={o} isLive={true} />)}
          </div>
        </section>

        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-200 opacity-60 grayscale hover:grayscale-0 transition-all">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-400 tracking-[0.2em] px-2">Archived</h2>
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
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const b = getBranding(order.branding)

  // THE NEW FEATURE: Copy all image URLs logic
  const copyAllImages = () => {
    if (!order.photos || order.photos.length === 0) {
      toast.error("No images found in this order");
      return;
    }
    const urlList = order.photos.map((p: any) => p.secure_url).join('\n');
    navigator.clipboard.writeText(urlList);
    setCopied(true);
    toast.success(`${order.photos.length} Image URLs copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  }

  const save = async () => {
    await supabase.from("orders").update({ delivery_url: url }).eq("id", order.id)
    toast.success("Link Updated")
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
        ${isLive ? 'ring-2 ring-emerald-400' : 'ring-1 ring-slate-200'}`}>
        
        <CollapsibleTrigger className="w-full p-6 flex items-center gap-6 text-left bg-white rounded-t-xl">
          <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            {order.photos?.[0] && <img src={order.photos[0].secure_url} className="object-cover w-full h-full" />}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-none uppercase">{order.customer_name || "Client"}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest">#{order.order_id?.slice(0,8)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total</p>
              <p className="text-lg font-black text-emerald-600 leading-none">${order.total_price}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Branding</p>
              <p className="text-xs font-black text-indigo-600 uppercase">{b.tier}</p>
            </div>
            <div className="flex justify-end pr-2">
              <ChevronDown className={`w-6 h-6 text-slate-300 transition-transform ${open ? 'rotate-180 text-indigo-600' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="p-8 bg-white border-t border-slate-50 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Branding Section */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase text-indigo-600 flex items-center gap-2 border-b pb-2">
              <Brush className="w-4 h-4"/> Branding
            </h4>
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 font-bold">
              <div className="flex justify-between text-[11px] border-b pb-2">
                <span className="text-slate-400 uppercase text-[9px]">Agent</span>
                <span className="text-slate-800">{b.agent}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b pb-2">
                <span className="text-slate-400 uppercase text-[9px]">Company</span>
                <span className="text-slate-800">{b.co}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 uppercase text-[9px]">Web</span>
                <span className="text-slate-800">{b.web}</span>
              </div>
              {b.logo && <Button asChild className="w-full bg-indigo-600 h-9 mt-2 text-[10px] font-black uppercase"><a href={b.logo} target="_blank">View Logo</a></Button>}
            </div>
            <div className="space-y-2">
               <span className="text-[9px] font-black text-slate-400 uppercase">Instructions</span>
               <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 italic leading-relaxed">
                 {order.branding_instructions || "No specific instructions."}
               </div>
            </div>
          </div>

          {/* Assets Section - WITH NEW COPY BUTTON */}
          <div className="space-y-6">
             <h4 className="text-[11px] font-black uppercase text-blue-600 flex items-center gap-2 border-b pb-2">
               <ImageIcon className="w-4 h-4"/> Asset Control
             </h4>
             
             {/* THE NEW BUTTON */}
             <Button 
                onClick={copyAllImages} 
                variant="outline"
                className="w-full h-12 border-dashed border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
             >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />}
                <span className="text-[10px] font-black uppercase tracking-tight">Copy {order.photos?.length || 0} Image URLs</span>
             </Button>

             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl text-center border">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Voice</span>
                  <p className="text-[10px] font-black truncate">{order.voiceover || "—"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center border">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Music</span>
                  <p className="text-[10px] font-black truncate">{order.music_selection || "—"}</p>
                </div>
             </div>
             
             <div className="flex gap-2">
                {order.music_file && <a href={order.music_file} target="_blank" className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border rounded-xl text-[10px] font-black uppercase"><Music className="w-3.5 h-3.5"/> Music</a>}
                {order.script_file && <a href={order.script_file} target="_blank" className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border rounded-xl text-[10px] font-black uppercase"><FileText className="w-3.5 h-3.5"/> Script</a>}
             </div>
          </div>

          {/* Delivery Section */}
          <div className="space-y-6 bg-slate-900 p-6 rounded-3xl shadow-xl">
             <div className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-4">
               <p className="flex items-center gap-2 mb-2"><Mail className="w-3.5 h-3.5"/> {order.customer_email}</p>
               <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> {order.customer_phone || "No Phone"}</p>
             </div>
             <div className="space-y-3">
               <Input 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="Final Video URL" 
                  className="h-11 bg-slate-800 border-slate-700 text-white text-xs font-bold rounded-xl"
               />
               <Button onClick={save} className="w-full bg-indigo-600 hover:bg-indigo-500 font-black h-11 rounded-xl text-xs">
                 UPDATE LINK
               </Button>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="h-12 text-[10px] font-black border-slate-700 text-white hover:bg-white/10 rounded-xl">
                  <a href={order.photos_url} target="_blank">PHOTO ASSETS</a>
                </Button>
                <Button onClick={toggle} className={`h-12 text-[10px] font-black rounded-xl ${isLive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  {isLive ? 'MARK DONE' : 'RE-OPEN'}
                </Button>
             </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
