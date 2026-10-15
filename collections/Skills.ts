import type { CollectionConfig } from "payload";
import { anyone, isAdmin } from "../lib/payload/access";
import { revalidateCollection } from "../lib/payload/revalidate";

/**
 * Toolkit groups, in display order. `SiteContent.skills` lists groups in this order, and the
 * skills inside each group in the collection's drag order.
 */
export const SKILL_GROUPS = [
  { label: "Languages", value: "languages" },
  { label: "Frameworks", value: "frameworks" },
  { label: "Data", value: "data" },
  { label: "Tools", value: "tools" },
  { label: "Other", value: "other" },
] as const;

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
      admin: { position: "sidebar", description: "List it in the toolkit on About." },
    },
  ],
};
