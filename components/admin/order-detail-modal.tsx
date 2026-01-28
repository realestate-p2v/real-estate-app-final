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
  CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
      toast.success(`Moved to ${newStatus}`)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
    return activeTab === "new" ? (matchesSearch && order.status !== "Delivered") : (matchesSearch && order.status === "Delivered")
  })

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">COMMAND</h1>
          <p className="text-slate-500 font-medium">Production Management & Logistics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10 w-[300px] bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchOrders} variant="secondary" className="font-bold">Refresh</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-200/50 dark:bg-zinc-900 p-1">
            <TabsTrigger value="new" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 font-bold px-8">Active Queue</TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 font-bold px-8">Delivered Archive</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-xl bg-slate-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Collapsible
                key={order.id}
                open={expandedOrder === order.id}
                onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <Card className={`overflow-hidden border-l-4 transition-all ${
                  order.payment_status === 'paid' ? 'border-l-green-500 shadow-sm' : 'border-l-amber-400 bg-amber-50/30'
                }`}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <div className="flex flex-col md:flex-row items-center p-4 gap-6">
                        {/* Status Tabs */}
                        <div className="flex flex-col gap-1 min-w-[100px]">
                          {order.payment_status === "paid" ? (
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-black uppercase px-2 py-1 rounded text-center tracking-tighter">PAID</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-black uppercase px-2 py-1 rounded text-center tracking-tighter">PENDING</span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono text-center">#{order.order_id?.slice(-6)}</span>
                        </div>

                        {/* Customer Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{order.customer_name}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-2"><Mail className="h-3 w-3" /> {order.customer_email}</p>
                        </div>

                        {/* Quick Specs Icons (Efficient identification) */}
                        <div className="flex items-center gap-4 px-6 border-x border-slate-100 dark:border-zinc-800">
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                            <span className="text-[11px] font-bold">{order.photo_count}</span>
                          </div>
                          <div className={`flex flex-col items-center ${order.music_selection ? 'text-blue-500' : 'text-slate-300'}`}>
                            <Music className="h-4 w-4" />
                            <span className="text-[11px] font-bold">MUS</span>
                          </div>
                          <div className={`flex flex-col items-center ${order.branding?.type !== 'unbranded' ? 'text-purple-500' : 'text-slate-300'}`}>
                            <Type className="h-4 w-4" />
                            <span className="text-[11px] font-bold">BRD</span>
                          </div>
                          <div className={`flex flex-col items-center ${order.voiceover ? 'text-orange-500' : 'text-slate-300'}`}>
                            <Mic2 className="h-4 w-4" />
                            <span className="text-[11px] font-bold">VOX</span>
                          </div>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">${order.total_price}</p>
                        </div>

                        {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <div className="p-8 grid md:grid-cols-3 gap-12">
                      {/* Column 1: Customer & Logistics */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Logistics</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg"><User className="h-4 w-4" /></div>
                            <div>
                              <p className="text-xs text-slate-500">Full Name</p>
                              <p className="text-sm font-bold">{order.customer_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg"><Phone className="h-4 w-4" /></div>
                            <div>
                              <p className="text-xs text-slate-500">Phone Number</p>
                              <p className="text-sm font-bold">{order.customer_phone || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg"><CalendarDays className="h-4 w-4" /></div>
                            <div>
                              <p className="text-xs text-slate-500">Order Date</p>
                              <p className="text-sm font-bold">{order.created_at ? format(new Date(order.created_at), 'PPP p') : 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Creative Specifications */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Creative Specs</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Music</p>
                            <p className="text-sm font-bold truncate">{order.music_selection}</p>
                          </div>
                          <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Branding</p>
                            <p className="text-sm font-bold">{order.branding?.type || 'Standard'}</p>
                          </div>
                          <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Voiceover Selection</p>
                            <p className="text-sm font-bold">{order.voiceover ? `Voice: ${order.voiceover_voice || 'Default'}` : 'None requested'}</p>
                          </div>
                        </div>
                        {order.voiceover_script && (
                          <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border-l-2 border-orange-400">
                            <p className="text-[10px] font-black text-orange-500 uppercase mb-1">Script</p>
                            <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed">"{order.voiceover_script}"</p>
                          </div>
                        )}
                      </div>

                      {/* Column 3: Assets & Actions */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Assets & Fulfilment</h4>
                        <div className="flex flex-col gap-3">
                          <Button variant="outline" className="justify-between group h-12" asChild>
                            <a href={`/admin/orders/${order.id}/photos`} target="_blank">
                              <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> View {order.photo_count} Photos</span>
                              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </Button>
                          
                          {order.special_instructions && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span>{order.special_instructions}</span>
                            </div>
                          )}

                          <div className="pt-6">
                            {order.status !== "Delivered" ? (
                              <Button 
                                className="w-full h-14 bg-zinc-900 hover:bg-black text-white text-lg font-black"
                                onClick={() => handleStatusUpdate(order.id, "Delivered")}
                              >
                                MARK AS DELIVERED
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                className="w-full h-14 border-zinc-200"
                                onClick={() => handleStatusUpdate(order.id, "Ready to Process")}
                              >
                                REACTIVATE PROJECT
                              </Button>
                            )}
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
