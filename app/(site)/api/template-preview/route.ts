import config from "@payload-config";
import { cookies, draftMode } from "next/headers";
import { getPayload } from "payload";
import { hasDatabase } from "@/lib/data";
import { redirectTo, safeRedirectPath, TEMPLATE_PREVIEW_COOKIE } from "@/lib/draft";
import { isTemplateId } from "@/templates/types";

// GET /api/template-preview?template=index&path=/ → lets a signed-in admin look at a template
// before activating it (work plan 6.4). Turns on Draft Mode, stores the template id in an
// httpOnly cookie and redirects to `path` (same-origin only). lib/data.ts `getSettings()` uses the
// cookie only in draft mode AND with the admin's session; visitors keep getting the published
// template. /api/draft/disable ("Exit preview") clears the cookie.
//
// Auth is checked here on every request, exactly like /api/draft: anyone not signed in to the
// admin gets 401 and no cookies. GET because the dashboard's Preview button is a link that opens a
// new tab; the request changes nothing on the site, only this browser's preview state.

const noStore = { "Cache-Control": "no-store" };
const unauthorized = () => new Response("Sign in to the admin to preview templates.", { status: 401, headers: noStore });

export async function GET(request: Request) {
  // No database (static builds, e2e): there is no admin to be signed in as.
  if (!hasDatabase()) return unauthorized();
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (user?.collection !== "users") return unauthorized();

  const template = new URL(request.url).searchParams.get("template");
  if (!isTemplateId(template)) {
    return new Response("Unknown template.", { status: 400, headers: noStore });
  }

  (await draftMode()).enable();
  (await cookies()).set(TEMPLATE_PREVIEW_COOKIE, template, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return redirectTo(safeRedirectPath(request.url), request.url);
}
