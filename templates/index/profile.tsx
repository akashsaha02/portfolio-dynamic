import { CopyButton } from "@/components/shared/CopyButton";
import type { Profile } from "@/lib/content-types";
import { ArrowUpRight, ExternalLink, TEXT_LINK } from "./ui";

// Profile pieces shared by Home, About and Contact: availability, socials, the email pill and
// the text helpers. Server Components (CopyButton is the shared client leaf).

/** `about` opens with the statement, which the left column already shows. */
export function aboutRest(about: string, statement: string) {
  return about.startsWith(statement) ? about.slice(statement.length).trim() : about;
}

/** "2026-10-10" → "10 Oct 2026", in UTC so the server and every visitor agree. */
export function formatDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

export function Availability({ availability, className = "" }: Pick<Profile, "availability"> & { className?: string }) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border border-hairline-on-ink px-3 py-1.5 text-sm ${className}`}
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${availability.status === "closed" ? "bg-on-ink/40" : "bg-lime"}`}
      />
      {availability.label}
    </p>
  );
}

export function Socials({ socials, className = "" }: Pick<Profile, "socials"> & { className?: string }) {
  if (!socials.length) return null;
  return (
    <ul aria-label="Socials" className={`-ml-2 flex flex-wrap gap-x-2 ${className}`}>
      {socials.map((s) => (
        <li key={s.url}>
          <ExternalLink href={s.url} className={`${TEXT_LINK} px-2 text-sm`}>
            {s.label}
            <ArrowUpRight />
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}

/** Email as a pill: copies on tap, opens the mail app where the clipboard is refused. */
export function EmailButton({ email }: { email: string }) {
  return (
    <CopyButton
      value={email}
      status="Email address copied"
      fallbackHref={`mailto:${email}`}
      aria-label={`Copy email address ${email}`}
      className="group i-outline inline-flex min-h-12 min-w-0 items-center justify-center rounded-full border border-hairline-on-ink px-6 font-medium"
    >
      <span aria-hidden="true" className="truncate group-data-copied:hidden">
        {email}
      </span>
      <span aria-hidden="true" className="hidden text-lime group-data-copied:inline">
        Copied
      </span>
    </CopyButton>
  );
}
