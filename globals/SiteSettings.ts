import type { GlobalConfig } from "payload";
import { CACHE_TAGS } from "../lib/cache-tags";
import { anyone, isAdmin } from "../lib/payload/access";
import { revalidateGlobal } from "../lib/payload/revalidate";
import { link } from "../lib/payload/validate";
import { TEMPLATE_IDS } from "../templates/types";

/**
 * Site-wide settings. `activeTemplate`, `contactFormEnabled` and `announcement` map to
 * `SiteSettings` (templates/types.ts); `versionLabel` and `seo` map to `SiteContent.site`.
 */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site settings",
  admin: { group: "Settings" },
  access: {
    read: anyone,
    update: isAdmin,
  },
  hooks: { afterChange: [revalidateGlobal("site-settings", [CACHE_TAGS.settings])] },
  fields: [
    {
      name: "activeTemplate",
      type: "select",
      required: true,
      defaultValue: "editorial",
      options: TEMPLATE_IDS.map((id) => ({ label: id[0].toUpperCase() + id.slice(1), value: id })),
      admin: { description: "Which template renders the public site." },
    },
    {
      name: "versionLabel",
      type: "text",
      required: true,
      admin: { description: "Footer label, e.g. 2026 © Edition." },
    },
    {
      name: "contactFormEnabled",
      label: "Contact form on",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Off: the contact page shows the details but not the form." },
    },
    {
      name: "seo",
      label: "SEO defaults",
      type: "group",
      fields: [
        { name: "title", type: "text", required: true, admin: { description: "Default document title (home)." } },
        { name: "description", type: "textarea", required: true, admin: { description: "Default meta description." } },
        {
          name: "ogImage",
          label: "Fallback Open Graph image",
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image" } },
          admin: { description: "1200 × 630. Used when a page has no image of its own." },
        },
      ],
    },
    {
      name: "announcement",
      type: "group",
      admin: { description: "Optional site-wide banner." },
      fields: [
        { name: "enabled", label: "Show the banner", type: "checkbox", defaultValue: false },
        {
          name: "text",
          type: "text",
          validate: (value: string | null | undefined, { siblingData }: { siblingData: unknown }) =>
            !(siblingData as { enabled?: boolean } | undefined)?.enabled ||
            Boolean(value?.trim()) ||
            "Required while the banner is on.",
        },
        {
          name: "url",
          label: "Link",
          type: "text",
          validate: link(),
          admin: { description: "Optional. A path like /work or a full https:// link." },
        },
      ],
    },
  ],
};
