import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/content-types";
import { ArrowRight } from "../ui/icons";

// "Next project → Nook" (guide §4.4) with the next case's tile image. One link: the name, whose
// ::after stretches over the block (.f-tile in folio.css, which also rings the whole block on
// focus and zooms the image on a fine-pointer hover). Phone: stacked; md+: name left, image right.
// The cursor-following image is a later desktop enhancement (work plan 1.4).

export function NextProject({ project }: { project: Project }) {
  const image = project.cover;

  return (
    <section aria-labelledby="next-title" className="f-bleed pb-section">
      <div className="border-t border-(--rule) pt-10 md:pt-14">
        <article className="f-tile f-next grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8 lg:gap-x-12">
          <div className="md:col-span-5">
            <h2 id="next-title" className="type-label">
              Next project
            </h2>
            <p className="mt-4 type-display">
              <Link href={`/work/${project.slug}`} className="f-tile-link inline-flex items-center gap-[0.25em]">
                {project.name}
                <ArrowRight className="f-next-arrow size-[0.6em] shrink-0" />
              </Link>
            </p>
            <p className="mt-3 type-label">{project.kind}</p>
          </div>
          {image ? (
            <div className="f-tile-media aspect-[16/10] overflow-hidden rounded-2xl md:col-span-7">
              <Image
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                // Phone: content width. md+: 7 of 12 columns.
                sizes="(min-width: 768px) 52vw, 92vw"
                className="size-full object-cover object-top"
              />
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
