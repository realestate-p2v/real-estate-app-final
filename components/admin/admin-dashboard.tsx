"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Loader2, 
  Copy, 
  Music, 
  Mic, 
  Brush, 
  ImageIcon, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Clock 
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
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-black bg-white shadow-sm rounded-lg">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Site
              </Button>
            </Link>
            <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <span className="bg-black text-white p-1 rounded-md"><LayoutGrid className="h-5 w-5" /></span>
              Command v6.1
            </h1>
          </div>
          <div className="relative w-full md:w-72">
            <Input 
              placeholder="Search orders..." 
              className="h-10 bg-white rounded-xl border-zinc-200 shadow-sm pl-4"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-zinc-300" /></div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-2 flex justify-between">
                Live Queue <span>{activeOrders.length}</span>
              </h2>
              <div className="space-y-2">
                {activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </section>

            <section className="opacity-50 hover:opacity-100 transition-opacity">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-2">Archive</h2>
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
    toast.success("Saved")
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
      <Card className="border-none rounded-xl overflow-hidden bg-white shadow-sm border border-zinc-200/50">
        <CollapsibleTrigger className="w-full p-4 flex items-center gap-4 text-left">
          <div className="h-10 w-10 bg-zinc-50 rounded-lg flex-shrink-0 border border-zinc-100 overflow-hidden flex items-center justify-center">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />
            ) : (
              <ImageIcon className="h-4 w-4 text-zinc-300"/>
            )}
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <p className="font-bold text-sm uppercase truncate">{renderSafe(order.customer_name)}</p>
            <p className="hidden md:block text-[11px] font-bold text-zinc-500 uppercase">{order.branding === 'Custom Branding' ? '🎨 Custom' : 'Standard'}</p>
            <p className="hidden md:block text-[11px] font-bold text-zinc-500 uppercase">{order.photo_count || 0} Assets</p>
            <div className="flex justify-end pr-2">
               <Button onClick={toggleStatus} size="sm" variant="outline" className="h-7 text-[9px] font-black rounded-full">
                 {order.status === 'Delivered' ? 'RE-OPEN' : 'COMPLETE'}
               </Button>
            </div>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4 rotate-180 transition-transform" /> : <ChevronDown className="h-4 w-4 transition-transform" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="bg-[#fafafa] border-t border-zinc-100 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* BRANDING */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Brush className="w-3 h-3" /> Branding
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200/60 space-y-3">
                <DataField label="Package" val={order.branding} />
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Instructions</p>
                  <p className="text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {order.branding_instructions || "No custom branding instructions."}
                  </p>
                </div>
                <FileRow label="Logo Asset" url={order.branding_file} />
              </div>
            </div>

            {/* AUDIO */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Mic className="w-3 h-3" /> Audio
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200/60 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                   <DataField label="Voiceover" val={order.voiceover} />
                   <DataField label="Music" val={order.music_selection} />
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Script Content</p>
                  <p className="text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {order.voiceover_script || "AI Generated Script."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <FileRow label="Music File" url={order.music_file} />
                   <FileRow label="Script File" url={order.script_file} />
                </div>
              </div>
            </div>

            {/* DELIVERY */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Delivery
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200/60 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold flex items-center gap-2"><Mail className="w-3 h-3"/> {order.customer_email}</p>
                  <p className="text-[10px] font-bold flex items-center gap-2"><Phone className="w-3 h-3"/> {order.customer_phone}</p>
                </div>
                <div className="pt-2">
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-2">Final URL</p>
                  <div className="flex gap-2">
                    <Input value={link} onChange={(e) => setLink(e.target.value)} className="h-8 text-xs" />
                    <Button onClick={saveLink} size="sm" className="h-8 bg-black text-white px-4 font-bold">
                      {isSaving ? <Loader2 className="animate-spin w-3 h-3" /> : "SAVE"}
                    </Button>
                  </div>
                </div>
                <Button asChild className="w-full bg-blue-600 text-white font-black text-[10px] h-9">
                   <a href={order.photos_url} target="_blank"><ExternalLink className="w-3 h-3 mr-2" /> CLOUDINARY</a>
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
      <p className="text-[8px] font-black text-zinc-400 uppercase mb-0.5">{label}</p>
      <p className="text-xs font-black text-zinc-900 leading-tight">{renderSafe(val)}</p>
    </div>
  )
}

function FileRow({ label, url }: { label: string, url: string }) {
  if (!url || url === "none") return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-100 rounded-lg group hover:border-black transition-all">
       <span className="text-[9px] font-black text-zinc-500 uppercase">{label}</span>
       <Download className="w-3 h-3 text-zinc-300 group-hover:text-black" />
    </a>
  )
}
