"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Copy,
  Check,
  Images,
  Mic,
  Building2,
  Music,
  FileText,
  Package,
  Mail,
  Phone,
  User,
  ExternalLink,
  Download,
} from "lucide-react"
import type { AdminOrder } from "./admin-dashboard"

interface OrderDetailModalProps {
  order: AdminOrder | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (orderId: string, status: string) => void
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
}: OrderDetailModalProps) {
  const [copiedUrls, setCopiedUrls] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  if (!order) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "Processing":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const copyAllImageUrls = async () => {
    if (!order.photos || !Array.isArray(order.photos)) return
    
    const urls = order.photos.map((photo) => photo.secure_url).join("\n")
    await navigator.clipboard.writeText(urls)
    setCopiedUrls(true)
    setTimeout(() => setCopiedUrls(false), 2000)
  }

  const copyVoiceoverScript = async () => {
    if (!order.voiceover_script) return
    await navigator.clipboard.writeText(order.voiceover_script)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  const photos = Array.isArray(order.photos) ? order.photos : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Order Details</DialogTitle>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {order.order_id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(order.status || "New")}>
                {order.status || "New"}
              </Badge>
              <Select
                value={order.status || "New"}
                onValueChange={(value) => onStatusUpdate(order.id, value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 p-6">
            {/* Customer & Order Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_name || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${order.customer_email}`}
                      className="text-primary hover:underline"
                    >
                      {order.customer_email}
                    </a>
                  </div>
                  {order.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="text-primary hover:underline"
                      >
                        {order.customer_phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Photos</span>
                    <span>{photos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <Badge
                      variant={order.payment_status === "paid" ? "default" : "secondary"}
                      className={order.payment_status === "paid" ? "bg-emerald-500" : ""}
                    >
                      {order.payment_status}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-lg">{formatPrice(order.total_price)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assets Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Images className="h-4 w-4" />
                    Assets ({photos.length} photos)
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllImageUrls}
                    disabled={photos.length === 0}
                  >
                    {copiedUrls ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy All Links
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                    {photos
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((photo, index) => (
                        <a
                          key={photo.public_id || index}
                          href={photo.secure_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                          <Image
                            src={photo.secure_url}
                            alt={`Photo ${index + 1}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 25vw, 12.5vw"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <ExternalLink className="h-5 w-5 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                            {index + 1}
                          </span>
                        </a>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No photos uploaded</p>
                )}
              </CardContent>
            </Card>

            {/* Voiceover Section */}
            {order.voiceover && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Mic className="h-4 w-4" />
                      Voiceover
                    </CardTitle>
                    {order.voiceover_script && (
                      <Button variant="outline" size="sm" onClick={copyVoiceoverScript}>
                        {copiedScript ? (
                          <>
                            <Check className="mr-2 h-4 w-4 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Script
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.voiceover_voice && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Voice:</span>
                      <Badge variant="secondary" className="font-medium">
                        {order.voiceover_voice}
                      </Badge>
                    </div>
                  )}
                  {order.voiceover_script ? (
                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">Script:</p>
                      <Textarea
                        value={order.voiceover_script}
                        readOnly
                        className="min-h-[120px] resize-none bg-muted/50"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No script provided</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Branding Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Branding Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  {order.branding?.logoUrl && (
                    <div className="shrink-0">
                      <p className="mb-2 text-sm text-muted-foreground">Logo:</p>
                      <a
                        href={order.branding.logoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block h-20 w-32 overflow-hidden rounded-lg border bg-muted"
                      >
                        <Image
                          src={order.branding.logoUrl}
                          alt="Brand Logo"
                          fill
                          className="object-contain p-2"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Download className="h-5 w-5 text-white" />
                        </div>
                      </a>
                    </div>
                  )}
                  <div className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium capitalize">{order.branding?.type || "Unbranded"}</p>
                    </div>
                    {order.branding?.agentName && (
                      <div>
                        <span className="text-muted-foreground">Agent Name:</span>
                        <p className="font-medium">{order.branding.agentName}</p>
                      </div>
                    )}
                    {order.branding?.companyName && (
                      <div>
                        <span className="text-muted-foreground">Company:</span>
                        <p className="font-medium">{order.branding.companyName}</p>
                      </div>
                    )}
                    {order.branding?.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{order.branding.phone}</p>
                      </div>
                    )}
                    {order.branding?.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{order.branding.email}</p>
                      </div>
                    )}
                    {order.branding?.website && (
                      <div>
                        <span className="text-muted-foreground">Website:</span>
                        <p className="font-medium">{order.branding.website}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Specs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Music className="h-4 w-4" />
                  Order Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Music Choice:</span>
                  <p className="font-medium">{order.music_selection || "Not selected"}</p>
                </div>
                {order.custom_audio && (
                  <div>
                    <span className="text-muted-foreground">Custom Audio:</span>
                    <p className="font-medium">{order.custom_audio.filename}</p>
                    <a
                      href={order.custom_audio.secure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Download Audio
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Include Edited Photos:</span>
                  <p className="font-medium">{order.include_edited_photos ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Voiceover:</span>
                  <p className="font-medium">{order.voiceover ? "Yes" : "No"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            {order.special_instructions && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={order.special_instructions}
                    readOnly
                    className="min-h-[80px] resize-none bg-muted/50"
                  />
                </CardContent>
              </Card>
            )}

            {/* Pricing Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pricing Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span>{formatPrice(order.base_price)}</span>
                  </div>
                  {order.branding_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branding Fee</span>
                      <span>{formatPrice(order.branding_fee)}</span>
                    </div>
                  )}
                  {order.voiceover_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voiceover Fee</span>
                      <span>{formatPrice(order.voiceover_fee)}</span>
                    </div>
                  )}
                  {order.edited_photos_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edited Photos Fee</span>
                      <span>{formatPrice(order.edited_photos_fee)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(order.total_price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
