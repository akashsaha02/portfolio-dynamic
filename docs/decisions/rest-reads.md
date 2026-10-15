# Decision: anonymous REST reads stay open (QA phase 2, F-15)

Date: 2026-10-15. Decided by the lead; recorded by backend. Payload 3.90.2, Next 16.3.8.

## Outcome

**Keep the anonymous read rules.** Published content (`projects`, `experience`, `publications`,
`skills`, `education`, `media`, the `profile` and `site-settings` globals) stays readable by
anyone through `/api/*`, exactly what the public site shows anyway. Drafts, versions, `messages`,
`users` and `rate-limits` stay admin-only (QA matrix, phase-2 report §3).

## Why

- The public site reads through the **Local API with `overrideAccess: false`** (task 3.1), so the
  same access rules guard both paths. Closing REST (`read: isAdmin`) would force `lib/data.ts` onto
  `overrideAccess: true` plus hand-written `_status = published` filters on every query: one forgotten
  `where` would publish a draft. Keeping one set of rules in force is the safer design.
- Nothing readable over REST is private: it is the rendered site in JSON form.

## Guards that come with it

| Risk | Guard | Where |
| --- | --- | --- |
| Expensive deep queries (`?depth=100`) burning invocations and Atlas ops (guide §9.2) | `maxDepth: 2`, `defaultDepth: 1` | `payload.config.ts` |
| A published project's `nextProject` exposing the id of an unpublished draft | Field `afterRead` hook: for non-admins the value is kept only if the target is readable (published); otherwise `null`. Populated drafts are dropped too | `collections/Projects.ts` (`hideUnpublishedNextProject`) |
| Bots probing `/api/*` flooding Vercel's 1-hour logs | Expected errors (403/404/validation) log at `info` | `payload.config.ts` `loggingLevels` |
| Search engines indexing JSON | `X-Robots-Tag: noindex, nofollow` on `/api/*` and `/admin/*`; robots.txt disallows both | `next.config.ts`, `app/robots.ts` |
| Cross-site writes with the admin cookie | `csrf`/`cors` allowlist (separate finding, F-02) | `lib/origins.ts` |

`/api/access` still answers anonymous callers with the permission map (no data, no `messages`
entry). Accepted.

## For task 3.1

- Read with `overrideAccess: false`, no `user`, `draft: false`, and an explicit `depth` (≤ 2).
- Draft mode (3.4) is the only path that reads drafts, and only after the admin session check.
- Revisit if a collection ever gains a field that is not meant for the public page: give it
  field-level `read: isAdmin` access, or close that collection.
