"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutDashboard, 
  Package, 
  RefreshCw,
  Search,
  Images,
  Mail,
  Phone,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { OrderDetailModal } from "./order-detail-modal"
import { Spinner } from "@/components/ui/spinner"

export interface AdminOrder {
  id: string
  order_id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  photos: Array<{ public_id: string; secure_url: string; width: number; height: number; order: number }>
  photo_count: number
  music_selection: string | null
  custom_audio: { public_id: string; secure_url: string; filename: string } | null
  branding: {
    type: "unbranded" | "basic" | "custom"
    logoUrl?: string
    agentName?: string
    companyName?: string
    phone?: string
    email?: string
    website?: string
  }
  voiceover: boolean
  voiceover_script: string | null
  voiceover_voice: string | null
  include_edited_photos: boolean
  special_instructions: string | null
  base_price: number
  branding_fee: number
  voiceover_fee: number
  edited_photos_fee: number
  total_price: number
  payment_status: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  created_at: string
  updated_at: string
  status: string
}

type TabFilter = "new" | "delivered"

export function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilter>("new")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
    } else {
      setOrders(data || [])
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    let filtered = orders

    // Filter by tab - "new" shows New and Processing, "delivered" shows Delivered
    if (activeTab === "new") {
      filtered = filtered.filter((order) => order.status === "New" || order.status === "Processing" || !order.status)
    } else {
      filtered = filtered.filter((order) => order.status === "Delivered")
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.order_id.toLowerCase().includes(query) ||
          order.customer_name?.toLowerCase().includes(query) ||
          order.customer_email?.toLowerCase().includes(query)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, activeTab, searchQuery])

  const handleOrderClick = (order: AdminOrder) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error) {
      console.error("Error updating status:", error)
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price / 100)
  }

  const newCount = orders.filter((o) => o.status === "New" || o.status === "Processing" || !o.status).length
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Orders</h1>
              <p className="text-sm text-zinc-500">Manage video orders</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        {/* Tab Toggle */}
        <div className="mb-6 flex gap-2 rounded-xl bg-white p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "new"
                ? "bg-red-500 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${activeTab === "new" ? "bg-white" : "bg-red-500"}`} />
            New Orders
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === "new" ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
            }`}>
              {newCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("delivered")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "delivered"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${activeTab === "delivered" ? "bg-white" : "bg-emerald-500"}`} />
            Delivered
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === "delivered" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-600"
            }`}>
              {deliveredCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by name, email, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-xl border-zinc-200 bg-white pl-11 text-base shadow-sm placeholder:text-zinc-400"
          />
        </div>

        {/* Order Cards */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="mb-4 h-12 w-12 text-zinc-300" />
                <p className="text-lg font-medium text-zinc-600">No orders found</p>
                <p className="text-sm text-zinc-400">
                  {searchQuery
                    ? "Try a different search term"
                    : activeTab === "new"
                    ? "New orders will appear here"
                    : "Delivered orders will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const isNew = order.status === "New" || !order.status
              const isDelivered = order.status === "Delivered"
              const photoCount = order.photo_count || (Array.isArray(order.photos) ? order.photos.length : 0)

              return (
                <Card
                  key={order.id}
                  className="group relative cursor-pointer overflow-hidden border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-md"
                  onClick={() => handleOrderClick(order)}
                >
                  {/* Status Tab */}
                  <div
                    className={`absolute left-0 top-0 h-full w-1.5 ${
                      isDelivered ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  
                  <CardContent className="p-5 pl-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Customer Name & Date */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-900">
                              {order.customer_name || "No Name"}
                            </h3>
                            <p className="text-sm text-zinc-500">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-zinc-900">
                              {formatPrice(order.total_price)}
                            </p>
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                                isDelivered
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isNew
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {order.status || "New"}
                            </span>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                          <div className="flex items-center gap-1.5">
                            <Images className="h-4 w-4 text-zinc-400" />
                            <span>{photoCount} photos</span>
                          </div>
                          {order.customer_email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-4 w-4 text-zinc-400" />
                              <span className="max-w-[200px] truncate">{order.customer_email}</span>
                            </div>
                          )}
                          {order.customer_phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4 text-zinc-400" />
                              <span>{order.customer_phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2">
                          {order.voiceover && (
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                              Voiceover
                            </span>
                          )}
                          {order.branding?.type && order.branding.type !== "unbranded" && (
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                              {order.branding.type === "basic" ? "Basic Branding" : "Custom Branding"}
                            </span>
                          )}
                          {order.include_edited_photos && (
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                              Edited Photos
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="ml-4 h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOrder(null)
        }}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}
