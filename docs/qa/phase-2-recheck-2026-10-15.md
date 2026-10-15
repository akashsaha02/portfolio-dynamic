# Phase 2 gate re-check (task 2.G): backend and admin

Date: 2026-10-15. Auditor: qa agent. Build audited: `main` at `a81ba26`, which merges the batch fixes for the first report (`docs/qa/phase-2-2026-10-15.md`, verdict FAIL).

This is a focused re-check, not a repeat of the full sweep. Each finding from the first report was re-tested against a running build.

**Environment**

- **Database:** in-memory MongoDB from `npm run dev:db` (`DEV_DB_PORT=27751`). Database `portfolio` was seeded twice; `qafresh` started empty.
- **Secret:** a random 32-byte `PAYLOAD_SECRET`.
- **Turnstile:** Cloudflare's test secret `1x0000000000000000000000000000000AA`.
- **Servers:** all `next start` on the Folio build (`.next-folio`, built by the e2e run):

| Port | Database | Extra env | Used for |
| --- | --- | --- | --- |
| `:4300` | `portfolio` | none | Main audit server |
| `:4302` | `portfolio` | `VERCEL=1` | Vercel IP-header semantics |
| `:4303` | `qafresh` | `VERCEL=1 VERCEL_ENV=preview` | First-register guard |
| `:4304` | `portfolio` | `TRUSTED_PROXY_HOPS=1` | Self-hosted proxy semantics |
| `:4310` | none | none | Pre-fix commit `20af643`, built only for the Lighthouse A/B |

- **Cleanup:** all servers and the database were stopped, `./media` was deleted, and the A/B source tree was deleted.

**Where the evidence is** (all under `docs/qa/phase-2-recheck/`):

- Tools: `tools/`
- Raw output: `data/`
- Screenshots: `screens/` (24 WebP files, 472 KB)

## Verdict: PASS WITH ISSUES

The blocker and all 4 majors are fixed, and so are 12 of the 13 minors. F-16 is partly fixed. F-18 stays open by design until task 3.3. **There are 0 blockers and 0 majors.**

Every gate is green:

- lint (on source; see N-05);
- typecheck;
- 99/99 unit tests;
- both builds;
- the full e2e suite: **263 passed, 0 failed, 0 flaky**.

The fixes added **5 new minor issues**, plus a partial on F-16. The only security-relevant one is N-01: the new site-wide CSP header replaces Payload's stricter CSP for uploaded files. It is defence in depth, and production does not serve files from that route today. None of the issues blocks Phase 3. They fit in the next backend and docs pass, and each is XS.

---

## 1. Gate results

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | **Source: PASS.** `npx eslint --ignore-pattern "playwright-report/**" --ignore-pattern "test-results/**"` exits 0 (`data/gate-lint-clean.txt`). The plain `npm run lint` in this checkout exits 1 with 239 errors, all inside `playwright-report/trace/*.js`, which every local e2e run leaves behind (N-05; `data/gate-lint-trimmed.txt`). CI is unaffected because its lint job uses a fresh checkout |
| Typecheck | `npx next typegen && npx tsc --noEmit` | PASS, exit 0 |
| Unit | `npm test` | PASS: **3 files, 99/99** (65 before; the new tests cover hidden characters, IP selection, the Turnstile hostname check and origins) |
| Build, default (Editorial) | `npx next build` | PASS: 17 static pages, same route table as before |
| Build, Folio | `SITE_TEMPLATE=folio NEXT_DIST_DIR=.next-folio npx next build` | PASS, same route table |
| E2E | `CI=1 PW_PORT_BASE=4400 npx playwright test` (both templates, 8 projects, its own builds, no secrets) | **PASS: 263 passed, 0 failed, 0 flaky, 281 skipped** in 2.9 min (`data/gate-e2e.txt`). The 281 skips are template-scoped specs plus **12 `test.fixme`**: 3 Folio contact success paths × 4 viewports, "restored in 3.3". `folio-contact.spec.ts` ran 12 tests per Folio viewport, 48 in total, all green. **B-01 is green.** No WebKit hydration flakes: `phone-large` (WebKit) needed no retries |
| Seed | `npm run seed` ×2 | PASS. Run 1 created 36 skills, 4 media, 5 projects, 4 experience, 2 publications and 1 education. Run 2 left everything unchanged (`data/seed1.txt`, `data/seed2.txt`) |
| Lockfile | `npm ci --dry-run --ignore-scripts --os=linux --cpu=x64 --libc=glibc` on a copy of `package.json` and the lockfile | PASS with **npm 10.9.9** and **npm 11.6.2** (`data/lockfile-ci.txt`) |
| `npm audit` | full and `--omit=dev` | **13 high (full), 10 high (prod), 0 moderate, 0 low.** All are `braces` roll-ups (§3) |

