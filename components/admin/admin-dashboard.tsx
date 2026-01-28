"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutGrid, ExternalLink, Loader2, Copy, Music, Mic, Brush, 
  Image as ImageIcon, ArrowLeft, Download, CheckCircle2, 
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
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* GLOBAL HUD */}
      <header className="sticky top-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg h-9">
                <ArrowLeft className="h-4 w-4 mr-2" /> EXIT
              </Button>
            </Link>
            <div className="h-10 w-[1px] bg-zinc-800 hidden md:block" />
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase flex items-center gap-2">
                <span className="text-blue-500"><LayoutGrid className="w-5 h-5" /></span>
                COMMAND <span className="text-zinc-500 font-light">v7.0</span>
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Production Interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Input 
                placeholder="Search Active Queue..." 
                className="h-10 bg-zinc-900 border-zinc-800 rounded-xl pl-4 text-sm focus:ring-blue-500"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Badge className="bg-blue-600 text-white h-10 px-4 rounded-xl font-black text-sm uppercase">
              {activeOrders.length} LIVE
            </Badge>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1800px] mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-40 gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Syncing Production Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {activeOrders.map(o => <ProductionSlate key={o.id} order={o} />)}
            
            {activeOrders.length === 0 && (
              <div className="text-center py-40 border-2 border-dashed border-zinc-900 rounded-3xl">
                <p className="text-zinc-600 font-black uppercase tracking-widest">No Active Production Orders</p>
              </div>
            )}
          </div>
        )}
      </main>
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
    toast.success("Link Updated")
    setIsSaving(false)
  }

  const markDelivered = async () => {
    const { error } = await supabase.from("orders").update({ status: 'Delivered' }).eq("id", order.id)
    if (!error) {
      toast.success("Order Shipped to Client")
      window.location.reload()
    }
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden rounded-3xl shadow-2xl">
      {/* SLATE HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center group">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} className="object-cover h-full w-full group-hover:scale-110 transition-transform" alt="" />
            ) : (
              <ImageIcon className="h-6 w-6 text-zinc-700"/>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{renderSafe(order.customer_name)}</h2>
               <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 font-mono text-[10px]">ID: {order.order_id}</Badge>
            </div>
            <div className="flex gap-4 items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
               <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {new Date(order.created_at).toLocaleDateString()}</span>
               <span className="flex items-center gap-1.5"><Globe className="w-3 h-3"/> IP: {order.ip_address || "SECURE"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <Button asChild variant="outline" className="flex-1 lg:flex-none h-12 bg-white text-black border-none hover:bg-zinc-200 font-black uppercase text-xs rounded-xl px-8">
            <a href={order.photos_url} target="_blank">
              <ImageIcon className="w-4 h-4 mr-2" /> SOURCE ASSETS ({order.photo_count})
            </a>
          </Button>
          <Button onClick={markDelivered} className="flex-1 lg:flex-none h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl px-8 shadow-lg shadow-blue-900/20">
             <CheckCircle2 className="w-4 h-4 mr-2" /> SHIP TO CLIENT
          </Button>
        </div>
      </div>

      {/* SLATE BODY: ALL DATA VISIBLE */}
      <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* BRANDING HUB */}
        <div className="space-y-6">
          <SectionHeader icon={<Brush className="w-4 h-4 text-purple-500"/>} title="Identity & Branding" />
          <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800/50 space-y-5">
            <DataPoint label="Production Level" value={order.branding} highlight />
            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" /> Special Instructions
              </p>
              <div className="text-sm font-medium leading-relaxed text-zinc-300 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 whitespace-pre-wrap">
                {order.branding_instructions || "No custom instructions provided."}
              </div>
            </div>
            <FileLink label="Company Logo / Graphics" url={order.branding_file} color="purple" />
          </div>
        </div>

        {/* AUDIO HUD */}
        <div className="space-y-6">
          <SectionHeader icon={<Mic className="w-4 h-4 text-blue-500"/>} title="Audio Production" />
          <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800/50 space-y-5">
            <div className="grid grid-cols-2 gap-4">
               <DataPoint label="Voice Profile" value={order.voiceover} />
               <DataPoint label="Music Track" value={order.music_selection} />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" /> Voiceover Script
              </p>
              <div className="text-sm font-medium leading-relaxed text-zinc-300 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 whitespace-pre-wrap min-h-[100px]">
                {order.voiceover_script || "Refer to property photos for automated AI script generation."}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FileLink label="Music Upload" url={order.music_file} color="blue" />
              <FileLink label="Script Upload" url={order.script_file} color="blue" />
            </div>
          </div>
        </div>

        {/* DELIVERY HUB */}
        <div className="space-y-6">
          <SectionHeader icon={<Globe className="w-4 h-4 text-green-500"/>} title="Client & Delivery" />
          <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800/50 space-y-6">
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Email</span>
                  <span className="text-xs font-bold text-white">{order.customer_email}</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-100/5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Phone</span>
                  <span className="text-xs font-bold text-white">{order.customer_phone || "Not Provided"}</span>
               </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Final Video Destination URL</p>
              <div className="flex gap-2">
                <Input 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="Paste Vimeo/Drive/YouTube Link..." 
                  className="h-12 bg-zinc-900 border-zinc-700 text-white rounded-xl"
                />
                <Button onClick={saveLink} className="h-12 bg-white text-black hover:bg-zinc-200 font-black px-6 rounded-xl">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE"}
                </Button>
              </div>
              <p className="text-[9px] text-zinc-600 mt-3 font-bold uppercase italic">Updating this will send an email update if configured.</p>
            </div>
          </div>
        </div>

      </div>
    </Card>
  )
}

function SectionHeader({ icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex items-center gap-3 px-2">
      {icon}
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{title}</h3>
    </div>
  )
}

function DataPoint({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-sm font-black uppercase ${highlight ? 'text-blue-400' : 'text-white'}`}>{renderSafe(value)}</p>
    </div>
  )
}

function FileLink({ label, url, color }: { label: string, url: string, color: string }) {
  if (!url || url === "none") return null;
  const colorMap: any = {
    purple: "border-purple-500/20 hover:border-purple-500 bg-purple-500/5 text-purple-400",
    blue: "border-blue-500/20 hover:border-blue-500 bg-blue-500/5 text-blue-400",
    green: "border-green-500/20 hover:border-green-500 bg-green-500/5 text-green-400"
  };
  
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${colorMap[color]}`}>
       <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Asset</span>
          <span className="text-[11px] font-black uppercase leading-none">{label}</span>
       </div>
       <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
    </a>
  )
}
       <Download className="w-3 h-3 text-zinc-300 group-hover:text-black" />
    </a>
  )
}
