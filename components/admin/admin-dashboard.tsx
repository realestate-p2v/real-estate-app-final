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
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
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
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
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

    // Filter by tab - "new" shows New orders, "delivered" shows archived Delivered orders
    if (activeTab === "new") {
      filtered = filtered.filter((order) => order.status !== "Delivered")
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

  const handleStatusUpdate = async (orderId: string, newStatus: string): Promise<void> => {
    setUpdatingStatusId(orderId)
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        alert(`Failed to update status: ${responseData.error || 'Unknown error'}`)
        return
      }

      // Update local state on success - only updates the specific order with matching id
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (error) {
      alert(`Error updating status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(priceInCents / 100)
  }

  const newCount = orders.filter((o) => o.status !== "Delivered").length
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">Orders</h1>
                <p className="text-sm text-zinc-500">Manage video orders</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
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
            Delivered (Archived)
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
          <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === "Delivered"
              const photoCount = order.photo_count || (Array.isArray(order.photos) ? order.photos.length : 0)
              const isUpdating = updatingStatusId === order.id

              return (
                <div key={order.id} className="relative pb-3">
                  <Card
                    className="group relative cursor-pointer overflow-hidden border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-md"
                    onClick={() => handleOrderClick(order)}
                  >
                    {/* Status Tab */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1 ${
                        isDelivered ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    
                    <CardContent className="p-3 pl-4">
                      {/* Header Row */}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-zinc-900">
                            {order.customer_name || "No Name"}
                          </h3>
                          <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-semibold text-zinc-900">
                            {formatPrice(order.total_price)}
                          </p>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              isDelivered
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isDelivered ? "Delivered" : "New"}
                          </span>
                        </div>
                      </div>

                      {/* Info Row */}
                      <div className="mb-2 flex items-center gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Images className="h-3 w-3" />
                          <span>{photoCount}</span>
                        </div>
                        {order.customer_email && (
                          <div className="flex min-w-0 flex-1 items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{order.customer_email}</span>
                          </div>
                        )}
                      </div>

                      {/* Features Row */}
                      <div className="flex flex-wrap gap-1">
                        {order.voiceover && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            Voiceover
                          </span>
                        )}
                        {order.branding?.type && order.branding.type !== "unbranded" && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            {order.branding.type === "basic" ? "Branding" : "Custom"}
                          </span>
                        )}
                        {order.include_edited_photos && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            Edited
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Status Switch - Below Card */}
                  <div 
                    className="absolute -bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => !isUpdating && handleStatusUpdate(order.id, "New")}
                      disabled={isUpdating}
                      className={`text-xs font-medium transition-colors ${isDelivered ? "text-zinc-500 hover:text-red-600" : "text-red-600"} disabled:opacity-50`}
                    >
                      New
                    </button>
                    <Switch
                      checked={isDelivered}
                      onCheckedChange={(checked) => {
                        handleStatusUpdate(order.id, checked ? "Delivered" : "New")
                      }}
                      disabled={isUpdating}
                      className="h-5 w-9 data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => !isUpdating && handleStatusUpdate(order.id, "Delivered")}
                      disabled={isUpdating}
                      className={`text-xs font-medium transition-colors ${isDelivered ? "text-emerald-600" : "text-zinc-500 hover:text-emerald-600"} disabled:opacity-50`}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
