import type { Project } from "@/lib/content-types";
import { ProjectHoverRows } from "../motion/ProjectHoverModal";
import { TileRipple } from "../motion/TileRipple";
import { FillButton } from "../ui/FillButton";
import { Row, RowList } from "../ui/Row";
import { Note, Notes } from "../ui/Note";
import { Tile } from "../ui/Tile";
import "../desktop-fx.css";

// Recent work (guide §4.2 rows 3–4), an ink section: the featured projects as tiles, one column
// on phone and two from md, then "More work (N)" with the total count. Projects with a case study
// open /work/[slug]; the rest go straight to the live site or repo in a new tab (guide §4.4).
//
// lg with a fine pointer (work plan 1.4) gets hairline rows instead (name · kind · year): hover
// or keyboard focus dims the other rows, and a cover follows the cursor with a round "View"
// (ProjectHoverRows). Both presentations are in the HTML; desktop-fx.css shows one, keyed on the
// pointer media query, so touch at any width keeps the tiles.

type RecentWorkProps = {
  projects: Project[];
};

export function RecentWork({ projects }: RecentWorkProps) {
  const featured = projects.filter((p) => p.featured).toSorted((a, b) => a.order - b.order);
  const link = (p: Project) => ({ href: p.caseStudy ? `/work/${p.slug}` : p.url, external: !p.caseStudy });

  return (
    <section aria-labelledby="work-title" className="surface-ink f-bleed py-section">
      <h2 id="work-title" className="type-label">
        Recent work
      </h2>
      {/* Annotations (work plan 6.6): where the content comes from. */}
      <Notes className="mt-6">
        <Note id="content" />
      </Notes>
      <ul className="f-recent-tiles mt-8 grid gap-12 md:mt-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
        {featured.map((p) => (
          <li key={p.slug}>
            <Tile
              {...link(p)}
              name={p.name}
              meta={`${p.kind} · ${p.year}`}
              image={p.cover}
              // Tile width: 100vw minus the gutters on phone; half of that, minus the gap, from md.
              sizes="(min-width: 768px) 42vw, 92vw"
            />
          </li>
        ))}
      </ul>
      {/* Liquid hover on the tile covers (fine pointer only; the WebGL loads on the first hover). */}
      <TileRipple />
      <ProjectHoverRows
        items={featured.map((p) => ({ name: p.name, cover: p.cover }))}
        className="f-recent-rows mt-12"
      >
        <RowList label="Recent work">
          {featured.map((p) => (
            <Row key={p.slug} {...link(p)} name={p.name} kind={p.kind} year={p.year} />
          ))}
        </RowList>
        {/* Inside the rows' wrapper, so it shows only where the hover modal exists. */}
        <Notes className="mt-6">
          <Note id="hoverModal" />
        </Notes>
      </ProjectHoverRows>
      <div className="mt-14 flex md:mt-20 md:justify-center">
        <FillButton href="/work" size="lg" block className="md:w-auto">
          More work ({projects.length})
        </FillButton>
      </div>
    </section>
  );
}
