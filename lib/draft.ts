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

export function redirectTo(path: string, requestUrl: string): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: new URL(path, requestUrl).href, "Cache-Control": "no-store" },
  });
}
