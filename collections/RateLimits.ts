import type { CollectionConfig } from "payload";
import { nobody } from "../lib/payload/access";

/**
 * One document per accepted contact-form submission, used by the contact Server Action's rate
 * limit (lib/payload/rate-limit-store.ts). Not visible in the admin and closed to the API: only
 * trusted server code touches it, with `overrideAccess: true`.
 *
 * `key` is an HMAC-SHA256 of the visitor's IP keyed with PAYLOAD_SECRET: the raw IP is never
 * stored. `expiresAt` carries a MongoDB TTL index (created lazily by the store, because Payload
 * field indexes can't set `expireAfterSeconds`), so MongoDB deletes each hit after a day.
 */
export const RateLimits: CollectionConfig = {
  slug: "rate-limits",
  admin: { hidden: true },
  access: {
    read: nobody,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  lockDocuments: false,
  timestamps: true,
  fields: [
    { name: "key", type: "text", required: true, index: true },
    // No `index: true` here: the TTL index on this path is created by the store, and a second,
    // plain index on the same key pattern would conflict with it.
    { name: "expiresAt", type: "date", required: true },
  ],
};
