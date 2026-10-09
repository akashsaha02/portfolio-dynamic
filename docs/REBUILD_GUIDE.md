# Portfolio rebuild guide

How to rebuild this portfolio as **one mobile-first template, "Folio"**, modelled on dennissnellenberg.com and fused with what makes your profile different (shipped products, a paid engineering job, published research). Then add an admin dashboard, and later more templates and flashier effects.

Status: plan, nothing below is built yet. Researched 2026-10-10 against Next.js 16.3.7 and Payload 3.90.2.

---

## 0. Decisions at a glance

| Question | Decision |
| --- | --- |
| Style | dennissnellenberg.com structure and restraint, in your identity (paper / ink / lime, Mona Sans, cutout portrait) |
| Scope of v1 | **One template, `folio`**, five pages: Home, Work, Case study, About, Contact (Contact can be a section at first) |
| Device priority | Phone first (360×740), then tablet (768), then desktop (1024+) |
| Motion | GSAP + ScrollTrigger + Lenis (already installed). No Framer Motion, Locomotive, jQuery or Barba |
| Admin | Payload CMS 3 inside this app (`/admin`), MongoDB Atlas, after the template is done |
| Cost | **$0/month.** Every tool and service is free or on a free tier (§9). A custom domain is the only optional paid item |
| Realtime / sockets | Not needed for v1. Optional later feature with a free provider (§10) |
| Later | More templates, flashier effects (§12). The template system is designed now, built when a second template exists |

**Do this first:** nothing after "Initial commit from Create Next App" is committed. Commit the current site and tag it `v1-editorial` so it can come back later as an archived template.

---

## 1. Where we are

| Area | Today |
| --- | --- |
| Framework | Next.js 16.3.7 App Router, React 19.2, React Compiler on, `cacheComponents` off, Tailwind v4 |
| Content | Hard-coded in `lib/content.ts` (profile, experience, projects incl. Abroadly + Nook, publications, toolkit, education) |
| Pages | One route, `app/page.tsx` → `components/hero`, `components/sections/*` |
| Motion | GSAP + ScrollTrigger (About word reveal), Lenis, CSS keyframes. 3D hero already removed |
| Look | Paper `#ebeee0`, ink `#282c20`, lime `#d2ff00`; Mona Sans condensed uppercase; cutout portrait (`public/portrait.webp`) |

---

## 2. Research

### 2.1 dennissnellenberg.com, verified from its live HTML and CSS

Stack under the hood: jQuery, GSAP 3.9 + ScrollTrigger, Locomotive Scroll, Barba.js page transitions, vanilla-lazyload. One custom typeface ("Dennis Sans"). 28 Awwwards Sites of the Day.

**Design tokens (from `styleguide.css`)**

| Token | Value | Note |
| --- | --- | --- |
| Colors | dark `#1C1D20`, darker `#141517`, white, accent blue `#455CE9`, gray `#999D9E`, light gray `#E9EAEB` | Two neutrals and **one** accent, used only on hover fills and small dots |
| Borders | `rgba(28,29,32,.175)` hairlines | Rows separated by 1px lines, no cards on desktop |
| Easing | `cubic-bezier(.7,0,.3,1)` at .3 / .5 / .7 / .9s | One easing curve for everything |
| Section padding | `clamp(5em, 21vh, 12em)`, mobile `max(2.5em, 12vh)` | Very generous vertical space |
| Side padding | `clamp(2.5em, 8vw, 8em)`, mobile `clamp(1.25em, 4vw, 2.5em)` | |
| Breakpoints | 1024, 720, 540 (max-width) | |

**Home, section by section**

| # | Section (class) | Desktop | Mobile (≤720 / ≤540) |
| --- | --- | --- | --- |
| 1 | Preloader (`loading-screen`) | "Hello" cycling through 9 languages with a dot, then the screen lifts with a curved bottom edge | Same, dot repositioned |
| 2 | Nav (`nav-bar`) | "© Code by Dennis Snellenberg" (text rolls on hover), Work / About / Contact with a dot under the active link | **Only "Menu"** shown |
| 3 | Fixed menu (`fixed-nav`) | After the hero, a round magnetic burger appears; opens a dark panel from the right with a curved left edge: big links, socials | Panel is full width, full height |
| 4 | Hero (`home-header`) | Full-bleed portrait, **giant name "Dennis Snellenberg —" as an infinite horizontal marquee** (direction follows scroll), "Located in the Netherlands" pill with spinning globe on the left, "↘ Freelance Designer & Developer" on the right | Hero 110vh, photo fills, name marquee sits 33vh from bottom, role text left-aligned above it |
| 5 | Intro (`home-intro`) | Two-sentence statement revealed line by line + small side paragraph + **big round magnetic "About me" button** with parallax | Stacked; round button pinned bottom-right |
| 6 | Recent work (`work-grid`) | **List rows**: project name (large) · services. Hovering shows a floating image modal that follows the cursor with a round "View" cursor; other rows dim | **Cursor modal hidden; switches to image tiles** (`work-tiles`): image, name, services, year |
| 7 | "More work (11)" | Round/pill button centered | Same |
| 8 | Sliding images (`horizontal-items`) | Two rows of project images moving in opposite directions as you scroll | **Static**, two columns, offset rows, transforms reset |
| 9 | Footer (`footer`) | Curved top edge (rounded div) rising from the previous section; avatar + "Let's work together"; **big round "Get in touch"** button; email + phone pill buttons; bottom row: "Version 2022 © Edition", "Local time 09:41 PM CET", socials | Curve 7.5vh; pill buttons stacked **full width** |

