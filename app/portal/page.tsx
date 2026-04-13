import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  Camera,
  Film,
  Sparkles,
  Building2,
  Globe,
  PenTool,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getPortalData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [listingsRes, statsRes, agentCountRes, exampleSitesRes] = await Promise.all([
    supabase
      .from("agent_properties")
      .select(`
        id, address, city, state, zip, price, bedrooms, bathrooms, sqft,
        status, property_type, website_slug, optimized_photos,
        user_id
      `)
      .eq("portal_opt_in", true)
      .eq("website_published", true)
      .is("merged_into_id", null)
      .order("created_at", { ascending: false })
      .limit(12),

    supabase
      .from("agent_properties")
      .select("id", { count: "exact", head: true })
      .eq("portal_opt_in", true)
      .eq("website_published", true)
      .is("merged_into_id", null),

    supabase
      .from("lens_usage")
      .select("id", { count: "exact", head: true })
      .eq("is_subscriber", true),

    // Get published agent websites for the "Explore Live Sites" section
    supabase
      .from("agent_websites")
      .select(`
        id, handle, slug, site_title, tagline, template, primary_color, status, user_id
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const userIds = [...new Set([
    ...(listingsRes.data || []).map((l) => l.user_id),
    ...(exampleSitesRes.data || []).map((s) => s.user_id),
  ])];
  let agentMap: Record<string, any> = {};

  if (userIds.length > 0) {
    const { data: agents } = await supabase
      .from("lens_usage")
      .select("user_id, saved_agent_name, saved_headshot_url, saved_company")
      .in("user_id", userIds);

    if (agents) {
      for (const a of agents) {
        agentMap[a.user_id] = a;
      }
    }
  }

  // Count listings per agent website
  const siteUserIds = (exampleSitesRes.data || []).map((s) => s.user_id);
  let listingCounts: Record<string, number> = {};
  if (siteUserIds.length > 0) {
    for (const uid of siteUserIds) {
      const { count } = await supabase
        .from("agent_properties")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("website_published", true)
        .is("merged_into_id", null);
      listingCounts[uid] = count || 0;
    }
  }

  // ── Enrich listings with photos from orders ──
  const listingUserIds = [...new Set((listingsRes.data || []).map((l) => l.user_id))];
  let orderPhotosMap: Record<string, any[]> = {};
  if (listingUserIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("photos, property_address, user_id")
      .in("user_id", listingUserIds)
      .eq("payment_status", "paid")
      .not("photos", "is", null);

    if (orders) {
      for (const o of orders) {
        if (!orderPhotosMap[o.user_id]) orderPhotosMap[o.user_id] = [];
        orderPhotosMap[o.user_id].push(o);
      }
    }
  }

  const listings = (listingsRes.data || []).map((l) => {
    let photos = l.optimized_photos || [];

    // If optimized_photos is empty, try to match from orders
    if (!photos || !Array.isArray(photos) || photos.length === 0 || !getPhotoUrl(photos)) {
      const userOrders = orderPhotosMap[l.user_id] || [];
      const listingAddr = (l.address || "").toLowerCase().split(",")[0].trim();
      if (listingAddr) {
        const matchedOrder = userOrders.find((o: any) =>
          o.property_address &&
          o.property_address.toLowerCase().includes(listingAddr)
        );
        if (matchedOrder?.photos && Array.isArray(matchedOrder.photos) && matchedOrder.photos.length > 0) {
          photos = matchedOrder.photos;
        }
      }
    }

    return {
      ...l,
      agent: agentMap[l.user_id] || null,
      photos,
    };
  });

  const exampleSites = (exampleSitesRes.data || []).map((s) => ({
    ...s,
    agent: agentMap[s.user_id] || null,
    listingCount: listingCounts[s.user_id] || 0,
  }));

  const cities = new Set((listingsRes.data || []).map((l) => l.city).filter(Boolean));

  return {
    listings,
    exampleSites,
    totalListings: statsRes.count || 0,
    totalAgents: agentCountRes.count || 0,
    totalCities: cities.size,
  };
}

function getPhotoUrl(photos: any): string | null {
  if (!photos) return null;
  if (Array.isArray(photos) && photos.length > 0) {
    const first = photos[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
    if (first?.secure_url) return first.secure_url;
  }
  return null;
}

function formatPrice(price: number | null): string {
  if (!price) return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function PortalHomePage() {
  const { listings, exampleSites, totalListings, totalAgents, totalCities } =
    await getPortalData();

  return (
    <div>
      {/* ── Hero with Video Background ── */}
      <section className="relative overflow-hidden min-h-[520px] sm:min-h-[580px] flex items-center">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/p2v-lens-bg-video.mp4"
        />
        {/* Overlay — light mode: white fade, dark mode: dark fade */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/85" />
        {/* Accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-400/[0.08] dark:bg-cyan-500/[0.06] rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-gray-900 dark:text-white">Find Your</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-500 to-cyan-400 dark:from-cyan-400 dark:to-cyan-300 bg-clip-text text-transparent">
                Next Home
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-500 dark:text-white/50 max-w-xl mx-auto leading-relaxed">
              Browse listings with professional videos, virtual staging, and AI-powered marketing — all in one place.
            </p>

            {/* Search bar */}
            <form
              action="/search"
              method="GET"
              className="mt-8 flex items-center gap-2 max-w-lg mx-auto"
            >
              <div className="flex-1 relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-300 dark:text-white/30" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search by address, city, or state..."
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all shadow-sm dark:shadow-none"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {/* Stats */}
            <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalListings}</p>
                <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">Active Listings</p>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAgents}</p>
                <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">Agents</p>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCities}</p>
                <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">Cities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Latest Listings
          </h2>
          <Link
            href="/listings"
            className="text-sm text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 dark:text-white/20 mb-3" />
            <p className="text-gray-400 dark:text-white/40 text-sm">
              No listings yet — check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => {
              const photoUrl = getPhotoUrl(listing.photos);
              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.website_slug || listing.id}`}
                  className="group rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden hover:border-cyan-300 dark:hover:border-cyan-400/20 hover:shadow-md dark:hover:shadow-none transition-all"
                >
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={listing.address || "Property"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-200 dark:text-white/10" />
                      </div>
                    )}
                    {listing.status && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white">
                        {listing.status}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(listing.price)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5 truncate">
                      {listing.address}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/30 truncate">
                      {[listing.city, listing.state, listing.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400 dark:text-white/40">
                      {listing.bedrooms != null && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {listing.bedrooms} bd
                        </span>
                      )}
                      {listing.bathrooms != null && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          {listing.bathrooms} ba
                        </span>
                      )}
                      {listing.sqft != null && (
                        <span className="flex items-center gap-1">
                          <Maximize className="h-3 w-3" />
                          {listing.sqft.toLocaleString()} sqft
                        </span>
                      )}
                    </div>

                    {listing.agent && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
                        {listing.agent.saved_headshot_url ? (
                          <img
                            src={listing.agent.saved_headshot_url}
                            alt={listing.agent.saved_agent_name || "Agent"}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-white/40">
                            {(listing.agent.saved_agent_name || "A")[0]}
                          </div>
                        )}
                        <span className="text-xs text-gray-400 dark:text-white/40 truncate">
                          {listing.agent.saved_agent_name || "Agent"}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Explore Live Agent Websites ── */}
      <section className="border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-2">
              See It In Action
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Explore Live Agent Websites
            </h2>
            <p className="mt-3 text-gray-500 dark:text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
              These are real agent websites built on P2V. Browse them to see what your site could look like.
            </p>
          </div>

          {exampleSites.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
              <Globe className="h-10 w-10 mx-auto text-gray-300 dark:text-white/20 mb-3" />
              <p className="text-gray-400 dark:text-white/40 text-sm">
                Agent websites coming soon — be one of the first!
              </p>
              <Link
                href="/join"
                className="inline-block mt-3 text-sm text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-medium"
              >
                Build your site →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exampleSites.map((site) => {
                const siteHandle = site.handle || site.slug;
                const siteUrl = siteHandle ? `https://${siteHandle}.p2v.homes` : null;
                const agent = site.agent;

                return (
                  <div
                    key={site.id}
                    className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden hover:border-cyan-300 dark:hover:border-cyan-400/20 hover:shadow-md dark:hover:shadow-none transition-all"
                  >
                    {/* Site preview header bar */}
                    <div
                      className="h-2"
                      style={{ backgroundColor: site.primary_color || "#06b6d4" }}
                    />

                    <div className="p-5">
                      {/* Agent info */}
                      <div className="flex items-center gap-3 mb-3">
                        {agent?.saved_headshot_url ? (
                          <img
                            src={agent.saved_headshot_url}
                            alt={agent.saved_agent_name || "Agent"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-sm font-bold text-gray-400 dark:text-white/30">
                            {(agent?.saved_agent_name || "A")[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">
                            {site.site_title || agent?.saved_agent_name || "Agent Website"}
                          </p>
                          {agent?.saved_company && (
                            <p className="text-xs text-gray-400 dark:text-white/40">
                              {agent.saved_company}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Site details */}
                      {site.tagline && (
                        <p className="text-xs text-gray-500 dark:text-white/50 mb-3 leading-relaxed line-clamp-2">
                          {site.tagline}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/40 mb-4">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {site.listingCount} {site.listingCount === 1 ? "listing" : "listings"}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          {site.template} template
                        </span>
                      </div>

                      {/* CTA */}
                      {siteUrl ? (
                        <a
                          href={siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white/[0.08] hover:bg-gray-800 dark:hover:bg-white/[0.12] text-white text-sm font-medium transition-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Visit Live Site
                        </a>
                      ) : (
                        <span className="block text-center py-2.5 text-xs text-gray-400 dark:text-white/30">
                          Setting up...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all"
            >
              Build Your Own Agent Website
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── For Agents Section ── */}
      <section className="border-t border-gray-200 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-3">
              For Real Estate Agents
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Your Professional Agent Website — Built in Minutes
            </h2>
            <p className="mt-4 text-gray-500 dark:text-white/40 leading-relaxed">
              Get your own branded website with listings, blog, contact forms, and booking calendar. Add your own photos, descriptions, and content — or supercharge it with AI tools and listing videos.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              {
                icon: Globe,
                title: "Agent Website",
                desc: "Your brand, your listings, your domain",
              },
              {
                icon: PenTool,
                title: "Blog & Content",
                desc: "Write posts or generate with AI",
              },
              {
                icon: Sparkles,
                title: "AI Marketing",
                desc: "Descriptions, staging, flyers & more",
              },
              {
                icon: Film,
                title: "Listing Videos",
                desc: "Add cinematic walkthroughs from $79",
              },
            ].map((tool) => (
              <div
                key={tool.title}
                className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 text-center"
              >
                <div className="h-10 w-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                  <tool.icon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{tool.title}</p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-1">{tool.desc}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/join"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all"
            >
              Build Your Agent Website
            </Link>
            <a
              href="https://realestatephoto2video.com/order"
              className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white font-medium text-sm transition-all"
            >
              Or Start With a Listing Video
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
