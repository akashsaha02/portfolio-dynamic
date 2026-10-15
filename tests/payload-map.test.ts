import { describe, expect, it } from "vitest";
import * as raw from "@/lib/content";
import type { ImageAsset, SiteContent } from "@/lib/content-types";
import { mapImage, mapSettings, mapSiteContent, type ContentDocs } from "@/lib/payload/map";
import { SKILL_GROUPS } from "@/lib/payload/options";
import { staticSettings, staticSiteContent } from "@/lib/static-content";
import type { Media, Project, Skill } from "@/payload-types";

// A faked Payload response (depth 1, drag order), built from lib/content.ts the way
// scripts/seed.ts stores it. The mapper must turn it back into exactly what the static source
// yields, except image `src`, which is Payload's file URL.

const stamp = { createdAt: "2026-10-15T00:00:00.000Z", updatedAt: "2026-10-15T00:00:00.000Z" };
let nextId = 0;
const id = () => `id${++nextId}`;

function media(image: { src: string; alt: string; width: number; height: number }): Media {
  const filename = image.src.split("/").pop()!;
  return {
    id: id(),
    alt: image.alt,
    url: `/api/media/file/${filename}`,
    filename,
    mimeType: "image/webp",
    width: image.width,
    height: image.height,
    ...stamp,
  };
}

const groupValue = new Map<string, Skill["group"]>(SKILL_GROUPS.map((g) => [g.label, g.value]));
const skills = new Map<string, Skill>();
function skill(name: string, group: Skill["group"] = "other", showInToolkit = false): Skill {
  const existing = skills.get(name);
  if (existing) return existing;
  const doc: Skill = { id: id(), _order: `a${skills.size}`, name, group, showInToolkit, ...stamp };
  skills.set(name, doc);
  return doc;
}
for (const g of raw.toolkit) for (const name of g.items) skill(name, groupValue.get(g.group)!, true);

function fakeDocs(): ContentDocs {
  const p = raw.profile;
  const projects: Project[] = raw.projects.map((r, i) => ({
    id: id(),
    _order: `a${i}`,
    _status: "published",
    name: r.name,
    slug: r.slug,
    kind: r.kind,
    type: r.type,
    year: (r.year ?? r.period)!,
    featured: r.featured,
    summary: r.summary,
    stack: r.stack.map((n) => skill(n)),
    url: r.url,
    linkLabel: r.linkLabel,
    repo: r.repo ?? null,
    cover: r.image ? media(r.image) : null,
    phoneShots: r.phone ? [media(r.phone)] : [],
    caseStudy: r.caseStudy
      ? { enabled: true, ...r.caseStudy, metrics: r.caseStudy.metrics.map((m) => ({ ...m, id: id() })), diagram: null }
      : { enabled: false, role: null, problem: null, built: null, how: null, outcome: null, metrics: [], diagram: null },
    nextProject: null,
    ...stamp,
  }));

  return {
    profile: {
      id: id(),
      name: p.name,
      role: p.role,
      headline: p.headline,
      location: p.location,
      timezone: p.timezone,
      email: p.email,
      phone: null,
      portrait: media(p.portrait),
      avatar: null,
      intro: p.intro,
      statement: p.statement,
      about: p.about,
      services: p.services.map((s) => ({ ...s, id: id() })),
      greetings: p.greetings.map((g) => ({ ...g, id: id() })),
      socials: p.socials.map((s) => ({ ...s, id: id() })),
      resume: null,
      availability: { ...p.availability },
      now: { ...p.now },
    },
    siteSettings: { versionLabel: raw.site.versionLabel, seo: { ...raw.site.seo, ogImage: null } },
    projects,
    experience: raw.experience.map((r, i) => ({
      id: id(),
      _order: `a${i}`,
      company: r.company,
      title: r.title,
      place: r.place,
      url: r.url ?? null,
      start: r.start,
      end: r.end,
      points: r.points.map((text) => ({ text, id: id() })),
      skills: r.skills.map((n) => skill(n)),
      ...stamp,
    })),
    publications: raw.publications.map((r, i) => ({
      id: id(),
      _order: `a${i}`,
      title: r.title,
      venue: r.venue,
      year: r.year,
      status: r.status.toLowerCase() as "published" | "accepted" | "submitted",
      doi: r.doi ?? null,
      url: r.url ?? null,
      summary: r.summary,
      bibtex: null,
      ...stamp,
    })),
    toolkit: [...skills.values()].filter((s) => s.showInToolkit),
    education: raw.education.map((e, i) => ({
      id: id(),
      _order: `a${i}`,
      degree: e.title,
      place: e.place,
      period: e.period,
      detail: e.detail,
      short: { ...e.short },
      ...stamp,
    })),
  };
}

