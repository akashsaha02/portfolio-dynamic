import Image from "next/image";
import type { ImageAsset } from "@/lib/content-types";

// Case-study hero image (guide §4.4): the desktop screenshot full bleed on phone, and from md in
// a laptop drawn with CSS (lid, camera, base; work.css .f-laptop), no mockup image. It is the
// page's LCP on phone, so it loads eagerly at high priority (not `preload`: Next 16 recommends
// these two for above-the-fold images, 03-api-reference/02-components/image.md).

export function LaptopShot({ image }: { image: ImageAsset }) {
  return (
    <figure className="f-laptop">
      <div className="f-laptop-lid">
        <div className="f-laptop-screen">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="eager"
            fetchPriority="high"
            // Phone: full bleed. md+: the screen inside the lid (86% of the content column, which
            // tops out at 76rem).
            sizes="(min-width: 1440px) 1040px, (min-width: 768px) 74vw, 100vw"
            className="block h-auto w-full"
          />
        </div>
      </div>
      <div aria-hidden="true" className="f-laptop-base" />
    </figure>
  );
}
