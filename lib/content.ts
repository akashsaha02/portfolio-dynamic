// Static site content. This is the seed source until Payload is live (work plan 2.4), and the
// Editorial template (components/hero, components/sections) still imports it directly.
//
// New templates must NOT import this file: they get `SiteContent` from `lib/data.ts` via props.
// Fields marked "derived" were worked out from existing entries or public sources and should be
// confirmed by Akash in the content pass (work plan 1.8 / 5.3).

import { formatPeriod } from "./format";

type Image = { src: string; alt: string; width: number; height: number };

const github = "https://github.com/akashsaha02";
const linkedin = "https://www.linkedin.com/in/akashsaha02";

export const profile = {
  name: "Akash Saha",
  role: "Full-stack developer",
  // Draft by lead (guide §4.2 hero line), pending Akash's OK.
  headline: "Full-stack developer & ML researcher",
  location: "Dhaka, Bangladesh",
  timezone: "Asia/Dhaka",
  email: "akashsaha1313@gmail.com",
  // Draft by lead: first sentence of `about`, pending Akash's OK.
  statement: "I build web products end to end, from the database schema to the screen people tap.",
  // phone: omitted on purpose; guide §13 keeps it off unless Akash wants it public.
  github,
  linkedin,
  intro:
    "Full-stack developer in Dhaka. I build SaaS products with MongoDB, Express, React and Node, and I’ve published research on deep learning for plant disease detection.",
  about:
    "I build web products end to end, from the database schema to the screen people tap. Right now that means a multi-tenant car rental platform at Nyntax: reservations, Stripe deposits, insurance pricing and toll handling. Before that I spent a year teaching neural networks to spot disease on tomato leaves.",
  portrait: {
    src: "/portrait.webp",
    alt: "Portrait of Akash Saha",
    width: 1024,
    height: 1024,
  } satisfies Image,
  // avatar: pending, square avatar asset (work plan 0.6).
  // resumeUrl: pending, résumé PDF (work plan 0.6); /resume route arrives in 2.7.
  // From the Nyntax points Akash supplied on 2026-10-10. Change `updated` whenever the text changes.
  now: {
    text: "Integrating Sola Payments as a second payment gateway for the multi-tenant car rental SaaS I work on at Nyntax.",
    updated: "2026-10-10",
  },
  // Guide §3: English, then Bangla (Dhaka), Hindi (studied in India), then the rest.
  greetings: [
    { text: "Hello", lang: "en" },
    { text: "স্বাগতম", lang: "bn" },
    { text: "नमस्ते", lang: "hi" },
    { text: "Bonjour", lang: "fr" },
    { text: "Hola", lang: "es" },
    { text: "こんにちは", lang: "ja" },
    { text: "Hallo", lang: "de" },
  ],
  // Titles from guide §3; bodies written from the experience and research below (Akash to review).
  services: [
    {
      number: "01",
      title: "Full-stack products",
      body: "SaaS products built end to end with MongoDB, Express, React, Node and Next.js. Multi-tenant platforms, Stripe payments and the third-party integrations around them.",
    },
    {
      number: "02",
      title: "Interfaces",
      body: "Responsive React interfaces that work on a phone first. Motion that supports the content, and accessibility built in rather than bolted on.",
    },
    {
      number: "03",
      title: "Machine learning",
      body: "Computer vision with CNNs and transfer learning, from preprocessing and data augmentation to comparing models. Published with IEEE on tomato leaf disease detection.",
    },
  ],
  socials: [
    { label: "GitHub", url: github },
    { label: "LinkedIn", url: linkedin },
    // Google Scholar (guide §3 footer): add once Akash shares the profile URL.
  ],
  availability: { status: "open", label: "Open to full-stack roles" } as const,
};

export const site = {
  versionLabel: "2026 © Edition",
  seo: {
    title: "Akash Saha, full-stack developer",
    description:
      "Akash Saha is a full-stack developer in Dhaka building SaaS products with MongoDB, Express, React and Node, with published research in deep learning.",
  },
};

/** Operational toggles; become Payload `site-settings` fields in Phase 2. */
export const settings = {
  contactFormEnabled: true,
  announcement: null as { text: string; url?: string } | null,
};

export type Role = {
  company: string;
  title: string;
  /** Display label, derived from start/end. */
  period: string;
  place: string;
  url?: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", or null for the current role. */
  end: string | null;
  points: string[];
  /** Derived from the points and title. */
  skills: string[];
};

