"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import PhotoOptimizer from "./PhotoOptimizer";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

export default function PhotoOptimizerPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLensSubscriber, setIsLensSubscriber] = useState(false);
  const [gateType, setGateType] = useState<"buy_video" | "subscribe" | "upgrade_pro">("buy_video");

  useEffect(() => {
    (async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setIsLoading(false); return; }
        const authUser = session.user;
        setUser(authUser);

        if (authUser.email && ADMIN_EMAILS.includes(authUser.email)) {
          setIsLensSubscriber(true);
        } else {
          const [usageRes, orderRes] = await Promise.all([
            supabase.from("lens_usage").select("is_subscriber, subscription_tier, trial_expires_at").eq("user_id", authUser.id).single(),
            supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", authUser.id).eq("payment_status", "paid"),
          ]);
          const usage = usageRes.data;
          const hasPaid = (orderRes.count || 0) > 0;
          const isSub = usage?.is_subscriber;
          const hasActiveTrial = usage?.trial_expires_at && new Date(usage.trial_expires_at) > new Date();
          if (isSub || hasActiveTrial) {
            setIsLensSubscriber(true);
          } else {
            setGateType(hasPaid ? "subscribe" : "buy_video");
          }
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="text-white/60 text-sm">Sign in to access Photo Optimizer</p>
        </div>
      </div>
    );
  }

  return <PhotoOptimizer userId={user.id} isLensSubscriber={isLensSubscriber} gateType={gateType} />;
}
