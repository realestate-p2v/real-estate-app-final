"use client"

import { useState, useEffect } from "react"
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  ExternalLink,
  Archive,
  Inbox,
  Loader2,
  Check
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active") // "active" or "delivered"
  const [searchQuery, setSearchQuery] = useState("")

  // 1. Fetch orders from the database
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // 2. Update status (e.g., mark as Delivered)
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Order marked as ${newStatus}`)
        fetchOrders() // Refresh list
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  // 3. Filter Logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Archive logic: "delivered" tab shows only Delivered. "active" shows everything else.
    if (activeTab === "delivered") {
      return matchesSearch && order.status === "Delivered"
    } else {
      return matchesSearch && order.status !== "Delivered"
    }
  })

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage your video production workflow.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Inbox className="h-4 w-4" /> Active
            </TabsTrigger>
            <TabsTrigger value="delivered" className="gap-2">
              <Archive className="h-4 w-4" /> Delivered
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No orders found in this section.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="relative overflow-hidden border-l-4 transition-all hover:shadow-md" 
              style={{ borderLeftColor: order.payment_status === "paid" ? "#22c55e" : "#fbbf24" }}>
              
              {/* PAYMENT STATUS TAB (Floating on top) */}
              <div className="absolute top-3 right-3 z-10">
                {order.payment_status === "paid" ? (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold border-none">
                    PAID
                  </Badge>
                ) : (
                  <Badge className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold border-none">
                    PENDING
                  </Badge>
                )}
              </div>

              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Order ID: {order.order_id}
                  </p>
                  <h3 className="text-lg font-bold truncate pr-16">{order.customer_name}</h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Mail className="h-3.5 w-3.5" /> {order.customer_email}
                    </div>
                    {order.customer_phone && (
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground text-[11px] uppercase">Photos</p>
                    <p className="font-semibold">{order.photo_count || 0} Images</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] uppercase">Voiceover</p>
                    <p className="font-semibold">{order.voiceover ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-muted-foreground uppercase font-bold">Status</span>
                     <span className="text-sm font-medium">{order.status || "New"}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Only show "Mark as Delivered" if it's not already delivered */}
                    {order.status !== "Delivered" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(order.id, "Delivered")}
                      >
                        <Check className="h-4 w-4 mr-1" /> Done
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" className="h-8 px-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
