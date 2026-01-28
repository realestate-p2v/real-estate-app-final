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
    const nameMatch = order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const emailMatch = order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
    const idMatch = order.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSearch = nameMatch || emailMatch || idMatch
    
    return activeTab === "new" 
      ? (matchesSearch && order.status !== "Delivered") 
      : (matchesSearch && order.status === "Delivered")
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-zinc-900 dark:bg-white rounded flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-white dark:text-zinc-900" />
            </div>
            <span className="text-xs font-black tracking-[0.2em] uppercase text-zinc-400">System v2.0</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">Command</h1>
          <p className="text-zinc-500 font-medium">Video Production Logistics & Control</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search..." 
              className="pl-10 w-[300px] bg-white dark:bg-zinc-900 border-zinc-200 h-12 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchOrders} variant="outline" className="h-12 px-6 font-bold rounded-xl bg-white shadow-sm hover:bg-zinc-50 transition-all">
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-zinc-200/50 dark:bg-zinc-900 p-1 h-14 rounded-2xl">
            <TabsTrigger value="new" className="data-[state=active]:bg-white font-bold px-10 h-full rounded-xl shadow-sm">
              Active Queue
            </TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-white font-bold px-10 h-full rounded-xl shadow-sm">
              Delivered Archive
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-zinc-200/50 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Collapsible
                key={order.id}
                open={expandedOrder === order.id}
                onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <Card className={`overflow-hidden border-0 border-l-[6px] shadow-sm ring-1 ring-zinc-200/50 ${
                  order.payment_status === 'paid' ? 'border-l-green-500' : 'border-l-amber-400 bg-amber-50/20'
                }`}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-0 cursor-pointer hover:bg-zinc-50 transition-colors">
                      <div className="flex flex-col md:flex-row items-center p-5 gap-6">
                        <div className="flex flex-col gap-1 min-w-[100px]">
                          <span className={`text-[10px] font-black uppercase px-2 py-1.5 rounded-lg text-center ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono text-center tracking-tighter">ID: {order.order_id?.slice(-8)}</span>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{order.customer_name}</h3>
                          <p className="text-sm text-zinc-500 font-medium flex items
