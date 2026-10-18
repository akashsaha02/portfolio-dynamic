# Preview and production environments (task 3.6 groundwork)

How a deployed site connects to MongoDB Atlas, Blob, Resend and Turnstile, how to seed the databases, and the checklists for the first production deploy and the Phase 3 gate. Akash does every account click; agents never touch the dashboards. Names and meanings of each variable are in `docs/ops/env.md`; account steps are in `docs/ops/accounts.md`; Vercel project setup is in `docs/ops/vercel-setup.md`.

Checked against current docs on 2026-10-15: [Vercel environment variables](https://vercel.com/docs/environment-variables) (changes apply only to new deployments; a Preview variable can apply to all non-production branches or one specific branch, and a branch-specific value overrides the general Preview value), [Deployment Protection](https://vercel.com/docs/deployment-protection) (Standard Protection covers every deployment except production domains; it is available on Hobby), [Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) (built-in roles apply to the whole project; use specific privileges to limit a user to one database; SCRAM users authenticate against `admin`), [Atlas free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).

> **Never put real values in `.env.example`.** It is committed to a public repo, so anything in it is published (and stays in the history even after you delete it). Real values go only in `.env.local` (git-ignored). Leave every secret in `.env.example` empty or a placeholder such as `<user>:<password>`.
>
> How to catch a slip:
> - Before every commit that touches it, run `git diff .env.example` (and `git diff --cached .env.example` once staged). Only comments and empty values should change.
> - CI backstop: the `check` job in `.github/workflows/ci.yml` has a "Guard .env.example" step that fails on a connection string with a password, a Resend `re_` key, or a long random-looking value. It runs on the pull request, so it is a safety net, not a substitute for the diff (by then the commit exists).
> - Optional local pre-commit hook (`.git/hooks/pre-commit`, not committed): fail when `git diff --cached -U0 .env.example` shows an added non-comment line whose value after `=` is 24 or more characters, for example `git diff --cached -U0 .env.example | grep -E '^\+[^+#]*=.{24,}' && exit 1`.
> - If a real value was ever pushed: rotate it at the provider first (Atlas user password, Resend key, and so on), then clean the file. Deleting it from the file does not un-publish it.

## 1. Scopes at a glance

One Atlas free cluster, two databases, two users. Vercel has three scopes; we use two.

| Variable | Preview scope (every non-`main` branch and PR) | Production scope (`main`) |
| --- | --- | --- |
| `DATABASE_URI` | `.../portfolio-dev` as user `portfolio-dev` | `.../portfolio` as user `portfolio-prod` |
| `PAYLOAD_SECRET` | its own random value | a different random value |
| `BLOB_READ_WRITE_TOKEN` | added when the Blob store is connected (tick Preview) | added when the Blob store is connected (tick Production) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare test keys are fine (always pass), or the real keys if the real widget lists the preview hostname | real keys, widget hostname includes the production domain |
| `RESEND_API_KEY` | the `portfolio-dev` key (or the prod key; free tier is 100 emails per day either way) | the `portfolio-prod` key |
| `CONTACT_TO_EMAIL` | the Resend account email (test sender limit) | same, until a Resend domain is verified |
| `SITE_TEMPLATE` | optional; no-database fallback only (see section 2) | leave unset |
| `NEXT_PUBLIC_SITE_URL` | leave unset (previews use their own URL) | optional; set only to advertise a custom domain |
| `EXTRA_ALLOWED_ORIGINS` | normally unset | normally unset; add the `*.vercel.app` alias or a second domain if the admin must work there |
| `ALLOW_FIRST_USER` | unset | unset |

Rules of thumb:

- When adding a variable in Vercel, tick **only** the scope in the table. `DATABASE_URI` for the dev database must not be ticked for Production, and the prod URI must not be ticked for Preview. A preview build running with the production URI could write test content into the live database.
- Different `PAYLOAD_SECRET` per scope means a session cookie from one environment is useless on the other.
- Mark everything except `NEXT_PUBLIC_*` as **Secret** (write-only after saving). Every change applies to **new** deployments only, so redeploy after changing a variable.
- The Blob store is shared (one store, `portfolio-media`, connected to both scopes), so preview uploads land next to production media. Acceptable for one person; to separate them, make a second store connected to Preview only (`docs/ops/accounts.md` section 2).
- Previews sit behind Vercel Authentication (Standard Protection): you must be signed in to Vercel to open them. Production is public. Keep Authentication **on** now that previews carry a database and the admin.
- The admin works only on origins in the allowlist: on a preview open the deployment or branch URL, on production the main domain. See `docs/ops/accounts.md` section 8 (login failing silently on any other host).

## 2. Which template renders (precedence)

Folio is the only template since work plan 5.2 (Editorial retired, git tag `v1-editorial`), so this only matters again if a second template is added.

- `DATABASE_URI` set: the template comes from the database, Site settings > `activeTemplate`, and **the database wins**. The `SITE_TEMPLATE` variable is ignored for rendering. A stored `editorial` (from before 5.2) reads as `folio`.
- `DATABASE_URI` unset (CI, a laptop with no database, a build before Atlas is connected): the static fallback applies and `SITE_TEMPLATE` (default and only value `folio`) picks the template.
- `npm run seed` writes `activeTemplate` from `SITE_TEMPLATE` (unset = `folio`). No need to set it.
- Delete any leftover `SITE_TEMPLATE` variable in Vercel (Preview or Production); it no longer does anything useful. An unreachable database fails the build or render on purpose; it does not fall back to the static copy.

## 3. Seeding a database from your laptop

### Pre-flight before seeding Atlas

Tick all of these before `npm run seed`. A seed writes to whichever database the string points at.

- [ ] `BLOB_READ_WRITE_TOKEN` is in `.env.local` (from the Blob store's `.env.local` tab). Without it images are saved on your disk and are broken on Vercel.
- [ ] `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set (shell or `.env.local`) if the database has no admin yet. Password from your password manager; unset them afterwards.
- [ ] `DATABASE_URI` points at the intended database: `.../portfolio-dev` for dev and Preview, `.../portfolio` for production. Read the host and database name (not the password) twice before running.
- [ ] The user in that string is the limited one (`portfolio-dev` or `portfolio-prod`, access to its own database only), **not** the Atlas default admin user or any `atlasAdmin` user. Password URL-encoded.
- [ ] Network: you are online and Atlas Network Access allows your connection (`0.0.0.0/0` per `docs/ops/accounts.md` section 1, or your current IP). A timeout or `ECONNREFUSED` is almost always this.
- [ ] `PAYLOAD_SECRET` is set (a throwaway value is fine for a seed).
- [ ] Run `npm run seed` (expect created/updated/unchanged counts; run it again and expect all unchanged), then `npm run verify:parity` and expect "no differences" (exit code 0).
- [ ] Afterwards: unset `SEED_ADMIN_*`, and restore `.env.local` to the dev database if you seeded production.

`npm run seed` (`payload run scripts/seed.ts`) imports the static content and images into whatever `DATABASE_URI` points at. It is idempotent: a second run changes nothing. It needs `DATABASE_URI` and `PAYLOAD_SECRET` from the shell or `.env.local`, and it creates the admin only when the users collection is empty and `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set.

Seed **before** the database is reachable by a deployed app. An empty database with a public admin lets anyone register as the single admin first. The Phase 2 guard already refuses sign-up on any Vercel deployment unless `ALLOW_FIRST_USER=1`, but seeding first is the belt to that suspender.

Also set `BLOB_READ_WRITE_TOKEN` for the seed run (copy it from the store's `.env.local` tab). Without it Payload stores uploaded files on the laptop's disk, and the database records would point at files that do not exist on Vercel.

Preview (dev) database:

1. In `.env.local` set `DATABASE_URI` to the `portfolio-dev` string, a throwaway `PAYLOAD_SECRET`, and `BLOB_READ_WRITE_TOKEN`.
2. Run (bash): `SEED_ADMIN_EMAIL='you+admin@example.com' SEED_ADMIN_PASSWORD='<password manager>' npm run seed`
   PowerShell: set `$env:SEED_ADMIN_EMAIL`, `$env:SEED_ADMIN_PASSWORD`, run `npm run seed`, then `Remove-Item Env:SEED_ADMIN_EMAIL, Env:SEED_ADMIN_PASSWORD`.
3. Expect a per-collection created/updated/unchanged summary. Re-run it to confirm everything reads "unchanged".

Production database: same, with `DATABASE_URI` set to the `portfolio` string as `portfolio-prod`, and a different admin password. Restore `.env.local` to the dev values afterwards so a later `npm run dev` or reset never touches production by accident.

Network note: your laptop IP needs no separate Atlas Network Access entry because `0.0.0.0/0` is already allowed for Vercel (`docs/ops/accounts.md` section 1), but the laptop connection still needs a working internet connection and the exact `mongodb+srv://` string (URL-encoded password).

Lost the admin password later: `npm run admin:reset-password -- you@example.com` with `RESET_ADMIN_PASSWORD` set (`docs/admin-guide.md`).

## 4. First production deploy (numbered checklist)

Production keeps showing whatever `main` builds until you merge, so do this when the Phase 3 branch is ready to merge.

1. **Accounts** (once, `docs/ops/accounts.md`): Atlas project, free cluster, users `portfolio-dev` and `portfolio-prod`, network `0.0.0.0/0`; Vercel project imported (`docs/ops/vercel-setup.md`); Blob store `portfolio-media` (Public) connected to Production and Preview; Resend account and key; Turnstile widget with the production hostname. Save both Atlas strings in a password manager.
2. **Generate secrets**: three different `PAYLOAD_SECRET` values (local, Preview, Production).
3. **Seed Atlas dev** from the laptop (section 3). Log in locally against it if you want a check: `npm run dev`.
4. **Seed Atlas prod** from the laptop (section 3), with the admin email that is not published on the site. Do this before step 5.
5. **Set Vercel env** (Settings > Environment Variables), scoped as in section 1: Production gets the prod `DATABASE_URI`, its own `PAYLOAD_SECRET`, Resend, `CONTACT_TO_EMAIL`, real Turnstile keys; Preview gets the dev `DATABASE_URI`, its own `PAYLOAD_SECRET` and the rest. Confirm `ALLOW_FIRST_USER` is not set anywhere. Optional: `NEXT_PUBLIC_SITE_URL` if a custom domain is primary.
6. **Deploy**: merge to `main` (Production) and push a branch or PR (Preview). Wait for Ready.
7. **Verify on Production** (use the main production domain, not another alias):
   - `/admin` login works and shows the dashboard; a wrong host would loop on the login page (`docs/ops/accounts.md` section 8).
   - Live preview: open a project, toggle Live Preview, the page renders beside the form.
   - Upload: Content > Media > upload a small image with alt text; its URL is a `*.public.blob.vercel-storage.com` address and it displays.
   - Contact form end to end: submit a real message from the public site; it appears in Inbox > Messages and an email reaches `CONTACT_TO_EMAIL`.
   - Availability toggle: change Open/Limited/Closed on the dashboard; the public page badge updates without a redeploy. Set it back.
8. **Remove temporary state**: delete `SEED_ADMIN_*` and `RESET_ADMIN_*` from your shell and `.env.local`; restore `.env.local` to the dev database; confirm no `ALLOW_FIRST_USER` and no `EXTRA_ALLOWED_ORIGINS` LAN entry on Vercel; delete test messages and the test upload; revoke any Vercel shareable link.
9. Tell the lead "done", never the values.

## 5. Phase 3 gate verification (run on a Preview, then once on Production)

| Check | How | Pass |
| --- | --- | --- |
| Edit goes live without a redeploy | Admin: change a project title, **Publish**; reload the public page (no new deployment in the Vercel list) | New title shows within one page load |
| Draft stays private | Edit a project, **Save draft** only | Public page still shows the old text; the Live Preview / preview URL shows the draft |
| Contact reaches inbox and email | Submit the form with the real (or test) Turnstile key | Message in Inbox > Messages; email arrives; a second submission beyond the limit shows the friendly wait message |
| Settings change goes live | Site settings > turn the announcement banner on, Save; then off again (the template switch is gone: Folio is the only template since 5.2) | Site changes without a redeploy; Vercel deployment count unchanged; no error in runtime logs |
| Unauthorised access | Open `/api/users` or `/admin` signed out | Refused / redirected to login |
| Runtime logs clean | Vercel > project > Logs (kept 1 hour on Hobby), filter errors during the checks | No errors other than expected 4xx info lines |

If a check fails, capture the Vercel log line and the deployment URL for the lead; do not change variables in Production to experiment.

## 6. What stays out of scope here

- CI runs with no database (static fallback); see `docs/ops/env.md`. A DB-backed CI job is a Phase 4 suggestion.
- Sentry, analytics and uptime monitors: `docs/ops/free-tier.md` and `docs/ops/vercel-setup.md` section 7.
