"use client"

import React from "react"
import { 
  X, Mail, Phone, Music, ImageIcon, 
  Download, ExternalLink, Database, 
  Calendar, CreditCard, Hash, Copy 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface OrderDetailModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!order) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const generateInvoice = () => {
    const doc = new jsPDF()
    doc.setFontSize(20).text("SERVICE INVOICE", 105, 20, { align: "center" })
    doc.autoTable({
      startY: 40,
      head: [['System Key', 'Value']],
      body: Object.entries(order).map(([k, v]) => [k, String(v)]),
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    })
    doc.save(`Invoice_${order.order_id?.slice(-6)}.pdf`)
  }

  const isDelivered = order.status === "Delivered"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 p-0 rounded-3xl border-0 shadow-2xl">
        {/* MODAL HEADER STRIP */}
        <div className={`h-2 w-full ${isDelivered ? 'bg-green-500' : 'bg-red-500'}`} />
        
        <div className="p-8">
          <DialogHeader className="flex flex-row items-center justify-between mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
                  {order.customer_name}
                </DialogTitle>
                <Badge className={isDelivered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {order.status?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">
                Internal Tracking: {order.order_id}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT SIDE: CLIENT & ASSETS */}
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-[0.2em] flex items-center gap-2">
                  <User className="h-3 w-3" /> Identity & Contact
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between group">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" /> {order.customer_email}
                    </p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(order.customer_email)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-bold flex items-center gap-2 text-zinc-600">
                    <Phone className="h-4 w-4 text-green-500" /> {order.customer_phone || "Not Provided"}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-[0.2em] flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" /> Creative Assets
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {order.photos?.map((img: any, i: number) => (
                    <img key={i} src={img.secure_url} className="h-20 w-20 rounded-xl object-cover border-2 border-white shadow-sm flex-shrink-0" />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-black text-zinc-400 uppercase">Music</p>
                    <p className="text-xs font-bold truncate">{order.music_selection || "Standard"}</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-black text-zinc-400 uppercase">Photos</p>
                    <p className="text-xs font-bold">{order.photo_count} Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: TRANSACTION & SYSTEM */}
            <div className="space-y-6">
              <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Total Value</p>
                    <p className="text-4xl font-black tracking-tighter">${order.total_price}</p>
                  </div>
                  <Badge className={order.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}>
                    {order.payment_status?.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={generateInvoice} className="bg-white text-zinc-900 hover:bg-zinc-200 font-bold rounded-xl h-12">
                    <Download className="h-4 w-4 mr-2" /> PDF INVOICE
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12" asChild>
                    <a href={order.photos_url} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" /> FOLDER
                    </a>
                  </Button>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-[0.2em] flex items-center gap-2">
                  <Database className="h-3 w-3" /> Technical Trace
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {Object.entries(order).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-[10px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                      <span className="text-zinc-400 font-bold uppercase">{key}</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-300 truncate max-w-[150px]">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
