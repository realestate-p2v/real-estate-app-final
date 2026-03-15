"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Play,
  Loader2,
  ExternalLink,
  Instagram,
  Youtube,
  Facebook,
  Globe,
  BookOpen,
  Camera,
  Sparkles,
} from "lucide-react";

interface ContentVideo {
  id: string;
  title: string;
  hook: string;
  drive_url: string;
  platforms: Record<string, { posted: boolean; url: string; views: number }>;
  created_at: string;
}

function getFileIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

const SOCIALS = [
  {
    key: "instagram",
    label: "Instagram",
    handle: "@realestatephoto2video",
    url: "https://www.instagram.com/realestatephoto2video/",
    icon: Instagram,
    color: "from-purple-500 to-pink-500",
    hoverBg: "hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10",
  },
  {
    key: "tiktok",
    label: "TikTok",
    handle: "@realestatephoto2video",
    url: "https://www.tiktok.com/@realestatephoto2video",
    icon: Globe,
    color: "from-gray-900 to-gray-700",
    hoverBg: "hover:bg-gray-500/10",
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@RealEstatePhoto2Video",
    url: "https://www.youtube.com/@RealEstatePhoto2Video",
    icon: Youtube,
    color: "from-red-500 to-red-600",
    hoverBg: "hover:bg-red-500/10",
  },
  {
    key: "facebook",
    label: "Facebook",
    handle: "Real Estate Photo 2 Video",
    url: "https://www.facebook.com/profile.php?id=61587039633673",
    icon: Facebook,
    color: "from-blue-500 to-blue-600",
    hoverBg: "hover:bg-blue-500/10",
  },
];

export default function TipsPage() {
  const [videos, setVideos] = useState<ContentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/tips");
      const data = await res.json();
      if (data.success) setVideos(data.videos || []);
    } catch (err) {
      console.error("Failed to fetch tips videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Camera className="h-4 w-4" />
            <span className="text-sm font-medium">Free Real Estate Photo Tips</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            DIY Photo Tips
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto mb-8">
            Short, actionable video tips to help you take better listing photos with your phone.
            New tips every week — follow us for more.
          </p>

          {/* Social Follow Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.key}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {social.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">

        {/* Follow Banner */}
        <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl border border-accent/20 p-6 mb-12 text-center">
          <Sparkles className="h-6 w-6 text-accent mx-auto mb-2" />
          <h2 className="text-lg font-bold text-foreground mb-1">Follow for more tips</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We post new real estate photography tips every week across all platforms
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.key}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground transition-colors ${social.hoverBg}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{social.handle}</span>
                  <span className="sm:hidden">{social.label}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Camera className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Videos coming soon!</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We're creating short-form video tips to help you take stunning listing photos.
              Follow us on social media to be the first to see them.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {SOCIALS.slice(0, 2).map((social) => {
                const Icon = social.icon;
                return (
                  <Button key={social.key} asChild variant="outline">
                    <a href={social.url} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-4 w-4 mr-2" />
                      Follow on {social.label}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const fileId = getFileIdFromUrl(video.drive_url);
              const isPlaying = playingVideo === video.id;

              // Get platform links
              const platformLinks = Object.entries(video.platforms || {})
                .filter(([_, p]: [string, any]) => p?.posted && p?.url)
                .map(([key, p]: [string, any]) => ({ key, url: p.url }));

              return (
                <div
                  key={video.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  {/* Video Preview / Player */}
                  <div className="aspect-[9/16] bg-black relative">
                    {isPlaying && fileId ? (
                      <iframe
                        src={`https://drive.google.com/file/d/${fileId}/preview`}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        onClick={() => setPlayingVideo(video.id)}
                        className="w-full h-full flex items-center justify-center bg-gradient-to-b from-primary/80 to-primary hover:from-primary/90 hover:to-primary transition-colors"
                      >
                        <div className="text-center px-6">
                          <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Play className="h-7 w-7 text-white ml-1" />
                          </div>
                          <h3 className="text-white font-bold text-lg leading-snug mb-2">
                            {video.title}
                          </h3>
                          <p className="text-white/60 text-sm">
                            {video.hook}
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-3">{formatDate(video.created_at)}</p>

                    {/* Platform Links */}
                    {platformLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {platformLinks.map(({ key, url }) => {
                          const social = SOCIALS.find(s => s.key === key);
                          const Icon = social?.icon || Globe;
                          return (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Icon className="h-3 w-3" />
                              {social?.label || key}
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* Watch on Drive Link */}
                    {video.drive_url && (
                      <a
                        href={video.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Watch full video
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA Section */}
        <div className="mt-16 grid sm:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">Free Photography Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">
              32-page guide with camera settings, lighting, staging, and drone tips for real estate agents.
            </p>
            <Button asChild>
              <Link href="/resources/photography-guide">
                Download Free Guide
              </Link>
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Play className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">Turn Photos Into Videos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Professional walkthrough videos from your listing photos. Starting at $79, delivered in 24 hours.
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/order">
                Create My Video
              </Link>
            </Button>
          </div>
        </div>

        {/* Final Follow CTA */}
        <div className="mt-12 text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">Follow us for weekly real estate photo tips</p>
          <div className="flex justify-center gap-4">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.key}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title={social.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
