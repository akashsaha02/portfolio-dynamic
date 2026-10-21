import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveTemplate } from "@/lib/template";

// /archive (work plan 6.1): every project in one table.
export const metadata: Metadata = { title: "Archive", description: "Every project, by year." };

export default async function ArchivePage() {
  const { template, props } = await getActiveTemplate();
  if (!template.Archive) notFound();
  return <template.Archive {...props} />;
}
