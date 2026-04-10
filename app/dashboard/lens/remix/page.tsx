"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Film,
  Play,
  Download,
  ExternalLink,
  Loader2,
  X,
  PenTool,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RemixExport {
  id: string;
  user_id: string;
  property_id: string | null;
  template_type: string;
  export_url: string;
  export_format: string;
  overlay_video_url: string | null;
  created_at: string;
}

export default function RemixLibraryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [remixes, setRemixes] = useState<RemixExport[]>([]);
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [viewModal, setViewModal] = useState<RemixExport | null>(null);
  const [hasOrders, setHasOrders] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?redirect=/dashboard/lens/remix"); return; }
      setUserId(user.id);

      // Fetch remix exports
      const { data: exports } = await supabase
        .from("design_exports")
        .select("*")
        .eq("user_id", user.id)
        .eq("template_type", "video_remix")
        .order("created_at", { ascending: false });
      setRemixes(exports || []);

      // Fetch property names for any linked remixes
      const propIds = [...new Set((exports || []).map(e => e.property_id).filter(Boolean))];
      if (propIds.length > 0) {
        const { data: props } = await supabase
          .from("agent_properties")
          .select("id, address")
          .in("id", propIds);
        const map: Record<string, string> = {};
        (props || []).forEach(p => { map[p.id] = p.address; });
        setProperties(map);
      }

      // Check if user has any orders with clips
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .not("clip_urls", "is", null)
        .limit(1);
      setHasOrders((orders || []).length > 0);

      setLoading(false);
    };
    init();
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* View Modal */}
      {viewModal && (() => {
        const dl = viewModal.export_url || viewModal.overlay_video_url;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setViewModal(null)}>
            <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">Video Remix</span>
                  <p className="text-xs text-muted-foreground">{new Date(viewModal.created_at).toLocaleDateString()}</p>
                  {viewModal.property_id && properties[viewModal.property_id] && (
                    <span className="text-xs text-muted-foreground">· {properties[viewModal.property_id]}</span>
                  )}
                </div>
                <button onClick={() => setViewModal(null)} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="bg-black">
                <video src={dl || ""} controls autoPlay playsInline className="w-full max-h-[60vh] object-contain" />
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-border">
                <a href={dl?.includes("/upload/") ? dl.replace("/upload/", "/upload/fl_attachment/") : dl || ""} download className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm px-4 py-2 rounded-full"><Download className="h-3.5 w-3.5" />Download</a>
                <a href={dl || ""} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm px-4 py-2 rounded-full"><ExternalLink className="h-3.5 w-3.5" />Open in New Tab</a>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/lens" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Video Remix</h1>
            <p className="text-muted-foreground mt-0.5">Remix your video clips into social-ready content with music & branding</p>
          </div>
        </div>

        {/* Open Editor CTA */}
        <div className="mt-8 mb-10">
          {hasOrders ? (
            <Link
              href="/dashboard/lens/design-studio"
              className="block rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/15 hover:to-pink-500/15 hover:border-purple-500/50 transition-all p-6 sm:p-8 group"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                  <Film className="h-7 w-7 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-foreground">Open the Remix Editor</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Select clips, arrange your timeline, add music, and export — all in the Design Studio.
                  </p>
                </div>
                <div className="hidden sm:block flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
                    <PenTool className="h-4 w-4" />
                    Open Editor
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
              <Film className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-lg font-bold text-foreground mb-1">No video clips yet</p>
              <p className="text-sm text-muted-foreground mb-4">Order a listing video first — your clips will appear here for remixing.</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                <Link href="/order"><Film className="h-4 w-4 mr-2" />Order a Video</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Remix Library */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-foreground">Your Remixes</h2>
              {remixes.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{remixes.length}</span>
              )}
            </div>
          </div>

          {remixes.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
              <Film className="h-16 w-16 text-muted-foreground/15 mx-auto mb-4" />
              <p className="text-base font-semibold text-muted-foreground mb-1">No remixes yet</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                When you export a video remix from the editor, it will appear here. Remixes linked to a property also show on that property's page.
              </p>
              {hasOrders && (
                <Button asChild variant="outline" className="font-semibold">
                  <Link href="/dashboard/lens/design-studio"><PenTool className="h-4 w-4 mr-2" />Create Your First Remix</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {remixes.map((remix) => {
                const dl = remix.export_url || remix.overlay_video_url;
                let thumb: string | null = null;
                if (dl?.includes("cloudinary.com") && dl.includes("/video/upload/")) {
                  thumb = dl.replace("/video/upload/", "/video/upload/so_1,w_500,h_280,c_fill,f_jpg/").replace(/\.(mp4|mov|webm)$/i, ".jpg");
                }
                const propName = remix.property_id ? properties[remix.property_id] : null;

                return (
                  <div key={remix.id} className="rounded-xl bg-card border border-border overflow-hidden group hover:border-purple-500/40 hover:shadow-lg transition-all">
                    <button onClick={() => setViewModal(remix)} className="block w-full text-left">
                      <div className="aspect-video relative bg-black">
                        {thumb ? (
                          <img src={thumb} alt="Video Remix" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Film className="h-10 w-10 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-14 w-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <Play className="h-6 w-6 text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Video Remix</span>
                        <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">MP4</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{new Date(remix.created_at).toLocaleDateString()}</p>
                      {propName && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          <Link href={`/dashboard/properties/${remix.property_id}`} className="hover:text-accent transition-colors">{propName}</Link>
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
                        <button onClick={() => setViewModal(remix)} className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">Watch</button>
                        <a href={dl?.includes("/upload/") ? dl?.replace("/upload/", "/upload/fl_attachment/") : dl || ""} download className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Download</a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/dashboard/lens" className="hover:text-foreground transition-colors">P2V Lens</Link>
            <Link href="/dashboard/lens/design-studio" className="hover:text-foreground transition-colors">Design Studio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
