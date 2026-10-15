"use client";

import dynamic from "next/dynamic";

// Lazy boundary: a Server Component can't code-split the Client Components it imports, so the
// (site) layout would otherwise preload the live-preview code for every visitor. Only this stub
// is in the layout's bundle; LivePreviewRefresh loads when it actually renders (draft mode, admin).
const LivePreviewRefresh = dynamic(() => import("./LivePreviewRefresh").then((m) => m.LivePreviewRefresh), {
  ssr: false,
});

/**
 * Re-renders the page (server data included) each time the admin saves the document shown in
 * the live preview pane. Mounted by PreviewBanner only in draft mode for the signed-in admin.
 * `serverURL` is the admin's origin (this same site): save messages from any other origin are
 * ignored.
 */
export function RefreshRouteOnSave({ serverURL }: { serverURL: string }) {
  return <LivePreviewRefresh serverURL={serverURL} />;
}
