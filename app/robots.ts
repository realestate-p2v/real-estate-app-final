import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/dashboard/lens/"],
      disallow: ["/dashboard/", "/admin/", "/api/", "/video/"],
    },
    sitemap: "https://realestatephoto2video.com/sitemap.xml",
  };
}