---

## 2. Finding status

| ID | Was | Status | Evidence |
| --- | --- | --- | --- |
| B-01 | blocker | **fixed** | e2e is green (§1). `e2e/folio-contact.spec.ts` now asserts the documented fail-closed message and that the values are kept. The success paths are `test.fixme`, to be restored in 3.3. The action still fails closed; it was not weakened |
| F-01 | major | **fixed** | `npm ls`: `next@16.3.8` everywhere (direct, `@payloadcms/next`, `/ui`, `@vercel/analytics`, `/speed-insights`) and `eslint-config-next@16.3.8` (`data/npm-ls.txt`). No `next` advisory is left in `npm audit` |
| F-02 | major | **fixed** | `tools/csrf.mjs` → `data/csrf.txt`. With the admin **cookie**, `POST /api/globals/site-settings` gave **403, value unchanged** for each of these: `Origin: https://evil.example` (JSON and multipart `_payload`), `Origin: null`, `Origin: http://localhost:4300.evil.example`, another port, `Sec-Fetch-Site: cross-site` with no Origin, and no Origin with no `Sec-Fetch-Site`. Writes **succeeded (200)** for same origin (JSON and multipart), `127.0.0.1:<port>`, and `Sec-Fetch-Site: same-origin`. **Preflight:** an evil Origin gets no `Access-Control-Allow-Origin`; `http://localhost:4300` gets ACAO = itself with `Access-Control-Allow-Credentials: true`. Server Action with a foreign Origin: still aborted (digest `1113248000@E80`). The admin UI still logs in and saves on the same origin (§4) |
| F-03 | major | **fixed** (see new N-01) | `data/headers.txt`. Covered routes: `/`, `/work`, `/work/abroadly`, `/contact`, `/admin`, `/admin/login`, `/admin/collections/projects`, `/api/projects`, `/api/globals/profile`, both OG image routes, `/robots.txt`, `/sitemap.xml`, `/resume` (404), a 404 page and `/api/media/file/*`.<br>• All carry `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'`.<br>• `X-Robots-Tag: noindex, nofollow` is on `/api/*` and `/admin/*` only.<br>• **`X-Powered-By` is gone** everywhere.<br>• **`Critical-CH` and `Accept-CH` appear only on `/admin*`.** Lighthouse saw 1 document request on `/` (no client-hint retry).<br>• **Live preview still renders** under `frame-ancestors 'self'`: the iframe loads `http://localhost:4300/work/abroadly` with h1 "Abroadly" (`data/admin-a11y.txt`, `screens/phone-live-preview.webp`, `tablet-live-preview.webp`) |
| F-04 | major | **fixed** | `:4303`, empty DB, `VERCEL=1 VERCEL_ENV=preview` (`data/first-register-preview.txt`):<br>• `POST /api/users/first-register` (JSON and multipart) and `POST /api/users` → **403** "Creating the first admin from the browser is turned off on this deployment. Seed the admin instead." `users/init` stays `false`.<br>• The UI shows the same message as a toast (`screens/phone-first-register-refused-preview.webp`).<br>• `npm run seed` with `VERCEL_ENV=preview` set still creates the admin (Local API), and then `init` is `true` (`data/seed-reset-fresh.txt`).<br>• Locally (no `VERCEL_ENV`) create-first-user is unchanged |
| F-05 | minor | **fixed** | `payload` → `undici@7.29.1 overridden`; `monaco-editor` → `dompurify@3.4.17`. No undici or dompurify advisory is left |
| F-06 | minor | **fixed** (see new N-02) | `tools/sc-4300.json` → `data/contact-4300.txt`, `data/messages-stored.txt`.<br>**Rejected** with a field error:<br>• in the name: RLO + ZWSP (`Ev‮e​x`), LRI/PDI isolates, a trailing ZWJ, a leading ZWNJ, a soft hyphen, the Hangul filler;<br>• in the email: ZWSP, RLM;<br>• in the message: RLO.<br>**Accepted and stored intact:**<br>• Bengali `র‍্য` (ra + ZWJ + hasant + ya);<br>• emoji ZWJ sequences with a skin tone and VS16 (`👩🏽‍💻`, `❤️‍🔥`, `🏳️‍🌈`);<br>• Hindi with ZWNJ (`क्‌ष`) and Persian `می‌خواهم`.<br>A decomposed `Zoë` is stored as NFC `Zoë` (U+00EB). A leading BOM is trimmed (stored `Ana`) |
| F-07 | minor | **fixed** | **Off Vercel** (`:4300`, no `TRUSTED_PROXY_HOPS`): once the bucket is full, rotating `x-forwarded-for`, an XFF list spoof and `x-real-ip` spoofing are **all refused**. Every visitor shares one `unknown` bucket, so the limit is strict but can't be bypassed (`data/contact-4300.txt`).<br>**`VERCEL=1`** (`:4302`, `data/contact-4302-vercel.txt`):<br>• 5 accepted on `x-vercel-forwarded-for: 203.0.113.10`, 6th refused;<br>• the same `x-vercel-forwarded-for` with rotated XFF and `x-real-ip` → **refused** (it takes precedence);<br>• a new `x-vercel-forwarded-for` gets its own bucket (Vercel sets that header itself; vercel.com/docs/headers/request-headers, re-read today);<br>• `x-real-ip` is the fallback.<br>**`TRUSTED_PROXY_HOPS=1`** (`:4304`): the key is the rightmost hop. Rotating the client-written left hop (with or without an `x-real-ip` spoof) → **refused** |
| F-08 | minor | **fixed** | `tools/turnstile-host.mts` → `data/turnstile-host.txt` (mocked siteverify, non-dummy secret):<br>• hostname `evil.example` → `invalid-token`;<br>• `localhost` / `LOCALHOST` → ok;<br>• the dummy `1x…` secret skips the check (it answers `example.com`).<br>Origins per environment:<br>• Preview → the deployment, production and branch hosts; `serverURL` empty.<br>• Production → the production and deployment hosts; `serverURL = https://<production>`.<br>Unit tests `tests/contact-backend.test.ts:39,52` cover the same. A live check isn't possible with Cloudflare's dummy secrets |
| F-09 | minor | **fixed** | At 360 px (`data/admin-a11y.txt`):<br>• widget links: `All unread` 53×44, `All messages` 66×44, `Edit text in Profile → Status` 131×44;<br>• filter: `Unread` 69×44, `All` 44.3×44;<br>• availability buttons 91×44.<br>No overflow on any of the 9 admin pages at 360 or 768 (`data/admin-360.json`, `admin-768.json`). The remaining sub-44 px controls are Payload core (upstream, as before) |
| F-10 | minor | **fixed** | `.ak-widget__status` keeps `role="status"`. When idle it is `display: block` with empty text. During a save it reads "Saving…", then "Saved. Availability is now Limited." (MutationObserver log in `data/admin-a11y.txt`) |
| F-11 | minor | **fixed** | The Projects list shows the `.ak-list-hint` once. The project edit form has no hint and no "Drag rows" text (`screens/phone-project-edit-no-hint.webp`). Nit: the comment at `components/admin/ProjectsListHint.tsx:2` says `beforeList`, but the code uses `beforeListTable` (`collections/Projects.ts:72`) |
| F-12 | minor | **fixed** | `npm run admin:reset-password` (`data/seed-reset-fresh.txt`):<br>• It refuses a password under 12 characters.<br>• An unknown email gets a masked hint, `f…@example.com`.<br>• Email matching is case-insensitive.<br>• The reset unlocks an account locked by 5 bad logins. The old password then fails and the new one works.<br>• A JWT issued before the reset gets `user: null` (sessions revoked).<br>• The runbook is in `docs/admin-guide.md` and `docs/ops/accounts.md`.<br>Still as before (the optional part of F-12): with no email adapter, `forgot-password` logs one INFO line containing the admin's login email. That only happens for an existing account; an unknown address logs nothing |
| F-13 | minor | **fixed** | After the full matrix, the log (`data/server-4300.log`) has **102 × `INFO 403 You are not allowed…`, 13 × `INFO 404`, 1 × `INFO 401`**, one line each and **no stack traces for anonymous calls**. The only stacks left are 10 admin-only `GET /api/<non-versioned>/versions` 500s, which are Payload upstream noise, unchanged and not reachable anonymously (anonymous gets 403) |
| F-14 | minor | **fixed** | `payload.config.ts:128-134`: `connectOptions: { maxPoolSize: 5, maxIdleTimeMS: 30000, serverSelectionTimeoutMS: 5000 }`. `serverStatus` after the matrix and the admin runs: **4 current connections** (`data/mongo-connections.txt`) |
| F-15 | minor | **fixed** | `tools/nextproject.mjs` and `tools/depthcap.mjs` → `data/nextproject.txt`.<br>• Published `nook` → `nextProject` = draft-only project: **anonymous `null`** at depth 0, 1, 2 and 5, via findByID, list and `?draft=true`. The admin sees the id at depth 0 and the populated draft at depth ≥ 1.<br>• Control: a published target is kept for anonymous readers (id at depth 0, object at depth 1 and 2).<br>• **`maxDepth: 2` holds:** at `depth=100` the third level is a bare id.<br>• `tools/matrix.mjs` re-run: **0 `LEAK` markers in any anonymous cell** (all 10 `LEAK` hits are in the admin column) (`data/matrix.txt`).<br>• The decision to keep anonymous REST reads open is recorded in `docs/decisions/rest-reads.md` |
| F-16 | minor | **partially fixed** | `docs/ops/env.md` now has the required-now status, the Turnstile/Resend live status, `VERCEL`, `DEV_DB_*`, `EXTRA_ALLOWED_ORIGINS`, `ALLOW_FIRST_USER` and `SEED_ADMIN_*`. The new code drifted again, see **N-03** |
| F-17 | minor | **fixed** | `instrumentation.ts` exists. The foreign-Origin action produced exactly `[request-error] {"route":"/contact","type":"action","method":"POST","path":"/contact","name":"Error","digest":"1113248000@E80"}`, with no PII (`data/server-4300.log`) |
| F-18 | minor | **open, by design (3.3)** | The real Folio form with no token (no widget yet) still gets "I couldn't confirm you're not a bot…" (`data/contact-form.txt`). It must ship with 3.3 before Folio goes to production |

