# Free-tier tracker

The whole stack must stay at $0/month. Limits are from `docs/REBUILD_GUIDE.md` §9.2, checked 2026-10-10; re-check them before launch and whenever a vendor emails about plan changes.

## Services

| Service | Free limit | Where to check usage | Warn at | Action at the warning |
| --- | --- | --- | --- | --- |
| Vercel Hobby: data transfer | 100 GB / month | Vercel dashboard > Usage > Fast Data Transfer | 70 GB | Check which assets are heavy (images, video); lower image quality, add long cache headers, move big files off the site |
| Vercel Hobby: function invocations | 1M / month | Usage > Functions | 700K | Find routes that run per request; make them static or cache with `revalidate` |
| Vercel Hobby: active CPU / memory | 4 h CPU, 360 GB-hrs memory / month | Usage > Functions | 70% | Same as above; check admin and contact-form traffic for bots |
| Vercel image optimisation | 5,000 transformations / month, 300K cache reads | Usage > Image Optimization | 3,500 | Pre-size images with `sharp`, trim `deviceSizes`, raise `minimumCacheTTL`. Fallback: Cloudinary free |
| Vercel Blob | 1 GB storage, 2,000 advanced operations (uploads, list; dashboard file browsing counts), 10,000 simple operations (cache-miss reads), 10 GB blob transfer / month | Dashboard > Storage > Blob | 700 MB or 1,400 ops | Delete unused uploads, re-encode to WebP <= 200 KB. At the limit, access is blocked for 30 days |
| Vercel Web Analytics | 50,000 events / month | Project > Analytics (usage under Usage) | 35,000 | Remove noisy routes; no custom events on Hobby. Collection pauses after a 3-day grace period |
| Vercel Speed Insights | 10,000 data points / month, one project | Project > Speed Insights | 7,000 | Lower the sample rate in `Telemetry.tsx` (`sampleRate`) |
| Vercel runtime logs | 1 hour retention | Project > Logs | n/a | Use Sentry (below) if errors need history |
| MongoDB Atlas M0 | 512 MB storage, 100 ops/s, 500 connections | Atlas > Cluster > Metrics, Data Size | 350 MB | Delete old contact messages, check for runaway collections (rate limit docs need a TTL index) |
| Resend | 3,000 emails / month, 100 / day, 1 domain | resend.com > Emails, Usage | 70 / day, 2,000 / month | Tighten rate limit and Turnstile; messages still land in the admin inbox if sending pauses |
| Cloudflare Turnstile | Free, up to 20 widgets | Cloudflare dashboard > Turnstile | n/a | None expected |
| Upstash Redis (only if used) | 256 MB, 500K commands / month | Upstash console | 350K commands | Go back to the Mongo rate-limit collection |
| Sentry Developer (optional) | 1 user, 5K errors / month | Sentry > Settings > Usage Stats | 3,500 errors | Lower the sample rate, add `ignoreErrors`, fix the top noisy issue |
| UptimeRobot (optional) | 50 monitors, 5-minute checks, non-commercial | UptimeRobot dashboard | 40 monitors | Delete stale monitors |
| GitHub Actions | Free minutes on public repos; monthly allowance on private repos | GitHub > Settings > Billing > Usage | 70% of allowance | Cancel superseded runs (already set), trim Lighthouse runs, make the repo public if that is acceptable |
| Ably Free (only if `ABLY_API_KEY` is set; realtime, work plan 6.5/6.9) | 6M messages / month and 250K / hour, 500 messages / s per account; 200 concurrent connections, 200 concurrent channels, 200 presence members per channel; 50 publishes / s per channel, 50 messages / s in and out per connection; 60K token requests / hour | ably.com > your app > Stats (messages, peak connections, peak channels) | 4M messages / month, 150K in any hour, 150 peak connections | See "Ably: what eats the quota" below. First lever: remove the cursors (or the whole key) and redeploy |
| Domain | `*.vercel.app` or `*.is-a.dev` free; custom domain about $10-15 / year | Registrar | Renewal date | The only optional paid item. Skip it to stay at $0 |

Vercel Hobby is personal and non-commercial only (guide §9.3): no payments, no ads, no priced service packages.

