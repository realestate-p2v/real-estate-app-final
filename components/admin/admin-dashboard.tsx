"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, Mail, Music, User, Clock, 
  ImageIcon, ExternalLink, ChevronDown, 
  ChevronUp, Package, LayoutGrid, CheckCircle2,
  Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"

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
      toast.success(status === "Delivered" ? "Order Archived!" : "Order Reactivated")
      fetchOrders()
    }
  }

  const filtered = orders.filter((o) => {
    const search = searchQuery.toLowerCase()
    const match = (o.customer_name?.toLowerCase().includes(search) || o.customer_email?.toLowerCase().includes(search) || o.order_id?.toLowerCase().includes(search))
    return activeTab === "new" ? (match && o.status !== "Delivered") : (match && o.status === "Delivered")
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 p-4 md:p-8">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-zinc-400">
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logistics System</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-zinc-900 dark:text-white">Command</h1>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search orders..." 
              className="w-[300px] h-12 pl-10 rounded-xl bg-white shadow-sm border-zinc-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchOrders} variant="outline" className="h-12 px-6 rounded-xl bg-white font-bold shadow-sm">Refresh</Button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto mb-8">
        <TabsList className="h-14 rounded-2xl p-1 bg-zinc-200/50">
          <TabsTrigger value="new" className="px-10 h-full rounded-xl font-bold data-[state=active]:shadow-sm">Active Queue</TabsTrigger>
          <TabsTrigger value="delivered" className="px-10 h-full rounded-xl font-bold data-[state=active]:shadow-sm text-green-700">Delivered Archive</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ORDER LIST */}
      <div className="max-w-7xl mx-auto space-y-4">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-zinc-400 font-bold">LOADING ASSETS...</div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center border-2 border-dashed rounded-3xl text-zinc-400">No projects found.</div>
        ) : filtered.map((order) => (
          <Collapsible key={order.id} open={expandedOrder === order.id} onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
            <Card className={`overflow-hidden border-0 border-l-[6px] shadow-sm ring-1 ring-zinc-200/50 transition-all ${order.payment_status === 'paid' ? 'border-l-green-500' : 'border-l-amber-400 bg-amber-50/20'}`}>
              <CollapsibleTrigger asChild>
                <CardContent className="p-5 cursor-pointer hover:bg-zinc-50 transition-colors flex items-center gap-6">
                  {/* Status Indicator */}
                  <div className="flex flex-col min-w-[100px]">
                    <span className={`text-[10px] font-black px-2 py-1 rounded text-center mb-1 ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                    </span>
                    <span className="text-[10px] text-zinc-400 text-center font-mono">#{order.order_id?.slice(-6)}</span>
                  </div>

                  {/* Customer Info & Trophy Badge */}
                  <div className="flex-1 flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{order.customer_name}</h3>
                      <p className="text-sm text-zinc-500 font-medium">{order.customer_email}</p>
                    </div>
                    {order.status === "Delivered" && (
                      <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-200 shadow-sm animate-in fade-in zoom-in duration-300">
                        <Trophy className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Done</span>
                      </div>
                    )}
                  </div>

                  {/* Icon Specs */}
                  <div className="flex gap-6 px-8 border-x border-zinc-100 items-center text-zinc-400">
                    <div className="text-center">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-[10px] font-bold block leading-none mt-1 text-zinc-900">{order.photo_count}</span>
                    </div>
                    <div className={order.music_selection ? 'text-blue-500' : 'text-zinc-200'}>
                      <Music className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total</p>
                    <p className="text-2xl font-black text-zinc-900 dark:text-white leading-none">${order.total_price}</p>
                  </div>
                  {expandedOrder === order.id ? <ChevronUp className="text-zinc-300" /> : <ChevronDown className="text-zinc-300" />}
                </CardContent>
              </CollapsibleTrigger>

              {/* Expanded Detail View */}
              <CollapsibleContent className="p-8 bg-white dark:bg-zinc-950 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-100 pb-2 tracking-widest">Client Identity</h5>
                  <div className="space-y-2">
                    <p className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100"><User className="h-4 w-4 text-zinc-300" /> {order.customer_name}</p>
                    <p className="text-sm font-bold flex items-center gap-2 text-blue-600"><Mail className="h-4 w-4 text-zinc-300" /> {order.customer_email}</p>
                    {order.customer_phone && <p className="text-sm font-bold flex items-center gap-2 text-zinc-600"><Phone className="h-4 w-4 text-zinc-300" /> {order.customer_phone}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-100 pb-2 tracking-widest">Creative Specs</h5>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <Music className="h-4 w-4 mb-2 text-blue-500" />
                    <p className="text-[9px] font-black text-zinc-400 uppercase leading-none mb-1">Audio Track</p>
                    <p className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{order.music_selection || "None Selection"}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <Button className="w-full h-12 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold border-0" variant="secondary" asChild>
                      <a href={order.photos_url || "#"} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> OPEN ASSET GALLERY
                      </a>
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    {order.status !== "Delivered" ? (
                      <Button 
                        className="w-full h-16 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-95" 
                        onClick={() => handleStatusUpdate(order.id, "Delivered")}
                      >
                        <CheckCircle2 className="mr-2 h-6 w-6" /> COMPLETE & SHIP
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full h-16 rounded-2xl font-black text-zinc-400 border-zinc-200 hover:text-zinc-900 hover:border-zinc-900" 
                        onClick={() => handleStatusUpdate(order.id, "New")}
                      >
                        RE-OPEN PROJECT
                      </Button>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}
