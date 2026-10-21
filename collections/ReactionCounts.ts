import type { CollectionConfig } from "payload";
import { isAdmin, nobody } from "../lib/payload/access";

/**
 * Running 👏 totals per case study (work plan 6.5), one document per slug. Written ONLY by the
 * reactions route (app/(site)/api/reactions/[slug]/route.ts through lib/payload/reaction-store.ts),
 * which validates the slug, rate limits per hashed IP and increments atomically in MongoDB.
 *
 * The public reads totals through that route, never through Payload's REST API: the API refuses
 * everyone except the admin, who can look but not create, edit or delete.
 */
export const ReactionCounts: CollectionConfig = {
  slug: "reaction-counts",
  labels: { singular: "Reaction count", plural: "Reaction counts" },
  admin: {
    useAsTitle: "slug",
    defaultColumns: ["slug", "count", "updatedAt"],
    group: "Inbox",
    description: "Live 👏 totals on the case-study pages. Read-only: visitors add to them.",
  },
  defaultSort: "-count",
  access: {
    read: isAdmin,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  lockDocuments: false,
  timestamps: true,
  fields: [
    // A plain text field, not the `slug` field type: it mirrors a project slug, nothing generates it.
    { name: "slug", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: "count", type: "number", required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
  ],
};
