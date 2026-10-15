// Select options shared by the Payload collections and the data mapper (lib/payload/map.ts).
// Pure constants: no Payload or Next imports, so scripts and unit tests can use them.

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

/** Option labels double as the contract's `statusLabel`. */
export const PUBLICATION_STATUSES = [
  { label: "Published", value: "published" },
  { label: "Accepted", value: "accepted" },
  { label: "Submitted", value: "submitted" },
] as const;
