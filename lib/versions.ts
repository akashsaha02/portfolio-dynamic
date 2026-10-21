/**
 * Every design this site has had (work plan 6.3), newest first. The current one is the live
 * site; retired ones are frozen static snapshots under public/v/<id>/ (built from their git tag
 * by scripts/snapshot-version, so they never change and never call the backend).
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
  current?: boolean;
  /** Optional 16:10 screenshot. */
  image?: { src: string; alt: string; width: number; height: number };
};

export const VERSIONS: VersionEntry[] = [
  {
    id: "folio",
    name: "Folio",
    period: "Oct 2026 – now",
    description: "Multi-page, phone-first, with an admin to edit everything.",
    href: "/",
    current: true,
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
