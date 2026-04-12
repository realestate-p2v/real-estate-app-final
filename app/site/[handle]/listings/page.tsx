import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bed, Bath, Maximize, Camera } from "lucide-react";

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

  const { data: listings } = await supabase
    .from("agent_properties")
    .select("id, address, city, state, zip, price, bedrooms, bathrooms, sqft, status, website_slug, optimized_photos, property_type")
    .eq("user_id", website.user_id)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .order("created_at", { ascending: false });

  return { website, listings: listings || [] };
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
}

export default async function AgentListingsPage({ params }: Props) {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) notFound();

  const { website, listings } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        All Listings
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        {listings.length} {listings.length === 1 ? "property" : "properties"} available
      </p>

      {listings.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-gray-100 bg-gray-50">
          <Camera className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No listings available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const photoUrl = getPhotoUrl(listing.optimized_photos);
            return (
              <Link
                key={listing.id}
                href={`/${listing.website_slug || listing.id}`}
                className="group rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={listing.address || "Property"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-200" />
                    </div>
                  )}
                  {listing.status && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white">
                      {listing.status}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-lg font-bold text-gray-900">{formatPrice(listing.price)}</p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{listing.address}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    {listing.bedrooms != null && (
                      <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {listing.bedrooms} bd</span>
                    )}
                    {listing.bathrooms != null && (
                      <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {listing.bathrooms} ba</span>
                    )}
                    {listing.sqft != null && (
                      <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {listing.sqft.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
