import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// /robots.txt (work plan 2.7). The admin and the API (Payload REST, draft mode) stay out of search.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
