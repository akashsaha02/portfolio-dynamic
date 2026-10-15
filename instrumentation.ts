import type { Instrumentation } from "next";

/**
 * PII-free server error log (docs/ops/env.md: error reporting must not ship PII).
 *
 * Output goes to the Vercel runtime logs (kept 1 hour on Hobby). Only these fields
 * are ever emitted: route pattern, request method, the path without its query string,
 * error class name and the React/Next error digest. Never headers, cookies, bodies,
 * query strings or error messages (messages can echo contact-form input or emails).
 * Server action failures are reported with the route pattern only, not their payload.
 */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  try {
    const name = err instanceof Error ? err.name : typeof err;
    const digest =
      typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
    // `request.path` can contain a query string such as ?email=...; keep only the pathname.
    const path = request.path.split("?")[0]?.split("#")[0] ?? "";

    console.error(
      "[request-error]",
      JSON.stringify({
        route: context.routePath,
        type: context.routeType,
        method: request.method,
        path,
        name,
        digest,
      }),
    );
  } catch {
    // Reporting must never throw into the request path.
  }
};
