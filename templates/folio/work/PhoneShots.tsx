import Image from "next/image";
import type { ImageAsset } from "@/lib/content-types";

// Phone screenshots (guide §4.4): on phone a swipeable row (CSS scroll-snap, no JS) that runs to
// the screen edges with the next shot peeking in; from md the phones (two or three) stand side by
// side. Each sits in a CSS phone bezel (work.css .f-phone). The caller omits the section when
// there are no shots. A row that can scroll is focusable, so keyboard users can scroll it too.

export function PhoneShots({ shots, titleId }: { shots: ImageAsset[]; titleId: string }) {
  const scrolls = shots.length > 1;

  return (
    <ul
      className="f-phones"
      aria-labelledby={titleId}
      tabIndex={scrolls ? 0 : undefined}
      data-single={scrolls ? undefined : ""}
    >
      {shots.map((shot) => (
        <li key={shot.src} className="f-phone">
          <Image
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            // Phone ~64vw (max 18rem); md+ fixed 18rem.
            sizes="(min-width: 768px) 288px, 64vw"
            className="block h-auto w-full"
          />
        </li>
      ))}
    </ul>
  );
}
