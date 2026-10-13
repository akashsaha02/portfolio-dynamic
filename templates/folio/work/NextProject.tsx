import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/content-types";
import { ProjectHoverBlock } from "../motion/ProjectHoverModal";
import { ArrowRight } from "../ui/icons";

// "Next project → Nook" (guide §4.4) with the next case's tile image. One link: the name, whose
// ::after stretches over the block (.f-tile in folio.css, which also rings the whole block on
// focus and zooms the image on a fine-pointer hover). Stacked until lg, then name left, image right.
//
// Fine pointer with motion allowed (QA F-07, guide §4.4): ProjectHoverBlock swaps the static image
// for the cover following the cursor, and the name takes the full width (work.css). Touch,
// reduced motion and no-JS keep the tile image.

export function NextProject({ project }: { project: Project }) {
  const image = project.cover;

  return (
    <section aria-labelledby="next-title" className="f-bleed pb-section">
      <ProjectHoverBlock
        item={{ name: project.name, cover: image }}
        className="border-t border-(--rule) pt-10 md:pt-14"
      >
        <article className="f-tile f-next grid gap-8 md:gap-10 lg:grid-cols-12 lg:items-end lg:gap-x-12">
          <div className="f-next-text min-w-0 lg:col-span-6">
            <h2 id="next-title" className="type-label">
              Next project
            </h2>
            <p className="mt-4 type-display break-words lg:text-[clamp(3rem,0.5rem+5vw,6rem)]">
              <Link href={`/work/${project.slug}`} className="f-tile-link inline-flex items-center gap-[0.25em]">
                {project.name}
                <ArrowRight className="f-next-arrow size-[0.6em] shrink-0" />
              </Link>
            </p>
            <p className="mt-3 type-label">{project.kind}</p>
          </div>
          {image ? (
            <div className="f-next-media f-tile-media aspect-[16/10] overflow-hidden rounded-2xl lg:col-span-6">
              <Image
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                // Content width until lg, then half the content width.
                sizes="(min-width: 1024px) 42vw, 92vw"
                className="size-full object-cover object-top"
              />
            </div>
          ) : null}
        </article>
      </ProjectHoverBlock>
    </section>
  );
}
