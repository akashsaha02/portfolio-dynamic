import Image from "next/image";
import type { ImageAsset } from "@/lib/content-types";
import { Action } from "./Action";

// Project tile, the touch and phone presentation of a project (guide §4.2 "Recent work", §4.3):
// 16:10 screenshot, name, "kind · year". The name is the link and its ::after stretches over the
// whole tile, so the tile is one tap target with a short accessible name; the focus ring is
// drawn around the tile (see .f-tile in folio.css).

type TileProps = {
  href: string;
  name: string;
  /** e.g. "Study abroad agency platform · 2026" */
  meta: string;
  image?: ImageAsset;
  /** Honest sizes for the grid the tile sits in, e.g. "(min-width: 768px) 50vw, 100vw". */
  sizes: string;
  /** Live sites open in a new tab; case studies don't. */
  external?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
};

export function Tile({
  href,
  name,
  meta,
  image,
  sizes,
  external,
  headingLevel: Heading = "h3",
  className,
}: TileProps) {
  return (
    <article className={`f-tile ${className ?? ""}`}>
      <div className="f-tile-media aspect-[16/10] overflow-hidden rounded-2xl bg-[color-mix(in_srgb,currentColor_8%,transparent)]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={sizes}
            className="size-full object-cover object-top"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-full items-end p-5 type-heading text-(--fg-muted) md:p-6"
          >
            {name}
          </span>
        )}
      </div>
      <Heading className="mt-5 type-heading">
        <Action href={href} external={external} className="f-tile-link">
          {name}
        </Action>
      </Heading>
      <p className="mt-1 type-label">{meta}</p>
    </article>
  );
}
