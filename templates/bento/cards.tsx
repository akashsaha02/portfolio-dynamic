import Image from "next/image";
import Link from "next/link";
import { CopyButton } from "@/components/shared/CopyButton";
import type { Profile, Project } from "@/lib/content-types";
import { projectHref } from "../index/ui";
import { ArrowUpRight, Card, Chips, ExternalLink, PILL, TEXT_LINK } from "./ui";

// Cards and profile pieces shared by Home and the subpages. Server Components (CopyButton is the
// shared client leaf). The pure link helpers come from the Index template, so both templates
// read a project's links the same way.

type ProjectCardProps = {
  project: Project;
  /** h3 under Home's "Selected work", h2 on the Work page. */
  headingLevel: "h2" | "h3";
  sizes: string;
  /** Desktop: cover and text side by side (the card beside the big one; bento.css .b-work). */
  row?: boolean;
};

/**
 * A project as a card: the cover (inset 0.5rem, so its corners are concentric with the card's),
 * name, kind and year, summary and stack. The name's link is stretched over the card (bento.css
 * .b-stretch), so the whole card is the target; case studies open in place, the rest go to the
 * live site or repo in a new tab.
 */
export function ProjectCard({ project: p, headingLevel: Heading, sizes, row }: ProjectCardProps) {
  const { href, external } = projectHref(p);
  const title = (
    <>
      {p.name}
      <ArrowUpRight className="ml-1.5" />
    </>
  );
  return (
    <Card as="article" lift className={`flex flex-col p-2 ${row ? "lg:flex-row lg:items-start" : ""}`}>
      {p.cover ? (
        <Image
          src={p.cover.src}
          alt={p.cover.alt}
          width={p.cover.width}
          height={p.cover.height}
          sizes={sizes}
          className={`w-full rounded-2xl border border-hairline ${row ? "lg:w-1/2" : ""}`}
        />
      ) : null}
      {/* mt-auto: in a card taller than its content (the big one on desktop) the text sits low. */}
      <div className={`mt-auto p-3 pt-4 md:p-5 ${row ? "lg:mt-0 lg:flex-1" : ""}`}>
        <Heading className="text-xl leading-snug font-semibold tracking-tight">
          {external ? (
            <ExternalLink href={href} className="b-stretch">
              {title}
            </ExternalLink>
          ) : (
            <Link href={href} className="b-stretch">
              {title}
              <span className="sr-only"> case study</span>
            </Link>
          )}
        </Heading>
        <p className="mt-1 text-sm text-(--fg-muted)">
          {p.kind} · {p.year}
        </p>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-pretty text-(--fg-muted)">{p.summary}</p>
        <Chips items={p.stack} label={`${p.name} stack`} className="mt-4" />
      </div>
    </Card>
  );
}

/** Project cards in the bento work grid (bento.css .b-work sizes them by position). */
export function ProjectGrid({ projects, headingLevel }: { projects: Project[]; headingLevel: "h2" | "h3" }) {
  return (
    <div className="b-work">
      {projects.map((p, i) => (
        <ProjectCard
          key={p.slug}
          project={p}
          headingLevel={headingLevel}
          // The second card sits beside the big one on desktop with its cover beside its text, so
          // the two columns end level (with a stacked cover it would leave a gap in the big card).
          row={i === 1 && projects.length > 2}
          // Phone: one column. Tablet: the first card spans both columns. Desktop: half the board,
          // or a quarter for the side-by-side cover.
          sizes={
            i === 0
              ? "(min-width: 1280px) 624px, (min-width: 1024px) 50vw, 100vw"
              : i === 1 && projects.length > 2
                ? "(min-width: 1280px) 304px, (min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                : "(min-width: 1280px) 624px, (min-width: 768px) 50vw, 100vw"
          }
        />
      ))}
    </div>
  );
}

/** The status dot and label. The dot is decorative; the label says it. */
export function AvailabilityLine({ availability, className = "" }: Pick<Profile, "availability"> & { className?: string }) {
  return (
    <p className={`flex items-center gap-2.5 ${className}`}>
      <span aria-hidden="true" className="b-dot" data-status={availability.status} />
      {availability.label}
    </p>
  );
}

/** Socials as full-width rows, each ≥ 44 px. */
export function SocialList({ socials }: Pick<Profile, "socials">) {
  return (
    <ul className="grid">
      {socials.map((s) => (
        <li key={s.url}>
          <ExternalLink href={s.url} className={`${TEXT_LINK} w-full justify-between`}>
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
      className={`group ${PILL} max-w-full`}
    >
      <span aria-hidden="true" className="truncate group-data-copied:hidden">
        {email}
      </span>
      <span aria-hidden="true" className="hidden group-data-copied:inline">
        Copied
      </span>
    </CopyButton>
  );
}
