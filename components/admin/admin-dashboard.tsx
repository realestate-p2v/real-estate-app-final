"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ExternalLink, Loader2, 
  Music, Mic, Brush, ImageIcon, ArrowLeft, 
  Download, CheckCircle2, Phone, Mail, Clock, 
  Hash, Calendar, User, FileText, Globe, Search, DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

const renderSafe = (val: any): string => {
  if (val === null || val === undefined || val === "" || val === "none") return "—";
  return typeof val === 'string' ? val : JSON.stringify(val);
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
    renderSafe(o.customer_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    renderSafe(o.order_id).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const active = filtered.filter(o => o.status !== 'Delivered')
  const archived = filtered.filter(o => o.status === 'Delivered')

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-20">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-500 font-bold hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4 mr-2" /> EXIT
              </Button>
            </Link>
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <div className="bg-black p-1.5 rounded-lg text-white"><LayoutGrid className="w-5 h-5" /></div>
              COMMAND <span className="text-indigo-600">8.2</span>
            </h1>
          </div>
          
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search Production..." 
              className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-12">
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Live Production Queue</h2>
            <Badge className="bg-emerald-500 text-white font-bold">{active.length} ACTIVE</Badge>
          </div>
          <div className="space-y-6">
            {loading ? <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-500" /> : active.map(o => <OrderCard key={o.id} order={o} isActive={true} />)}
          </div>
        </section>

        {archived.length > 0 && (
          <section className="pt-10 border-t border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">Archived Orders</h2>
            <div className="space-y-4 opacity-75 grayscale hover:grayscale-0 transition-all">
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

  const saveLink = async () => {
    setIsSaving(true)
    await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id)
    toast.success("Link Updated")
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
      <Card className={`border-none overflow-hidden transition-all duration-500 ${isOpen ? 'shadow-2xl' : 'shadow-md'} ${isActive ? 'ring-2 ring-emerald-400/50 shadow-[0_0_20px_-5px_rgba(52,211,153,0.4)]' : 'ring-1 ring-slate-200 grayscale-[0.5]'}`}>
        <CollapsibleTrigger className="w-full bg-white p-6 flex items-center gap-6 text-left">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex-shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />
            ) : <ImageIcon className="h-6 w-6 text-slate-300"/>}
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-none mb-1 uppercase tracking-tight">{renderSafe(order.customer_name)}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.order_id?.slice(0, 10)}</p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase">Revenue</span>
              <span className="text-md font-black text-emerald-600 flex items-center"><DollarSign className="w-3.5 h-3.5" />{order.total_price || "0.00"}</span>
            </div>

            <div className="hidden md:block">
              <span className="text-[9px] font-black text-slate-400 uppercase">Package</span>
              <p className="text-xs font-black uppercase text-indigo-600">{order.branding === 'Custom Branding' ? '🎨 Custom' : 'Standard'}</p>
            </div>

            <div className="flex justify-end gap-3 items-center">
               {isActive && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />}
               <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="bg-white border-t border-slate-100">
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* BRANDING SECTION - REBUILT FOR READABILITY */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                <Brush className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500">Identity & Branding</h4>
              </div>
              <div className="space-y-5">
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <label className="text-[9px] font-black text-indigo-400 uppercase block mb-2">Detailed Branding Instructions</label>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap italic">
                    "{order.branding_instructions || "No specific branding instructions provided."}"
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <AssetButton label="Branding Asset / Logo" url={order.branding_file} icon={<Brush className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </div>

            {/* PRODUCTION SECTION */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                <Mic className="w-4 h-4 text-blue-500" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-500">Audio & Production</h4>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <DataCard label="Voiceover" value={order.voiceover} />
                  <DataCard label="Music Selection" value={order.music_selection} />
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Production Script</label>
                  <p className="text-xs font-bold text-slate-700 leading-loose max-h-40 overflow-y-auto pr-2">
                    {order.voiceover_script || "Refer to property visual data for AI scripts."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <AssetButton label="Music" url={order.music_file} icon={<Music className="w-3.5 h-3.5" />} />
                  <AssetButton label="Script" url={order.script_file} icon={<FileText className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </div>

            {/* LOGISTICS & DELIVERY */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Logistics & Final Delivery</h4>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                <div className="space-y-2">
                   <div className="flex items-center gap-3 text-xs font-black text-slate-700"><Mail className="w-4 h-4 text-slate-300" /> {order.customer_email}</div>
                   <div className="flex items-center gap-3 text-xs font-black text-slate-700"><Phone className="w-4 h-4 text-slate-300" /> {order.customer_phone || "Not Provided"}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Final Output Link</label>
                  <div className="flex gap-2">
                    <Input 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      placeholder="Paste Deliverable URL..." 
                      className="h-11 bg-white border-slate-200 text-xs font-bold rounded-xl" 
                    />
                    <Button onClick={saveLink} className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 rounded-xl">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button asChild variant="outline" className="h-12 border-slate-200 font-black text-xs rounded-xl hover:bg-slate-100 transition-colors">
                    <a href={order.photos_url} target="_blank"><ExternalLink className="w-4 h-4 mr-2 text-indigo-500" /> RAW ASSETS</a>
                  </Button>
                  <Button onClick={toggleStatus} className={`h-12 font-black text-xs rounded-xl transition-all shadow-lg ${isActive ? 'bg-black text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-600'}`}>
                    {isActive ? 'MARK DELIVERED' : 'RE-OPEN ORDER'}
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

function DataCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
      <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">{label}</span>
      <p className="text-xs font-black text-slate-900 truncate">{renderSafe(value)}</p>
    </div>
  )
}

function AssetButton({ label, url, icon }: { label: string, url: string, icon: any }) {
  if (!url || url === "none") return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-600 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <div className="text-indigo-500">{icon}</div>
        <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-600 uppercase tracking-tight">{label}</span>
      </div>
      <Download className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-y-0.5" />
    </a>
  )
}
