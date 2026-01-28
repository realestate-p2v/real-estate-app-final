"use client"
import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Copy,
  Music,
  Mic,
  Brush,
  Image as ImageIcon,
  ArrowLeft,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"
const renderSafe = (val: any): string => {
  if (val === null || val === undefined || val === "") return "Not Provided";
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
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
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [supabase])
  if (!mounted) return null
  const filtered = orders.filter(o => renderSafe(o.customer_name).toLowerCase().includes(searchQuery.toLowerCase()))
  return (
    <div className="min-h-screen bg-zinc-50 p-2 md:p-6 font-sans">
      <div className="max-w-[1700px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            {/* BACK BUTTON TO FRONTEND */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-zinc-500 hover:text-black">
                <ArrowLeft className="h-4 w-4" /> Back to Site
              </Button>
            </Link>
            <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Command v5.8</h1>
          </div>
          <Input
            placeholder="Search by client name..."
            className="max-w-xs h-10 bg-white rounded-lg shadow-sm border-zinc-200"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-zinc-400" /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Column title="Live Queue" glowColor="rgba(239, 68, 68, 0.3)" orders={filtered.filter(o => o.status !== 'Delivered')} refresh={() => window.location.reload()} />
            <Column title="Archive" glowColor="rgba(34, 197, 94, 0.2)" orders={filtered.filter(o => o.status === 'Delivered')} refresh={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  )
}
function Column({ title, orders, glowColor, refresh }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-200 pb-2 flex justify-between px-1">
        {title} <span>{orders.length}</span>
      </h2>
      {orders.map((o: any) => (
        <div key={o.id} style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}>
           <OrderCard order={o} refresh={refresh} />
        </div>
      ))}
    </div>
  )
}
function OrderCard({ order, refresh }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [link, setLink] = useState(renderSafe(order.delivery_url))
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none rounded-xl overflow-hidden bg-white shadow-sm border border-zinc-100">
        <CollapsibleTrigger className="w-full p-4 flex items-center gap-4 text-left hover:bg-zinc-50 transition-colors">
          <div className="h-16 w-16 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-200">
            {order.photos?.[0]?.secure_url ? <img src={order.photos[0].secure_url} className="object-cover h-full w-full" alt="" /> : <ImageIcon className="m-auto h-6 w-6 text-zinc-300"/>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black uppercase text-lg text-zinc-900 leading-tight">{renderSafe(order.customer_name)}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge className="bg-zinc-900 text-[10px] font-bold h-5">{order.photo_count || 0} Assets</Badge>
              {order.branding === "custom" && <Badge className="bg-purple-600 text-[10px] font-bold h-5 uppercase">Custom Branding</Badge>}
              {order.include_edited_photos && <Badge className="bg-blue-600 text-[10px] font-bold h-5 uppercase">+ Edits</Badge>}
              <Badge className="bg-green-600 text-[10px] font-bold h-5 uppercase">${Number(order.total_price || 0).toFixed(2)}</Badge>
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-6 w-6 text-zinc-300" /> : <ChevronDown className="h-6 w-6 text-zinc-300" />}
        </CollapsibleTrigger>
       
        <CollapsibleContent className="p-6 bg-white border-t border-zinc-50 space-y-8">
         
          {/* BRANDING SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2 tracking-[0.1em]">
                  <Brush className="w-3.5 h-3.5" /> Branding Details
                </h3>
                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 space-y-4">
                   <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Package</p>
                      <p className="text-sm font-bold text-zinc-900">{renderSafe(order.branding)}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Instructions (Full View)</p>
                      <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap leading-relaxed">
                         {order.branding_instructions || "No custom branding instructions."}
                      </p>
                   </div>
                   <FileLink label="Branding Logo / Assets" url={order.branding_file} />
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2 tracking-[0.1em]">
                  <Mic className="w-3.5 h-3.5" /> Voiceover & Music
                </h3>
                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Voice Choice</p>
                        <p className="text-sm font-bold text-zinc-900">{renderSafe(order.voiceover ? "Yes" : "No")}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Music Mood</p>
                        <p className="text-sm font-bold text-zinc-900">{renderSafe(order.music_selection)}</p>
                      </div>
                   </div>
                   {order.voiceover && (
                     <>
                       <div>
                         <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Selected Voice</p>
                         <p className="text-sm font-bold text-zinc-900">{renderSafe(order.voiceover_voice)}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Voiceover Script (Full View)</p>
                          <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap leading-relaxed">
                             {order.voiceover_script || "Create based on photos/description."}
                          </p>
                       </div>
                     </>
                   )}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <FileLink label="Custom Audio" url={order.music_file} />
                      <FileLink label="Script Upload" url={order.script_file} />
                   </div>
                </div>
             </div>
          </div>
          {/* SPECIAL INSTRUCTIONS SECTION */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2 tracking-[0.1em]">
              Special Instructions
            </h3>
            <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
              <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap leading-relaxed">
                {order.special_instructions || "No special instructions provided."}
              </p>
            </div>
          </div>
          {/* ASSETS SECTION */}
          <div className="bg-blue-50/40 rounded-xl p-5 border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-lg text-white shadow-md">
                   <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider">Raw Property Assets</p>
                   <p className="text-xs text-blue-700 font-medium">{order.photos?.length || 0} Cloudinary links available</p>
                </div>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" size="sm" onClick={() => {
                  const urls = order.photos?.map((p: any) => p.secure_url).join('\n');
                  navigator.clipboard.writeText(urls);
                  toast.success("Links Copied!");
                }} className="flex-1 bg-white border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-[10px] h-9">
                  <Copy className="w-3.5 h-3.5 mr-2" /> COPY ALL LINKS
                </Button>
                <Button size="sm" asChild className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] h-9">
                   <a href={order.photos_url} target="_blank"><ExternalLink className="w-3.5 h-3.5 mr-2" /> VIEW FOLDER</a>
                </Button>
             </div>
          </div>
          {/* DELIVERY & STATUS */}
          <div className="p-6 bg-zinc-900 rounded-2xl text-white shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Final Video Delivery URL</p>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste URL (Vimeo, YouTube, Drive...)"
                  className="h-12 bg-zinc-800 border-none text-white text-base focus:ring-2 focus:ring-blue-600 placeholder:text-zinc-600"
                />
              </div>
              <Button size="lg" onClick={async () => {
                setIsSaving(true);
                await supabase.from("orders").update({ delivery_url: link }).eq("id", order.id);
                toast.success("Saved");
                setIsSaving(false);
              }} className="h-12 px-10 bg-white text-black font-black hover:bg-zinc-200 w-full md:w-auto">
                {isSaving ? <Loader2 className="animate-spin" /> : "SAVE"}
              </Button>
            </div>
           
            <Button className={`w-full h-14 font-black text-sm rounded-xl tracking-[0.1em] transition-all ${
              order.status === 'Delivered' ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20'
            }`} onClick={async () => {
                const status = order.status === 'Delivered' ? 'New' : 'Delivered'
                await supabase.from("orders").update({ status }).eq("id", order.id)
                refresh()
            }}>
              {order.status === 'Delivered' ? 'MARK AS ACTIVE (UNSHIP)' : 'MARK COMPLETED & SHIP TO CLIENT'}
            </Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
function FileLink({ label, url }: { label: string, url: string }) {
  if (!url || url === "None") return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-xl hover:border-blue-500 group transition-all shadow-sm">
       <div className="min-w-0">
          <p className="text-[9px] font-black text-zinc-400 uppercase leading-none mb-1">{label}</p>
          <p className="text-xs font-bold text-zinc-900 truncate">Download/View</p>
       </div>
       <Download className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 flex-shrink-0" />
    </a>
  )
}
