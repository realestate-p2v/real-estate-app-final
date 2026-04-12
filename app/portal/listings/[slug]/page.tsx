
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
  Globe,
  Film,
  ArrowRight,
  Camera,
  CheckCircle2,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getListingData(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Try by website_slug first, then by id
  let { data: property } = await supabase
    .from("agent_properties")
    .select("*")
    .eq("website_slug", slug)
    .eq("portal_opt_in", true)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .single();

  if (!property) {
    const { data: byId } = await supabase
      .from("agent_properties")
      .select("*")
      .eq("id", slug)
      .eq("portal_opt_in", true)
      .eq("website_published", true)
      .is("merged_into_id", null)
      .single();
    property = byId;
  }

  if (!property) return null;

  // Get agent info
  const { data: agent } = await supabase
    .from("lens_usage")
    .select(
      "user_id, saved_agent_name, saved_headshot_url, saved_company, saved_phone, saved_email, saved_logo_url"
    )
    .eq("user_id", property.user_id)
    .single();

  // Get agent website handle
  const { data: website } = await supabase
    .from("agent_websites")
    .select("handle, slug, status")
    .eq("user_id", property.user_id)
    .single();

  // Get description
  const { data: descriptions } = await supabase
    .from("lens_descriptions")
    .select("description, style")
    .eq("user_id", property.user_id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Try to match description to this property by checking property_data
  // For now, use the most recent one
  const description = descriptions?.[0]?.description || null;

  // Get staging photos
  const { data: staging } = await supabase
    .from("lens_staging")
    .select("original_url, staged_url")
    .eq("user_id", property.user_id);

  // Get order data (videos, photos)
  const { data: orders } = await supabase
    .from("orders")
    .select("photos, clip_urls, delivery_url, branded_video_url, property_address")
    .eq("user_id", property.user_id)
    .eq("payment_status", "paid");

  // Try to match order to property by address
  const matchedOrder = orders?.find(
    (o) =>
      o.property_address &&
      property.address &&
      o.property_address.toLowerCase().includes(property.address.toLowerCase().split(",")[0])
  );

  // Collect all photos
  const photos: string[] = [];

  // From matched order
  if (matchedOrder?.photos) {
    const orderPhotos = Array.isArray(matchedOrder.photos)
      ? matchedOrder.photos
      : [];
    for (const p of orderPhotos) {
      const url = typeof p === "string" ? p : p?.url || p?.secure_url;
      if (url) photos.push(url);
    }
  }

  // From optimized_photos
  if (property.optimized_photos && Array.isArray(property.optimized_photos)) {
    for (const p of property.optimized_photos) {
      const url = typeof p === "string" ? p : p?.url || p?.secure_url;
      if (url && !photos.includes(url)) photos.push(url);
    }
  }

  return {
    property,
    agent,
    website,
    description,
    staging: staging || [],
    photos,
    videoUrl: matchedOrder?.delivery_url || null,
    hasVideoOrder: !!matchedOrder,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getListingData(slug);

  if (!data) return { title: "Listing Not Found" };

  const { property } = data;
  const title = `${property.address} | P2V Homes`;
  const desc = `${property.bedrooms || ""}bd ${property.bathrooms || ""}ba ${
    property.sqft ? property.sqft.toLocaleString() + " sqft" : ""
  } in ${property.city}, ${property.state}`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `https://p2v.homes/listings/${slug}`,
      siteName: "P2V Homes",
      type: "website",
      ...(data.photos[0] ? { images: [{ url: data.photos[0] }] } : {}),
    },
  };
}

