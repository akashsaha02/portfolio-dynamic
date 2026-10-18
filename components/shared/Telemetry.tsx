/**
 * Vercel Web Analytics + Speed Insights (limits: docs/ops/free-tier.md), on Vercel production
 * deployments only.
 *
 * Decided at BUILD time, not per request: a client component that a server component merely
 * imports still ships its JS on every page, even when it never renders (Next doesn't code-split
 * client components imported from server components). So `next.config.ts` replaces
 * `process.env.VERCEL_TELEMETRY` in server code with "on" when the build runs with
 * `VERCEL_ENV=production` (Vercel production builds), and "off" otherwise (local, CI, e2e,
 * Lighthouse CI, Vercel previews). With "off" the import below is dead code: the bundler drops
 * it, so the page carries no telemetry JS at all. Setting the variable at runtime does nothing.
 *
 * No custom events, no user identifiers: page views and Web Vitals only, which Vercel records
 * without cookies. Both components inject their script after hydration, so they don't block LCP.
 * Mount once in the site layout, inside <body>.
 */
export async function Telemetry() {
  if (process.env.VERCEL_TELEMETRY !== "on") return null;
  const { VercelTelemetry } = await import("./VercelTelemetry");
  return <VercelTelemetry />;
}
