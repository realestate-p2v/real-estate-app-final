import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface Props {
  params: Promise<{ handle: string }>;
}

interface FaqItem {
  question: string;
  answer: string;
}

async function getData(handle: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let { data: website } = await supabase
    .from("agent_websites")
    .select("user_id, site_title, primary_color, status, faq_items")
    .eq("handle", handle)
    .eq("status", "published")
    .single();

  if (!website) {
    const { data: bySlug } = await supabase
      .from("agent_websites")
      .select("user_id, site_title, primary_color, status, faq_items")
      .eq("slug", handle)
      .eq("status", "published")
      .single();
    website = bySlug;
  }

  if (!website) return null;

  const { data: agent } = await supabase
    .from("lens_usage")
    .select("saved_agent_name")
    .eq("user_id", website.user_id)
    .single();

  // Parse FAQ items
  let faqItems: FaqItem[] = [];
  if (website.faq_items) {
    if (Array.isArray(website.faq_items)) {
      faqItems = website.faq_items;
    }
  }

  return { website, agent, faqItems };
}

export default async function AgentFaqPage({ params }: Props) {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) notFound();

  const { website, agent, faqItems } = data;
  const agentName = agent?.saved_agent_name || website.site_title || "Agent";
  const primaryColor = website.primary_color || "#06b6d4";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Common questions about working with {agentName}
      </p>

      {faqItems.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-gray-100 bg-gray-50">
          <p className="text-gray-400 text-sm mb-3">No FAQs yet.</p>
          <Link
            href="/contact"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: primaryColor }}
          >
            Have a question? Get in touch →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-gray-100 bg-white overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold text-gray-900 pr-4">
                  {item.question}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
                <p className="pt-3">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-10 text-center">
        <p className="text-sm text-gray-400 mb-3">
          Don&apos;t see your question?
        </p>
        <Link
          href="/contact"
          className="inline-block px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Contact {agentName}
        </Link>
      </div>
    </div>
  );
}
