import type { CollectionConfig } from "payload";
import { anyone, isAdmin } from "../lib/payload/access";
import { revalidateCollection } from "../lib/payload/revalidate";

/** Degrees. Field names follow `Education` in lib/content-types.ts. */
export const Education: CollectionConfig = {
  slug: "education",
  orderable: true,
  labels: { singular: "Degree", plural: "Education" },
  admin: {
    useAsTitle: "degree",
    defaultColumns: ["degree", "place", "period"],
    group: "Content",
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: revalidateCollection("education"),
  fields: [
    { name: "degree", type: "text", required: true },
    { name: "place", type: "text", required: true },
    { name: "period", type: "text", required: true, admin: { description: "Display period, e.g. 2021 – 2025." } },
    { name: "detail", type: "textarea", required: true },
    {
      name: "short",
      type: "group",
      admin: { description: "Short forms for one-line summaries, e.g. “B.Tech CSE · 8.92/10 · KIIT”. Optional." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "degree", type: "text" },
            { name: "grade", type: "text" },
            { name: "place", type: "text" },
          ],
        },
      ],
    },
  ],
};
