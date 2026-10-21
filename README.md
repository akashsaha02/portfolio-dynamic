# Akash Saha — portfolio

Personal portfolio: work, case studies, research, about and a contact form. Mobile first, with an admin panel at `/admin` to edit every piece of content without a redeploy. Runs entirely on free tiers.

## Stack

- **Site:** Next.js 16 (App Router), React 19 with the React Compiler, Tailwind CSS 4. The design ("Folio") lives in `templates/folio/`. GSAP is loaded lazily and never on first paint.
- **Content:** Payload CMS 3 with MongoDB Atlas (free M0) and Vercel Blob for images. Without a database the site renders the static copy in `lib/content.ts`.
- **Contact form:** Server Action with validation, honeypot, Cloudflare Turnstile, rate limiting, saved to the admin inbox, then emailed through Resend.
- **Quality:** Vitest unit tests, Playwright end-to-end tests (phone, large phone, tablet, desktop; Chromium and WebKit; axe accessibility checks), Lighthouse CI, GitHub Actions.
- **Hosting:** Vercel Hobby, with Web Analytics and Speed Insights in production builds only.

## Run it locally

Requires Node 22 and npm 11.

```bash
npm ci
npm run dev            # static content, no database needed: http://localhost:3000
```

With the admin and a throwaway database:

```bash
npm run dev:db         # starts an in-memory MongoDB and prints a DATABASE_URI
# put that DATABASE_URI and any PAYLOAD_SECRET in .env.local, then:
npm run seed           # imports lib/content.ts and public/ images
npm run dev            # admin at http://localhost:3000/admin
```

Every variable is described in [`docs/ops/env.md`](docs/ops/env.md). Real values go in `.env.local`, which is git-ignored. Never put them in `.env.example`: it is public.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development server, production build, production server |
| `npm run lint` | ESLint |
| `npx next typegen && npx tsc --noEmit` | Typecheck |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests against a production build with no database |
| `npm run test:e2e:db` | End-to-end tests with an in-memory database: contact form success, admin edits, drafts, uploads |
| `npm run seed` | Import the static content into the database in `DATABASE_URI` (idempotent) |
| `npm run verify:parity` | Check the database matches the static content |
| `npm run admin:reset-password` | Reset the admin password ([`docs/admin-guide.md`](docs/admin-guide.md)) |

## Project layout

```text
app/(site)/        public routes: /, /work, /work/[slug], /about, /contact, /resume, OG images
app/(payload)/     Payload admin and REST API
templates/folio/   the design: shell, sections, pages, motion, styles
lib/               content types, data source switch, contact pipeline, SEO
collections/, globals/   Payload content model
e2e/, tests/       Playwright and Vitest suites
docs/              rebuild guide, work plan, ops docs, decisions, QA reports
```

## Deploy

`main` deploys to production on Vercel and every other branch gets a preview. CI runs on every push. Set up and operations:

- [`docs/ops/vercel-setup.md`](docs/ops/vercel-setup.md): project settings, environment variables, making production wait for CI
- [`docs/ops/preview-env.md`](docs/ops/preview-env.md): connecting the database, seeding, first production deploy checklist
- [`docs/ops/runbook.md`](docs/ops/runbook.md): rollback, backups, key rotation, uptime monitoring
- [`docs/ops/free-tier.md`](docs/ops/free-tier.md): quotas and the monthly check

The design and plan behind it are in [`docs/REBUILD_GUIDE.md`](docs/REBUILD_GUIDE.md) and [`docs/WORK_PLAN.md`](docs/WORK_PLAN.md).
