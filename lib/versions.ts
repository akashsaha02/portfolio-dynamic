import type { TemplateId } from "@/templates/types";

/**
 * Every design this site has had (work plan 6.3), newest first. Live templates (`template` set)
 * render at "/"; the /v page shows only the active one, marked current, so a template you are
 * not using never appears as an "older version". Retired designs are frozen static snapshots under
 * public/v/<id>/ (built from their git tag by scripts/snapshot-version.mjs, so they never change
 * and never call the backend).
 */
export type VersionEntry = {
  id: string;
  name: string;
  /** Display period, e.g. "Oct 2026" or "2026 – now". */
  period: string;
  description: string;
  /** Where to see it: "/" for the current design, "/v/<id>" for a snapshot. */
  href: string;
  /** Git tag the snapshot was built from. */
  tag?: string;
  /** A live template: shown on /v only while it is the active one. */
  template?: TemplateId;
  /** Set by versionsFor() for the active template. */
  current?: boolean;
  /** Optional 16:10 screenshot. */
  image?: { src: string; alt: string; width: number; height: number };
};

export const VERSIONS: VersionEntry[] = [
  {
    id: "terminal",
    name: "Terminal",
    period: "Oct 2026 – now",
    description: "A developer's command line: monospace, prompt-style headings, projects as ls -l rows.",
    href: "/",
    template: "terminal",
  },
  {
    id: "brutal",
    name: "Brutal",
    period: "Oct 2026 – now",
    description: "Neo-brutalist: huge type, thick ink borders and flat paper, ink and lime blocks.",
    href: "/",
    template: "brutal",
  },
  {
    id: "index",
    name: "Index",
    period: "Oct 2026 – now",
    description: "Two columns on ink: everything a recruiter looks for on one scroll.",
    href: "/",
    template: "index",
  },
  {
    id: "folio",
    name: "Folio",
    period: "Oct 2026 – now",
    description: "Multi-page, phone-first, with an admin to edit everything.",
    href: "/",
    template: "folio",
  },
  {
    id: "editorial",
    name: "Editorial",
    period: "Oct 2026",
    description: "The first version: one long page on paper and ink with a lime accent.",
    href: "/v/editorial",
    tag: "v1-editorial",
    image: {
      src: "/v/editorial-cover.webp",
      alt: "The Editorial version: AKASH SAHA in huge dark letters behind a portrait, a lime signature and a pill-shaped menu on pale paper.",
      width: 1600,
      height: 1000,
    },
  },
];

/** The /v list for the active template: it (marked current) plus every retired snapshot. */
export function versionsFor(active: TemplateId): VersionEntry[] {
  return VERSIONS.filter((v) => !v.template || v.template === active).map((v) => ({
    ...v,
    current: v.template === active,
  }));
}
