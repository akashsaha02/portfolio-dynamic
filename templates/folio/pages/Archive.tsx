// Folio project archive, /archive (work plan 6.1): every project in one table, newest first.
// Year · Project · Kind · Built with · Links (case study when there is one, live site, code).
// Phone: each project is a stacked block between hairlines, not a wide table. md: a real table,
// the kind under the name. lg: Kind gets its own column. Explicit ARIA roles keep the table
// semantics where the phone layout changes `display` (Safari drops them otherwise). Server
// Component, no client JS of its own; styles in more-pages.css (.f-archive).

import Link from "next/link";
import type { Project } from "@/lib/content-types";
import type { TemplateProps } from "../../types";
import { FolioShell } from "../shell/FolioShell";
import { ArrowRight, ArrowUpRight } from "../ui/icons";
import { projectLinks } from "../work/Facts";
import "../more-pages.css";

/** "2024–25" → 2024. Projects without a year sort last. */
function startYear(year: string) {
  const match = /\d{4}/.exec(year);
  return match ? Number(match[0]) : 0;
}

/** Newest first; the content's own order breaks ties. `projects` is already sorted by order. */
function byYear(projects: Project[]) {
  return projects.toSorted((a, b) => startYear(b.year) - startYear(a.year) || a.order - b.order);
}

const LINK = "f-link -mx-1 inline-flex min-h-11 items-center gap-1.5 px-1 font-medium";

function ProjectLinks({ project }: { project: Project }) {
  const { live, code } = projectLinks(project);

  return (
    <ul className="-mb-2.5 flex flex-wrap gap-x-5 md:-my-2.5 md:flex-nowrap md:justify-end lg:gap-x-6">
      {project.caseStudy ? (
        <li>
          <Link href={`/work/${project.slug}`} className={LINK}>
            Case study<span className="sr-only">: {project.name}</span>
            <ArrowRight />
          </Link>
        </li>
      ) : null}
      {live ? (
        <li>
          <a href={live} target="_blank" rel="noopener noreferrer" className={LINK}>
            Live<span className="sr-only"> site of {project.name} (opens in a new tab)</span>
            <ArrowUpRight />
          </a>
        </li>
      ) : null}
      {code ? (
        <li>
          <a href={code} target="_blank" rel="noopener noreferrer" className={LINK}>
            Code<span className="sr-only"> of {project.name} (opens in a new tab)</span>
            <ArrowUpRight />
          </a>
        </li>
      ) : null}
    </ul>
  );
}

export default function Archive({ content, settings }: TemplateProps) {
  const projects = byYear(content.projects);

  return (
    <FolioShell content={content} settings={settings} section="work" title="Archive">
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="f-bleed pt-[calc(var(--section-y)/2)] pb-section">
          <h1 id="archive-title" className="type-display">
            Archive
          </h1>
          <p className="mt-6 max-w-[40ch] type-lead text-(--fg-muted) md:mt-8">
            Every project, by year.{" "}
            <span className="tabular-nums">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
            .
          </p>

          <table role="table" aria-labelledby="archive-title" className="f-archive mt-12 md:mt-20">
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader" scope="col" className="f-archive-year">
                  Year
                </th>
                <th role="columnheader" scope="col">
                  Project
                </th>
                <th role="columnheader" scope="col" className="f-archive-kind">
                  Kind
                </th>
                <th role="columnheader" scope="col" className="f-archive-stack">
                  Built with
                </th>
                <th role="columnheader" scope="col" className="f-archive-links">
                  Links
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {projects.map((p) => (
                <tr key={p.slug} role="row">
                  <td role="cell" className="f-archive-year type-label tabular-nums md:text-base">
                    {p.year}
                  </td>
                  <th role="rowheader" scope="row" className="f-archive-name">
                    <span className="block text-[clamp(1.375rem,1rem+1.5vw,2rem)] leading-tight font-[450] tracking-[-0.025em]">
                      {p.name}
                    </span>
                    {/* md only: lg has the Kind column. */}
                    <span className="mt-1 block type-label lg:hidden">{p.kind}</span>
                  </th>
                  <td role="cell" className="f-archive-kind text-(--fg-muted)">
                    {p.kind}
                  </td>
                  <td role="cell" className="f-archive-stack text-(--fg-muted)">
                    {p.stack.length ? (
                      <>
                        {/* Phone has no visible header row; the cell's header names it for AT. */}
                        <span aria-hidden="true" className="type-label md:hidden">
                          Built with{" "}
                        </span>
                        {p.stack.join(", ")}
                      </>
                    ) : null}
                  </td>
                  <td role="cell" className="f-archive-links">
                    <ProjectLinks project={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </FolioShell>
  );
}
