import Image from "next/image";
import Link from "next/link";
import type { VersionsPageProps } from "../../types";
import { MAIN, TerminalPage } from "../shell";
import { H1, LINK, MUTED, PROSE, Prompt } from "../ui";

// Terminal Versions, /v (work plan 6.3): every design this site has had, newest first, drawn as
// `git log`: a lime ref line (`(HEAD -> current)` or the git tag), the period as the date, then the
// name (h2, the link) and the description as the message. The current design links home; retired
// ones open their frozen static snapshot under /v/<id>/, a plain file rather than an app route,
// so a full page load. Server Component.

export default function Versions({ versions, ...props }: VersionsPageProps) {
  return (
    <TerminalPage {...props} cwd="~/versions">
      <main id="main" tabIndex={-1} className={MAIN}>
        <Prompt cmd="git log" />
        <h1 className={H1}>Older versions</h1>
        <p className={`mt-3 ${MUTED}`}>Every design this site has had.</p>

        <ol className="t-list mt-10 md:mt-14">
          {versions.map((v) => {
            const link = `${LINK} text-lg font-bold`;
            return (
              <li key={v.id}>
                <p className="text-lime">
                  <span aria-hidden="true">* </span>
                  {v.id}
                  {v.current ? (
                    <>
                      {" "}
                      <span aria-hidden="true">(HEAD -&gt; </span>
                      <span className="sr-only">, </span>current<span aria-hidden="true">)</span>
                    </>
                  ) : v.tag ? (
                    <>
                      {" "}
                      <span aria-hidden="true">(</span>tag: <code>{v.tag}</code>
                      <span aria-hidden="true">)</span>
                    </>
                  ) : null}
                </p>
                <p className={MUTED}>
                  <span aria-hidden="true">Date: </span>
                  {v.period}
                </p>
                <h2 className="mt-2">
                  {v.current ? (
                    <Link href={v.href} className={link}>
                      {v.name}
                    </Link>
                  ) : (
                    <a href={v.href} className={link}>
                      {v.name}
                    </a>
                  )}
                </h2>
                <p className={`${PROSE} ${MUTED}`}>{v.description}</p>
                {v.image ? (
                  <Image
                    src={v.image.src}
                    alt={v.image.alt}
                    width={v.image.width}
                    height={v.image.height}
                    sizes="(min-width: 768px) 448px, calc(100vw - 2.5rem)"
                    className="t-frame mt-6 w-full max-w-md"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </main>
    </TerminalPage>
  );
}
