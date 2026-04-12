import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

const BookingCalendar = dynamic(() => import("@/components/booking-calendar"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-20 text-gray-400 text-sm">Loading calendar...</div>
  ),
});

interface Props {
  params: Promise<{ handle: string }>;
}

async function getData(handle: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let { data: website } = await supabase
    .from("agent_websites")
    .select("user_id, site_title, primary_color, status, calendar_enabled")
    .eq("handle", handle)
    .eq("status", "published")
    .single();

  if (!website) {
    const { data: bySlug } = await supabase
      .from("agent_websites")
      .select("user_id, site_title, primary_color, status, calendar_enabled")
      .eq("slug", handle)
      .eq("status", "published")
      .single();
    website = bySlug;
  }

  if (!website || !website.calendar_enabled) return null;

  const { data: agent } = await supabase
    .from("lens_usage")
    .select("saved_agent_name")
    .eq("user_id", website.user_id)
    .single();

  return { website, agent };
}

export default async function AgentCalendarPage({ params }: Props) {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) notFound();

  const { website, agent } = data;
  const agentName = agent?.saved_agent_name || website.site_title || "Agent";

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
