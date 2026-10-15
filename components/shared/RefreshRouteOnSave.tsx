"use client";

import { RefreshRouteOnSave as PayloadRefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Re-renders the page (server data included) each time the admin saves the document shown in
 * the live preview pane. Mounted by PreviewBanner only in draft mode for the signed-in admin, so
 * public visitors never download it. `serverURL` is the admin's origin (this same site): Payload's
 * save messages from any other origin are ignored.
 */
export function RefreshRouteOnSave({ serverURL }: { serverURL: string }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  return <PayloadRefreshRouteOnSave refresh={refresh} serverURL={serverURL} />;
}
