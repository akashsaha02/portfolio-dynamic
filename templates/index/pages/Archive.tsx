import Link from "next/link";
import type { TemplateProps } from "../../types";
import { IndexPage } from "../shell";
import { ArrowUpRight, Chips, ExternalLink, PAGE_TITLE, PAGE_TOP, hostOf, projectHref, projectLinks } from "../ui";

// Index Archive, /archive: every project in one table, newest first: Year · Project · Kind ·
// Built with · Links. Phone keeps Year and Project (the name is the link, and the kind sits under
// it); Links join from sm, Kind from md, Built with from lg. Server Component.

/** The latest year in a display year: "2026" → 2026, "2024–25" → 2025. Unknown sorts last. */
function latestYear(year: string) {
  const m = /(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/.exec(year);
  if (!m) return 0;
  if (!m[2]) return Number(m[1]);
  return Number(m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]);
}

const TH = "py-3 pr-4 text-xs font-semibold tracking-widest uppercase text-(--fg-muted)";

export default function Archive(props: TemplateProps) {
  // Stable sort: projects from the same year keep the content's order.
  const projects = props.content.projects.toSorted((a, b) => latestYear(b.year) - latestYear(a.year));

  return (
    <IndexPage {...props} current="archive" wide>
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <h1 id="archive-title" className={PAGE_TITLE}>
          Archive
        </h1>
        <p className="mt-4 text-lg text-(--fg-muted)">Every project, by year.</p>

        <table aria-labelledby="archive-title" className="mt-12 w-full border-collapse text-left md:mt-16">
          <thead className="border-b border-hairline-on-ink">
            <tr>
              <th scope="col" className={TH}>
                Year
              </th>
              <th scope="col" className={TH}>
                Project
              </th>
              <th scope="col" className={`${TH} hidden md:table-cell`}>
                Kind
              </th>
              <th scope="col" className={`${TH} hidden lg:table-cell`}>
                Built with
              </th>
              <th scope="col" className={`${TH} hidden pr-0 sm:table-cell`}>
                Links
              </th>
            </tr>
          </thead>
          <tbody>
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
                <tr key={p.slug} className="border-b border-hairline-on-ink align-top">
                  <td className="py-4 pr-4 text-sm whitespace-nowrap text-(--fg-muted) tabular-nums">{p.year}</td>
                  <th scope="row" className="py-4 pr-4 font-medium">
                    {external ? (
                      <ExternalLink href={href} className="i-link -my-2.5 inline-flex min-h-11 items-center gap-1.5">
                        {name}
                      </ExternalLink>
                    ) : (
                      <Link href={href} className="i-link -my-2.5 inline-flex min-h-11 items-center gap-1.5">
                        {name}
                        <span className="sr-only"> case study</span>
                      </Link>
                    )}
                    <span className="mt-1 block text-sm font-normal text-(--fg-muted) md:hidden">{p.kind}</span>
                  </th>
                  <td className="hidden py-4 pr-4 text-sm text-(--fg-muted) md:table-cell">{p.kind}</td>
                  <td className="hidden py-4 pr-4 lg:table-cell">
                    <Chips items={p.stack} label={`${p.name} stack`} />
                  </td>
                  <td className="hidden py-4 text-sm sm:table-cell">
                    <ul className="-my-2.5 grid">
                      {live ? (
                        <li>
                          <ExternalLink href={live} className="i-link inline-flex min-h-11 items-center gap-1.5">
                            {hostOf(live)}
                            <ArrowUpRight />
                          </ExternalLink>
                        </li>
                      ) : null}
                      {code ? (
                        <li>
                          <ExternalLink href={code} className="i-link inline-flex min-h-11 items-center gap-1.5">
                            Code<span className="sr-only"> repository for {p.name}</span>
                            <ArrowUpRight />
                          </ExternalLink>
                        </li>
                      ) : null}
                    </ul>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </IndexPage>
  );
}
