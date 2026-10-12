// The data layer: maps the raw content source to the template contract (lib/content-types.ts).
//
// Today the source is lib/content.ts. In Phase 3 (work plan 3.1) these functions read the Payload
// Local API instead; their signatures and return types stay the same, so templates never change.

import { cache } from "react";
import * as raw from "./content";
import type {
  CaseStudy,
  ImageAsset,
  Experience,
  Project,
  Publication,
  PublicationStatus,
  SiteContent,
} from "./content-types";
import { isTemplateId, TEMPLATE_IDS, type SiteSettings, type TemplateId } from "@/templates/types";

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

function mapCaseStudy(c: raw.CaseStudy): CaseStudy {
  return {
    role: c.role,
    problem: c.problem,
    built: c.built,
    how: c.how,
    outcome: c.outcome,
    metrics: c.metrics.map((m) => ({ value: m.value, label: m.label })),
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

/**
 * Everything the public site renders. Wrapped in React `cache` so layout metadata and the page
 * share one result per request.
 *
 * Phase 3: add `'use cache'`, `cacheLife('max')` and `cacheTag('site-content', ...)` here once
 * the cacheComponents decision (work plan 2.2) is made. cacheComponents is off today, so
 * 'use cache' is not available yet. Never read cookies()/headers() inside the cached function.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  // Optional fields aren't in lib/content.ts until Akash supplies them (work plan 0.6).
  const p: typeof raw.profile & { phone?: string; avatar?: ImageAsset; resumeUrl?: string } = raw.profile;
  return {
    profile: {
      name: p.name,
      role: p.role,
      location: p.location,
      timezone: p.timezone,
      email: p.email,
      ...(p.phone && { phone: p.phone }),
      intro: p.intro,
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
    })),
  };
});

function readActiveTemplate(): TemplateId {
  const value = process.env.SITE_TEMPLATE?.trim() || "editorial";
  if (!isTemplateId(value)) {
    throw new Error(`SITE_TEMPLATE="${value}" is not a template. Use one of: ${TEMPLATE_IDS.join(", ")}`);
  }
  return value;
}

/**
 * Site settings: which template is active, plus operational toggles.
 *
 * `activeTemplate` comes from the SITE_TEMPLATE env var for now (read at build time for static
 * pages). Phase 3 reads Payload `site-settings` instead, with `'use cache'` + `cacheTag('settings')`.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  return {
    activeTemplate: readActiveTemplate(),
    contactFormEnabled: raw.settings.contactFormEnabled,
    announcement: raw.settings.announcement,
  };
});

type WithCaseStudy = Project & { caseStudy: CaseStudy };

function hasCaseStudy(p: Project): p is WithCaseStudy {
  return p.caseStudy !== undefined;
}

/** Projects that get a /work/[slug] page, in display order. */
export function caseStudyProjects(content: SiteContent): WithCaseStudy[] {
  return content.projects.filter(hasCaseStudy);
}

/** The case study for `slug` and the next one (wrapping around), or null if there is none. */
export function findCaseStudy(
  content: SiteContent,
  slug: string,
): { project: WithCaseStudy; next: Project | null } | null {
  const list = caseStudyProjects(content);
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  const next = list.length > 1 ? list[(index + 1) % list.length] : null;
  return { project: list[index], next };
}
