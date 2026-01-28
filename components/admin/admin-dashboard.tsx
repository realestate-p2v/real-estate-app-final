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
@@ -23,20 +22,17 @@ import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/component
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
@@ -47,11 +43,8 @@ export default function AdminDashboard() {
    }
    load()
  }, [supabase])

  if (!mounted) return null

  const filtered = orders.filter(o => renderSafe(o.customer_name).toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-zinc-50 p-2 md:p-6 font-sans">
      <div className="max-w-[1700px] mx-auto">
@@ -68,13 +61,12 @@ export default function AdminDashboard() {
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Command v5.8</h1>
          </div>
          <Input 
            placeholder="Search by client name..." 
          <Input
            placeholder="Search by client name..."
            className="max-w-xs h-10 bg-white rounded-lg shadow-sm border-zinc-200"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-zinc-400" /></div>
        ) : (
@@ -87,7 +79,6 @@ export default function AdminDashboard() {
    </div>
  )
}

function Column({ title, orders, glowColor, refresh }: any) {
  return (
    <div className="space-y-4">
@@ -102,13 +93,11 @@ function Column({ title, orders, glowColor, refresh }: any) {
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
@@ -120,15 +109,16 @@ function OrderCard({ order, refresh }: any) {
            <p className="font-black uppercase text-lg text-zinc-900 leading-tight">{renderSafe(order.customer_name)}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge className="bg-zinc-900 text-[10px] font-bold h-5">{order.photo_count || 0} Assets</Badge>
              {order.branding === "Custom Branding" && <Badge className="bg-purple-600 text-[10px] font-bold h-5 uppercase">Custom Branding</Badge>}
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
@@ -149,7 +139,6 @@ function OrderCard({ order, refresh }: any) {
                   <FileLink label="Branding Logo / Assets" url={order.branding_file} />
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2 tracking-[0.1em]">
                  <Mic className="w-3.5 h-3.5" /> Voiceover & Music
@@ -158,27 +147,45 @@ function OrderCard({ order, refresh }: any) {
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Voice Choice</p>
                        <p className="text-sm font-bold text-zinc-900">{renderSafe(order.voiceover)}</p>
                        <p className="text-sm font-bold text-zinc-900">{renderSafe(order.voiceover ? "Yes" : "No")}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Music Mood</p>
                        <p className="text-sm font-bold text-zinc-900">{renderSafe(order.music_selection)}</p>
                      </div>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Voiceover Script (Full View)</p>
                      <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap leading-relaxed">
                         {order.voiceover_script || "Create based on photos/description."}
                      </p>
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
@@ -203,16 +210,15 @@ function OrderCard({ order, refresh }: any) {
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
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste URL (Vimeo, YouTube, Drive...)"
                  className="h-12 bg-zinc-800 border-none text-white text-base focus:ring-2 focus:ring-blue-600 placeholder:text-zinc-600"
                />
              </div>
@@ -225,7 +231,7 @@ function OrderCard({ order, refresh }: any) {
                {isSaving ? <Loader2 className="animate-spin" /> : "SAVE"}
              </Button>
            </div>
            
           
            <Button className={`w-full h-14 font-black text-sm rounded-xl tracking-[0.1em] transition-all ${
              order.status === 'Delivered' ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20'
            }`} onClick={async () => {
@@ -236,13 +242,11 @@ function OrderCard({ order, refresh }: any) {
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

