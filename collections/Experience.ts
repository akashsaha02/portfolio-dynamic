import type { CollectionConfig } from "payload";
import { anyone, isAdmin } from "../lib/payload/access";
import { revalidateCollection } from "../lib/payload/revalidate";
import { httpUrl, month } from "../lib/payload/validate";

/**
 * Roles, most recent first (drag to reorder). Field names follow `Experience` in
 * lib/content-types.ts; `period` is derived from start/end in lib/data.ts, and `points` /
 * `skills` are mapped to plain strings there.
 */
export const Experience: CollectionConfig = {
  slug: "experience",
  orderable: true,
  labels: { singular: "Role", plural: "Experience" },
  admin: {
    useAsTitle: "company",
    defaultColumns: ["company", "title", "start", "end"],
    group: "Content",
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: revalidateCollection("experience"),
  fields: [
    {
      type: "row",
      fields: [
        { name: "company", type: "text", required: true },
        { name: "title", type: "text", required: true },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "place", type: "text", required: true },
        { name: "url", type: "text", validate: httpUrl() },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "start",
          type: "text",
          required: true,
          validate: month({ required: true }),
          admin: { description: "YYYY-MM" },
        },
        {
          name: "end",
          type: "text",
          validate: month(),
          admin: { description: "YYYY-MM. Leave empty for the current role." },
        },
      ],
    },
    {
      name: "points",
      type: "array",
      fields: [{ name: "text", type: "textarea", required: true }],
    },
    {
      name: "skills",
      type: "relationship",
      relationTo: "skills",
      hasMany: true,
    },
  ],
};
