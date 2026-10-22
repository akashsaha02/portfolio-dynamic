import { describe, expect, it } from "vitest";
import type { CommandItem } from "@/components/shared/CommandMenu";
import type { SiteContent } from "@/lib/content-types";
import { staticSiteContent } from "@/lib/static-content";
import { folioCommands } from "@/templates/folio/commands";
import { indexCommands } from "@/templates/index/commands";

const content = staticSiteContent();
const builders = { folio: folioCommands, index: indexCommands } as const;

describe.each(Object.entries(builders))("%s command list", (name, build) => {
  const items = build(content);
  const byId = (id: string) => items.find((i) => i.id === id);

  it("ids are unique and every item has a label and group", () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const i of items) {
      expect(i.label.trim()).not.toBe("");
      expect(i.group.trim()).not.toBe("");
    }
  });

  it("lists the pages, including Archive, Lab and Older versions", () => {
    const hrefs = items.filter((i) => i.group === "Pages").map((i) => (i.action.type === "link" ? i.action.href : ""));
    expect(hrefs).toEqual(expect.arrayContaining(["/", "/work", "/about", "/contact", "/archive", "/lab", "/v"]));
  });

  it("has one case-study entry per project that has a case study", () => {
    const expected = content.projects.filter((p) => p.caseStudy).map((p) => `/work/${p.slug}`);
    const actual = items.filter((i) => i.group === "Case studies").map((i) => (i.action as { href: string }).href);
    expect(actual).toEqual(expected);
    expect(expected.length).toBeGreaterThan(0);
  });

  it("copy-email copies the profile email and falls back to mailto", () => {
    expect(byId("copy-email")?.action).toMatchObject({
      type: "copy",
      value: content.profile.email,
      fallbackHref: `mailto:${content.profile.email}`,
    });
  });

  it("social links open in a new tab", () => {
    const social = items.filter((i) => i.id.startsWith("social:"));
    expect(social).toHaveLength(content.profile.socials.length);
    for (const s of social) expect(s.action).toMatchObject({ type: "link", external: true });
  });

  it("the résumé entry exists only when a résumé is uploaded", () => {
    const withResume = build({ ...content, profile: { ...content.profile, resumeUrl: "/x.pdf" } });
    const without = build({ ...content, profile: { ...content.profile, resumeUrl: undefined } });
    expect(withResume.some((i) => i.id === "resume")).toBe(true);
    expect(without.some((i) => i.id === "resume")).toBe(false);
  });

  it("home sections vanish when their content is empty", () => {
    const empty: SiteContent = {
      ...content,
      experience: [],
      publications: [],
      education: [],
      projects: content.projects.map((p) => ({ ...p, featured: false })),
    };
    const ids = build(empty)
      .filter((i) => i.group === "On the home page")
      .map((i) => i.id);
    expect(ids).toEqual(name === "index" ? ["section:about"] : []);
    expect(items.filter((i) => i.group === "On the home page").length).toBeGreaterThan(0);
  });
});

describe("annotations entry", () => {
  it("Folio offers the toggle as an event", () => {
    const a = folioCommands(content).find((i: CommandItem) => i.id === "annotations")?.action;
    expect(a).toMatchObject({ type: "event", name: "folio:annotations-toggle" });
  });
  it("Index has none", () => {
    expect(indexCommands(content).some((i) => i.id === "annotations")).toBe(false);
  });
});
