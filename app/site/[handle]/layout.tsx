import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cloudinaryUrl } from "@/lib/cloudinary-url";

async function getWebsiteData(handle: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Try handle first, fall back to slug
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

  // Get agent info
  const { data: agent } = await supabase
    .from("lens_usage")
    .select(
      "saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url, saved_logo_url"
    )
    .eq("user_id", website.user_id)
    .single();

  return { website, agent };
}

export default async function AgentSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getWebsiteData(handle);

  if (!data) return notFound();

  const { website, agent } = data;
  const agentName = agent?.saved_agent_name || website.site_title || "Agent";
  const siteTitle = website.site_title || agentName;
  const primaryColor = website.primary_color || "#06b6d4";

  // Fix Cloudinary URLs for cross-domain delivery
  const headshotUrl = cloudinaryUrl(agent?.saved_headshot_url);
  const logoUrl = cloudinaryUrl(agent?.saved_logo_url);

  const navLinks = [
    { href: `/`, label: "Home" },
    { href: `/about`, label: "About" },
    { href: `/listings`, label: "Listings" },
  ];

  if (website.blog_enabled) {
    navLinks.push({ href: `/blog`, label: "Blog" });
  }

  navLinks.push({ href: `/contact`, label: "Contact" });

  if (website.calendar_enabled) {
    navLinks.push({ href: `/calendar`, label: "Calendar" });
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Name */}
            <Link href="/" className="flex items-center gap-2.5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteTitle}
                  className="h-8 w-auto max-w-[120px] object-contain"
                />
              ) : headshotUrl ? (
                <img
                  src={headshotUrl}
                  alt={agentName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agentName[0]}
                </div>
              )}
              <span className="text-base font-bold text-gray-900 tracking-tight">
                {siteTitle}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile nav — simple links */}
            <div className="sm:hidden flex items-center gap-2">
              <Link href="/listings" className="px-2 py-1 text-xs font-medium text-gray-500">
                Listings
              </Link>
              <Link href="/contact" className="px-2 py-1 text-xs font-medium text-gray-500">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-gray-900">{agentName}</p>
              {agent?.saved_company && (
                <p className="text-xs text-gray-400 mt-0.5">{agent.saved_company}</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {agent?.saved_phone && (
                <a href={`tel:${agent.saved_phone}`} className="hover:text-gray-600 transition-colors">
                  {agent.saved_phone}
                </a>
              )}
              {agent?.saved_email && (
                <a href={`mailto:${agent.saved_email}`} className="hover:text-gray-600 transition-colors">
                  {agent.saved_email}
                </a>
              )}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-gray-300">
              © {new Date().getFullYear()} {agentName}. All rights reserved.
            </p>
            <a
              href="https://realestatephoto2video.com"
              className="text-[11px] text-gray-300 hover:text-gray-400 transition-colors"
            >
              Powered by Realestatephoto2video.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
