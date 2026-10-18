import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Vercel Web Analytics + Speed Insights. Import only through ./Telemetry, which keeps this module
 * (and its client code) out of every build that isn't a Vercel production build.
 */
export function VercelTelemetry() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
