import type { GlobalConfig } from "payload";
import { anyone, isAdmin } from "../lib/payload/access";
import { revalidateGlobal } from "../lib/payload/revalidate";
import { day, httpUrl } from "../lib/payload/validate";

/**
 * Who Akash is. Field names follow `Profile` in lib/content-types.ts. Mapped in lib/data.ts:
 * uploads → `ImageAsset` / `resumeUrl`, `now.text` empty → no `now`, `phone` empty → omitted.
 * Tabs are layout only; they don't nest the data.
 */
export const Profile: GlobalConfig = {
  slug: "profile",
  admin: { group: "Settings" },
  access: {
    read: anyone,
    update: isAdmin,
  },
  hooks: { afterChange: [revalidateGlobal("profile")] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Identity",
          fields: [
            {
              type: "row",
              fields: [
                { name: "name", type: "text", required: true },
                { name: "role", type: "text", required: true, admin: { description: "e.g. Full-stack developer" } },
              ],
            },
            {
              name: "headline",
              type: "text",
              required: true,
              admin: { description: "Hero tagline under the name." },
            },
            {
              type: "row",
              fields: [
                { name: "location", type: "text", required: true, admin: { description: "e.g. Dhaka, Bangladesh" } },
                {
                  name: "timezone",
                  type: "text",
                  required: true,
                  defaultValue: "Asia/Dhaka",
                  validate: (value: string | null | undefined) => {
                    if (!value) return "Required.";
                    try {
                      new Intl.DateTimeFormat("en", { timeZone: value });
                      return true;
                    } catch {
                      return "Use an IANA time zone, e.g. Asia/Dhaka.";
                    }
                  },
                  admin: { description: "IANA time zone for the local-time clock." },
                },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "email", type: "email", required: true },
                {
                  name: "phone",
                  type: "text",
                  admin: { description: "Public on the site when filled in. Leave empty to keep it private." },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "portrait",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  filterOptions: { mimeType: { contains: "image" } },
                  admin: { description: "Cutout portrait." },
                },
                {
                  name: "avatar",
                  type: "upload",
                  relationTo: "media",
                  filterOptions: { mimeType: { contains: "image" } },
                  admin: { description: "Small square avatar for the footer." },
                },
              ],
            },
          ],
        },
        {
          label: "About",
          fields: [
            {
              name: "intro",
              type: "textarea",
              required: true,
              admin: { description: "Two sentences. Used on Home and as the base meta description." },
            },
            {
              name: "statement",
              type: "textarea",
              required: true,
              admin: { description: "Large statement on Home and About." },
            },
            { name: "about", type: "textarea", required: true, admin: { description: "Longer about paragraph." } },
            {
              name: "services",
              type: "array",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "number", type: "text", required: true, admin: { description: "Display label, e.g. 01" } },
                    { name: "title", type: "text", required: true },
                  ],
                },
                { name: "body", type: "textarea", required: true },
              ],
            },
            {
              name: "greetings",
              type: "array",
              admin: { description: "Preloader words, in display order." },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "text", type: "text", required: true },
                    {
                      name: "lang",
                      type: "text",
                      required: true,
                      admin: { description: "BCP 47 tag, e.g. bn" },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Links",
          fields: [
            {
              name: "socials",
              type: "array",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "label", type: "text", required: true },
                    { name: "url", type: "text", required: true, validate: httpUrl({ required: true }) },
                  ],
                },
              ],
            },
            {
              name: "resume",
              label: "Résumé (PDF)",
              type: "upload",
              relationTo: "media",
              filterOptions: { mimeType: { equals: "application/pdf" } },
              admin: { description: "/resume serves the latest upload." },
            },
          ],
        },
        {
          label: "Status",
          fields: [
            {
              name: "availability",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "status",
                      type: "select",
                      required: true,
                      defaultValue: "open",
                      options: [
                        { label: "Open", value: "open" },
                        { label: "Limited", value: "limited" },
                        { label: "Closed", value: "closed" },
                      ],
                    },
                    {
                      name: "label",
                      type: "text",
                      required: true,
                      admin: { description: "Short badge text, e.g. Open to full-stack roles." },
                    },
                  ],
                },
              ],
            },
            {
              name: "now",
              type: "group",
              admin: { description: "The “Now” line on About. Leave the text empty to hide it." },
              fields: [
                { name: "text", type: "textarea" },
                {
                  name: "updated",
                  type: "text",
                  validate: day(),
                  admin: { description: "Last updated, YYYY-MM-DD. Change it whenever the text changes." },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
