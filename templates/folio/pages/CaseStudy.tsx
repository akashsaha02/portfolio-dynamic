// Folio case study, /work/[slug] (guide §4.4, work plan 1.5): title and kind, the facts row,
// the screenshot (full bleed on phone, in a CSS laptop from md), the story, phone shots and the
// next case. Every block comes from the project's content and is left out when empty; nothing
// is invented. One h1 (the project name), an h2 per block. Server Component, no client JS of
// its own.

import type { CaseStudyPageProps } from "../../types";
import { FolioShell } from "../shell/FolioShell";
import { Facts } from "../work/Facts";
import { LaptopShot } from "../work/LaptopShot";
import { NextProject } from "../work/NextProject";
import { PhoneShots } from "../work/PhoneShots";
import { Story } from "../work/Story";
import "../work.css";

export default function CaseStudy({ content, settings, project, next }: CaseStudyPageProps) {
  const { caseStudy } = project;
  const phonesTitle = `${project.slug}-phones`;

  return (
    <FolioShell content={content} settings={settings} section="work">
      <main id="main" tabIndex={-1} className="outline-none">
        <header className="f-bleed pt-[calc(var(--section-y)/2)]">
          <h1 className="type-display">{project.name}</h1>
          <p className="mt-4 max-w-[40ch] type-lead text-(--fg-muted) md:mt-6">{project.kind}</p>
          <div className="mt-12 md:mt-20">
            <Facts project={project} role={caseStudy.role} />
          </div>
        </header>

        {project.cover ? (
          <div className="f-case-hero mt-12 md:mt-20">
            <LaptopShot image={project.cover} />
          </div>
        ) : null}

        <div className="f-bleed py-section">
          <Story caseStudy={caseStudy} slug={project.slug} />
        </div>

        {project.phoneShots.length ? (
          <section aria-labelledby={phonesTitle} className="pb-section">
            <h2 id={phonesTitle} className="f-bleed type-label lg:text-base">
              On mobile
            </h2>
            <div className="mt-8 md:mt-12">
              <PhoneShots shots={project.phoneShots} titleId={phonesTitle} />
            </div>
          </section>
        ) : null}

        {next ? <NextProject project={next} /> : null}
      </main>
    </FolioShell>
  );
}
