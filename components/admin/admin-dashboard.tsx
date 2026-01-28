"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LayoutGrid, ChevronDown, ChevronUp, ImageIcon, ExternalLink, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Safety function to prevent Error #31
const renderSafe = (val: any): string => {
  if (val === null || val === undefined) return "None";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.type || val.label || val.name || JSON.stringify(val);
  }
  return String(val);
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
        setOrders(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  if (!mounted) return null

  const filtered = orders.filter(o => 
    renderSafe(o.customer_name).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-2xl font-black uppercase flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" /> System v5.2
          </h1>
          <Input 
            placeholder="Search orders..." 
            className="max-w-xs bg-white h-12 rounded-xl"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-zinc-300" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Column title="Queue" orders={filtered.filter(o => o.status !== 'Delivered')} refresh={() => window.location.reload()} />
            <Column title="Archive" orders={filtered.filter(o => o.status === 'Delivered')} refresh={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  )
}

function Column({ title, orders, refresh }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-black uppercase tracking-widest border-b pb-2 flex justify-between">
        {title} <Badge variant="outline">{orders.length}</Badge>
      </h2>
      {orders.map((o: any) => <OrderCard key={o.id} order={o} refresh={refresh} />)}
    </div>
  )
}

function OrderCard({ order, refresh }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [link, setLink] = useState(renderSafe(order.delivery_url))
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const saveLink = async () => {
    setIsSaving(true)
    const { error } = await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id)
    if (error) toast.error("Error saving link")
    else toast.success("Saved")
    setIsSaving(false)
  }

  const toggleStatus = async () => {
    const status = order.status === 'Delivered' ? 'New' : 'Delivered'
    await supabase.from("orders").update({ status }).eq("id", order.id)
    refresh()
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-0 shadow-sm overflow-hidden mb-2">
        <CollapsibleTrigger className="w-full p-4 flex items-center gap-4 text-left hover:bg-zinc-50 transition-colors">
          <div className="h-12 w-12 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
            {order.photos?.[0]?.secure_url && <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold uppercase text-sm truncate">{renderSafe(order.customer_name)}</p>
            <p className="text-[10px] text-zinc-400">{order.photo_count || 0} Photos</p>
          </div>
          <p className="font-black text-lg">${order.total_price || 0}</p>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="p-4 bg-white border-t space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Box label="Voiceover" val={renderSafe(order.voiceover)} />
            <Box label="Branding" val={renderSafe(order.branding)} />
            <Box label="Music" val={renderSafe(order.music_selection)} />
            <Box label="Phone" val={renderSafe(order.customer_phone)} />
          </div>

          <div className="p-3 bg-zinc-900 rounded-xl space-y-2">
            <p className="text-[10px] font-bold uppercase text-zinc-500">Google Drive Link</p>
            <div className="flex gap-2">
              <Input 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                placeholder="Paste delivery URL..." 
                className="h-9 text-xs bg-zinc-800 border-zinc-700 text-white"
              />
              <Button size="sm" onClick={saveLink} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 h-10 font-bold text-xs" onClick={toggleStatus}>
              {order.status === 'Delivered' ? 'RETURN TO QUEUE' : 'MARK COMPLETE'}
            </Button>
            <Button variant="outline" className="h-10 px-3" asChild>
              <a href={order.photos_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function Box({ label, val }: { label: string, val: string }) {
  return (
    <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">{label}</p>
      <p className="text-[10px] font-bold truncate text-zinc-700">{val}</p>
    </div>
  )
}
