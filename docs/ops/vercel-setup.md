# Vercel setup (preview deploys)

Goal: every branch and pull request gets its own URL you can open on your phone, while Production (`main`) keeps showing the Editorial design until launch. About 10 minutes, all in the browser. Nothing here needs the Vercel CLI, and nothing needs a credit card.

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
6. Click **Deploy**. The first build takes about a minute and publishes **Production** from `main`. It will show the Editorial design, which is correct.

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
| `SITE_TEMPLATE` | `folio` | **Preview only** (untick Production and Development) | Previews show the new Folio design. Production has no value, so it falls back to `editorial` until launch. |
| `NEXT_PUBLIC_SITE_URL` | your production URL, for example `https://portfolio-dynamic.vercel.app` | Production and Preview | Only used for canonical and Open Graph tags. Safe to set after you see the real URL on the Overview tab. |

Both are read at build time (pages are static), so a change only applies to the next deployment. After saving, go to **Deployments**, open the three-dot menu on the latest deployment and choose **Redeploy**, or just push a new commit.

At launch (task 4.x) you will add `SITE_TEMPLATE=folio` to **Production** as well and redeploy. Nothing else needs to change.

No secrets are needed yet. When Phase 2 adds `PAYLOAD_SECRET`, `DATABASE_URI` and friends, see `docs/ops/env.md`; use **Secret** type and different values for Preview and Production.

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
- [ ] Production shows the **Editorial** design (no `SITE_TEMPLATE` there).
- [ ] Push a test branch (or open a PR). Within about a minute a **Preview** deployment appears under **Deployments** and a bot comment shows up on the PR.
- [ ] The preview URL loads and shows the **Folio** design.
- [ ] `/`, `/work`, `/work/abroadly`, `/about`, `/contact` all load on the preview, with no console errors and images visible.
- [ ] Opened on your real phone, scroll and tap targets feel right, nothing overflows at your phone's width (360 to 430 px).
- [ ] Optional: the preview response carries `X-Robots-Tag: noindex` (browser dev tools, Network tab). Vercel adds it to previews so search engines skip them (https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines).
- [ ] Build log: Node version line says 22.x, `next build` ends with the route list (`/`, `/about`, `/contact`, `/work`, `/work/[slug]`).

## 7. Web Analytics and Speed Insights (later, not now)

Do this only after `components/shared/Telemetry.tsx` is mounted in the layout (backend/lead task). Then: project, **Analytics** tab, **Enable** (Web Analytics, 50,000 events a month on Hobby); and the **Speed Insights** tab, **Enable** (10,000 data points over 30 days, shared across the team). Enabling is free on Hobby; both only record on deployments that include the script. Track usage in `docs/ops/free-tier.md`.

## Why there is no `vercel.json`

Vercel detects Next.js and runs `next build` with the right output on its own, `.vercel/` is already in `.gitignore`, and the build needs no git-ignored files (a build from a fresh clone with `SITE_TEMPLATE=folio` and `NEXT_PUBLIC_SITE_URL` set passes with no `.env` file). Redirects, headers and image limits live in `next.config.ts`. Add `vercel.json` only if we later need cron jobs, region pinning, or per-branch build skipping.

## What can go wrong

- **Repository missing in the import list.** The Vercel GitHub app does not have access to it. GitHub, then Settings, Applications, Vercel, Configure, add the repo. Or the repo is owned by an organization (not allowed on Hobby).
- **Build fails on install.** See the npm note in step 2.
- **Preview still shows Editorial.** The env var was added after that deployment was built, or it is scoped to Production. Check the scope, then redeploy.
- **Preview asks for Vercel login on the phone.** See "If the phone shows a Vercel login page".
- **No preview appears.** The branch was not pushed, or the commit author is not the Hobby team owner (for a private or organization repo). Here the repo is public and personal, so this should not apply.
- **Hobby limits.** 100 deployments a day and 100 GB transfer a month; one push to a PR branch is one deployment. See `docs/ops/free-tier.md`.

## Doc sources (checked 2026-10-12)

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
