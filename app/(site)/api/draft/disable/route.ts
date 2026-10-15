import { draftMode } from "next/headers";
import { exitRedirectPath, redirectTo } from "@/lib/draft";

// /api/draft/disable[?path=/] → turns Draft Mode off and redirects (same-origin only): to `path`,
// else back to the page the request came from (Referer), else "/". No auth: leaving preview is
// harmless. GET for the preview banner's `<form method="get">` exit button (not a <Link>:
// prefetching would clear the cookie early); POST for forms and Server Actions.

async function disable(request: Request) {
  (await draftMode()).disable();
  return redirectTo(exitRedirectPath(request), request.url);
}

export const GET = disable;
export const POST = disable;
