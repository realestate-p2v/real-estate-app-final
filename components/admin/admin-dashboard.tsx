"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, Mail, Music, User, Clock, Phone,
  ImageIcon, ExternalLink, ChevronDown, 
  ChevronUp, Package, LayoutGrid, CheckCircle2,
  Trophy, Activity, FileVideo, Download, Hash,
  Database, Copy, Link2, AlertCircle, Globe
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
    toast.success("Copied to clipboard")
  }

  const copyAllUrls = (photos: any[]) => {
    if (!photos || photos.length === 0) return
    const urlString = photos.map(p => p.secure_url).join(", ")
    copyToClipboard(urlString)
    toast.success(`${photos.length} URLs copied (comma-separated)`)
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id)
    if (error) toast.error("Update failed")
    else {
      toast.success(`Status: ${status}`)
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

  const activeOrders = filteredOrders.filter(o => o.status !== "Delivered")
  const deliveredOrders = filteredOrders.filter(o => o.status === "Delivered")

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 lg:p-8 font-['Poppins']">
      <div className="max-w-[1800px] mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <LayoutGrid className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Command Center</h1>
              <p className="text-sm font-medium text-zinc-400 mt-1">Poppins Regular Edition</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input 
              placeholder="Search records..." 
              className="pl-12 h-14 bg-white dark:bg-zinc-900 border-zinc-200 text-lg rounded-2xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* DUAL COLUMN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* ACTIVE COLUMN */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-4 border-red-500 pb-3">
              <div className="flex items-center gap-3 text-red-600 font-bold uppercase text-lg tracking-widest">
                <AlertCircle className="h-6 w-6" /> Live Queue
              </div>
              <Badge className="bg-red-500 text-white text-md px-4 py-1 rounded-full">{activeOrders.length}</Badge>
            </div>
            {renderOrderList(activeOrders, "red")}
          </div>

          {/* DELIVERED COLUMN */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-4 border-green-500 pb-3">
              <div className="flex items-center gap-3 text-green-600 font-bold uppercase text-lg tracking-widest">
                <CheckCircle2 className="h-6 w-6" /> Archive
              </div>
              <Badge className="bg-green-500 text-white text-md px-4 py-1 rounded-full">{deliveredOrders.length}</Badge>
            </div>
            {renderOrderList(deliveredOrders, "green")}
          </div>

        </div>
      </div>
    </div>
  )

  function renderOrderList(list: any[], theme: "red" | "green") {
    if (loading) return <div className="p-20 text-center animate-pulse text-zinc-400 text-xl font-bold">SYNCHRONIZING...</div>
    
    return list.map((order) => (
      <Collapsible key={order.id} open={expandedOrder === order.id} onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
        <Card className={`overflow-hidden border-0 border-l-[8px] shadow-lg transition-all duration-300 ${
          theme === "red" ? "border-l-red-500 bg-red-50/20" : "border-l-green-500 bg-green-50/20"
        }`}>
          <CollapsibleTrigger asChild>
            <CardContent className="p-5 cursor-pointer flex items-center gap-6 hover:bg-white transition-colors">
              <div className="flex -space-x-4 overflow-hidden">
                {order.photos?.slice(0, 3).map((img: any, i: number) => (
                  <img key={i} src={img.secure_url} className="h-14 w-14 rounded-xl object-cover border-4 border-white shadow-md" />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-2xl text-zinc-900 truncate uppercase tracking-tight">{order.customer_name}</p>
                <p className="text-sm text-zinc-500 font-medium">{order.customer_email}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-zinc-900 leading-none">${order.total_price}</p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">{order.payment_status}</Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent className="p-8 border-t border-zinc-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              
              {/* ASSET URL SECTION */}
              <div className="col-span-1 md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Cloudinary Asset URLs ({order.photo_count})
                  </p>
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="bg-zinc-900 text-white font-bold h-10 px-6 rounded-xl"
                    onClick={() => copyAllUrls(order.photos || [])}
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copy All URLs
                  </Button>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200">
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {order.photos?.map((photo: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-4 p-2 bg-white rounded-lg border border-zinc-100 group">
                        <span className="text-[11px] font-mono text-zinc-500 truncate">{photo.secure_url}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          onClick={() => copyToClipboard(photo.secure_url)}
                        >
                          <Copy className="h-3.5 w-3.5 text-zinc-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="space-y-4">
                <p className="text-xs font-black uppercase text-zinc-400 border-b pb-2">Technical Info</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between text-sm"><span className="text-zinc-400">Order ID:</span> <span className="font-bold">{order.order_id}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-400">Phone:</span> <span className="font-bold">{order.customer_phone || "N/A"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-400">Music:</span> <span className="font-bold text-blue-600">{order.music_selection || "None"}</span></div>
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-end">
                <div className="flex gap-4">
                  <Button className="flex-1 h-16 bg-zinc-100 text-zinc-900 font-bold rounded-2xl text-lg hover:bg-zinc-200" asChild>
                    <a href={order.photos_url} target="_blank"><ExternalLink className="h-5 w-5 mr-2" /> Cloudinary Folder</a>
                  </Button>
                  {theme === "red" ? (
                    <Button onClick={() => handleStatusUpdate(order.id, "Delivered")} className="flex-1 h-16 bg-green-600 text-white font-black rounded-2xl text-lg">
                      Complete Order
                    </Button>
                  ) : (
                    <Button onClick={() => handleStatusUpdate(order.id, "New")} variant="outline" className="flex-1 h-16 rounded-2xl font-bold text-zinc-400 text-lg border-dashed">
                      Re-Open
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* FULL METADATA DUMP */}
            <details className="mt-6">
              <summary className="text-xs font-black text-zinc-300 uppercase cursor-pointer hover:text-zinc-500 transition-colors">Raw System Data</summary>
              <div className="mt-4 p-6 bg-zinc-900 rounded-2xl overflow-x-auto">
                <pre className="text-[12px] text-green-400 font-mono leading-relaxed">
                  {JSON.stringify(order, null, 2)}
                </pre>
              </div>
            </details>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    ))
  }
}