---

## 3. `npm audit` classification (after the fixes)

| Root package | Advisories | Path | Exploitable for us? | Action |
| --- | --- | --- | --- | --- |
| `braces` 3.0.3 | 1 high, GHSA 1240992 (stack-exhaustion DoS from nested patterns) | `sass`→`chokidar`; `@payloadcms/plugin-cloud-storage`→`find-node-modules`→`findup-sync`→`micromatch`; `fast-glob` (eslint, dev) | **No.** No glob pattern comes from user input | No fixed release exists. Accept and re-check monthly. The CI "Dependency audit (report only)" step will keep showing it |
| Roll-ups (12): `@payloadcms/next`, `/plugin-cloud-storage`, `/richtext-lexical`, `/storage-vercel-blob`, `sass`, `chokidar`, `micromatch`, `findup-sync`, `find-node-modules`, and dev-only `eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob` | — | — | — | Nothing to do. Never run `npm audit fix --force` |

The first report predicted about 15 entries; there are 13. `@vercel/blob` still pulls `undici@6.29.0`, and audit doesn't flag it.

---

## 4. Regression spot-checks

| Check | Result |
| --- | --- |
| Contact end to end, real Folio form | Run on `:4302` with the token injected into the DOM (no widget yet), the test secret and the dev DB. **Success**, saved with a Bengali name. Without a token: the bot message (F-18). The 8 `[contact]` log lines are all "email skipped… (message saved)". **No name, email or IP in any server log** (`grep -E "example\.com\|203\.0\.113\|198\.51\.100"` → 0 in all 4 logs) |
| Admin on a phone, 360×740 and 768×1024 | Same as the first run (`data/admin-360.json`, `admin-768.json`, `screens/`):<br>• the same-origin login works;<br>• the dashboard renders;<br>• toggle Closed → stored and pressed after a reload → Open restores;<br>• messages list and filter work; project edit works;<br>• live preview opens an iframe;<br>• upload form and profile work.<br>Horizontal overflow is 0 on every page. 0 console errors, 0 dialogs |
| `/api/draft` | Anonymous → 401. Admin cookie plus `Sec-Fetch-Site: same-origin` or `none` (what browsers send) → 307 to `/work/abroadly` with `__prerender_bypass`. `path=//evil.example` → `/`. JWT header → 307. **Behaviour change from F-02:** a cookie with no `Sec-Fetch-Site` (curl), or a cross-site link, now gets 401. That is correct. Note for 3.4: start preview from the admin, never from an external link |
| `/api/draft/disable` | 307 → `/` |
| `/resume` | 404 (no résumé uploaded), as before |
| `robots.txt` / `sitemap.xml` | Disallow `/admin` and `/api`; 6 URLs. Both show `localhost:3000` locally, from build-time `siteUrl()` (expected; `NEXT_PUBLIC_SITE_URL` / Vercel vars in production) |
| OG images | `/opengraph-image-12o0cb` 51.8 KB, `/work/abroadly/…` 49.6 KB, `/work/nook/…` 43.7 KB, all 200 `image/png` |
| Both templates render | Editorial and Folio e2e projects are all green (§1) |
| First-load JS (Folio, `/`, `/contact`, `/work/abroadly`) | 8 modern scripts, **154.7 KB gzip** (153.3 KB in phase 1). **Site JS ≈ 23.4 KB** (Folio 12.7 + Editorial 10.7), ≤ 60 KB: PASS. **No Payload, GreenSock, Lenis or Turnstile code** in any first-load chunk (`grep`; `data/jssize.txt`) |
| Lighthouse mobile, Folio `/` | **No regression from the headers.** A/B: the current build vs the pre-fix commit `20af643`, built with the same `node_modules`, 3 interleaved runs each (`data/lighthouse-ab-*.json`). **Current: 92 (88/92/92), LCP 3.17 s. Pre-fix: 90 (85/90/92), LCP 3.48 s.** CLS 0, a11y/BP/SEO 100 on both, 1 document request each. Three earlier runs, made while 4 servers were loading the host, gave 89 (`data/lighthouse-home.json`). Both builds are still under the §5 budget (≥ 95, LCP ≤ 2.0 s). That gap is the open Phase 1 item (work plan 5.2), not a Phase 2 issue |

