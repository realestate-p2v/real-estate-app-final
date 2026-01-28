"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ExternalLink, Loader2, Copy, Music, Mic, Brush, 
  ImageIcon, ArrowLeft, Download, CheckCircle2, 
  Phone, Mail, Clock, Calendar, User, FileText, Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="border-zinc-700 bg-transparent text-zinc-400">
                <ArrowLeft className="h-4 w-4 mr-2" /> EXIT
              </Button>
            </Link>
            <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-500" /> COMMAND v7.1
            </h1>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Input 
              placeholder="Filter Production Queue..." 
              className="bg-zinc-800 border-zinc-700 text-white rounded-xl h-11"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Badge className="bg-blue-600 text-white px-4 rounded-xl">{activeOrders.length} ACTIVE</Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
          ) : (
            activeOrders.map(o => <ProductionSlate key={o.id} order={o} />)
          )}
        </div>
      </div>
    </div>
  )
}

function ProductionSlate({ order }: { order: any }) {
  const [link, setLink] = useState(order.delivery_url || "")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const saveLink = async () => {
    setIsSaving(true)
    await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id)
    toast.success("Link Saved")
    setIsSaving(false)
  }

  const markDelivered = async () => {
    await supabase.from("orders").update({ status: 'Delivered' }).eq("id", order.id)
    window.location.reload()
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden rounded-3xl">
      <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-black rounded-xl overflow-hidden border border-zinc-800">
            {order.photos?.[0]?.secure_url && <img src={order.photos[0].secure_url} className="object-cover h-full w-full" />}
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white">{renderSafe(order.customer_name)}</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{order.order_id}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button asChild variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white flex-1 md:flex-none">
            <a href={order.photos_url} target="_blank"><ExternalLink className="w-4 h-4 mr-2" /> ASSETS</a>
          </Button>
          <Button onClick={markDelivered} className="bg-blue-600 hover:bg-blue-500 text-white flex-1 md:flex-none">COMPLETE</Button>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Brush className="w-3 h-3"/> Branding</h3>
          <div className="bg-black/30 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <DataPoint label="Level" val={order.branding} />
            <div className="space-y-1">
              <p className="text-[8px] font-black text-zinc-500 uppercase">Instructions</p>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">{order.branding_instructions || "No instructions"}</p>
            </div>
            <FileRow label="Logo Asset" url={order.branding_file} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Mic className="w-3 h-3"/> Production</h3>
          <div className="bg-black/30 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DataPoint label="Voice" val={order.voiceover} />
              <DataPoint label="Music" val={order.music_selection} />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-zinc-500 uppercase">Script</p>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">{order.voiceover_script || "AI Generation"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FileRow label="Music" url={order.music_file} />
              <FileRow label="Script" url={order.script_file} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Globe className="w-3 h-3"/> Delivery</h3>
          <div className="bg-black/30 p-5 rounded-2xl border border-zinc-800 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-white flex items-center gap-2"><Mail className="w-3 h-3 text-zinc-500"/> {order.customer_email}</p>
              <p className="text-[10px] font-bold text-white flex items-center gap-2"><Phone className="w-3 h-3 text-zinc-500"/> {order.customer_phone}</p>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-[8px] font-black text-zinc-500 uppercase mb-2">Delivery URL</p>
              <div className="flex gap-2">
                <Input value={link} onChange={(e) => setLink(e.target.value)} className="bg-zinc-800 border-zinc-700 h-9 text-xs" />
                <Button onClick={saveLink} size="sm" className="bg-white text-black font-bold px-4 h-9">
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "SAVE"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function DataPoint({ label, val }: { label: string, val: string }) {
  return (
    <div>
      <p className="text-[8px] font-black text-zinc-500 uppercase mb-0.5">{label}</p>
      <p className="text-sm font-black text-white">{renderSafe(val)}</p>
    </div>
  )
}

function FileRow({ label, url }: { label: string, url: string }) {
  if (!url || url === "none") return null
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:border-blue-500 transition-all group">
      <span className="text-[9px] font-black text-zinc-400 uppercase">{label}</span>
      <Download className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-500" />
    </a>
  )
}
