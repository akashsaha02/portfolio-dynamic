import type { CollectionConfig } from "payload";
import { anyone, isAdmin } from "../lib/payload/access";
import { revalidateCollection } from "../lib/payload/revalidate";

/**
 * Images (portrait, screenshots, diagrams, OG fallback) and the résumé PDF.
 *
 * Storage: local disk in ./media (git-ignored) by default. When BLOB_READ_WRITE_TOKEN is set the
 * Vercel Blob plugin (payload.config.ts) takes over and files are served from the public Blob URL.
 * No `imageSizes`: next/image does the resizing, and each stored size would cost Blob storage
 * and operations (guide §9.2). Upload pre-sized WebP, ideally ≤ 200 KB.
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
    defaultColumns: ["filename", "alt", "mimeType", "filesize", "updatedAt"],
    group: "Content",
  },
  // Public read: the site renders these files. Writes are admin-only.
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: revalidateCollection("media"),
  upload: {
    // Relative to the working directory (the repo root for `next` and `payload` commands).
    staticDir: "media",
    mimeTypes: ["image/webp", "image/png", "image/jpeg", "image/avif", "image/svg+xml", "application/pdf"],
    focalPoint: false,
    crop: false,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "Describe what the image shows for people who can’t see it, e.g. “Abroadly home page: Study abroad with confidence”. For a PDF, name the document.",
      },
    },
  ],
};
