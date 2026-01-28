"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LayoutGrid, ChevronDown, ChevronUp, ImageIcon, ExternalLink, Save, Loader2, Copy, FileText, Music, Mic, Phone, Brush } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const renderSafe = (val: any): string => {
  if (val === null || val === undefined) return "None";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.type || val.label || val.url || JSON.stringify(val);
  return String(val);
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

  const filtered = orders.filter(o => renderSafe(o.customer_name).toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-black rounded-2xl flex items-center justify-center text-white shadow-2xl">
              <LayoutGrid className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Production Command</h1>
          </div>
          <Input 
            placeholder="Search by client name..." 
            className="max-w-md h-14 bg-white rounded-2xl shadow-sm text-lg px-6 border-none outline-none ring-0 focus-visible:ring-2 focus-visible:ring-blue-500"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-12 w-12 text-zinc-400" /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            <Column title="Live Queue" glowColor="rgba(239, 68, 68, 0.4)" orders={filtered.filter(o => o.status !== 'Delivered')} refresh={() => window.location.reload()} />
            <Column title="Completed Archive" glowColor="rgba(34, 197, 94, 0.3)" orders={filtered.filter(o => o.status === 'Delivered')} refresh={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  )
}

function Column({ title, orders, glowColor, refresh }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 border-b-2 border-zinc-200 pb-4 flex justify-between px-2">
        {title} <span className="bg-zinc-200 px-3 py-0.5 rounded-full text-zinc-700">{orders.length}</span>
      </h2>
      {orders.map((o: any) => (
        <div key={o.id} style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }} className="transition-all duration-500">
           <OrderCard order={o} refresh={refresh} />
        </div>
      ))}
    </div>
  )
}

function OrderCard({ order, refresh }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [link, setLink] = useState(renderSafe(order.delivery_url))
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const copyCloudinaryLinks = (e: any) => {
    e.stopPropagation()
    const urls = order.photos?.map((p: any) => p.secure_url).join('\n')
    if (!urls) return toast.error("No photos found")
    navigator.clipboard.writeText(urls)
    toast.success("Links Copied to Clipboard")
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 bg-white">
        <CollapsibleTrigger className="w-full p-6 flex items-center gap-6 text-left hover:bg-zinc-50 transition-colors">
          <div className="h-20 w-20 bg-zinc-200 rounded-2xl overflow-hidden flex-shrink-0">
            {order.photos?.[0]?.secure_url && <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />}
          </div>
          <div className="flex-1">
            <p className="font-black uppercase text-xl md:text-2xl text-zinc-900 leading-tight mb-1">{renderSafe(order.customer_name)}</p>
            <div className="flex gap-2">
              <Badge className="bg-zinc-900 font-bold">{order.photo_count || 0} Assets</Badge>
              <Badge variant="outline" className="border-zinc-200 text-zinc-400 font-bold">${order.total_price}</Badge>
            </div>
          </div>
          <Button onClick={copyCloudinaryLinks} variant="ghost" className="hidden md:flex h-12 w-12 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-blue-600 hover:text-white transition-all">
            <Copy className="h-6 w-6" />
          </Button>
          {isOpen ? <ChevronUp className="h-8 w-8 text-zinc-300" /> : <ChevronDown className="h-8 w-8 text-zinc-300" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="p-8 bg-white border-t border-zinc-100 space-y-8">
          
          {/* INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <DataBox icon={<Mic className="w-5 h-5" />} label="Voiceover" val={order.voiceover} />
            <DataBox icon={<Brush className="w-5 h-5" />} label="Branding" val={order.branding} />
            <DataBox icon={<Music className="w-5 h-5" />} label="Music" val={order.music_selection} />
            <DataBox icon={<Phone className="w-5 h-5" />} label="Phone" val={order.customer_phone} />
            <DataBox icon={<FileText className="w-5 h-5" />} label="Order ID" val={order.order_id} />
            <DataBox icon={<ExternalLink className="w-5 h-5" />} label="Assets" val={order.photos_url} isLink />
          </div>

          {/* FILES & INSTRUCTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileBox label="Branding Asset" url={order.branding_file} />
            <FileBox label="Custom Music Track" url={order.music_file} />
          </div>

          <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200/50 shadow-inner">
             <p className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-[0.2em]">Creative Instructions</p>
             <p className="text-xl font-medium text-zinc-800 leading-relaxed italic">
                {order.branding_instructions || "No custom instructions provided."}
             </p>
          </div>

          {/* DELIVERY CONSOLE */}
          <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white space-y-6 shadow-2xl">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-4">Production Output</p>
              <div className="flex gap-4">
                <Input 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="Paste Google Drive / Video Link..." 
                  className="h-16 text-xl bg-zinc-800 border-none text-white rounded-2xl px-6 placeholder:text-zinc-600"
                />
                <Button size="lg" onClick={async () => {
                  setIsSaving(true);
                  await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id);
                  toast.success("Delivery Link Updated");
                  setIsSaving(false);
                }} className="h-16 px-10 bg-white text-black font-black hover:bg-zinc-200 rounded-2xl transition-transform active:scale-95">
                  {isSaving ? <Loader2 className="animate-spin" /> : "SAVE"}
                </Button>
              </div>
            </div>
            
            <Button className={`w-full h-16 font-black text-lg rounded-2xl transition-all ${
              order.status === 'Delivered' 
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' 
                : 'bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
            }`} onClick={async () => {
                const status = order.status === 'Delivered' ? 'New' : 'Delivered'
                await supabase.from("orders").update({ status }).eq("id", order.id)
                refresh()
            }}>
              {order.status === 'Delivered' ? 'SEND BACK TO ACTIVE QUEUE' : 'COMPLETE & SHIP ORDER'}
            </Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function DataBox({ label, val, icon, isLink }: any) {
  return (
    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-start gap-4">
      <div className="mt-1 text-zinc-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
        {isLink ? (
          <a href={renderSafe(val)} target="_blank" className="text-sm font-bold text-blue-600 hover:underline truncate block">Open Folder</a>
        ) : (
          <p className="text-xl font-black text-zinc-900 truncate leading-none">{renderSafe(val)}</p>
        )}
      </div>
    </div>
  )
}

function FileBox({ label, url }: any) {
  if (!url) return (
    <div className="p-6 border-2 border-dashed border-zinc-100 rounded-3xl flex items-center justify-center opacity-40">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}: Missing</p>
    </div>
  )
  return (
    <a href={url} target="_blank" className="p-6 bg-white border border-zinc-100 rounded-3xl flex items-center justify-between hover:border-zinc-900 transition-all group">
      <div>
        <p className="text-[10px] font-black text-zinc-400 uppercase mb-1 tracking-widest">{label}</p>
        <p className="text-base font-black text-zinc-900">Download File</p>
      </div>
      <div className="h-12 w-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        <ExternalLink className="h-5 w-5" />
      </div>
    </a>
  )
}
