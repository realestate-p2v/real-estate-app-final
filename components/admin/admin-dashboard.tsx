"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, Mail, Music, User, Phone,
  ImageIcon, ExternalLink, ChevronDown, 
  ChevronUp, LayoutGrid, CheckCircle2,
  Copy, Link2, AlertCircle, Globe, Mic, Brush, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const supabase = createClient()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (err: any) {
      toast.error("Fetch failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied link")
  }

  const copyAllUrls = (photos: any[]) => {
    if (!photos || photos.length === 0) return
    const urlString = photos.map(p => p.secure_url).join(", ")
    copyToClipboard(urlString)
    toast.success("All URLs copied")
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id)
    if (error) toast.error("Update failed")
    else {
      toast.success(`Moved to ${status}`)
      fetchOrders()
    }
  }

  const filteredOrders = orders.filter((o) => {
    const search = searchQuery.toLowerCase()
    return (
      o.customer_name?.toLowerCase().includes(search) || 
      o.customer_email?.toLowerCase().includes(search) || 
      o.order_id?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 lg:p-6 font-['Poppins']">
      <div className="max-w-[1800px] mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Command v4.0</h1>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search..." 
              className="pl-10 h-10 bg-white border-zinc-200 text-sm rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SectionHeader label="Live Queue" color="text-red-600" border="border-red-500" icon={<AlertCircle className="h-4 w-4"/>} count={filteredOrders.filter(o => o.status !== "Delivered").length} />
            {renderOrderList(filteredOrders.filter(o => o.status !== "Delivered"), "red")}
          </div>
          <div className="space-y-4">
            <SectionHeader label="Archive" color="text-green-600" border="border-green-500" icon={<CheckCircle2 className="h-4 w-4"/>} count={filteredOrders.filter(o => o.status === "Delivered").length} />
            {renderOrderList(filteredOrders.filter(o => o.status === "Delivered"), "green")}
          </div>
        </div>
      </div>
    </div>
  )

  function SectionHeader({ label, color, border, icon, count }: any) {
    return (
      <div className={`flex items-center justify-between border-b-2 ${border} pb-2 mb-2`}>
        <div className={`flex items-center gap-2 ${color} font-bold uppercase text-xs tracking-widest`}>
          {icon} {label}
        </div>
        <Badge variant="outline" className="text-[10px] h-5">{count} Orders</Badge>
      </div>
    )
  }

  function renderOrderList(list: any[], theme: "red" | "green") {
    return list.map((order) => (
      <Collapsible key={order.id} open={expandedOrder === order.id} onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
        <Card className={`overflow-hidden border-0 border-l-4 shadow-sm transition-all ${
          theme === "red" ? "border-l-red-500 bg-red-50/10" : "border-l-green-500 bg-green-50/10"
        }`}>
          <CollapsibleTrigger asChild>
            <CardContent className="p-3 cursor-pointer flex items-center gap-4 hover:bg-white transition-colors">
              <img src={order.photos?.[0]?.secure_url} className="h-10 w-10 rounded-lg object-cover shadow-sm grayscale-[0.5]" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-zinc-900 truncate uppercase leading-tight">{order.customer_name}</p>
                <p className="text-[10px] text-zinc-500 font-medium truncate">{order.customer_email}</p>
              </div>
              <div className="text-right flex items-center gap-4">
                <p className="text-lg font-black text-zinc-900 leading-none">${order.total_price}</p>
                {expandedOrder === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent className="p-5 border-t border-zinc-100 bg-white space-y-5">
            {/* COMPACT CLOUDINARY HUB */}
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200">
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                  <Globe className="h-3 w-3" /> Asset URLs ({order.photo_count})
                </p>
                <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold uppercase bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => copyAllUrls(order.photos || [])}>
                  <Copy className="h-3 w-3 mr-1" /> Copy All
                </Button>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-zinc-100">
                {order.photos?.map((photo: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-2 group">
                    <span className="text-[9px] font-mono text-zinc-400 truncate flex-1">{photo.secure_url}</span>
                    <button onClick={() => copyToClipboard(photo.secure_url)} className="text-[9px] font-bold text-blue-600 hover:underline">Copy</button>
                  </div>
                ))}
              </div>
            </div>

            {/* THE FOUR-COLUMN SPEC GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SpecBox label="Voiceover" icon={<Mic className="h-3 w-3"/>} value={order.voiceover || "Not Selected"} color="text-purple-600" />
              <SpecBox label="Branding" icon={<Brush className="h-3 w-3"/>} value={order.branding_info || "None"} color="text-pink-600" />
              <SpecBox label="Music" icon={<Music className="h-3 w-3"/>} value={order.music_selection || "Standard"} color="text-blue-600" />
              <SpecBox label="Order ID" icon={<Hash className="h-3 w-3"/>} value={order.order_id?.slice(-8)} color="text-zinc-600" />
              <SpecBox label="Phone" icon={<Phone className="h-3 w-3"/>} value={order.customer_phone || "N/A"} color="text-zinc-600" />
              <SpecBox label="Payment" icon={<Info className="h-3 w-3"/>} value={order.payment_status} color={order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'} />
            </div>

            {/* ACTION ROW */}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-9 bg-zinc-100 text-zinc-900 font-bold rounded-lg text-xs" asChild>
                <a href={order.photos_url} target="_blank"><ExternalLink className="h-3 w-3 mr-2" /> Folder</a>
              </Button>
              {theme === "red" ? (
                <Button onClick={() => handleStatusUpdate(order.id, "Delivered")} size="sm" className="flex-1 h-9 bg-green-600 text-white font-black rounded-lg text-xs">COMPLETE & SHIP</Button>
              ) : (
                <Button onClick={() => handleStatusUpdate(order.id, "New")} variant="outline" size="sm" className="flex-1 h-9 rounded-lg font-bold text-zinc-400 text-xs border-dashed">RE-OPEN</Button>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    ))
  }

  function SpecBox({ label, value, icon, color }: any) {
    return (
      <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100 min-w-0">
        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1 mb-1">
          {icon} {label}
        </p>
        <p className={`text-[10px] font-bold truncate ${color}`}>{value}</p>
      </div>
    )
  }
}
