# Work plan

How the rebuild in [REBUILD_GUIDE.md](REBUILD_GUIDE.md) gets built, in seven phases:

```
0 Setup → 1 Build UI → 2 Build backend → 3 Connect → 4 Test → 5 Refine + launch → 6 Features (repeat)
```

The UI is built first on static content, so you can see and judge the design early. The backend is then built on its own (admin dashboard, contact form, routes) without touching the UI. Phase 3 plugs one into the other. This works because Phase 0 fixes the **contract** between them: the `SiteContent` type the UI reads and the contact-form action signature it calls.

The **lead** is the main Claude Code session: it starts each phase's agents, merges their worktree branches, owns the shared files, and brings decisions to Akash.

---

## Team

| Agent | Model | Role | Owns | Isolation |
| --- | --- | --- | --- | --- |
| `folio-design` | Opus, high | UI, layout, motion, mobile-first | `templates/folio/**`, `app/globals.css`, presentational `components/shared/*`, `public/**` assets | worktree |
| `backend` | Opus, high | Content contract, data layer, routes, Payload admin, Server Actions, caching | `lib/**`, `templates/types.ts`, `templates/registry.ts`, `app/(site)/**` page/layout wiring, `app/(payload)/**`, `app/api/**`, route handlers, `collections/**`, `globals/**`, `payload.config.ts`, `next.config.ts`, `.env.example` | worktree |
| `tester` | Sonnet, medium | Vitest, Playwright, axe | `tests/**`, `e2e/**`, test configs, test scripts + devDeps | worktree |
| `qa` | Opus, high | Read-only gate at the end of every phase | `docs/qa/**` only | main checkout |
| `monitoring` | Sonnet, medium | CI, Lighthouse CI, Vercel previews, analytics, uptime, free-tier tracking | `.github/**`, Lighthouse config, `instrumentation*.ts`, `components/shared/Telemetry.tsx`, `docs/ops/**` | worktree |

