import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reactions } from "@/components/shared/realtime/Reactions";
import { toParagraphs } from "../../folio/work/paragraphs";
import type { CaseStudyPageProps } from "../../types";
import { BrutalPage } from "../shell";
import { ArrowLeft, ArrowUpRight, BTN, Chips, ExternalLink, MAIN, PageHead, Tag, projectLinks } from "../ui";

// Brutal case study, /work/[slug]: back to Work, the name (h1) and kind, the facts as a grid of
// bordered cells (role, year, stack, links), the cover in a shadowed frame, then Problem → What I
// built → How it works (with the diagram when there is one) → Outcome, each a numbered block, the
// metrics as lime slabs, phone shots, live reactions and the next case. Blocks without content
// are left out. Server Component; Reactions is the shared realtime leaf.

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="b-box min-w-0 bg-paper p-4">
      <dt>
        <Tag className="bg-lime">{label}</Tag>
      </dt>
      <dd className="mt-3 font-semibold">{children}</dd>
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
    <BrutalPage content={content} settings={settings} section="work">
      <main id="main" tabIndex={-1} className={MAIN}>
        <Link href="/work" className={`${BTN} mb-8 bg-paper px-3 text-sm`}>
          <ArrowLeft />
          Work
        </Link>
        <PageHead tag="Case study" title={project.name}>
          <p className="font-bold">{project.kind}</p>
        </PageHead>

        <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {caseStudy.role ? (
            <Fact label="Role">
              <p className="leading-snug text-pretty">{caseStudy.role}</p>
            </Fact>
          ) : null}
          {project.year ? (
            <Fact label="Year">
              <p className="text-2xl font-black">{project.year}</p>
            </Fact>
          ) : null}
          {project.stack.length ? (
            <Fact label="Stack">
              <Chips items={project.stack} label={`${project.name} stack`} />
            </Fact>
          ) : null}
          {live || code ? (
            <Fact label="Links">
              <ul className="flex flex-wrap gap-4">
                {live ? (
                  <li>
                    <ExternalLink href={live} className={`${BTN} bg-lime px-3 text-sm`}>
                      Live<span className="sr-only"> site</span>
                      <ArrowUpRight />
                    </ExternalLink>
                  </li>
                ) : null}
                {code ? (
                  <li>
                    <ExternalLink href={code} className={`${BTN} bg-paper px-3 text-sm`}>
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
            // The column (1280 px less padding at most), the screen less the page padding below.
            sizes="(min-width: 1280px) 1200px, (min-width: 768px) calc(100vw - 5rem), calc(100vw - 2rem)"
            className="b-box mt-12 w-full md:mt-16"
          />
        ) : null}

        <div className="mt-16 grid gap-10 md:mt-24">
          {blocks.map((b, i) => {
            const titleId = `${project.slug}-${b.id}`;
            return (
              <section
                key={b.id}
                aria-labelledby={titleId}
                className="b-box grid gap-6 bg-paper p-4 md:grid-cols-4 md:gap-8 md:p-8"
              >
                <h2 id={titleId} className="flex flex-wrap items-start gap-3 text-2xl leading-none font-black uppercase">
                  <span aria-hidden="true" className="b-tag bg-ink text-on-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {b.label}
                </h2>
                <div className="md:col-span-3">
                  <div className="grid max-w-[65ch] gap-4 text-lg leading-relaxed text-pretty">
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
                      sizes="(min-width: 1280px) 880px, (min-width: 768px) 70vw, calc(100vw - 4rem)"
                      className="b-box mt-8 w-full bg-on-ink p-4"
                    />
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>

        {metrics.length ? (
          <section aria-labelledby={`${project.slug}-metrics`} className="mt-16 md:mt-24">
            <h2 id={`${project.slug}-metrics`} className="b-display b-h2 b-rule pb-4">
              In numbers
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {metrics.map((m) => (
                <li key={m.label} className="b-box bg-lime p-4 md:p-6">
                  <p className="b-display b-h1">{m.value}</p>
                  <p className="mt-3 font-bold text-pretty">{m.label}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {project.phoneShots.length ? (
          <section aria-labelledby={`${project.slug}-phones`} className="mt-16 md:mt-24">
            <h2 id={`${project.slug}-phones`} className="b-display b-h2 b-rule pb-4">
              On mobile
            </h2>
            <ul className="mt-8 flex flex-wrap gap-6">
              {project.phoneShots.map((shot) => (
                <li key={shot.src} className="w-36 sm:w-48">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={shot.width}
                    height={shot.height}
                    sizes="(min-width: 640px) 192px, 144px"
                    className="b-box w-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Reactions slug={project.slug} className="b-claps mt-16" />

        {next ? (
          <nav aria-label="Next case study" className="mt-16 md:mt-24">
            <Link href={`/work/${next.slug}`} className="b-btn b-press flex-col items-start bg-ink p-6 text-on-ink normal-case md:p-8">
              <span className="b-tag bg-lime text-ink">Next case study</span>
              <span className="b-display b-h2 mt-3 inline-flex items-center gap-3">
                {next.name}
                <ArrowUpRight className="size-8" />
              </span>
            </Link>
          </nav>
        ) : null}
      </main>
    </BrutalPage>
  );
}
