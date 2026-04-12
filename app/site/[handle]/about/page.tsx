import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Phone, Mail, MapPin } from "lucide-react";

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
    .select("*")
    .eq("handle", handle)
    .eq("status", "published")
    .single();

  if (!website) {
    const { data: bySlug } = await supabase
      .from("agent_websites")
      .select("*")
      .eq("slug", handle)
      .eq("status", "published")
      .single();
    website = bySlug;
  }

  if (!website) return null;

  const { data: agent } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url")
    .eq("user_id", website.user_id)
    .single();

  return { website, agent };
}

export default async function AgentAboutPage({ params }: Props) {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) notFound();

  const { website, agent } = data;
  const agentName = agent?.saved_agent_name || website.site_title || "Agent";
  const aboutContent = website.about_content || website.bio;
  const primaryColor = website.primary_color || "#06b6d4";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
          About {agentName}
        </h1>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Photo */}
          {(agent?.saved_headshot_url || website.about_photo_url) && (
            <div className="shrink-0">
              <img
                src={website.about_photo_url || agent?.saved_headshot_url}
                alt={agentName}
                className="h-48 w-48 rounded-2xl object-cover shadow-md"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            {agent?.saved_company && (
              <p className="text-sm font-medium text-gray-400 mb-3">{agent.saved_company}</p>
            )}

            {aboutContent ? (
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {aboutContent}
              </div>
            ) : (
              <p className="text-gray-400">
                Contact {agentName} to learn more about their real estate services.
              </p>
            )}

            {/* Contact info */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
              {agent?.saved_phone && (
                <a href={`tel:${agent.saved_phone}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <Phone className="h-4 w-4" /> {agent.saved_phone}
                </a>
              )}
              {agent?.saved_email && (
                <a href={`mailto:${agent.saved_email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <Mail className="h-4 w-4" /> {agent.saved_email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
