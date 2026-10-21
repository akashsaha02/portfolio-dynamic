# Runbook

What to do when something breaks, and the routine chores that keep the site on free tiers. Account setup is in `docs/ops/accounts.md`, variables in `docs/ops/env.md`, Vercel settings in `docs/ops/vercel-setup.md`, quotas in `docs/ops/free-tier.md`, the admin in `docs/admin-guide.md`.

## How a change reaches the live site

1. Push to a branch or open a pull request. GitHub Actions runs CI (`.github/workflows/ci.yml`) and Vercel builds a **Preview**.
2. Merge to `main`. CI runs again and Vercel builds a **Production** deployment.
3. With Deployment Checks on (`docs/ops/vercel-setup.md` section 9), the new build only replaces the live site once the required CI jobs pass. Without them, Vercel promotes every successful build, even when CI is red.

Content edits in `/admin` skip all of this: they go live on the next page load, with no build.

## Site is down or broken

| Symptom | First check | Fix |
| --- | --- | --- |
| Every page errors after a deploy | Vercel > project > **Deployments**: is the newest Production build the one that broke it? | **Instant Rollback** on the project's Production Deployment tile (Hobby can roll back to the immediately previous deployment only). A rollback turns off auto-assignment of production domains, so later pushes do not go live: after the fix lands on `main`, click **Undo Rollback** on the same tile and pick the fixed deployment. |
| Pages error, deploy is old | Vercel > **Logs** (Hobby keeps 1 hour). `Couldn't read site content from Payload` means the database is unreachable | Atlas status page, Atlas > Network Access still allows `0.0.0.0/0`, Atlas user password unchanged. An unreachable database fails on purpose instead of showing stale content. |
| Build fails on Vercel, CI is green | Build log on the failed deployment | Install errors: see the npm note in `docs/ops/vercel-setup.md` section 2. Missing variable: compare with `docs/ops/env.md`. |
| CI is red | GitHub > **Actions** > the failed run; the Playwright report is attached as an artifact | Reproduce locally: `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm test`, `npm run test:e2e`. |
| Admin login loops back to the login page | Is the address the main production domain? | Only origins in the allowlist can log in (`docs/ops/accounts.md` section 8). |
| Locked out of the admin | – | `docs/admin-guide.md`, "Locked out or lost the password". |
| Contact form says it cannot send | Vercel > **Logs** for `contact` lines | Turnstile keys and hostname, Resend key and daily quota (100 emails a day). A message is saved to Inbox > Messages before the email is sent, so a Resend outage loses no messages. |
| Uptime monitor alert | Open the site on your phone (mobile data, not Wi-Fi) | If it is down for everyone, go through the rows above. |

## Uptime monitor (free, 5 minutes to set up)

UptimeRobot free plan: 50 monitors, checked every 5 minutes, email alerts.

1. Sign up at https://uptimerobot.com (free plan, no card).
2. **New monitor**: type **HTTP(s)**, friendly name `portfolio`, URL = the production domain, interval **5 minutes**.
3. Alert contact: your email. Save.
4. Optional second monitor on `/work` (a page that reads content), keyword type, keyword `Work`.

Do not point a monitor at `/admin` or `/api/*`: it would count against the Vercel firewall rate limit and wake the database for nothing.

## Backups

The Atlas free cluster (M0) has no automatic backups. Content lives in the database; uploaded images live in the Vercel Blob store; `lib/content.ts` is only the original seed, so it falls behind once you edit in `/admin`.

Monthly, and before any big content change:

1. Install MongoDB Database Tools (free): https://www.mongodb.com/try/download/database-tools
2. `mongodump --uri "<production DATABASE_URI>" --out backups/portfolio-YYYY-MM-DD` (from your laptop; `backups/` is git-ignored, keep it out of the repo).
3. Keep the last three dumps somewhere private (an encrypted folder or a private cloud drive). They contain your messages inbox.

Restore into an empty database: `mongorestore --uri "<DATABASE_URI>" backups/portfolio-YYYY-MM-DD`. Blob images are not in the dump; keep the originals of every upload on your laptop.

## Key rotation

Rotate a key when it may have leaked, and once a year anyway. Each change needs a redeploy (Vercel > **Deployments** > **...** > **Redeploy**), because variables apply to new deployments only.

| Key | Where | Side effect |
| --- | --- | --- |
| Atlas user password | Atlas > Database Access > edit user | Update `DATABASE_URI` in Vercel (that scope only) and `.env.local`; the site fails until the redeploy finishes. |
| `PAYLOAD_SECRET` | Generate a new random value (`docs/ops/accounts.md` section 5) | Logs everyone out of the admin. |
| `RESEND_API_KEY` | Resend > API Keys: create the new key, update Vercel, redeploy, then delete the old key | None. |
| Turnstile secret | Cloudflare > Turnstile > widget > Rotate secret | Update `TURNSTILE_SECRET_KEY`; forms in open tabs fail once. |
| `BLOB_READ_WRITE_TOKEN` | Vercel > Storage > the store | Managed by Vercel; reconnect the store if it leaks. |

If a key was pushed to GitHub, follow `docs/ops/accounts.md`, "If a secret leaks": rotate first, then clean up.

## Free-tier watch

Monthly check: `docs/ops/free-tier.md`, "Monthly check". The limits most likely to bite:

- Vercel Hobby: 100 deployments a day (two connected projects double every push), Web Analytics 50,000 events a month, Speed Insights 10,000 data points.
- Resend: 100 emails a day, 3,000 a month.
- Atlas M0: 512 MB storage.
- Vercel Blob (Hobby): stays free while storage and transfer stay small; keep uploads WebP and under about 500 KB.

## Doc sources (checked 2026-10-21)

- Instant Rollback: https://vercel.com/docs/instant-rollback
- Deployment Checks: https://vercel.com/docs/deployment-checks
- Atlas free cluster limits (no backups on M0): https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- mongodump: https://www.mongodb.com/docs/database-tools/mongodump/
