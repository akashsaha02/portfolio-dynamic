/**
 * The template contract.
 *
 * Templates receive `SiteContent` (plus `TemplateSettings`, see templates/types.ts) via props and
 * never import data directly. `lib/data.ts` maps the raw source (today `lib/content.ts`, from
 * Phase 3 the Payload Local API) to these types, so swapping the source never touches a template.
 *
 * Rules for this file:
 * - Plain, serialisable data only (no Dates, functions, class instances, Payload types).
 * - Dates are strings: months as "YYYY-MM", days as "YYYY-MM-DD".
 * - Optional fields are ones whose content may legitimately not exist yet; templates must
 *   render cleanly without them.
 */

/** A raster image with intrinsic size, ready for `next/image`. `src` is a path or absolute URL. */
export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type SocialLink = {
  label: string;
  url: string;
};

/** Preloader greeting. `lang` is a BCP 47 tag, for the `lang` attribute. */
export type Greeting = {
  text: string;
  lang: string;
};

/** About-page services. `number` is the display label, e.g. "01". */
export type Service = {
  number: string;
  title: string;
  body: string;
};

export type AvailabilityStatus = "open" | "limited" | "closed";

export type Availability = {
  status: AvailabilityStatus;
  /** Short badge text, e.g. "Open to full-stack roles". */
  label: string;
};

/** The "Now" line on About. */
export type NowEntry = {
  text: string;
  /** Last updated, "YYYY-MM-DD". */
  updated: string;
};

export type Profile = {
  name: string;
  role: string;
  /** Hero tagline under the name, e.g. "Full-stack developer & ML researcher". */
  headline: string;
  /** Display location, e.g. "Dhaka, Bangladesh". */
  location: string;
  /** IANA time zone for the live local-time clock, e.g. "Asia/Dhaka". */
  timezone: string;
  email: string;
  /** Only present when Akash wants it public (guide §13, default off). */
  phone?: string;
  /** Intro statement: two sentences, used on Home and as the default meta description base. */
  intro: string;
  /** Large statement on Home and About (first sentence of the about text). */
  statement: string;
  /** Longer about paragraph. */
  about: string;
  /** Cutout portrait. */
  portrait: ImageAsset;
  /** Small square avatar for the footer. Missing until the asset exists (work plan 0.6). */
  avatar?: ImageAsset;
  /** Preloader words, in display order. */
  greetings: Greeting[];
  services: Service[];
  socials: SocialLink[];
  /** Résumé PDF URL. Missing until a résumé is uploaded (work plan 0.6). */
  resumeUrl?: string;
  availability: Availability;
  now?: NowEntry;
};

export type Seo = {
  /** Default document title (home page). */
  title: string;
  /** Default meta description. */
  description: string;
  /** Fallback Open Graph image. Missing until one exists (2.7 adds a generated one). */
  ogImage?: ImageAsset;
};

/** Site-wide content the template displays. Operational toggles live in TemplateSettings. */
export type SiteMeta = {
  /** Footer version label, e.g. "2026 © Edition". */
  versionLabel: string;
  seo: Seo;
};

export type ProjectType = "fullstack" | "ml";

export type Metric = {
  /** e.g. "96%" */
  value: string;
  /** e.g. "accuracy with VGG16" */
  label: string;
};

/** Present only on projects that get a /work/[slug] page (guide §4.4). */
export type CaseStudy = {
  role: string;
  problem: string;
  built: string;
  how: string;
  outcome: string;
  metrics: Metric[];
  /**
   * Architecture diagram for "How it works" (guide §4.4), normally an SVG. `alt` describes the
   * flow in words. Missing until Akash supplies one; render "How it works" without it.
   * next/image serves `.svg` sources unoptimized automatically, so it costs no transformations.
   */
  diagram?: ImageAsset;
};

export type Project = {
  name: string;
  /** URL-safe, unique. Used for /work/[slug]. */
  slug: string;
  /** One-line description, e.g. "Study abroad agency platform". */
  kind: string;
  type: ProjectType;
  /** Display year or range, e.g. "2026" or "2024–25". */
  year: string;
  /** Shown in "Recent work" on Home. */
  featured: boolean;
  /** Sort key, ascending. `SiteContent.projects` is already sorted by it. */
  order: number;
  summary: string;
  stack: string[];
  /** Primary link: the live site, or the repo when there is no live site. */
  url: string;
  /** Accessible label for the primary link, e.g. "Open Abroadly". */
  linkLabel: string;
  /** Source code, when it is public and different from `url`. */
  repo?: string;
  /** Desktop screenshot, 16:10. */
  cover?: ImageAsset;
  /** Phone screenshots, in display order. Empty when there are none. */
  phoneShots: ImageAsset[];
  caseStudy?: CaseStudy;
};

export type Experience = {
  company: string;
  url?: string;
  title: string;
  place: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", or null for the current role. */
  end: string | null;
  /** Display label derived from start/end, e.g. "Nov 2025 – now", "Jul – Oct 2025". */
  period: string;
  points: string[];
  skills: string[];
};

export type PublicationStatus = "published" | "accepted" | "submitted";

export type Publication = {
  title: string;
  venue: string;
  year: string;
  status: PublicationStatus;
  /** Display label for the status chip, e.g. "Published". */
  statusLabel: string;
  /** Bare DOI, e.g. "10.1109/...". */
  doi?: string;
  /** Link to the paper (the DOI URL when there is a DOI). */
  url?: string;
  summary: string;
  /** For "Copy BibTeX". Missing until real BibTeX is provided. */
  bibtex?: string;
};

export type SkillGroup = {
  group: string;
  items: string[];
};

export type Education = {
  degree: string;
  place: string;
  /** Display period, e.g. "2021 – 2025". */
  period: string;
  detail: string;
  /** Short forms for one-line summaries, e.g. "B.Tech CSE · 8.92/10 · KIIT". */
  short?: { degree: string; grade: string; place: string };
};

/** Everything a template needs to render the public site. */
export type SiteContent = {
  profile: Profile;
  site: SiteMeta;
  /** Sorted by `order`. */
  projects: Project[];
  /** Most recent first. */
  experience: Experience[];
  publications: Publication[];
  skills: SkillGroup[];
  education: Education[];
};
