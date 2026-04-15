// components/marketing-planner-widget.tsx
// Compact marketing copilot widget — sits on the dashboard
// Greets agent, shows active properties ready for marketing, links to planner
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, Loader2, Sparkles, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface PropertySummary {
  id: string;
  address: string;
  status: string;
  hasPhotos: boolean;
  hasVideo: boolean;
}

interface BrandScore {
  percentage: number;
  grade: string;
}

interface MarketingPlannerWidgetProps {
  isSubscriber: boolean;
  isTrial: boolean;
  scores?: { propertyId: string; propertyAddress: string; percentage: number; grade: string }[];
}

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const firstName = name?.split(" ")[0] || "there";
  return `Good ${time}, ${firstName}`;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  new: "New",
  coming_soon: "Coming Soon",
  sold: "Sold",
  price_reduced: "Price Reduced",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400",
  new: "text-emerald-400",
  coming_soon: "text-amber-400",
  sold: "text-red-400",
  price_reduced: "text-purple-400",
};

export default function MarketingPlannerWidget({ isSubscriber, isTrial }: MarketingPlannerWidgetProps) {
  const [agentName, setAgentName] = useState("");
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [brandScore, setBrandScore] = useState<BrandScore | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      const [profileRes, propsRes, ordersRes, scoreRes] = await Promise.all([
        supabase.from("lens_usage").select("saved_agent_name").eq("user_id", userId).single(),
        supabase
          .from("agent_properties")
          .select("id, address, status")
          .eq("user_id", userId)
          .is("merged_into_id", null)
          .in("status", ["active", "new", "coming_soon", "sold", "price_reduced"])
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("orders")
          .select("property_address, delivery_url, photos")
          .eq("user_id", userId)
          .eq("payment_status", "paid"),
        fetch("/api/planner/score").then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (profileRes.data?.saved_agent_name) setAgentName(profileRes.data.saved_agent_name);

      // Enrich properties with media status
      const orders = ordersRes.data || [];
      const props: PropertySummary[] = (propsRes.data || []).map((p: any) => {
        const pAddr = (p.address || "").toLowerCase();
        const pNum = pAddr.match(/^\d+/)?.[0] || "";
        const pWords = pAddr.replace(/^\d+\s*/, "").split(/[\s,]+/).filter(Boolean);
        const pFirst = pWords[0] || "";

        const matchingOrder = orders.find((o: any) => {
          const oAddr = (o.property_address || "").toLowerCase();
          return pNum && oAddr.includes(pNum) && pFirst && oAddr.includes(pFirst);
        });

        return {
          id: p.id,
          address: p.address,
          status: p.status,
          hasPhotos: !!(matchingOrder?.photos && Array.isArray(matchingOrder.photos) && matchingOrder.photos.length > 0),
          hasVideo: !!matchingOrder?.delivery_url,
        };
      });

      setProperties(props);
      if (scoreRes?.brandScore) setBrandScore(scoreRes.brandScore);
    } catch (err) {
      console.error("Widget load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isSubscriber && !isTrial) return null;

  const greeting = getGreeting(agentName);
  const propertiesWithMedia = properties.filter(p => p.hasPhotos || p.hasVideo);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              {loading ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 text-white/20 animate-spin" />
                  <span className="text-sm text-white/30">Loading your planner...</span>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-bold text-emerald-400/70 uppercase tracking-wider mb-0.5">
                    Lensy · Marketing Planner
                  </p>
                  <p className="text-base font-bold text-white/90">{greeting}</p>
                  <p className="text-sm mt-1 leading-relaxed text-white/50">
                    {propertiesWithMedia.length > 0
                      ? `You have ${propertiesWithMedia.length} ${propertiesWithMedia.length === 1 ? "property" : "properties"} ready to promote — consistent posting builds your brand and attracts more clients!`
                      : properties.length > 0
                      ? "Your properties are waiting for their spotlight — let's create some marketing content!"
                      : "Add a property to get started with your marketing."}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Brand score pill */}
          {!loading && brandScore && (
            <Link
              href="/dashboard/planner"
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              <span className={`text-lg font-black ${
                brandScore.percentage >= 70 ? "text-emerald-400" : brandScore.percentage >= 50 ? "text-amber-400" : "text-red-400"
              }`}>
                {brandScore.grade}
              </span>
              <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Brand</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Properties ── */}
      {!loading && properties.length > 0 && (
        <div className="border-t border-white/[0.05] px-4 py-3">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2.5">
            Your Properties
          </p>
          <div className="space-y-1.5">
            {properties.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href="/dashboard/planner"
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-400/20 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Home className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/80 group-hover:text-white/95 transition-colors truncate">
                      {p.address.split(",")[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold ${STATUS_COLORS[p.status] || "text-gray-400"}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                      {p.hasPhotos && <span className="text-[10px] text-white/20">📷</span>}
                      {p.hasVideo && <span className="text-[10px] text-white/20">🎬</span>}
                      {!p.hasPhotos && !p.hasVideo && (
                        <span className="text-[10px] text-amber-400/50">Needs media</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-emerald-400/60 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="border-t border-white/[0.05] px-4 py-3">
        <Link
          href="/dashboard/planner"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm font-bold hover:bg-emerald-400/15 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Open Marketing Planner
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