**Other pages:** Work index (filters All / Design / Development, list ↔ grid toggle, columns Client · Location · Services · Year, archive of 66 older items), About (services as 01 / 02 / 03, Awwwards jury credibility block, "Let's work together"), Contact (numbered conversational form, details column), Case study (intro row: Role/Services · Credits · Location & Year, full-width images, device mockups for laptop/phone screenshots, "Next case" footer with a tile image).

**Buttons:** pill or circle; on hover an oversized ellipse (`width:150%; height:200%; border-radius:50%`) **rises from the bottom** to fill it with the accent, text rolls up and is replaced by a copy. Magnetic pull on desktop.

**What makes it work:** a few strong ideas repeated consistently (one easing, one accent, one button style, hairline rows), very generous whitespace, and real alternatives for touch, not shrunken desktop effects.

### 2.2 Other references (what we borrow)

| Site | Borrow for v1 | Borrow later |
| --- | --- | --- |
| [olivierlarose.com](https://olivierlarose.com) and his [tutorials](https://blog.olivierlarose.com/tutorials) | His tutorials rebuild Dennis's site in Next.js (nav → burger after 100vh, infinite name text, word reveal, project hover modal, sliding images, magnetic buttons, preloader with SVG curve). **Use as implementation reference, but they are desktop-only:** add the touch fallbacks in §4 | Curved menu, sticky footer reveal |
| [brittanychiang.com](https://brittanychiang.com) | Clear Experience list (dates · company · role · tags), project archive table | "Time travel" to old site versions |
| [paco.me](https://paco.me) | A "Now" line (what you're building this month) | ⌘K command menu |
| [rauno.me](https://rauno.me) | Copy-email button | Craft/experiments page, year archives |
| [chanhdai.com](https://chanhdai.com) | Recognition section (awards, publications) as credibility block, like Dennis's Awwwards block | Theme toggle, component lab |
| [lynnandtonic.com](https://lynnandtonic.com) | — | Redesign as new templates, keep old ones browsable (19 versions) |

---

## 3. The fusion: "Folio" design language

Dennis's **structure and restraint** + your **identity** + content Dennis doesn't need (experience, research).

| Element | Dennis | Folio |
| --- | --- | --- |
| Palette | dark / white / blue accent | **paper `#ebeee0` / ink `#282c20` / lime `#d2ff00`** (keep). Lime only for hover fills, the active dot and one word per heading. Ink sections for Work and Footer |
| Type | One grotesk, sentence case | **Mona Sans** (already loaded). Sentence case at normal width (`wdth` 100) for headings and body, like Dennis. Condensed uppercase (`wdth` 75) **only** for the hero name marquee: your signature carried over |
| Hero | Full-bleed photo + name marquee | Cutout portrait on paper + **"Akash Saha —" marquee** across it + "Based in Dhaka" globe pill + "↘ Full-stack developer & ML researcher" |
| Preloader greeting | 9 languages | Hello · স্বাগতম · नमस्ते · Bonjour · Hola · こんにちは · Hallo (Bangla first after English: Dhaka; Hindi: studied in India). First visit per session only |
| Credibility block | Awwwards jury | **IEEE CONIT 2025 publication + Nyntax + B.Tech 8.92/10** |
| Services 01/02/03 | Design / Development / Full package | **01 Full-stack products** (MERN, Next.js, payments, multi-tenant) · **02 Interfaces** (React, motion, accessibility) · **03 Machine learning** (CNNs, transfer learning, CV) |
| Footer | Version · local time · socials | "Version 2026 © Edition" · **Local time Dhaka** (live, `Asia/Dhaka`) · GitHub / LinkedIn / Scholar |
| Easing | `cubic-bezier(.7,0,.3,1)` | Same, as `--ease-inout`; keep the existing `--ease-out-expo` for reveals |

**Tokens to add to `globals.css`**

```css
:root {
  --ease-inout: cubic-bezier(.7, 0, .3, 1);
  --dur-fast: .3s; --dur: .5s; --dur-smooth: .7s; --dur-slow: .9s;
  --section-y: max(2.5rem, 12svh);            /* phone */
  --gutter: clamp(1.25rem, 4vw, 2.5rem);      /* phone */
  --hairline: rgb(40 44 32 / .18);
  --hairline-on-ink: rgb(244 244 237 / .2);
}
@media (min-width: 768px) {
  :root {
    --section-y: clamp(5rem, 21svh, 12rem);
    --gutter: clamp(2.5rem, 8vw, 8rem);
  }
}
```

---

## 4. Template v1 "Folio": page-by-page spec

Each block lists **phone first**, then what changes at `md`/`lg`. "Fine pointer" = `@media (hover: hover) and (pointer: fine)`; gate every cursor effect on that, **not on screen width** (an iPad at 1024px has no cursor; a small laptop window does). Tailwind v4's `hover:` variant already only applies on hover-capable devices.

### 4.1 Global shell

| Component | Phone | md / lg |
| --- | --- | --- |
| **Preloader** | Ink screen, greeting words swap every ~150ms (first word holds longer), then the screen lifts with a curved bottom edge (SVG path tween). Total ≤ 1.6s. Tap to skip. Runs once per session (`sessionStorage`, wrapped in try/catch). Skipped entirely with reduced motion. Page content renders underneath immediately; the preloader is a CSS/inline-script overlay, not a hydration gate | Same |
| **Top bar** | "© Code by Akash" left, **"Menu" only** right. Height ≥ 44px tap targets, `env(safe-area-inset-top)` | Work · About · Contact links with lime dot under the active one; logo text rolls on hover |
| **Fixed burger** | Round ink button (56px) appears top-right once the hero leaves the viewport (ScrollTrigger) | Same, magnetic on fine pointer |
| **Menu panel** | Full-screen ink panel slides in from the right (`translateX`, `--ease-inout`, .7s); big links (Home, Work, About, Contact), socials, email. Focus trapped, `Esc` closes, body scroll locked (Lenis `stop()`), `aria-expanded` on the burger | Panel ~40vw, curved left edge (SVG path morph), backdrop dims page |
| **Buttons** | Pill (h-12+) and circle variants. Tap: scale .96. No magnet | Fill ellipse rises from bottom on hover; label rolls; magnetic within ~1.4× size (GSAP `quickTo`) |
| **Page transitions** | React `<ViewTransition>` crossfade (see `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) | Same; curtain with page name is a "later" item |
| **Smooth scroll** | **Native** scroll on touch (Lenis leaves touch alone by default; keep `syncTouch` off) | Lenis on |

### 4.2 Home

| # | Section | Phone (default) | md / lg |
| --- | --- | --- | --- |
| 1 | **Hero** | `100svh` (min 34rem). Cutout portrait anchored bottom-centre. **Name marquee** "Akash Saha —" at `~28svh` from bottom, font-size ~`28vw`, uppercase condensed, two copies for a seamless loop; constant slow drift, direction follows last scroll direction. Above it, left-aligned: "↘ Full-stack developer & ML researcher". Availability badge (small lime dot + "Open to full-stack roles") under it. Paper gradient behind text for contrast | Marquee font ~`17vw`, sits lower; "Based in Dhaka, Bangladesh" pill with spinning globe hangs from the left edge; role text moves to the right. Portrait larger |
| 2 | **Intro** | Statement (2 sentences, e.g. "I build products end to end, from the database schema to the screen people tap.") at ~`1.75rem`, revealed line by line on scroll. Small paragraph below. Round "About me" button (120px) bottom-right | 2 columns (8/4), statement ~`3rem`, round button 160px with parallax |
| 3 | **Recent work** (ink section) | **Tiles**, one per row: screenshot (16:10, rounded 1rem) → name → kind · year. Tap opens case study. 4 projects max (Abroadly, Nook, SoulMatch, Cerebral Insights) | md: 2-column tiles. **lg + fine pointer: list rows** (name large · kind · year, hairlines), hover dims other rows, **cursor-following image modal** with round "View" label (GSAP `quickTo`, durations .8 / .5 / .45s, scale-in with `--ease-inout`). Hidden from assistive tech; rows are real links |
| 4 | "More work (5)" | Full-width pill button | Centred pill |
| 5 | **Experience** | Rows: `Nov 2025 – now` (small) → **Nyntax** → MERN developer. Details (bullet points) in `<details>` so the list stays short; first one open | Brittany-style grid: dates (2 cols) · company + role + points + tags (6 cols). All open |
| 6 | **Research** (credibility) | Publication card: status chip (Published / Submitted), title, venue, year, "DOI ↗", "Copy BibTeX". Below: "B.Tech CSE · 8.92/10 · KIIT" line | Two columns: label left, entries right |
| 7 | **Footer / contact** (ink) | Curved top edge (`7svh` ellipse) rising from paper. Small round avatar + "Let's work together". Big round "Get in touch" button (→ /contact or form). **Email and phone as full-width stacked pills**, email has copy-on-tap. Bottom: Version 2026 © Edition · Local time (Dhaka, live) · socials. Respect `safe-area-inset-bottom` | Curve `12svh`; heading ~`7vw`; pills side by side; magnetic round button on a hairline |

Sliding image rows (Dennis §8) are **v1.1**: cheap, but they need 6–8 good screenshots first. On phone they are static two-column rows, as on Dennis's site.

### 4.3 Work index `/work`

| Phone | md / lg |
| --- | --- |
| Filter chips: All · Full-stack · Machine learning (buttons with `aria-pressed`, URL `?type=`). Tiles as on Home, all projects | Filters + **list ↔ grid toggle** (lg, fine pointer). List columns: Project · Kind · Stack · Year. Grid: 2 columns of tiles |

### 4.4 Case study `/work/[slug]`

Only projects that have case-study content get a page; the rest link straight to the live site.

| Block | Phone | md / lg |
| --- | --- | --- |
| Title | Project name (large, sentence case), one-line kind | Same, bigger |
| Facts row | Stacked: Role · Stack · Year · Links (Live ↗, Code ↗) separated by hairlines | 4 columns |
| Hero image | Full-bleed desktop screenshot | In a laptop frame (CSS frame, no image mockup needed) |
| Story | Problem → What I built → How it works (architecture diagram as SVG) → Outcome. Short paragraphs, `max-w-[60ch]` | Text column 7/12 with sticky section labels |
| Phone shots | Swipeable row (CSS scroll-snap, no JS) of phone screenshots | Two or three phones side by side |
| Next case | Big "Next project → Nook" with tile image | Image follows cursor on fine pointer |

Content needed now: Abroadly and Nook (you have desktop + phone screenshots for Abroadly, desktop for Nook). Take phone screenshots of Nook too.

### 4.5 About `/about`

Phone: statement → portrait (4:5) → **01 / 02 / 03 services** (title, 2-sentence description, hairline between) → Toolkit (2-column list) → Education → "Now" line → footer. md/lg: statement + portrait side by side; services in 3 columns; toolkit 4 columns.

### 4.6 Contact `/contact` (or the footer section until the page exists)

Conversational numbered form like Dennis: **01 What's your name? · 02 What's your email? · 03 What are you looking for? (Full-time role / Freelance / Research) · 04 Your message**. Large borderless inputs with hairline underline, proper `<label>`s, `autocomplete` and `inputmode` set, error messages under fields. Details column: email (copy), LinkedIn, GitHub, location + local time. Server Action → Resend email (+ admin inbox once Payload exists), honeypot field + Cloudflare Turnstile (free), rate limit, `useActionState` for pending/success.

---

## 5. Mobile-first rules (non-negotiable)

1. **Write base styles for 360px**, then add `sm:`/`md:`/`lg:`. Never write desktop styles and patch them down.
2. **Test widths:** 320, 360, 390, 414, 768 (portrait tablet), 1024 (tablet landscape, touch), 1280, 1440. Plus 740×360 landscape phone.
3. **No horizontal scroll at 320px.** Marquees and sliders live in `overflow-x: clip` containers; check with `document.documentElement.scrollWidth === innerWidth`.
4. **Viewport units:** `svh` for hero heights (no layout jump when the URL bar hides), `dvh` only for the open menu panel. No `--vh` JS hacks.
5. **Safe areas:** `env(safe-area-inset-*)` on the top bar, burger, menu panel and footer bottom row.
6. **Touch targets** ≥ 44×44px with ≥ 8px between; inputs ≥ 16px font (prevents iOS zoom).
7. **Hover is an enhancement.** Every hover-only reveal (cursor modal, row dim, magnet, text roll) has a touch equivalent or is pure decoration. Gate JS effects with `matchMedia("(hover: hover) and (pointer: fine)")`.
8. **Fluid type with `clamp()`**, line length 45–75ch, `text-wrap: balance` on headings (already global), `pretty` on paragraphs.
9. **Images:** `next/image` with honest `sizes` (phone tiles `100vw`, md `50vw`); hero portrait `preload`; everything else lazy. Screenshots ≤ 120 KB WebP/AVIF.
10. **Reduced motion:** marquee stops (static name), no preloader, reveals become instant, view transitions become crossfades. Already have a global CSS kill-switch; JS effects must check too.
11. **Performance budget (phone, Moto G-class, 4G):** LCP ≤ 2.0s, CLS ≤ 0.05, INP ≤ 200ms, home JS ≤ 120 KB gzipped. Lighthouse mobile ≥ 95 performance, 100 accessibility.
12. **Keyboard + screen reader:** skip link (exists), visible focus, menu panel focus trap, decorative motion `aria-hidden`, marquee name duplicated copy `aria-hidden` with the real `<h1>` sr-only.

---

## 6. Motion system

One file per primitive under `templates/folio/motion/`, each a tiny client component or hook that does nothing on the server and cleans up with `gsap.context()` / `useGSAP`.

| Primitive | Library | Fine pointer only? | Reduced motion |
| --- | --- | --- | --- |
| `Magnetic` (wrapper) | GSAP `quickTo` x/y, elastic return | Yes | Off |
| `FillButton` (CSS) | CSS transitions on `::before` ellipse + text roll | Hover yes, tap scale everywhere | Instant colour change |
| `NameMarquee` | GSAP ticker; `xPercent` loop; direction from ScrollTrigger `self.direction` | No | Static |
| `RevealLines` / `RevealWords` | ScrollTrigger, `yPercent` from 100 in clipped spans | No | Instant |
| `ProjectHoverModal` | GSAP `quickTo` for modal / cursor / label | Yes (else not mounted) | Not mounted |
| `Parallax` | ScrollTrigger scrub, small ranges (≤ 10%) | No (but halve on phone) | Off |
| `CurvedEdge` | SVG path `d` tween (preloader, footer, menu) | No | Static curve |
| `Preloader` | GSAP timeline | No | Skipped |
| `LocalTime` | `Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })`, updates each minute | — | — |

Rules: one easing family (`--ease-inout` / `power3.inOut` ≈ Dennis), durations from the tokens, animate only `transform`, `opacity`, `clip-path`; no layout properties. Remove `components/SmoothScroll.tsx` from the root layout and mount it inside the template, so future templates without Lenis don't ship it.

---

## 7. Admin dashboard (Phase 2)

### Why Payload 3

Admin UI generated from config (auth, uploads, drafts, versions, live preview, access control), installs into this app at `/admin`. Verified: `@payloadcms/next@3.90.2` peer-depends on `next >=16.3.3 <17` (you're on 16.3.7); needs Node ≥ 20.18.1 (you have 22) and an ESM Next config. A custom admin (Better Auth + Prisma, like Nook) is 3–5× the work; choose it only if the admin itself should be a portfolio piece.

**Database:** MongoDB Atlas free cluster via `@payloadcms/db-mongodb` (you know Mongo; no migrations while the schema is young). **Media:** `@payloadcms/storage-vercel-blob` (1 GB free on Hobby). Payload is MIT-licensed and self-hosted inside this app, so there is no Payload Cloud bill. Free-tier limits and risks are in §9.

### Content model

| Type | Name | Fields |
| --- | --- | --- |
| Global | `profile` | name, role, location, timezone, email, phone (optional), intro statement, about, portrait, avatar, greetings[] (text, lang), services[] (number, title, body), socials[], resume PDF, availability (`open` / `limited` / `closed`) + label, now (text + date) |
| Global | `site-settings` | activeTemplate (only `folio` for now), version label ("2026 © Edition"), SEO defaults, OG fallback image, announcement (text, link, on/off), contact form on/off |
| Collection | `projects` | name, slug, kind, type (`fullstack` / `ml`), year, featured, order, summary, stack (→ skills), url, repo, cover, phone shots[], case study (role, problem, built, how, outcome, diagram), next project override. Drafts + versions |
| Collection | `experience` | company, url, title, place, start, end, points[], skills (→ skills) |
| Collection | `publications` | title, venue, year, status, doi, summary, bibtex |
| Collection | `skills` | name, group, show in toolkit |
| Collection | `education` | degree, place, period, detail |
| Collection | `messages` | name, email, intent, body, read, createdAt. Created only by the contact Server Action |
| Collection | `media` | upload + **required alt** |
| Collection | `users` | one admin, no public sign-up |

**Admin experience:** dashboard widgets (unread messages, availability toggle, quick links), drag-to-reorder projects and experience (Payload `orderable` if your version has it, else an `order` field), live preview with `RefreshRouteOnSave` (server-side, templates stay Server Components), `afterChange`/`afterDelete` hooks call `revalidateTag('<collection>', 'max')` so edits are live on the next request without a redeploy. Check the admin on your phone: Payload's admin is responsive, but test the rich-text editor and uploads there.

---

## 8. Architecture

```
app/
  (site)/
    layout.tsx               # html/body, fonts, skip link
    page.tsx                 # getSiteContent() → <ActiveTemplate page="home" />
    work/page.tsx
    work/[slug]/page.tsx     # generateStaticParams from projects with case studies
    about/page.tsx
    contact/page.tsx
    resume/route.ts
    opengraph-image.tsx  sitemap.ts  robots.ts
  (payload)/                 # Phase 2, from Payload's blank template
templates/
  types.ts                   # TemplateProps, TemplateMeta
  registry.ts                # { folio: { meta, load: () => import('./folio') } }
  folio/
    pages/  Home.tsx Work.tsx CaseStudy.tsx About.tsx Contact.tsx
    sections/  Hero.tsx Intro.tsx RecentWork.tsx Experience.tsx Research.tsx Footer.tsx
    ui/  FillButton.tsx RoundButton.tsx Tile.tsx Row.tsx Chip.tsx MenuPanel.tsx
    motion/  (see §6)
    styles.css  fonts.ts  thumbnail.webp
components/shared/          # ContactForm (Server Action), JsonLd, LocalTime, CopyButton
lib/
  content-types.ts           # SiteContent: the template contract
  data.ts                    # getSiteContent(): static data now, Payload Local API later
  content.ts                 # today's data, becomes the Payload seed
```

- Templates receive `SiteContent` via props and never import data directly. `lib/data.ts` maps raw data (now `lib/content.ts`, later Payload) to `SiteContent`, so swapping the source never touches the template.
- With one template, the registry is a one-liner; keep it so a second template is additive.
- Before writing code, read the Next 16 docs in `node_modules/next/dist/docs/01-app/`: `01-getting-started/08-caching.md`, `09-revalidating.md`, `16-proxy.md` (Middleware is now Proxy), `02-guides/view-transitions.md`, `02-guides/forms.md`, `02-guides/draft-mode.md`.
- Caching: `getSiteContent()` uses `'use cache'` + `cacheLife('max')` + `cacheTag(...)` once Payload is in. **Spike `cacheComponents: true` with the Payload admin in Phase 2**; if it breaks, use the previous model (`02-guides/caching-without-cache-components.md`). Never read `cookies()`/`headers()` inside `'use cache'`.

---

## 9. Free stack ($0/month)

Every library is open source and every service has a permanent free tier with no credit card. Limits checked 2026-10-10; re-check before launch.

### 9.1 Libraries (free, open source)

| Tool | License / cost | Note |
| --- | --- | --- |
| Next.js, React, Tailwind CSS | MIT | — |
| Payload CMS 3 (+ Lexical editor, Mongo adapter, Vercel Blob adapter) | MIT, self-hosted | Admin runs inside this app; no Payload Cloud needed |
| GSAP + all plugins (ScrollTrigger, **SplitText**, etc.) | Free for everyone, including commercial use, since Webflow's acquisition | Use SplitText for the line/word reveals in §6 instead of hand-splitting |
| Lenis | MIT | — |
| Mona Sans via `next/font/google` | SIL Open Font License | Self-hosted at build time, no runtime Google request |
| Socket.IO / `ws` (only if §10 is built) | MIT | — |

### 9.2 Services

| Need | Service (free tier) | Free limit | What happens at the limit | Mitigation |
| --- | --- | --- | --- | --- |
| Hosting, CDN, functions | **Vercel Hobby** | 100 GB data transfer, 1M function invocations, 4 h active CPU, 360 GB-hrs memory / month; 300s max function duration | Feature pauses until the next cycle; you are never billed | Pages are static and cached, so functions only run for admin, contact form and revalidation |
| Image optimisation | Vercel Hobby | **5,000 transformations / month**, 300K cache reads | Optimisation stops for the month | Pre-size screenshots with `sharp` (script like `scripts/cutout.mjs`), set `images.qualities: [75]` and trimmed `deviceSizes` in `next.config.ts`, long `minimumCacheTTL`. Fallback: Cloudinary free (25 credits / month; 1 credit = 1K transformations or 1 GB) |
| Media storage (admin uploads) | **Vercel Blob** | 1 GB storage, 2,000 advanced operations / month | Blob access blocked for 30 days | Upload WebP ≤ 200 KB; a portfolio needs ≪ 1 GB |
| Database | **MongoDB Atlas free cluster** | 512 MB incl. indexes, 100 ops/s, 500 connections; never expires | Writes fail above 512 MB | Content is tiny; reuse one Mongoose connection (Payload does). Avoid Supabase free for this: inactive free projects get paused |
| Email (contact form) | **Resend** | 3,000 / month, **100 / day**, 1 verified domain | Sending pauses | Without your own domain, send from `onboarding@resend.dev` to your own account email, which is all a contact-form notification needs. Messages are always saved in the admin inbox too, so nothing is lost if email pauses |
| Spam protection | **Cloudflare Turnstile** | Free, unlimited challenges, up to 20 widgets | — | Works on Vercel; no Cloudflare hosting needed. Plus a honeypot field |
| Rate limiting | Your Mongo DB (a `rateLimits` collection) or **Upstash Redis** | Upstash: 256 MB, 500K commands / month | Upstash: requests fail | Start with Mongo (no extra service); Upstash only if §10 needs Redis |
| Analytics | **Vercel Web Analytics** | 50,000 events / month, 1-month window | Collection pauses after a 3-day grace period | Page views only; no custom events on Hobby |
| Domain | `akashsaha.vercel.app`, or **is-a.dev** (`akash.is-a.dev`, free via GitHub pull request) | — | — | A `.dev`/`.com` costs ~$10–15/year: the only optional paid item |
| CI | GitHub Actions | Free minutes on public repos; monthly free minutes on private repos | — | Run lint + typecheck + build on PRs |

### 9.3 Vercel Hobby "non-commercial" rule

Hobby is for **personal, non-commercial use**. Vercel counts as commercial: taking payments, advertising products or services for sale, ads, or being paid to build the site. A portfolio that shows your work and helps you get hired is the standard Hobby use case. **Keep it that way:** no pricing or "hire me for $X" packages, no payments, no ads. If you later sell freelance services from the site, move to **Netlify's free plan** (allows commercial use; 300 credits / month ≈ 30 GB bandwidth or ~20 builds) or upgrade to Vercel Pro. Hobby also cannot deploy repos owned by a GitHub organization; keep the repo on your personal account (`akashsaha02`).

---

## 10. Realtime / sockets (optional, after v1)

### Can you use sockets for free?

**Yes.** Since June 2026, Vercel Functions accept WebSocket connections (public beta, **all plans including Hobby**). Socket.IO works if the client uses `transports: ['websocket']`. In Next.js you open a socket from a route handler with `experimental_upgradeWebSocket()` from `@vercel/functions`.

Caveats on Vercel Hobby, from Vercel's docs:

- **Connections close after 300s** (the Hobby max duration). The client must reconnect and resubscribe.
- **No shared memory between instances.** Each connection is pinned to one function instance, and reconnects may land on another, so rooms, presence and broadcast need an external store (Redis pub/sub, e.g. Upstash free).
- **It costs the free allowance while sockets are open.** You pay (from the free quota) for provisioned memory the whole time an instance holds connections, and Hobby instances are fixed at 2 GB. 360 GB-hrs ≈ 180 instance-hours per month, so one instance kept awake 24/7 by open tabs (≈ 720 h) would exhaust it. Fine for the admin; **risky for a socket opened on every public page.**

### Free options compared

| Option | Free tier | Sleeps? | Fits |
| --- | --- | --- | --- |
| **Ably** (managed pub/sub, no server) | 200 concurrent connections, 6M messages / month | No | **Recommended for public features.** A Next.js route handler issues short-lived tokens; the browser talks to Ably directly. No socket server to host or keep warm |
| Pusher Channels Sandbox | 100 concurrent connections, 200K messages / day | No | Same model as Ably, lower limits |
| Cloudflare Durable Objects (Workers Free) | 100K requests / day (20 incoming WebSocket messages = 1 request; outgoing free), 5 GB storage | No | Best raw free capacity, but a second platform to learn and deploy |
| Socket.IO on **Render free** (like your Abroadly API) | 750 instance-hours / month per workspace | **Yes, after 15 min without traffic; the first visitor waits for a cold start** | Good to show "Socket.IO" on your CV; acceptable only for decorative features. Shares the 750 h with your other Render free services |
| Socket.IO on Vercel (beta) | Your Hobby quota (above) + Upstash Redis free for pub/sub | No, but 300s reconnects | Admin-only features |

### Features where realtime actually helps

| Feature | Where | Realtime needed? | Recommendation |
| --- | --- | --- | --- |
| "New message" toast in the admin while it's open | Admin | Nice, not required | **Phase 2: no socket.** Poll unread count every 30s while the dashboard tab is visible, plus a Resend email |
| Live visitor count ("3 people here now") | Footer / top bar | Yes | Later, Ably presence. Small, honest, works on mobile |
| Live reactions (tap 👏 on a project, everyone sees the count rise) | Case-study pages | Yes | Later, Ably; persist totals in Mongo so the count survives |
| Figma-style live cursors of other visitors | Home, desktop only | Yes | "Flashy later" (§12); fine pointer only, throttle to ~20 updates/s, hidden on touch |
| "Currently: building X / listening to Y" status you update from your phone | Hero / footer | No | Plain admin field + `revalidateTag`; no socket needed |
| Live chat with you | — | Yes | **Skip.** You won't be online 24/7, and the contact form converts better |

### Mobile rules for any realtime feature

Connect only after the page is interactive and idle (`requestIdleCallback`), only while the tab is visible (`visibilitychange`: disconnect on `hidden`), never on Save-Data (`navigator.connection?.saveData`), and keep the page fully usable without it. Realtime is decoration; the site must not wait for it.

---

## 11. Phases

Each phase ends with a QA gate. Review on a real phone at the end of every phase.

**Who does what:** the phases are split into waves and tasks for five agents (`folio-design`, `backend`, `tester`, `qa`, `monitoring` in `.claude/agents/`) in [WORK_PLAN.md](WORK_PLAN.md).

**Agent skills** (project-level in `.claude/skills/`, pinned in `skills-lock.json`; restore with `npx skills experimental_install`). Load the listed skills before working on each phase:

| Phase | Skills |
| --- | --- |
| 1 Build UI | `frontend-ui-engineering`, `vercel-react-best-practices`, `vercel-composition-patterns`, `gsap-react`, `gsap-core`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-plugins` (SplitText), `gsap-utils`, `vercel-react-view-transitions`, `12-principles-of-animation`, `interaction-design` |
| 2–3 Backend + connect | `payload` (official), `vercel-react-best-practices` |
| 4–5 Test, refine | `gsap-performance`, `web-design-guidelines`, `rams` (accessibility), `better-ui`, `improve-animations` |
| Deploy | `deploy-to-vercel` (preview by default; link the GitHub repo for push-to-deploy) |

| Phase | Goal | Gate |
| --- | --- | --- |
| **0 Setup** | Commit + tag `v1-editorial`; the UI ↔ backend contract (`SiteContent`, `submitContact` stub); CI; test harness; assets | Contract reviewed, CI green |
| **1 Build UI** | Every Folio page (§4), phone first, on static content from `lib/content.ts`; preview deploys | Design matches §4–§6 at every width; Akash approves on his phone |
| **2 Build backend** | Payload admin (§7), seed, real contact action, route handlers, SEO, telemetry, all on its own | Security review; admin usable on a phone |
| **3 Connect** | Site reads Payload, revalidation, real contact form, live preview, preview env | Edit in admin → live; contact → inbox + email |
| **4 Test** | Full unit + e2e (4 viewports) + admin e2e; CI enforces tests + Lighthouse budgets; fix all findings | All green, QA PASS |
| **5 Refine + launch** | Polish (§6), performance, content pass, real devices, production deploy, uptime, runbook | Launch gate PASS |
| **6 Features** | §12 items one at a time, each as a mini UI → backend → connect → test → refine cycle | QA per feature |

Task-level detail (IDs, owners, dependencies, "done when", merge order) is in [WORK_PLAN.md](WORK_PLAN.md).

---

## 12. Later: flashier things and more templates

Add only after v1 is live and stable; each must keep the §5 budgets.

| Idea | From |
| --- | --- |
| Page-transition curtain with page name | Dennis (Barba), via view transitions |
| Version archive `/v/<template>`, link "Older versions of this site" in the footer | Lynn Fisher, Brittany Chiang, Rauno |
| Template switcher in admin + preview before activating (design already in §8) | — |
| Second template "Index" (two-column, recruiter-first) and "Notebook" (research-first) | Brittany Chiang |
| ⌘K command menu | Paco Coursey |
| Annotations toggle ("how this was built" notes) | Maria Vasilyeva |
| Craft / lab page with an in-browser ML demo (e.g. tomato-leaf classifier, TF.js) | Rauno, chanhdai |
| Image distortion / WebGL hover on project tiles (desktop only) | Awwwards trends |
| Analytics widget in admin | — |
| Live visitor count, live reactions, live cursors (§10) | Ably free |

---

## 13. Open decisions

| Decision | Default | Change if… |
| --- | --- | --- |
| Accent | Keep lime on paper/ink | you want Dennis's look more literally → swap tokens to dark `#1C1D20` + white + one accent; the template only reads tokens |
| Hero photo | Current cutout on paper | you shoot a new full-bleed portrait (Dennis-style, plain grey backdrop, shoulders up, lots of headroom) |
| Phone number in footer | Off | you want it public |
| CMS | Payload 3 + MongoDB | admin as a showcase → custom Better Auth + Prisma |
| `cacheComponents` | On if the Phase 2 spike passes | Payload admin breaks with it |
| Hosting | Vercel Hobby (free) | you sell services or take payments on the site → Netlify free or Vercel Pro (§9.3) |
| Domain | Free `*.vercel.app` or `*.is-a.dev` | you want `akashsaha.dev` (~$10–15/year) |
| Realtime provider | Ably free | you want Socket.IO on your CV → Render free (cold starts) or Vercel beta (admin-only) |

---

Sources: [dennissnellenberg.com](https://dennissnellenberg.com) (home, [/work](https://dennissnellenberg.com/work), [/about](https://dennissnellenberg.com/about), live HTML/CSS) · [Olivier Larose: Awwwards landing page tutorial](https://blog.olivierlarose.com/tutorials/awwwards-landing-page) · [project gallery hover tutorial](https://blog.olivierlarose.com/tutorials/project-gallery-mouse-hover) · [olivierlarose.com](https://olivierlarose.com) · [brittanychiang.com](https://brittanychiang.com) · [paco.me](https://paco.me) · [rauno.me](https://rauno.me) · [chanhdai.com](https://chanhdai.com) · [lynnandtonic.com](https://lynnandtonic.com) · [mariavasilyeva.com](https://mariavasilyeva.com) · [Awwwards portfolios](https://www.awwwards.com/websites/portfolio/) · [Payload installation](https://payloadcms.com/docs/v3/getting-started/installation.md) · [Vercel fair use + Hobby allotments](https://vercel.com/docs/limits/fair-use-guidelines) · [Vercel Functions limits](https://vercel.com/docs/functions/limitations) · [Vercel WebSockets](https://vercel.com/docs/functions/websockets) · [Vercel Blob pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing) · [Vercel Web Analytics limits](https://vercel.com/docs/analytics/limits-and-pricing) · [MongoDB Atlas free limits](https://mongodb.com/docs/atlas/reference/free-shared-limitations/) · [Resend free tier](https://automationatlas.io/answers/resend-free-tier-explained-2026/) · [GSAP is free](https://webflow.com/blog/gsap-becomes-free) · [Cloudflare Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) · [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing) · [Render free](https://render.com/docs/free) · [Ably vs Pusher pricing](https://ably.com/compare/ably-vs-pusher/pricing) · [Upstash pricing](https://upstash.com/blog/redis-pricing-comparison-every-major-provider-in-2026-with-numbers) · [Cloudinary plans](https://cloudinary.com/documentation/billing_and_plans) · [is-a.dev guide](https://dev.to/dthiwanka/get-your-free-is-adev-subdomain-step-by-step-guide-for-developers-27o7) · [Netlify free plan](https://netli.fyi/blog/netlify-pricing-and-limits)
