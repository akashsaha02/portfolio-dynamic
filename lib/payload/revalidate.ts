// Payload hooks that invalidate the public site's cache when content changes (guide §7, §8;
// work plan 3.2).
//
// lib/data.ts caches its Payload reads with `unstable_cache`, tagged with CACHE_TAGS.content plus
// the source slugs (settings: CACHE_TAGS.settings). Every prerendered page that used those reads
// carries the same tags. `revalidateTag(tag, "max")` marks them stale: the next request still gets
// the cached page and triggers a background re-render, and the request after that sees the change
// (stale-while-revalidate, no rebuild). Server Actions that need the change visible on the very
// next request call `updateTag` themselves (lib/admin/availability.ts); hooks can't, because most
// writes arrive through the REST route handler, where `updateTag` is not allowed.
//
// Coverage: every collection and global the site renders (projects, experience, publications,
// skills, education, media; profile, site-settings). messages, users and rate-limits are never
// rendered, so they have no hooks.
//
// It only works inside a Next request (admin server functions and the REST route handler).
// Scripts that run outside Next, like the seed, pass `context: { disableRevalidate: true }`.

import { revalidatePath, revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";
import { CACHE_TAGS } from "../cache-tags";

type PathTarget = { path: string; type?: "page" | "layout" };

/**
 * Paths revalidated besides the tags. Projects decide which /work/[slug] pages and sitemap URLs
 * exist; the sitemap is a static route handler, so it is refreshed by path too. Site settings
 * can switch the template, which changes every page: the whole tree is revalidated.
 */
const PATHS: Record<string, PathTarget[]> = {
  projects: [{ path: "/" }, { path: "/sitemap.xml" }],
  "site-settings": [{ path: "/", type: "layout" }],
};

function revalidate(slug: string, tags: string[], req: PayloadRequest): void {
  if (req.context?.disableRevalidate) return;
  try {
    for (const tag of new Set(tags)) revalidateTag(tag, "max");
    for (const { path, type } of PATHS[slug] ?? []) revalidatePath(path, type);
  } catch (error) {
    // Outside a Next request (e.g. a script that forgot the context flag). The write itself
    // succeeded, so log and carry on rather than failing the operation.
    req.payload.logger.warn({ err: error, slug }, "revalidate skipped: not inside a Next request");
  }
}

type WithStatus = { _status?: "draft" | "published" | null };

/**
 * afterChange for collections. Skips pure draft saves (a draft of a document that was never
 * published), which the public site never shows. A draft saved over a published document still
 * revalidates: that is also how "Unpublish" arrives, and an extra re-render is cheap.
 */
export function revalidateCollectionAfterChange(slug: string): CollectionAfterChangeHook {
  return ({ doc, previousDoc, req }) => {
    const now = (doc as WithStatus)._status;
    const before = (previousDoc as WithStatus | undefined)?._status;
    const draftOnly = now === "draft" && before !== "published";
    if (!draftOnly) revalidate(slug, [CACHE_TAGS.content, slug], req);
    return doc;
  };
}

export function revalidateCollectionAfterDelete(slug: string): CollectionAfterDeleteHook {
  return ({ doc, req }) => {
    revalidate(slug, [CACHE_TAGS.content, slug], req);
    return doc;
  };
}

/** Both hooks, ready to spread into a collection's `hooks`. */
export function revalidateCollection(slug: string) {
  return {
    afterChange: [revalidateCollectionAfterChange(slug)],
    afterDelete: [revalidateCollectionAfterDelete(slug)],
  };
}

export function revalidateGlobal(slug: string, extraTags: string[] = []): GlobalAfterChangeHook {
  return ({ doc, req }) => {
    revalidate(slug, [CACHE_TAGS.content, slug, ...extraTags], req);
    return doc;
  };
}
