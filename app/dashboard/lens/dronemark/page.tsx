"use client";

import { useState, useEffect } from "react";
import DroneMark from "./DroneMark";

export default function DroneMarkPage() {
  const [agentLogo, setAgentLogo] = useState<string | null>(null);
  const [isLensSubscriber, setIsLensSubscriber] = useState(false);
  const [gateType, setGateType] = useState<"buy_video" | "subscribe" | "upgrade_pro">("buy_video");

  useEffect(() => {
    (async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const user = session.user;

        const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
        if (user.email && ADMIN_EMAILS.includes(user.email)) {
          setIsLensSubscriber(true);
        }

        const [usageRes, orderRes] = await Promise.all([
          supabase
            .from("lens_usage")
            .select("saved_logo_url, is_subscriber, subscription_tier, trial_expires_at")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("payment_status", "paid"),
        ]);

        const usage = usageRes.data;
        if (usage?.saved_logo_url) setAgentLogo(usage.saved_logo_url);

        const hasPaid = (orderRes.count || 0) > 0;
        const isSub = usage?.is_subscriber;
        const hasActiveTrial = usage?.trial_expires_at && new Date(usage.trial_expires_at) > new Date();

        if (isSub || hasActiveTrial || (user.email && ADMIN_EMAILS.includes(user.email))) {
          setIsLensSubscriber(true);
        } else {
          setGateType(hasPaid ? "subscribe" : "buy_video");
        }
      } catch (err) {
        console.error("Failed to load agent data:", err);
      }
    })();
  }, []);

  return <DroneMark agentLogo={agentLogo} isLensSubscriber={isLensSubscriber} gateType={gateType} />;
}
