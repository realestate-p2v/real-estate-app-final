"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ChevronUp, ExternalLink, Loader2, 
  Copy, Music, Mic, Brush, Image as ImageIcon, ArrowLeft, 
  Download, CheckCircle2, Phone, Mail, DollarSign, Clock
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

  const activeOrders = filtered.filter(o => o.status !== 'Delivered')
  const archivedOrders = filtered.filter(o => o.status === 'Delivered')

  return (
    <div className="min-h-screen bg-[#f4f4f5] p-4 md:p-8 font-sans text-zinc-900">
      <div className="max-w-6xl mx-auto">
        {/* COMPACT HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-black hover:bg-white shadow-sm rounded-lg">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Site
              </Button>
            </Link>
            <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <span className="bg-black text-white p-1 rounded-md"><LayoutGrid className="h-5 w-5" /></span>
              Command v6.0
            </h1>
          </div>
          <div className="relative w-full md:w-72">
            <Input 
              placeholder="Filter by name or ID..." 
              className="h-10 bg-white rounded-xl border-zinc-200 shadow-sm pl-4 focus:ring-2 focus:ring-black"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-zinc-300" /></div>
        ) : (
          <div className="space-y-12">
            {/* ACTIVE QUEUE */}
            <section>
              <div className="flex items-center justify-between px-2 mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Live Production Queue
                </h2>
                <Badge className="bg-black text-white rounded-full px-3">{activeOrders.length}</Badge>
              </div>
              <div className="space-y-2">
                {activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </section>

            {/* ARCHIVE */}
            <section className="opacity-50 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between px-2 mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Archive</h2>
                <Badge variant="outline" className="rounded-full px-3">{archivedOrders.length}</Badge>
              </div>
              <div className="space-y-2">
                {archivedOrders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </section>
          </div>
        )}
      </div>
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
    toast.success("Delivery Link Saved")
    setIsSaving(false)
  }

  const toggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = order.status === 'Delivered' ? 'New' : 'Delivered'
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    window.location.reload()
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all border border-zinc-200/50">
        <CollapsibleTrigger className="w-full p-4 flex items-center gap-4 text-left">
          <div className="h-12 w-12 bg-zinc-50 rounded-lg flex-shrink-0 border border-zinc-100 overflow-hidden flex items-center justify-center">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />
            ) : (
              <ImageIcon className="h-5 w-5 text-zinc-300"/>
            )}
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <div>
              <p className="font-bold text-sm uppercase leading-tight truncate">{renderSafe(order.customer_name)}</p>
              <p className="text-[10px] text-zinc-400 font-mono tracking-tighter">ID: {order.order_id?.slice(0, 8)}</p>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-[8px] font-black text-zinc-400 uppercase">Branding</span>
              <p className="text-[11px] font-bold">{order.branding === 'Custom Branding' ? '🎨 CUSTOM' : '⚡ STANDARD'}</p>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-[8px] font-black text-zinc-400 uppercase">Assets</span>
              <p className="text-[11px] font-bold uppercase">{order.photo_count || 0} Photos</p>
            </div>
            <div className="flex justify-end gap-2 pr-2">
               <Button onClick={toggleStatus} size="sm" variant="outline" className={`h-7 text-[9px] font-black tracking-widest px-3 rounded-full ${order.status === 'Delivered' ? 'text-zinc-400' : 'text-green-600 border-green-100 bg-green-50'}`}>
                 {order.status === 'Delivered' ? 'RE-OPEN' : 'COMPLETE'}
               </Button>
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-300" /> : <ChevronDown className="h-4 w-4 text-zinc-300" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="bg-[#fafafa] border-t border-zinc-100 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* COLUMN 1: BRANDING (CLEAN & VISIBLE) */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Brush className="w-3.5 h-3.5" /> Branding Details
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200/60 space-y-3">
                <DataField label="Branding Level" val={order.branding} />
                <div>
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Production Instructions</p>
                  <p className="text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    {order.branding_instructions || "Standard unbranded delivery requested by client."}
                  </p>
                </div>
                <FileRow label="Logo Asset" url={order.branding_file} />
              </div>
            </div>

            {/* COLUMN 2: AUDIO & CONTENT */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Mic className="w-3.5 h-3.5" /> Audio & Script
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200/60 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                   <DataField label="Voiceover" val={order.voiceover} />
                   <DataField label="Music" val={order.music_selection} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Voiceover Script</p>
                  <p className="text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    {order.voiceover_script || "Refer to property photos for AI script generation."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <FileRow label="Custom Music" url={order.music_file} />
                   <FileRow label="Script File" url={order.script_file} />
                </div>
              </div>
            </div>

            {/* COLUMN 3: CONTACT & SHIPMENT */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Customer & Delivery
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200/60 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                    <Mail className="w-3 h-3 text-zinc-400" /> {order.customer_email}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                    <Phone className="w-3 h-3 text-zinc-400" /> {order.customer_phone}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase">Final Delivery URL</p>
                  <div className="flex gap-2">
                    <Input 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      placeholder="https://vimeo.com/..." 
                      className="h-9 text-xs bg-zinc-50 border-zinc-200"
                    />
                    <Button onClick={saveLink} size="sm" className="h-9 bg-black text-white px-4 font-bold">
                      {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : "SAVE"}
                    </Button>
                  </div>
                </div>

                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest h-10 shadow-lg shadow-blue-200">
                   <a href={order.photos_url} target="_blank">
                     <ExternalLink className="w-3 h-3 mr-2" /> OPEN CLOUDINARY FOLDER
                   </a>
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function DataField({ label, val }: { label: string, val: string }) {
  return (
    <div>
      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5">{label}</p>
      <p className="text-[13px] font-black text-zinc-900 leading-tight">{renderSafe(val)}</p>
    </div>
  )
}

function FileRow({ label, url }: { label: string, url: string }) {
  if (!url || url === "none") return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-100 rounded-lg group hover:border-black transition-all">
       <span className="text-[9px] font-black text-zinc-500 uppercase">{label}</span>
       <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black" />
    </a>
  )
}
