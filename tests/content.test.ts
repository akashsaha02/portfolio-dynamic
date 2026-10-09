import { describe, expect, it } from "vitest";
import { education, experience, profile, projects, publications, toolkit } from "@/lib/content";

const nonEmpty = (s: unknown) => typeof s === "string" && s.trim().length > 0;

describe("lib/content data integrity", () => {
  it("profile has a plausible email and name", () => {
    expect(nonEmpty(profile.name)).toBe(true);
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("every project has name, url and a non-empty stack", () => {
    expect(projects.length).toBeGreaterThan(0);
    for (const p of projects) {
      expect(nonEmpty(p.name), "name").toBe(true);
      expect(p.url, `${p.name} url`).toMatch(/^https?:\/\//);
      expect(p.stack.length, `${p.name} stack`).toBeGreaterThan(0);
      for (const s of p.stack) expect(nonEmpty(s)).toBe(true);
    }
  });

  it("project names are unique", () => {
    const names = projects.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("experience entries have company, title and period", () => {
    expect(experience.length).toBeGreaterThan(0);
    for (const r of experience) {
      expect(nonEmpty(r.company)).toBe(true);
      expect(nonEmpty(r.title)).toBe(true);
      expect(nonEmpty(r.period)).toBe(true);
    }
  });

  it("publications have title, venue and year", () => {
    expect(publications.length).toBeGreaterThan(0);
    for (const p of publications) {
      expect(nonEmpty(p.title)).toBe(true);
      expect(nonEmpty(p.venue)).toBe(true);
      expect(String(p.year)).toMatch(/^\d{4}$/);
    }
  });

  it("toolkit and education are non-empty", () => {
    for (const g of toolkit) {
      expect(nonEmpty(g.group)).toBe(true);
      expect(g.items.length).toBeGreaterThan(0);
    }
    expect(education.length).toBeGreaterThan(0);
  });
});
