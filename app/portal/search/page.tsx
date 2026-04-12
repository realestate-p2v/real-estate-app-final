import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Search, MapPin, Bed, Bath, Maximize, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

async function searchListings(query: string) {
  if (!query || query.trim().length < 2) return [];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const q = query.trim();

  const { data } = await supabase
    .from("agent_properties")
    .select(
      `id, address, city, state, zip, price, bedrooms, bathrooms, sqft,
       status, website_slug, optimized_photos, user_id`
    )
    .eq("portal_opt_in", true)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .or(
      `address.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,zip.ilike.%${q}%`
    )
    .order("created_at", { ascending: false })
    .limit(40);

  const listings = data || [];

  // Get agent info
  const userIds = [...new Set(listings.map((l) => l.user_id))];
  let agentMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: agents } = await supabase
      .from("lens_usage")
      .select("user_id, saved_agent_name, saved_headshot_url")
      .in("user_id", userIds);
    if (agents) {
      for (const a of agents) agentMap[a.user_id] = a;
    }
  }

  return listings.map((l) => ({ ...l, agent: agentMap[l.user_id] || null }));
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

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || "";
  const results = await searchListings(query);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
        Search Listings
      </h1>

      {/* Search form */}
      <form action="/search" method="GET" className="flex items-center gap-2 mb-8 max-w-lg">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by address, city, or state..."
            autoFocus
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Results */}
      {query && (
        <p className="text-sm text-white/40 mb-4">
          {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
        </p>
      )}

      {query && results.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Search className="h-12 w-12 mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            No listings found for &ldquo;{query}&rdquo;
          </p>
          <Link
            href="/listings"
            className="inline-block mt-3 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Browse all listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((listing) => {
            const photoUrl = getPhotoUrl(listing.optimized_photos);
            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.website_slug || listing.id}`}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-cyan-400/20 hover:bg-white/[0.04] transition-all"
              >
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
                </div>
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
                        <Bed className="h-3 w-3" /> {listing.bedrooms} bd
                      </span>
                    )}
                    {listing.bathrooms != null && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3 w-3" /> {listing.bathrooms} ba
                      </span>
                    )}
                    {listing.sqft != null && (
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3 w-3" />{" "}
                        {listing.sqft.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {listing.agent && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                      {listing.agent.saved_headshot_url ? (
                        <img
                          src={listing.agent.saved_headshot_url}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px] font-bold text-white/40">
                          {(listing.agent.saved_agent_name || "A")[0]}
                        </div>
                      )}
                      <span className="text-xs text-white/40 truncate">
                        {listing.agent.saved_agent_name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
