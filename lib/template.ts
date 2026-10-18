import { getTemplate } from "@/templates/registry";
import type { TemplateModule, TemplateProps } from "@/templates/types";
import { getSettings, getSiteContent } from "./data";

/**
 * The active template and the props every page passes to it. Route files in app/(site)/ pick the
 * page component they need from `template` and render it with `props`. `activeTemplate` is always
 * a current id: lib/static-content.ts and lib/payload/map.ts fall back to folio.
 */
export async function getActiveTemplate(): Promise<{ template: TemplateModule; props: TemplateProps }> {
  const [content, { activeTemplate, ...settings }] = await Promise.all([getSiteContent(), getSettings()]);
  return { template: getTemplate(activeTemplate), props: { content, settings } };
}
