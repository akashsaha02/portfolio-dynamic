// Structured data (schema.org JSON-LD) built from `SiteContent`. Rendered by
// components/shared/JsonLd.tsx from the page files in app/(site)/, never by templates.

import type { Project, Publication, SiteContent } from "./content-types";

type Node = Record<string, unknown>;

/** JSON for a `<script type="application/ld+json">`. `<` is escaped so content can't close the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Wraps nodes in one document with a shared `@context`. */
export function jsonLdGraph(nodes: Node[]): Node {
  return { "@context": "https://schema.org", "@graph": nodes };
}

function absolute(path: string, base: URL): string {
  return new URL(path, base).href;
}

function personId(base: URL): string {
  return absolute("/#person", base);
}

export function personNode(content: SiteContent, base: URL): Node {
  const { profile, education, skills } = content;
  return {
    "@type": "Person",
    "@id": personId(base),
    name: profile.name,
    jobTitle: profile.role,
    description: profile.intro,
    url: absolute("/", base),
    email: `mailto:${profile.email}`,
    image: absolute(profile.portrait.src, base),
    homeLocation: { "@type": "Place", name: profile.location },
    sameAs: profile.socials.map((s) => s.url),
    ...(education.length > 0 && {
      alumniOf: education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.place })),
    }),
    knowsAbout: skills.flatMap((g) => g.items),
  };
}

/** The paper's canonical link: the DOI URL when there is a DOI, else `url`. */
function paperUrl(p: Publication): string | undefined {
  return p.doi ? `https://doi.org/${p.doi}` : p.url;
}

/** Published papers with a DOI or URL; the others aren't citable yet. */
export function citablePublications(content: SiteContent): Publication[] {
  return content.publications.filter((p) => p.status === "published" && paperUrl(p));
}

export function scholarlyArticleNode(p: Publication, base: URL): Node {
  const url = paperUrl(p);
  return {
    "@type": "ScholarlyArticle",
    headline: p.title,
    name: p.title,
    abstract: p.summary,
    datePublished: p.year,
    author: { "@id": personId(base) },
    isPartOf: { "@type": "CreativeWork", name: p.venue },
    ...(url && { url }),
    ...(p.doi && {
      identifier: { "@type": "PropertyValue", propertyID: "DOI", value: p.doi },
      sameAs: `https://doi.org/${p.doi}`,
    }),
  };
}

export function breadcrumbNode(items: { name: string; path: string }[], base: URL): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path, base),
    })),
  };
}

/** Home: the person plus their citable papers. */
export function homeJsonLd(content: SiteContent, base: URL): Node {
  return jsonLdGraph([
    personNode(content, base),
    ...citablePublications(content).map((p) => scholarlyArticleNode(p, base)),
  ]);
}

export function aboutJsonLd(content: SiteContent, base: URL): Node {
  return jsonLdGraph([personNode(content, base)]);
}

export function caseStudyJsonLd(project: Project, base: URL): Node {
  return jsonLdGraph([
    breadcrumbNode(
      [
        { name: "Home", path: "/" },
        { name: "Work", path: "/work" },
        { name: project.name, path: `/work/${project.slug}` },
      ],
      base,
    ),
  ]);
}
