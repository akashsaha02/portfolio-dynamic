import type { CollectionConfig, Field, FieldHook } from "payload";
import { slugField } from "payload";
import { isAdmin, isAdminRequest, publishedOrAdmin } from "../lib/payload/access";
import { revalidateCollection } from "../lib/payload/revalidate";
import { httpUrl } from "../lib/payload/validate";

type CaseStudySiblings = { enabled?: boolean | null };

/** Required only when the project has a case study. */
function requiredForCaseStudy(value: unknown, { siblingData }: { siblingData: unknown }): true | string {
  const enabled = (siblingData as CaseStudySiblings | undefined)?.enabled;
  if (!enabled) return true;
  return (typeof value === "string" && value.trim() !== "") || "Required when the case study is on.";
}

const caseStudyText = (name: string, label: string, description: string): Field => ({
  name,
  label,
  type: "textarea",
  validate: requiredForCaseStudy,
  admin: { description, condition: (_, siblingData) => Boolean(siblingData?.enabled) },
});

/**
 * `nextProject` for anyone but the admin: kept only when the target is readable by the same
 * request (published), otherwise null. Without this, a published project pointing at a draft
 * returned the draft's bare id (QA F-15). A populated object already passed the access check;
 * a bare id (depth 0, or population refused) is looked up with the anonymous access rules
 * (published only), one cheap id-only query.
 * docs/decisions/rest-reads.md.
 */
const hideUnpublishedNextProject: FieldHook = async ({ value, req }) => {
  if (value == null || isAdminRequest(req)) return value;
  if (typeof value === "object") {
    // Defence in depth for a populated draft (e.g. a parent read with overrideAccess: true).
    const status = (value as { _status?: unknown })._status;
    return status === undefined || status === "published" ? value : null;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;
  const { docs } = await req.payload.find({
    collection: "projects",
    where: { id: { equals: value } },
    overrideAccess: false,
    req,
    draft: false,
    depth: 0,
    limit: 1,
    pagination: false,
    select: {},
  });
  return docs.length > 0 ? value : null;
};

/**
 * Portfolio projects. Field names follow `Project` in lib/content-types.ts. Differences, mapped in
 * lib/data.ts (Phase 3):
 * - `order`: drag-to-reorder (`orderable`) stores a hidden `_order` key; `order` = position.
 * - `stack`: relationships to `skills`; the contract gets the names.
 * - `caseStudy.enabled`: the contract has `caseStudy` only when this is on.
 * - `nextProject`: optional "next project" override (guide §7), not in the contract yet.
 */
export const Projects: CollectionConfig = {
  slug: "projects",
  orderable: true,
  admin: {
    useAsTitle: "name",
    // Few columns so the list fits a phone; `type` and the rest are a tap away in "Columns".
    defaultColumns: ["name", "year", "featured", "_status"],
    group: "Content",
    // The reorder hint is list-only (QA F-11): a collection `description` also shows on every edit form.
    components: {
      beforeListTable: ["/components/admin/ProjectsListHint#ProjectsListHint"],
    },
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  access: {
    read: publishedOrAdmin,
    readVersions: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: revalidateCollection("projects"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({
      useAsSlug: "name",
      overrides: (row) => {
        for (const field of row.fields) {
          if ("name" in field && field.name === "slug") {
            field.admin = {
              ...field.admin,
              description: "The /work/… address. Don’t change it once published: old links would break.",
            };
          }
        }
        return row;
      },
    }),
    {
      name: "kind",
      type: "text",
      required: true,
      admin: { description: "One line, e.g. “Study abroad agency platform”." },
    },
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          defaultValue: "fullstack",
          options: [
            { label: "Full-stack", value: "fullstack" },
            { label: "Machine learning", value: "ml" },
          ],
        },
        {
          name: "year",
          type: "text",
          required: true,
          admin: { description: "Display year or range, e.g. 2026 or 2024–25." },
        },
      ],
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar", description: "Show in “Recent work” on Home." },
    },
    { name: "summary", type: "textarea", required: true },
    {
      name: "stack",
      type: "relationship",
      relationTo: "skills",
      hasMany: true,
      admin: { description: "In display order." },
    },
    {
      type: "row",
      fields: [
        {
          name: "url",
          type: "text",
          required: true,
          validate: httpUrl({ required: true }),
          admin: { description: "Live site, or the repo when there is no live site." },
        },
        {
          name: "linkLabel",
          type: "text",
          required: true,
          admin: { description: "Accessible label for that link, e.g. “Open Abroadly”." },
        },
      ],
    },
    {
      name: "repo",
      type: "text",
      validate: httpUrl(),
      admin: { description: "Public source code, when different from the link above." },
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      filterOptions: { mimeType: { contains: "image" } },
      admin: { description: "Desktop screenshot, 16:10 (e.g. 1600 × 1000 WebP)." },
    },
    {
      name: "phoneShots",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      filterOptions: { mimeType: { contains: "image" } },
      admin: { description: "Phone screenshots, in display order." },
    },
    {
      name: "caseStudy",
      type: "group",
      admin: {
        description:
          "Optional long-form write-up. Tick “Has a case study” to give the project its own page at /work/<slug> and fill in the five short sections; untick to show the project only in the /work list.",
      },
      fields: [
        {
          name: "enabled",
          label: "Has a case study",
          type: "checkbox",
          defaultValue: false,
          admin: { description: "On: the project gets its own page and the fields below appear." },
        },
        caseStudyText("role", "Role", "Short, for the facts row."),
        caseStudyText("problem", "Problem", "One short paragraph."),
        caseStudyText("built", "What I built", "One short paragraph."),
        caseStudyText("how", "How it works", "One short paragraph."),
        caseStudyText("outcome", "Outcome", "One short paragraph."),
        {
          name: "metrics",
          type: "array",
          admin: {
            description: "Only facts provable from the repo. Leave empty rather than estimate.",
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
          fields: [
            {
              type: "row",
              fields: [
                { name: "value", type: "text", required: true, admin: { description: "e.g. 96%" } },
                { name: "label", type: "text", required: true, admin: { description: "e.g. accuracy with VGG16" } },
              ],
            },
          ],
        },
        {
          name: "diagram",
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image" } },
          admin: {
            description: "Architecture diagram, normally an SVG. Its alt text should describe the flow in words.",
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
      ],
    },
    {
      name: "nextProject",
      type: "relationship",
      relationTo: "projects",
      hooks: { afterRead: [hideUnpublishedNextProject] },
      admin: {
        position: "sidebar",
        description: "Optional. Overrides the “next project” link on the case study page.",
      },
    },
  ],
};
