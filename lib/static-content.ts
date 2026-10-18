// The static content source: lib/content.ts mapped to the template contract.
//
// Used when DATABASE_URI is unset (local builds, CI, e2e, Lighthouse, previews without a
// database), and by scripts/verify-parity.ts as the reference the Payload mapping must match.
// Pure: no Next or Payload imports, relative paths only (scripts run under `payload run`).

import * as raw from "./content";
import type {
  CaseStudy,
  Experience,
  ImageAsset,
  Project,
  Publication,
  PublicationStatus,
  SiteContent,
} from "./content-types";
import {
  DEFAULT_TEMPLATE,
  isTemplateId,
  RETIRED_TEMPLATE_IDS,
  TEMPLATE_IDS,
  type SiteSettings,
  type TemplateId,
} from "../templates/types";

const PUBLICATION_STATUS: Record<raw.Publication["status"], PublicationStatus> = {
  Published: "published",
  Accepted: "accepted",
  Submitted: "submitted",
};

function mapProject(p: raw.Project, index: number): Project {
  const year = p.year ?? p.period;
  if (!year) throw new Error(`Project "${p.name}" needs a year or period`);
  return {
    name: p.name,
    slug: p.slug,
    kind: p.kind,
    type: p.type,
    year,
    featured: p.featured,
    order: index + 1,
    summary: p.summary,
    stack: p.stack,
    url: p.url,
    linkLabel: p.linkLabel,
    repo: p.repo,
    cover: p.image,
    phoneShots: p.phone ? [p.phone] : [],
    caseStudy: p.caseStudy ? mapCaseStudy(p.caseStudy) : undefined,
  };
}

function mapImage(i: { src: string; alt: string; width: number; height: number }): ImageAsset {
  return { src: i.src, alt: i.alt, width: i.width, height: i.height };
}

function mapCaseStudy(c: raw.CaseStudy): CaseStudy {
  return {
    role: c.role,
    problem: c.problem,
    built: c.built,
    how: c.how,
    outcome: c.outcome,
    metrics: c.metrics.map((m) => ({ value: m.value, label: m.label })),
    ...(c.diagram && { diagram: mapImage(c.diagram) }),
  };
}

function mapExperience(r: raw.Role): Experience {
  return {
    company: r.company,
    url: r.url,
    title: r.title,
    place: r.place,
    start: r.start,
    end: r.end,
    period: r.period,
    points: r.points,
    skills: r.skills,
  };
}

function mapPublication(p: raw.Publication): Publication {
  return {
    title: p.title,
    venue: p.venue,
    year: p.year,
    status: PUBLICATION_STATUS[p.status],
    statusLabel: p.status,
    doi: p.doi,
    url: p.url,
    summary: p.summary,
  };
}

/** lib/content.ts as `SiteContent`. */
export function staticSiteContent(): SiteContent {
  // Optional fields aren't in lib/content.ts until Akash supplies them (work plan 0.6).
  const p: typeof raw.profile & { phone?: string; avatar?: ImageAsset; resumeUrl?: string } = raw.profile;
  return {
    profile: {
      name: p.name,
      role: p.role,
      headline: p.headline,
      location: p.location,
      timezone: p.timezone,
      email: p.email,
      ...(p.phone && { phone: p.phone }),
      intro: p.intro,
      statement: p.statement,
      about: p.about,
      portrait: p.portrait,
      ...(p.avatar && { avatar: p.avatar }),
      greetings: p.greetings,
      services: p.services,
      socials: p.socials,
      ...(p.resumeUrl && { resumeUrl: p.resumeUrl }),
      availability: p.availability,
      now: p.now,
    },
    site: {
      versionLabel: raw.site.versionLabel,
      seo: raw.site.seo,
    },
    projects: raw.projects.map(mapProject),
    experience: raw.experience.map(mapExperience),
    publications: raw.publications.map(mapPublication),
    skills: raw.toolkit.map((g) => ({ group: g.group, items: g.items })),
    education: raw.education.map((e) => ({
      degree: e.title,
      place: e.place,
      period: e.period,
      detail: e.detail,
      short: e.short,
    })),
  };
}

/**
 * `SITE_TEMPLATE`, validated. The template switch when there is no database (and in tests).
 * Unset or empty: folio. A retired id ("editorial", git tag v1-editorial) also gives folio, with a
 * warning, so an old .env or Vercel variable doesn't break a build. Anything else is a typo and
 * fails loudly.
 */
export function envTemplate(): TemplateId {
  const value = process.env.SITE_TEMPLATE?.trim();
  if (!value) return DEFAULT_TEMPLATE;
  if (isTemplateId(value)) return value;
  if (RETIRED_TEMPLATE_IDS.includes(value)) {
    warnRetired(value);
    return DEFAULT_TEMPLATE;
  }
  throw new Error(`SITE_TEMPLATE="${value}" is not a template. Use one of: ${TEMPLATE_IDS.join(", ")} (or leave it unset).`);
}

let warned = false;
function warnRetired(value: string): void {
  if (warned) return;
  warned = true;
  console.warn(
    `[template] SITE_TEMPLATE="${value}" was retired (git tag v1-editorial); using "${DEFAULT_TEMPLATE}". Remove the variable.`,
  );
}

/** lib/content.ts settings as `SiteSettings`, with the template from SITE_TEMPLATE. */
export function staticSettings(): SiteSettings {
  return {
    activeTemplate: envTemplate(),
    contactFormEnabled: raw.settings.contactFormEnabled,
    announcement: raw.settings.announcement,
  };
}
