import Link from "next/link";
import type { WidgetServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import type { AvailabilityStatus } from "@/lib/content-types";
import { AvailabilityToggle } from "./AvailabilityToggle";

/** Dashboard widget: the "available for work" badge, switchable in one tap (work plan 2.6). */
export async function AvailabilityWidget({ req }: WidgetServerProps) {
  const profile = await req.payload.findGlobal({
    slug: "profile",
    depth: 0,
    select: { availability: true },
    req,
    overrideAccess: false,
  });
  const status: AvailabilityStatus = profile.availability?.status ?? "open";
  const label = profile.availability?.label ?? "";
  const profileURL = formatAdminURL({ adminRoute: req.payload.config.routes.admin, path: "/globals/profile" });

  return (
    <section className="card ak-widget" aria-labelledby="ak-availability-title">
      <header className="ak-widget__head">
        <h2 id="ak-availability-title" className="ak-widget__title">
          Availability
        </h2>
      </header>
      <AvailabilityToggle status={status} label={label} />
      <p className="ak-widget__note">Changing the status keeps the badge text, so update it if it no longer fits.</p>
      <footer className="ak-widget__foot">
        <Link href={profileURL}>Edit text in Profile → Status</Link>
      </footer>
    </section>
  );
}
