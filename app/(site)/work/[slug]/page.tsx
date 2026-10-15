import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/shared/JsonLd";
import { caseStudyProjects, findCaseStudy, getSiteContent } from "@/lib/data";
import { caseStudyJsonLd } from "@/lib/json-ld";
import { notFoundMetadata, siteUrl } from "@/lib/seo";
import { getActiveTemplate } from "@/lib/template";

// Only projects with case-study content get a page (guide §4.4). Unknown slugs render on demand
// and 404, so case studies added in Payload later work without a rebuild.
export async function generateStaticParams() {
  const content = await getSiteContent();
  return caseStudyProjects(content).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const content = await getSiteContent();
  const match = findCaseStudy(content, slug);
  if (!match) return notFoundMetadata;
  const { name, summary } = match.project;
  // openGraph replaces the layout's (shallow merge), so shares show the project, not the home
  // title. The image comes from ./opengraph-image.tsx.
  return {
    title: name,
    description: summary,
    openGraph: { title: `${name} · ${content.profile.name}`, description: summary, type: "article" },
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const [{ slug }, { template, props }] = await Promise.all([params, getActiveTemplate()]);
  const match = findCaseStudy(props.content, slug);
  if (!template.CaseStudy || !match) notFound();
  return (
    <>
      <JsonLd data={caseStudyJsonLd(match.project, siteUrl())} />
      <template.CaseStudy {...props} project={match.project} next={match.next} />
    </>
  );
}