/** JSON round trip (what unstable_cache stores) with image sources reduced to file names. */
function comparable(content: SiteContent): unknown {
  return JSON.parse(
    JSON.stringify(content, function (key, value) {
      const isImage = value && typeof value === "object" && typeof value.src === "string" && "width" in value;
      return isImage ? { ...(value as ImageAsset), src: (value as ImageAsset).src.split("/").pop() } : value;
    }),
  );
}

describe("lib/payload/map", () => {
  it("maps the seeded data to exactly the static SiteContent", () => {
    expect(comparable(mapSiteContent(fakeDocs()))).toEqual(comparable(staticSiteContent()));
  });

  it("uses Payload's file URL for images", () => {
    const content = mapSiteContent(fakeDocs());
    expect(content.profile.portrait.src).toBe("/api/media/file/portrait.webp");
    expect(content.projects[0].cover?.src).toBe("/api/media/file/abroadly.webp");
  });

  it("omits empty optional fields and resolves the résumé", () => {
    const docs = fakeDocs();
    docs.profile.phone = "  ";
    docs.profile.now = { text: "", updated: "2026-10-10" };
    docs.profile.resume = { ...media({ src: "/cv.pdf", alt: "Résumé", width: 1, height: 1 }), mimeType: "application/pdf" };
    const { profile } = mapSiteContent(docs);
    expect(profile).not.toHaveProperty("phone");
    expect(profile).not.toHaveProperty("now");
    expect(profile.resumeUrl).toBe("/api/media/file/cv.pdf");

    docs.profile.phone = "+880 1234";
    expect(mapSiteContent(docs).profile.phone).toBe("+880 1234");
  });

  it("keeps a case study only when enabled, with an optional diagram", () => {
    const docs = fakeDocs();
    const abroadly = docs.projects[0];
    abroadly.caseStudy!.diagram = media({ src: "/d.svg", alt: "Flow", width: 800, height: 400 });
    docs.projects[1].caseStudy!.enabled = false;
    const [first, second] = mapSiteContent(docs).projects;
    expect(first.caseStudy?.diagram).toEqual({ src: "/api/media/file/d.svg", alt: "Flow", width: 800, height: 400 });
    expect(second).not.toHaveProperty("caseStudy");
  });

  it("drops unpopulated relationships and images without a size", () => {
    expect(mapImage("someid")).toBeUndefined();
    expect(mapImage(null)).toBeUndefined();
    expect(mapImage({ ...media({ src: "/x.svg", alt: "x", width: 1, height: 1 }), width: null })).toBeUndefined();
    const docs = fakeDocs();
    docs.projects[0].stack = ["unpopulated-id", ...(docs.projects[0].stack ?? [])];
    expect(mapSiteContent(docs).projects[0].stack).toEqual(raw.projects[0].stack);
  });

  it("fails loudly without a portrait", () => {
    const docs = fakeDocs();
    docs.profile.portrait = "missing-id";
    expect(() => mapSiteContent(docs)).toThrow(/profile\.portrait/);
  });

  it("derives order, period and status label", () => {
    const content = mapSiteContent(fakeDocs());
    expect(content.projects.map((p) => p.order)).toEqual(raw.projects.map((_, i) => i + 1));
    expect(content.experience[0]).toMatchObject({ end: null, period: "Nov 2025 – now" });
    expect(content.publications.map((p) => p.statusLabel)).toEqual(["Published", "Submitted"]);
  });

  it("maps settings and validates the template", () => {
    expect(mapSettings({ activeTemplate: "folio", contactFormEnabled: true, announcement: { enabled: false } })).toEqual({
      ...staticSettings(),
      activeTemplate: "folio",
    });
    expect(
      mapSettings({ activeTemplate: "editorial", contactFormEnabled: null, announcement: { enabled: true, text: "Hi", url: "" } }),
    ).toEqual({ activeTemplate: "editorial", contactFormEnabled: true, announcement: { text: "Hi" } });
    expect(() => mapSettings({ activeTemplate: "nope" as "folio" })).toThrow(/not a template/);
  });
});
