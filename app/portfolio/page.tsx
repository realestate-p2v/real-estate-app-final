import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Portfolio | Real Estate Photo 2 Video",
  description: "See examples of our professional real estate walkthrough videos.",
};

const SAMPLES = [
  { title: "P2V Demo Walkthrough", location: "Sample Listing", photos: 15, music: "Upbeat Modern", url: "https://drive.google.com/file/d/1pTrtAQ9ot7l9Y6yVmVD_U73Qk7kzK-N3/preview" },
  { title: "Lisa Green Mystery Listing", location: "Featured Property", photos: 12, music: "Elegant Classical", url: "https://drive.google.com/file/d/1IR74fE9h0tLFoHd0gCrJ3Brmqf-axZM5/preview" },
  { title: "Wolfe P2V Dionnes 19", location: "Featured Property", photos: 10, music: "Warm Acoustic", url: "https://drive.google.com/file/d/1B-4iFvPVEZCxH6bHg4n_MzzPdoFSdrvO/preview" },
  { title: "Realtor Ad", location: "Marketing Sample", photos: 8, music: "Energetic Pop", url: "https://drive.google.com/file/d/1OzvlA2We-zsLOV0124QtyzjtxdMdLRDU/preview" },
  { title: "UGC Compare", location: "Marketing Sample", photos: 10, music: "Chill Tropical", url: "https://drive.google.com/file/d/1LEyTP3oWjNuZmUUuTVGflxTzfA3iPmSw/preview" },
];

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold">Our Portfolio</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Real examples of listing videos created from photos just like yours.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {SAMPLES.map((v, i) => (
            <div key={i} className="bg-card rounded-2xl border overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                <a href={v.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <div className="aspect-video bg-muted">
                      <iframe
                        src={v.url}
                        className="w-full h-full"
                        allow="autoplay"
                        allowFullScreen
                       />
                    </div>
                  </div>
                </a>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.location}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{v.photos} photos</span>
                  <span>Music: {v.music}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/order">
            <Button size="lg" className="bg-accent text-lg px-8 py-6">
              Create My Listing Video
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
