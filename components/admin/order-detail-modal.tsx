"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, Mail, Music, User, Clock, Phone,
  ImageIcon, ExternalLink, ChevronDown, 
  ChevronUp, Package, LayoutGrid, CheckCircle2,
  Trophy, Activity, FileVideo, Download, Hash,
  Database, Calendar, CreditCard, Link2, AlertCircle
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

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id)
    if (error) toast.error("Update failed")
    else {
      toast.success(`Moved to ${status}`)
      fetchOrders()
    }
  }

  const generateInvoice = (order: any) => {
    const doc = new jsPDF()
    doc.setFontSize(20).text("INVOICE", 105, 20, { align: "center" })
    doc.autoTable({
      startY: 40,
      head: [['Field', 'Data']],
      body: Object.entries(order).map(([k, v]) => [k, String(v)]),
    })
    doc.save(`Invoice_${order.order_id?.slice(-6)}.pdf`)
  }

  const filteredOrders = orders.filter((o) => {
    const search = searchQuery.toLowerCase()
    return (
      o.customer_name?.toLowerCase().includes(search) || 
      o.customer_email?.toLowerCase().includes(search) || 
      o.order_id?.toLowerCase().includes(search)
    )
  })

  const activeOrders = filteredOrders.filter(o => o.status !== "Delivered")
  const deliveredOrders = filteredOrders.filter(o => o.status === "Delivered")

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 lg:p-6 font-sans">
      <div className="max-w-[1800px] mx-auto">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Dual-Column Command</h1>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search all records..." 
              className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: ACTIVE (RED THEME) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-red-500 pb-2 mb-4">
              <div className="flex items-center gap-2 text-red-600 font-black uppercase text-sm tracking-widest">
                <AlertCircle className="h-4 w-4" /> Active Queue
              </div>
              <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">{activeOrders.length} Pending</Badge>
            </div>
            {renderOrderList(activeOrders, "red")}
          </div>

          {/* RIGHT COLUMN: DELIVERED (GREEN THEME) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-green-500 pb-2 mb-4">
              <div className="flex items-center gap-2 text-green-600 font-black uppercase text-sm tracking-widest">
                <CheckCircle2 className="h-4 w-4" /> Delivered Archive
              </div>
              <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50">{deliveredOrders.length} Completed</Badge>
            </div>
            {renderOrderList(deliveredOrders, "green")}
          </div>

        </div>
      </div>
    </div>
  )

  function renderOrderList(list: any[], theme: "red" | "green") {
    if (loading) return <div className="p-10 text-center animate-pulse text-zinc-400">Loading Datastream...</div>
    if (list.length === 0) return <div className="p-10 text-center border-2 border-dashed rounded-2xl text-zinc-400 font-bold uppercase text-xs">No Records</div>
    
    return list.map((order) => (
      <Collapsible key={order.id} open={expandedOrder === order.id} onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
        <Card className={`overflow-hidden border-0 border-l-4 shadow-sm transition-all ${
          theme === "red" ? "border-l-red-500 bg-red-50/10 hover:bg-red-50/30" : "border-l-green-500 bg-green-50/10 hover:bg-green-50/30"
        }`}>
          <CollapsibleTrigger asChild>
            <CardContent className="p-3 cursor-pointer flex items-center gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                {order.photos?.slice(0, 2).map((img: any, i: number) => (
                  <img key={i} src={img.secure_url} className="h-10 w-10 rounded-md object-cover border-2 border-white shadow-sm" />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-zinc-900 truncate uppercase">{order.customer_name}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">{order.customer_email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-zinc-900 leading-none">${order.total_price}</p>
                <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">ID: {order.order_id?.slice(-4)}</p>
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent className="p-4 border-t border-zinc-100 bg-white">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase text-zinc-400 border-b">Client Specs</p>
                <p className="text-xs font-bold flex items-center gap-2"><Phone className="h-3 w-3" /> {order.customer_phone || "No Phone"}</p>
                <p className="text-xs font-bold flex items-center gap-2 text-blue-600"><Music className="h-3 w-3" /> {order.music_selection || "Standard"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase text-zinc-400 border-b">Asset Data</p>
                <p className="text-xs font-bold flex items-center gap-2"><ImageIcon className="h-3 w-3" /> {order.photo_count} Photos</p>
                <a href={order.photos_url} target="_blank" className="text-xs font-bold text-red-600 flex items-center gap-2 hover:underline"><Link2 className="h-3 w-3" /> Cloudinary Folder</a>
              </div>
            </div>

            {/* ACTION ROW */}
            <div className="flex gap-2 mb-4">
              <Button onClick={() => generateInvoice(order)} variant="secondary" className="flex-1 h-9 text-[10px] font-black uppercase">Invoice</Button>
              {theme === "red" ? (
                <Button onClick={() => handleStatusUpdate(order.id, "Delivered")} className="flex-1 h-9 bg-green-600 text-white text-[10px] font-black uppercase">Ship</Button>
              ) : (
                <Button onClick={() => handleStatusUpdate(order.id, "New")} variant="ghost" className="flex-1 h-9 border border-dashed text-[10px] font-black uppercase">Re-Open</Button>
              )}
            </div>

            {/* RAW DATA INJECTOR */}
            <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
              <p className="text-[9px] font-black text-zinc-400 uppercase mb-2 flex items-center gap-2"><Database className="h-3 w-3" /> System Raw JSON</p>
              <div className="max-h-32 overflow-y-auto text-[9px] font-mono text-zinc-600 grid grid-cols-1 gap-1">
                {Object.entries(order).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-zinc-100 py-1 last:border-0">
                    <span className="text-zinc-400">{key}:</span>
                    <span className="font-bold text-zinc-900 truncate ml-4 max-w-[150px]">{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    ))
  }
}
