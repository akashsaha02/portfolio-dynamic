// Folio version archive, /v (work plan 6.3, guide §12): every design this site has had, newest
// first, as cards: screenshot (or the name set large when there is none), name, period, a
// "Current" badge on the live one, the description. The whole card is one link (the name's
// ::after, as .f-tile). Snapshots are static files under public/v/<id>/, outside the app, so they
// get a plain <a> and a full page load; the current design links home. One column on phone, two
// from md. Server Component, no client JS of its own; styles in more-pages.css (.f-version).

import Image from "next/image";
import Link from "next/link";
import type { VersionEntry } from "@/lib/versions";
import type { VersionsPageProps } from "../../types";
import { FolioShell } from "../shell/FolioShell";
import { Chip } from "../ui/Chip";
import { ArrowRight, ArrowUpRight } from "../ui/icons";
import "../more-pages.css";

function VersionCard({ version, eager }: { version: VersionEntry; eager: boolean }) {
  const { name, period, description, href, image, current } = version;
  const label = (
    <>
      {name}
      <span className="sr-only">{current ? ", the current design" : ", open the snapshot"}</span>
    </>
  );

  return (
    <article className="f-tile f-version">
      <div className="f-tile-media aspect-[16/10] overflow-hidden rounded-2xl bg-(--paper-2)">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            // Card width: the content width on phone, half of it from md.
            sizes="(min-width: 768px) 42vw, 92vw"
            loading={eager ? "eager" : undefined}
            className="size-full object-cover object-top"
          />
        ) : (
          <span aria-hidden="true" className="f-version-placeholder">
            {name}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="type-heading">
          {current ? (
            <Link href={href} className="f-tile-link inline-flex items-center gap-[0.3em]">
              {label}
              <ArrowRight className="f-next-arrow size-[0.6em]" />
            </Link>
          ) : (
            <a href={href} className="f-tile-link inline-flex items-center gap-[0.3em]">
              {label}
              <ArrowUpRight className="f-next-arrow size-[0.6em]" />
            </a>
          )}
        </h2>
        {current ? (
          <Chip variant="solid" dot>
            Current
          </Chip>
        ) : null}
      </div>
      <p className="mt-1 type-label">{period}</p>
      <p className="mt-4 max-w-[46ch] leading-relaxed text-pretty text-(--fg-muted)">{description}</p>
    </article>
  );
}

export default function Versions({ content, settings, versions }: VersionsPageProps) {
  return (
    <FolioShell content={content} settings={settings} title="Older versions">
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="f-bleed pt-[calc(var(--section-y)/2)] pb-section">
          <h1 className="type-display">Older versions</h1>
          <p className="mt-6 max-w-[40ch] type-lead text-(--fg-muted) md:mt-8">
            Every design this site has had, newest first. Older ones are frozen snapshots.
          </p>

          <ul className="mt-12 grid gap-14 md:mt-20 md:grid-cols-2 md:gap-x-8 md:gap-y-20 lg:gap-x-12">
            {versions.map((v, i) => (
              <li key={v.id}>
                <VersionCard version={v} eager={i === 0} />
              </li>
            ))}
          </ul>
        </div>
      </main>
    </FolioShell>
  );
}