---

## 5. New findings from the fixes (one batch, most severe first)

Every finding was reproduced twice.

| ID | Sev | Area | Evidence | Expected (guide § / plan) | Owner | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| N-01 | minor | Security headers / uploads | The site-wide `Content-Security-Policy: frame-ancestors 'self'` (`next.config.ts:22,35`) **replaces** Payload's upload CSP (`script-src 'none'; frame-src 'none'; object-src 'none'`, `node_modules/payload/dist/uploads/uploadContentSecurityPolicy.js:1`) on `/api/media/file/*`. Before the fix, a clean uploaded SVG was served with Payload's policy (first report §3). Now `curl -D - /api/media/file/qa-clean.svg` returns only `Content-Security-Policy: frame-ancestors 'self'` (`data/headers.txt`, end). If an SVG with script ever got past Payload's upload sanitiser, opening it directly would run it on the admin's origin. The comment at `next.config.ts:15-16` claims the opposite. **Exposure today is low:** on Vercel, `media` uses Blob with `disablePayloadAccessControl` (`payload.config.ts:147-151`), so files come from the Blob domain, not this route | Defence in depth stays in place (§7–§8). Add a later rule `{ source: "/api/media/file/:path*", headers: [{ key: "Content-Security-Policy", value: "script-src 'none'; frame-src 'none'; object-src 'none'; frame-ancestors 'self'" }] }`; Next lets the last matching rule win for the same key. Fix the comment and add a header assertion for this route (tester 4.3) | backend | XS |
| N-02 | minor | Contact UX | Invisible characters anywhere in the **message body** reject the whole message with "Your message contains characters I can't accept." The sender can't see what is wrong. Text copied from web pages often contains such characters: a soft hyphen U+00AD, ZWSP U+200B, word joiner U+2060. All three were refused (`tools/sc-body.json` → `data/contact-body-hidden.txt`; `lib/contact.ts:151`, list at `:92`) | F-06 asked for name and email. The body never reaches a header or the subject, so strip those characters from it (keep rejecting the bidi overrides U+202A–202E and U+2066–2069, or strip them too). Otherwise, say which characters were the problem | backend | XS |
| N-03 | minor | Docs / env | `docs/ops/env.md` is missing variables the fixes started reading: `TRUSTED_PROXY_HOPS` (`lib/rate-limit.ts`), `RESET_ADMIN_EMAIL` / `RESET_ADMIN_PASSWORD` (`scripts/reset-admin-password.ts`), and system variable `VERCEL_BRANCH_URL` (`lib/origins.ts`), which belongs in "Read but never set". All are in `.env.example:58-89` except `VERCEL_BRANCH_URL`. Every other `process.env.*` read is documented (scripted check) | env.md rule: "Add a new variable here in the same change that starts reading it" | monitoring | XS |
| N-04 | minor | Admin / docs | Opening the admin on a host outside the allowlist fails **silently**. Example: the LAN address `next start` prints (`http://192.168.68.107:4300`). `POST /api/users/login` → 200, but the cookie is then ignored (Origin not in `csrf`), and the page stays on `/admin/login` with no message (`tools/lan-admin.cjs` → `data/lan-admin.txt`). This is how Akash would test the admin on his real phone over Wi-Fi. The same happens on Vercel for any alias not in `lib/origins.ts` (production: a `*.vercel.app` alias; the admin works only on the canonical domain because `serverURL` makes API calls absolute) | Admin usable on a phone (2.6, guide §5). Document it in `docs/admin-guide.md` and env.md: "Testing on a phone over Wi-Fi: set `EXTRA_ALLOWED_ORIGINS=http://<LAN-IP>:3000`", and "In production, open `/admin` on the main domain". A one-time `console.warn` when a login's Origin isn't allowed would also help | monitoring (docs); backend (optional warn) | XS |
| N-05 | minor | Tooling | After any local `npm run test:e2e`, `npm run lint` fails: 3,064 problems, 239 errors, all in `playwright-report/trace/*.js`. The HTML reporter always writes the trace viewer. `eslint.config.mjs` `globalIgnores` lists `.next*`, `.claude` and `docs/qa`, but not `playwright-report/**` or `test-results/**`. Reproduced twice (`data/gate-lint-trimmed.txt`). CI is unaffected (fresh checkout per job) | Lint gate gives the same result locally and in CI. Add `"playwright-report/**"` and `"test-results/**"` to `globalIgnores` | tester | XS |

