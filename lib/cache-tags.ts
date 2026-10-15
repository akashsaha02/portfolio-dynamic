// Cache tags shared by the data layer (lib/data.ts, Phase 3: `cacheTag(...)`) and the Payload
// hooks that invalidate them (lib/payload/revalidate.ts: `revalidateTag(tag, "max")`).
//
// Every content change revalidates CONTENT plus the collection or global slug, so a data function
// can tag broadly (`site-content`) or narrowly (`projects`) without new hooks.

export const CACHE_TAGS = {
  /** Everything in `SiteContent` (lib/content-types.ts). */
  content: "site-content",
  /** `SiteSettings` (template choice and operational toggles). */
  settings: "site-settings",
} as const;
