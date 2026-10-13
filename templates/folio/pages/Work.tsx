// Folio Work index (guide §4.3, work plan 1.5): h1 "Work", filter chips, then every project.
// Phone, tablet and touch get tiles (one column, two from md); lg with a fine pointer starts on
// hairline rows (Project · Kind · Stack · Year) and can switch to the two-column tiles. Both
// presentations are in the HTML; work.css shows one, keyed on the pointer media query, never on
// width alone. Server Component; WorkBrowser is the only client leaf.

import type { Project } from "@/lib/content-types";
import type { TemplateProps } from "../../types";
import { ProjectHoverRows } from "../motion/ProjectHoverModal";
import { FolioShell } from "../shell/FolioShell";
import { ROW_COLUMNS_4, Row, RowList } from "../ui/Row";
import { Tile } from "../ui/Tile";
import { WorkBrowser, type WorkFilter } from "../work/WorkBrowser";
import "../work.css";

/** Where the tiles are the first view: everything except lg with a fine pointer (work.css). */
const TILES_FIRST = "not all and (min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Case studies open in place; everything else goes to the live site (or repo) in a new tab. */
function projectLink(p: Project) {
  return p.caseStudy ? { href: `/work/${p.slug}`, external: false } : { href: p.url, external: true };
}

export default function Work({ content, settings }: TemplateProps) {
  const { projects } = content;
  const counts: Record<WorkFilter, number> = {
    all: projects.length,
    fullstack: projects.filter((p) => p.type === "fullstack").length,
    ml: projects.filter((p) => p.type === "ml").length,
  };

  return (
    <FolioShell content={content} settings={settings} current="work">
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="f-bleed pt-[calc(var(--section-y)/2)] pb-section">
          <h1 className="type-display">Work</h1>

          <WorkBrowser counts={counts}>
            <ul className="f-work-tiles mt-10 grid gap-12 md:mt-14 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
              {projects.map((p, i) => (
                <li key={p.slug} data-group={p.type}>
                  <Tile
                    {...projectLink(p)}
                    name={p.name}
                    meta={`${p.kind} · ${p.year}`}
                    image={p.cover}
                    headingLevel="h2"
                    eager={i === 0}
                    // Hidden behind the list view on a fine-pointer lg screen: eager elsewhere only.
                    eagerMedia={TILES_FIRST}
                    // Tile width: 100vw minus the gutters on phone; half of that, minus the gap, from md.
                    sizes="(min-width: 768px) 42vw, 92vw"
                  />
                </li>
              ))}
            </ul>

            <div className="f-work-rows mt-14">
              {/* Column labels for sighted users; each row link reads its own cells. */}
              <div
                aria-hidden="true"
                className={`grid gap-x-6 px-6 pb-5 type-label ${ROW_COLUMNS_4}`}
              >
                <span>Project</span>
                <span>Kind</span>
                <span>Stack</span>
                <span className="text-right">Year</span>
              </div>
              {/* Cursor cover preview on hover (work plan 1.4); fine pointer only. */}
              <ProjectHoverRows items={projects.map((p) => ({ name: p.name, cover: p.cover }))}>
                <RowList label="Projects">
                  {projects.map((p) => (
                    <Row
                      key={p.slug}
                      {...projectLink(p)}
                      name={p.name}
                      kind={p.kind}
                      stack={p.stack.join(", ")}
                      year={p.year}
                      group={p.type}
                    />
                  ))}
                </RowList>
              </ProjectHoverRows>
            </div>
          </WorkBrowser>
        </div>
      </main>
    </FolioShell>
  );
}
