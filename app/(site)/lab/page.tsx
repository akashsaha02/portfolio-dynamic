import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveTemplate } from "@/lib/template";

// /lab (work plan 6.7): the in-browser tomato-leaf classifier.
export const metadata: Metadata = {
  title: "Lab",
  description: "A tomato-leaf disease classifier that runs in your browser.",
};

export default async function LabPage() {
  const { template, props } = await getActiveTemplate();
  if (!template.Lab) notFound();
  return <template.Lab {...props} />;
}
