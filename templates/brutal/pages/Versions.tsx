import Image from "next/image";
import Link from "next/link";
import type { VersionsPageProps } from "../../types";
import { BrutalPage } from "../shell";
import { ArrowUpRight, MAIN, PageHead, Tag } from "../ui";

// Brutal Versions, /v (work plan 6.3): every design this site has had, newest first, as bordered
// blocks (period and "Current" stickers, name, description, git tag, screenshot). Each block is
// one link: the current design links home; retired ones open their frozen static snapshot under
// /v/<id>/, which is a plain file, not an app route, so a full page load. Server Component.

export default function Versions({ versions, ...props }: VersionsPageProps) {
  return (
    <BrutalPage {...props}>
      <main id="main" tabIndex={-1} className={MAIN}>
        <PageHead tag={`${versions.length} designs`} title="Older versions">
          <p>Every design this site has had.</p>
        </PageHead>

        <ol className="mt-10 grid gap-8 md:mt-16 md:grid-cols-2">
          {versions.map((v) => {
            const label = (
              <>
                {v.name}
                <ArrowUpRight className="ml-2 size-5" />
              </>
            );
            return (
              <li key={v.id} className="b-card b-box flex flex-col bg-paper">
                {v.image ? (
                  <Image
                    src={v.image.src}
                    alt={v.image.alt}
                    width={v.image.width}
                    height={v.image.height}
                    sizes="(min-width: 1280px) 590px, (min-width: 768px) 46vw, calc(100vw - 2.5rem)"
                    className="b-cover"
                  />
                ) : null}
                <div className="grid content-start gap-3 p-4 md:p-6">
                  <p className="flex flex-wrap gap-2">
                    <Tag className="bg-lime">{v.period}</Tag>
                    {v.current ? <Tag className="bg-ink text-on-ink">Current</Tag> : null}
                  </p>
                  <h2 className="b-display b-h3">
                    {v.current ? (
                      <Link href={v.href} className="b-card-link">
                        {label}
                      </Link>
                    ) : (
                      <a href={v.href} className="b-card-link">
                        {label}
                      </a>
                    )}
                  </h2>
                  <p className="leading-relaxed text-pretty">{v.description}</p>
                  {v.tag ? (
                    <p className="text-sm text-muted">
                      Git tag <code className="font-mono">{v.tag}</code>
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </BrutalPage>
  );
}
