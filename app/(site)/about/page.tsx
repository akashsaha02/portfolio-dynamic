import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveTemplate } from "@/lib/template";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const { template, props } = await getActiveTemplate();
  if (!template.About) notFound();
  return <template.About {...props} />;
}
