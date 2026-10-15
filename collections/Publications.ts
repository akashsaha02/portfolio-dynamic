import type { CollectionConfig } from "payload";
import { anyone, isAdmin } from "../lib/payload/access";
import { revalidateCollection } from "../lib/payload/revalidate";
import { doi, httpUrl } from "../lib/payload/validate";

/** Option labels double as the contract's `statusLabel`. */
export const PUBLICATION_STATUSES = [
  { label: "Published", value: "published" },
  { label: "Accepted", value: "accepted" },
  { label: "Submitted", value: "submitted" },
] as const;

/** Research papers. Field names follow `Publication` in lib/content-types.ts. */
export const Publications: CollectionConfig = {
  slug: "publications",
  orderable: true,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "venue", "year", "status"],
    group: "Content",
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: revalidateCollection("publications"),
  fields: [
    { name: "title", type: "text", required: true },
    { name: "venue", type: "text", required: true },
    {
      type: "row",
      fields: [
        { name: "year", type: "text", required: true },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "submitted",
          options: PUBLICATION_STATUSES.map((s) => ({ label: s.label, value: s.value })),
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "doi", label: "DOI", type: "text", validate: doi(), admin: { description: "Bare DOI, e.g. 10.1109/…" } },
        {
          name: "url",
          label: "URL",
          type: "text",
          validate: httpUrl(),
          admin: { description: "Link to the paper (the DOI URL when there is a DOI)." },
        },
      ],
    },
    { name: "summary", type: "textarea", required: true },
    {
      name: "bibtex",
      label: "BibTeX",
      type: "textarea",
      admin: { description: "Paste the entry from the publisher (e.g. IEEE Xplore). Never hand-write it." },
    },
  ],
};
