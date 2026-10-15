import type { MetadataRoute } from "next";
import { caseStudyProjects, getSiteContent } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

// /sitemap.xml (work plan 2.7). Static: generated at build time. Phase 3 (Payload as the source)
// needs revalidation here too, or new case studies only appear after a redeploy.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const content = await getSiteContent();
  const url = (path: string) => new URL(path, base).href;

  return [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/work"), changeFrequency: "monthly", priority: 0.8 },
    ...caseStudyProjects(content).map((p) => ({
      url: url(`/work/${p.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    { url: url("/about"), changeFrequency: "yearly", priority: 0.6 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.5 },
  ];
}