**Counts:** blocker 0, major 0, minor 5 new (N-01 to N-05), plus F-16 partial and F-18 open by design.

### Checked, no finding

- **Turnstile and analytics vs the new headers:**
  - The CSP carries only `frame-ancestors`, so the Turnstile script and iframe from `challenges.cloudflare.com` and Vercel's same-origin `/_vercel/*` scripts are unaffected.
  - `Permissions-Policy` blocks only the camera, microphone and geolocation, none of which Turnstile needs.
  - `X-Frame-Options` and `frame-ancestors` govern who may frame *our* pages, not the frames we embed.
- **`serverURL` on production only** (`lib/origins.ts:96`; preview and local stay empty, confirmed with `tsx`):
  - It can't be exercised locally, because it needs https on the canonical host.
  - Add to the first production deploy checklist: on the production domain, admin login, live preview, a media upload and the availability toggle.
- **`EXTRA_ALLOWED_ORIGINS` parsing:** covered by unit tests (`tests/contact-backend.test.ts:262-292`); invalid entries throw at config load.
- **Missing local media file:** `GET /api/media/file/<missing>` returns 500 with one ERROR line and no stack. This is Payload upstream, local-disk only; on Blob, files come from the Blob domain.

---

## 6. Remaining items by owner (one pass each)

