# Decision: where the public site reads its content (task 3.1)

Date: 2026-10-18. Recorded by backend. Payload 3.90.2, Next 16.3.8. Code: `lib/data.ts`.

## Source, by `DATABASE_URI`

| `DATABASE_URI` | Source | Behaviour |
| --- | --- | --- |
| unset or blank | `lib/content.ts` via `lib/static-content.ts` | Local builds, CI, e2e, Lighthouse and previews without a database. Template comes from `SITE_TEMPLATE`. No Payload code is evaluated. |
| set, database reachable | Payload Local API (`lib/payload/read.ts` + `map.ts`), `overrideAccess: false`, published only | The admin is the source of truth. Template comes from the `site-settings` global. |
| set, database unreachable (or `PAYLOAD_SECRET` missing) | none | **Throws** ("Couldn't read site content from Payload…"). A build fails; at runtime Next keeps serving the last good cached page and logs the error. It never falls back to the static copy silently, so a broken connection can't publish stale content as if it were current. |

Draft mode is the only path that reads drafts, and only for a signed-in admin (task 3.4). Those
reads skip the cache.

## Edge cases of the data layer

- **Cache tags** (`lib/cache-tags.ts`). Published content is cached with `unstable_cache` under
  `site-content` plus the source slugs (`projects`, `experience`, `publications`, `skills`,
  `education`, `media`, `profile`); settings under `site-settings`. Every rendered collection and
  global has `afterChange`/`afterDelete` hooks (`lib/payload/revalidate.ts`) that call
  `revalidateTag(tag, "max")`, plus `revalidatePath` for `/` and `/sitemap.xml` (projects) and the
  whole layout (site-settings).
- **Stale-while-revalidate.** `"max"` marks the tag stale: the first request after an edit still
  gets the old page and triggers a background re-render; the next one sees the change. The
  availability toggle (Server Action) uses `updateTag` instead, so it shows on the very next request.
- **1-day safety revalidate.** Each cached read also has `revalidate: 86400`. It is only a backstop
  for a missed hook (e.g. a write made outside a Next request); tags do the real invalidation.
- **Writes outside Next** (seed, scripts) pass `context: { disableRevalidate: true }`; after running
  one against production, redeploy or wait for the safety revalidate.

## If an edit doesn't show on the site

1. Reload twice: the first request after an edit serves the stale page (see above).
2. Was it published? Drafts never reach the public site. A first draft of a new document doesn't
   revalidate at all.
3. Is the template Folio? Editorial ignores the database (`editorial-static.md`).
4. Did the hook run? Check the Vercel function logs for `revalidate skipped: not inside a Next
   request`, and that the collection or global spreads `revalidateCollection(slug)` /
   `revalidateGlobal(slug)` in its `hooks`. A new collection rendered by the site needs both the
   hook and its slug in `CONTENT_SOURCE_TAGS` (`lib/data.ts`).
5. ISR: the page must be static or ISR (`○`/`●` in the build output), not cached by something else.
   Check the response's `x-vercel-cache` / `x-nextjs-cache` header (`STALE` then `HIT` after an edit).
   A redeploy clears everything as a last resort.
6. Mapping: run `npm run verify:parity` against a seeded database. It reads through the same Local
   API path and mapping as the site and diffs against `lib/content.ts`; a field that the admin saves
   but `lib/payload/map.ts` drops shows up there.
