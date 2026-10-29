import { CopyButton } from "@/components/shared/CopyButton";
import type { Education, Experience, Project, Publication } from "@/lib/content-types";
import { ExternalLink, hostOf, projectLinks } from "../index/ui";
import { LINK, MUTED, Out, PROSE, ProjectLink, Stack } from "./ui";

// Terminal content blocks, used by Home and the subpages: projects as `ls -l` rows, the
// experience log, publications and education. Server Components (CopyButton is the shared leaf).

type LsProps = {
  projects: Project[];
  /** Archive: every row also gets its stack and its live and code links. */
  detail?: boolean;
};

/**
 * Projects as `ls -l` output: mode, year, name, kind. A case study is a directory (`drwxr-xr-x`,
 * `name/`), anything else a symlink to its site (`lrwxrwxrwx`, `↗`). The mode column and the
 * `total` line are decoration (aria-hidden) and the mode only shows from sm; the list itself is
 * what a screen reader gets.
 */
export function LsRows({ projects, detail }: LsProps) {
  return (
    <div>
      <p aria-hidden="true" className={MUTED}>
        total {projects.length}
      </p>
      <ul className="t-ls mt-2">
        {projects.map((p) => {
          const { live, code } = projectLinks(p);
          return (
            <li key={p.slug}>
              <span aria-hidden="true" className={`t-mode ${MUTED}`}>
                {p.caseStudy ? "drwxr-xr-x" : "lrwxrwxrwx"}
              </span>
              <span className={`${MUTED} tabular-nums`}>{p.year}</span>
              <div className="flex min-w-0 flex-wrap items-center gap-x-3">
                <ProjectLink project={p} className={`${LINK} font-bold`} />
                <span className={MUTED}>{p.kind}</span>
                {detail ? (
                  <div className="basis-full pb-3">
                    <Stack items={p.stack} />
                    {live || code ? (
                      <ul className="-ml-1 flex flex-wrap gap-x-4">
                        {live ? (
                          <li className="min-w-0">
                            <ExternalLink href={live} className={`${LINK} t-wrap px-1`}>
                              <span className="sr-only">Live site: </span>
                              {hostOf(live)}
                              <Out />
                            </ExternalLink>
                          </li>
                        ) : null}
                        {code ? (
                          <li>
                            <ExternalLink href={code} className={`${LINK} px-1`}>
                              code<span className="sr-only"> repository for {p.name}</span>
                              <Out />
                            </ExternalLink>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Experience as a log: `[period]`, title @ company, place, the points as `-` lines, skills. */
export function ExperienceLog({ experience }: { experience: Experience[] }) {
  return (
    <ol className="grid gap-12">
      {experience.map((job) => (
        <li key={`${job.company}-${job.start}`}>
          <p className={MUTED}>
            <span aria-hidden="true">[</span>
            {job.period}
            <span aria-hidden="true">]</span>
          </p>
          <h3 className="mt-1 leading-snug font-bold">
            {job.title} <span className={MUTED}>@</span>{" "}
            {job.url ? (
              <ExternalLink href={job.url} className={LINK}>
                {job.company}
                <Out />
              </ExternalLink>
            ) : (
              job.company
            )}
          </h3>
          <p className={MUTED}>{job.place}</p>
          {job.points.length ? (
            <ul className={`t-dash mt-4 grid gap-2 ${PROSE}`}>
              {job.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          <Stack items={job.skills} label="skills" srLabel={`Skills at ${job.company}: `} className="mt-4" />
        </li>
      ))}
    </ol>
  );
}

function PublicationItem({ pub }: { pub: Publication }) {
  const href = pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
  // Copied verbatim from the publisher; a blank field means there is none yet (as on Folio).
  const bibtex = pub.bibtex?.trim() ? pub.bibtex : undefined;

  return (
    <li>
      <p className={MUTED}>
        {pub.year} <span className="text-lime">[{pub.statusLabel}]</span>
      </p>
      <h3 className="mt-1 leading-snug font-bold text-pretty">{pub.title}</h3>
      <p className={MUTED}>{pub.venue}</p>
      <p className={`mt-3 ${PROSE}`}>{pub.summary}</p>
      {href || bibtex ? (
        <div className="-ml-1 mt-2 flex flex-wrap gap-x-6">
          {href ? (
            <ExternalLink
              href={href}
              aria-label={`${pub.doi ? "DOI" : "Paper"}: ${pub.title} (opens in a new tab)`}
              className={`${LINK} t-wrap min-w-0 px-1`}
            >
              {pub.doi ? `doi:${pub.doi}` : "paper"}
              <Out />
            </ExternalLink>
          ) : null}
          {bibtex ? (
            <CopyButton
              value={bibtex}
              status="BibTeX copied"
              aria-label={`Copy BibTeX for ${pub.title}`}
              className={`group ${LINK} px-1`}
            >
              <span aria-hidden="true" className="group-data-copied:hidden">
                copy bibtex
              </span>
              <span aria-hidden="true" className="hidden text-lime group-data-copied:inline">
                copied
              </span>
            </CopyButton>
          ) : null}
        </div>
      ) : null}
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

/** Degrees. `itemAs` is h3 under an "Education" h2 (About), a plain line under an h3 (Home). */
export function EducationList({ education, itemAs = "p" }: { education: Education[]; itemAs?: "h3" | "p" }) {
  const Title = itemAs;
  return (
    <ul className="grid gap-8">
      {education.map((e) => (
        <li key={e.degree}>
          <Title className="leading-snug font-bold">{e.degree}</Title>
          <p className={MUTED}>
            {e.place}, {e.period}
          </p>
          <p className={`mt-2 ${PROSE} ${MUTED}`}>{e.detail}</p>
        </li>
      ))}
    </ul>
  );
}
