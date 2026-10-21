import Image from "next/image";
import Link from "next/link";
import type { VersionsPageProps } from "../../types";
import { IndexPage } from "../shell";
import { ArrowUpRight, Chip, PAGE_TITLE, PAGE_TOP } from "../ui";

// Index Versions, /v (work plan 6.3): every design this site has had, newest first, as cards on
// the same 2 + 6 column grid as Home (period, then name, description and git tag). The current
// design links home; retired ones open their frozen static snapshot under /v/<id>/, which is a
// plain file, not an app route, so a full page load. Server Component.

export default function Versions({ versions, ...props }: VersionsPageProps) {
  return (
    <IndexPage {...props}>
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <h1 className={PAGE_TITLE}>Older versions</h1>
        <p className="mt-4 text-lg text-(--fg-muted)">Every design this site has had.</p>

        <ol className="i-cards mt-12 grid gap-12 md:mt-16">
          {versions.map((v) => {
            const label = (
              <>
                <span>{v.name}</span>
                <ArrowUpRight />
              </>
            );
            const linkClass = "i-card-link inline-flex items-baseline gap-1.5";
            return (
              <li key={v.id} className="i-card grid gap-2 sm:grid-cols-8 sm:gap-8">
                <p className="mt-1 text-xs font-semibold tracking-wide text-(--fg-muted) uppercase sm:col-span-2">
                  {v.period}
                </p>
                <div className="sm:col-span-6">
                  <h2 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg leading-snug font-medium">
                    {v.current ? (
                      <Link href={v.href} className={linkClass}>
                        {label}
                      </Link>
                    ) : (
                      <a href={v.href} className={linkClass}>
                        {label}
                      </a>
                    )}
                    {v.current ? <Chip>Current</Chip> : null}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-(--fg-muted)">{v.description}</p>
                  {v.tag ? (
                    <p className="mt-2 text-xs text-(--fg-muted)">
                      Git tag <code className="font-mono">{v.tag}</code>
                    </p>
                  ) : null}
                  {v.image ? (
                    <Image
                      src={v.image.src}
                      alt={v.image.alt}
                      width={v.image.width}
                      height={v.image.height}
                      sizes="(min-width: 768px) 448px, calc(100vw - 3rem)"
                      className="mt-6 w-full rounded-md border border-hairline-on-ink"
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </IndexPage>
  );
}
