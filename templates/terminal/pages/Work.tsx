import Link from "next/link";
import type { TemplateProps } from "../../types";
import { MAIN, TerminalPage } from "../shell";
import { H1, LINK, MUTED, PROSE, ProjectLink, Prompt, Stack } from "../ui";

// Terminal Work, /work: `ls ~/work` with every project in the content's order, each as its name
// (h2, the link), kind and year, summary and stack. Case studies open in place, the rest go to the
// live site or repo. The archive has the same projects as `ls -l` rows by year. Server Component.

export default function Work(props: TemplateProps) {
  const { projects } = props.content;
  return (
    <TerminalPage {...props} current="work" cwd="~/work">
      <main id="main" tabIndex={-1} className={MAIN}>
        <Prompt cmd="cd work && ls" />
        <h1 className={H1}>Work</h1>

        <ul className="t-list mt-10 md:mt-14">
          {projects.map((p) => (
            <li key={p.slug}>
              <h2 className="text-lg leading-snug font-bold">
                <ProjectLink project={p} />
              </h2>
              <p className={MUTED}>
                {p.kind} <span aria-hidden="true">·</span> {p.year}
              </p>
              <p className={`mt-3 ${PROSE}`}>{p.summary}</p>
              <Stack items={p.stack} className="mt-3" />
            </li>
          ))}
        </ul>

        <Link href="/archive" className={`${LINK} mt-10`}>
          <span aria-hidden="true" className={MUTED}>
            ls -l&nbsp;
          </span>
          project archive
        </Link>
      </main>
    </TerminalPage>
  );
}
