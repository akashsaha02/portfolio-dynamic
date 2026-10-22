import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/data";
import { getActiveTemplate } from "@/lib/template";
import { versionsFor } from "@/lib/versions";

// /v (work plan 6.3): older versions of this site. Snapshots live in public/v/<id>/.
export const metadata: Metadata = { title: "Older versions", description: "Every design this site has had." };

export default async function VersionsPage() {
  const [{ template, props }, { activeTemplate }] = await Promise.all([getActiveTemplate(), getSettings()]);
  if (!template.Versions) notFound();
  return <template.Versions {...props} versions={versionsFor(activeTemplate)} />;
}
