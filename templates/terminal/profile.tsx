import Link from "next/link";
import { CopyButton } from "@/components/shared/CopyButton";
import type { Profile } from "@/lib/content-types";
import { ExternalLink } from "../index/ui";
import { LINK, Out } from "./ui";

// Profile pieces shared by Home, About and Contact. Server Components (CopyButton is the shared
// client leaf).

/** `● Open to full-stack roles`: a lime dot while open or limited, a dim one when closed. */
export function Availability({ availability }: Pick<Profile, "availability">) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`t-dot ${availability.status === "closed" ? "opacity-40" : ""}`} />
      {availability.label}
    </span>
  );
}

/** The contact page as a command, and the email address (copies on tap, mail app as fallback). */
export function ContactLinks({ email, className = "" }: { email: string; className?: string }) {
  return (
    <div className={`grid gap-3 sm:flex sm:flex-wrap ${className}`}>
      <Link href="/contact" className="t-btn">
        <span aria-hidden="true">./</span>
        contact
      </Link>
      <EmailButton email={email} />
    </div>
  );
}

export function EmailButton({ email }: { email: string }) {
  return (
    <CopyButton
      value={email}
      status="Email address copied"
      fallbackHref={`mailto:${email}`}
      aria-label={`Copy email address ${email}`}
      className="group t-btn t-ghost"
    >
      <span aria-hidden="true" className="t-wrap group-data-copied:hidden">
        {email}
      </span>
      <span aria-hidden="true" className="hidden text-lime group-data-copied:inline">
        copied to clipboard
      </span>
    </CopyButton>
  );
}

export function Socials({ socials, className = "" }: Pick<Profile, "socials"> & { className?: string }) {
  if (!socials.length) return null;
  return (
    <ul aria-label="Socials" className={`-ml-1 flex flex-wrap gap-x-4 ${className}`}>
      {socials.map((s) => (
        <li key={s.url}>
          <ExternalLink href={s.url} className={`${LINK} px-1`}>
            {s.label}
            <Out />
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}
