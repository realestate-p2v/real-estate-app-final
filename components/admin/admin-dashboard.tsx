"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LayoutGrid, ChevronDown, ChevronUp, ExternalLink, Save, Loader2, Copy, FileText, Music, Mic, Phone, Brush, Image as ImageIcon } from "lucide-react"
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
  if (typeof val === 'object') return val.label || val.type || val.url || JSON.stringify(val);
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
    <div className="min-h-screen bg-zinc-50 p-2 md:p-6 font-sans">
      <div className="max-w-[1700px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Command v5.5</h1>
          </div>
          <Input 
            placeholder="Search by name..." 
            className="max-w-xs h-10 bg-white rounded-lg shadow-sm border-zinc-200"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-zinc-400" /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Column title="Live Queue" glowColor="rgba(239, 68, 68, 0.3)" orders={filtered.filter(o => o.status !== 'Delivered')} refresh={() => window.location.reload()} />
            <Column title="Archive" glowColor="rgba(34, 197, 94, 0.2)" orders={filtered.filter(o => o.status === 'Delivered')} refresh={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  )
}

function Column({ title, orders, glowColor, refresh }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-200 pb-2 flex justify-between px-1">
        {title} <span>{orders.length}</span>
      </h2>
      {orders.map((o: any) => (
        <div key={o.id} style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}>
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

  const copyAllImages = (e: any) => {
    e.stopPropagation()
    const urls = order.photos?.map((p: any) => p.secure_url).filter(Boolean).join('\n')
    if (!urls) return toast.error("No images found")
    navigator.clipboard.writeText(urls)
    toast.success(`${order.photos.length} Cloudinary links copied!`)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none rounded-xl overflow-hidden bg-white shadow-sm">
        <CollapsibleTrigger className="w-full p-3 flex items-center gap-4 text-left hover:bg-zinc-50 transition-colors">
          <div className="h-14 w-14 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-200">
            {order.photos?.[0]?.secure_url ? <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" /> : <ImageIcon className="m-auto h-full w-4 text-zinc-300"/>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black uppercase text-base text-zinc-900 leading-tight">{renderSafe(order.customer_name)}</p>
            <div className="flex gap-2 mt-1">
              <Badge className="bg-zinc-800 text-[9px] h-4 px-1.5">{order.photo_count || 0} Assets</Badge>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-zinc-200">${order.total_price}</Badge>
            </div>
          </div>
          <Button onClick={copyAllImages} variant="outline" className="h-8 text-[10px] font-bold gap-1 bg-white border-zinc-200 hover:bg-blue-50 hover:text-blue-600">
            <Copy className="h-3 w-3" /> COPY IMAGES
          </Button>
          {isOpen ? <ChevronUp className="h-5 w-5 text-zinc-300" /> : <ChevronDown className="h-5 w-5 text-zinc-300" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="p-4 bg-white border-t border-zinc-50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DataBox icon={<Mic className="w-3.5 h-3.5" />} label="Voiceover" val={order.voiceover} />
            <DataBox icon={<Brush className="w-3.5 h-3.5" />} label="Branding" val={order.branding} />
            <DataBox icon={<Music className="w-3.5 h-3.5" />} label="Music" val={order.music_selection} />
            <DataBox icon={<Phone className="w-3.5 h-3.5" />} label="Phone" val={order.customer_phone} />
            <DataBox icon={<FileText className="w-3.5 h-3.5" />} label="ID" val={order.order_id} />
            <DataBox icon={<ExternalLink className="w-3.5 h-3.5" />} label="Cloudinary Folder" val={order.photos_url} isLink />
          </div>

          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
             <p className="text-[8px] font-black uppercase text-zinc-400 mb-1 tracking-widest">Branding Instructions</p>
             <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap leading-snug">
                {order.branding_instructions || "No custom instructions provided."}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FileBox label="Branding File" url={order.branding_file} />
            <FileBox label="Music File" url={order.music_file} />
          </div>

          <div className="p-4 bg-zinc-900 rounded-xl text-white">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Delivery Link</p>
                <Input 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="Paste URL..." 
                  className="h-9 text-sm bg-zinc-800 border-none text-white rounded-md"
                />
              </div>
              <Button size="sm" onClick={async () => {
                setIsSaving(true);
                await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id);
                toast.success("Saved");
                setIsSaving(false);
              }} className="h-9 bg-white text-black font-bold hover:bg-zinc-200">
                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : "SAVE"}
              </Button>
            </div>
            
            <Button className={`w-full h-10 mt-3 font-black text-xs rounded-md transition-all ${
              order.status === 'Delivered' ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600 hover:bg-green-500'
            }`} onClick={async () => {
                const status = order.status === 'Delivered' ? 'New' : 'Delivered'
                await supabase.from("orders").update({ status }).eq("id", order.id)
                refresh()
            }}>
              {order.status === 'Delivered' ? 'BACK TO QUEUE' : 'COMPLETE & SHIP'}
            </Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function DataBox({ label, val, icon, isLink }: any) {
  return (
    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 flex items-start gap-3">
      <div className="mt-0.5 text-zinc-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{label}</p>
        {isLink ? (
          <a href={renderSafe(val)} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline break-all block leading-tight">Open Link</a>
        ) : (
          <p className="text-sm font-bold text-zinc-900 break-words leading-tight">{renderSafe(val)}</p>
        )}
      </div>
    </div>
  )
}

function FileBox({ label, url }: any) {
  if (!url) return (
    <div className="p-3 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center opacity-40">
      <p className="text-[9px] font-black text-zinc-400 uppercase">{label}: None</p>
    </div>
  )
  return (
    <a href={url} target="_blank" rel="noreferrer" className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center justify-between hover:border-zinc-900 transition-all group">
      <div>
        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-zinc-900">Download File</p>
      </div>
      <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900" />
    </a>
  )
}
