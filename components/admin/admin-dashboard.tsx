"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, LayoutGrid, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronUp, ImageIcon, Copy,
  Phone, Info, ExternalLink, Link as LinkIcon,
  Save, Globe, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// --- SAFETY FUNCTION: PREVENTS APP CRASHES ---
// This ensures that even if Supabase sends a weird Object or Null,
// React only ever receives a safe String.
const safeText = (value: any): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') return JSON.stringify(value) // Fixes "Objects are not valid as a React child"
  return String(value)
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  // 1. Force the app to wait for the client to be ready (Fixes Hydration Errors)
  useEffect(() => {
    setMounted(true)
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

      // 2. Sanitize Data immediately
      const cleanData = (data || []).map(item => ({
        ...item,
        customer_name: safeText(item.customer_name),
        branding: safeText(item.branding),
        voiceover: safeText(item.voiceover),
        music_selection: safeText(item.music_selection),
        delivery_url: safeText(item.delivery_url), // Ensure this exists in your DB or it will just be empty
      }))

      setOrders(cleanData)
    } catch (err) {
      console.error("Fetch Error:", err)
      toast.error("Could not load orders. Check console.")
    } finally {
      setLoading(false)
    }
  }

  // Prevent rendering until mounted
  if (!mounted) return <div className="min-h-screen bg-zinc-50" />

  const filtered = orders.filter(o => 
    o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    safeText(o.order_id).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const active = filtered.filter(o => o.status !== "Delivered")
  const archived = filtered.filter(o => o.status === "Delivered")

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-['Poppins']">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Command v5.1</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Stable Edition</p>
            </div>
          </div>
          <Input 
            placeholder="Search orders..." 
            className="max-w-xs h-12 bg-white border-none shadow-sm rounded-xl font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        {loading ? (
          <div className="flex justify-center pt-20">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <OrderQueue title="Live Queue" color="text-red-600" border="border-red-500" orders={active} refresh={fetchOrders} />
            <OrderQueue title="Archive" color="text-green-600" border="border-green-500" orders={archived} refresh={fetchOrders} />
          </div>
        )}
      </div>
    </div>
  )
}

function OrderQueue({ title, color, border, orders, refresh }: any) {
  return (
    <div className="space-y-4">
      <div className={`flex justify-between items-center border-b-2 ${border} pb-3`}>
        <h2 className={`font-black uppercase text-xs tracking-[0.2em] ${color} flex items-center gap-2`}>
           {title}
        </h2>
        <Badge className="bg-white text-zinc-900 border border-zinc-200 shadow-sm">{orders.length}</Badge>
      </div>
      <div className="flex flex-col gap-4">
        {orders.map((order: any) => (
          <OrderCard key={order.id} order={order} refresh={refresh} />
        ))}
      </div>
    </div>
  )
}

