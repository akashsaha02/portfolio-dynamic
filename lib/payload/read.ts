// Local API reads behind lib/data.ts (and scripts/verify-parity.ts).
//
// Access rules stay in force (`overrideAccess: false`, docs/decisions/rest-reads.md): without a
// user that means published documents only. Draft mode passes the signed-in admin and
// `draft: true` to see the latest drafts. One query per collection/global, all in parallel,
// relationships populated by `depth: 1` (skills, media), so there are no per-item lookups.
// No Next imports: the caller passes the Payload instance.

import type { Payload, TypedUser } from "payload";
import type { ContentDocs, SettingsDoc } from "./map";

export type ReadOptions = {
  /** Latest drafts instead of the published versions. Only with an admin `user`. */
  draft: boolean;
  /** The admin in draft mode; undefined = anonymous (published only). */
  user?: TypedUser;
};

export async function readContentDocs(payload: Payload, { draft, user }: ReadOptions): Promise<ContentDocs> {
  if (draft && !user) throw new Error("Draft reads need the signed-in admin.");
  const access = { overrideAccess: false, user, draft } as const;
  const list = { ...access, pagination: false, sort: "_order" } as const;

  const [profile, siteSettings, projects, experience, publications, toolkit, education] = await Promise.all([
    payload.findGlobal({ ...access, slug: "profile", depth: 1 }),
    payload.findGlobal({ ...access, slug: "site-settings", depth: 1, select: { versionLabel: true, seo: true } }),
    // nextProject isn't in the contract; leaving it out also skips its per-document access hook.
    payload.find({ ...list, collection: "projects", depth: 1, select: { nextProject: false } }),
    payload.find({ ...list, collection: "experience", depth: 1 }),
    payload.find({ ...list, collection: "publications", depth: 0 }),
    payload.find({ ...list, collection: "skills", depth: 0, where: { showInToolkit: { equals: true } } }),
    payload.find({ ...list, collection: "education", depth: 0 }),
  ]);

  return {
    profile,
    siteSettings,
    projects: projects.docs,
    experience: experience.docs,
    publications: publications.docs,
    toolkit: toolkit.docs,
    education: education.docs,
  };
}

export async function readSettingsDoc(payload: Payload): Promise<SettingsDoc> {
  return payload.findGlobal({
    slug: "site-settings",
    depth: 0,
    overrideAccess: false,
    select: { activeTemplate: true, contactFormEnabled: true, announcement: true },
  });
}
