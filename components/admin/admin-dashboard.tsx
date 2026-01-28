"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ChevronDown, ChevronUp, ExternalLink, Loader2, 
  Copy, Music, Mic, Brush, Image as ImageIcon, ArrowLeft, 
  Download, CheckCircle2, Phone, User, DollarSign
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

  return (
    <div className="min-h-screen bg-zinc-100 p-4 font-sans text-zinc-900">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full px-4 border-zinc-200 text-zinc-500 hover:text-black">
                <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Site
              </Button>
            </Link>
            <h1 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
              <div className="bg-black text-white p-1.5 rounded-lg"><LayoutGrid className="h-4 w-4" /></div>
              Command v6.0
            </h1>
          </div>
          <Input 
            placeholder="Search orders..." 
            className="max-w-xs h-10 bg-zinc-50 rounded-xl border-zinc-200 focus:ring-black"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-zinc-300" /></div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 px-2 flex justify-between">
                Active Queue <span>{filtered.filter(o => o.status !== 'Delivered').length}</span>
              </h2>
              <div className="grid gap-2">
                {filtered.filter(o => o.status !== 'Delivered').map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </section>

            <section className="opacity-60">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 px-2 flex justify-between">
                Archive <span>{filtered.filter(o => o.status === 'Delivered').length}</span>
              </h2>
              <div className="grid gap-2">
                {filtered.filter(o => o.status === 'Delivered').map(o => <OrderCard key={o.id} order={o} />)}
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

  const toggleStatus = async () => {
    const newStatus = order.status === 'Delivered' ? 'New' : 'Delivered'
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    window.location.reload()
  }

  const saveLink = async () => {
    setIsSaving(true)
    await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id)
    toast.success("Saved")
    setIsSaving(false)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-zinc-200 rounded-xl overflow-hidden bg-white hover:border-zinc-300 transition-all shadow-sm">
        <CollapsibleTrigger className="w-full p-3 flex items-center gap-4 text-left">
          <div className="h-10 w-10 bg-zinc-100 rounded-lg flex-shrink-0 border border-zinc-200 overflow-hidden">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />
            ) : (
              <ImageIcon className="m-auto h-5 w-5 text-zinc-300 mt-2.5 ml-2.5"/>
            )}
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
            <div>
              <p className="font-bold text-sm uppercase truncate max-w-[150px]">{renderSafe(order.customer_name)}</p>
              <p className="text-[9px] text-zinc-400 font-medium">ID: {order.order_id?.slice(0, 8)}</p>
            </div>
            <div className="hidden md:block">
              <Badge variant="outline" className="text-[9px] font-bold border-zinc-200 px-2 py-0">
                {order.photo_count || 0} PHOTOS
              </Badge>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                <DollarSign className="w-3 h-3" /> {order.total_price || 0}
              </div>
            </div>
            <div className="flex justify-end pr-2">
              {order.branding === "Custom Branding" && (
                <Badge className="bg-purple-100 text-purple-700 text-[9px] font-black border-none">BRANDED</Badge>
              )}
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="bg-zinc-50/50 border-t border-zinc-100 p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* BRANDING CARD */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Brush className="w-3 h-3" /> Branding Details
              </h3>
              <div className="space-y-3">
                <DetailRow label="Level" value={order.branding} />
                <div className="pt-2">
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Instructions</p>
                  <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    {order.branding_instructions || "Standard unbranded delivery requested."}
                  </p>
                </div>
                <FileBtn label="Logo Asset" url={order.branding_file} />
              </div>
            </div>

            {/* AUDIO & CONTENT */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Mic className="w-3 h-3" /> Script & Voice
              </h3>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <DetailRow label="Voice" value={order.voiceover} />
                  <DetailRow label="Music" value={order.music_selection} />
                </div>
                <div className="pt-2">
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">VO Script</p>
                  <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    {order.voiceover_script || "AI generation based on property assets."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FileBtn label="Audio" url={order.music_file} />
                  <FileBtn label="Script" url={order.script_file} />
                </div>
              </div>
            </div>

            {/* LOGISTICS & DELIVERY */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Logistics
              </h3>
              <div className="space-y-3">
                <DetailRow label="Client Email" value={order.customer_email} />
                <DetailRow label="Contact" value={order.customer_phone} />
                
                <div className="pt-4 border-t border-zinc-100">
                  <p className="text-[8px] font-black text-zinc-400 uppercase mb-2">Delivery URL</p>
                  <div className="flex gap-2">
                    <Input 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      className="h-8 text-xs bg-zinc-50" 
                      placeholder="Paste final link..."
                    />
                    <Button size="sm" onClick={saveLink} className="h-8 bg-black text-white px-3 font-bold text-[10px]">
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "SAVE"}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" asChild variant="outline" className="flex-1 h-8 text-[10px] font-bold border-zinc-200">
                    <a href={order.photos_url} target="_blank"><ExternalLink className="w-3 h-3 mr-2" /> FOLDER</a>
                  </Button>
                  <Button size="sm" onClick={toggleStatus} className={`flex-1 h-8 text-[10px] font-bold ${order.status === 'Delivered' ? 'bg-zinc-200 text-zinc-600' : 'bg-green-600 text-white'}`}>
                    {order.status === 'Delivered' ? 'ARCHIVED' : 'COMPLETE'}
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

function DetailRow({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">{label}</p>
      <p className="text-xs font-bold text-zinc-900 truncate">{renderSafe(value)}</p>
    </div>
  )
}

function FileBtn({ label, url }: { label: string, url: string }) {
  if (!url || url === "none") return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
      <span className="text-[9px] font-black text-zinc-500 uppercase">{label}</span>
      <Download className="w-3 h-3 text-zinc-400" />
    </a>
  )
}