function OrderCard({ order, refresh }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [deliveryLink, setDeliveryLink] = useState(order.delivery_url || "")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const toggleStatus = async () => {
    const newStatus = order.status === "Delivered" ? "New" : "Delivered"
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    refresh()
    toast.success(`Marked as ${newStatus}`)
  }

  const saveLink = async () => {
    setIsSaving(true)
    try {
      // Ensure your database has a 'delivery_url' column!
      const { error } = await supabase
        .from("orders")
        .update({ delivery_url: deliveryLink })
        .eq("id", order.id)
      
      if (error) throw error
      toast.success("Delivery Link Saved")
      refresh()
    } catch (e) {
      toast.error("Failed to save link. Check DB columns.")
    } finally {
      setIsSaving(false)
    }
  }

  const copyCloudinary = (e: React.MouseEvent) => {
    e.stopPropagation()
    const urls = Array.isArray(order.photos) 
      ? order.photos.map((p: any) => p?.secure_url).filter(Boolean).join(", ")
      : ""
    if (!urls) return toast.error("No assets found")
    navigator.clipboard.writeText(urls)
    toast.success("Cloudinary Links Copied")
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden">
        <CollapsibleTrigger className="w-full text-left p-5 flex items-center gap-5">
          {/* THUMBNAIL */}
          <div className="h-14 w-14 bg-zinc-100 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100 shadow-inner">
            {order.photos?.[0]?.secure_url ? (
              <img src={order.photos[0].secure_url} alt="" className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-300"><ImageIcon className="h-6 w-6" /></div>
            )}
          </div>

          {/* MAIN INFO */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-base uppercase text-zinc-900 truncate tracking-tight">{order.customer_name || "Unknown Client"}</p>
              <p className="font-black text-xl text-zinc-900">${order.total_price}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[9px] h-5 bg-zinc-100 text-zinc-500 font-bold">{order.photo_count || 0} Ph.</Badge>
              {order.delivery_url && <Badge className="text-[9px] h-5 bg-blue-50 text-blue-600 border-blue-100">Link Ready</Badge>}
              {order.status === 'Delivered' && <Badge className="text-[9px] h-5 bg-green-50 text-green-700 border-green-100">Complete</Badge>}
            </div>
          </div>

          {isOpen ? <ChevronUp className="h-5 w-5 text-zinc-300" /> : <ChevronDown className="h-5 w-5 text-zinc-300" />}
        </CollapsibleTrigger>

        <CollapsibleContent className="px-5 pb-6 pt-0 space-y-6">
          <div className="h-px w-full bg-zinc-100" />
          
          {/* INFO GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <InfoBox label="Voiceover" value={order.voiceover} />
             <InfoBox label="Branding" value={order.branding} />
             <InfoBox label="Music" value={order.music_selection} />
             <InfoBox label="Phone" value={order.customer_phone} />
          </div>

          {/* ASSET MANAGEMENT */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50 space-y-4">
             <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                  <Globe className="h-3 w-3" /> Input Assets
                </p>
                <Button size="sm" onClick={copyCloudinary} variant="outline" className="h-7 text-[10px] font-bold uppercase bg-white">
                  <Copy className="h-3 w-3 mr-2" /> Copy All
                </Button>
             </div>
             
             <div className="flex gap-2">
                <Button className="flex-1 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold h-10 text-xs rounded-xl" asChild>
                  <a href={order.photos_url} target="_blank"><ExternalLink className="h-3 w-3 mr-2" /> Source Folder</a>
                </Button>
             </div>
          </div>

          {/* DELIVERY MODULE (NEW) */}
          <div className="bg-zinc-900 p-4 rounded-2xl text-white shadow-lg">
             <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 flex items-center gap-2">
               <LinkIcon className="h-3 w-3" /> Final Delivery
             </p>
             
             <div className="flex gap-2 mb-4">
               <Input 
                 placeholder="Paste Google Drive / Dropbox Link here..." 
                 className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-11 rounded-xl focus-visible:ring-zinc-600"
                 value={deliveryLink}
                 onChange={(e) => setDeliveryLink(e.target.value)}
               />
               <Button 
                 onClick={saveLink} 
                 disabled={isSaving}
                 className="bg-white text-black hover:bg-zinc-200 font-bold h-11 w-24 rounded-xl"
               >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
               </Button>
             </div>

             <Button 
               onClick={toggleStatus} 
               className={`w-full h-12 font-black uppercase tracking-wide rounded-xl transition-all ${
                 order.status === 'Delivered' 
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-900/20'
               }`}
             >
               {order.status === 'Delivered' ? 'Re-Open Order' : 'Mark Delivered & Archive'}
             </Button>
          </div>

        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function InfoBox({ label, value }: any) {
  return (
    <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[11px] font-bold text-zinc-700 truncate">{value || "---"}</p>
    </div>
  )
}
      <p className="text-xs md:text-sm font-bold text-zinc-900 truncate">{value || "---"}</p>
    </div>
  )
}
