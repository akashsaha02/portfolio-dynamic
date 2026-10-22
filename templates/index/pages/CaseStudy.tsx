import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reactions } from "@/components/shared/realtime/Reactions";
import { toParagraphs } from "../../folio/work/paragraphs";
import type { CaseStudyPageProps } from "../../types";
import { IndexPage } from "../shell";
import {
  ArrowLeft,
  ArrowUpRight,
  Chips,
  EYEBROW,
  ExternalLink,
  PAGE_TITLE,
  PAGE_TOP,
  TEXT_LINK,
  projectLinks,
} from "../ui";

// Index case study, /work/[slug]: back to Work, the name (h1) and kind, the facts (role, year,
// stack, links), the cover, then Problem → What I built → How it works (with the diagram when
// there is one) → Outcome and its metrics, phone shots, live reactions and the next case. Blocks
// without content are left out. Server Component; Reactions is the shared realtime leaf.

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className={`${EYEBROW} text-(--fg-muted)`}>{label}</dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}

export default function CaseStudy({ content, settings, project, next }: CaseStudyPageProps) {
  const { caseStudy } = project;
  const { live, code } = projectLinks(project);
  const blocks = [
    { id: "problem", label: "Problem", text: caseStudy.problem },
    { id: "built", label: "What I built", text: caseStudy.built },
    { id: "how", label: "How it works", text: caseStudy.how },
    { id: "outcome", label: "Outcome", text: caseStudy.outcome },
  ].filter((b) => b.text.trim());
  const metrics = caseStudy.metrics.filter((m) => m.value && m.label);
  const { diagram } = caseStudy;

  return (
    <IndexPage content={content} settings={settings} section="work">
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <Link href="/work" className={`${TEXT_LINK} -ml-1 px-1 text-sm text-(--fg-muted)`}>
          <ArrowLeft />
          Work
        </Link>
        <h1 className={`${PAGE_TITLE} mt-6`}>{project.name}</h1>
        <p className="mt-3 text-lg text-(--fg-muted)">{project.kind}</p>

        <dl className="mt-10 grid gap-6 border-t border-hairline-on-ink pt-8 sm:grid-cols-2">
          {caseStudy.role ? (
            <Fact label="Role">
              <p className="leading-snug text-pretty">{caseStudy.role}</p>
            </Fact>
          ) : null}
          {project.year ? (
            <Fact label="Year">
              <p>{project.year}</p>
            </Fact>
          ) : null}
          {project.stack.length ? (
            <Fact label="Stack">
              <Chips items={project.stack} label={`${project.name} stack`} />
            </Fact>
          ) : null}
          {live || code ? (
            <Fact label="Links">
              <ul className="-mt-2.5 flex flex-wrap gap-x-6">
                {live ? (
                  <li>
                    <ExternalLink href={live} className={TEXT_LINK}>
                      Live<span className="sr-only"> site</span>
                      <ArrowUpRight />
                    </ExternalLink>
                  </li>
                ) : null}
                {code ? (
                  <li>
                    <ExternalLink href={code} className={TEXT_LINK}>
                      Code<span className="sr-only"> repository</span>
                      <ArrowUpRight />
                    </ExternalLink>
                  </li>
                ) : null}
              </ul>
            </Fact>
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
            // The column: max-w-3xl minus md:px-12 from md, the screen minus px-6 below.
            sizes="(min-width: 768px) 672px, calc(100vw - 3rem)"
            className="mt-12 w-full rounded-md border border-hairline-on-ink"
          />
        ) : null}

        <div className="mt-16 grid gap-14 md:mt-20">
          {blocks.map((b, i) => {
            const titleId = `${project.slug}-${b.id}`;
            const last = i === blocks.length - 1;
            return (
              <section key={b.id} aria-labelledby={titleId}>
                <h2 id={titleId} className={`${EYEBROW} text-lime`}>
                  {b.label}
                </h2>
                <div className="mt-4 grid max-w-[65ch] gap-4 leading-relaxed text-pretty text-(--fg-muted)">
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
                    sizes="(min-width: 768px) 672px, calc(100vw - 3rem)"
                    className="mt-8 w-full rounded-md bg-paper p-4"
                  />
                ) : null}
                {last && metrics.length ? (
                  <ul className="mt-10 grid gap-6 border-t border-hairline-on-ink pt-8 sm:grid-cols-3">
                    {metrics.map((m) => (
                      <li key={m.label}>
                        <p className="text-4xl leading-none font-semibold tracking-tight">{m.value}</p>
                        <p className="mt-3 max-w-[24ch] text-sm text-(--fg-muted)">{m.label}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>

        {project.phoneShots.length ? (
          <section aria-labelledby={`${project.slug}-phones`} className="mt-16 md:mt-20">
            <h2 id={`${project.slug}-phones`} className={`${EYEBROW} text-lime`}>
              On mobile
            </h2>
            <ul className="mt-6 flex flex-wrap gap-4">
              {project.phoneShots.map((shot) => (
                <li key={shot.src} className="w-36 sm:w-44">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={shot.width}
                    height={shot.height}
                    sizes="(min-width: 640px) 176px, 144px"
                    className="w-full rounded-xl border border-hairline-on-ink"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Reactions slug={project.slug} className="mt-16" />

        {next ? (
          <nav aria-label="Next case study" className="mt-16 border-t border-hairline-on-ink pt-8 md:mt-20">
            <p className={`${EYEBROW} text-(--fg-muted)`}>Next case study</p>
            <Link href={`/work/${next.slug}`} className={`${TEXT_LINK} mt-2 text-2xl tracking-tight`}>
              {next.name}
              <ArrowUpRight />
            </Link>
          </nav>
        ) : null}
      </main>
    </IndexPage>
  );
}
