"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ExternalLink, Loader2, 
  Music, Mic, Brush, ImageIcon, ArrowLeft, 
  Download, Hash, User, Building2, Laptop, Search, 
  DollarSign, Mail, Phone, Globe, FileText // Added FileText here
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

const formatBranding = (val: any) => {
  if (!val) return { tier: "Standard", agentName: "—", company: "—", website: "—", logo: null };
  try {
    const data = typeof val === 'string' ? JSON.parse(val) : val;
    return {
      tier: data.type === 'custom' ? "Custom Branding" : "Standard",
      agentName: data.agentName || "—",
      company: data.company || "—",
      website: data.website || "—",
      logo: data.logoUrl || null
    };
  } catch (e) {
    return { tier: String(val), agentName: "—", company: "—", website: "—", logo: null };
  }
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
      if (error) toast.error("Database connection failed")
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [supabase])

  if (!mounted) return null

  const filtered = orders.filter(o => 
    (o.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.order_id || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const active = filtered.filter(o => o.status !== 'Delivered')
  const archived = filtered.filter(o => o.status === 'Delivered')

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-500 font-bold hover:bg-slate-100">
                <ArrowLeft className="w-4 h-4 mr-2" /> EXIT
              </Button>
            </Link>
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2 text-indigo-600">
              COMMAND 8.5
            </h1>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Filter by client..." 
              className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-10">
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Queue
            </h2>
            <Badge className="bg-emerald-500 text-white font-bold px-4 py-1">{active.length} ACTIVE</Badge>
          </div>
          <div className="space-y-6">
            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-indigo-500" /></div> 
            : active.map(o => <OrderCard key={o.id} order={o} isActive={true} />)}
          </div>
        </section>

        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-200">
             <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Archive</h2>
             <div className="space-y-4 opacity-60">
                {archived.map(o => <OrderCard key={o.id} order={o} isActive={false} />)}
             </div>
          </section>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order, isActive }: { order: any, isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [link, setLink] = useState(order.delivery_url || "")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const brand = formatBranding(order.branding);

  const saveLink = async () => {
    setIsSaving(true)
    const { error } = await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id)
    if (error) toast.error("Save failed")
    else toast.success("Link Updated")
    setIsSaving(false)
  }

  const toggleStatus = async (e: any) => {
    e.stopPropagation()
    const newStatus = order.status === 'Delivered' ? 'New' : 'Delivered'
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    window.location.reload()
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`border-none transition-all duration-500 
        ${isActive ? 'ring-2 ring-emerald-400 shadow-[0_20px_40px_-15px_rgba(52,211,153,0.3)]' : 'ring-1 ring-slate-200'}`}>
        
        <CollapsibleTrigger className="w-full bg-white p-6 flex items-center gap-6 text-left">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex-shrink-0 border border-slate-200 overflow-hidden">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />
            ) : <ImageIcon className="h-6 w-6 text-slate-300 m-5"/>}
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-none mb-1 uppercase tracking-tight">{order.customer_name || "Client"}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{order.order_id?.slice(0, 8)}</p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Total</span>
              <span className="text-emerald-600 font-black text-lg">${order.total_price || "0"}</span>
            </div>

            <div className="hidden md:block">
              <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Branding</span>
              <p className="text-xs font-black uppercase text-indigo-600">{brand.tier}</p>
            </div>

            <div className="flex justify-end">
               <ChevronDown className={`w-6 h-6 text-slate-300 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="bg-white border-t border-slate-100">
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                <Brush className="w-4 h-4 text-indigo-600" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Identity Details</h4>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <DataRow label="Agent Name" value={brand.agentName} icon={<User className="w-4 h-4 text-slate-400"/>} />
                <DataRow label="Company" value={brand.company} icon={<Building2 className="w-4 h-4 text-slate-400"/>} />
                <DataRow label="Website" value={brand.website} icon={<Globe className="w-4 h-4 text-slate-400"/>} />
                
                <div className="pt-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Branding Notes</label>
                  <div className="text-xs font-bold text-slate-700 bg-white p-4 rounded-xl border border-slate-200 min-h-[60px]">
                    {order.branding_instructions || "No custom instructions provided."}
                  </div>
                </div>

                {brand.logo && (
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl shadow-lg shadow-indigo-100">
                    <a href={brand.logo} target="_blank">
                      <span className="text-[10px] font-black uppercase mr-2">Open Client Logo</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                <Mic className="w-4 h-4 text-blue-600" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-600">Audio Assets</h4>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <StatBox label="VOICE" value={order.voiceover} />
                   <StatBox label="MUSIC" value={order.music_selection} />
                </div>
                <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                  <label className="text-[9px] font-black text-blue-500 uppercase block mb-2">Final Script</label>
                  <p className="text-xs font-bold text-slate-700 leading-loose max-h-40 overflow-y-auto pr-2">
                    {order.voiceover_script || "AI Script Pending."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <DownloadBtn label="Music" url={order.music_file} icon={<Music className="w-3.5 h-3.5" />} />
                   <DownloadBtn label="Script" url={order.script_file} icon={<FileText className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Fulfillment</h4>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl space-y-6 shadow-xl">
                <div className="space-y-2">
                   <p className="text-xs font-bold text-slate-300 flex items-center gap-2 truncate"><Mail className="w-3 h-3 text-slate-500"/> {order.customer_email}</p>
                   <p className="text-xs font-bold text-slate-300 flex items-center gap-2"><Phone className="w-3 h-3 text-slate-500"/> {order.customer_phone || "No Phone"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Deliverable URL</label>
                  <div className="flex gap-2">
                    <Input 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      placeholder="Paste link here..." 
                      className="h-11 bg-slate-800 border-slate-700 text-white text-xs font-bold" 
                    />
                    <Button onClick={saveLink} className="h-11 bg-indigo-600 font-black px-4 rounded-xl">
                      {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : "SAVE"}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <Button asChild variant="outline" className="h-12 border-slate-700 text-white hover:bg-white/10 font-black text-xs rounded-xl">
                     <a href={order.photos_url} target="_blank">RAW ASSETS</a>
                   </Button>
                   <Button onClick={toggleStatus} className={`h-12 font-black text-xs rounded-xl ${isActive ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-700'}`}>
                     {isActive ? 'MARK DONE' : 'RE-OPEN'}
                   </Button>
                </div>
              </div>
            </div>

          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function DataRow({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-2 last:border-0">
      <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[9px]">
        {icon} {label}
      </div>
      <span className="text-xs font-black text-slate-800">{value}</span>
    </div>
  )
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase">{label}</span>
      <p className="text-[10px] font-black text-slate-900 truncate">{value || "—"}</p>
    </div>
  )
}

function DownloadBtn({ label, url, icon }: { label: string, url: string, icon: any }) {
  if (!url || url === "none") return null;
  return (
    <a href={url} target="_blank" className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all">
      <div className="flex items-center gap-2 text-indigo-500">{icon} <span className="text-[9px] font-black text-slate-600">{label}</span></div>
      <Download className="w-3.5 h-3.5 text-slate-300" />
    </a>
  )
}
