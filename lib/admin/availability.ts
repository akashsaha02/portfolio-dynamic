"use server";

// Server Action behind the dashboard's availability toggle (work plan 2.6). Lives outside
// lib/actions/ (the public site's actions) because only the admin calls it.
//
// Security: a Server Action is a public POST endpoint, so it re-checks the Payload session itself
// and writes with `overrideAccess: false`, i.e. under the profile global's own access rules.

import config from "@payload-config";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { getPayload } from "payload";
import type { AvailabilityStatus } from "../content-types";

const STATUSES: readonly AvailabilityStatus[] = ["open", "limited", "closed"];

export type SetAvailabilityResult = { ok: true; status: AvailabilityStatus } | { ok: false; error: string };

function isStatus(value: unknown): value is AvailabilityStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export async function setAvailability(status: unknown): Promise<SetAvailabilityResult> {
  if (!isStatus(status)) return { ok: false, error: "Unknown status." };

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (user?.collection !== "users") return { ok: false, error: "Your session ended. Sign in again." };

  try {
    // Keep the badge text: the group is written as a whole, so send the current label with it.
    const current = await payload.findGlobal({
      slug: "profile",
      depth: 0,
      select: { availability: true },
      user,
      overrideAccess: false,
    });
    if (current.availability?.status === status) return { ok: true, status };

    await payload.updateGlobal({
      slug: "profile",
      data: { availability: { status, label: current.availability?.label ?? "" } },
      depth: 0,
      user,
      overrideAccess: false,
    });
  } catch (error) {
    payload.logger.error({ err: error }, "setAvailability failed");
    return { ok: false, error: "Couldn’t save. Try again, or edit Profile → Status." };
  }

  // The profile afterChange hook already revalidated the public site's cache tags; this re-renders
  // the dashboard so the widget shows the saved value.
  refresh();
  return { ok: true, status };
}
