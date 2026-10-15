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
import { Skills } from "./collections/Skills";
import { Users } from "./collections/Users";
import { Profile } from "./globals/Profile";
import { SiteSettings } from "./globals/SiteSettings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: " · Portfolio admin" },
  },
  collections: [Projects, Experience, Publications, Skills, Education, Media, Messages, Users],
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