function formatPrice(price: number | null): string {
  if (!price) return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getListingData(slug);

  if (!data) notFound();

  const { property, agent, website, description, staging, photos, videoUrl, hasVideoOrder } = data;

  const agentSiteUrl =
    website && (website.handle || website.slug) && (website.status === "published" || website.status === null)
      ? `https://${website.handle || website.slug}.p2v.homes`
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photo gallery */}
          {photos.length > 0 ? (
            <div className="space-y-2">
              {/* Hero photo */}
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-900">
                <img
                  src={photos[0]}
                  alt={property.address || "Property"}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Thumbnail grid */}
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.slice(1, 5).map((url, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-900"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              {photos.length > 5 && (
                <p className="text-xs text-white/30 text-center">
                  +{photos.length - 5} more photos
                </p>
              )}
            </div>
          ) : (
            <div className="aspect-[16/9] rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
              <Camera className="h-12 w-12 text-white/10" />
            </div>
          )}

          {/* Property header */}
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              {formatPrice(property.price)}
            </p>
            <p className="text-lg text-white/60 mt-1">{property.address}</p>
            <p className="text-sm text-white/40 flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {[property.city, property.state, property.zip]
                .filter(Boolean)
                .join(", ")}
            </p>

            <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4" />
                  {property.bedrooms} Beds
                </span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms} Baths
                </span>
              )}
              {property.sqft != null && (
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" />
                  {property.sqft.toLocaleString()} sqft
                </span>
              )}
              {property.year_built && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Built {property.year_built}
                </span>
              )}
            </div>

            {property.status && (
              <span className="inline-block mt-3 px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                {property.status}
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Description</h2>
              <div className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">
                {description}
              </div>
            </div>
          )}

          {/* Special features */}
          {property.special_features && property.special_features.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Features</h2>
              <div className="flex flex-wrap gap-2">
                {property.special_features.map((f: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/50"
                  >
                    <CheckCircle2 className="h-3 w-3 text-cyan-400/60" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/50"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {videoUrl && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">
                Listing Video
              </h2>
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover"
                  poster={photos[0] || undefined}
                />
              </div>
            </div>
          )}

          {/* Virtual staging */}
          {staging.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">
                Virtual Staging
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {staging.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-900">
                      <img
                        src={s.staged_url}
                        alt="Staged room"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[10px] text-white/30 text-center">
                      Virtually Staged
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video pitch CTA */}
          {!hasVideoOrder && photos.length > 0 && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5 flex items-center gap-4">
              <Film className="h-6 w-6 text-cyan-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white/80">
                  This listing doesn&apos;t have a video yet
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  Agents: turn your listing photos into a cinematic video from $79
                </p>
              </div>
              <a
                href="https://realestatephoto2video.com/order"
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs transition-all flex items-center gap-1"
              >
                Create Video <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Agent card */}
          {agent && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-4">
                {agent.saved_headshot_url ? (
                  <img
                    src={agent.saved_headshot_url}
                    alt={agent.saved_agent_name || "Agent"}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-lg font-bold text-white/30">
                    {(agent.saved_agent_name || "A")[0]}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">
                    {agent.saved_agent_name || "Agent"}
                  </p>
                  {agent.saved_company && (
                    <p className="text-xs text-white/40">{agent.saved_company}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {agent.saved_phone && (
                  <a
                    href={`tel:${agent.saved_phone}`}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {agent.saved_phone}
                  </a>
                )}
                {agent.saved_email && (
                  <a
                    href={`mailto:${agent.saved_email}`}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {agent.saved_email}
                  </a>
                )}
                {agentSiteUrl && (
                  <a
                    href={agentSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    View Agent Website
                  </a>
                )}
              </div>

              {/* Contact form */}
              <form
                action={`/api/website/contact`}
                method="POST"
                className="mt-5 pt-5 border-t border-white/[0.06] space-y-3"
              >
                <input type="hidden" name="agent_user_id" value={property.user_id} />
                <input
                  type="hidden"
                  name="property_address"
                  value={property.address || ""}
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/40"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/40"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/40"
                />
                <textarea
                  name="message"
                  placeholder="I'm interested in this property..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-cyan-400/40"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all"
                >
                  Contact Agent
                </button>
              </form>
            </div>
          )}

          {/* Property details card */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-bold text-white mb-3">
              Property Details
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ["Type", property.property_type],
                ["Listing", property.listing_type],
                ["Lot Size", property.lot_size],
                ["Year Built", property.year_built],
                ["Status", property.status],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div
                    key={label as string}
                    className="flex items-center justify-between"
                  >
                    <span className="text-white/40">{label}</span>
                    <span className="text-white/70 font-medium">{value}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Powered by */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <p className="text-xs text-white/30">
              Powered by{" "}
              <a
                href="https://realestatephoto2video.com"
                className="text-cyan-400/60 hover:text-cyan-400 transition-colors"
              >
                Realestatephoto2video.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
