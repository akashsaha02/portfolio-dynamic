import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/shared/JsonLd";
import { aboutJsonLd } from "@/lib/json-ld";
import { siteUrl } from "@/lib/seo";
import { getActiveTemplate } from "@/lib/template";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const { template, props } = await getActiveTemplate();
  if (!template.About) notFound();
  return (
    <>
      <JsonLd data={aboutJsonLd(props.content, siteUrl())} />
      <template.About {...props} />
    </>
  );
}
