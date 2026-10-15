import type { CollectionConfig } from "payload";
import { CONTACT_INTENT_LABELS, CONTACT_INTENTS, CONTACT_LIMITS } from "../lib/contact";
import { isAdmin, nobody } from "../lib/payload/access";

/**
 * Contact form inbox. Created ONLY by the contact Server Action (work plan 2.5), which validates
 * the input and calls `payload.create({ collection: "messages", overrideAccess: true, ... })`.
 * The API refuses creates from anyone, including the admin; read/update/delete are admin-only.
 * The admin can only toggle `read`.
 */
export const Messages: CollectionConfig = {
  slug: "messages",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "intent", "read", "createdAt"],
    group: "Inbox",
    description: "Messages from the contact form. Mark them read once handled.",
  },
  defaultSort: "-createdAt",
  access: {
    create: nobody,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      maxLength: CONTACT_LIMITS.nameMax,
      admin: { readOnly: true },
    },
    {
      name: "email",
      type: "email",
      required: true,
      admin: { readOnly: true },
    },
    {
      name: "intent",
      type: "select",
      required: true,
      options: CONTACT_INTENTS.map((value) => ({ label: CONTACT_INTENT_LABELS[value], value })),
      admin: { readOnly: true },
    },
    {
      name: "body",
      label: "Message",
      type: "textarea",
      required: true,
      maxLength: CONTACT_LIMITS.messageMax,
      admin: { readOnly: true },
    },
    {
      name: "read",
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: { position: "sidebar" },
    },
  ],
};
