// Origins this deployment answers on. One list feeds Payload's `csrf` + `cors` (payload.config.ts)
// and the Turnstile hostname check (lib/actions/contact.ts), so they can't drift (QA F-02, F-08).
//
// Payload accepts the admin cookie only when the request's `Origin` is in `csrf` (with no Origin,
// it falls back to `Sec-Fetch-Site: same-origin | same-site | none`). With an empty list it
// accepted any Origin, so a cross-site form could write with the admin's cookie.

import { siteUrl } from "./seo";

function httpsOrigin(host: string | undefined): string | null {
  const value = host?.trim();
  if (!value) return null;
  try {
    return new URL(`https://${value}`).origin;
  } catch {
    return null;
  }
}

export const MAX_EXTRA_ORIGINS = 5;

/**
 * Parses `EXTRA_ALLOWED_ORIGINS`: a comma-separated list of up to 5 bare origins, e.g.
 * `https://www.akash.dev, https://akash-portfolio.vercel.app`. Each entry must be http(s) with a
 * host and nothing else (no path, query, fragment, credentials or wildcard). Anything invalid throws,
 * so a typo fails loudly instead of silently leaving the admin locked out (or a stray origin in).
 */
export function parseExtraOrigins(raw: string | undefined): string[] {
  const entries = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length > MAX_EXTRA_ORIGINS) {
    throw new Error(`EXTRA_ALLOWED_ORIGINS lists ${entries.length} origins; the maximum is ${MAX_EXTRA_ORIGINS}.`);
  }
  return entries.map((entry) => {
    const invalid = new Error(
      `EXTRA_ALLOWED_ORIGINS: "${entry}" is not a bare origin. Use scheme and host only, e.g. https://www.example.com`,
    );
    if (entry.includes("*")) throw invalid;
    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      throw invalid;
    }
    const bare = url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
    // `new URL("https://x.dev")` has pathname "/", so a bare origin (with or without a trailing slash) passes.
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname || !bare) throw invalid;
    return url.origin; // normalised: lowercase host, default port dropped
  });
}

/**
 * - Always: `siteUrl().origin` (NEXT_PUBLIC_SITE_URL, else the Vercel production/deployment URL,
 *   else http://localhost:$PORT).
 * - On Vercel (`VERCEL=1`): the production domain, this deployment's URL and its branch URL, all
 *   https. Reach the admin on one of these; any other alias is treated as cross-origin
 *   and the admin cookie is ignored there, unless it is listed in EXTRA_ALLOWED_ORIGINS.
 * - Elsewhere (`next dev` / `next start`): http://localhost:$PORT and http://127.0.0.1:$PORT.
 *   `next start -p 4200` sets PORT itself, so any local port works. Never added on Vercel.
 * - Plus `EXTRA_ALLOWED_ORIGINS` (optional, unset by default), e.g. a second custom domain or the
 *   project's *.vercel.app alias, where the admin or the contact form should also work.
 */
export function allowedOrigins(): string[] {
  const origins = new Set<string>([siteUrl().origin, ...parseExtraOrigins(process.env.EXTRA_ALLOWED_ORIGINS)]);
  if (process.env.VERCEL === "1") {
    for (const host of [
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
    ]) {
      const origin = httpsOrigin(host);
      if (origin) origins.add(origin);
    }
  } else {
    const port = process.env.PORT || "3000";
    origins.add(`http://localhost:${port}`);
    origins.add(`http://127.0.0.1:${port}`);
  }
  return [...origins];
}

/** Hostnames of `allowedOrigins()`, e.g. for Turnstile's siteverify `hostname`. */
export function allowedHostnames(): string[] {
  return [...new Set(allowedOrigins().map((origin) => new URL(origin).hostname))];
}

/**
 * Payload `serverURL`. Set only for Vercel production, where there is one canonical origin.
 * Elsewhere it stays empty on purpose: a set serverURL makes the admin's API calls and upload URLs
 * absolute, which breaks a preview opened on its branch URL (calls would go to the deployment URL,
 * without the cookie) and local runs on another port. With it empty, Payload trusts the request's
 * Host only when that origin is in the csrf/cors list above.
 */
export function payloadServerURL(): string {
  return process.env.VERCEL_ENV === "production" ? siteUrl().origin : "";
}
