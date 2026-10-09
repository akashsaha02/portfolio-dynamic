import type { ComponentType } from "react";
import type { Project, SiteContent } from "@/lib/content-types";

/** Every template id the registry knows. Add an id here and an entry in registry.ts together. */
export const TEMPLATE_IDS = ["editorial", "folio"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(value);
}

export type Announcement = {
  text: string;
  url?: string;
};

/** Operational settings a template may react to. Comes from Payload `site-settings` in Phase 3. */
export type TemplateSettings = {
  /** When false, render the contact details but not the form. */
  contactFormEnabled: boolean;
  /** Optional site-wide banner. */
  announcement: Announcement | null;
};

/** What `getSettings()` returns: template settings plus which template is active. */
export type SiteSettings = TemplateSettings & {
  activeTemplate: TemplateId;
};

/** Props every template page receives. */
export type TemplateProps = {
  content: SiteContent;
  settings: TemplateSettings;
};

export type CaseStudyPageProps = TemplateProps & {
  /** Always has `caseStudy`. */
  project: Project & { caseStudy: NonNullable<Project["caseStudy"]> };
  /** The next project with a case study (wraps around), or null when this is the only one. */
  next: Project | null;
};

/**
 * A template is a set of page components. Only `Home` is required; a route whose page the
 * active template does not provide responds with 404. All pages are Server Components at the
 * top level (they may render Client Components inside).
 *
 * Each page renders everything inside <body> except the skip link, which the (site) layout
 * provides. The page must contain `<main id="main" tabIndex={-1}>` so the skip link works.
 */
export type TemplateModule = {
  Home: ComponentType<TemplateProps>;
  Work?: ComponentType<TemplateProps>;
  CaseStudy?: ComponentType<CaseStudyPageProps>;
  About?: ComponentType<TemplateProps>;
  Contact?: ComponentType<TemplateProps>;
  NotFound?: ComponentType<TemplateProps>;
};

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  /** `legacy` = archived design kept for the version archive (work plan 6.3). */
  status: "current" | "legacy" | "placeholder";
};

export type TemplateDefinition = {
  meta: TemplateMeta;
  /** Loaded on demand, so only the active template's module is evaluated per request. */
  load: () => Promise<{ default: TemplateModule }>;
};
