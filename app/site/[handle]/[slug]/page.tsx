import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Film,
  ArrowRight,
  Camera,
  CheckCircle2,
} from "lucide-react";

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

async function getData(handle: string, slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get website
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

  // Get property by short slug
  const { data: property } = await supabase
    .from("agent_properties")
    .select("*")
    .eq("user_id", website.user_id)
    .eq("website_slug", slug)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .single();

  if (!property) return null;

  // Get agent info
  const { data: agent } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url")
    .eq("user_id", website.user_id)
    .single();

  // Get description
  const { data: descriptions } = await supabase
    .from("lens_descriptions")
    .select("description, style")
    .eq("user_id", website.user_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const description = descriptions?.[0]?.description || null;

  // Get staging photos
  const { data: staging } = await supabase
    .from("lens_staging")
    .select("original_url, staged_url")
    .eq("user_id", website.user_id);

  // Get order data (videos)
  const { data: orders } = await supabase
    .from("orders")
    .select("photos, clip_urls, delivery_url, property_address")
    .eq("user_id", website.user_id)
    .eq("payment_status", "paid");

  const matchedOrder = orders?.find(
    (o) =>
      o.property_address &&
      property.address &&
      o.property_address.toLowerCase().includes(property.address.toLowerCase().split(",")[0])
  );

  // Collect photos
  const photos: string[] = [];
  if (matchedOrder?.photos) {
    const orderPhotos = Array.isArray(matchedOrder.photos) ? matchedOrder.photos : [];
    for (const p of orderPhotos) {
      const url = typeof p === "string" ? p : p?.url || p?.secure_url;
      if (url) photos.push(url);
    }
  }
  if (property.optimized_photos && Array.isArray(property.optimized_photos)) {
    for (const p of property.optimized_photos) {
      const url = typeof p === "string" ? p : p?.url || p?.secure_url;
      if (url && !photos.includes(url)) photos.push(url);
    }
  }

  return {
    website,
    property,
    agent,
    description,
    staging: staging || [],
    photos,
    videoUrl: matchedOrder?.delivery_url || null,
    hasVideoOrder: !!matchedOrder,
  };
}

function formatPrice(price: number | null): string {
  if (!price) return "Price TBD";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const data = await getData(handle, slug);
  if (!data) return { title: "Not Found" };
  const { property } = data;
  return {
    title: `${property.address} | ${data.website.site_title || "Listing"}`,
    description: `${property.bedrooms || ""}bd ${property.bathrooms || ""}ba ${property.sqft ? property.sqft.toLocaleString() + " sqft" : ""} in ${property.city}, ${property.state}`,
  };
}

export default async function AgentListingDetailPage({ params }: Props) {
  const { handle, slug } = await params;
  const data = await getData(handle, slug);
  if (!data) notFound();

  const { website, property, agent, description, staging, photos, videoUrl, hasVideoOrder } = data;
  const primaryColor = website.primary_color || "#06b6d4";
  const agentName = agent?.saved_agent_name || "Agent";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photos */}
          {photos.length > 0 ? (
            <div className="space-y-2">
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
                <img src={photos[0]} alt={property.address} className="w-full h-full object-cover" />
              </div>
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.slice(1, 5).map((url, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[16/9] rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Camera className="h-12 w-12 text-gray-200" />
            </div>
          )}

          {/* Property header */}
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">{formatPrice(property.price)}</p>
            <p className="text-lg text-gray-600 mt-1">{property.address}</p>
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {[property.city, property.state, property.zip].filter(Boolean).join(", ")}
            </p>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1.5"><Bed className="h-4 w-4" /> {property.bedrooms} Beds</span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" /> {property.bathrooms} Baths</span>
              )}
              {property.sqft != null && (
                <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" /> {property.sqft.toLocaleString()} sqft</span>
              )}
              {property.year_built && (
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Built {property.year_built}</span>
              )}
            </div>

            {property.status && (
              <span
                className="inline-block mt-3 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {property.status}
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
              <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{description}</div>
            </div>
          )}

          {/* Features */}
          {property.special_features && property.special_features.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Features</h2>
              <div className="flex flex-wrap gap-2">
                {property.special_features.map((f: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3" style={{ color: primaryColor }} /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {videoUrl && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Listing Video</h2>
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                <video src={videoUrl} controls className="w-full h-full object-cover" poster={photos[0] || undefined} />
              </div>
            </div>
          )}

          {/* Staging */}
          {staging.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Virtual Staging</h2>
              <div className="grid grid-cols-2 gap-3">
                {staging.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                      <img src={s.staged_url} alt="Staged room" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-gray-300 text-center">Virtually Staged</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video pitch */}
          {!hasVideoOrder && photos.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 flex items-center gap-4">
              <Film className="h-6 w-6 flex-shrink-0" style={{ color: primaryColor }} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700">This listing doesn&apos;t have a video yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Cinematic listing videos from $79</p>
              </div>
              <a
                href="https://realestatephoto2video.com/order"
                className="px-4 py-2 rounded-lg text-white font-bold text-xs transition-all flex items-center gap-1"
                style={{ backgroundColor: primaryColor }}
              >
                Create Video <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Agent card */}
          {agent && (
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                {agent.saved_headshot_url ? (
                  <img src={agent.saved_headshot_url} alt={agentName} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: primaryColor }}>
                    {agentName[0]}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{agentName}</p>
                  {agent.saved_company && <p className="text-xs text-gray-400">{agent.saved_company}</p>}
                </div>
              </div>

              <div className="space-y-2">
                {agent.saved_phone && (
                  <a href={`tel:${agent.saved_phone}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <Phone className="h-3.5 w-3.5" /> {agent.saved_phone}
                  </a>
                )}
                {agent.saved_email && (
                  <a href={`mailto:${agent.saved_email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <Mail className="h-3.5 w-3.5" /> {agent.saved_email}
                  </a>
                )}
              </div>

              {/* Contact form */}
              <form action="/api/websites/contact" method="POST" className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                <input type="hidden" name="agent_user_id" value={website.user_id} />
                <input type="hidden" name="property_address" value={property.address || ""} />
                <input type="text" name="name" placeholder="Your name" required className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300" />
                <input type="email" name="email" placeholder="Email" required className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300" />
                <input type="tel" name="phone" placeholder="Phone (optional)" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300" />
                <textarea name="message" placeholder="I'm interested in this property..." rows={3} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:border-gray-300" />
                <button type="submit" className="w-full py-2.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                  Contact {agentName}
                </button>
              </form>
            </div>
          )}

          {/* Property details */}
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Property Details</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Type", property.property_type],
                ["Listing", property.listing_type],
                ["Lot Size", property.lot_size],
                ["Year Built", property.year_built],
                ["Status", property.status],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-700 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Powered by */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-[11px] text-gray-300">
              Powered by{" "}
              <a href="https://realestatephoto2video.com" className="text-gray-400 hover:text-gray-500 transition-colors">
                Realestatephoto2video.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
