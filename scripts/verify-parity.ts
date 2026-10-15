// Parity check (work plan 3.1): `npm run verify:parity`.
//
// Reads the site through the same Local API path as lib/data.ts (published only, access rules in
// force), maps it to SiteContent/SiteSettings, and diffs that against the static lib/content.ts
// mapping. On a freshly seeded database (`npm run seed`) the result must be "no differences".
//
// One normalisation, printed in the summary: image `src`. Payload serves uploads from its own URL
// (`/api/media/file/<name>` locally, the Blob URL on Vercel) while lib/content.ts points at
// public/, so images compare by file name; alt, width and height must match exactly.
// `activeTemplate` is reported but not compared (static = SITE_TEMPLATE, Payload = the global).
//
// Needs DATABASE_URI and PAYLOAD_SECRET (shell or .env.local; `payload run` loads env files).
// Exit code: 0 = identical, 1 = differences, 2 = could not read.

import path from "node:path";
import { getPayload } from "payload";
import config from "../payload.config";
import { mapSettings, mapSiteContent } from "../lib/payload/map";
import { readContentDocs, readSettingsDoc } from "../lib/payload/read";
import { staticSettings, staticSiteContent } from "../lib/static-content";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

let imagesCompared = 0;

/** JSON shape (drops undefined, like the cache does) with image sources reduced to file names. */
function normalize(value: unknown): Json {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const isImage = typeof record.src === "string" && "width" in record && "height" in record && "alt" in record;
    const out: Record<string, Json> = {};
    for (const key of Object.keys(record).sort()) {
      const v = record[key];
      if (v === undefined) continue;
      out[key] = isImage && key === "src" ? `<file:${path.posix.basename(new URL(String(v), "http://x").pathname)}>` : normalize(v);
    }
    if (isImage) imagesCompared += 1;
    return out;
  }
  return value as Json;
}

function diff(a: Json, b: Json, at: string, out: string[]): void {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) out.push(`${at}: length static=${a.length} payload=${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) diff(a[i], b[i], `${at}[${i}]`, out);
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      diff(a[key] ?? null, b[key] ?? null, `${at}.${key}`, out);
    }
    return;
  }
  out.push(`${at}:\n    static  = ${JSON.stringify(a)}\n    payload = ${JSON.stringify(b)}`);
}

let exitCode = 0;
try {
  const payload = await getPayload({ config });
  const [docs, settingsDoc] = await Promise.all([readContentDocs(payload, { draft: false }), readSettingsDoc(payload)]);
  const fromPayload = mapSiteContent(docs);
  const settingsPayload = mapSettings(settingsDoc);
  const fromStatic = staticSiteContent();
  const settingsStatic = staticSettings();

  const differences: string[] = [];
  diff(normalize(fromStatic), normalize(fromPayload), "content", differences);
  // activeTemplate is not compared (see top): give both sides the same value.
  diff(normalize(settingsStatic), normalize({ ...settingsPayload, activeTemplate: settingsStatic.activeTemplate }), "settings", differences);

  console.log(
    `Compared: ${fromPayload.projects.length} projects, ${fromPayload.experience.length} roles, ` +
      `${fromPayload.publications.length} publications, ${fromPayload.skills.length} toolkit groups, ` +
      `${fromPayload.education.length} education, ${imagesCompared / 2} images per side (by file name), settings.`,
  );
  console.log(`activeTemplate: static (SITE_TEMPLATE) = ${settingsStatic.activeTemplate}, payload = ${settingsPayload.activeTemplate} (not compared).`);
  if (differences.length === 0) {
    console.log("Parity: no differences.");
  } else {
    console.log(`Parity: ${differences.length} difference(s):\n  ${differences.join("\n  ")}`);
    exitCode = 1;
  }
} catch (error) {
  console.error("Parity check could not read Payload:", error);
  exitCode = 2;
}
process.exit(exitCode);
