// Live preview (work plan 2.6, 3.4): which URL the admin's preview pane loads for a document.
//
// The pane loads `/api/draft?path=<page>`: that route checks the admin session, turns on draft
// mode and redirects to the page, so the pane shows unpublished drafts (lib/data.ts reads them
// only for the signed-in admin in draft mode). On the page, components/shared/PreviewBanner.tsx
// mounts `RefreshRouteOnSave`, which re-renders the pane each time the document is saved.
// The routes are the same for every template, so this needs no template lookup.

import type { PayloadRequest, SanitizedCollectionConfig, SanitizedGlobalConfig } from "payload";
import { siteUrl } from "../seo";

/** Device sizes offered in the preview toolbar (guide §5: phone first). */
export const PREVIEW_BREAKPOINTS = [
  { name: "mobile", label: "Mobile", width: 360, height: 740 },
  { name: "tablet", label: "Tablet", width: 768, height: 1024 },
  { name: "desktop", label: "Desktop", width: 1440, height: 900 },
];

type ProjectLike = { slug?: unknown; caseStudy?: { enabled?: unknown } | null };

/** Projects with a case study have their own page; the rest only appear on /work. */
export function projectPath(doc: ProjectLike): string {
  const slug = typeof doc.slug === "string" ? doc.slug.trim() : "";
  return doc.caseStudy?.enabled && slug ? `/work/${encodeURIComponent(slug)}` : "/work";
}

function isLocalHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

/**
 * Origin the admin is being served from. The preview iframe must be same-origin: Payload only
 * accepts the frontend's "ready" message when the URL starts with its origin, and the admin cookie
 * (SameSite=Lax) is only sent to a same-site frame. Payload's own `req.origin` assumes http, which
 * is wrong on Vercel, so read the forwarded headers.
 */
export function requestOrigin(req: PayloadRequest): string {
  return originFromHeaders(req.headers);
}

/** `requestOrigin` from plain request headers (Server Components: `await headers()`). */
export function originFromHeaders(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return siteUrl().origin;
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : isLocalHost(host) ? "http" : "https";
  return `${proto}://${host}`;
}

/** `admin.livePreview.url`. Returns null (no preview) for anything without a public page. */
export function livePreviewUrl({
  collectionConfig,
  data,
  globalConfig,
  req,
}: {
  collectionConfig?: SanitizedCollectionConfig;
  data: Record<string, unknown>;
  globalConfig?: SanitizedGlobalConfig;
  req: PayloadRequest;
}): string | null {
  let path: string | null = null;
  if (collectionConfig?.slug === "projects") path = projectPath(data as ProjectLike);
  else if (globalConfig?.slug === "profile") path = "/";
  return path ? `${requestOrigin(req)}/api/draft?path=${encodeURIComponent(path)}` : null;
}
