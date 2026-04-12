"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import BookingCalendar from "@/components/booking-calendar";

export default function AgentCalendarPage() {
  const params = useParams();
  const handle = params.handle as string;

  const [agentName, setAgentName] = useState<string>("Agent");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Use .limit(1) instead of .single() to avoid 406 on zero results
      const { data: websites } = await supabase
        .from("agent_websites")
        .select("user_id, site_title, primary_color, status, calendar_enabled")
        .or(`handle.eq.${handle},slug.eq.${handle}`)
        .eq("status", "published")
        .limit(1);

      const website = websites?.[0] || null;

      if (!website || !website.calendar_enabled) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: agents } = await supabase
        .from("lens_usage")
        .select("saved_agent_name")
        .eq("user_id", website.user_id)
        .limit(1);

      setAgentName(agents?.[0]?.saved_agent_name || website.site_title || "Agent");
      setLoading(false);
    }

    load();
  }, [handle]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20 text-gray-400 text-sm">Loading calendar...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20 text-gray-400 text-sm">Calendar is not available.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Book a Showing
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Schedule a time with {agentName}
      </p>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <BookingCalendar />
      </div>
    </div>
  );
}
