import { loadTemplate } from "@/templates/registry";
import type { TemplateModule, TemplateProps } from "@/templates/types";
import { getSettings, getSiteContent } from "./data";

/**
 * Loads the active template and the props every page passes to it. Route files in app/(site)/
 * pick the page component they need from `template` and render it with `props`.
 */
export async function getActiveTemplate(): Promise<{ template: TemplateModule; props: TemplateProps }> {
  const [content, { activeTemplate, ...settings }] = await Promise.all([getSiteContent(), getSettings()]);
  const template = await loadTemplate(activeTemplate);
  return { template, props: { content, settings } };
}
