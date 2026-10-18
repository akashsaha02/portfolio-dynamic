import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Security headers on every route: site, admin, API, OG images (QA F-03).
// - Framing: same origin only. The admin's live preview iframes the site on the same origin, so
//   'self' keeps it working; any other site is refused (clickjacking). X-Frame-Options is the
//   legacy twin of `frame-ancestors` for old browsers.
// - No script-src CSP yet: Payload's admin needs 'unsafe-inline' and the Turnstile widget loads from
//   challenges.cloudflare.com, so a real policy is its own task (work plan 4.5). This CSP carries
//   only `frame-ancestors`, which restricts nothing else. HSTS is sent by Vercel on its domains.
// - Config headers REPLACE a header of the same name that a route sets itself, so this site-wide CSP
//   would also replace Payload's stricter one on uploaded files (QA N-01). `uploadHeaders` below puts
//   a locked-down CSP back on /api/media/file/*: a later rule wins for the same key.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
];

// Uploaded files served by Payload's file route (local disk; on Vercel media comes from the Blob
// domain instead). Nothing may run or load: no scripts, frames or plugins, only the image itself and
// SVG inline styles, in a sandbox (unique origin), framed by this site only. Defence in depth behind
// Payload's upload sanitising: a hostile SVG opened directly can't script the admin's origin.
const uploadHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox; frame-ancestors 'self'",
  },
];

// PDFs (the résumé): the same policy without `sandbox`, which stops Chrome's built-in PDF viewer
// from rendering the file. A PDF can't run script in the site's origin (the viewer is isolated), so
// the sandbox only matters for SVG/HTML-like files, and those keep it.
const uploadPdfHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; frame-ancestors 'self'",
  },
];

// The admin and the JSON API should never show up in search results (robots.txt already disallows
// crawling; this also covers pages linked from elsewhere).
const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Drops "X-Powered-By: Next.js, Payload" (withPayload adds it only when this isn't false).
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: noindex },
      { source: "/admin/:path*", headers: noindex },
      // Must stay after the site-wide rule: the last matching rule wins for Content-Security-Policy.
      { source: "/api/media/file/:path*", headers: uploadHeaders },
      // After the upload rule, so it wins for PDFs only. Case-insensitive extension.
      { source: "/api/media/file/:file(.*\\.[pP][dD][fF])", headers: uploadPdfHeaders },
    ];
  },
  // Telemetry JS only in Vercel production builds (components/shared/Telemetry.tsx). Replaced at
  // build time in server code, so the client code isn't even bundled anywhere else.
  compiler: {
    defineServer: {
      "process.env.VERCEL_TELEMETRY": process.env.VERCEL_ENV === "production" ? "on" : "off",
    },
  },

  // cacheComponents stays off: see docs/decisions/cache-components.md (work plan 2.2 spike).

  // Lets the Editorial and Folio e2e builds sit side by side (e.g. NEXT_DIST_DIR=.next-folio).
  // `next build` and `next start` must see the same value. Must stay inside the project.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Vercel Hobby allows 5,000 image transformations a month (guide §9.2). Each distinct
  // (source, w, q, format) is one transformation, cached up to 31 days and kept across
  // redeploys, so the budget is roughly: images x allowed widths x qualities x formats.
  images: {
    // No component passes `quality`, so everything uses the default 75. A `quality` prop would be
    // coerced to 75; any other `q` in a hand-made /_next/image URL gets a 400.
    qualities: [75],
    // Our largest sources are 1600 px (screenshots); the portrait is 1024 and the phone shot 560.
    // A wider variant would re-encode the same pixels, so the list stops at 1600. Picks for real
    // layouts: phones 360-414 @2-3x -> 828 / 1080 / 1280; tablet 768 / 1024 @2x -> 828-1600;
    // desktop 1440 @1x -> 828, @2x -> 1600. Defaults were 640 ... 3840 (8 widths).
    deviceSizes: [640, 828, 1080, 1280, 1600],
    // Only the editorial phone mockup is narrower than a phone (~190-400 px). 32-128 were never
    // requested. Defaults were 32, 48, 64, 96, 128, 256, 384.
    imageSizes: [256, 384],
    // Sources in public/ are versioned by filename (rename to change), and Payload/Blob uploads
    // get new URLs, so a long TTL is safe: 31 days, Vercel's maximum. Default is 4 hours.
    minimumCacheTTL: 2678400,
    // WebP only (the Next 16 default, stated so nobody flips it casually). Vercel keys the cache
    // on the Accept header, so adding AVIF would roughly double transformations for ~20% smaller
    // files on sources that are already small WebP.
    formats: ["image/webp"],
    // Any local path, but no query string: otherwise `?v=1`, `?v=2`, ... each counts as a new
    // source and could burn the monthly budget. Add remotePatterns when Payload media goes to Blob.
    localPatterns: [{ pathname: "/**", search: "" }],
    // Payload media on Vercel Blob (payload.config.ts, enabled when BLOB_READ_WRITE_TOKEN is set).
    // disablePayloadAccessControl serves files straight from the public Blob URL, so the optimizer
    // fetches them from here instead of invoking a function per file.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com", search: "" }],
  },

  // Pin the workspace root: agent worktrees sit inside the main checkout, which has its own lockfile.
  turbopack: { root: dirname },
};

// withPayload adds Payload's server-package and webpack/Turbopack settings for /admin and /api.
// devBundleServerPackages: false keeps Payload's server packages external in dev (faster startup),
// as in Payload's blank template.
const payloadConfig = withPayload(nextConfig, { devBundleServerPackages: false });

type HeaderRule = Awaited<ReturnType<NonNullable<NextConfig["headers"]>>>[number];

/**
 * withPayload adds `Accept-CH`, `Vary` and `Critical-CH: Sec-CH-Prefers-Color-Scheme` on `/:path*`
 * so the admin can render its light/dark theme on the server. On public pages `Critical-CH` can make
 * Chromium re-request the page on a first visit (slower LCP) and the `Vary` splits CDN caching, so
 * that rule is narrowed to the admin. Matched by content, not position: if Payload changes it, the
 * rule passes through unchanged (and the curl check in the QA probes would show it again).
 */
function adminOnlyClientHints(rule: HeaderRule): HeaderRule {
  const isPayloadHints =
    rule.source === "/:path*" && rule.headers.some((h) => h.key.toLowerCase() === "critical-ch");
  return isPayloadHints ? { ...rule, source: "/admin/:path*" } : rule;
}

export default {
  ...payloadConfig,
  async headers() {
    const rules = (await payloadConfig.headers?.()) ?? [];
    return rules.map(adminOnlyClientHints);
  },
} satisfies NextConfig;
