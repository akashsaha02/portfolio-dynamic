import Image from "next/image";
import Link from "next/link";
import { CopyButton } from "@/components/shared/CopyButton";
import type { Experience, Profile, Project, Publication } from "@/lib/content-types";
import { ArrowUpRight, BTN, Chips, ExternalLink, Tag, projectHref } from "./ui";

// Brutal content blocks, shared by Home and the subpages: project blocks with covers, experience,
// publications, and the profile pieces (availability, socials, email). Every block is a bordered
// box with a hard shadow; project blocks are one big link (the heading's, stretched). Server
// Components; CopyButton is the shared client leaf.

type ProjectBlocksProps = {
  projects: Project[];
  /** h3 inside a Home section, h2 on the Work page. */
  headingLevel?: "h2" | "h3";
};

export function ProjectBlocks({ projects, headingLevel = "h3" }: ProjectBlocksProps) {
  const Heading = headingLevel;
  // An odd count leaves a hole in two columns, so the first block takes the whole row instead.
  const wideFirst = projects.length % 2 === 1;
  return (
    <ul className="grid gap-8 md:grid-cols-2">
      {projects.map((p, i) => {
        const { href, external } = projectHref(p);
        const wide = wideFirst && i === 0;
        const title = (
          <>
            {p.name}
            <ArrowUpRight className="ml-2 size-5" />
          </>
        );
        return (
          <li key={p.slug} className={`b-card b-box flex flex-col bg-paper ${wide ? "b-wide md:col-span-2" : ""}`}>
            {p.cover ? (
              <Image
                src={p.cover.src}
                alt={p.cover.alt}
                width={p.cover.width}
                height={p.cover.height}
                // Phone: the screen minus the page padding and borders. md: half the column, or
                // 55% of it in the wide block; the column stops growing at 1280 px.
                sizes={
                  wide
                    ? "(min-width: 1280px) 660px, (min-width: 768px) 52vw, calc(100vw - 2.5rem)"
                    : "(min-width: 1280px) 590px, (min-width: 768px) 46vw, calc(100vw - 2.5rem)"
                }
                className="b-cover"
              />
            ) : null}
            <div className="flex flex-1 flex-col gap-3 p-4 md:p-6">
              <p className="flex flex-wrap gap-2">
                <span aria-hidden="true" className="b-tag bg-ink text-on-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Tag className="bg-lime">{p.year}</Tag>
                {p.caseStudy ? <Tag>Case study</Tag> : null}
              </p>
              <Heading className="b-display b-h3">
                {external ? (
                  <ExternalLink href={href} className="b-card-link">
                    {title}
                  </ExternalLink>
                ) : (
                  <Link href={href} className="b-card-link">
                    {title}
                    <span className="sr-only"> case study</span>
                  </Link>
                )}
              </Heading>
              <p className="font-bold">{p.kind}</p>
              <p className="leading-relaxed text-pretty text-muted">{p.summary}</p>
              <Chips items={p.stack} label={`${p.name} stack`} className="mt-auto pt-2" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ExperienceBlocks({ experience }: { experience: Experience[] }) {
  return (
    <ol className="grid gap-8">
      {experience.map((job) => {
        const title = `${job.title} · ${job.company}`;
        return (
          <li
            key={`${job.company}-${job.start}`}
            className="b-box grid gap-4 bg-paper p-4 md:grid-cols-4 md:gap-8 md:p-6"
          >
            <p className="flex flex-wrap content-start gap-2">
              <Tag className="bg-lime">{job.period}</Tag>
              <Tag>{job.place}</Tag>
            </p>
            <div className="md:col-span-3">
              <h3 className="text-xl leading-snug font-extrabold uppercase">
                {job.url ? (
                  <ExternalLink href={job.url} className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4">
                    {title}
                    <ArrowUpRight className="ml-1.5" />
                  </ExternalLink>
                ) : (
                  title
                )}
              </h3>
              {job.points.length ? (
                <ul className="mt-4 grid list-[square] gap-2 pl-5 leading-relaxed">
                  {job.points.map((point) => (
                    <li key={point} className="text-pretty">
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Chips items={job.skills} label={`Skills at ${job.company}`} className="mt-5" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PublicationBlock({ pub }: { pub: Publication }) {
  const href = pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
  // Copied verbatim from the publisher; a blank field means there is none yet (as on Folio).
  const bibtex = pub.bibtex?.trim() ? pub.bibtex : undefined;

  return (
    <li className="b-box flex flex-col gap-3 bg-paper p-4 md:p-6">
      <p className="flex flex-wrap gap-2">
        <Tag className="bg-lime">{pub.statusLabel}</Tag>
        <Tag>{pub.year}</Tag>
      </p>
      <h3 className="text-xl leading-snug font-extrabold text-pretty">{pub.title}</h3>
      <p className="font-bold">{pub.venue}</p>
      <p className="leading-relaxed text-pretty text-muted">{pub.summary}</p>
      {href || bibtex ? (
        <div className="mt-auto flex flex-wrap gap-4 pt-2">
          {href ? (
            <ExternalLink
              href={href}
              aria-label={`${pub.doi ? "DOI" : "Paper"}: ${pub.title} (opens in a new tab)`}
              className={`${BTN} min-w-0 bg-paper text-sm`}
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
              className={`group ${BTN} bg-lime text-sm`}
            >
              <span aria-hidden="true" className="group-data-copied:hidden">
                Copy BibTeX
              </span>
              <span aria-hidden="true" className="hidden group-data-copied:inline">
                Copied
              </span>
            </CopyButton>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function PublicationBlocks({ publications }: { publications: Publication[] }) {
  return (
    <ol className="grid gap-8 md:grid-cols-2">
      {publications.map((pub) => (
        <PublicationBlock key={pub.title} pub={pub} />
      ))}
    </ol>
  );
}

/** Availability as a sticker: a filled lime square when open or limited, hollow when closed. */
export function Availability({ availability, className = "" }: Pick<Profile, "availability"> & { className?: string }) {
  return (
    <p className={`b-tag bg-paper py-1.5 text-sm ${className}`}>
      <span aria-hidden="true" className={`b-dot ${availability.status === "closed" ? "" : "bg-lime"}`} />
      {availability.label}
    </p>
  );
}

export function Socials({ socials, className = "" }: Pick<Profile, "socials"> & { className?: string }) {
  if (!socials.length) return null;
  return (
    <ul aria-label="Socials" className={`flex flex-wrap gap-4 ${className}`}>
      {socials.map((s) => (
        <li key={s.url}>
          <ExternalLink href={s.url} className={`${BTN} bg-paper text-sm text-ink`}>
            {s.label}
            <ArrowUpRight />
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}

/** Email as a button: copies on tap, opens the mail app where the clipboard is refused. */
export function EmailButton({ email }: { email: string }) {
  return (
    <CopyButton
      value={email}
      status="Email address copied"
      fallbackHref={`mailto:${email}`}
      aria-label={`Copy email address ${email}`}
      className={`group ${BTN} max-w-full min-w-0 bg-paper text-ink normal-case`}
    >
      <span aria-hidden="true" className="truncate group-data-copied:hidden">
        {email}
      </span>
      <span aria-hidden="true" className="hidden uppercase group-data-copied:inline">
        Copied
      </span>
    </CopyButton>
  );
}
