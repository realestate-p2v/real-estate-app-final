// app/order/delivery/[orderId]/page.tsx
//
// First-buyer delivery page. Linked from the email sent by
// sample_worker.py after the mini-pipeline completes.

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import BonusCard from "./bonus-card";

type Props = {
  params: Promise<{ orderId: string }>;
};

type DeliveryData = {
  order_id: string;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  delivery_url: string | null;
  unbranded_delivery_url: string | null;
  branded_vertical_sample_url: string | null;
  branded_flyer_sample_url: string | null;
  is_first_order: boolean | null;
  sample_content_generated: boolean | null;
  delivered_at: string | null;
  agent_property_id: string | null;
  website_slug: string | null;
  website_published: boolean | null;
  hero_photo_url: string | null;
};

async function getDeliveryData(orderId: string): Promise<DeliveryData | null> {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_id, property_address, property_city, property_state, " +
        "delivery_url, unbranded_delivery_url, " +
        "branded_vertical_sample_url, branded_flyer_sample_url, " +
        "is_first_order, sample_content_generated, delivered_at, " +
        "agent_property_id"
    )
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) return null;

  let websiteSlug: string | null = null;
  let websitePublished = false;
  let heroPhotoUrl: string | null = null;
  if (order.agent_property_id) {
    const { data: prop } = await supabase
      .from("agent_properties")
      .select("website_slug, website_published, website_curated")
      .eq("id", order.agent_property_id)
      .maybeSingle();
    if (prop) {
      websiteSlug = prop.website_slug ?? null;
      websitePublished = prop.website_published ?? false;
      const curated = (prop.website_curated || {}) as Record<string, any>;
      const photos = Array.isArray(curated.photos) ? curated.photos : [];
      heroPhotoUrl = photos[0] || null;
    }
  }

  return {
    ...order,
    website_slug: websiteSlug,
    website_published: websitePublished,
    hero_photo_url: heroPhotoUrl,
  };
}

function withAttachmentFlag(url: string): string {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url;
  if (url.includes("fl_attachment")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  const data = await getDeliveryData(orderId);
  const address = data?.property_address || "your listing";
  return {
    title: `Your video — ${address}`,
    description: "Your listing video is ready. Watch, download, and share.",
    robots: "noindex, nofollow",
  };
}

const mainDownloadBtnClass =
  "inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-5 py-3 rounded-full transition-colors shadow-lg";

export default async function DeliveryPage({ params }: Props) {
  const { orderId } = await params;
  const data = await getDeliveryData(orderId);
  if (!data) notFound();

  const mainVideoUrl = data.unbranded_delivery_url || data.delivery_url;
  const mainVideoDownloadUrl = mainVideoUrl
    ? withAttachmentFlag(mainVideoUrl)
    : null;

  const cityState = [data.property_city, data.property_state]
    .filter(Boolean)
    .join(", ");

  const hasBranded = !!data.branded_vertical_sample_url;
  const hasFlyer = !!data.branded_flyer_sample_url;
  const hasListingPage = !!(data.website_slug && data.website_published);
  const listingPageUrl = hasListingPage
    ? `https://realestatephoto2video.com/p/${data.website_slug}`
    : null;

  const showBonusSection =
    data.is_first_order &&
    data.sample_content_generated &&
    (hasBranded || hasFlyer || hasListingPage);

  const propertyId = data.agent_property_id;
  const verticalEditUrl = propertyId
    ? `/dashboard/lens/design-studio?template=social&propertyId=${propertyId}`
    : `/dashboard/lens/design-studio`;
  const flyerEditUrl = propertyId
    ? `/dashboard/lens/design-studio?template=listing_flyer&propertyId=${propertyId}`
    : `/dashboard/lens/design-studio`;
  const listingEditUrl = propertyId
    ? `/dashboard/properties/${propertyId}#website`
    : `/dashboard/properties`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300 mb-2">
            Your video is ready
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {data.property_address || "Your listing"}
          </h1>
          {cityState ? (
            <p className="text-base text-white/60 mt-1.5">{cityState}</p>
          ) : null}
        </div>

        {mainVideoUrl ? (
          <section className="mb-12">
            <div className="rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 aspect-video">
              <video
                src={mainVideoUrl}
                controls
                autoPlay
                muted
                playsInline
                preload="metadata"
                className="w-full h-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              {mainVideoDownloadUrl ? (
                <a href={mainVideoDownloadUrl} className={mainDownloadBtnClass}>
                  <Download className="h-4 w-4" strokeWidth={2.5} />
                  Download video
                </a>
              ) : null}
              <p className="text-sm text-white/50">
                Ready to post anywhere you share listings.
              </p>
            </div>
          </section>
        ) : (
          <section className="mb-12 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-6">
            <p className="text-base font-bold text-amber-200">
              Your video is still processing.
            </p>
            <p className="text-sm text-amber-200/70 mt-1">
              Check back in a few minutes — we&apos;ll also email you once it&apos;s
              ready.
            </p>
          </section>
        )}

        {showBonusSection ? (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Bonus content
              </h2>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-300 bg-indigo-400/15 ring-1 ring-indigo-400/30 px-2.5 py-1 rounded-full">
                On the house
              </span>
            </div>
            <p className="text-sm text-white/55 mb-6">
              Since this was your first order, we created three extras at no
              charge.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hasBranded && data.branded_vertical_sample_url ? (
                <BonusCard
                  tag="Branded vertical"
                  title="9:16 social clip"
                  description="Your video with headshot, brokerage, and contact info baked in. Drop it into Reels, TikTok, or Shorts."
                  mediaUrl={data.branded_vertical_sample_url}
                  mediaType="video"
                  editLabel="Edit in Design Studio"
                  editUrl={verticalEditUrl}
                />
              ) : null}
              {hasFlyer && data.branded_flyer_sample_url ? (
                <BonusCard
                  tag="Branded flyer"
                  title="Printable listing sheet"
                  description="A full-page PNG with your branding, photos, price, and listing details. Print or share digitally."
                  mediaUrl={data.branded_flyer_sample_url}
                  mediaType="image"
                  editLabel="Edit in Design Studio"
                  editUrl={flyerEditUrl}
                />
              ) : null}
              {hasListingPage && listingPageUrl ? (
                <BonusCard
                  tag="Listing page"
                  title="Public property website"
                  description="A shareable URL where buyers can see your video, photos, and property details."
                  mediaUrl={data.hero_photo_url}
                  mediaType="link"
                  linkUrl={listingPageUrl}
                  editLabel="Edit website"
                  editUrl={listingEditUrl}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        <p className="text-xs text-white/35 mt-12 text-center">
          Questions? Reply to your delivery email — we read every one.
        </p>
      </div>
    </div>
  );
}
