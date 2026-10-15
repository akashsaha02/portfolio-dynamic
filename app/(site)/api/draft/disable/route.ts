import { draftMode } from "next/headers";
import { redirectTo, safeRedirectPath } from "@/lib/draft";

// /api/draft/disable?path=/ → turns Draft Mode off and redirects (same-origin only). No auth:
// leaving preview is harmless. POST for forms and Server Actions; GET for a `<form method="get">`
// exit button (not a <Link>: prefetching would clear the cookie early).

async function disable(request: Request) {
  (await draftMode()).disable();
  return redirectTo(safeRedirectPath(request.url), request.url);
}

export const GET = disable;
export const POST = disable;
