import { MetadataRoute } from "next"; 

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      User-Agent: *
Allow: /dashboard/lens/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /video/
    sitemap: "https://realestatephoto2video.com/sitemap.xml",
  };
}
