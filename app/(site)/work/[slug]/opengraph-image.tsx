import { caseStudyProjects, findCaseStudy, getSiteContent } from "@/lib/data";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

// Share image per case study (work plan 2.7). Prerendered for every known case study; unknown
// slugs 404 like the page does.

export const alt = "Case study title card with the project name";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  const content = await getSiteContent();
  return caseStudyProjects(content).map((p) => ({ slug: p.slug }));
}

export default async function CaseStudyOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, content] = await Promise.all([params, getSiteContent()]);
  const match = findCaseStudy(content, slug);
  if (!match) return new Response("Not found", { status: 404 });

  const { project } = match;
  return renderOgImage({
    eyebrow: `Case study · ${project.year}`,
    title: project.name,
    subtitle: project.kind,
    footer: `${content.profile.name} · ${content.profile.role}`,
  });
}
