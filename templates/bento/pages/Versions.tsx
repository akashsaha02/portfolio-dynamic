import Image from "next/image";
import Link from "next/link";
import type { VersionsPageProps } from "../../types";
import { BentoPage } from "../shell";
import { ArrowUpRight, Card, Chip, LABEL, PAGE_MAIN, PAGE_TITLE } from "../ui";

// Bento Versions, /v (work plan 6.3): every design this site has had, newest first, one card
// each (period, name, description, git tag, screenshot), two to a row from md. The name's link is
// stretched over the card: the current design links home; retired ones open their frozen static
// snapshot under /v/<id>/, which is a plain file, not an app route, so a full page load.
// Server Component.

export default function Versions({ versions, ...props }: VersionsPageProps) {
  return (
    <BentoPage {...props}>
      <main id="main" tabIndex={-1} className={PAGE_MAIN}>
        <Card className="b-wide">
          <h1 className={PAGE_TITLE}>Older versions</h1>
          <p className="mt-4 text-lg text-(--fg-muted)">Every design this site has had.</p>
        </Card>
        {versions.map((v) => {
          const label = (
            <>
              {v.name}
              <ArrowUpRight className="ml-1.5" />
            </>
          );
          return (
            <Card key={v.id} as="article" lift className="flex flex-col">
              <p className={LABEL}>{v.period}</p>
              <h2 className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xl leading-snug font-semibold tracking-tight">
                {v.current ? (
                  <Link href={v.href} className="b-stretch">
                    {label}
                  </Link>
                ) : (
                  <a href={v.href} className="b-stretch">
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
                <div className="mt-auto pt-6">
                  <Image
                    src={v.image.src}
                    alt={v.image.alt}
                    width={v.image.width}
                    height={v.image.height}
                    sizes="(min-width: 1280px) 584px, (min-width: 768px) 50vw, 100vw"
                    className="w-full rounded-2xl border border-hairline"
                  />
                </div>
              ) : null}
            </Card>
          );
        })}
      </main>
    </BentoPage>
  );
}
