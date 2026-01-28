"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, Mail, Music, User, Clock, Phone,
  ImageIcon, ExternalLink, ChevronDown, 
  ChevronUp, Package, LayoutGrid, CheckCircle2,
  Trophy, Activity, FileVideo, Download, Hash,
  Database, Calendar, CreditCard, Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("new")
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
      toast.success(`Project moved to ${status}`)
      fetchOrders()
    }
  }

  const generateInvoice = (order: any) => {
    const doc = new jsPDF()
    doc.setFontSize(20).text("INVOICE", 105, 20, { align: "center" })
    doc.setFontSize(10).text(`Client: ${order.customer_name}`, 14, 40)
    doc.text(`Order ID: ${order.order_id}`, 14, 46)
    // @ts-ignore
    doc.autoTable({
      startY: 60,
      head: [['Item', 'Details', 'Price']],
      body: [
        ['Video Package', `Includes ${order.photo_count} photos`, `$${order.total_price}`],
        ['Music selection', order.music_selection || 'Standard', '--']
      ],
    })
    doc.save(`Invoice_${order.order_id.slice(-6)}.pdf`)
  }

  const filtered = orders.filter((o) => {
    const search = searchQuery.toLowerCase()
    const match = (o.customer_name?.toLowerCase().includes(search) || o.customer_email?.toLowerCase().includes(search) || o.order_id?.toLowerCase().includes(search))
    return activeTab === "new" ? (match && o.status !== "Delivered") : (match && o.status === "Delivered")
  })

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* COMPACT HEADER */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white leading-none">Command Center</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Real Estate Visuals Pipeline</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Global Search..." 
                className="pl-10 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={fetchOrders} size="icon" variant="ghost" className="h-11 w-11 rounded-xl hover:bg-zinc-100"><Activity className="h-5 w-5 text-blue-500" /></Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-transparent gap-2 h-auto p-0">
            <TabsTrigger value="new" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl px-6 py-2.5 font-bold border border-zinc-200 dark:border-zinc-800 transition-all">
              Live Queue ({orders.filter(o => o.status !== "Delivered").length})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white rounded-xl px-6 py-2.5 font-bold border border-zinc-200 dark:border-zinc-800 transition-all">
              Delivered Archive
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* COMPACT LIST */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center animate-pulse font-black text-zinc-300">SYNCING DATABASE...</div>
          ) : filtered.map((order) => (
            <Collapsible key={order.id} open={expandedOrder === order.id} onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
              <Card className={`group border-0 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all ${expandedOrder === order.id ? 'ring-2 ring-blue-500' : ''}`}>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex flex-col md:flex-row items-center gap-4">
                    
                    {/* Compact Image Strip */}
                    <div className="flex -space-x-4 overflow-hidden p-1">
                      {order.photos?.slice(0, 3).map((img: any, i: number) => (
                        <img key={i} src={img.secure_url} className="h-10 w-10 rounded-lg object-cover border-2 border-white dark:border-zinc-900 shadow-sm" />
                      ))}
                      {order.photo_count > 3 && (
                        <div className="h-10 w-10 rounded-lg bg-zinc-800 text-[10px] flex items-center justify-center text-white font-bold border-2 border-white dark:border-zinc-900">
                          +{order.photo_count - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-black text-zinc-900 dark:text-zinc-100 truncate">{order.customer_name}</h3>
                        {order.status === "Delivered" && <Trophy className="h-3 w-3 text-yellow-500" />}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-medium">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer_email}</span>
                        <span className="flex items-center gap-1 font-mono text-zinc-400">ID: {order.order_id?.slice(-8)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 px-4">
                      <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'} className={order.payment_status === 'paid' ? 'bg-green-500 hover:bg-green-600' : 'text-amber-500 border-amber-500'}>
                        {order.payment_status?.toUpperCase()}
                      </Badge>
                      <div className="text-right min-w-[80px]">
                        <p className="text-[14px] font-black text-zinc-900 dark:text-white leading-none">${order.total_price}</p>
                      </div>
                      {expandedOrder === order.id ? <ChevronUp className="h-4 w-4 text-zinc-300" /> : <ChevronDown className="h-4 w-4 text-zinc-300 group-hover:text-blue-500" />}
                    </div>
                  </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* COLUMN 1: CLIENT & RAW DATA */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-tighter"><User className="h-3 w-3"/> Lead Information</div>
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-[9px] text-zinc-400 font-bold uppercase">Phone</p><p className="text-sm font-bold truncate">{order.customer_phone || "N/A"}</p></div>
                          <div><p className="text-[9px] text-zinc-400 font-bold uppercase">Status</p><p className="text-sm font-bold truncate">{order.status}</p></div>
                          <div><p className="text-[9px] text-zinc-400 font-bold uppercase">Created</p><p className="text-sm font-bold truncate">{new Date(order.created_at).toLocaleDateString()}</p></div>
                          <div><p className="text-[9px] text-zinc-400 font-bold uppercase">Currency</p><p className="text-sm font-bold truncate">USD</p></div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 2: CREATIVE & CLOUDINARY LINKS */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-600 tracking-tighter"><Database className="h-3 w-3"/> Assets & Cloudinary</div>
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
                        <div className="flex flex-col gap-2">
                           <p className="text-[9px] text-zinc-400 font-bold uppercase">Cloudinary Source Folder</p>
                           <a href={order.photos_url} target="_blank" className="text-[11px] font-mono text-blue-600 hover:underline truncate flex items-center gap-1">
                             <Link2 className="h-3 w-3" /> {order.photos_url?.split('/').pop()}
                           </a>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-[9px] text-zinc-400 font-bold uppercase">Music Track</p><p className="text-sm font-bold truncate text-zinc-600">{order.music_selection || "None"}</p></div>
                          <div><p className="text-[9px] text-zinc-400 font-bold uppercase">Photos</p><p className="text-sm font-bold truncate">{order.photo_count} Units</p></div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 3: RAW JSON & ACTIONS */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-tighter"><Hash className="h-3 w-3"/> Fulfillment Controls</div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button onClick={() => generateInvoice(order)} variant="outline" className="flex-1 h-12 rounded-xl font-bold text-xs"><Download className="h-4 w-4 mr-2" /> PDF</Button>
                          <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold text-xs" asChild>
                            <a href={order.photos_url} target="_blank"><ExternalLink className="h-4 w-4 mr-2" /> GALLERY</a>
                          </Button>
                        </div>
                        
                        {order.status !== "Delivered" ? (
                          <Button 
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/20" 
                            onClick={() => handleStatusUpdate(order.id, "Delivered")}
                          >
                            <CheckCircle2 className="mr-2 h-5 w-5" /> SHIP TO CLIENT
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            className="w-full h-14 rounded-xl font-black text-zinc-400 hover:text-zinc-900 border border-dashed" 
                            onClick={() => handleStatusUpdate(order.id, "New")}
                          >
                            RETURN TO QUEUE
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* RAW DATA FOOTER (The "Everything" Section) */}
                  <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <details className="cursor-pointer group">
                      <summary className="text-[9px] font-black text-zinc-400 uppercase tracking-widest list-none flex items-center gap-2 group-hover:text-zinc-900 transition-colors">
                        <Database className="h-3 w-3" /> View Raw System Metadata
                      </summary>
                      <div className="mt-4 p-4 bg-zinc-900 rounded-xl overflow-x-auto">
                        <pre className="text-[10px] text-green-500 font-mono">
                          {JSON.stringify(order, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  )
}
