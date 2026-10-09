import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveTemplate } from "@/lib/template";

export const metadata: Metadata = { title: "Work" };

export default async function WorkPage() {
  const { template, props } = await getActiveTemplate();
  if (!template.Work) notFound();
  return <template.Work {...props} />;
}
