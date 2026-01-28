"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ExternalLink, Loader2, 
  Music, Mic, Brush, ImageIcon, ArrowLeft, 
  Download, CheckCircle2, Phone, Mail, Clock, 
  Hash, Calendar, User, FileText, Globe, Search
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
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans pb-20">
      {/* MINIMALIST HEADER */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-black font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> EXIT
              </Button>
            </Link>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><LayoutGrid className="w-5 h-5" /></div>
              COMMAND <span className="text-slate-400 font-medium">8.0</span>
            </h1>
          </div>
          
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <Input 
              placeholder="Search by name or order ID..." 
              className="pl-11 h-12 bg-slate-100 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12 space-y-16">
        {/* ACTIVE SECTION */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Active Queue</h2>
              <p className="text-sm text-slate-500 font-medium">Orders currently in production</p>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full font-bold">{active.length} Orders</Badge>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-slate-300" /></div>
            ) : (
              active.map(o => <OrderCard key={o.id} order={o} />)
            )}
          </div>
        </section>

        {/* ARCHIVE SECTION */}
        {archived.length > 0 && (
          <section>
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Archived / Completed</h2>
             <div className="space-y-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                {archived.map(o => <OrderCard key={o.id} order={o} />)}
             </div>
          </section>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order }: { order: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [link, setLink] = useState(order.delivery_url || "")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const saveLink = async () => {
    setIsSaving(true)
    await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id)
    toast.success("Delivery link updated")
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
      <Card className={`border-none transition-all duration-300 overflow-hidden ${isOpen ? 'ring-2 ring-indigo-600 shadow-2xl' : 'shadow-sm hover:shadow-md ring-1 ring-slate-200'}`}>
        <CollapsibleTrigger className="w-full bg-white p-5 flex items-center gap-6 text-left">
          <div className="h-14 w-14 bg-slate-50 rounded-2xl flex-shrink-0 border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />
            ) : (
              <ImageIcon className="h-6 w-6 text-slate-200"/>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-black text-lg text-slate-900 leading-none mb-1 uppercase tracking-tight">{renderSafe(order.customer_name)}</h3>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {order.order_id?.slice(0, 8)}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1.5">
            <Badge variant="outline" className={`text-[10px] font-black border-2 px-3 ${order.branding === 'Custom Branding' ? 'text-purple-600 border-purple-100 bg-purple-50' : 'text-slate-400 border-slate-100'}`}>
              {order.branding === 'Custom Branding' ? '🎨 CUSTOM BRAND' : '⚡ STANDARD'}
            </Badge>
          </div>

          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-slate-300" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="bg-slate-50 border-t border-slate-100">
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* BRANDING SECTION */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <Brush className="w-3 h-3" /> Identity & Branding
              </label>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 space-y-4">
                <DetailItem label="Branding Tier" value={order.branding} />
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Production Notes</span>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {order.branding_instructions || "No custom instructions provided."}
                  </p>
                </div>
                <AssetButton label="Company Logo" url={order.branding_file} />
              </div>
            </div>

            {/* PRODUCTION SECTION */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <Mic className="w-3 h-3" /> Audio Production
              </label>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Voiceover" value={order.voiceover} />
                  <DetailItem label="Music" value={order.music_selection} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Voiceover Script</span>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
                    {order.voiceover_script || "AI Generated Script."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <AssetButton label="Music" url={order.music_file} />
                  <AssetButton label="Script" url={order.script_file} />
                </div>
              </div>
            </div>

            {/* LOGISTICS SECTION */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Logistics & Delivery
              </label>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 space-y-6">
                <div className="space-y-2">
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                     <Mail className="w-3 h-3 text-slate-300" /> {order.customer_email}
                   </div>
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                     <Phone className="w-3 h-3 text-slate-300" /> {order.customer_phone || "No Phone"}
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Final Video Link</span>
                  <div className="flex gap-2">
                    <Input 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      placeholder="https://..." 
                      className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl" 
                    />
                    <Button onClick={saveLink} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 rounded-xl">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-11">
                    <a href={order.photos_url} target="_blank"><ExternalLink className="w-3 h-3 mr-2" /> FOLDER</a>
                  </Button>
                  <Button onClick={toggleStatus} className={`rounded-xl font-bold text-xs h-11 ${order.status === 'Delivered' ? 'bg-slate-200 text-slate-600' : 'bg-black text-white hover:bg-slate-800'}`}>
                    {order.status === 'Delivered' ? 'RE-OPEN' : 'FINISH'}
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

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
      <p className="text-sm font-black text-slate-900 truncate">{renderSafe(value)}</p>
    </div>
  )
}

function AssetButton({ label, url }: { label: string, url: string }) {
  if (!url || url === "none") return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group">
      <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600">{label}</span>
      <Download className="w-3 h-3 text-slate-300 group-hover:text-indigo-600" />
    </a>
  )
}
