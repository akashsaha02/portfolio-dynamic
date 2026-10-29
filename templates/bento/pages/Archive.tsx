import Link from "next/link";
import type { Project } from "@/lib/content-types";
import { hostOf, projectHref, projectLinks } from "../../index/ui";
import type { TemplateProps } from "../../types";
import { BentoPage } from "../shell";
import { ArrowUpRight, Card, Chips, ExternalLink, PAGE_TITLE, TEXT_LINK, latestYear } from "../ui";

// Bento Archive, /archive: every project, newest year first, one card per year. Each project is
// a row: name (the case study, or the live site or repo) and kind, stack, and its links. Phone:
// the row stacks; md: name and kind | stack | links side by side. Nothing is hidden at any width.
// Server Component.

function byYear(projects: Project[]) {
  const years = new Map<string, Project[]>();
  // Stable sort: projects from the same year keep the content's order.
  for (const p of projects.toSorted((a, b) => latestYear(b.year) - latestYear(a.year))) {
    years.set(p.year, [...(years.get(p.year) ?? []), p]);
  }
  return [...years];
}

export default function Archive(props: TemplateProps) {
  return (
    <BentoPage {...props} current="archive">
      <main id="main" tabIndex={-1} className="grid gap-3 outline-none md:gap-4">
        <Card>
          <h1 className={PAGE_TITLE}>Archive</h1>
          <p className="mt-4 text-lg text-(--fg-muted)">Every project, by year.</p>
        </Card>
        {byYear(props.content.projects).map(([year, projects]) => (
          <Card key={year} as="section" aria-labelledby={`year-${year}`} className="md:grid md:grid-cols-4 md:gap-8">
            <h2 id={`year-${year}`} className="text-2xl font-semibold tracking-tight tabular-nums">
              {year}
            </h2>
            <ul className="mt-4 grid md:col-span-3 md:mt-0">
              {projects.map((p) => {
                const { href, external } = projectHref(p);
                const { live, code } = projectLinks(p);
                const name = (
                  <>
                    {p.name}
                    <ArrowUpRight />
                  </>
                );
                return (
                  <li
                    key={p.slug}
                    className="grid gap-3 border-t border-hairline py-4 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-3 md:gap-6"
                  >
                    <div>
                      <h3 className="font-medium">
                        {external ? (
                          <ExternalLink href={href} className={`${TEXT_LINK} -my-2.5`}>
                            {name}
                          </ExternalLink>
                        ) : (
                          <Link href={href} className={`${TEXT_LINK} -my-2.5`}>
                            {name}
                            <span className="sr-only"> case study</span>
                          </Link>
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-(--fg-muted)">{p.kind}</p>
                    </div>
                    <Chips items={p.stack} label={`${p.name} stack`} className="content-start" />
                    {live || code ? (
                      <ul aria-label={`${p.name} links`} className="-my-2.5 flex flex-wrap gap-x-6 text-sm md:grid">
                        {live ? (
                          <li>
                            <ExternalLink href={live} className={`${TEXT_LINK} min-w-0`}>
                              <span className="break-all">{hostOf(live)}</span>
                              <ArrowUpRight />
                            </ExternalLink>
                          </li>
                        ) : null}
                        {code ? (
                          <li>
                            <ExternalLink href={code} className={TEXT_LINK}>
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
          </Card>
        ))}
      </main>
    </BentoPage>
  );
}
