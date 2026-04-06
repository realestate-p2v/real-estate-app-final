import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyWebsiteClient from "./client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("agent_properties")
    .select("address, city, state, price, bedrooms, bathrooms, sqft, website_curated")
    .eq("website_slug", slug)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .single();

  if (!property) return { title: "Property Not Found" };

  const curated = property.website_curated as Record<string, string[]> | null;
  const ogImage = curated?.photos?.[0] || undefined;
  const location = [property.city, property.state].filter(Boolean).join(", ");
  const details = [
    property.bedrooms ? `${property.bedrooms} Bed` : null,
    property.bathrooms ? `${property.bathrooms} Bath` : null,
    property.sqft ? `${property.sqft.toLocaleString()} Sqft` : null,
  ].filter(Boolean).join(" · ");

  const title = `${property.address}${location ? ` | ${location}` : ""}`;
  const description = [
    property.address,
    location,
    details,
    property.price ? `$${property.price.toLocaleString()}` : null,
  ].filter(Boolean).join(" — ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PropertyWebsitePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch property
  const { data: property } = await supabase
    .from("agent_properties")
    .select("*")
    .eq("website_slug", slug)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .single();

  if (!property) notFound();

  // Fetch agent info
  const { data: agent } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_logo_url, saved_headshot_url")
    .eq("user_id", property.user_id)
    .single();

  // Fetch curated assets
  const modules = (property.website_modules || {}) as Record<string, boolean>;
  const curated = (property.website_curated || {}) as Record<string, string[]>;

  // Descriptions
  let descriptions: any[] = [];
  if (modules.description && curated.descriptions?.length) {
    const { data } = await supabase
      .from("lens_descriptions")
      .select("id, description, style")
      .in("id", curated.descriptions);
    descriptions = data || [];
  }

  // Staging
  let stagings: any[] = [];
  if (modules.staging && curated.staging?.length) {
    const { data } = await supabase
      .from("lens_staging")
      .select("id, original_url, staged_url, room_type, style")
      .in("id", curated.staging);
    stagings = data || [];
  }

  // Exports
  let exports: any[] = [];
  if (modules.exports && curated.exports?.length) {
    const { data } = await supabase
      .from("design_exports")
      .select("id, export_url, overlay_video_url, template_type, export_format")
      .in("id", curated.exports);
    exports = data || [];
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.address,
    description: descriptions[0]?.description?.slice(0, 300) || `Property at ${property.address}`,
    url: `https://realestatephoto2video.com/p/${slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city || undefined,
      addressRegion: property.state || undefined,
      postalCode: property.zip || undefined,
    },
    ...(property.price && { price: property.price, priceCurrency: "USD" }),
    ...(property.bedrooms && { numberOfBedrooms: property.bedrooms }),
    ...(property.bathrooms && { numberOfBathroomsTotal: property.bathrooms }),
    ...(property.sqft && { floorSize: { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" } }),
    ...(curated.photos?.[0] && { image: curated.photos.slice(0, 5) }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyWebsiteClient
        property={property}
        agent={agent}
        modules={modules}
        curated={curated}
        descriptions={descriptions}
        stagings={stagings}
        exports={exports}
        template={property.website_template || "modern_clean"}
      />
    </>
  );
}
