import type { MetadataRoute } from "next";
import { caseStudyProjects, getPublishedSiteContent } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

// /sitemap.xml (work plan 2.7). Generated at build time. With Payload as the source the content
// read is tagged (lib/data.ts), and the projects hooks also call revalidatePath("/sitemap.xml"),
// so new case studies appear without a redeploy. Published content only, never drafts.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const content = await getPublishedSiteContent();
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
    { url: url("/archive"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/lab"), changeFrequency: "yearly", priority: 0.4 },
    { url: url("/v"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
