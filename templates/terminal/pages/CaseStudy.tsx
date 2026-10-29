import Image from "next/image";
import Link from "next/link";
import { Reactions } from "@/components/shared/realtime/Reactions";
import { toParagraphs } from "../../folio/work/paragraphs";
import { ExternalLink, projectLinks } from "../../index/ui";
import type { CaseStudyPageProps } from "../../types";
import { MAIN, TerminalPage } from "../shell";
import { Block, H1, LINK, MUTED, Out, PROSE, Prompt } from "../ui";

// Terminal case study, /work/[slug]: `cd ..` back to Work, `cat README.md` with the name (h1) and
// kind, the facts as `key: value` lines (role, year, stack, links), the cover, then Problem →
// What I built → How it works (with the diagram when there is one) → Outcome and its metrics,
// phone shots, live reactions and the next case. Blocks without content are left out. Server
// Component; Reactions is the shared realtime leaf.

export default function CaseStudy({ content, settings, project, next }: CaseStudyPageProps) {
  const { caseStudy, slug } = project;
  const { live, code } = projectLinks(project);
  const cwd = `~/work/${slug}`;
  const blocks = [
    { id: "problem", file: "problem.md", label: "Problem", text: caseStudy.problem },
    { id: "built", file: "built.md", label: "What I built", text: caseStudy.built },
    { id: "how", file: "how-it-works.md", label: "How it works", text: caseStudy.how },
    { id: "outcome", file: "outcome.md", label: "Outcome", text: caseStudy.outcome },
  ].filter((b) => b.text.trim());
  const metrics = caseStudy.metrics.filter((m) => m.value && m.label);
  const { diagram } = caseStudy;

  return (
    <TerminalPage content={content} settings={settings} section="work" cwd={cwd}>
      <main id="main" tabIndex={-1} className={MAIN}>
        <Link href="/work" className={`${LINK} -ml-1 px-1`}>
          <span className="sr-only">Back to </span>
          <span aria-hidden="true" className={MUTED}>
            cd ../
          </span>
          work
        </Link>

        <Prompt cmd="cat README.md" cwd={cwd} className="mt-6" />
        <h1 className={H1}>{project.name}</h1>
        <p className={`mt-2 text-lg ${MUTED}`}>{project.kind}</p>

        <dl className="t-kv mt-8">
          {caseStudy.role ? (
            <div>
              <dt className={MUTED}>role</dt>
              <dd className="text-pretty">{caseStudy.role}</dd>
            </div>
          ) : null}
          {project.year ? (
            <div>
              <dt className={MUTED}>year</dt>
              <dd>{project.year}</dd>
            </div>
          ) : null}
          {project.stack.length ? (
            <div>
              <dt className={MUTED}>stack</dt>
              <dd>{project.stack.join(", ")}</dd>
            </div>
          ) : null}
          {live || code ? (
            <div>
              <dt className={MUTED}>links</dt>
              <dd>
                <ul className="-my-3 -ml-1 flex flex-wrap gap-x-4">
                  {live ? (
                    <li>
                      <ExternalLink href={live} className={`${LINK} px-1`}>
                        live<span className="sr-only"> site</span>
                        <Out />
                      </ExternalLink>
                    </li>
                  ) : null}
                  {code ? (
                    <li>
                      <ExternalLink href={code} className={`${LINK} px-1`}>
                        code<span className="sr-only"> repository</span>
                        <Out />
                      </ExternalLink>
                    </li>
                  ) : null}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>

        {project.cover ? (
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            width={project.cover.width}
            height={project.cover.height}
            // The page's LCP: eager at high priority (not preloaded; only the hero portrait is).
            loading="eager"
            fetchPriority="high"
            // The window's column: max-w-5xl minus md:px-12 from lg; the screen minus the padding below.
            sizes="(min-width: 1072px) 928px, (min-width: 768px) calc(100vw - 9rem), (min-width: 640px) calc(100vw - 4rem), calc(100vw - 2.5rem)"
            className="t-frame mt-10 w-full"
          />
        ) : null}

        {blocks.map((b, i) => {
          const last = i === blocks.length - 1;
          return (
            <Block key={b.id} id={`${slug}-${b.id}`} cmd={`cat ${b.file}`} cwd={cwd} title={b.label}>
              <div className={`grid gap-4 ${PROSE} ${MUTED}`}>
                {(b.id === "how" ? toParagraphs(b.text) : [b.text]).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
              {b.id === "how" && diagram ? (
                <Image
                  src={diagram.src}
                  alt={diagram.alt}
                  width={diagram.width}
                  height={diagram.height}
                  sizes="(min-width: 1072px) 928px, (min-width: 768px) calc(100vw - 9rem), calc(100vw - 2.5rem)"
                  className="mt-8 w-full rounded-sm bg-paper p-4"
                />
              ) : null}
              {last && metrics.length ? (
                <ul className="mt-10 grid gap-6 sm:grid-cols-3">
                  {metrics.map((m) => (
                    <li key={m.label} className="t-note">
                      <p className="text-3xl leading-none font-bold text-lime">{m.value}</p>
                      <p className={`mt-2 ${MUTED}`}>{m.label}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Block>
          );
        })}

        {project.phoneShots.length ? (
          <Block id={`${slug}-phones`} cmd="ls screenshots/mobile" cwd={cwd} title="On mobile">
            <ul className="flex flex-wrap gap-4">
              {project.phoneShots.map((shot) => (
                <li key={shot.src} className="w-36 sm:w-44">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={shot.width}
                    height={shot.height}
                    sizes="(min-width: 640px) 176px, 144px"
                    className="t-frame w-full"
                  />
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        <Reactions slug={slug} className="t-clap mt-16" />

        {next ? (
          <nav aria-label="Next case study" className="mt-16 border-t border-hairline-on-ink pt-8 md:mt-20">
            <p className={MUTED}>next case study</p>
            <Link href={`/work/${next.slug}`} className={`${LINK} mt-1 text-xl font-bold`}>
              <span aria-hidden="true" className="text-lime">
                cd ../
              </span>
              {next.name}
            </Link>
          </nav>
        ) : null}
      </main>
    </TerminalPage>
  );
}