const roles: Omit<Role, "period">[] = [
  {
    company: "Nyntax",
    title: "MERN developer",
    start: "2025-11",
    end: null,
    place: "Dhaka",
    url: "https://www.nyntax.com/",
    // Points supplied by Akash, 2026-10-10.
    points: [
      "Develop and maintain features for a multi-tenant car rental SaaS platform used by multiple rental companies.",
      "Built core booking modules, including Quick Reservation, Car Swap and EZPass toll management.",
      "Integrated third-party insurance and licence verification APIs (TeqMobility, Axle, Bonzah) into the reservation workflow.",
      "Implemented Stripe payment workflows, including security deposits and split payments to merchant accounts.",
      "Currently integrating Sola Payments as an additional payment gateway.",
      "Fixed bugs in insurance start- and end-date handling so that coverage periods match reservation dates.",
      "Redesigned key UI screens, improving usability and the customer booking experience.",
      "Designed dynamic pricing logic that calculates insurance premiums based on vehicle value.",
    ],
    skills: ["MongoDB", "Express", "React", "Node", "Stripe", "Sola Payments"],
  },
  {
    company: "Softvence Agency",
    title: "MERN stack developer",
    start: "2025-07",
    end: "2025-10",
    place: "Dhaka",
    url: "https://softvence.agency/",
    points: [
      "Shipped full-stack apps across SaaS, e-commerce and AI products on tight deadlines.",
      "Fixed production issues, improved stability and kept a library of reusable components.",
    ],
    skills: ["MongoDB", "Express", "React", "Node"],
  },
  {
    company: "Deep learning research",
    title: "Undergraduate research assistant",
    start: "2024-08",
    end: "2025-05",
    place: "Bhubaneswar",
    points: [
      "Built a tomato leaf disease detector and compared five models: a custom CNN, VGG16, Xception, Inception V3 and DenseNet.",
      "VGG16 reached 96% accuracy after preprocessing and data augmentation.",
    ],
    skills: ["CNNs", "Transfer learning", "Data augmentation"],
  },
  {
    company: "RNPsoft",
    title: "Web development intern",
    start: "2024-01",
    end: "2024-04",
    place: "Bhubaneswar",
    url: "https://rnpsoft.framer.website/",
    points: [
      "Built responsive interfaces with React, Vite and Tailwind CSS, wired to REST APIs.",
      "Added role-based authentication and real-time updates.",
    ],
    skills: ["React", "Vite", "Tailwind CSS", "REST APIs"],
  },
];

// Most recent first.
export const experience: Role[] = roles.map((r) => ({ ...r, period: formatPeriod(r.start, r.end) }));

/** Case-study copy for /work/[slug] (guide §4.4). One short paragraph per field. */
export type CaseStudy = {
  /** Short, for the facts row. */
  role: string;
  problem: string;
  built: string;
  how: string;
  outcome: string;
  /** Only facts provable from the project's repo. Empty rather than estimated. */
  metrics: { value: string; label: string }[];
  /** "How it works" architecture diagram (SVG in public/). Not supplied yet: leave unset. */
  diagram?: Image;
};

export type Project = {
  name: string;
  /** Stable URL slug for /work/[slug]. */
  slug: string;
  kind: string;
  type: "fullstack" | "ml";
  /** Display period used by the Editorial cards. */
  period?: string;
  /** Display year for new templates when `period` is absent. */
  year?: string;
  /** Shown in Folio's "Recent work" (guide §4.2: Abroadly, Nook, SoulMatch, Cerebral Insights). */
  featured: boolean;
  summary: string;
  stack: string[];
  url: string;
  linkLabel: string;
  repo?: string;
  // Screenshots of the live product.
  image?: Image;
  phone?: Image;
  /** Projects with a case study get a /work/[slug] page. */
  caseStudy?: CaseStudy;
};

