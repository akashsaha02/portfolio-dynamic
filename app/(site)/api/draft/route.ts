import config from "@payload-config";
import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { hasDatabase } from "@/lib/data";
import { redirectTo, safeRedirectPath } from "@/lib/draft";

// GET /api/draft?path=/work/abroadly → enables Draft Mode for a signed-in admin and redirects to
// `path` (same-origin only). Payload's REST catch-all is app/(payload)/api/[...slug]; this static
// segment takes precedence over it for /api/draft only.
//
// Auth is checked here, on every request, from the Payload session cookie: anonymous visitors
// get 401 and no cookie. GET because the admin's preview button opens a link (guide: draft mode).

const unauthorized = () =>
  new Response("Sign in to the admin to preview drafts.", { status: 401, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  // No database (static builds, e2e): there is no admin to be signed in as, and getPayload would
  // fail to connect (a 500 before this check).
  if (!hasDatabase()) return unauthorized();
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (user?.collection !== "users") return unauthorized();

  (await draftMode()).enable();
  return redirectTo(safeRedirectPath(request.url), request.url);
}
