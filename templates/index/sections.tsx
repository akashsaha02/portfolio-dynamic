import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import type { Experience, Project, Publication } from "@/lib/content-types";
import { ArrowUpRight, Chip, Chips, EYEBROW, ExternalLink, projectHref } from "./ui";

// Index content blocks, used by Home and the subpages: experience, project cards, publications.
// Each is a list of cards on an 8-column grid from sm: a 2-column meta rail (period, cover, year)
// and 6 columns of content, so all three line up on the page. Server Components.

/** Home section: a sticky label bar on phone and tablet, sr-only from lg (the nav names it). */
export function HomeSection({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className="mb-24 md:mb-32 lg:mb-36">
      <div className="sticky top-0 z-20 -mx-6 mb-6 bg-ink px-6 py-5 md:-mx-12 md:px-12 lg:sr-only">
        <h2 id={titleId} className={EYEBROW}>
          {label}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function ExperienceList({ experience }: { experience: Experience[] }) {
  return (
    <ol className="i-cards grid gap-12">
      {experience.map((job) => (
        <li key={`${job.company}-${job.start}`} className="i-card grid gap-2 sm:grid-cols-8 sm:gap-8">
          <p className="mt-1 text-xs font-semibold tracking-wide text-(--fg-muted) uppercase sm:col-span-2">
            {job.period}
          </p>
          <div className="sm:col-span-6">
            <h3 className="leading-snug font-medium">
              {job.url ? (
                <ExternalLink href={job.url} className="i-card-link">
                  <span>
                    {job.title} · {job.company}
                  </span>
                  <ArrowUpRight className="ml-1.5" />
                </ExternalLink>
              ) : (
                <>
                  {job.title} · {job.company}
                </>
              )}
            </h3>
            <p className="mt-1 text-sm text-(--fg-muted)">{job.place}</p>
            {job.points.length ? (
              <ul className="mt-4 grid list-disc gap-2 pl-4 text-sm leading-relaxed text-(--fg-muted) marker:text-lime">
                {job.points.map((point) => (
                  <li key={point} className="text-pretty">
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
            <Chips items={job.skills} label={`Skills at ${job.company}`} className="mt-4" />
          </div>
        </li>
      ))}
    </ol>
  );
}

type ProjectCardsProps = {
  projects: Project[];
  /** h3 inside a Home section, h2 on the Work page. */
  headingLevel?: "h2" | "h3";
};

export function ProjectCards({ projects, headingLevel = "h3" }: ProjectCardsProps) {
  const Heading = headingLevel;
  return (
    <ul className="i-cards grid gap-12">
      {projects.map((p) => {
        const { href, external } = projectHref(p);
        const title = (
          <>
            <span>{p.name}</span>
            <ArrowUpRight className="ml-1.5" />
          </>
        );
        return (
          <li key={p.slug} className="i-card grid gap-4 sm:grid-cols-8 sm:gap-8">
            {/* Without a cover the text still starts after the rail, in line with the others. */}
            <div className={`sm:order-2 sm:col-span-6 ${p.cover ? "" : "sm:col-start-3"}`}>
              <Heading className="leading-snug font-medium">
                {external ? (
                  <ExternalLink href={href} className="i-card-link">
                    {title}
                  </ExternalLink>
                ) : (
                  <Link href={href} className="i-card-link">
                    {title}
                    <span className="sr-only"> case study</span>
                  </Link>
                )}
              </Heading>
              <p className="mt-1 text-sm text-(--fg-muted)">
                {p.kind} · {p.year}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-pretty text-(--fg-muted)">{p.summary}</p>
              <Chips items={p.stack} label={`${p.name} stack`} className="mt-4" />
            </div>
            {p.cover ? (
              <Image
                src={p.cover.src}
                alt={p.cover.alt}
                width={p.cover.width}
                height={p.cover.height}
                // A thumbnail at every width: 10rem on phone, two of eight columns from sm.
                sizes="160px"
                className="w-40 rounded-sm border border-hairline-on-ink sm:order-1 sm:col-span-2 sm:mt-1 sm:w-full"
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function PublicationItem({ pub }: { pub: Publication }) {
  const href = pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
  // Copied verbatim from the publisher; a blank field means there is none yet (as on Folio).
  const bibtex = pub.bibtex?.trim() ? pub.bibtex : undefined;

  return (
    <li className="grid gap-2 sm:grid-cols-8 sm:gap-8">
      <p className="mt-1 text-xs font-semibold tracking-wide text-(--fg-muted) uppercase sm:col-span-2">{pub.year}</p>
      <div className="sm:col-span-6">
        <Chip>{pub.statusLabel}</Chip>
        <h3 className="mt-3 leading-snug font-medium text-pretty">{pub.title}</h3>
        <p className="mt-1 text-sm text-(--fg-muted)">{pub.venue}</p>
        <p className="mt-3 text-sm leading-relaxed text-pretty text-(--fg-muted)">{pub.summary}</p>
        {href || bibtex ? (
          <div className="mt-2 flex flex-wrap gap-x-6">
            {href ? (
              <ExternalLink
                href={href}
                aria-label={`${pub.doi ? "DOI" : "Paper"}: ${pub.title} (opens in a new tab)`}
                className="i-link inline-flex min-h-11 min-w-0 items-center gap-1.5 text-sm font-medium"
              >
                <span className="break-all">{pub.doi ? `DOI ${pub.doi}` : "Paper"}</span>
                <ArrowUpRight />
              </ExternalLink>
            ) : null}
            {bibtex ? (
              <CopyButton
                value={bibtex}
                status="BibTeX copied"
                aria-label={`Copy BibTeX for ${pub.title}`}
                className="group i-link inline-flex min-h-11 items-center text-sm font-medium"
              >
                <span aria-hidden="true" className="group-data-copied:hidden">
                  Copy BibTeX
                </span>
                <span aria-hidden="true" className="hidden text-lime group-data-copied:inline">
                  Copied
                </span>
              </CopyButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function PublicationList({ publications }: { publications: Publication[] }) {
  return (
    <ol className="grid gap-12">
      {publications.map((pub) => (
        <PublicationItem key={pub.title} pub={pub} />
      ))}
    </ol>
  );
}
