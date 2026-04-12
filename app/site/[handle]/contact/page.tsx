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
    .select("user_id, site_title, primary_color, status")
    .eq("handle", handle)
    .eq("status", "published")
    .single();

  if (!website) {
    const { data: bySlug } = await supabase
      .from("agent_websites")
      .select("user_id, site_title, primary_color, status")
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

export default async function AgentContactPage({ params }: Props) {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) notFound();

  const { website, agent } = data;
  const agentName = agent?.saved_agent_name || website.site_title || "Agent";
  const primaryColor = website.primary_color || "#06b6d4";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
          Get in Touch
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Reach out to {agentName} — happy to help with any questions.
        </p>

        {/* Contact info */}
        <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-500">
          {agent?.saved_phone && (
            <a href={`tel:${agent.saved_phone}`} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <Phone className="h-4 w-4" /> {agent.saved_phone}
            </a>
          )}
          {agent?.saved_email && (
            <a href={`mailto:${agent.saved_email}`} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <Mail className="h-4 w-4" /> {agent.saved_email}
            </a>
          )}
        </div>

        {/* Contact form */}
        <form action="/api/websites/contact" method="POST" className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
          <input type="hidden" name="agent_user_id" value={website.user_id} />

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
            <input type="text" name="name" required className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors" placeholder="Your full name" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
            <input type="email" name="email" required className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors" placeholder="your@email.com" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone (optional)</label>
            <input type="tel" name="phone" className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors" placeholder="(555) 123-4567" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Interested in a property?</label>
            <input type="text" name="property_interest" className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors" placeholder="Property address or type (optional)" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
            <textarea name="message" rows={4} required className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:border-gray-300 transition-colors" placeholder="How can I help you?" />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90 shadow-sm hover:shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
