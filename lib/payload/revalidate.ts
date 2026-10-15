// Payload hooks that invalidate the public site's cache when content changes (guide §7, §8).
//
// `revalidateTag(tag, "max")` marks tagged `'use cache'` entries stale; the next request gets
// fresh data. It only works inside a Next request (admin server functions and the REST route
// handler). Scripts that run outside Next, like the seed, pass `context: { disableRevalidate: true }`.

import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";
import { CACHE_TAGS } from "../cache-tags";

function revalidate(tags: string[], req: PayloadRequest): void {
  if (req.context?.disableRevalidate) return;
  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch (error) {
      // Outside a Next request (e.g. a script that forgot the context flag). The write itself
      // succeeded, so log and carry on rather than failing the operation.
      req.payload.logger.warn({ err: error, tag }, "revalidateTag skipped: not inside a Next request");
    }
  }
}

type WithStatus = { _status?: "draft" | "published" | null };

/** afterChange for collections. Skips pure draft saves, which the public site never shows. */
export function revalidateCollectionAfterChange(slug: string): CollectionAfterChangeHook {
  return ({ doc, previousDoc, req }) => {
    const now = (doc as WithStatus)._status;
    const before = (previousDoc as WithStatus | undefined)?._status;
    const draftOnly = now === "draft" && before !== "published";
    if (!draftOnly) revalidate([CACHE_TAGS.content, slug], req);
    return doc;
  };
}

export function revalidateCollectionAfterDelete(slug: string): CollectionAfterDeleteHook {
  return ({ doc, req }) => {
    revalidate([CACHE_TAGS.content, slug], req);
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
    revalidate([CACHE_TAGS.content, slug, ...extraTags], req);
    return doc;
  };
}
