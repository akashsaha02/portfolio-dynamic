import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudyProjects, findCaseStudy, getSiteContent } from "@/lib/data";
import { notFoundMetadata } from "@/lib/seo";
import { getActiveTemplate } from "@/lib/template";

// Only projects with case-study content get a page (guide §4.4). Unknown slugs render on demand
// and 404, so case studies added in Payload later work without a rebuild.
export async function generateStaticParams() {
  const content = await getSiteContent();
  return caseStudyProjects(content).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const match = findCaseStudy(await getSiteContent(), slug);
  if (!match) return notFoundMetadata;
  return { title: match.project.name, description: match.project.summary };
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const [{ slug }, { template, props }] = await Promise.all([params, getActiveTemplate()]);
  const match = findCaseStudy(props.content, slug);
  if (!template.CaseStudy || !match) notFound();
  return <template.CaseStudy {...props} project={match.project} next={match.next} />;
}
