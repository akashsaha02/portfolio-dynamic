"use server";

// Server Action behind the dashboard's Templates widget (work plan 6.4): makes a template the one
// visitors see. Only the admin calls it.
//
// Security: a Server Action is a public POST endpoint, so it re-checks the Payload session itself,
// accepts only templates whose status is "current" (TEMPLATE_META), and writes with
// `overrideAccess: false`, i.e. under the site-settings global's own access rules (admin only).

import config from "@payload-config";
import { refresh, updateTag } from "next/cache";
import { headers } from "next/headers";
import { getPayload } from "payload";
import type { SiteSetting } from "../../payload-types";
import { CACHE_TAGS } from "../cache-tags";
import { isActivatableTemplateId, type TemplateId } from "../../templates/types";

export type ActivateTemplateResult = { ok: true; template: TemplateId } | { ok: false; error: string };

export async function activateTemplate(template: unknown): Promise<ActivateTemplateResult> {
  if (!isActivatableTemplateId(template)) return { ok: false, error: "That template can’t be activated yet." };

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (user?.collection !== "users") return { ok: false, error: "Your session ended. Sign in again." };

  try {
    const current = await payload.findGlobal({
      slug: "site-settings",
      depth: 0,
      select: { activeTemplate: true },
      user,
      overrideAccess: false,
    });
    if (current.activeTemplate === template) return { ok: true, template };

    await payload.updateGlobal({
      slug: "site-settings",
      // payload-types.ts lists only the ids that are selectable today (status "current"), which
      // is exactly what isActivatableTemplateId checked above.
      data: { activeTemplate: template as SiteSetting["activeTemplate"] },
      depth: 0,
      user,
      overrideAccess: false,
    });
  } catch (error) {
    payload.logger.error({ err: error }, "activateTemplate failed");
    return { ok: false, error: "Couldn’t save. Try again, or change it in Settings → Site settings." };
  }

  // The site-settings afterChange hook (lib/payload/revalidate.ts) already marked the tags stale
  // and revalidated the whole layout. This is a Server Action, so expire the settings tag now
  // instead: the next visitor gets the new template, not one more stale page. Then re-render the
  // dashboard so the widget shows the new active badge.
  updateTag(CACHE_TAGS.settings);
  refresh();
  return { ok: true, template };
}
