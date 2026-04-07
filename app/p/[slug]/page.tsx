import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyWebsiteClient from "./client";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getPropertyData(slug: string) {
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("agent_properties")
    .select("*")
    .eq("website_slug", slug)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .single();

  if (!property) return null;

  const { data: agent } = await supabase
    .from("lens_usage")
    .select(
      "saved_agent_name, saved_phone, saved_email, saved_company, saved_logo_url, saved_headshot_url, saved_branding_cards"
    )
    .eq("user_id", property.user_id)
    .single();

  const modules = (property.website_modules || {}) as Record<string, boolean>;
  const curated = (property.website_curated || {}) as Record<string, string[]>;

  let descriptions: any[] = [];
  if (modules.description && curated.descriptions?.length) {
    const { data } = await supabase
      .from("lens_descriptions")
      .select("id, description, style")
      .in("id", curated.descriptions);
    descriptions = data || [];
  }

  let stagings: any[] = [];
  if (modules.staging && curated.staging?.length) {
    const { data } = await supabase
      .from("lens_staging")
      .select("id, original_url, staged_url, room_type, style")
      .in("id", curated.staging);
    stagings = data || [];
  }

  let designExports: any[] = [];
  if (modules.exports && curated.exports?.length) {
    const { data } = await supabase
      .from("design_exports")
      .select(
        "id, export_url, overlay_video_url, template_type, export_format"
      )
      .in("id", curated.exports);
    designExports = data || [];
  }

  return { property, agent, modules, curated, descriptions, stagings, designExports };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPropertyData(slug);
  if (!data) return { title: "Property Not Found" };

  const { property, agent, descriptions, curated } = data;
  const agentName = agent?.saved_agent_name || "";
  const location = [property.city, property.state].filter(Boolean).join(", ");
  const title = `${property.address}${location ? ` — ${location}` : ""}${agentName ? ` | ${agentName}` : ""}`;

  // Build description from listing description or property details
  let metaDescription = "";
  if (descriptions.length > 0 && descriptions[0].description) {
    metaDescription = descriptions[0].description.slice(0, 160);
  } else {
    const parts: string[] = [];
    if (property.bedrooms) parts.push(`${property.bedrooms} bed`);
    if (property.bathrooms) parts.push(`${property.bathrooms} bath`);
    if (property.sqft) parts.push(`${property.sqft.toLocaleString()} sqft`);
    const propType = property.property_type?.replace(/_/g, " ") || "property";
    if (property.price) {
      parts.push(`$${property.price.toLocaleString()}`);
    }
    metaDescription = `${propType.charAt(0).toUpperCase() + propType.slice(1)} at ${property.address}${location ? `, ${location}` : ""}. ${parts.join(" · ")}`;
  }

  // OG image — first curated photo
  const ogImage = (curated.photos || [])[0] || null;
  const ogImageUrl = ogImage?.includes("/upload/")
    ? ogImage.replace("/upload/", "/upload/w_1200,h_630,c_fill,q_auto/")
    : ogImage;

  return {
    title,
    description: metaDescription,
    openGraph: {
      title,
      description: metaDescription,
      type: "website",
      url: `https://realestatephoto2video.com/p/${slug}`,
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: property.address,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title,
      description: metaDescription,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
    robots: "index, follow",
  };
}

export default async function PropertyWebsitePage({ params }: Props) {
  const { slug } = await params;
  const data = await getPropertyData(slug);
  if (!data) notFound();

  const { property, agent, modules, curated, descriptions, stagings, designExports } = data;

  // Build JSON-LD structured data
  const agentName = agent?.saved_agent_name || "";
  const location = [property.city, property.state].filter(Boolean).join(", ");
  const ogImage = (curated.photos || [])[0] || null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.address,
    description:
      descriptions.length > 0
        ? descriptions[0].description?.slice(0, 300)
        : `${property.property_type?.replace(/_/g, " ")} at ${property.address}`,
    url: `https://realestatephoto2video.com/p/${slug}`,
    ...(ogImage ? { image: ogImage } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city || "",
      addressRegion: property.state || "",
      postalCode: property.zip || "",
    },
    ...(property.price
      ? {
          offers: {
            "@type": "Offer",
            price: property.price,
            priceCurrency: "USD",
            availability: property.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          },
        }
      : {}),
    ...(property.sqft ? { floorSize: { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" } } : {}),
    ...(property.bedrooms ? { numberOfRooms: property.bedrooms } : {}),
    ...(property.bathrooms ? { numberOfBathroomsTotal: property.bathrooms } : {}),
    ...(property.year_built ? { yearBuilt: property.year_built } : {}),
    ...(agentName
      ? {
          broker: {
            "@type": "RealEstateAgent",
            name: agentName,
            ...(agent?.saved_phone ? { telephone: agent.saved_phone } : {}),
            ...(agent?.saved_email ? { email: agent.saved_email } : {}),
            ...(agent?.saved_company
              ? { worksFor: { "@type": "Organization", name: agent.saved_company } }
              : {}),
          },
        }
      : {}),
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
        designExports={designExports}
        template={property.website_template || "modern_clean"}
      />
    </>
  );
}
