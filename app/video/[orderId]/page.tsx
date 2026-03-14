"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Download,
  RefreshCw,
  Share2,
  Mail,
  MessageCircle,
  Camera,
  Play,
  CheckCircle,
  Clock,
  BookOpen,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  status: string;
  customer_name: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_bedrooms: string;
  property_bathrooms: string;
  photo_count: number;
  resolution: string;
  orientation: string;
  delivery_url: string;
  edited_photos_url: string;
  created_at: string;
  include_edited_photos: boolean;
}

function getFileIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function VideoDeliveryPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (order?.delivery_url) {
      navigator.clipboard.writeText(order.delivery_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getOrderName = () => {
    if (!order) return "";
    if (order.property_address) {
      const parts = [order.property_address];
      if (order.property_city) parts.push(order.property_city);
      if (order.property_state) parts.push(order.property_state);
      return parts.join(", ");
    }
    return `Order ${(order.order_id || order.id).slice(0, 8)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Video Not Found</h1>
          <p className="text-muted-foreground">
            This video may not exist, may still be processing, or the link may be incorrect. If you just placed an order, your video will be ready within 24 hours.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/support">Contact Support</Link>
            </Button>
            <Button asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fileId = getFileIdFromUrl(order.delivery_url);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{getOrderName()}</h1>
            <p className="text-muted-foreground mt-1">Delivered {formatDate(order.created_at)}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex-shrink-0">
            <CheckCircle className="h-3.5 w-3.5" />
            Delivered
          </span>
        </div>

        {/* Video Player */}
        {fileId ? (
          <div className="bg-black rounded-2xl overflow-hidden mb-6">
            <div className="aspect-video">
              <iframe
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center mb-6">
            <div className="text-center space-y-2">
              <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">Video is being processed...</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {order.delivery_url && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href={order.delivery_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </a>
            </Button>
          )}
          {order.delivery_url && (
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy Drive Link"}
            </Button>
          )}
          {order.edited_photos_url && (
            <Button asChild variant="outline">
              <a href={order.edited_photos_url} target="_blank" rel="noopener noreferrer">
                <Camera className="mr-2 h-4 w-4" />
                Edited Photos
              </a>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/support">
              <RefreshCw className="mr-2 h-4 w-4" />
              Request Revision
            </Link>
          </Button>
        </div>

        {/* Order Details + Revisions */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h3 className="font-bold text-foreground">Order Details</h3>
            <div className="space-y-2 text-sm">
              {order.property_bedrooms && order.property_bathrooms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property</span>
                  <span className="text-foreground">{order.property_bedrooms} BD | {order.property_bathrooms} BA</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photos</span>
                <span className="text-foreground">{order.photo_count || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolution</span>
                <span className="text-foreground">{order.resolution || "768P"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orientation</span>
                <span className="text-foreground capitalize">{order.orientation || "landscape"}</span>
              </div>
              {order.include_edited_photos && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photo Editing</span>
                  <span className="text-green-600 font-medium">Included</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h3 className="font-bold text-foreground">Revisions</h3>
            <p className="text-sm text-muted-foreground">
              Every order includes <strong className="text-foreground">2 free revisions</strong>. To request changes, email us or use the support page with your shot numbers and what you'd like different.
            </p>
            <p className="text-sm text-muted-foreground">
              We only regenerate the clips you flag — everything else stays the same.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/support">
                <Mail className="mr-2 h-3.5 w-3.5" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-muted/30 rounded-xl border border-border p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-bold text-foreground">Share Your Video</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Download your video and upload it to these platforms for maximum exposure:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {["Instagram Reels", "TikTok", "Facebook / MLS Listing", "YouTube Shorts", "Zillow / Realtor.com", "Email Campaigns"].map((platform) => (
              <div key={platform} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" /> {platform}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link href="/order" className="group bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Play className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Create Another Video</h4>
              <p className="text-sm text-muted-foreground mt-1">Got another listing? Use code PHOTO15 for 15% off.</p>
            </div>
          </Link>
          <Link href="/resources/photography-guide" className="group bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Free Photography Guide</h4>
              <p className="text-sm text-muted-foreground mt-1">32-page guide with camera settings, lighting, staging, and drone tips.</p>
            </div>
          </Link>
        </div>

        {/* Referral */}
        <div className="bg-card rounded-xl border border-border p-6 text-center space-y-3">
          <h3 className="font-bold text-foreground">Know an agent who needs listing videos?</h3>
          <p className="text-sm text-muted-foreground">Share the love — send them to realestatephoto2video.com</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" size="sm">
              <a href="mailto:?subject=Check out this listing video service&body=I just got a professional walkthrough video for my listing at realestatephoto2video.com. They turn your photos into a cinematic video in 24 hours, starting at $79. Worth checking out!">
                <Mail className="mr-2 h-4 w-4" />
                Share via Email
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://wa.me/?text=I just got a professional listing video from realestatephoto2video.com — photos to cinematic video in 24 hours, starting at $79. Check it out!" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link>
            <Link href="/resources/photography-guide" className="hover:text-foreground transition-colors">Free Guide</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
