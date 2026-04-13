import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import {
  ArrowRight,
  Bed,
  Bath,
  Maximize,
  Camera,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { cloudinaryUrl, cloudinaryThumb } from "@/lib/cloudinary-url";

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
    .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url, saved_logo_url")
    .eq("user_id", website.user_id)
    .single();

  const { data: listings } = await supabase
    .from("agent_properties")
    .select("id, address, city, state, zip, price, bedrooms, bathrooms, sqft, status, website_slug, optimized_photos, property_type")
    .eq("user_id", website.user_id)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .order("created_at", { ascending: false })
    .limit(6);

  // ── Enrich listings with photos from orders ──
  const enrichedListings = await enrichListingsWithPhotos(supabase, listings || [], website.user_id);

  return { website, agent, listings: enrichedListings };
}

async function enrichListingsWithPhotos(supabase: any, listings: any[], userId: string) {
  if (listings.length === 0) return listings;

  // Fetch all paid orders for this user once
  const { data: orders } = await supabase
    .from("orders")
    .select("photos, property_address")
    .eq("user_id", userId)
    .eq("payment_status", "paid")
    .not("photos", "is", null);

  if (!orders || orders.length === 0) return listings;

  return listings.map((listing: any) => {
    // If optimized_photos already has data, use it
    if (listing.optimized_photos && Array.isArray(listing.optimized_photos) && listing.optimized_photos.length > 0) {
      const firstUrl = getPhotoUrl(listing.optimized_photos);
      if (firstUrl) return listing;
    }

    // Match order by address
    const listingAddr = (listing.address || "").toLowerCase().split(",")[0].trim();
    if (!listingAddr) return listing;

    const matchedOrder = orders.find((o: any) =>
      o.property_address &&
      o.property_address.toLowerCase().includes(listingAddr)
    );

    if (matchedOrder?.photos && Array.isArray(matchedOrder.photos) && matchedOrder.photos.length > 0) {
      return { ...listing, optimized_photos: matchedOrder.photos };
    }

    return listing;
  });
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) return { title: "Not Found" };
  const { website, agent } = data;
  const title = website.seo_title || website.site_title || agent?.saved_agent_name || "Agent";
  const description = website.seo_description || website.tagline || `Real estate listings by ${agent?.saved_agent_name}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function AgentHomePage({ params }: Props) {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) notFound();

  const { website, agent, listings } = data;
  const agentName = agent?.saved_agent_name || website.site_title || "Agent";
  const primaryColor = website.primary_color || "#06b6d4";

  // Fix Cloudinary URLs for cross-domain delivery
  const headshotUrl = cloudinaryUrl(agent?.saved_headshot_url);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
            {/* Agent photo */}
            <div className="shrink-0">
              {headshotUrl ? (
                <img
                  src={headshotUrl}
                  alt={agentName}
                  className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div
                  className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agentName[0]}
                </div>
              )}
            </div>

            {/* Hero text */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {agentName}
              </h1>
              {agent?.saved_company && (
                <p className="text-base text-gray-400 mt-1">{agent.saved_company}</p>
              )}
              {website.tagline && (
                <p className="text-lg text-gray-500 mt-3 max-w-md leading-relaxed">
                  {website.tagline}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <Link
                  href="/listings"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm hover:shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  View Listings
                </Link>
                <Link
                  href="/contact"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900 transition-all"
                >
                  Get in Touch
                </Link>
              </div>
              {/* Contact quick links */}
              <div className="mt-4 flex items-center gap-4 justify-center sm:justify-start text-xs text-gray-400">
                {agent?.saved_phone && (
                  <a href={`tel:${agent.saved_phone}`} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                    <Phone className="h-3 w-3" />
                    {agent.saved_phone}
                  </a>
                )}
                {agent?.saved_email && (
                  <a href={`mailto:${agent.saved_email}`} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                    <Mail className="h-3 w-3" />
                    {agent.saved_email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      {listings.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              My Listings
            </h2>
            <Link
              href="/listings"
              className="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: primaryColor }}
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

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
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(listing.price)}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {listing.address}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
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
                          <Maximize className="h-3 w-3" /> {listing.sqft.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── About Preview ── */}
      {(website.about_content || website.bio) && (
        <section className="bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                About {agentName}
              </h2>
              <p className="text-gray-500 leading-relaxed line-clamp-4">
                {website.about_content || website.bio}
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-1 text-sm font-medium mt-4 transition-colors hover:opacity-80"
                style={{ color: primaryColor }}
              >
                Read More <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Contact CTA ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Ready to Find Your Dream Home?
          </h2>
          <p className="text-white/80 mt-3 max-w-md mx-auto">
            Get in touch today and let&apos;s start your real estate journey.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-6 px-6 py-3 rounded-lg bg-white font-bold text-sm transition-all hover:shadow-lg"
            style={{ color: primaryColor }}
          >
            Contact {agentName}
          </Link>
        </div>
      </section>
    </div>
  );
}
