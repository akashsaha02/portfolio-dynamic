import Image from "next/image";
import type { ImageAsset, Project } from "@/lib/content-types";

// Sliding image rows (work plan 5.1, after dennissnellenberg.com's home page): two rows
// of project covers between Recent work and Experience that drift in opposite directions as the
// page scrolls. No JS: a CSS scroll-driven animation (folio.css .f-slide), only with a fine
// pointer, motion allowed and `animation-timeline` support. Everywhere else (phone, touch, reduced
// motion, older browsers) the rows stand still, offset by half a tile, and nothing is hidden.
//
// Only real covers (projects that have one), and nothing at all below four: two rows of the same
// two screenshots would read as a mistake. Decorative: every cover is already shown, with its alt
// text and link, in Recent work and on /work, so the strip is aria-hidden with empty alts and no
// links. Repeats share one src and one `sizes`, so each cover downloads once.

const MIN_COVERS = 4;
/** Tiles per row: enough to overfill the widest row plus its travel (see .f-slide in folio.css). */
const PER_ROW = 6;

function row(covers: ImageAsset[], start: number) {
  return Array.from({ length: Math.max(PER_ROW, covers.length) }, (_, i) => covers[(start + i) % covers.length]);
}

export function SlidingCovers({ projects }: { projects: Project[] }) {
  const covers = projects.flatMap((p) => (p.cover ? [p.cover] : []));
  if (covers.length < MIN_COVERS) return null;

  // The second row starts halfway through the list, so no cover sits above itself.
  const rows = [row(covers, 0), row(covers, Math.ceil(covers.length / 2))];

  return (
    <div aria-hidden="true" className="f-slide surface-paper">
      {rows.map((tiles, r) => (
        <div key={r} className="f-slide-row">
          {tiles.map((cover, i) => (
            <div key={i} className="f-slide-tile">
              <Image
                src={cover.src}
                alt=""
                width={cover.width}
                height={cover.height}
                // --f-slide-w in folio.css: 44vw on phone, 30vw from md, 24vw from lg.
                sizes="(min-width: 1024px) 24vw, (min-width: 768px) 30vw, 44vw"
                className="size-full object-cover object-top"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
