import type { CollectionConfig } from "payload";
import { anyone, isAdmin } from "../lib/payload/access";
import { SKILL_GROUPS } from "../lib/payload/options";
import { revalidateCollection } from "../lib/payload/revalidate";

// Toolkit groups live in lib/payload/options.ts so the data mapper can use them without Payload.
export { SKILL_GROUPS };

/**
 * Every technology name used anywhere: the About toolkit (`showInToolkit`), project stacks and
 * experience skills, which reference these documents so a name is spelled one way everywhere.
 */
export const Skills: CollectionConfig = {
  slug: "skills",
  orderable: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "group", "showInToolkit"],
    group: "Content",
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: revalidateCollection("skills"),
  fields: [
    { name: "name", type: "text", required: true, unique: true, index: true },
    {
      name: "group",
      type: "select",
      required: true,
      defaultValue: "other",
      options: SKILL_GROUPS.map((g) => ({ label: g.label, value: g.value })),
      admin: { position: "sidebar" },
    },
    {
      name: "showInToolkit",
      type: "checkbox",
      defaultValue: false,
      // The About toolkit query filters on it (lib/payload/read.ts).
      index: true,
      admin: { position: "sidebar", description: "List it in the toolkit on About." },
    },
  ],
};
