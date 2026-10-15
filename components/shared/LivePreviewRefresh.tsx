"use client";

import { RefreshRouteOnSave as PayloadRefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * The live-preview refresher itself. Loaded on demand by RefreshRouteOnSave.tsx (a lazy
 * boundary), so this code and @payloadcms/live-preview never ship in a visitor's first load.
 */
export function LivePreviewRefresh({ serverURL }: { serverURL: string }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  return <PayloadRefreshRouteOnSave refresh={refresh} serverURL={serverURL} />;
}
