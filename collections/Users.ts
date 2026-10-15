import type { CollectionConfig } from "payload";
import { Forbidden } from "payload";
import { isAdmin, isAdminRequest } from "../lib/payload/access";

/**
 * The single admin. There is no public sign-up:
 * - `create` is admin-only, and a beforeChange hook refuses a second user, so the site has
 *   exactly one account.
 * - Payload's /admin/create-first-user works only while the collection is empty. Create the admin
 *   right after the first deploy (or seed it with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
 */
export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    group: "Admin",
  },
  auth: {
    // Brute-force brake: lock the account for 15 minutes after 5 failed logins.
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    // 8 hours, then sign in again.
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      sameSite: "Lax",
      // HTTPS-only cookie on Vercel. Local `next dev` / `next start` run on http://localhost.
      secure: process.env.VERCEL === "1",
    },
  },
  access: {
    admin: ({ req }) => isAdminRequest(req),
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    unlock: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ operation, req, data }) => {
        if (operation !== "create") return data;
        const { totalDocs } = await req.payload.count({ collection: "users", req, overrideAccess: true });
        if (totalDocs > 0) throw new Forbidden(req.t);
        return data;
      },
    ],
  },
  fields: [{ name: "name", type: "text" }],
};
