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
  order_number: number
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg hover:bg-zinc-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-sm">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">Order Dashboard</h1>
                <p className="hidden text-xs text-zinc-500 sm:block">Manage and track video orders</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchOrders} 
            disabled={isLoading} 
            className="h-9 gap-2 rounded-lg border-zinc-200 text-xs font-medium shadow-sm hover:bg-zinc-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Stats Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Package className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{newCount}</p>
                <p className="text-xs text-zinc-500">Pending Orders</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{deliveredCount}</p>
                <p className="text-xs text-zinc-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="mb-5 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === "new"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${activeTab === "new" ? "bg-white" : "bg-red-500"}`} />
            New
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === "new" ? "bg-white/25 text-white" : "bg-red-100 text-red-600"
            }`}>
              {newCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("delivered")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === "delivered"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${activeTab === "delivered" ? "bg-white" : "bg-emerald-500"}`} />
            Delivered
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === "delivered" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-600"
            }`}>
              {deliveredCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-lg border-zinc-200 bg-white pl-10 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-300"
          />
        </div>

        {/* Order Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="border border-dashed border-zinc-300 bg-zinc-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <Package className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="font-medium text-zinc-700">No orders found</p>
              <p className="mt-1 text-sm text-zinc-500">
                {searchQuery
                  ? "Try a different search term"
                  : activeTab === "new"
                  ? "New orders will appear here"
                  : "Delivered orders will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 pb-4 sm:grid-cols-2">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === "Delivered"
              const photoCount = order.photo_count || (Array.isArray(order.photos) ? order.photos.length : 0)
              const isUpdating = updatingStatusId === order.id

              return (
                <div key={order.id} className="relative pb-4">
                  <Card
                    className="group relative cursor-pointer overflow-hidden border-zinc-200 bg-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                    onClick={() => handleOrderClick(order)}
                  >
                    {/* Status Indicator */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1 ${
                        isDelivered ? "bg-gradient-to-b from-emerald-400 to-emerald-600" : "bg-gradient-to-b from-red-400 to-red-600"
                      }`}
                    />
                    
                    <CardContent className="p-4 pl-5">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-sm">
                              #{String(order.order_number || 0).padStart(6, '0')}
                            </span>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isDelivered
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isDelivered ? "Delivered" : "New"}
                            </span>
                          </div>
                          <h3 className="truncate text-base font-semibold text-zinc-900">
                            {order.customer_name || "No Name"}
                          </h3>
                          <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-zinc-900">
                            {formatPrice(order.total_price)}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Images className="h-3.5 w-3.5" />
                          <span className="font-medium">{photoCount} photos</span>
                        </div>
                        {order.customer_email && (
                          <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{order.customer_email}</span>
                          </div>
                        )}
                      </div>

                      {/* Feature Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {order.voiceover && (
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-700">
                            Voiceover
                          </span>
                        )}
                        {order.branding?.type && order.branding.type !== "unbranded" && (
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-700">
                            {order.branding.type === "basic" ? "Branding" : "Custom Branding"}
                          </span>
                        )}
                        {order.include_edited_photos && (
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-700">
                            Edited Photos
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Status Toggle */}
                  <div 
                    className="absolute -bottom-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => !isUpdating && handleStatusUpdate(order.id, "New")}
                      disabled={isUpdating}
                      className={`text-[11px] font-semibold transition-colors ${isDelivered ? "text-zinc-400 hover:text-red-500" : "text-red-500"} disabled:opacity-50`}
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
                      className={`text-[11px] font-semibold transition-colors ${isDelivered ? "text-emerald-500" : "text-zinc-400 hover:text-emerald-500"} disabled:opacity-50`}
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
