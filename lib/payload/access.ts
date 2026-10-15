// Access rules shared by every Payload collection and global.
//
// Model: one admin (the `users` collection). Anonymous visitors may read only what the public
// site renders, and never drafts. Everything else is admin-only. These rules apply to the REST
// API and to Local API calls made with `overrideAccess: false`; the seed script and the contact
// Server Action are trusted server code and pass `overrideAccess: true` on purpose.

import type { Access, PayloadRequest } from "payload";

/** True when the request carries a logged-in admin (any `users` document is the admin). */
export function isAdminRequest(req: PayloadRequest): boolean {
  return req.user?.collection === "users";
}

export const isAdmin: Access = ({ req }) => isAdminRequest(req);

/** Public content: anyone may read. */
export const anyone: Access = () => true;

/** Nobody through the API. Trusted server code uses `overrideAccess: true`. */
export const nobody: Access = () => false;

/** Drafts collections: the admin sees everything; everyone else sees published documents only. */
export const publishedOrAdmin: Access = ({ req }) => {
  if (isAdminRequest(req)) return true;
  return { _status: { equals: "published" } };
};
