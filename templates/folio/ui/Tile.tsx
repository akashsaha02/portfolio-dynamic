import Image, { getImageProps } from "next/image";
import { preload } from "react-dom";
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
  /** The first tile at the top of a page is its LCP on phone: load it eagerly at high priority. */
  eager?: boolean;
  /**
   * Where the tile is hidden on first paint (e.g. the Work index's list view on a fine-pointer
   * lg screen), an eager <img> would still download. With this media query the eagerness is
   * scoped: the <img> stays lazy (so a hidden one never loads) and a high-priority preload with
   * this `media` fetches the same candidate only where the query matches (QA F-09).
   */
  eagerMedia?: string;
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
  eager = false,
  eagerMedia,
  className,
}: TileProps) {
  const scoped = eager && eagerMedia !== undefined;
  if (image && scoped) {
    const { props } = getImageProps({
      src: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
      sizes,
    });
    preload(props.src, {
      as: "image",
      imageSrcSet: props.srcSet,
      imageSizes: props.sizes,
      fetchPriority: "high",
      media: eagerMedia,
    });
  }

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
            loading={eager && !scoped ? "eager" : undefined}
            fetchPriority={eager && !scoped ? "high" : undefined}
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
