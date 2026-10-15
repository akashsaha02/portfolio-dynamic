import type { CollectionConfig } from "payload";
import { APIError, Forbidden } from "payload";
import { isAdmin, isAdminRequest } from "../lib/payload/access";

/**
 * Payload's /admin/create-first-user (POST /api/users/first-register) lets anyone create the admin
 * while the collection is empty. On a Vercel deployment (production or preview, `VERCEL_ENV` set)
 * that window is closed (QA F-04): seed the admin with `npm run seed` before the database is
 * connected, or set ALLOW_FIRST_USER=1 for one deploy. Local dev, e2e and the seed / reset scripts
 * are unaffected: the guard only refuses anonymous creates coming through REST, never the Local API.
 */
function firstUserSignupAllowed(): boolean {
  return !process.env.VERCEL_ENV || process.env.ALLOW_FIRST_USER === "1";
}

/**
 * The single admin. There is no public sign-up:
 * - `create` is admin-only, and a beforeChange hook refuses a second user, so the site has
 *   exactly one account.
 * - The first user comes from the seed (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD) or, locally,
 *   /admin/create-first-user. See `firstUserSignupAllowed` for deployments.
 * - Lost password: `npm run admin:reset-password` (docs/admin-guide.md).
 */
export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    group: "Settings",
    description: "Your login. Keep exactly one account here.",
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
    beforeOperation: [
      ({ operation, req }) => {
        // first-register runs `create` with overrideAccess, so access rules don't stop it; this does.
        if (operation === "create" && !req.user && req.payloadAPI !== "local" && !firstUserSignupAllowed()) {
          throw new APIError(
            "Creating the first admin from the browser is turned off on this deployment. Seed the admin instead.",
            403,
            null,
            true,
          );
        }
      },
    ],
    beforeChange: [
      async ({ operation, req, data }) => {
        if (operation !== "create") return data;
        // find, not count: MongoDB can't run `count` inside the create transaction.
        const { docs } = await req.payload.find({
          collection: "users",
          req,
          overrideAccess: true,
          depth: 0,
          limit: 1,
          pagination: false,
          select: {},
        });
        if (docs.length > 0) throw new Forbidden(req.t);
        return data;
      },
    ],
  },
  fields: [{ name: "name", type: "text" }],
};
