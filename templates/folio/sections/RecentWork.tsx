import type { Project } from "@/lib/content-types";
import { FillButton } from "../ui/FillButton";
import { Tile } from "../ui/Tile";

// Recent work (guide §4.2 rows 3–4), an ink section: the featured projects as tiles, one column
// on phone and two from md, then "More work (N)" with the total count. Projects with a case study
// open /work/[slug]; the rest go straight to the live site or repo in a new tab (guide §4.4).
// The lg + fine-pointer list rows and cursor modal are work plan 1.4.

type RecentWorkProps = {
  projects: Project[];
};

export function RecentWork({ projects }: RecentWorkProps) {
  const featured = projects.filter((p) => p.featured).toSorted((a, b) => a.order - b.order);

  return (
    <section aria-labelledby="work-title" className="surface-ink f-bleed py-section">
      <h2 id="work-title" className="type-label">
        Recent work
      </h2>
      <ul className="mt-8 grid gap-12 md:mt-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
        {featured.map((p) => (
          <li key={p.slug}>
            <Tile
              href={p.caseStudy ? `/work/${p.slug}` : p.url}
              external={!p.caseStudy}
              name={p.name}
              meta={`${p.kind} · ${p.year}`}
              image={p.cover}
              // Tile width: 100vw minus the gutters on phone; half of that, minus the gap, from md.
              sizes="(min-width: 768px) 42vw, 92vw"
            />
          </li>
        ))}
      </ul>
      <div className="mt-14 flex md:mt-20 md:justify-center">
        <FillButton href="/work" size="lg" block className="md:w-auto">
          More work ({projects.length})
        </FillButton>
      </div>
    </section>
  );
}
