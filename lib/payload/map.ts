// Payload documents → the template contract (lib/content-types.ts, templates/types.ts).
//
// Pure: no I/O, no Next imports, relative paths only, so unit tests (tests/payload-map.test.ts)
// and scripts (scripts/verify-parity.ts) can run it. Payload types stop here: nothing in the
// return values references payload-types.ts, so templates never see them.
//
// Rules (work plan 3.1): relationships resolve to plain values (skills → names, media →
// ImageAsset, profile.resume → resumeUrl); empty optional text is omitted (phone, repo, now…);
// `period` comes from formatPeriod; `statusLabel` from PUBLICATION_STATUSES; `order` is the
// position in Payload's drag order (`_order`); a case study exists only when `enabled`.

import type {
  Education as PayloadEducation,
  Experience as PayloadExperience,
  Media,
  Profile as PayloadProfile,
  Project as PayloadProject,
  Publication as PayloadPublication,
  SiteSetting,
  Skill,
} from "../../payload-types";
import type {
  CaseStudy,
  Education,
  Experience,
  ImageAsset,
  Profile,
  Project,
  Publication,
  SiteContent,
  SkillGroup,
} from "../content-types";
import { formatPeriod } from "../format";
import { toTemplateId, type SiteSettings } from "../../templates/types";
import { PUBLICATION_STATUSES, SKILL_GROUPS } from "./options";

/** What lib/payload/read.ts loads for `SiteContent`. Lists are already in drag order. */
export type ContentDocs = {
  profile: PayloadProfile;
  siteSettings: Pick<SiteSetting, "versionLabel" | "seo">;
  projects: PayloadProject[];
  experience: PayloadExperience[];
  publications: PayloadPublication[];
  /** Skills with `showInToolkit`, in drag order. */
  toolkit: Skill[];
  education: PayloadEducation[];
};

export type SettingsDoc = Pick<SiteSetting, "activeTemplate" | "contactFormEnabled" | "announcement">;

type Relation<T> = string | T | null | undefined;

/** A populated relationship, or null when it is an id (not populated, or not readable) / empty. */
function populated<T extends object>(value: Relation<T>): T | null {
  return value !== null && typeof value === "object" ? value : null;
}

