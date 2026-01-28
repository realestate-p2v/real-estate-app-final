"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ExternalLink, Loader2, 
  Music, Mic, Brush, ImageIcon, ArrowLeft, 
  Download, CheckCircle2, Phone, Mail, Clock, 
  Hash, Calendar, User, FileText, Globe, Search, DollarSign, Building2, Laptop
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

// Updated helper to handle the specific JSON branding data from your form
const formatBranding = (val: any) => {
  if (!val) return { tier: "Standard", details: null };
  try {
    const data = typeof val === 'string' ? JSON.parse(val) : val;
    return {
      tier: data.type === 'custom' ? "Custom Branding" : "Standard",
      details: data,
      logo: data.logoUrl || null
    };
  } catch (e) {
    return { tier: String(val), details: null };
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
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
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
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-200"><LayoutGrid className="w-5 h-5" /></div>
              COMMAND <span className="text-indigo-600">8.3</span>
            </h1>
          </div>
          
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by client or ID..." 
              className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-10">
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live Production
            </h2>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold px-4 py-1">
              {active.length} ACTIVE ORDERS
            </Badge>
          </div>
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-indigo-500" /></div>
            ) : (
              active.map(o => <OrderCard key={o.id} order={o} isActive={true} />)
            )}
          </div>
        </section>

        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">Archive</h2>
            <div className="space-y-4 opacity-60 grayscale hover:grayscale-0 transition-all">
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

  const brandInfo = formatBranding(order.branding);

  const saveLink = async () => {
    setIsSaving(true)
    await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id)
    toast.success("Delivery link synced")
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
      <Card className={`border-none overflow-hidden transition-all duration-500 ${isOpen ? 'shadow-2xl translate-y-[-4px]' : 'shadow-md'} 
        ${isActive ? 'ring-2 ring-emerald-400 shadow-[0_20px_40px_-15px_rgba(52,211,153,0.3)]' : 'ring-1 ring-slate-200'}`}>
        
        <CollapsibleTrigger className="w-full bg-white p-6 flex items-center gap-6 text-left">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex-shrink-0 border border-slate-200 overflow-hidden relative group">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-500" alt="" />
            ) : <ImageIcon className="h-6 w-6 text-slate-300 absolute center"/>}
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-none mb-1 uppercase tracking-tight">{order.customer_name || "Unknown Client"}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Hash className="w-3 h-3"/> {order.order_id?.slice(0, 10)}
              </p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Order Value</span>
              <Badge className="w-fit bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-sm py-1">
                ${order.total_price || "0.00"}
              </Badge>
            </div>

            <div className="hidden md:block">
              <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Style</span>
              <p className={`text-xs font-black uppercase ${brandInfo.tier === 'Custom Branding' ? 'text-indigo-600' : 'text-slate-500'}`}>
                {brandInfo.tier}
              </p>
            </div>

            <div className="flex justify-end items-center gap-4">
               <ChevronDown className={`w-6 h-6 text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="bg-white border-t border-slate-100">
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* BRANDING SECTION - FIXED DATA MAPPING */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <Brush className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Identity & Branding</h4>
                </div>
                {brandInfo.logo && (
                   <a href={brandInfo.logo} target="_blank" className="text-[9px] font-black text-indigo-600 underline">VIEW LOGO</a>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-inner">
                  {brandInfo.details ? (
                    <>
                      <BrandingField label="Agent Name" value={brandInfo.details.agentName} icon={<User className="w-3.5 h-3.5"/>} />
                      <BrandingField label="Company" value={brandInfo.details.company} icon={<Building2 className="w-3.5 h-3.5"/>} />
                      <BrandingField label="Website" value={brandInfo.details.website} icon={<Laptop className="w-3.5 h-3.5"/>} />
                      <div className="pt-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Special Instructions</label>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 min-h-[60px]">
                          {order.branding_instructions || "No specific instructions provided."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 text-center py-4 italic">Standard Package - No Details Provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* PRODUCTION SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                <Mic className="w-4 h-4 text-blue-600" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-600">Audio Production</h4>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Voice Profile</span>
                    <p className="text-xs font-black text-slate-900">{order.voiceover || "Not Selected"}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Music Mood</span>
                    <p className="text-xs font-black text-slate-900">{order.music_selection || "Not Selected"}</p>
                  </div>
                </div>
                <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                  <label className="text-[9px] font-black text-blue-500 uppercase block mb-2">Voiceover Script</label>
                  <p className="text-xs font-bold text-slate-700 leading-loose max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                    {order.voiceover_script || "Refer to property photos for automated description."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <AssetButton label="Music File" url={order.music_file} icon={<Music className="w-3.5 h-3.5" />} />
                   <AssetButton label="Script File" url={order.script_file} icon={<FileText className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </div>

            {/* DELIVERY SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Final Delivery</h4>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl space-y-6 shadow-xl">
                <div className="space-y-2">
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-300"><Mail className="w-4 h-4 text-slate-500" /> {order.customer_email}</div>
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-300"><Phone className="w-4 h-4 text-slate-500" /> {order.customer_phone || "No Phone Provided"}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Deliverable URL</label>
                  <div className="flex gap-2">
                    <Input 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      placeholder="Paste Final Video Link..." 
                      className="h-11 bg-slate-800 border-slate-700 text-white text-xs font-bold rounded-xl" 
                    />
                    <Button onClick={saveLink} className="h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 rounded-xl transition-all">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="h-12 border-slate-700 bg-transparent text-white font-black text-xs rounded-xl hover:bg-white/10">
                    <a href={order.photos_url} target="_blank"><ExternalLink className="w-4 h-4 mr-2 text-indigo-400" /> ASSETS</a>
                  </Button>
                  <Button onClick={toggleStatus} className={`h-12 font-black text-xs rounded-xl transition-all ${isActive ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-700 text-slate-300'}`}>
                    {isActive ? 'MARK DELIVERED' : 'RE-OPEN'}
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

function BrandingField({ label, value, icon }: { label: string, value: string, icon: any }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
      <div className="flex items-center gap-2">
        <div className="text-slate-300">{icon}</div>
        <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      </div>
      <span className="text-xs font-black text-slate-800">{value}</span>
    </div>
  )
}

function AssetButton({ label, url, icon }: { label: string, url: string, icon: any }) {
  if (!url || url === "none") return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-600 hover:shadow-md transition-all group">
      <div className="flex items-center gap-2">
        <div className="text-indigo-400 group-hover:text-indigo-600">{icon}</div>
        <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-600 uppercase tracking-tight">{label}</span>
      </div>
      <Download className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600" />
    </a>
  )
}
