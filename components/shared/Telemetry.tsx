import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Vercel Web Analytics + Speed Insights (limits: docs/ops/free-tier.md).
 *
 * Server component: it reads VERCEL_ENV, which only exists on Vercel, and
 * returns null everywhere else (local dev, CI, e2e, Lighthouse CI, Vercel
 * preview deployments). When it renders nothing, no telemetry JS is sent.
 *
 * No custom events, no user identifiers: page views and Web Vitals only, which
 * Vercel records without cookies. Both components inject their script after
 * hydration, so they do not block LCP. Mount once in the site layout, inside
 * <body>.
 */
export function Telemetry() {
  if (process.env.VERCEL_ENV !== "production") return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