**Shared files, edited only by the lead** (agents request changes in their report): `package.json` (except tester's test scripts), `package-lock.json`, `tsconfig.json` (backend may add paths), `AGENTS.md`, `CLAUDE.md`, `docs/REBUILD_GUIDE.md`, this file.

## How every phase runs

1. Lead confirms the previous phase's gate passed, then starts that phase's agents (in parallel where tasks don't depend on each other).
2. Each agent works in its own worktree branch, runs lint + typecheck + build, and ends with a report: files, packages, env vars, verification, requests.
3. Lead merges in the listed order, re-runs the gates, and applies requested shared-file changes.
4. `qa` audits the merged result → `docs/qa/phase-<n>-<date>.md`. **FAIL → owners fix → qa re-checks.** The phase closes on PASS, or on PASS WITH ISSUES with no blockers.
5. Lead summarises the phase for Akash: what's done, preview link, decisions needed.

**Always-on checks, from Phase 0:** CI runs lint, typecheck, build and a small smoke test on every branch. The full test suite comes in Phase 4, but nothing merges broken before then.

Status key: `todo` · `doing` · `review` · `done`. The lead updates the Status columns.

---

## Phase 0: Setup (½–1 day)

**Goal:** a clean, committed baseline, the UI ↔ backend contract, and automatic checks.

| ID | Task | Owner | Depends | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| 0.1 | Commit the current site, tag `v1-editorial`; commit `.claude/` (skills, agents, `settings.json`), `.worktreeinclude`, `skills-lock.json`, `docs/` | lead | — | `git status` clean, tag exists | done |
| 0.1b | Create a GitHub repo on Akash's personal account (Vercel Hobby can't deploy org repos), add it as `origin`, push `main` + tag. Optional: install GitHub CLI (`gh`) so the lead can open PRs and read CI results | **Akash** (lead pushes after approval) | 0.1 | `git remote -v` shows origin; CI can run | done |
| 0.2 | **Contract:** `lib/content-types.ts` (`SiteContent`: profile incl. greetings, services 01/02/03, availability, timezone, now, version label; projects incl. case-study fields; experience; publications; skills; education), `ContactInput` / `ContactState` types and the `submitContact(prev, formData)` signature with a **stub** that validates and returns success without sending; `lib/data.ts` `getSiteContent()` reading `lib/content.ts`; `templates/types.ts` + `registry.ts` with `editorial` (today's design, stays live until 1.G) and a `folio` placeholder, chosen by env `SITE_TEMPLATE` (default `editorial`); routes moved into `app/(site)/` | backend | 0.1 | Build passes; `/` unchanged by default; `SITE_TEMPLATE=folio` renders the placeholder from typed data | done |
| 0.3 | CI (GitHub Actions): cached install, lint, typecheck, build, smoke e2e; `docs/ops/free-tier.md`, `docs/ops/env.md` | monitoring | 0.1 (runs on GitHub after 0.1b) | Workflow green on a branch | done |
| 0.4 | Test harness: Vitest + Playwright (+ axe); projects phone / phone-large / tablet / desktop; smoke test: page loads, no console errors, no horizontal scroll | tester | 0.1 | `npm test`, `npm run test:e2e` pass; job snippet handed to monitoring | done |
| 0.5 | Baseline Lighthouse + 360px screenshots of today's site → `docs/qa/baseline/` | qa | 0.1 | Report exists | done |
| 0.6 | Assets: Nook phone screenshots; SoulMatch + Cerebral Insights screenshots (1600×1000, ~560×1212, WebP); square avatar; résumé PDF. Answers to guide §13 (accent, hero photo, public phone number) | **Akash** | — | Files in `assets/incoming/`; answers in §13 | todo |
| 0.G | **Gate:** contract reviewed by lead + design + backend; CI green | qa | 0.2–0.4 | PASS | done |

Merge order: 0.2 → 0.3 → 0.4.

---

## Phase 1: Build UI (6–8 days)

**Goal:** every page of the Folio template, fully designed and animated, running on static content. No database, no real email. Looks and behaves like the finished site on phone, tablet and desktop.

| ID | Task | Owner | Depends | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Tokens (guide §3), Folio fonts, primitives: `FillButton`, `RoundButton`, `Magnetic`, `Chip`, `Tile`, `Row`, `CurvedEdge`; helpers `useFinePointer`, reduced-motion `matchMedia` | folio-design | 0.G | Primitives correct at all widths on a scratch route | done |
| 1.2 | Global shell: top bar ("© Code by Akash", phone shows only "Menu"), fixed burger after hero, menu panel (focus trap, `Esc`, scroll lock, safe areas), footer with curved edge, stacked pills, live Dhaka time | folio-design | 1.1 | Guide §4.1 + footer row of §4.2 at all widths; keyboard-only works | done |
| 1.3 | Home sections: hero (name marquee, role, availability), intro + round "About me", recent work tiles, experience (`<details>` on phone), research block | folio-design | 1.2 | Guide §4.2 at 320–1440 | done |
| 1.4 | Desktop-only enhancements: list rows + cursor hover modal, row dimming, magnetic, logo text roll; then the preloader (once per session, ≤ 1.6s, skipped on reduced motion) | folio-design | 1.3 | Absent on touch; Lighthouse mobile ≥ 95 | done |
| 1.5 | Work index (filters, list ↔ grid on fine pointer) and case-study page (facts row, laptop frame, phone scroll-snap row, next case) | folio-design | 1.3 | Guide §4.3–4.4 | done |
| 1.6 | About (statement, portrait, 01/02/03, toolkit, education, Now) and Contact (numbered conversational form wired to the **stub** `submitContact`, `useActionState` pending/error/success) | folio-design | 1.2 | Guide §4.5–4.6; form states visible with the stub | done |
| 1.7 | Page transitions (view-transition crossfade), 404 page | folio-design | 1.5, 1.6 | Smooth on phone; reduced motion → no motion | done |
| 1.8 | Static content for the new pages: case studies for Abroadly and Nook (drafted from the repos' READMEs, flagged for Akash), services, greetings, Now line, new screenshots from 0.6 | backend | 0.2, 0.6 | `lib/content.ts` complete; nothing left as placeholder | doing |
| 1.9 | Vercel preview deploys per branch (Akash links the GitHub repo once) so the UI can be checked on a real phone | monitoring | 0.3 | Preview URL posted for each merge | done |
| 1.G | **Gate:** design review against guide §4–§6 at every width, axe, Lighthouse mobile per page, reduced motion; Akash checks the preview on his phone | qa + **Akash** | 1.1–1.9 | PASS + Akash's OK on the look | doing |

Merge order: 1.1 → 1.2 → 1.8 → 1.3 → 1.6 → 1.5 → 1.4 → 1.7. Task 1.9 can merge any time.

---

## Phase 2: Build backend (5–6 days)

**Goal:** the admin dashboard and all server features working **on their own**, tested against a dev database. The public site still reads static content: nothing visible changes yet.

| ID | Task | Owner | Depends | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Free accounts: MongoDB Atlas free cluster (dev + prod databases), Vercel Blob store, Resend API key, Cloudflare Turnstile keys; secrets into `.env.local` and Vercel env | **Akash** (monitoring writes the steps in `docs/ops/accounts.md`) | 1.G | Keys exist; nothing committed | todo |
| 2.2 | Install Payload 3 (Mongo adapter, Lexical, Vercel Blob storage); ESM config, `withPayload`, `(payload)` route group; **`cacheComponents` spike** → `docs/decisions/cache-components.md` | backend | 2.1 | `/admin` loads locally; decision written | todo |
| 2.3 | Collections + globals (guide §7): `profile`, `site-settings`, `projects` (drafts/versions), `experience`, `publications`, `skills`, `education`, `media` (alt required), `messages`, `users` (single admin, no sign-up). Access control on every collection | backend | 2.2 | CRUD works in `/admin`; anonymous API calls denied where they should be | todo |
| 2.4 | Seed script: imports `lib/content.ts` + `public/projects/*` into Payload; idempotent | backend | 2.3 | Running it twice gives the same data; admin shows all current content | todo |
| 2.5 | Real `submitContact`: validation, honeypot, Turnstile, Mongo-backed rate limit, save to `messages`, Resend notification (`onboarding@resend.dev` → Akash). Same signature as the 0.2 stub | backend | 2.3 | Success / invalid / spam / rate-limited paths verified with a script | todo |
| 2.6 | Admin dashboard: unread-messages widget, availability toggle, quick links, drag-to-reorder projects and experience | backend | 2.3 | Usable on a phone | todo |
| 2.7 | Route handlers and SEO: `/resume` → latest upload, `sitemap.ts`, `robots.ts`, OG images, `JsonLd` (`Person`, `ScholarlyArticle`), `/api/draft` (auth-checked) | backend | 2.3 | Each responds correctly locally | todo |
| 2.8 | `Telemetry` component (Vercel Analytics + Speed Insights) and error-reporting setup in `instrumentation*.ts`; handed to backend for mounting in Phase 3 | monitoring | 1.G | Component ready; free-tier notes updated | todo |
| 2.G | **Gate:** security review (auth in every action/handler, secrets not in client bundle, access rules, input validation), admin usable on a phone, seed matches static content | qa | 2.2–2.8 | PASS | todo |

Merge order: 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8.

---

## Phase 3: Connect UI and backend (2–3 days)

**Goal:** the public site reads from Payload, the contact form really sends, and edits in `/admin` appear on the site without a redeploy.

| ID | Task | Owner | Depends | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| 3.1 | `getSiteContent()` reads the Payload Local API, maps to `SiteContent`, `'use cache'` + `cacheTag`; templates unchanged | backend | 2.G | Site looks identical to Phase 1 but data comes from Payload | todo |
| 3.2 | Revalidation: `afterChange` / `afterDelete` hooks → `revalidateTag(tag, 'max')`; settings changes revalidate `settings` | backend | 3.1 | Edit a project in `/admin` → public page updates on next request | todo |
| 3.3 | Contact form switches from the stub to the real `submitContact`; Turnstile widget added to the form | folio-design (UI) + backend (wiring) | 2.5, 3.1 | Message lands in the admin inbox and in Akash's email | todo |
| 3.4 | Live preview + draft mode: `RefreshRouteOnSave`, preview banner, drafts visible only in preview | backend | 3.2 | Draft edits show in preview, not on the live site | todo |
| 3.5 | Mount `Telemetry`; images served from Vercel Blob through `next/image` with the free-tier settings (guide §9.2) | backend | 2.8, 3.1 | Analytics events visible on preview; image variants limited | todo |
| 3.6 | Preview environment: env vars set on Vercel, Atlas network access for Vercel, seed the preview database | monitoring (+ Akash approves) | 3.1 | Preview deploy works end to end | todo |
| 3.G | **Gate:** end-to-end check on the preview: edit → live, contact → inbox + email, draft → preview only; site still matches Phase 1 visually | qa | 3.1–3.6 | PASS | todo |

Merge order: 3.1 → 3.2 → 3.3 → 3.4 → 3.5; 3.6 alongside.

---

## Phase 4: Test (3–4 days)

**Goal:** full automated coverage, everything enforced in CI, and every defect found is fixed.

| ID | Task | Owner | Depends | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Unit tests: `lib/data.ts` mapping, contact validation, spam and rate-limit logic, access-control functions, helpers (BibTeX, time formatting) | tester | 3.G | Green; meaningful coverage of `lib/` | todo |
| 4.2 | E2E, every page × 4 viewports: loads clean, one `<h1>`, axe, no horizontal scroll, reduced motion, menu, tiles vs rows + hover modal, filters, case-study navigation, contact success/error/spam (Resend + Turnstile mocked) | tester | 3.G | Green on all projects; 0 flaky after 3 runs | todo |
| 4.3 | Admin E2E with `mongodb-memory-server`: login, edit project → public page, reorder, availability toggle, anonymous can't read messages | tester | 3.G | Green | todo |
| 4.4 | CI: full unit + e2e (phone + desktop Chromium, WebKit phone), Lighthouse CI blocking with guide §5 budgets | monitoring | 4.1–4.3 | CI fails on a deliberate regression, passes on main | todo |
| 4.5 | Full audit: spec, mobile rules, accessibility (keyboard + screen reader), performance per page, motion, security, free-tier settings | qa | 3.G | Findings report with owners | todo |
| 4.6 | Fix every blocker and major finding from 4.2–4.5 | folio-design / backend (by owner) | 4.5 | QA re-check passes | todo |
| 4.G | **Gate:** all tests green in CI, QA PASS | qa | 4.1–4.6 | PASS | todo |

---

## Phase 5: Refine and launch (3–4 days)

**Goal:** the details that make it feel finished, real content, real devices, then production.

| ID | Task | Owner | Depends | Done when | Status |
| --- | --- | --- | --- | --- | --- |
| 5.1 | Polish: sliding image rows (static on phone), curved menu-edge morph, footer curve tween, BibTeX copy, micro-interaction timing pass (one easing family, durations from tokens) | folio-design | 4.G | Budgets still met | todo |
| 5.2 | Performance pass: drop Editorial from the live registry (its 7.6 KB gz client chunk ships on every Folio route while both templates share one route graph; it moves to the archive in 6.3), site JS ≤ 60 KB gzipped excluding the React/Next runtime, motion libraries loaded after first paint, LCP ≤ 2.0s on phone, image sizes, font subsetting | folio-design + backend | 4.G | Lighthouse numbers in the QA report meet §5 | todo |
| 5.3 | Content pass with Akash in `/admin`: case-study facts, copy, screenshots, résumé, availability | **Akash** + backend | 4.G | Every page reviewed by Akash | todo |
| 5.4 | Real-device test: Android Chrome (low-end), iPhone Safari, landscape, reduced motion, VoiceOver/TalkBack on menu and form | **Akash** with qa's checklist | 5.1–5.3 | Checklist signed off | todo |
| 5.5 | Launch: production env vars, production deploy (Akash approves), optional free domain (`*.is-a.dev`), UptimeRobot monitor, `docs/ops/runbook.md` (backup, key rotation, quota limits) | monitoring | 5.4 | Live URL; monitor green; runbook complete | todo |
| 5.G | **Launch gate:** every page × every width, Lighthouse all pages, a11y, security re-check on production | qa | 5.1–5.5 | PASS | todo |

---

## Phase 6: Features (repeat per feature)

Each feature runs the same mini-cycle: **UI → backend → connect → test → refine**, owned by the same agents, gated by `qa`. One feature at a time, in this order unless Akash reprioritises (details in guide §12 and §10):

| ID | Feature | Agents | Free service |
| --- | --- | --- | --- |
| 6.1 | Project archive `/archive` (year, project, built with, links) | design, backend, tester | — |
| 6.2 | ⌘K command menu (jump to section, copy email, open GitHub) | design, tester | — |
| 6.3 | Version archive `/v/<template>` + "Older versions of this site" link (starts with `v1-editorial`) | backend, design | — |
| 6.4 | Second template ("Index") + template switcher with preview in admin | design, backend, tester | — |
| 6.5 | Live visitor count and live reactions on case studies | backend, design, tester, monitoring | Ably free |
| 6.6 | Annotations toggle ("how this was built" notes) | design | — |
| 6.7 | ML lab page with an in-browser tomato-leaf classifier demo | design, backend | — |
| 6.8 | Analytics widget in the admin dashboard | backend, monitoring | Vercel Analytics |
| 6.9 | Page-transition curtain, live cursors (desktop only) and other flashier effects | design | — |

Rule for every feature: it must keep the guide §5 budgets and §9 free-tier limits, and it must not break any earlier test.

---

## Timeline (rough)

| Phase | Agent time | Plus Akash |
| --- | --- | --- |
| 0 Setup | ½–1 day | assets + 3 answers |
| 1 Build UI | 6–8 days | review the preview on your phone |
| 2 Build backend | 5–6 days | create free accounts (~1 hour) |
| 3 Connect | 2–3 days | approve preview env |
| 4 Test | 3–4 days | — |
| 5 Refine + launch | 3–4 days | content pass + device test + launch approval |
| **v1 total** | **≈ 4 weeks** | |
| 6 Features | ~1–3 days each | pick the order |

## Rules for everyone

- **Build first, test later (user decision, 2026-10-12).** Tasks run only typecheck + one build. Screenshots, Lighthouse, axe, cross-browser matrices and the full e2e suite run once per phase gate, and defects are fixed in one batch afterwards. Reports stay short.
- Mobile first, free tier only, read the Next.js 16 docs before using an API (see each agent file).
- Stay inside your owned paths; ask for everything else in your report.
- No commits to `main`, no pushes, no production deploys, no account actions: the lead does these after Akash approves.
- Every report lists: task IDs, files changed, packages added, env vars added, verification results, requests.
