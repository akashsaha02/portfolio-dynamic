import Link from "next/link";
import type { Project } from "@/lib/content-types";
import type { TemplateProps } from "../../types";
import { BrutalPage } from "../shell";
import { ArrowUpRight, BTN, Chips, ExternalLink, MAIN, PageHead, hostOf, projectHref, projectLinks } from "../ui";

// Brutal Archive, /archive: every project by year, newest first. Each year is a section with the
// year as an oversized heading; each project a bordered row with its name (the case study, or the
// live site or repo), kind, stack and links. A list rather than a table, so nothing is hidden on
// a phone: the row stacks below md. Server Component.

/** The latest year in a display year: "2026" → 2026, "2024–25" → 2025. Unknown sorts last. */
function latestYear(year: string) {
  const m = /(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/.exec(year);
  if (!m) return 0;
  if (!m[2]) return Number(m[1]);
  return Number(m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]);
}

/** Projects grouped by their display year, newest group first; content order inside a group. */
function byYear(projects: Project[]) {
  const groups = new Map<string, Project[]>();
  for (const p of projects) {
    const key = p.year || "Undated";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups].toSorted(([a], [b]) => latestYear(b) - latestYear(a));
}

export default function Archive(props: TemplateProps) {
  const { projects } = props.content;

  return (
    <BrutalPage {...props} current="archive">
      <main id="main" tabIndex={-1} className={MAIN}>
        <PageHead tag={`${projects.length} projects`} title="Archive">
          <p>Every project, by year.</p>
        </PageHead>

        {byYear(projects).map(([year, items], g) => {
          const titleId = `year-${g}`;
          return (
            <section key={year} aria-labelledby={titleId} className="mt-12 md:mt-20">
              <h2 id={titleId} className="b-display b-h2">
                {year}
              </h2>
              <ul className="mt-6 grid gap-6">
                {items.map((p) => {
                  const { href, external } = projectHref(p);
                  const { live, code } = projectLinks(p);
                  const name = (
                    <>
                      {p.name}
                      <ArrowUpRight className="ml-2" />
                    </>
                  );
                  return (
                    <li key={p.slug} className="b-box grid gap-4 bg-paper p-4 md:grid-cols-12 md:items-start md:gap-6">
                      <div className="md:col-span-4">
                        <h3 className="text-xl leading-snug font-black uppercase">
                          {external ? (
                            <ExternalLink href={href} className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4">
                              {name}
                            </ExternalLink>
                          ) : (
                            <Link href={href} className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4">
                              {name}
                              <span className="sr-only"> case study</span>
                            </Link>
                          )}
                        </h3>
                        <p className="mt-1 font-semibold">{p.kind}</p>
                      </div>
                      <Chips items={p.stack} label={`${p.name} stack`} className="md:col-span-5" />
                      {live || code ? (
                        <ul aria-label={`${p.name} links`} className="flex flex-wrap gap-4 md:col-span-3 md:justify-end">
                          {live ? (
                            <li>
                              <ExternalLink href={live} className={`${BTN} min-w-0 bg-lime px-3 text-sm normal-case`}>
                                <span className="break-all">{hostOf(live)}</span>
                                <ArrowUpRight />
                              </ExternalLink>
                            </li>
                          ) : null}
                          {code ? (
                            <li>
                              <ExternalLink href={code} className={`${BTN} bg-paper px-3 text-sm`}>
                                Code<span className="sr-only"> repository for {p.name}</span>
                                <ArrowUpRight />
                              </ExternalLink>
                            </li>
                          ) : null}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </main>
    </BrutalPage>
  );
}
