"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, Eye, Mail, TrendingUp, Calendar,
  Loader2, User,
} from "lucide-react";

interface Inquiry {
  id: string;
  from_name: string;
  from_email: string;
  message: string;
  created_at: string;
}

export default function DirectoryAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [viewCount, setViewCount] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [listingDate, setListingDate] = useState<string | null>(null);
  const [hasListing, setHasListing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get photographer listing
      const meRes = await fetch("/api/directory/me");
      const meData = await meRes.json();

      if (!meData.success || !meData.photographer) {
        setHasListing(false);
        setLoading(false);
        return;
      }

      setHasListing(true);
      setViewCount(meData.photographer.view_count || 0);
      setListingDate(meData.photographer.created_at);

      // Get inquiries
      const inqRes = await fetch("/api/directory/analytics");
      const inqData = await inqRes.json();
      if (inqData.success) {
        setInquiries(inqData.inquiries || []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const daysSinceListing = listingDate
    ? Math.floor((Date.now() - new Date(listingDate).getTime()) / 86400000)
    : 0;

  const thisMonthInquiries = inquiries.filter((inq) => {
    const d = new Date(inq.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

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

  if (!hasListing) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">No Directory Listing Found</h1>
          <p className="text-muted-foreground mb-6">Join the photographer directory to start tracking your analytics.</p>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/directory/join">Join the Directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Directory Analytics</h1>
            <p className="text-sm text-muted-foreground">See how realtors are finding and contacting you</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{viewCount}</p>
            <p className="text-xs text-muted-foreground">Profile Views</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Mail className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{inquiries.length}</p>
            <p className="text-xs text-muted-foreground">Total Inquiries</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{thisMonthInquiries.length}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{daysSinceListing}</p>
            <p className="text-xs text-muted-foreground">Days Listed</p>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Inquiries ({inquiries.length})
          </h2>
          {inquiries.length === 0 ? (
            <div className="text-center py-10">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No inquiries yet. As realtors discover your listing, their messages will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{inq.from_name}</p>
                        <a href={`mailto:${inq.from_email}`} className="text-xs text-primary hover:underline">
                          {inq.from_email}
                        </a>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(inq.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {inq.message && (
                    <p className="text-sm text-muted-foreground mt-3 pl-12">{inq.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-muted/30 rounded-2xl border border-border p-6 mt-6">
          <h3 className="font-bold text-foreground mb-3">Tips to Get More Inquiries</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Add a professional headshot — listings with photos get 3x more clicks</p>
            <p>• Fill out all specialties — realtors filter by specialty when searching</p>
            <p>• Add your Instagram and portfolio links — social proof builds trust</p>
            <p>• Write a detailed bio mentioning your market and experience</p>
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/directory/edit">Edit My Listing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
