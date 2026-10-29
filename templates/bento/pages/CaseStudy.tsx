import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reactions } from "@/components/shared/realtime/Reactions";
import { toParagraphs } from "../../folio/work/paragraphs";
import { projectLinks } from "../../index/ui";
import type { CaseStudyPageProps } from "../../types";
import { BentoPage } from "../shell";
import { ArrowLeft, ArrowUpRight, Card, Chips, ExternalLink, LABEL, PAGE_MAIN, PAGE_TITLE, TEXT_LINK } from "../ui";

// Bento case study, /work/[slug]: the title card (back to Work, the name as the h1, kind, and the
// facts: role, year, stack, links), the cover card, then Problem and What I built side by side,
// How it works (with the diagram when there is one) and Outcome full width, each metric as a
// small card, phone shots, live reactions and the next case. Cards without content are left out.
// Server Component; Reactions is the shared realtime leaf.

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
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
  // Problem and What I built share a row when both are there; everything else is full width.
  const paired = blocks.filter((b) => b.id === "problem" || b.id === "built").length === 2;
  const metrics = caseStudy.metrics.filter((m) => m.value && m.label);
  const { diagram } = caseStudy;

  return (
    <BentoPage content={content} settings={settings} section="work">
      <main id="main" tabIndex={-1} className={PAGE_MAIN}>
        <Card className="b-wide">
          <Link href="/work" className={`${TEXT_LINK} -ml-1 px-1 text-sm text-(--fg-muted)`}>
            <ArrowLeft />
            Work
          </Link>
          <h1 className={`${PAGE_TITLE} mt-4`}>{project.name}</h1>
          <p className="mt-3 text-lg text-(--fg-muted)">{project.kind}</p>

          <dl className="mt-8 grid gap-6 border-t border-hairline pt-6 sm:grid-cols-2 lg:grid-cols-4">
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
        </Card>

        {project.cover ? (
          <Card className="b-wide p-2">
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              width={project.cover.width}
              height={project.cover.height}
              // The page's LCP: eager at high priority (not preloaded; only the hero portrait is).
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1280px) 1214px, calc(100vw - 3rem)"
              className="w-full rounded-2xl"
            />
          </Card>
        ) : null}

        {blocks.map((b) => {
          const titleId = `${project.slug}-${b.id}`;
          const half = paired && (b.id === "problem" || b.id === "built");
          return (
            <Card key={b.id} as="section" aria-labelledby={titleId} className={half ? "" : "b-wide"}>
              <h2 id={titleId} className={LABEL}>
                {b.label}
              </h2>
              <div className="mt-4 grid max-w-[65ch] gap-4 leading-relaxed text-pretty">
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
                  sizes="(min-width: 1280px) 1160px, calc(100vw - 5rem)"
                  className="mt-8 w-full rounded-2xl bg-paper p-4"
                />
              ) : null}
            </Card>
          );
        })}

        {metrics.length ? (
          <ul aria-label="Outcome in numbers" className="b-wide grid gap-3 sm:grid-cols-3 md:gap-4">
            {metrics.map((m) => (
              <Card key={m.label} as="li">
                <p className="text-4xl leading-none font-semibold tracking-tight">{m.value}</p>
                <p className="mt-3 max-w-[24ch] text-sm text-(--fg-muted)">{m.label}</p>
              </Card>
            ))}
          </ul>
        ) : null}

        {project.phoneShots.length ? (
          <Card as="section" aria-labelledby={`${project.slug}-phones`} className="b-wide">
            <h2 id={`${project.slug}-phones`} className={LABEL}>
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
                    className="w-full rounded-xl border border-hairline"
                  />
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* Renders nothing when realtime is off, so the card is the component's own wrapper. */}
        <Reactions slug={project.slug} className="b-card b-wide flex items-center gap-3 py-2 text-lg tabular-nums" />

        {next ? (
          <Card as="nav" aria-label="Next case study" lift className="b-wide">
            <p className={LABEL}>Next case study</p>
            <Link href={`/work/${next.slug}`} className="b-stretch mt-3 inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
              {next.name}
              <ArrowUpRight />
            </Link>
            <p className="mt-1 text-sm text-(--fg-muted)">{next.kind}</p>
          </Card>
        ) : null}
      </main>
    </BentoPage>
  );
}
