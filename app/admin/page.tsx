"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  FileText, Video, PenLine, BarChart3, Users, Mail,
  Settings, Shield, Sparkles, ExternalLink, Clock,
  CheckCircle2, AlertCircle, Loader2, Star, Camera
} from "lucide-react";

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function AdminPage() {
  const [blogCount, setBlogCount] = useState<number | null>(null);
  const [contentCount, setContentCount] = useState<number | null>(null);
  const [lensWaitlistCount, setLensWaitlistCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [blogRes, contentRes, lensRes] = await Promise.allSettled([
          fetch("/api/admin/blog").then(r => r.json()),
          fetch("/api/admin/content").then(r => r.json()),
          fetch("/api/admin/lens").then(r => r.json()),
        ]);
        if (blogRes.status === "fulfilled" && blogRes.value.success) {
          setBlogCount(blogRes.value.posts?.length || 0);
        }
        if (contentRes.status === "fulfilled" && contentRes.value.success) {
          setContentCount(contentRes.value.videos?.length || 0);
        }
        if (lensRes.status === "fulfilled" && lensRes.value.success) {
          setLensWaitlistCount(lensRes.value.waitlist?.total || 0);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const adminTools = [
    {
      title: "P2V Lens Monitor",
      description: "Waitlist signups, subscriber metrics, photo analyses, revenue, and conversion funnel",
      href: "/admin/lens",
      icon: <Camera className="h-6 w-6" />,
      color: "bg-cyan-500/10 text-cyan-600",
      stat: lensWaitlistCount !== null ? `${lensWaitlistCount} waitlist` : null,
      status: "live" as const,
    },
    {
      title: "Order Management",
      description: "View all orders, approve videos, review revision requests, manage the pipeline",
      href: "/admin/orders",
      icon: <FileText className="h-6 w-6" />,
      color: "bg-emerald-500/10 text-emerald-600",
      stat: null,
      status: "live" as const,
    },
    {
      title: "Blog Manager",
      description: "Create AI-generated SEO blog posts, manage drafts, publish articles with Pexels images",
      href: "/admin/blog",
      icon: <PenLine className="h-6 w-6" />,
      color: "bg-blue-500/10 text-blue-600",
      stat: blogCount !== null ? `${blogCount} posts` : null,
      status: "live" as const,
    },
    {
      title: "Content Studio",
      description: "Generate marketing videos with AI scripts, Pexels footage, voiceover, and platform tracking",
      href: "/admin/content",
      icon: <Video className="h-6 w-6" />,
      color: "bg-purple-500/10 text-purple-600",
      stat: contentCount !== null ? `${contentCount} videos` : null,
      status: "live" as const,
    },
    {
      title: "Review Verification",
      description: "Approve or reject customer review screenshots, manage discount rewards",
      href: "/admin/reviews",
      icon: <Star className="h-6 w-6" />,
      color: "bg-amber-500/10 text-amber-600",
      stat: null,
      status: "live" as const,
    },
    {
      title: "Analytics Dashboard",
      description: "Revenue, orders, pipeline health, customer metrics, traffic sources",
      href: "#",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "bg-amber-500/10 text-amber-600",
      stat: null,
      status: "coming" as const,
    },
    {
      title: "Customer Management",
      description: "Customer list, order history, brokerage accounts, photographer partners",
      href: "#",
      icon: <Users className="h-6 w-6" />,
      color: "bg-pink-500/10 text-pink-600",
      stat: null,
      status: "coming" as const,
    },
    {
      title: "Marketing Mission Control",
      description: "Cold email dashboard, social tracker, ad performance, SEO rankings, lead pipeline",
      href: "#",
      icon: <Mail className="h-6 w-6" />,
      color: "bg-indigo-500/10 text-indigo-600",
      stat: null,
      status: "coming" as const,
    },
  ];

  const quickLinks = [
    { label: "View Live Site", href: "/", icon: <ExternalLink className="h-4 w-4" /> },
    { label: "View P2V Lens", href: "/lens", icon: <Camera className="h-4 w-4" /> },
    { label: "View Blog", href: "/blog", icon: <PenLine className="h-4 w-4" /> },
    { label: "View Portfolio", href: "/portfolio", icon: <Video className="h-4 w-4" /> },
    { label: "View Directory", href: "/directory", icon: <Users className="h-4 w-4" /> },
    { label: "Supabase Dashboard", href: "https://supabase.com/dashboard", icon: <Settings className="h-4 w-4" /> },
    { label: "Vercel Dashboard", href: "https://vercel.com/dashboard", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Real Estate Photo 2 Video — Control Center</p>
          </div>
        </div>

        {/* Quick Links Bar */}
        <div className="flex flex-wrap gap-2 mt-6 mb-10">
          {quickLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminTools.map((tool, i) => (
            <div key={i} className="relative">
              {tool.status === "live" ? (
                <Link
                  href={tool.href}
                  className="block bg-card rounded-2xl border border-border p-6 hover:border-accent/40 hover:shadow-lg transition-all duration-300 group h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${tool.color}`}>
                      {tool.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      {tool.stat && !loading && (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {tool.stat}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Live
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors mb-1">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                </Link>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-6 opacity-60 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${tool.color}`}>
                      {tool.icon}
                    </div>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* System Info */}
        <div className="mt-10 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">System Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Server</p>
              <p className="font-medium text-foreground">134.209.39.83</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Pipeline</p>
              <p className="font-medium text-foreground">p2v-pipeline (systemd)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Content Pipeline</p>
              <p className="font-medium text-foreground">p2v-content (systemd)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Cold Email Domain</p>
              <p className="font-medium text-foreground">p2vmail.com (warming)</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
