// components/marketing-planner-widget.tsx
// Streamlined dashboard copilot — matches the new planner flow
// Shows greeting, active properties needing marketing, quick action to open planner
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, Loader2, Sparkles, ChevronRight, Home, Image as ImageIcon, Share2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string;
  address: string;
  city?: string;
  state?: string;
  status: string;
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
  return `Good ${time}, ${firstName}!`;
}

export default function MarketingPlannerWidget({ isSubscriber, isTrial }: MarketingPlannerWidgetProps) {
  const [agentName, setAgentName] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [brandScore, setBrandScore] = useState<BrandScore | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [profileRes, propsRes] = await Promise.all([
        supabase.from("lens_usage").select("saved_agent_name").eq("user_id", session.user.id).single(),
        supabase
          .from("agent_properties")
          .select("id, address, city, state, status")
          .eq("user_id", session.user.id)
          .is("merged_into_id", null)
          .in("status", ["active", "new", "coming_soon", "price_reduced"])
          .order("updated_at", { ascending: false })
          .limit(3),
      ]);

      if (profileRes.data?.saved_agent_name) setAgentName(profileRes.data.saved_agent_name);
      setProperties(propsRes.data || []);

      // Get brand score
      try {
        const res = await fetch("/api/planner/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentName: profileRes.data?.saved_agent_name || "Agent" }),
        });
        if (res.ok) {
          const data = await res.json();
          setBrandScore(data.brandScore || null);
        }
      } catch {}
    } catch (err) {
      console.error("Widget load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isSubscriber && !isTrial) return null;

  const greeting = getGreeting(agentName);
  const propertyCount = properties.length;

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
                    {propertyCount > 0
                      ? `You have ${propertyCount} active ${propertyCount === 1 ? "listing" : "listings"} ready for marketing. Pick one and create a post in seconds!`
                      : "Your marketing hub is ready — add a property to start creating content that builds your brand."}
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
                brandScore.percentage >= 70 ? "text-emerald-400" :
                brandScore.percentage >= 50 ? "text-amber-400" : "text-red-400"
              }`}>
                {brandScore.grade}
              </span>
              <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Brand</span>
            </Link>
          )}
        </div>

        {/* Property quick-picks */}
        {!loading && properties.length > 0 && (
          <div className="mt-4 space-y-2">
            {properties.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href="/dashboard/planner"
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-blue-400/20 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
                    <Home className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/80 group-hover:text-white/95 transition-colors truncate">
                      {p.address}
                    </p>
                    <p className="text-[11px] text-white/30 truncate">
                      {[p.city, p.state].filter(Boolean).join(", ")} · Create a post
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/15 group-hover:text-blue-400/60 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div className="border-t border-white/[0.05] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-white/20" />
            <span className="text-xs text-white/35">Select → Generate → Share</span>
          </div>
        </div>
        <Link
          href="/dashboard/planner"
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400/80 hover:text-emerald-400 transition-colors"
        >
          Open Planner <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