function filled(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** `{ [key]: value }` when the text is non-empty, otherwise `{}`: spread it to omit empty fields. */
function optional<K extends string>(key: K, value: string | null | undefined): Partial<Record<K, string>> {
  return filled(value) ? ({ [key]: value } as Record<K, string>) : {};
}

/**
 * An uploaded image as `ImageAsset`, or undefined when missing, not populated, or without a
 * size (next/image needs one). `src` is Payload's URL: `/api/media/file/<name>` on local disk,
 * the public Blob URL on Vercel (allowed by `images.remotePatterns` in next.config.ts).
 */
export function mapImage(value: Relation<Media>): ImageAsset | undefined {
  const media = populated(value);
  if (!media || !filled(media.url) || !media.width || !media.height) return undefined;
  return { src: media.url, alt: media.alt, width: media.width, height: media.height };
}

function requireImage(value: Relation<Media>, field: string): ImageAsset {
  const image = mapImage(value);
  if (!image) throw new Error(`Payload: ${field} is missing or has no file/size. Upload it again in the admin.`);
  return image;
}

function skillNames(value: Relation<Skill>[] | null | undefined): string[] {
  return (value ?? []).flatMap((s) => {
    const skill = populated(s);
    return skill ? [skill.name] : [];
  });
}

function mapCaseStudy(c: NonNullable<PayloadProject["caseStudy"]>): CaseStudy {
  const diagram = mapImage(c.diagram);
  return {
    role: c.role ?? "",
    problem: c.problem ?? "",
    built: c.built ?? "",
    how: c.how ?? "",
    outcome: c.outcome ?? "",
    metrics: (c.metrics ?? []).map((m) => ({ value: m.value, label: m.label })),
    ...(diagram && { diagram }),
  };
}

export function mapProject(p: PayloadProject, index: number): Project {
  const cover = mapImage(p.cover);
  return {
    name: p.name,
    slug: p.slug,
    kind: p.kind,
    type: p.type,
    year: p.year,
    featured: Boolean(p.featured),
    order: index + 1,
    summary: p.summary,
    stack: skillNames(p.stack),
    url: p.url,
    linkLabel: p.linkLabel,
    ...optional("repo", p.repo),
    ...(cover && { cover }),
    phoneShots: (p.phoneShots ?? []).flatMap((m) => {
      const image = mapImage(m);
      return image ? [image] : [];
    }),
    ...(p.caseStudy?.enabled && { caseStudy: mapCaseStudy(p.caseStudy) }),
  };
}

export function mapExperience(e: PayloadExperience): Experience {
  const end = filled(e.end) ? e.end : null;
  return {
    company: e.company,
    ...optional("url", e.url),
    title: e.title,
    place: e.place,
    start: e.start,
    end,
    period: formatPeriod(e.start, end),
    points: (e.points ?? []).map((point) => point.text),
    skills: skillNames(e.skills),
  };
}

export function mapPublication(p: PayloadPublication): Publication {
  const label = PUBLICATION_STATUSES.find((s) => s.value === p.status)?.label ?? p.status;
  return {
    title: p.title,
    venue: p.venue,
    year: p.year,
    status: p.status,
    statusLabel: label,
    ...optional("doi", p.doi),
    ...optional("url", p.url),
    summary: p.summary,
    ...optional("bibtex", p.bibtex),
  };
}

/** Toolkit skills grouped in SKILL_GROUPS order; empty groups are left out. */
export function mapToolkit(skills: Skill[]): SkillGroup[] {
  return SKILL_GROUPS.flatMap((group) => {
    const items = skills.filter((s) => s.showInToolkit && s.group === group.value).map((s) => s.name);
    return items.length > 0 ? [{ group: group.label, items }] : [];
  });
}

export function mapEducation(e: PayloadEducation): Education {
  const short = e.short;
  return {
    degree: e.degree,
    place: e.place,
    period: e.period,
    detail: e.detail,
    // All three or nothing: a half-filled short form would render as a broken one-liner.
    ...(short && filled(short.degree) && filled(short.grade) && filled(short.place)
      ? { short: { degree: short.degree, grade: short.grade, place: short.place } }
      : {}),
  };
}

export function mapProfile(p: PayloadProfile): Profile {
  const avatar = mapImage(p.avatar);
  const resume = populated(p.resume);
  const now = p.now;
  return {
    name: p.name,
    role: p.role,
    headline: p.headline,
    location: p.location,
    timezone: p.timezone,
    email: p.email,
    ...optional("phone", p.phone),
    intro: p.intro,
    statement: p.statement,
    about: p.about,
    portrait: requireImage(p.portrait, "profile.portrait"),
    ...(avatar && { avatar }),
    greetings: (p.greetings ?? []).map((g) => ({ text: g.text, lang: g.lang })),
    services: (p.services ?? []).map((s) => ({ number: s.number, title: s.title, body: s.body })),
    socials: (p.socials ?? []).map((s) => ({ label: s.label, url: s.url })),
    ...optional("resumeUrl", resume?.url),
    availability: { status: p.availability.status, label: p.availability.label },
    ...(now && filled(now.text) ? { now: { text: now.text, updated: now.updated ?? "" } } : {}),
  };
}

export function mapSiteContent(docs: ContentDocs): SiteContent {
  const { seo } = docs.siteSettings;
  const ogImage = mapImage(seo.ogImage);
  return {
    profile: mapProfile(docs.profile),
    site: {
      versionLabel: docs.siteSettings.versionLabel,
      seo: { title: seo.title, description: seo.description, ...(ogImage && { ogImage }) },
    },
    projects: docs.projects.map(mapProject),
    experience: docs.experience.map(mapExperience),
    publications: docs.publications.map(mapPublication),
    skills: mapToolkit(docs.toolkit),
    education: docs.education.map(mapEducation),
  };
}

export function mapSettings(s: SettingsDoc): SiteSettings {
  const a = s.announcement;
  return {
    // A stored id that is no longer a template ("editorial", retired in 5.2) renders the default
    // instead of failing every page. globals/SiteSettings.ts coerces it on read and save as well.
    activeTemplate: toTemplateId(s.activeTemplate),
    contactFormEnabled: s.contactFormEnabled ?? true,
    announcement: a?.enabled && filled(a.text) ? { text: a.text, ...optional("url", a.url) } : null,
  };
}
