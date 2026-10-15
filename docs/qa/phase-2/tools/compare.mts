// Seed vs lib/content.ts spot-check, through the anonymous REST API (what Phase 3 will map).
import * as raw from "file:///D:/VacationCodes/focus/experiement/lib/content.ts";

const B = "http://localhost:3650";
const get = async (p: string) => (await fetch(B + p)).json();

const checks: Array<[string, boolean, string?]> = [];
const eq = (name: string, a: unknown, b: unknown) => {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  checks.push([name, ok, ok ? undefined : `seed=${JSON.stringify(a)?.slice(0, 160)} content=${JSON.stringify(b)?.slice(0, 160)}`]);
};

const profile = await get("/api/globals/profile?depth=1");
const settings = await get("/api/globals/site-settings?depth=0");
const projects = (await get("/api/projects?sort=_order&limit=50&depth=1")).docs;
const experience = (await get("/api/experience?sort=_order&limit=50&depth=1")).docs;
const pubs = (await get("/api/publications?sort=_order&limit=50&depth=0")).docs;
const skills = (await get("/api/skills?sort=_order&limit=100&depth=0")).docs;
const edu = (await get("/api/education?limit=10&depth=0")).docs;

eq("profile.name", profile.name, raw.profile.name);
eq("profile.headline", profile.headline, raw.profile.headline);
eq("profile.statement", profile.statement, raw.profile.statement);
eq("profile.intro", profile.intro, raw.profile.intro);
eq("profile.greetings", profile.greetings.map((g: any) => ({ text: g.text, lang: g.lang })), raw.profile.greetings.map((g) => ({ text: g.text, lang: g.lang })));
eq("profile.services", profile.services.map((s: any) => ({ number: s.number, title: s.title, body: s.body })), raw.profile.services.map((s) => ({ number: s.number, title: s.title, body: s.body })));
eq("profile.availability", { status: profile.availability.status, label: profile.availability.label }, { status: raw.profile.availability.status, label: raw.profile.availability.label });
eq("profile.now", { text: profile.now.text, updated: profile.now.updated }, { text: raw.profile.now.text, updated: raw.profile.now.updated });
eq("profile.socials", profile.socials.map((s: any) => ({ label: s.label, url: s.url })), raw.profile.socials.map((s) => ({ label: s.label, url: s.url })));
eq("profile.portrait.alt", profile.portrait?.alt, raw.profile.portrait.alt);
eq("profile.portrait.size", [profile.portrait?.width, profile.portrait?.height], [raw.profile.portrait.width, raw.profile.portrait.height]);
eq("settings.versionLabel", settings.versionLabel, raw.site.versionLabel);
eq("settings.seo", { title: settings.seo.title, description: settings.seo.description }, { title: raw.site.seo.title, description: raw.site.seo.description });
eq("projects order (published)", projects.filter((p: any) => p.slug !== "qa-draft-only").map((p: any) => p.slug), raw.projects.map((p) => p.slug));
for (const rp of raw.projects) {
  const p = projects.find((x: any) => x.slug === rp.slug);
  if (!p) { checks.push([`project ${rp.slug}`, false, "missing"]); continue; }
  eq(`project ${rp.slug}.summary`, p.summary, rp.summary);
  eq(`project ${rp.slug}.stack (names via relation)`, p.stack.map((s: any) => s.name), rp.stack);
  eq(`project ${rp.slug}.featured`, p.featured, rp.featured);
  eq(`project ${rp.slug}.cover.alt`, p.cover?.alt ?? null, rp.image?.alt ?? null);
  eq(`project ${rp.slug}.phoneShots`, (p.phoneShots ?? []).map((m: any) => m.alt), rp.phone ? [rp.phone.alt] : []);
  eq(`project ${rp.slug}.caseStudy.enabled`, Boolean(p.caseStudy?.enabled), Boolean(rp.caseStudy));
  if (rp.caseStudy) {
    eq(`project ${rp.slug}.caseStudy.problem`, p.caseStudy.problem, rp.caseStudy.problem);
    eq(`project ${rp.slug}.caseStudy.metrics`, p.caseStudy.metrics.map((m: any) => ({ value: m.value, label: m.label })), rp.caseStudy.metrics);
    eq(`project ${rp.slug}.caseStudy.diagram absent`, p.caseStudy.diagram ?? null, rp.caseStudy.diagram ? "present" : null);
  }
}
eq("experience order", experience.map((e: any) => e.company), raw.experience.map((e) => e.company));
eq("experience[0].points", experience[0].points.map((x: any) => x.text), raw.experience[0].points);
eq("experience[0].skills", experience[0].skills.map((s: any) => s.name), raw.experience[0].skills);
eq("experience end (current role)", experience.map((e: any) => e.end ?? null), raw.experience.map((e) => e.end ?? null));
eq("publications", pubs.map((p: any) => [p.title, p.doi ?? null, p.status]), raw.publications.map((p) => [p.title, p.doi ?? null, p.status.toLowerCase()]));
const toolkit = ["languages", "frameworks", "data", "tools", "other"].map((g) => skills.filter((s: any) => s.group === g && s.showInToolkit).map((s: any) => s.name)).filter((x) => x.length);
eq("toolkit groups+order", toolkit, raw.toolkit.map((g) => g.items));
eq("education", edu.map((e: any) => [e.degree, e.period]), raw.education.map((e) => [e.title, e.period]));
eq("settings.contactFormEnabled", settings.contactFormEnabled, raw.settings.contactFormEnabled);

let pass = 0;
for (const [n, ok, why] of checks) { if (ok) pass++; else console.log(`FAIL ${n}: ${why}`); }
console.log(`${pass}/${checks.length} checks match`);
console.log("profile keys:", Object.keys(profile).join(","));
console.log("content.profile keys:", Object.keys(raw.profile).join(","));
console.log("content.site keys:", Object.keys(raw.site).join(","), "| settings keys:", Object.keys(raw.settings).join(","));
console.log("raw project keys:", Object.keys(raw.projects[0]).join(","));
console.log("raw experience keys:", Object.keys(raw.experience[0]).join(","));
console.log("raw education keys:", Object.keys(raw.education[0]).join(","));
