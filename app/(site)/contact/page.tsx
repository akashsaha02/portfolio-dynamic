import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveTemplate } from "@/lib/template";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const { template, props } = await getActiveTemplate();
  if (!template.Contact) notFound();
  return <template.Contact {...props} />;
}
