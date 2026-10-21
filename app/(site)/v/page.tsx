import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveTemplate } from "@/lib/template";
import { VERSIONS } from "@/lib/versions";

// /v (work plan 6.3): older versions of this site. Snapshots live in public/v/<id>/.
export const metadata: Metadata = { title: "Older versions", description: "Every design this site has had." };

export default async function VersionsPage() {
  const { template, props } = await getActiveTemplate();
  if (!template.Versions) notFound();
  return <template.Versions {...props} versions={VERSIONS} />;
}
