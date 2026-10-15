# Decision: `cacheComponents` (work plan 2.2 spike)

Date: 2026-10-15. Next 16.3.7, Payload 3.90.2 (`@payloadcms/next`), React 19.2.8.

## Outcome

**Off for now.** `next.config.ts` does not set `cacheComponents`. It is one template fix away from
working, so Phase 3 should re-test it (see "To turn it on").

## What was tried

`cacheComponents: true` in `next.config.ts`, with the Payload admin installed and the in-memory dev
database seeded (`npm run dev:db`, `npm run seed`).

| Check | Result |
| --- | --- |
| `next build`, `SITE_TEMPLATE` unset (Editorial) | **Fails.** `Route "/": Next.js encountered the unstable value new Date() while prerendering`, from `components/sections/Contact.tsx:5` (`new Date().getFullYear()` for the footer year). |
| `next build`, `SITE_TEMPLATE=folio` | Passes. `/admin/[[...segments]]`, `/[...missing]` and `/work/[slug]` become Partial Prerender (◐); the rest stays static. |
| `next start` of that Folio build | `/`, `/work`, `/work/abroadly`, `/about`, `/contact` 200; unknown URL 404. `/admin/login`, dashboard, projects list and the profile global render; REST login and reads work; anonymous reads of `messages`/`users` still 403. |
| `next dev` | Admin works, but logs two blocking-route errors for `/admin/[[...segments]]` on each load: `encountered runtime data in generateMetadata()` and `encountered uncached data during prerendering or a navigation` (Payload's generated `page.tsx` reads params/headers outside `<Suspense>`). Dev-only noise; the build does not fail on them. |

Not covered by the spike: saving documents through the admin UI forms, uploads and live preview
with `cacheComponents` on. Payload's install docs say the admin runs without errors but full
compatibility "isn't guaranteed" (PR #16020).

## Why off

The rule for this spike: enable only if the admin and **both** templates build and run. Editorial
(the default `SITE_TEMPLATE`) does not build, and the fix is in a design-owned file.

## Caching model meanwhile (Phase 3, task 3.1)

Use the previous model (`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`):
wrap the Payload reads in `lib/data.ts` with `unstable_cache(fn, keyParts, { tags })` using the tags in
`lib/cache-tags.ts`. The Payload hooks in `lib/payload/revalidate.ts` already call
`revalidateTag(tag, "max")` on every change, which works for `unstable_cache` and for `'use cache'`
alike, so switching later only touches `lib/data.ts`.

## To turn it on later

1. Design: make the Editorial footer year deterministic (e.g. pass it as data, or render it in a
   Client Component), so `/` prerenders. Folio already builds.
2. Backend: set `cacheComponents: true`; in `lib/data.ts` replace `unstable_cache` with
   `'use cache'` + `cacheLife('max')` + `cacheTag(...)`. Never read `cookies()`/`headers()` inside.
3. Optional: silence the admin dev errors with `export const instant = false` in
   `app/(payload)/admin/[[...segments]]/page.tsx` (a Payload-generated file: re-apply after
   regenerating it).
4. Re-run: both template builds, `next start`, admin login, edit + publish a project, upload an
   image, and check the public page updates after the save.
