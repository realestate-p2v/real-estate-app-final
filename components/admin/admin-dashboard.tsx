"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, Mail, Music, User, Clock, Phone,
  ImageIcon, ExternalLink, ChevronDown, 
  ChevronUp, Package, LayoutGrid, CheckCircle2,
  Trophy, DollarSign, Activity, FileVideo
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
      toast.success(status === "Delivered" ? "Order Shipped!" : "Project Re-opened")
      fetchOrders()
    }
  }

  // Quick Stats Calculations
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)
  const activeCount = orders.filter(o => o.status !== "Delivered").length

  const filtered = orders.filter((o) => {
    const search = searchQuery.toLowerCase()
    const match = (
      o.customer_name?.toLowerCase().includes(search) || 
      o.customer_email?.toLowerCase().includes(search) || 
      o.order_id?.toLowerCase().includes(search)
    )
    return activeTab === "new" ? (match && o.status !== "Delivered") : (match && o.status === "Delivered")
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP COMMAND BAR */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <Activity className="h-4 w-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Operations</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none text-zinc-900 dark:text-white">
              Command<span className="text-blue-600">.</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">Total Pipeline</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">Active Projects</p>
              <p className="text-2xl font-black text-blue-600">{activeCount}</p>
            </div>
          </div>
        </div>

        {/* UTILITY BAR */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="h-14 rounded-2xl p-1 bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">
              <TabsTrigger value="new" className="px-8 h-full rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
                Current Queue
              </TabsTrigger>
              <TabsTrigger value="delivered" className="px-8 h-full rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Filter by name, email, or order ID..." 
              className="w-full h-14 pl-12 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={fetchOrders} variant="outline" className="h-14 px-8 rounded-2xl font-bold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:bg-zinc-50">
            Sync Data
          </Button>
        </div>

        {/* MAIN QUEUE */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 font-bold tracking-widest text-xs uppercase">Accessing Mainframe...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] bg-transparent">
              <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold">No records found matching your current parameters.</p>
            </Card>
          ) : filtered.map((order) => (
            <Collapsible key={order.id} open={expandedOrder === order.id} onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
              <Card className={`overflow-hidden border-0 border-l-[6px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 transition-all duration-300 hover:shadow-md ${
                order.payment_status === 'paid' ? 'border-l-green-500' : 'border-l-amber-400 bg-amber-50/10 dark:bg-amber-900/5'
              }`}>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors flex flex-col md:flex-row items-center gap-6">
                    
                    {/* Visual Asset Preview */}
                    <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700 relative">
                      {order.photos?.[0] ? (
                        <img src={order.photos[0].secure_url} alt="asset" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all" />
                      ) : (
                        <FileVideo className="h-6 w-6 text-zinc-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-bold uppercase">
                        {order.photo_count}P
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-4">
                      <div className="min-w-[140px]">
                        <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] leading-tight">
                          {order.customer_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">#{order.order_id?.slice(-6)}</span>
                        </div>
                      </div>

                      {order.status === "Delivered" && (
                        <div className="hidden sm:flex items-center gap-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-2 py-1 rounded-lg border border-yellow-200 dark:border-yellow-900/50 shadow-sm">
                          <Trophy className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Delivered</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-8 px-8 border-x border-zinc-100 dark:border-zinc-800 items-center">
                      <div className={`flex flex-col items-center gap-1 ${order.music_selection ? 'text-blue-500' : 'text-zinc-300'}`}>
                        <Music className="h-4 w-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Audio</span>
                      </div>
                      <div className={`flex flex-col items-center gap-1 ${order.branding ? 'text-purple-500' : 'text-zinc-300'}`}>
                        <FileVideo className="h-4 w-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Logo</span>
                      </div>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Contract Value</p>
                      <p className="text-2xl font-black text-zinc-900 dark:text-white leading-none tracking-tighter">
                        ${Number(order.total_price).toFixed(2)}
                      </p>
                    </div>

                    {expandedOrder === order.id ? <ChevronUp className="text-zinc-300" /> : <ChevronDown className="text-zinc-300" />}
                  </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent className="p-8 bg-zinc-50/50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black uppercase text-zinc-400 border-b dark:border-zinc-800 pb-3 tracking-widest flex items-center gap-2">
                        <User className="h-3 w-3" /> Customer Metadata
                      </h5>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Contact Method</span>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Mail className="h-3 w-3 text-blue-500" /> {order.customer_email}
                          </p>
                        </div>
                        {order.customer_phone && (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Phone Line</span>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                              <Phone className="h-3 w-3 text-green-500" /> {order.customer_phone}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black uppercase text-zinc-400 border-b dark:border-zinc-800 pb-3 tracking-widest flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Project Parameters
                      </h5>
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase mb-2">Music Bed</p>
                          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                            <Music className="h-4 w-4" /> {order.music_selection || "Standard License"}
                          </div>
                        </div>
                        {order.voiceover && (
                          <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase mb-2">Script Requirements</p>
                            <p className="text-xs italic text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-2 border-blue-500 pl-3">
                              "{order.voiceover_script}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-zinc-400 pb-1 tracking-widest">Asset Management</h5>
                        <Button className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[10px] tracking-widest rounded-xl hover:scale-[1.02] transition-transform" asChild>
                          <a href={order.photos_url || "#"} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" /> ACCESS CLOUD STORAGE
                          </a>
                        </Button>
                      </div>
                      
                      <div className="pt-6 border-t dark:border-zinc-800">
                        {order.status !== "Delivered" ? (
                          <Button 
                            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all" 
                            onClick={() => handleStatusUpdate(order.id, "Delivered")}
                          >
                            <CheckCircle2 className="mr-2 h-6 w-6" /> MARK AS COMPLETE
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full h-16 rounded-2xl font-black text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white" 
                            onClick={() => handleStatusUpdate(order.id, "New")}
                          >
                            RESTORE TO QUEUE
                          </Button>
                        )}
                      </div>
                    </div>
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
