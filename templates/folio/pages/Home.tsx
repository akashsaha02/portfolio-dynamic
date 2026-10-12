// Folio Home (guide §4.2, work plan 1.3): hero, intro, recent work, experience and research,
// inside the global shell, whose footer is row 7. One h1 (the hero's sr-only name), then an h2
// per section. Server Component; the client leaves are the marquee, the line reveal and Magnetic.

import type { TemplateProps } from "../../types";
import { Experience } from "../sections/Experience";
import { Hero } from "../sections/Hero";
import { Intro } from "../sections/Intro";
import { RecentWork } from "../sections/RecentWork";
import { Research } from "../sections/Research";
import { FolioShell } from "../shell/FolioShell";

export default function Home({ content, settings }: TemplateProps) {
  const { profile, projects, experience, publications, education } = content;

  return (
    <FolioShell content={content} settings={settings} current="home">
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero profile={profile} />
        <Intro profile={profile} />
        <RecentWork projects={projects} />
        <Experience experience={experience} />
        <Research publications={publications} education={education} />
      </main>
    </FolioShell>
  );
}
