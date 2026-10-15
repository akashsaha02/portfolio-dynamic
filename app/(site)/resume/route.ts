import { getSiteContent } from "@/lib/data";

// /resume → the latest résumé PDF (work plan 2.7). `profile.resumeUrl` is mapped from the Payload
// `profile.resume` upload in lib/data.ts (Phase 3); until one exists this answers 404.
//
// Dynamic on purpose (route handlers aren't cached by default): a new upload takes effect on the
// next request without a redeploy. A 307 rather than 308 so browsers never cache the target.

export async function GET(request: Request) {
  const { profile } = await getSiteContent();
  const target = profile.resumeUrl ? safeTarget(profile.resumeUrl, request.url) : null;
  if (!target) return new Response("No résumé has been uploaded yet.", { status: 404 });

  return new Response(null, {
    status: 307,
    headers: { Location: target, "Cache-Control": "no-store" },
  });
}

/** Absolute http(s) URL for a relative media path or a Blob URL; anything else is refused. */
function safeTarget(value: string, requestUrl: string): string | null {
  try {
    const url = new URL(value, requestUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
