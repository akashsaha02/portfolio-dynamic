// Helpers for the draft-mode route handlers in app/(site)/api/draft/.

/**
 * The same-origin path to send the editor to after toggling draft mode, from `?path=`.
 * Anything that isn't a plain local path (absolute URLs, `//host`, `/\host`) falls back to "/",
 * so the handlers can't be used as an open redirect.
 */
export function safeRedirectPath(requestUrl: string): string {
  const raw = new URL(requestUrl).searchParams.get("path");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  try {
    const origin = new URL(requestUrl).origin;
    const target = new URL(raw, origin);
    return target.origin === origin ? `${target.pathname}${target.search}` : "/";
  } catch {
    return "/";
  }
}

/**
 * Where "Exit preview" goes: `?path=` when given, otherwise the page the button was on (the
 * same-origin Referer, which the preview banner's GET form sends), otherwise "/". The Referer
 * goes through the same open-redirect checks as `?path=`.
 */
export function exitRedirectPath(request: Request): string {
  if (new URL(request.url).searchParams.has("path")) return safeRedirectPath(request.url);
  const referer = request.headers.get("referer");
  if (!referer) return "/";
  try {
    const from = new URL(referer);
    const self = new URL(request.url);
    if (from.origin !== self.origin) return "/";
    const probe = new URL(self.origin);
    probe.searchParams.set("path", `${from.pathname}${from.search}`);
    return safeRedirectPath(probe.href);
  } catch {
    return "/";
  }
}

export function redirectTo(path: string, requestUrl: string): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: new URL(path, requestUrl).href, "Cache-Control": "no-store" },
  });
}
