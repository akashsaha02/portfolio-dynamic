import config from "@payload-config";
import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { redirectTo, safeRedirectPath } from "@/lib/draft";

// GET /api/draft?path=/work/abroadly → enables Draft Mode for a signed-in admin and redirects to
// `path` (same-origin only). Payload's REST catch-all is app/(payload)/api/[...slug]; this static
// segment takes precedence over it for /api/draft only.
//
// Auth is checked here, on every request, from the Payload session cookie: anonymous visitors
// get 401 and no cookie. GET because the admin's preview button opens a link (guide: draft mode).

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (user?.collection !== "users") {
    return new Response("Sign in to the admin to preview drafts.", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  (await draftMode()).enable();
  return redirectTo(safeRedirectPath(request.url), request.url);
}
