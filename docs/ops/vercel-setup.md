# Vercel setup (preview deploys)

Goal: every branch and pull request gets its own URL you can open on your phone. (Since work plan 5.2, Folio is the only template; the Editorial design is archived at git tag `v1-editorial`.) About 10 minutes, all in the browser. Nothing here needs the Vercel CLI, and nothing needs a credit card.

UI wording was checked against the Vercel docs on 2026-10-12 (links at the bottom). Vercel renames menus now and then; if a label differs, search the sidebar for the words in bold.

## Before you start

- The repo `akashsaha02/portfolio-dynamic` is public and owned by your personal GitHub account. That is what lets the Hobby plan deploy it (Hobby cannot deploy repos owned by a GitHub organization, and a personal-repo owner is allowed to import it).
- You must be the repo Owner on GitHub (you are). A collaborator cannot import a personal repo.
- Hobby is personal and non-commercial only (guide §9.3). A portfolio that shows your work is the standard allowed use. Do not add payments, ads, or priced "hire me for $X" packages while on Hobby.

## 1. Sign in and import the repo

1. Go to https://vercel.com/signup and choose **Continue with GitHub**. Sign in as `akashsaha02`. When asked for a plan, pick **Hobby** (free, personal).
2. When GitHub asks to install the Vercel app, choose **Only select repositories**, pick `portfolio-dynamic`, and confirm. (You can add more repos later.)
3. In the Vercel dashboard click **Add New...** (top right) then **Project**. (Direct link: https://vercel.com/new.)
4. In the repository list find `akashsaha02/portfolio-dynamic` and click **Import**. If it is missing, click **Adjust GitHub App Permissions** and add the repo.
5. On the **Configure Project** page leave everything at its default:

   | Setting | Value |
   | --- | --- |
   | Project Name | `portfolio-dynamic` (this becomes part of every URL; rename now if you want a different one) |
   | Framework Preset | **Next.js** (auto-detected) |
   | Root Directory | `./` |
   | Build Command | default (`next build`), Override off |
   | Output Directory | default, Override off |
   | Install Command | default, Override off |

   Do not add environment variables on this page. Add them in step 3 so you can pick the right scope for each.
6. Click **Deploy**. The first build takes about a minute and publishes **Production** from `main`. It shows the Folio design.

## 2. Pin Node 22 and check the production branch

1. Open the project, then **Settings** (top tab) then **Build and Deployment**.
2. Scroll to **Node.js Version** and select **22.x**, then **Save**. Vercel's default for new projects is 24.x; CI and local development use Node 22, so match them.
3. Production branch: it is chosen automatically as `main`. To confirm, go to **Settings** then **Environments**, click **Production**, and look at **Branch Tracking** (should say `main`).
4. Preview deployments: on by default for every branch that is not `main` and for every pull request. Under **Settings** then **Git** you will see **Connected Git Repository**; leave the PR comment toggles on, because that comment is where the preview link appears.

npm note: the lockfile was written by npm 11, CI installs npm 11 on purpose (`.github/workflows/ci.yml`), and Vercel's Node 22 builds use npm 10 with `npm install` (not `npm ci`). We tested `npm ci` with npm 10 against the lockfile and it resolves cleanly, and `npm install` is more tolerant than `npm ci`, so this should not fail. If a Vercel build ever fails with a lockfile or optional-dependency error during install, set **Settings** then **Build and Deployment** then **Install Command** then **Override** to `npm install -g npm@11 && npm ci`, and tell the lead.

## 3. Environment variables (do this now)

Go to **Settings** then **Environment Variables**. For each: type the **Name**, the **Value**, pick the environments, choose type **Config** (these are not secrets), click **Save**.

| Name | Value | Environments | Why |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | your production URL, for example `https://portfolio-dynamic.vercel.app` | **Optional**: Production (and Preview if you like) | Only used for canonical and Open Graph tags. It is derived automatically from Vercel's own system variables (the production domain on Production, the deployment URL on Previews), so skip it unless you want to advertise a different domain (for example a custom one). |

It is read at build time, so a change only applies to the next deployment. After saving, go to **Deployments**, open the three-dot menu on the latest deployment and choose **Redeploy**, or just push a new commit.

**`SITE_TEMPLATE` is no longer needed.** Folio is the only template and the default (work plan 5.2). If an earlier setup added `SITE_TEMPLATE` (for example `folio` on Preview), delete it; a leftover `editorial` value still builds, as Folio, with a warning in the build log.

Node is pinned by `engines` in `package.json` (`22.x`), which Vercel honours; the dashboard setting in step 2 should match it. When the two differ, `package.json` wins.

No secrets are needed to deploy the static site. For `PAYLOAD_SECRET`, `DATABASE_URI` and friends, see `docs/ops/env.md` and `docs/ops/preview-env.md`; use **Secret** type and different values for Preview and Production.

## 4. Get a preview and find its URL

Previews only exist for branches that are pushed to GitHub. A branch that lives only on your computer or in an agent worktree has no preview.

Ways to find the URL, easiest first:

1. **Pull request comment.** Open a PR on GitHub. The Vercel bot comments with a table. **Visit Preview** is the branch URL (stays the same as you push more commits); **View deployment** (under the Checks/Deployments box) is the URL for that exact commit.
2. **Vercel dashboard.** Project then **Deployments** tab. Each row shows the branch and commit; click a row then **Visit**. Rows tagged **Preview** are previews, **Production** is `main`.
3. **Predictable pattern.** The branch URL is `https://<project-name>-git-<branch-name>-<scope-slug>.vercel.app`, for example `portfolio-dynamic-git-feature-folio-akashsaha02.vercel.app` (slashes in branch names become dashes; long names are truncated, so copy it from the PR if unsure).

## 5. Open it on your phone

- Send yourself the link (Messages, email, or a notes app) and tap it. Or in the dashboard click **Visit** on the desktop, then use your browser's share/QR option (Chrome and Edge: address bar then share then **Create QR Code**), and scan with the phone camera.
- Test on the real phone at its native width and in both orientations; also try with the phone's reduce-motion setting on.

### If the phone shows a Vercel login page

Vercel's **Vercel Authentication** protects preview URLs so only people signed in to your Vercel account can open them. New projects usually have it on. You have three options; pick one:

1. **Easiest: sign in on the phone.** Open the preview, tap **Log in to Vercel**, choose **Continue with GitHub** as `akashsaha02`. Vercel sets a cookie for that URL and redirects you. The cookie is per URL, so each new commit URL may ask again, but the branch URL (`...-git-<branch>-...`) is stable enough.
2. **Shareable link (for someone else, or a phone you do not want to log in on).** Dashboard, project, **Deployments**, click the deployment, click **Share**, choose **Anyone with the link**, and copy the link (it has a secret in the query string). Hobby allows only one shareable link in total per account, so revoke it afterwards by switching the dropdown back to **Only people with access**.
3. **Turn protection off.** **Settings** then **Deployment Protection**. In the **Vercel Authentication** section switch the toggle off and click **Save**. All previews become public to anyone who knows the URL. This is acceptable today because the repo is public and nothing private is in it (no secrets, no admin, no database; previews are also sent with a `noindex` header so search engines skip them). Turn it back on before Phase 2 adds Payload, because from then on a preview carries the admin login page and connects to a database with Preview credentials.

Notes on the other options on that page: **Password Protection** is not available on Hobby (Pro, $20 per month per project), and **Trusted IPs** and **Passport** are Enterprise. With the default scope (**Standard Protection**) the production domain is never protected, only previews and per-deployment URLs. Hobby also allows only one external Vercel user per account for access requests.

## 6. Verification checklist

After the first deploy and after setting the env vars (redeploy once):

- [ ] The project Overview shows a **Production** deployment from `main` with status Ready, and the site loads on the `*.vercel.app` production URL.
- [ ] Production shows the **Folio** design.
- [ ] Push a test branch (or open a PR). Within about a minute a **Preview** deployment appears under **Deployments** and a bot comment shows up on the PR.
- [ ] The preview URL loads and shows the **Folio** design.
- [ ] `/`, `/work`, `/work/abroadly`, `/about`, `/contact` all load on the preview, with no console errors and images visible.
- [ ] Opened on your real phone, scroll and tap targets feel right, nothing overflows at your phone's width (360 to 430 px).
- [ ] Optional: the preview response carries `X-Robots-Tag: noindex` (browser dev tools, Network tab). Vercel adds it to previews so search engines skip them (https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines).
- [ ] Build log: Node version line says 22.x, `next build` ends with the route list (`/`, `/about`, `/contact`, `/work`, `/work/[slug]`).

## 7. Web Analytics and Speed Insights

The scripts are mounted, but only in Production builds (`VERCEL_ENV=production`), so previews send nothing. Turn them on: project, **Analytics** tab, **Enable** (Web Analytics, 50,000 events a month on Hobby); and the **Speed Insights** tab, **Enable** (10,000 data points over 30 days, shared across the team). Both are free on Hobby. Track usage in `docs/ops/free-tier.md`.

### Show visitors in the admin dashboard (optional)

The dashboard's **Visitors** widget reads Vercel's Web Analytics API with a token kept on the server (`VERCEL_ANALYTICS_TOKEN`, `docs/ops/env.md`). The API is free and reads the same data as the Analytics tab, so it costs no events. Vercel tokens have no read-only switch; the narrowest is a **project-scoped token**, which can reach only the `akashsaha` project. The site only ever reads with it.

1. Make sure the scope selector at the top left shows your personal account, then open **Settings** > **Tokens** (https://vercel.com/account/tokens).
2. Name: `portfolio-admin-analytics`. **Scope**: pick the team that owns `akashsaha`, then the **`akashsaha`** project (not "All Projects", which would give the whole team). If the dropdown offers no project list, choose the narrowest scope it does offer.
3. Expiration: 1 year (or shorter), and put a reminder in your calendar to rotate it. **Create**, then copy the value (shown once; it starts with `vcp_`).
4. In the `akashsaha` project: **Settings** > **Environment Variables** > add `VERCEL_ANALYTICS_TOKEN`, type **Sensitive**, environment **Production** (Preview too if you want the widget on previews). Leave `VERCEL_ANALYTICS_PROJECT` and `VERCEL_ANALYTICS_TEAM` unset: the project defaults to `akashsaha` and a project-scoped token implies the team.
5. Redeploy. Sign in to `/admin`: the widget shows 7- and 30-day totals, a daily bar chart and the top pages, refreshed at most once an hour. "Vercel rejected the token" means the token expired, was revoked or has the wrong scope: create a new one and replace the variable.

If the token leaks: delete it on the Tokens page (that stops it at once), create a new one and update the variable.

## 8. Rate limit the API and admin login (free, do before launch)

Checked 2026-10-15 against https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting: WAF Rate Limiting is available on Hobby with **1 rate-limit rule per project** (counting by IP or JA4, fixed window, 10 s to 10 min window, 1,000,000 allowed requests included). Hobby also allows up to 3 custom firewall rules in total. Since there is only one rule, cover `/api/` (Payload's login is `POST /api/users/login`, which is what `/admin/login` calls; the contact form is a server action and is limited in app code).

1. Project > **Firewall** > **Configure** > **+ New Rule**.
2. Name: `rate-limit-api`. **If** Request Path **starts with** `/api/`.
3. **Then** Rate Limit, algorithm **Fixed Window**, window **60 s**, limit **100** requests, key **IP**. (The admin UI itself makes many `/api/` calls per page; 100 a minute per IP leaves room for normal editing.) Action: start with **Log**, check Firewall overview for a day, then switch to **Default (429)**.
4. **Save Rule**, **Review Changes**, **Publish**.

Counters are per region, so a limit can be exceeded across regions. This is a brake, not a guarantee; the per-account login lockout (5 failures, 15 min) is the real login protection.

## 9. Make production wait for CI (Deployment Checks)

By default Vercel puts every successful `main` build live, even when GitHub Actions CI fails on the same commit (that happened on 2026-10-18). Deployment Checks hold each Production deployment until the chosen CI jobs pass. Free on Hobby, no code change.

1. **Settings** > **Environments** > **Production**: make sure automatic assignment of production domains is on (it is off after an Instant Rollback; see `docs/ops/runbook.md`).
2. **Settings** > **Build and Deployment** > **Deployment Checks** > **Add Checks**. Provider **GitHub**, then pick these two checks (they are the CI job names, so they show up after CI has run at least once):
   - `Lint, typecheck, unit, build`
   - `E2E (Chromium + WebKit)`
   Leave `Lighthouse CI (mobile, warn-only)` out; it only warns.
3. **Save**. From the next push on, a Production deployment shows its checks as pending, then goes live by itself once both pass (about 15 minutes after the push). A red CI leaves the previous version live.
4. Emergency: open the deployment and choose **Force Promote** to skip the checks.

If you rename a CI job in `.github/workflows/ci.yml`, update the checks here too: Vercel matches them by name.

## 10. Keep one Vercel project: `akashsaha`

Two Vercel projects (`akashsaha` and `portfolio-dynamic`) were both connected to this repo on 2026-10-15, so every push built the site twice and counted twice against the 100-deployments-a-day limit. Decision (2026-10-21): keep **`akashsaha`**, stop **`portfolio-dynamic`**.

1. Open the `portfolio-dynamic` project. Either **Settings** > **Git** > **Disconnect** (stops its builds, keeps the project; reversible), or **Settings** > **General** > **Delete Project** (permanent). Neither touches the GitHub repo.
2. Open the `akashsaha` project's **Settings** > **Domains** and note its production domain. If `akashsaha.vercel.app` is listed there but still shows the old dark site, production is not being auto-assigned: open **Deployments**, pick the newest Ready Production deployment, **...** > **Promote**, then check section 9 step 1. If it is not listed, that address belongs to your old project (another account or team); remove it there first, then **Add** it here.
3. Do sections 2, 3, 7, 8 and 9 on `akashsaha`.

## Why there is no `vercel.json`

Vercel detects Next.js and runs `next build` with the right output on its own, `.vercel/` is already in `.gitignore`, and the build needs no git-ignored files (a build from a fresh clone with `NEXT_PUBLIC_SITE_URL` set passes with no `.env` file). Redirects, headers and image limits live in `next.config.ts`. Add `vercel.json` only if we later need cron jobs, region pinning, or per-branch build skipping.

## What can go wrong

- **Repository missing in the import list.** The Vercel GitHub app does not have access to it. GitHub, then Settings, Applications, Vercel, Configure, add the repo. Or the repo is owned by an organization (not allowed on Hobby).
- **Build fails on install.** See the npm note in step 2.
- **A deployment still shows Editorial.** It was built from a commit before work plan 5.2; redeploy from current `main` or the branch.
- **Preview asks for Vercel login on the phone.** See "If the phone shows a Vercel login page".
- **No preview appears.** The branch was not pushed, or the commit author is not the Hobby team owner (for a private or organization repo). Here the repo is public and personal, so this should not apply.
- **Hobby limits.** 100 deployments a day and 100 GB transfer a month; one push to a PR branch is one deployment. See `docs/ops/free-tier.md`.

## Doc sources (checked 2026-10-12; sections 9 and 10 on 2026-10-21)

- Deployment Checks: https://vercel.com/docs/deployment-checks
- Instant Rollback: https://vercel.com/docs/instant-rollback

- Deploying a Git repository, production branch, preview branches: https://vercel.com/docs/git
- Vercel for GitHub (preview URL comment, permissions): https://vercel.com/docs/git/vercel-for-github
- Generated URLs (branch and commit URL patterns): https://vercel.com/docs/deployments/generated-urls
- Configuring a build (framework preset, build settings): https://vercel.com/docs/builds/configure-a-build
- Node.js versions (24.x default, 22.x available, setting location): https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Package managers (npm 10 on Node 22, `npm install`): https://vercel.com/docs/package-managers
- Environment variables: https://vercel.com/docs/environment-variables and https://vercel.com/docs/environment-variables/managing-environment-variables
- Deployment Protection: https://vercel.com/docs/deployment-protection
- Vercel Authentication: https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- Shareable links: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links
- Hobby plan and limits: https://vercel.com/docs/plans/hobby
- Fair use (non-commercial rule): https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage
