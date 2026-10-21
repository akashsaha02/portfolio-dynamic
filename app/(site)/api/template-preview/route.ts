import config from "@payload-config";
import { cookies, draftMode } from "next/headers";
import { getPayload } from "payload";
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

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (user?.collection !== "users") {
    return new Response("Sign in to the admin to preview templates.", { status: 401, headers: noStore });
  }

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
