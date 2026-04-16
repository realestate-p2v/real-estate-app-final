// ============================================================
// FILE: app/site/[handle]/listings/[slug]/page.tsx
// ============================================================
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSite, getPropertyWebsiteData } from "../../data";
import PropertyWebsiteClient from "@/app/p/[slug]/client";

type Props = {
  params: Promise<{ handle: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const site = await getSite(handle);
  if (!site) return { title: "Property Not Found" };

  const data = await getPropertyWebsiteData(slug, site.user_id);
  if (!data) return { title: "Property Not Found" };

  const { property, agent, descriptions, curated } = data;
  const agentName = agent?.saved_agent_name || "";
  const location = [property.city, property.state].filter(Boolean).join(", ");

  const pageTitle = `${property.address}${location ? ` — ${location}` : ""}${agentName ? ` | ${agentName}` : ""}`;
  const ogTitle = `${property.address}${location ? ` — ${location}` : ""}`;

  let metaDescription = "";
  if (descriptions.length > 0 && descriptions[0].description) {
    const raw = descriptions[0].description
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const cutoff = 155;
    if (raw.length <= cutoff) {
      metaDescription = raw;
    } else {
      const truncated = raw.slice(0, cutoff);
      const lastSpace = truncated.lastIndexOf(" ");
      metaDescription = (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "…";
    }
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

  const ogImage = (curated.photos || [])[0] || null;
  const ogImageUrl = ogImage?.includes("/upload/")
    ? ogImage.replace("/upload/", "/upload/w_1200,h_630,c_fill,q_auto/")
    : ogImage;

  const siteUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${handle}.p2v.homes`;

  return {
    title: pageTitle,
    description: metaDescription,
    openGraph: {
      title: ogTitle,
      description: metaDescription,
      type: "website",
      url: `${siteUrl}/listings/${slug}`,
      ...(ogImageUrl
        ? { images: [{ url: ogImageUrl, width: 1200, height: 630, alt: property.address }] }
        : {}),
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: ogTitle,
      description: metaDescription,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
    robots: "index, follow",
  };
}

export default async function AgentListingDetailPage({ params }: Props) {
  const { handle, slug } = await params;
  const site = await getSite(handle);
  if (!site) notFound();

  const data = await getPropertyWebsiteData(slug, site.user_id);
  if (!data) notFound();

  const { property, agent, modules, curated, descriptions, stagings, designExports } = data;

  // Build JSON-LD structured data
  const agentName = agent?.saved_agent_name || "";
  const location = [property.city, property.state].filter(Boolean).join(", ");
  const ogImage = (curated.photos || [])[0] || null;
  const siteUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${handle}.p2v.homes`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.address,
    description:
      descriptions.length > 0
        ? descriptions[0].description?.slice(0, 300)
        : `${property.property_type?.replace(/_/g, " ")} at ${property.address}`,
    url: `${siteUrl}/listings/${slug}`,
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
        agentSiteMode={true}
      />
    </>
  );
}
