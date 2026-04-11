"use client";

import { useState, useEffect } from "react";
import DroneMark from "./DroneMark";

export default function DroneMarkPage() {
  const [agentLogo, setAgentLogo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("lens_usage")
          .select("saved_logo_url")
          .eq("user_id", user.id)
          .single();
        if (data?.saved_logo_url) setAgentLogo(data.saved_logo_url);
      } catch (err) {
        console.error("Failed to load agent logo:", err);
      }
    })();
  }, []);

  return <DroneMark agentLogo={agentLogo} />;
}
