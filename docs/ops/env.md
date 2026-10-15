# Environment variable registry

No variable is required yet: the current app builds and runs with none. The rest are planned and get added as their tasks land. Never commit values. Local values live in `.env.local` (ignored by git); the lead copies them into worktrees. Names starting with `NEXT_PUBLIC_` are inlined into the browser bundle, so never put secrets in them.

CI (GitHub Actions) currently needs no secrets. Lighthouse CI uses temporary public storage and needs no token.

| Variable | Purpose | Secret | Needed from | Local (`.env.local`) | GitHub secrets | Vercel | Set by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SITE_TEMPLATE` | Which template renders: `editorial` or `folio`. Code default when unset is `editorial`. Read at build time; unknown value fails the build | No | Phase 1 | Optional | Not needed (CI sets it per job) | `folio` in **Preview only** now; leave unset in Production (stays editorial) until launch, then add `folio` to Production and redeploy | Akash (see `docs/ops/vercel-setup.md` step 3) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for `metadataBase`, sitemap, OG images (`lib/seo.ts`). Optional. When unset: on Vercel, production builds use `https://` + `VERCEL_PROJECT_PRODUCTION_URL` and previews use `https://` + `VERCEL_URL` (Vercel system variables, exposed by default); anywhere else `http://localhost:$PORT` (3000), with a build-time warning in production builds. An invalid URL fails the build | No | Phase 1 | `http://localhost:3000` or unset | Not needed | Optional in both. Set it in Production when the domain to advertise is not the one Vercel picks (for example a custom domain). If it is already set in Preview to the production URL, that is fine; unset, previews point at themselves | Akash in Vercel; lead locally |
| `NEXT_DIST_DIR` | Build output folder (e2e runs Folio in `.next-folio`) | No | Phase 1 | Optional | Set in the e2e job only | Never set on Vercel (it expects `.next`) | CI |
| `PAYLOAD_SECRET` | Payload session and token signing | Yes | Phase 2 | Yes (random 32+ chars) | Only if CI builds with Payload | Production and Preview, different values | Akash (generate with `openssl rand -base64 32` or `openssl rand -hex 32`; steps in `docs/ops/accounts.md`) |
| `DATABASE_URI` | MongoDB Atlas connection string | Yes | Phase 2 | Yes (dev database) | Only if CI needs a DB; prefer a mock | Production and Preview | Akash (Atlas user with least privilege). Dev and Preview use database `portfolio-dev` as user `portfolio-dev`; Production uses `portfolio` as user `portfolio-prod`. Format in `docs/ops/accounts.md` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads from admin | Yes | Phase 2 | Yes (from `vercel env pull`) | No | Auto-added when the Blob store is created/connected (Vercel also adds `BLOB_STORE_ID` and OIDC variables; leave them). Needed for Payload browser uploads | Akash (connects the store in Vercel) |
| `RESEND_API_KEY` | Contact-form email | Yes | Phase 3 | Yes | No | Production and Preview | Akash |
| `CONTACT_TO_EMAIL` | Where contact notifications go. Until a domain is verified in Resend it must be the address that owns the Resend account (`onboarding@resend.dev` sender limit) | No (it is PII, keep out of the repo) | Phase 3 | Yes | No | Production and Preview | Akash |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget (public) | No | Phase 3 | Yes (Cloudflare test key `1x00000000000000000000AA`) | No | Production and Preview (real key; test key allowed on Preview) | Akash |
| `TURNSTILE_SECRET_KEY` | Turnstile server verification | Yes | Phase 3 | Yes (Cloudflare test secret `1x0000000000000000000000000000000AA`) | No | Production and Preview (real secret; test secret allowed on Preview) | Akash |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting (optional) | DSN is low-risk, treat as config | Phase 4, optional | Optional | No | Production | Akash, after creating a Sentry project |

Step-by-step account and secret setup: `docs/ops/accounts.md`. Never paste secret values into chat or commit them.

Read but never set by us: `VERCEL_ENV` (also gates `components/shared/Telemetry.tsx`: analytics only render when it is `production`), `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL` (Vercel system variables, for the `metadataBase` fallback) and `PORT` (local fallback only). Keep "Automatically expose System Environment Variables" on in Vercel > Settings > Environment Variables (the default).

## Vercel scopes

Vercel has three scopes per variable: Production (pushes to `main`), Preview (every other branch and PR), Development (`vercel dev`/`vercel env pull`). A change only applies to deployments built after it, so redeploy. The click-by-click steps are in `docs/ops/vercel-setup.md`. Config type is fine for the variables above; use Secret type for everything marked Secret.

## Rules

- Add a new variable here in the same change that starts reading it.
- Production values are set only by Akash in the Vercel dashboard (Settings > Environment Variables). Agents prepare the name and instructions, not the value.
- Use different `PAYLOAD_SECRET` and database users for Production and Preview.
- Error reporting must not include PII: scrub emails and message bodies from the contact form before events leave the server.
- Cloudflare publishes always-pass test keys for Turnstile; use those locally and in e2e.