// Array order is the display order. First entry is the Editorial featured project.
export const projects: Project[] = [
  {
    name: "Abroadly",
    slug: "abroadly",
    kind: "Study abroad agency platform",
    type: "fullstack",
    year: "2026", // derived: repo created Jul 2026
    featured: true,
    summary:
      "My own product for study abroad agencies: students explore countries and universities, check eligibility and book consultations, in English or Bangla. Built as a monorepo with a Next.js frontend, an Express REST API and a shared types package. Supabase handles auth and data, Resend sends email, and GitHub Actions runs CI before deploying to Vercel and Render.",
    stack: ["Next.js", "Express", "TypeScript", "Supabase", "Resend", "GitHub Actions"],
    url: "https://study-abroad-five-mu.vercel.app",
    linkLabel: "Open Abroadly",
    repo: "https://github.com/akashsaha02/study-abroad",
    image: {
      src: "/projects/abroadly.webp",
      alt: "Abroadly home page: Study abroad with confidence",
      width: 1600,
      height: 1000,
    },
    phone: { src: "/projects/abroadly-phone.webp", alt: "Abroadly on a phone", width: 560, height: 1212 },
    // TODO(Akash): review. Drafted from github.com/akashsaha02/study-abroad (README, PROJECT_CONTEXT,
    // package.json files, .github/workflows, render.yaml, vercel.json, supabase/migrations, source).
    // Akash confirmed (2026-10-10): his own passion project, not client work; no agency uses it yet,
    // it may become operational later. Update outcome when it does.
    // Still to confirm:
    // - role: did you also do the design?
    // - outcome: mentions writing/speaking grading is not wired yet (evaluation.service.ts returns
    //   "pending"). Keep it, or drop it if that has shipped since.
    // - how: GitHub CI lints, type-checks and builds; the IELTS unit tests run only in the local
    //   pre-push check (scripts/ci-check.mjs), so the copy does not claim tests in CI.
    caseStudy: {
      role: "Owner and sole developer: product, frontend, API, database and deployment",
      problem:
        "I built Abroadly as my own product for study abroad agencies. An agency has to turn website visitors into leads, give each lead to a counsellor, then follow the student through documents, applications and the visa. Abroadly puts that whole path in one product, so students, counsellors and admins each see their part of the same records, in English or Bangla.",
      built:
        "A public site with countries, universities, courses and scholarships, plus an eligibility checker, a cost calculator, a university comparison and consultation booking. Behind it are three dashboards: students upload documents and follow their applications through five phases, counsellors work their assigned leads and students, and admins run the CRM and edit the site's content. An IELTS module adds a question bank with spreadsheet import, timed mock tests, a practice mode and band-score analytics.",
      how:
        "A monorepo with three npm workspaces: a Next.js frontend, an Express REST API and a shared TypeScript package. Server Components read data for pages; every write goes through the API, which the frontend proxies under /api so auth cookies stay on one origin. The shared package holds the Zod schemas, the eligibility rules and the application phases, so browser and server validate the same way. Supabase provides Postgres, auth and storage: student documents sit in a private bucket and open through signed links that expire after ten minutes. Resend emails admins about new leads and students about document and application updates. Mock-test answers are queued in IndexedDB until the server confirms them, so a refresh or a dropped connection doesn't lose an answer. GitHub Actions lints, type-checks and builds both apps; the frontend deploys to Vercel and the API to a free Render web service.",
      outcome:
        "Running as a live demo, with the public site on Vercel and the API on Render. It's a personal project with no agency using it yet; it's built so it could go into operation. Listening and reading are scored automatically against band tables that admins can adjust; writing and speaking answers are saved for grading, with the scoring step left as an extension point.",
      metrics: [
        { value: "3", label: "workspaces in the monorepo: web, API and shared" },
        { value: "12", label: "Express API modules" },
        { value: "2", label: "languages: English and Bangla" },
      ],
    },
  },
  {
    name: "Nook",
    slug: "nook",
    kind: "Personal knowledge vault",
    type: "fullstack",
    year: "2026", // derived: repo created Jul 2026
    featured: true,
    summary:
      "One private place for notes, code, links and files. Rich text and code editors autosave with revisions, search reaches everything, and every change goes through authorised server actions. Unit and end-to-end tests run in CI.",
    stack: ["Next.js", "Prisma", "Supabase", "Better Auth", "Playwright"],
    url: "https://getnookspace.vercel.app/",
    linkLabel: "Open Nook",
    repo: "https://github.com/akashsaha02/knowledge-vault",
    image: {
      src: "/projects/nook.webp",
      alt: "Nook home page: Your space for things worth keeping",
      width: 1600,
      height: 1000,
    },
    // TODO(Akash): review. Drafted from github.com/akashsaha02/knowledge-vault (README,
    // docs/architecture.md, docs/testing.md, package.json, .github/workflows/ci.yml,
    // prisma/schema.prisma, prisma/migrations, source).
    // Akash confirmed (2026-10-10): personal project; workspace roles are supported; no usage
    // numbers; unsure whether deploys go through the CI job or Vercel's Git integration, so the
    // outcome no longer claims the deploy waits for tests. Still to confirm:
    // - problem: worded from the landing page ("Stop scattering ideas across apps"). Who is it for
    //   in your words: yourself, developers, anyone?
    // - built: does inviting other people into a workspace work end to end? The copy only says the
    //   server checks the workspace role.
    caseStudy: {
      role: "Owner and sole developer: product, frontend, backend and deployment",
      problem:
        "Notes, code snippets, terminal commands, links, AI prompts and files usually end up scattered across different apps. Nook keeps them in one private, searchable place.",
      built:
        "A vault with six item types: notes, snippets, commands, bookmarks, prompts and files. Items sort into projects, collections and tags, can be pinned, favourited, archived or trashed, and keep a revision history. There's a command palette, full-text search, share links with optional passwords and expiry, and export of a whole workspace as JSON or a zip, with JSON import back in.",
      how:
        "Next.js App Router on Supabase Postgres through Prisma 7, with Better Auth for email and Google sign-in. Each feature is split into server actions, a service and a repository. Every change goes through a server action that validates input with Zod and checks the user's workspace role (owner, admin, member or viewer) before touching data, and one module decides who can see private items, so lists, search and detail pages can't disagree. Search uses a Postgres tsvector column that a trigger keeps current, with titles weighted above body text and a GIN index, and falls back to a simpler query if full-text search is unavailable. Notes use Quill and code uses CodeMirror; notes autosave 1.5 seconds after you stop typing, and Ctrl or Cmd+S saves at once. Attachments live in a private Supabase Storage bucket behind signed download links, and share-link passwords are hashed with scrypt.",
      outcome:
        "A personal project, live on Vercel. On every push and pull request, GitHub Actions type-checks, lints, runs the Vitest unit tests and builds, and a second job runs the Playwright tests against a real Postgres service.",
      metrics: [
        { value: "9", label: "Vitest unit test files, run in CI" },
        { value: "3", label: "Playwright end-to-end specs, run in CI against Postgres" },
        { value: "6", label: "item types in one vault" },
      ],
    },
  },
  {
    name: "SoulMatch",
    slug: "soulmatch",
    kind: "Matrimony platform",
    type: "fullstack",
    period: "2024–25",
    featured: true,
    summary:
      "Profiles, search and paid premium plans. Admin and member dashboards with filtering and sorting over biodata records, JWT and Firebase sign-in, Stripe subscriptions.",
    stack: ["MongoDB", "Express", "React", "Node", "Stripe"],
    url: "https://soulmatch-b2923.web.app/",
    linkLabel: "Open SoulMatch",
  },
  {
    name: "CrowdHex",
    slug: "crowdhex",
    kind: "Crowdfunding",
    type: "fullstack",
    period: "2024",
    featured: false,
    summary:
      "Campaign pages and account management with Firebase Authentication and a light and dark theme.",
    stack: ["React", "Tailwind", "DaisyUI"],
    url: "https://crowdhex.web.app/",
    linkLabel: "Open CrowdHex",
  },
  {
    name: "Cerebral Insights",
    slug: "cerebral-insights",
    kind: "Brain tumour detection",
    type: "ml",
    period: "2024",
    featured: true,
    summary: "Machine learning models that classify brain MRI scans for tumour detection.",
    stack: ["Python", "TensorFlow", "OpenCV"],
    url: "https://github.com/akashsaha02/cerebral-insights",
    linkLabel: "View code on GitHub",
  },
];

