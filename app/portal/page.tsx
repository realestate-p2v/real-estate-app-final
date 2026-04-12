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
  Palette,
  Building2,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getPortalData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [listingsRes, statsRes, agentCountRes] = await Promise.all([
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
  ]);

  // Get agent info for each listing
  const userIds = [...new Set((listingsRes.data || []).map((l) => l.user_id))];
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

  // Get photos from orders for these properties
  const propertyIds = (listingsRes.data || []).map((l) => l.id);
  let orderPhotosMap: Record<string, string[]> = {};

  if (propertyIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("property_address, photos")
      .eq("payment_status", "paid")
      .not("photos", "is", null);

    // We'll match by user_id since orders don't have property_id
    // For now, use optimized_photos from agent_properties
  }

  const listings = (listingsRes.data || []).map((l) => ({
    ...l,
    agent: agentMap[l.user_id] || null,
    photos: l.optimized_photos || [],
  }));

  // Count unique cities
  const cities = new Set((listingsRes.data || []).map((l) => l.city).filter(Boolean));

  return {
    listings,
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
  const { listings, totalListings, totalAgents, totalCities } =
    await getPortalData();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.07] via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-white">Find Your</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                Next Home
              </span>
            </h1>
            <p className="mt-5 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              Browse listings with professional videos, virtual staging, and AI-powered marketing — all in one place.
            </p>

            {/* Search bar */}
            <form
              action="/search"
              method="GET"
              className="mt-8 flex items-center gap-2 max-w-lg mx-auto"
            >
              <div className="flex-1 relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/30" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search by address, city, or state..."
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all flex items-center gap-1.5"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {/* Stats */}
            <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalListings}</p>
                <p className="text-white/40 text-xs mt-0.5">Active Listings</p>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalAgents}</p>
                <p className="text-white/40 text-xs mt-0.5">Agents</p>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalCities}</p>
                <p className="text-white/40 text-xs mt-0.5">Cities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Latest Listings
          </h2>
          <Link
            href="/listings"
            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <Building2 className="h-12 w-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/40 text-sm">
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
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-cyan-400/20 hover:bg-white/[0.04] transition-all"
                >
                  {/* Photo */}
                  <div className="aspect-[16/10] bg-gray-900 overflow-hidden relative">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={listing.address || "Property"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white/10" />
                      </div>
                    )}
                    {listing.status && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white/80">
                        {listing.status}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <p className="text-lg font-bold text-white">
                      {formatPrice(listing.price)}
                    </p>
                    <p className="text-sm text-white/50 mt-0.5 truncate">
                      {listing.address}
                    </p>
                    <p className="text-xs text-white/30 truncate">
                      {[listing.city, listing.state, listing.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
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

                    {/* Agent */}
                    {listing.agent && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                        {listing.agent.saved_headshot_url ? (
                          <img
                            src={listing.agent.saved_headshot_url}
                            alt={listing.agent.saved_agent_name || "Agent"}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/40">
                            {(listing.agent.saved_agent_name || "A")[0]}
                          </div>
                        )}
                        <span className="text-xs text-white/40 truncate">
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

      {/* ── For Agents Section ── */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
              For Real Estate Agents
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Turn Your Listing Photos Into Videos, Marketing & Your Own Website
            </h2>
            <p className="mt-4 text-white/40 leading-relaxed">
              P2V is the all-in-one platform for listing marketing. Upload photos, get a cinematic video, then use AI tools to create descriptions, staging, flyers, and more — all feeding your own agent website.
            </p>
          </div>

          {/* Tool cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              {
                icon: Film,
                title: "Listing Videos",
                desc: "Cinematic walkthroughs from $79",
              },
              {
                icon: Sparkles,
                title: "AI Descriptions",
                desc: "MLS-ready in seconds",
              },
              {
                icon: Palette,
                title: "Virtual Staging",
                desc: "Fill empty rooms instantly",
              },
              {
                icon: TrendingUp,
                title: "Agent Website",
                desc: "Your brand, your listings",
              },
            ].map((tool) => (
              <div
                key={tool.title}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
              >
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                  <tool.icon className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="text-sm font-bold text-white">{tool.title}</p>
                <p className="text-xs text-white/40 mt-1">{tool.desc}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://realestatephoto2video.com/order"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all"
            >
              Get Started — Order a Video
            </a>
            <a
              href="https://realestatephoto2video.com/lens"
              className="px-6 py-3 rounded-xl border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white font-medium text-sm transition-all"
            >
              Learn About P2V Lens
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
