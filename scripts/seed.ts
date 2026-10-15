// Seed Payload from the static content (work plan 2.4): `npm run seed`.
//
// Imports lib/content.ts (still the source of truth until Phase 3), public/portrait.webp and
// public/projects/* into Payload. Idempotent: every document is matched on a natural key
// (media: filename, skills: name, projects: slug, experience: company + start, publications:
// title, education: degree) and only updated when its seeded fields differ, so a second run
// changes nothing (and adds no project versions).
//
// Needs DATABASE_URI and PAYLOAD_SECRET (from the shell or .env.local; `payload run` loads env
// files). Optional SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD create the admin user when the users
// collection is empty. There is no default password.
//
// Trusted system work: every call uses `overrideAccess: true`, and `disableRevalidate` because
// revalidateTag only works inside a Next request.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type CollectionSlug, type Where } from "payload";
import config from "../payload.config";
import { SKILL_GROUPS } from "../collections/Skills";
import * as raw from "../lib/content";
import { isTemplateId } from "../templates/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const payload = await getPayload({ config });
const base = { overrideAccess: true, context: { disableRevalidate: true } } as const;

const stats: Record<string, { created: number; updated: number; unchanged: number }> = {};
function count(slug: string, what: "created" | "updated" | "unchanged") {
  stats[slug] ??= { created: 0, updated: 0, unchanged: 0 };
  stats[slug][what] += 1;
}

// --- Comparison: are the seeded fields already stored as-is? ---------------------------------

/** Drops ids, nulls and empty arrays so stored docs compare equal to seed data. */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (key === "id" || v === null || v === undefined) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      out[key] = normalize(v);
    }
    return out;
  }
  return value;
}

function differs(existing: Record<string, unknown>, data: Record<string, unknown>): boolean {
  const stored = Object.fromEntries(Object.keys(data).map((k) => [k, existing[k]]));
  return JSON.stringify(normalize(stored)) !== JSON.stringify(normalize(data));
}

// --- Upserts ------------------------------------------------------------------------------------

type Data = Record<string, unknown>;

async function upsert(collection: CollectionSlug, where: Where, data: Data, drafts = false): Promise<string> {
  const { docs } = await payload.find({ ...base, collection, where, depth: 0, limit: 1, draft: false });
  const existing = docs[0] as unknown as (Data & { id: string }) | undefined;
  const fullData = drafts ? { ...data, _status: "published" } : data;

  if (!existing) {
    const doc = await payload.create({ ...base, collection, data: fullData as never, draft: false, depth: 0 });
    count(collection, "created");
    return String(doc.id);
  }
  if (differs(existing, fullData)) {
    await payload.update({ ...base, collection, id: existing.id, data: fullData as never, draft: false, depth: 0 });
    count(collection, "updated");
  } else {
    count(collection, "unchanged");
  }
  return String(existing.id);
}

async function upsertGlobal(slug: "profile" | "site-settings", data: Data): Promise<void> {
  const existing = (await payload.findGlobal({ ...base, slug, depth: 0 })) as unknown as Data;
  if (differs(existing, data)) {
    await payload.updateGlobal({ ...base, slug, data: data as never, depth: 0 });
    count(slug, "updated");
  } else {
    count(slug, "unchanged");
  }
}

type Image = { src: string; alt: string };

/** Uploads a file from public/ once (matched by filename); afterwards only keeps `alt` in sync. */
async function upsertMedia(image: Image): Promise<string> {
  const filename = path.basename(image.src);
  const { docs } = await payload.find({
    ...base,
    collection: "media",
    where: { filename: { equals: filename } },
    depth: 0,
    limit: 1,
  });
  const existing = docs[0];
  if (!existing) {
    const doc = await payload.create({
      ...base,
      collection: "media",
      data: { alt: image.alt },
      filePath: path.join(root, "public", image.src.replace(/^\//, "")),
      depth: 0,
    });
    count("media", "created");
    return String(doc.id);
  }
  if (existing.alt !== image.alt) {
    await payload.update({ ...base, collection: "media", id: existing.id, data: { alt: image.alt }, depth: 0 });
    count("media", "updated");
  } else {
    count("media", "unchanged");
  }
  return String(existing.id);
}

// --- Admin user ---------------------------------------------------------------------------------

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Admin user: skipped (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set).");
    return;
  }
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");

  const { totalDocs } = await payload.count({ ...base, collection: "users" });
  if (totalDocs > 0) {
    // Never reset a password from a script: the admin changes it in /admin.
    console.log("Admin user: an admin already exists, left unchanged.");
    return;
  }
  await payload.create({ ...base, collection: "users", data: { email, password } });
  console.log(`Admin user: created ${email}.`);
}

// --- Content ------------------------------------------------------------------------------------

