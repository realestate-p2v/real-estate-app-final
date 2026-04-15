// ============================================================
// FILE: app/site/[handle]/sitemap.xml/route.ts
// ============================================================
import { getSite, getListings, getBlogPosts, getLocationPages } from "../data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) {
    return new Response("Not found", { status: 404 });
  }

  const baseUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${handle}.p2v.homes`;

  const [listings, blogPosts, locationPages] = await Promise.all([
    getListings(site.user_id),
    getBlogPosts(site.user_id),
    getLocationPages(site.user_id),
  ]);

  const now = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/about", priority: "0.7", changefreq: "monthly" },
    { loc: "/listings", priority: "0.9", changefreq: "weekly" },
    { loc: "/contact", priority: "0.6", changefreq: "monthly" },
  ];
  if (site.blog_enabled) {
    staticPages.push({ loc: "/blog", priority: "0.7", changefreq: "weekly" });
  }
  if (locationPages.length > 0) {
    staticPages.push({ loc: "/locations", priority: "0.8", changefreq: "weekly" });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Listing detail pages
  for (const listing of listings) {
    if (listing.website_slug) {
      xml += `  <url>
    <loc>${baseUrl}/listings/${listing.website_slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  // Blog posts
  for (const post of blogPosts) {
    const lastmod = post.published_at
      ? new Date(post.published_at).toISOString().split("T")[0]
      : now;
    xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  // Location pages
  for (const loc of locationPages) {
    const lastmod = loc.updated_at
      ? new Date(loc.updated_at).toISOString().split("T")[0]
      : now;
    xml += `  <url>
    <loc>${baseUrl}/locations/${loc.location_slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
