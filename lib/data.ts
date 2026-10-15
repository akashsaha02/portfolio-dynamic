// The data layer: the content source mapped to the template contract (lib/content-types.ts).
//
// Source (work plan 3.1):
// - DATABASE_URI unset → the static lib/content.ts (lib/static-content.ts), exactly as before.
//   Local builds, CI, e2e, Lighthouse and previews without a database keep working.
// - DATABASE_URI set → Payload's Local API (lib/payload/read.ts + map.ts). If the database is
//   unreachable this THROWS: a build fails, and at runtime Next keeps serving the last good
//   page while the error is logged. It never falls back to the static copy silently.
//
// Caching (docs/decisions/cache-components.md: cacheComponents is off): published reads are
// wrapped in `unstable_cache`, tagged with lib/cache-tags.ts. Payload hooks
// (lib/payload/revalidate.ts) call `revalidateTag(tag, "max")` on every change; the 1-day
// `revalidate` is only a safety net. React `cache()` dedupes within one request.
//
// Draft mode (3.4): drafts are read only when draft mode is on AND the request carries the
// admin's Payload session; those reads skip the cache (Next also bypasses unstable_cache in draft
// mode). Request data (draftMode/headers) is only read outside the cached functions.

import { unstable_cache } from "next/cache";
import { draftMode, headers } from "next/headers";
import type { Payload, TypedUser } from "payload";
import { cache } from "react";
import { CACHE_TAGS } from "./cache-tags";
import type { Project, CaseStudy, SiteContent } from "./content-types";
import { mapSettings, mapSiteContent } from "./payload/map";
import { readContentDocs, readSettingsDoc } from "./payload/read";
import { staticSettings, staticSiteContent } from "./static-content";
import type { SiteSettings } from "@/templates/types";

/** Safety net only: tags do the real invalidation. One day, in seconds. */
const SAFETY_REVALIDATE = 86_400;

/** Collection and global slugs whose hooks invalidate `SiteContent` (each also sends CONTENT). */
const CONTENT_SOURCE_TAGS = ["projects", "experience", "publications", "skills", "education", "media", "profile"];

/** True when the site reads Payload. Read per call so tests and scripts can set it late. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URI?.trim());
}

/**
 * Payload's own cached instance: `getPayload` keeps one client (and one Mongo pool) per server
 * process, so prerendering many pages doesn't open new connections. Loaded lazily so builds
 * without a database never evaluate the Payload config.
 */
async function payloadClient(): Promise<Payload> {
  const [{ getPayload }, { default: config }] = await Promise.all([import("payload"), import("@payload-config")]);
  return getPayload({ config });
}

function sourceError(what: string, error: unknown): Error {
  return new Error(
    `Couldn't read ${what} from Payload (DATABASE_URI is set, so the static copy is not used). ` +
      "Check that the database is reachable and PAYLOAD_SECRET is set.",
    { cause: error },
  );
}

async function readContent(options: { draft: boolean; user?: TypedUser }): Promise<SiteContent> {
  try {
    return mapSiteContent(await readContentDocs(await payloadClient(), options));
  } catch (error) {
    throw sourceError("site content", error);
  }
}

const readPublishedContent = unstable_cache(() => readContent({ draft: false }), ["payload:site-content"], {
  tags: [CACHE_TAGS.content, ...CONTENT_SOURCE_TAGS],
  revalidate: SAFETY_REVALIDATE,
});

const readPublishedSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      return mapSettings(await readSettingsDoc(await payloadClient()));
    } catch (error) {
      throw sourceError("site settings", error);
    }
  },
  ["payload:site-settings"],
  { tags: [CACHE_TAGS.settings], revalidate: SAFETY_REVALIDATE },
);

/**
 * The signed-in admin when this request is a draft-mode preview, otherwise null. Reads the
 * request (cookies via headers) only when draft mode is on, so prerendered pages stay static.
 */
export const getPreviewUser = cache(async (): Promise<TypedUser | null> => {
  if (!hasDatabase()) return null;
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  const payload = await payloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  return user?.collection === "users" ? user : null;
});

/**
 * Published content only, never drafts, and without touching the request. For build-time
 * callers outside a request (generateStaticParams, sitemap), where draftMode() isn't available.
 */
export const getPublishedSiteContent = cache(async (): Promise<SiteContent> => {
  return hasDatabase() ? readPublishedContent() : staticSiteContent();
});

/**
 * Everything the public site renders. Drafts only for the admin in draft mode (see top).
 * Wrapped in React `cache` so layout metadata and the page share one result per request.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!hasDatabase()) return staticSiteContent();
  const admin = await getPreviewUser();
  return admin ? readContent({ draft: true, user: admin }) : readPublishedContent();
});

/**
 * Site settings: the active template plus operational toggles. From the Payload `site-settings`
 * global when there is a database; otherwise lib/content.ts with SITE_TEMPLATE (build time).
 * The global has no drafts, so preview and live read the same document.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  return hasDatabase() ? readPublishedSettings() : staticSettings();
});

type WithCaseStudy = Project & { caseStudy: CaseStudy };

function hasCaseStudy(p: Project): p is WithCaseStudy {
  return p.caseStudy !== undefined;
}

/** Projects that get a /work/[slug] page, in display order. */
export function caseStudyProjects(content: SiteContent): WithCaseStudy[] {
  return content.projects.filter(hasCaseStudy);
}

/** The case study for `slug` and the next one (wrapping around), or null if there is none. */
export function findCaseStudy(
  content: SiteContent,
  slug: string,
): { project: WithCaseStudy; next: Project | null } | null {
  const list = caseStudyProjects(content);
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  const next = list.length > 1 ? list[(index + 1) % list.length] : null;
  return { project: list[index], next };
}