async function seedSkills(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  const groupValue = new Map<string, string>(SKILL_GROUPS.map((g) => [g.label, g.value]));

  // Toolkit first (group order, then item order), so the drag order starts as today's display order.
  for (const { group, items } of raw.toolkit) {
    const value = groupValue.get(group);
    if (!value) throw new Error(`Toolkit group "${group}" has no option in collections/Skills.ts`);
    for (const name of items) {
      ids.set(name, await upsert("skills", { name: { equals: name } }, { name, group: value, showInToolkit: true }));
    }
  }
  // Then every other name used by a project stack or a role.
  const others = [...raw.projects.flatMap((p) => p.stack), ...raw.experience.flatMap((r) => r.skills)];
  for (const name of others) {
    if (ids.has(name)) continue;
    ids.set(name, await upsert("skills", { name: { equals: name } }, { name, group: "other", showInToolkit: false }));
  }
  return ids;
}

function skillIds(names: string[], ids: Map<string, string>): string[] {
  return names.map((name) => {
    const id = ids.get(name);
    if (!id) throw new Error(`Skill "${name}" was not seeded`);
    return id;
  });
}

async function seedProjects(skills: Map<string, string>): Promise<void> {
  for (const p of raw.projects) {
    const year = p.year ?? p.period;
    if (!year) throw new Error(`Project "${p.name}" needs a year or period`);
    const cover = p.image ? await upsertMedia(p.image) : undefined;
    const phoneShots = p.phone ? [await upsertMedia(p.phone)] : [];
    const cs = p.caseStudy;

    await upsert(
      "projects",
      { slug: { equals: p.slug } },
      {
        name: p.name,
        slug: p.slug,
        // The slug is seeded explicitly, so don't regenerate it from the name.
        generateSlug: false,
        kind: p.kind,
        type: p.type,
        year,
        featured: p.featured,
        summary: p.summary,
        stack: skillIds(p.stack, skills),
        url: p.url,
        linkLabel: p.linkLabel,
        repo: p.repo,
        cover,
        phoneShots,
        caseStudy: cs
          ? {
              enabled: true,
              role: cs.role,
              problem: cs.problem,
              built: cs.built,
              how: cs.how,
              outcome: cs.outcome,
              metrics: cs.metrics.map((m) => ({ value: m.value, label: m.label })),
              diagram: cs.diagram ? await upsertMedia(cs.diagram) : undefined,
            }
          : { enabled: false },
      },
      true,
    );
  }
}

async function seedExperience(skills: Map<string, string>): Promise<void> {
  for (const r of raw.experience) {
    await upsert(
      "experience",
      { and: [{ company: { equals: r.company } }, { start: { equals: r.start } }] },
      {
        company: r.company,
        title: r.title,
        place: r.place,
        url: r.url,
        start: r.start,
        end: r.end ?? undefined,
        points: r.points.map((text) => ({ text })),
        skills: skillIds(r.skills, skills),
      },
    );
  }
}

const PUBLICATION_STATUS = { Published: "published", Accepted: "accepted", Submitted: "submitted" } as const;

async function seedPublications(): Promise<void> {
  for (const p of raw.publications) {
    await upsert(
      "publications",
      { title: { equals: p.title } },
      {
        title: p.title,
        venue: p.venue,
        year: p.year,
        status: PUBLICATION_STATUS[p.status],
        doi: p.doi,
        url: p.url,
        summary: p.summary,
      },
    );
  }
}

async function seedEducation(): Promise<void> {
  for (const e of raw.education) {
    await upsert(
      "education",
      { degree: { equals: e.title } },
      { degree: e.title, place: e.place, period: e.period, detail: e.detail, short: e.short },
    );
  }
}

async function seedGlobals(): Promise<void> {
  const p = raw.profile;
  await upsertGlobal("profile", {
    name: p.name,
    role: p.role,
    headline: p.headline,
    location: p.location,
    timezone: p.timezone,
    email: p.email,
    intro: p.intro,
    statement: p.statement,
    about: p.about,
    portrait: await upsertMedia(p.portrait),
    greetings: p.greetings.map((g) => ({ text: g.text, lang: g.lang })),
    services: p.services.map((s) => ({ number: s.number, title: s.title, body: s.body })),
    socials: p.socials.map((s) => ({ label: s.label, url: s.url })),
    availability: { status: p.availability.status, label: p.availability.label },
    now: { text: p.now.text, updated: p.now.updated },
  });

  const template = process.env.SITE_TEMPLATE?.trim() || "editorial";
  const announcement = raw.settings.announcement;
  await upsertGlobal("site-settings", {
    activeTemplate: isTemplateId(template) ? template : "editorial",
    versionLabel: raw.site.versionLabel,
    contactFormEnabled: raw.settings.contactFormEnabled,
    seo: { title: raw.site.seo.title, description: raw.site.seo.description },
    announcement: announcement
      ? { enabled: true, text: announcement.text, url: announcement.url }
      : { enabled: false },
  });
}

// --- Run ----------------------------------------------------------------------------------------

await seedAdmin();
const skills = await seedSkills();
await seedProjects(skills);
await seedExperience(skills);
await seedPublications();
await seedEducation();
await seedGlobals();

console.log("\nSeed finished:");
console.table(stats);
