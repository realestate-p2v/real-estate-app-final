"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Mail, 
  Phone, 
  Music, 
  User, 
  Type, 
  Mic2, 
  ImageIcon, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CalendarDays,
  Package,
  CheckCircle,
  LayoutGrid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("new")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error("Fetch failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
      if (error) throw error
      toast.success(`Project marked as ${newStatus}`)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return activeTab === "new" 
      ? (matchesSearch && order.status !== "Delivered") 
      : (matchesSearch && order.status === "Delivered")
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 p-4 md:p-8">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-zinc-900 dark:bg-white rounded flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-white dark:text-zinc-900" />
            </div>
            <span className="text-xs font-black tracking-[0.2em] uppercase text-zinc-400">System v2.0</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">COMMAND</h1>
          <p className="text-zinc-500 font-medium">Video Production Logistics & Control</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search by name, email, or ID..." 
              className="pl-10 w-[320px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm h-12 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchOrders} variant="outline" className="h-12 px-6 font-bold rounded-xl bg-white">
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-zinc-200/50 dark:bg-zinc-900 p-1 h-14 rounded-2xl">
            <TabsTrigger value="new" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 font-bold px-10 h-full rounded-xl">
              Active Queue
            </TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 font-bold px-10 h-full rounded-xl">
              Delivered Archive
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-zinc-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Collapsible
                key={order.id}
                open={expandedOrder === order.id}
                onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <Card className={`overflow-hidden border-0 border-l-[6px] transition-all shadow-sm ${
                  order.payment_status === 'paid' ? 'border-l-green-500' : 'border-l-amber-400 bg-amber-50/20'
                }`}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <div className="flex flex-col md:flex-row items-center p-5 gap-6">
                        {/* Financial Indicator */}
                        <div className="flex flex-col gap-1 min-w-[100px]">
                          {order.payment_status === "paid" ? (
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg text-center">PAID</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg text-center">PENDING</span>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono text-center tracking-tighter">ID: {order.order_id?.slice(-8)}</span>
                        </div>

                        {/* Customer Core */}
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{order.customer_name}</h3>
                          <p className="text-sm text-zinc-500 font-medium flex items-center gap-2 mt-0.5">
                            <Mail className="h-3 w-3" /> {order.customer_email}
                          </p>
                        </div>

                        {/* Quick Scanner Specs */}
                        <div className="flex items-center gap-6 px-8 border-x border-zinc-100 dark:border-zinc-800">
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-5 w-5 text-zinc-400 mb-1" />
                            <span className="text-[11px] font-black">{order.photo_count}</span>
                          </div>
                          <div className={`flex flex-col items-center ${order.music_selection ? 'text-blue-500' : 'text-zinc-300'}`}>
                            <Music className="h-5 w-5 mb-1" />
                            <span className="text-[11px] font-black tracking-tighter uppercase">Mus</span>
                          </div>
                          <div className={`flex flex-col items-center ${order.branding?.type !== 'unbranded' ? 'text-purple-500' : 'text-zinc-300'}`}>
                            <Type className="h-5 w-5 mb-1" />
                            <span className="text-[11px] font-black tracking-tighter uppercase">Brd</span>
                          </div>
                          <div className={`flex flex-col items-center ${order.voiceover ? 'text-orange-500' : 'text-zinc-300'}`}>
                            <Mic2 className="h-5 w-5 mb-1" />
                            <span className="text-[11px] font-black tracking-tighter uppercase">Vox</span>
                          </div>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Contract</p>
                          <p className="text-2xl font-black text-zinc-900 dark:text-white leading-none">${order.total_price}</p>
                        </div>

                        {expandedOrder === order.id ? <ChevronUp className="h-6 w-6 text-zinc-300" /> : <ChevronDown className="h-6 w-6 text-zinc-300" />}
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t border-zinc-100 dark:border-zinc-800 bg-[#fdfdfd] dark:bg-zinc-950/50">
                    <div className="p-8">
                      {/* TOP WORKFLOW BAR */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
                            <Package className="h-7 w-7" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Order System Tracking</h4>
                            <p className="text-xl font-mono font-bold tracking-tight">{order.order_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                          <span className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all ${order.status !== 'Delivered' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                            PRODUCTION PHASE
                          </span>
                          <span className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all ${order.status === 'Delivered' ? 'bg-green-500 text-white shadow-sm' : 'text-zinc-400'}`}>
                            COMPLETED
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Column 1: Client Profile */}
                        <div className="lg:col-span-4 space-y-6">
                          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                              <User className="h-3 w-3" /> Client Profile
                            </h5>
                            <div className="space-y-5">
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Full Legal Name</label>
                                <p className="text-base font-bold">{order.customer_name}</p>
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Communication</label>
                                <p className="text-base font-bold text-blue-600 underline decoration-2 underline-offset-4">{order.customer_email}</p>
                                <p className="text-sm font-bold mt-1 text-zinc-600">{order.customer_phone || "No phone provided"}</p>
                              </div>
                              <div className="pt-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Timestamp</label>
                                <p className="text-sm font-bold flex items-center gap-2 mt-1">
                                  <CalendarDays className="h-4 w-4 text-zinc-300" />
                                  {order.created_at ? format(new Date(order.created_at), 'PPP p') : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Creative Specifications */}
                        <div className="lg:col-span-4 space-y-6">
                          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                              <Clock className="h-3 w-3" /> Creative Directives
                            </h5>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                <Music className="h-4 w-4 mb-2 text-blue-500" />
                                <label className="text-[9px] font-black text-zinc-400 uppercase">Audio</label>
                                <p className="text-sm font-bold truncate">{order.music_selection || "Default"}</p>
                              </div>
                              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                <Type className="h-4 w-4 mb-2 text-purple-500" />
                                <label className="text-[9px] font-black text-zinc-400 uppercase">Branding</label>
                                <p className="text-sm font-bold capitalize">{order.branding?.type || "Standard"}</p>
                              </div>
                            </div>

                            {order.voiceover && (
                              <div className="p-5 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                <div className="flex items-center gap-2 mb-2 text-orange-600">
                                  <Mic2 className="h-4 w-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Voiceover Script</span>
                                </div>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium italic">
                                  "{order.voiceover_script}"
                                </p>
                              </div>
                            )}

                            {order.special_instructions && (
                              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center gap-2 mb-1 text-blue-600">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Field Notes</span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{order.special_instructions}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Assets & Actions */}
                        <div className="lg:col-span-4 space-y-6">
                          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm h-full flex flex-col">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center justify-between border-b pb-4">
                              <span><ImageIcon className="h-3 w-3 inline mr-1" /> Source Assets</span>
                              <Badge className="bg-zinc-900 font-black">{order.photo_count} Files</Badge>
                            </h5>

                            <div className="flex-1">
                              {/* ASSET THUMBNAIL GRID */}
                              <div className="grid grid-cols-4 gap-2 mb-6">
                                {order.photos?.slice(0, 8).map((photo: any, i: number) => (
                                  <div key={i} className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    <img src={photo.secure_url} className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                                  </div>
                                ))}
                              </div>

                              <Button className="w-full h-14 mb-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 font-black text-xs tracking-widest rounded-xl" variant="secondary">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                DOWNLOAD ALL ASSETS
                              </Button>
                            </div>

                            <div className="pt-8">
                               {order.status !== "Delivered" ? (
                                 <Button 
                                   className="w-full h-20 bg-green-500 hover:bg-green-600 text-white font-black text-xl shadow-xl shadow-green-500/20 rounded-2xl tracking-tighter"
                                   onClick={() => handleStatusUpdate(order.id, "Delivered")}
                                 >
                                   <CheckCircle2 className="mr-2 h-6 w-6" /> COMPLETE & SHIP
                                 </Button>
                               ) : (
                                 <Button 
                                   variant="outline" 
                                   className="w-full h-16 border-zinc-200 rounded-2xl font-black text-zinc-400 hover:text-zinc-900"
                                   onClick={() => handleStatusUpdate(order.id, "Ready to Process")}
                                 >
                                   RESTORE TO QUEUE
                                 </Button>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
