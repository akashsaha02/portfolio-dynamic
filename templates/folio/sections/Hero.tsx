import Image from "next/image";
import type { Profile } from "@/lib/content-types";
import { NameMarquee } from "../motion/NameMarquee";
import { Chip } from "../ui/Chip";
import { capSizes } from "../ui/image-sizes";
import { ArrowDownRight, Globe } from "../ui/icons";

// Home hero (guide §4.2 row 1). 100svh (min 34rem), pulled up under the top bar. The cutout
// portrait stands on the bottom edge and is the LCP element, so it is preloaded and never
// revealed: no clip, no opacity, no delay (baseline L2). The name marquee crosses it; the copy
// never does (baseline L4): on phone it sits above the portrait's head, from md the location
// pill hangs off the left edge and the headline sits on the right, both clear of the figure.
//
// `data-folio-hero` tells the shell's fixed burger when the hero has left the viewport.

type HeroProps = {
  profile: Pick<Profile, "name" | "headline" | "location" | "portrait" | "availability">;
};

export function Hero({ profile }: HeroProps) {
  const { name, headline, location, portrait, availability } = profile;

  return (
    <section data-folio-hero="" aria-labelledby="hero-title" className="f-hero surface-paper">
      <h1 id="hero-title" className="sr-only">
        {name}
      </h1>

      <Image
        src={portrait.src}
        alt={portrait.alt}
        width={portrait.width}
        height={portrait.height}
        preload
        fetchPriority="high"
        // Rendered at min(64svh, 130vw) on phone and min(84svh, 92vw) from md (folio.css);
        // capped at the 1024 px source on dense screens (image-sizes.ts).
        sizes={capSizes(portrait.width, "(min-width: 1024px) 84vh, (min-width: 768px) 92vw, 130vw")}
        className="f-hero-portrait"
      />

      <NameMarquee name={name} />

      <div className="f-hero-copy">
        <p className="f-hero-pill surface-ink">
          <span>
            Based in
            <span className="block">{location}</span>
          </span>
          <span className="f-hero-globe">
            <Globe className="size-7 lg:size-8" />
          </span>
        </p>

        <div className="f-hero-role">
          <ArrowDownRight className="size-5 md:size-6" />
          <p>{headline}</p>
          <Chip variant="solid" dot={availability.status !== "closed"}>
            {availability.label}
          </Chip>
        </div>
      </div>
    </section>
  );
}
