import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Camera,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { cloudinaryUrl, cloudinaryThumb } from "@/lib/cloudinary-url";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{
    page?: string;
    city?: string;
    state?: string;
    minPrice?: string;
    maxPrice?: string;
    beds?: string;
    baths?: string;
    sort?: string;
    status?: string;
  }>;
}

async function getListings(params: Record<string, string | undefined>) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const page = parseInt(params.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("agent_properties")
    .select(
      `id, address, city, state, zip, price, bedrooms, bathrooms, sqft,
       status, property_type, website_slug, optimized_photos, user_id`,
      { count: "exact" }
    )
    .eq("portal_opt_in", true)
    .eq("website_published", true)
    .is("merged_into_id", null);

  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.state) query = query.ilike("state", `%${params.state}%`);
  if (params.minPrice) query = query.gte("price", parseInt(params.minPrice));
  if (params.maxPrice) query = query.lte("price", parseInt(params.maxPrice));
  if (params.beds) query = query.gte("bedrooms", parseInt(params.beds));
  if (params.baths) query = query.gte("bathrooms", parseInt(params.baths));
  if (params.status) query = query.eq("status", params.status);

  // Sort
  const sort = params.sort || "newest";
  if (sort === "price_asc") {
    query = query.order("price", { ascending: true, nullsFirst: false });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data, count } = await query;
  const listings = data || [];

  // Get agent info
  const userIds = [...new Set(listings.map((l) => l.user_id))];
  let agentMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: agents } = await supabase
      .from("lens_usage")
      .select("user_id, saved_agent_name, saved_headshot_url, saved_company")
      .in("user_id", userIds);
    if (agents) {
      for (const a of agents) agentMap[a.user_id] = {
        ...a,
        saved_headshot_url: cloudinaryUrl(a.saved_headshot_url),
      };
    }
  }

  // ── Enrich listings with photos from orders ──
  let orderPhotosMap: Record<string, any[]> = {};
  if (userIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("photos, property_address, user_id")
      .in("user_id", userIds)
      .eq("payment_status", "paid")
      .not("photos", "is", null);

    if (orders) {
      for (const o of orders) {
        if (!orderPhotosMap[o.user_id]) orderPhotosMap[o.user_id] = [];
        orderPhotosMap[o.user_id].push(o);
      }
    }
  }

  return {
    listings: listings.map((l) => {
      let photos = l.optimized_photos;

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

      return { ...l, optimized_photos: photos, agent: agentMap[l.user_id] || null };
    }),
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  };
}

function getPhotoUrl(photos: any): string | null {
  if (!photos) return null;
  if (Array.isArray(photos) && photos.length > 0) {
    const first = photos[0];
    let url: string | null = null;
    if (typeof first === "string") url = first;
    else if (first?.url) url = first.url;
    else if (first?.secure_url) url = first.secure_url;
    return cloudinaryThumb(url, 800, 500) || url;
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

function buildUrl(
  base: string,
  params: Record<string, string | undefined>
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function ListingsBrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const { listings, total, page, totalPages } = await getListings(params);

  const activeFilters = [
    params.city && `City: ${params.city}`,
    params.state && `State: ${params.state}`,
    params.beds && `${params.beds}+ beds`,
    params.baths && `${params.baths}+ baths`,
    params.minPrice && `Min $${parseInt(params.minPrice).toLocaleString()}`,
    params.maxPrice && `Max $${parseInt(params.maxPrice).toLocaleString()}`,
    params.status && `Status: ${params.status}`,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Browse Listings
          </h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">
            {total} {total === 1 ? "listing" : "listings"} available
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-300 dark:text-white/30" />
          <div className="flex rounded-lg border border-gray-200 dark:border-white/[0.08] overflow-hidden text-xs">
            {[
              { key: "newest", label: "Newest" },
              { key: "price_asc", label: "Price ↑" },
              { key: "price_desc", label: "Price ↓" },
            ].map((s) => (
              <Link
                key={s.key}
                href={buildUrl("/listings", { ...params, sort: s.key, page: undefined })}
                className={`px-3 py-2 font-medium transition-colors ${
                  (params.sort || "newest") === s.key
                    ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                    : "text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <form
        action="/listings"
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-2"
      >
        <input
          type="text"
          name="city"
          placeholder="City"
          defaultValue={params.city || ""}
          className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 w-32 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-400/40"
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          defaultValue={params.state || ""}
          className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 w-24 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-400/40"
        />
        <input
          type="number"
          name="beds"
          placeholder="Beds"
          defaultValue={params.beds || ""}
          className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 w-20 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-400/40"
        />
        <input
          type="number"
          name="baths"
          placeholder="Baths"
          defaultValue={params.baths || ""}
          className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 w-20 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-400/40"
        />
        <input
          type="number"
          name="minPrice"
          placeholder="Min $"
          defaultValue={params.minPrice || ""}
          className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 w-28 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-400/40"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Max $"
          defaultValue={params.maxPrice || ""}
          className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 w-28 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-400/40"
        />
        {params.sort && (
          <input type="hidden" name="sort" value={params.sort} />
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold transition-all"
        >
          Filter
        </button>
        {activeFilters.length > 0 && (
          <Link
            href="/listings"
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 text-sm transition-all"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((f) => (
            <span
              key={f}
              className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
          <Search className="h-12 w-12 mx-auto text-gray-300 dark:text-white/20 mb-3" />
          <p className="text-gray-400 dark:text-white/40 text-sm">
            No listings match your filters.
          </p>
          <Link
            href="/listings"
            className="inline-block mt-3 text-sm text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 dark:hover:text-cyan-300"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => {
            const photoUrl = getPhotoUrl(listing.optimized_photos);
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
                        {listing.sqft.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {listing.agent && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
                      {listing.agent.saved_headshot_url ? (
                        <img
                          src={listing.agent.saved_headshot_url}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-white/[0.08] flex items-center justify-center text-[9px] font-bold text-gray-400 dark:text-white/40">
                          {(listing.agent.saved_agent_name || "A")[0]}
                        </div>
                      )}
                      <span className="text-xs text-gray-400 dark:text-white/40 truncate">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl("/listings", { ...params, page: String(page - 1) })}
              className="p-2 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          <span className="text-sm text-gray-400 dark:text-white/40 px-3">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl("/listings", { ...params, page: String(page + 1) })}
              className="p-2 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
