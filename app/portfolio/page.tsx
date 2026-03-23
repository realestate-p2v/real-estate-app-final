"use client";

import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video-player";
import { Play, Camera } from "lucide-react";

const SAMPLES = [
  { title: "The Hamlets Community", location: "Nanuet, NY", photos: 28, music: "Afternoon", fileId: "1w-LNUv8lMtMXFLsyMTpNBGoJVLC71vVT", vertical: false },
  { title: "P2V Demo Walkthrough", location: "Rockland County, NY", photos: 15, music: "Upbeat Modern", fileId: "1pTrtAQ9ot7l9Y6yVmVD_U73Qk7kzK-N3", vertical: false },
  { title: "46 Nursery Rd", location: "Tuxedo Park, NY", photos: 12, music: "Energetic", fileId: "1l5L-qJuhDLeojJmFRltgiZmh5qFUs9RY", vertical: false },
  { title: "Home in Costa Rica", location: "Playas del Coco, Guanacaste", photos: 12, music: "Elegant Classical", fileId: "1IR74fE9h0tLFoHd0gCrJ3Brmqf-axZM5", vertical: false },
  { title: "Dionnes 19, For Time Wolfe", location: "Pearl River, NY", photos: 10, music: "Warm Acoustic", fileId: "1B-4iFvPVEZCxH6bHg4n_MzzPdoFSdrvO", vertical: true },
  { title: "Realtor Ad", location: "Marketing Sample", photos: 8, music: "Energetic Pop", fileId: "1OzvlA2We-zsLOV0124QtyzjtxdMdLRDU", vertical: true },
  { title: "UGC Compare", location: "Marketing Sample", photos: 10, music: "Chill Tropical", fileId: "1LEyTP3oWjNuZmUUuTVGflxTzfA3iPmSw", vertical: true },
];

export default function PortfolioPage() {
  const horizontal = SAMPLES.filter(v => !v.vertical);
  const vertical = SAMPLES.filter(v => v.vertical);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Play className="h-4 w-4" />
            Real Client Videos
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">Our Portfolio</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Real examples of listing videos created from photos just like yours. 
            Every video below was built using our service.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            For HD quality, click the gear icon on the video player and select 1080p
          </p>
        </div>

        {/* Horizontal videos */}
        {horizontal.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-bold text-foreground">Landscape Videos</h2>
              <span className="text-sm text-muted-foreground">16:9 · MLS, Zillow, Websites</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-14">
              {horizontal.map((v, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <VideoPlayer
                    url={`https://drive.google.com/file/d/${v.fileId}/view`}
                    className="aspect-video"
                  />
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-foreground">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.location}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{v.photos} photos</span>
                      <span>Music: {v.music}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vertical videos */}
        {vertical.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-bold text-foreground">Vertical Videos</h2>
              <span className="text-sm text-muted-foreground">9:16 · Reels, TikTok, Shorts</span>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-14">
              {vertical.map((v, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <VideoPlayer
                    url={`https://drive.google.com/file/d/${v.fileId}/view`}
                    className="aspect-[9/16]"
                  />
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-foreground">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.location}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{v.photos} photos</span>
                      <span>Music: {v.music}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Want a video like these for your listing?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload your photos, pick your music and branding, and we'll deliver a professional 
            walkthrough video within 24 hours. Packages start at $79.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
              <Link href="/order">Create My Listing Video</Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-6 text-lg">
              <Link href="/resources/photography-guide">Free Photography Guide</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <p className="mt-1">realestatephoto2video.com</p>
        </div>
      </footer>
    </div>
  );
}
