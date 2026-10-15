// Payload CMS config (guide §7). Admin at /admin, REST API at /api, both from app/(payload)/.
// The public site reads content through the Local API in lib/data.ts (Phase 3), never via REST.

import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Education } from "./collections/Education";
import { Experience } from "./collections/Experience";
import { Media } from "./collections/Media";
import { Messages } from "./collections/Messages";
import { Projects } from "./collections/Projects";
import { Publications } from "./collections/Publications";
import { RateLimits } from "./collections/RateLimits";
import { Skills } from "./collections/Skills";
import { Users } from "./collections/Users";
import { Profile } from "./globals/Profile";
import { SiteSettings } from "./globals/SiteSettings";
import { livePreviewUrl, PREVIEW_BREAKPOINTS } from "./lib/payload/preview";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: {
      // Page titles read "Dashboard · Akash · Admin", ... (Payload adds the space before the suffix).
      titleSuffix: "· Akash · Admin",
      description: "Content admin for Akash Saha's portfolio.",
      openGraph: { siteName: "Akash · Admin", description: "Content admin for Akash Saha's portfolio." },
      icons: [{ rel: "icon", type: "image/x-icon", url: "/favicon.ico" }],
      robots: { index: false, follow: false },
      // No dynamic OG images for admin pages: turns off Payload's /api/og endpoint.
      defaultOGImageType: "off",
    },
    components: {
      graphics: {
        Logo: "/components/admin/Brand#AdminLogo",
        Icon: "/components/admin/Brand#AdminIcon",
      },
    },
    // Dashboard widgets (Payload's modular dashboard, @experimental in 3.90). Widgets are Server
    // Components in components/admin/. `defaultLayout` is what a fresh login sees; once the admin
    // rearranges the dashboard, Payload keeps that layout in their preferences ("Reset layout" in
    // the dashboard menu brings this one back). On screens ≤ 768 px every widget is full width.
    dashboard: {
      widgets: [
        {
          slug: "unread-messages",
          label: "Unread messages",
          Component: "/components/admin/UnreadMessagesWidget#UnreadMessagesWidget",
          minWidth: "small",
        },
        {
          slug: "availability",
          label: "Availability",
          Component: "/components/admin/AvailabilityWidget#AvailabilityWidget",
          minWidth: "small",
        },
        {
          slug: "quick-links",
          label: "Quick links",
          Component: "/components/admin/QuickLinksWidget#QuickLinksWidget",
          minWidth: "medium",
        },
      ],
      defaultLayout: [
        { widgetSlug: "unread-messages", width: "medium" },
        { widgetSlug: "availability", width: "medium" },
        { widgetSlug: "quick-links", width: "full" },
        // Payload's built-in collection/global cards.
        { widgetSlug: "collections", width: "full" },
      ],
    },
    // Live preview pane for projects (/work/{slug}, or /work without a case study) and the profile
    // (/). URLs come from lib/payload/preview.ts. Phase 3 (task 3.4) adds RefreshRouteOnSave on
    // the site and the draft-mode hop so the pane shows unsaved drafts and refreshes on save.
    livePreview: {
      collections: ["projects"],
      globals: ["profile"],
      url: livePreviewUrl,
      breakpoints: PREVIEW_BREAKPOINTS,
    },
  },
  collections: [Projects, Experience, Publications, Skills, Education, Media, Messages, Users, RateLimits],
  globals: [Profile, SiteSettings],
  editor: lexicalEditor(),
  // Payload refuses to start without it (getPayload throws), so a missing secret fails loudly.
  secret: process.env.PAYLOAD_SECRET || "",
  db: mongooseAdapter({ url: process.env.DATABASE_URI || "" }),
  sharp,
  // The site uses the Local API and the admin uses REST, so GraphQL is off: less public surface.
  graphQL: { disable: true },
  telemetry: false,
  // Vercel functions accept request bodies up to 4.5 MB; media should be small WebP anyway.
  upload: { limits: { fileSize: 4_000_000 } },
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  plugins: [
    // Media on Vercel Blob when BLOB_READ_WRITE_TOKEN is set (Vercel adds it when a Blob store is
    // connected); otherwise local disk (./media). `alwaysInsertFields` keeps the schema and the
    // generated types identical in both modes. Files are served straight from the public Blob URL
    // (no function invocation per file); media is public-read anyway.
    vercelBlobStorage({
      enabled: Boolean(blobToken),
      token: blobToken,
      alwaysInsertFields: true,
      collections: { media: { disablePayloadAccessControl: true } },
    }),
  ],
});