**backend** (one small PR, then lint, unit and the `curl` header probe):

1. N-01: add the combined CSP rule for `/api/media/file/:path*` and correct the comment at `next.config.ts:15-16`.
2. N-02: strip invisible characters from the message body instead of rejecting it.
3. N-04 (optional): a one-time warning when a cookie login comes from an Origin outside the allowlist.
4. Task 3.3 (already planned): the Turnstile widget plus the real success path (closes F-18).
5. Task 3.4: draft mode is entered from the admin only (same-origin `Sec-Fetch-Site`).

**monitoring:**

1. N-03: add `TRUSTED_PROXY_HOPS`, `RESET_ADMIN_EMAIL` / `RESET_ADMIN_PASSWORD` and `VERCEL_BRANCH_URL` to `docs/ops/env.md`.
2. N-04: add "phone over Wi-Fi" (`EXTRA_ALLOWED_ORIGINS`) and "production admin only on the canonical domain" to `docs/admin-guide.md` and env.md.
3. Add to the production deploy checklist: verify `serverURL` (admin login, live preview, upload on the production domain).

**tester:**

1. N-05: add `playwright-report/**` and `test-results/**` to `eslint.config.mjs` `globalIgnores`.
2. Task 4.3: assert the headers, including the upload CSP from N-01; a foreign-Origin cookie write → 403; the first-register guard with `VERCEL_ENV`; matrix without `LEAK`. Restore the 12 fixme contact tests in 3.3.

**design:** nothing.
