# Environment variable registry

No variable is required yet: the current app builds and runs with none. The rest are planned and get added as their tasks land. Never commit values. Local values live in `.env.local` (ignored by git); the lead copies them into worktrees. Names starting with `NEXT_PUBLIC_` are inlined into the browser bundle, so never put secrets in them.

CI (GitHub Actions) currently needs no secrets. Lighthouse CI uses temporary public storage and needs no token.

| Variable | Purpose | Secret | Needed from | Local (`.env.local`) | GitHub secrets | Vercel | Set by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SITE_TEMPLATE` | Which template renders (`folio` by default) | No | Phase 1 | Optional | Not needed | Optional (Production, Preview) | Akash, or backend in code defaults |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap, OG images | No | Phase 1 | `http://localhost:3000` | Only if e2e or build needs it | Production = real URL; Preview = Vercel URL | Akash in Vercel; lead locally |
| `PAYLOAD_SECRET` | Payload session and token signing | Yes | Phase 2 | Yes (random 32+ chars) | Only if CI builds with Payload | Production and Preview, different values | Akash (generate with `openssl rand -hex 32`) |
| `DATABASE_URI` | MongoDB Atlas connection string | Yes | Phase 2 | Yes (dev database) | Only if CI needs a DB; prefer a mock | Production and Preview | Akash (Atlas user with least privilege) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads from admin | Yes | Phase 2 | Yes (from `vercel env pull`) | No | Auto-added when the Blob store is connected | Akash (connects the store in Vercel) |
| `RESEND_API_KEY` | Contact-form email | Yes | Phase 3 | Yes | No | Production and Preview | Akash |
| `CONTACT_TO_EMAIL` | Where contact notifications go | No (it is PII, keep out of the repo) | Phase 3 | Yes | No | Production and Preview | Akash |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget (public) | No | Phase 3 | Yes (Cloudflare test key) | No | Production and Preview | Akash |
| `TURNSTILE_SECRET_KEY` | Turnstile server verification | Yes | Phase 3 | Yes (Cloudflare test secret) | No | Production and Preview | Akash |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting (optional) | DSN is low-risk, treat as config | Phase 4, optional | Optional | No | Production | Akash, after creating a Sentry project |

## Rules

- Add a new variable here in the same change that starts reading it.
- Production values are set only by Akash in the Vercel dashboard (Settings > Environment Variables). Agents prepare the name and instructions, not the value.
- Use different `PAYLOAD_SECRET` and database users for Production and Preview.
- Error reporting must not include PII: scrub emails and message bodies from the contact form before events leave the server.
- Cloudflare publishes always-pass test keys for Turnstile; use those locally and in e2e.
