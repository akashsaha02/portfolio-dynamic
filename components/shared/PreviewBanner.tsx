import { draftMode, headers } from "next/headers";
import { getPreviewUser } from "@/lib/data";
import { originFromHeaders } from "@/lib/payload/preview";
import { RefreshRouteOnSave } from "./RefreshRouteOnSave";

/**
 * Draft-mode banner (work plan 3.4). Server Component, mounted in the (site) layout. Renders
 * nothing unless draft mode is on, so prerendered pages are unchanged and ship no extra JS.
 *
 * In draft mode it says whether drafts are shown (signed-in admin) or not (draft cookie but no
 * session), mounts the live-preview refresher for the admin, and offers "Exit preview": a plain
 * GET form to /api/draft/disable, not a <Link> (a prefetch would clear the cookie early). The
 * route sends the editor back to this page.
 */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  const user = await getPreviewUser();
  const serverURL = originFromHeaders(await headers());

  return (
    <>
      {user && <RefreshRouteOnSave serverURL={serverURL} />}
      <aside
        aria-label="Preview"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-ink px-4 py-3 text-sm text-on-ink shadow-lg"
      >
        <p role="status" className="min-w-0 flex-1">
          {user
            ? "Preview: you’re seeing unpublished drafts. Visitors still see the published site."
            : "Preview mode is on, but you’re signed out, so this is the published site."}
        </p>
        <form method="get" action="/api/draft/disable">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full bg-lime px-4 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          >
            Exit preview
          </button>
        </form>
      </aside>
    </>
  );
}