Also from the Hobby plan page (https://vercel.com/docs/plans/hobby, checked 2026-10-12):

- 100 deployments per day (each push to a branch or PR is one preview deployment; warn at 70). Build machine 2 vCPU, 8 GB.
- 1,000,000 CDN requests and 10 GB Fast Origin Transfer a month, in addition to the 100 GB Fast Data Transfer.
- Speed Insights is 10,000 events over the last 30 days, shared across the team.
- Over a limit, you generally wait 30 days; Web Analytics collection resumes after 7 days.
- Deployment Protection: Vercel Authentication and one shareable link per account are free; Password Protection is Pro only. One external viewer per account for access requests.

## Ably: what eats the quota

Ably limits checked 2026-10-21 at https://ably.com/docs/platform/pricing/limits (Free package, no card, no time limit). Ably counts every message twice in effect: once when it is published and once per subscriber it is delivered to (fan-out). Presence enter/leave/update events are messages too, and attaching to a channel delivers its current presence set (one message per member). Over a rate limit Ably rejects or randomly drops messages; over a count limit (connections, channels) new ones are refused until others close. It emails you near a limit.

Realtime is off unless `ABLY_API_KEY` is set when the site is **built**: without it the site ships no realtime code and the routes answer 404. What each feature costs:

| Feature | Messages | Notes |
| --- | --- | --- |
| Connection (every tab that shows a realtime component) | 0 messages; 1 of 200 concurrent connections while the tab is visible | Opened only after the page is idle, closed when the tab is hidden, never on Save-Data. Token reused across tab switches; a new one (1 call to `/api/realtime/token`, a cheap function invocation) at most hourly |
| "N here now" (presence on `site-<scope>:visitors`) | Per visit with N tabs open: enter + leave, each delivered to N tabs, plus N on attach (≈ 3N). Entering/leaving Home adds an update (N) | 10 tabs open, 1,000 visits a day ≈ 30K/day ≈ 1M/month. Each hide/show of a tab is another leave + enter |
| 👏 reactions (`reactions-<scope>:<slug>`) | 1 per accepted POST (the server publishes the new total) + 1 per open copy of that case study | Every write goes through `/api/reactions/<slug>`: slug check + per-IP limit (20 requests / 10 min, 60 / day, up to 5 claps each) + MongoDB. Browsers can't publish here (subscribe-only token) |
| Live cursors on Home (`site-<scope>:cursors`) | **The big one.** N people on Home moving their mouse at rate r: N × r published + N × (N−1) × r delivered = N² × r per second | Capped in `components/shared/realtime/cursors.ts`: r = min(10/s, ⌊50 / N²⌋), so the channel stays ≤ 50 msg/s (= 180K/hour, under the 250K/hour cap) and paused at N ≥ 8. Sent only while the pointer moves inside the window, only with ≥ 1 other person on Home, fine pointers only, max 6,000 publishes per page view. Two people moving non-stop: 40 msg/s ≈ 144K/hour, so about 40 hours of that a month would use the whole 6M |

Trade-off (accepted, guide §10): cursor positions, plus each tab's own presence (enter, leave, the Home flag update), are the only messages browsers send without a server check, to keep them instant and free of function invocations. The token allows publish on the cursors channel and presence on the visitors channel only, expires within an hour and carries a random client id. A hostile script could ignore the client-side caps and send up to Ably's per-connection limit (50/s) on those two channels, and could fetch more tokens; it cannot publish reactions, change anyone else's presence, read history or use any other channel. If that ever happens (Ably stats show cursor spikes): remove `LiveCursors` from Home, or remove `ABLY_API_KEY` and redeploy, which turns all realtime off; then rotate the key in the Ably dashboard.

## Known per-request routes

Pages are static, but these routes still run a function per request. Each is accepted for now; check them first if Function invocations approach the warning level.

| Route | Why it is dynamic | Cost | If it grows |
| --- | --- | --- | --- |
| `/[...missing]` (every unmatched URL: typos, bot scans for `/wp-admin`, `/.env`, ...) | The catch-all calls `notFound()` so the 404 renders the active template's NotFound inside the `(site)` layout. A root `app/not-found.tsx` cannot do that, because each route group has its own root layout | 1 invocation per unmatched request (QA F-16). Scans of a few thousand URLs a month are under 1% of the 1M allowance | Move to `app/global-not-found.tsx` (Next's experimental `globalNotFound` flag), which is served without rendering. It bypasses the `(site)` layout, so it has to import the fonts, `globals.css` and template chrome itself; verify it against the Payload `(payload)` group before switching |
| `/work/<unknown slug>` | `generateStaticParams` prerenders the known case studies; other slugs render on demand (`dynamicParams` default) so case studies added in Payload appear without a rebuild | 1 invocation per unknown slug, then the 404 | Set `dynamicParams = false` if Payload revalidation makes on-demand slugs unnecessary |
| `/api/realtime/token` (only with `ABLY_API_KEY`) | Signs a fresh Ably TokenRequest (random client id), so it can't be cached | 1 invocation per realtime connection, at most hourly per open tab (tokens are reused across tab switches); local HMAC, no Ably or database call | Shorten nothing; if bots hammer it, add a Vercel Firewall rule (free) for the path |
| `/api/reactions/<slug>` (only with `ABLY_API_KEY` and a database) | GET: the total for one case study; POST: a clap batch (rate limit + `$inc` in MongoDB + one Ably publish) | GET is CDN-cached 10 s (`s-maxage=10`), so about 1 invocation per case study per 10 s of traffic. POST: 1 invocation + ~3 Atlas operations per batch, capped at 60 per visitor per day | Raise `s-maxage`; tighten `REACTION_RATE_LIMITS` in `lib/rate-limit.ts` |

## Monthly check (first Monday of the month, about 10 minutes)

- [ ] Vercel > Usage: transfer, functions, image transformations, Blob. Note the numbers below.
- [ ] Vercel > Analytics and Speed Insights: event counts against 50K / 10K.
- [ ] Atlas: data size and connection count.
- [ ] Resend: peak daily sends and monthly total.
- [ ] Sentry (if enabled): errors this month, top issue.
- [ ] Ably (if `ABLY_API_KEY` is set): messages this month and the busiest hour, peak connections and channels.
- [ ] UptimeRobot (if enabled): any downtime, response times.
- [ ] GitHub > Billing: Actions minutes used (private repo only).
- [ ] Latest Lighthouse CI run on `main` (Folio build, `SITE_TEMPLATE=folio`; audits `/`, `/work`, `/work/abroadly`, `/about`, `/contact`, 3 mobile runs each, median): performance >= 95, accessibility 100, LCP <= 2.0 s, CLS <= 0.05. Assertions are warn-only.
- [ ] Anything over its warning threshold: take the action in the table and record it.
- [ ] Re-read vendor pricing pages once a quarter; update this file if limits changed.

## Usage log

| Month | Vercel transfer | Image transforms | Function calls | Blob | Atlas | Resend peak / day | Analytics events | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10 | - | - | - | - | - | - | - | Not launched yet |
