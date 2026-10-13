import type { Metadata } from "next";

// Site-wide SEO helpers. No template imports this: they feed `metadata` / `generateMetadata` in
// app/(site)/** and, from task 2.7, sitemap.ts, robots.ts and the OG image routes.

/** Metadata for every 404 in (site): the catch-all and unknown /work/[slug] (QA F-13). */
export const notFoundMetadata: Metadata = {
  title: "Page not found",
  // Next also injects `noindex` on 404 responses, but not on every path (QA saw it missing on
  // /work/<unknown>), so it is stated explicitly.
  robots: { index: false },
};

let warnedLocalhost = false;

function fromHost(host: string | undefined): URL | null {
  const value = host?.trim();
  return value ? new URL(`https://${value}`) : null;
}

/**
 * Absolute base URL for `metadataBase` (canonical, Open Graph and Twitter image URLs).
 *
 * 1. `NEXT_PUBLIC_SITE_URL`, when set (an invalid URL fails the build).
 * 2. On Vercel (system env vars, available at build and run time): production builds use
 *    `VERCEL_PROJECT_PRODUCTION_URL` (the production domain); previews use `VERCEL_URL` (this
 *    deployment), falling back to the production domain.
 * 3. `http://localhost:<PORT|3000>`. A production build that lands here (a local `next build`)
 *    logs one warning instead of failing, so local and CI builds keep working.
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      throw new Error(`NEXT_PUBLIC_SITE_URL="${explicit}" is not an absolute URL, e.g. https://example.com`);
    }
  }

  const vercel =
    process.env.VERCEL_ENV === "production"
      ? fromHost(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? fromHost(process.env.VERCEL_URL)
      : fromHost(process.env.VERCEL_URL) ?? fromHost(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return vercel;

  const local = new URL(`http://localhost:${process.env.PORT || 3000}`);
  if (process.env.NODE_ENV === "production" && !warnedLocalhost) {
    warnedLocalhost = true;
    console.warn(
      `[seo] NEXT_PUBLIC_SITE_URL is unset and this is not a Vercel build: metadataBase is ${local.origin}. ` +
        "Canonical and Open Graph URLs will point at localhost. Set NEXT_PUBLIC_SITE_URL for a real deployment.",
    );
  }
  return local;
}
