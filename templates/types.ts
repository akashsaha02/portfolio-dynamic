import type { ComponentType } from "react";
import type { Project, SiteContent } from "@/lib/content-types";
import type { VersionEntry } from "@/lib/versions";

/**
 * Every template id the registry knows. Add an id here and an entry in registry.ts together.
 * Folio (default) and Index (work plan 6.4, two-column and recruiter-first). Editorial (the v1
 * design) was retired in 5.2: git tag `v1-editorial`, snapshot at /v/editorial/ (6.3).
 */
export const TEMPLATE_IDS = ["folio", "index", "bento", "brutal", "terminal"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** Used when nothing picks a template, and for ids that are no longer (or never were) templates. */
export const DEFAULT_TEMPLATE: TemplateId = "folio";

/** Ids that were templates once. Stored values (the database, old env files) fall back quietly. */
export const RETIRED_TEMPLATE_IDS: readonly string[] = ["editorial"];

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (TEMPLATE_IDS as readonly string[]).includes(value);
}

/**
 * A stored template id as a current one: valid ids pass through, anything else (a retired id such
 * as "editorial", empty, unknown) becomes DEFAULT_TEMPLATE. For values already in a database,
 * where failing would take the site down; input you control should be checked with isTemplateId.
 */
export function toTemplateId(value: unknown): TemplateId {
  return isTemplateId(value) ? value : DEFAULT_TEMPLATE;
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

/** Props of the version archive page (/v, work plan 6.3). */
export type VersionsPageProps = TemplateProps & {
  /** Every design the site has had, newest first; the current one has `current: true`. */
  versions: VersionEntry[];
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
  /** /archive: every project in one table (work plan 6.1). */
  Archive?: ComponentType<TemplateProps>;
  /** /lab: the in-browser ML demo (work plan 6.7). */
  Lab?: ComponentType<TemplateProps>;
  /** /v: older versions of this site (work plan 6.3). */
  Versions?: ComponentType<VersionsPageProps>;
};

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  /**
   * `current` = can be activated in the admin. `placeholder` = still being built: the admin can
   * preview it but not activate it. `legacy` = archived design kept for the version archive.
   */
  status: "current" | "legacy" | "placeholder";
};

/**
 * Name, description and status of every template. Plain data (no React), so the Payload config
 * (globals/SiteSettings.ts), the admin dashboard and the preview banner can read it without
 * importing the template modules; registry.ts pairs each entry with its pages.
 * To make a template selectable in the admin, set its `status` to "current" here and run
 * `npm run generate:types` (the `activeTemplate` options change).
 */
export const TEMPLATE_META: Record<TemplateId, TemplateMeta> = {
  folio: {
    id: "folio",
    name: "Folio",
    description: "Mobile-first multi-page template (guide §3–§4).",
    status: "current",
  },
  index: {
    id: "index",
    name: "Index",
    description: "Two-column, recruiter-first: everything on one scroll (work plan 6.4).",
    status: "current",
  },
  bento: {
    id: "bento",
    name: "Bento",
    description: "Modern: an asymmetric grid of cards, light and dark, built to be scanned in seconds.",
    status: "current",
  },
  brutal: {
    id: "brutal",
    name: "Brutal",
    description: "Stylised: oversized type, thick borders, flat colour blocks and hard shadows.",
    status: "current",
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    description: "A developer's command line: monospace, prompt-style navigation, readable text.",
    status: "current",
  },
};

/** Ids the admin may activate: templates whose status is `current`, in TEMPLATE_IDS order. */
export const ACTIVATABLE_TEMPLATE_IDS: readonly TemplateId[] = TEMPLATE_IDS.filter(
  (id) => TEMPLATE_META[id].status === "current",
);

export function isActivatableTemplateId(value: unknown): value is TemplateId {
  return isTemplateId(value) && TEMPLATE_META[value].status === "current";
}

/**
 * A stored `activeTemplate` as one the site may publish: activatable ids pass through; anything
 * else (retired, placeholder, unknown) becomes DEFAULT_TEMPLATE. Used by the site-settings
 * global's hooks, so a template set back to `placeholder` stops rendering for visitors.
 */
export function toActivatableTemplateId(value: unknown): TemplateId {
  return isActivatableTemplateId(value) ? value : DEFAULT_TEMPLATE;
}

export type TemplateDefinition = {
  meta: TemplateMeta;
  /**
   * The template's pages, imported statically. Every template's Client Components join the same
   * route graph and ship on every route whichever template is active (work plan 5.2 found 7.6 KB
   * gz from Editorial on Folio), so a template keeps its own Client Components few and small.
   */
  module: TemplateModule;
};