export type Publication = {
  title: string;
  venue: string;
  year: string;
  status: "Published" | "Accepted" | "Submitted";
  summary: string;
  doi?: string;
  url?: string;
  // bibtex: add the real entry (from IEEE Xplore) once available; never hand-write it.
};

export const publications: Publication[] = [
  {
    title: "Comparative Performance of Deep Learning Algorithms in Tomato Disease Detection",
    venue: "IEEE, 5th International Conference on Intelligent Technologies (CONIT)",
    year: "2025",
    status: "Published",
    summary:
      "Compares a custom CNN with transfer learning models for classifying tomato leaf disease. VGG16 reached 96% accuracy.",
    doi: "10.1109/CONIT63138.2025.11167239",
    url: "https://doi.org/10.1109/CONIT63138.2025.11167239",
  },
  {
    title: "Integrating CNNs and Vision Transformers for Plant Disease Detection: A Systematic Review",
    venue: "Elsevier, Computers and Electronics in Agriculture",
    year: "2026",
    status: "Submitted",
    summary:
      "Reviews 100 papers from 2020 to 2025 on the trade-offs between accuracy, memory and field performance, and sets out a path toward lightweight, explainable models that farmers can actually run.",
  },
];

export const toolkit: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "Java", "C++", "C"] },
  { group: "Frameworks", items: ["React", "Next.js", "Express", "Tailwind CSS", "Flask", "TensorFlow", "OpenCV"] },
  { group: "Data", items: ["MongoDB", "SQL"] },
  { group: "Tools", items: ["Git", "AWS", "Firebase", "Stripe", "Postman", "Linux"] },
];

export const education = [
  {
    title: "B.Tech in Computer Science and Engineering",
    place: "Kalinga Institute of Industrial Technology, Bhubaneswar",
    period: "2021 – 2025",
    detail: "Graduated with 8.92 / 10. Studied on the Government of India's Study in India scholarship (75%).",
    short: { degree: "B.Tech CSE", grade: "8.92/10", place: "KIIT" },
  },
];
