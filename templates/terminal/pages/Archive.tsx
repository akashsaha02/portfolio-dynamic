import type { TemplateProps } from "../../types";
import { LsRows } from "../sections";
import { MAIN, TerminalPage } from "../shell";
import { H1, MUTED, Prompt } from "../ui";

// Terminal Archive, /archive: every project as `ls -l` rows, newest first, each with its stack
// and its live and code links (sections.tsx LsRows). Server Component.

/** The latest year in a display year: "2026" → 2026, "2024–25" → 2025. Unknown sorts last. */
function latestYear(year: string) {
  const m = /(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/.exec(year);
  if (!m) return 0;
  if (!m[2]) return Number(m[1]);
  return Number(m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]);
}

export default function Archive(props: TemplateProps) {
  // Stable sort: projects from the same year keep the content's order.
  const projects = props.content.projects.toSorted((a, b) => latestYear(b.year) - latestYear(a.year));

  return (
    <TerminalPage {...props} current="archive" cwd="~/archive">
      <main id="main" tabIndex={-1} className={MAIN}>
        <Prompt cmd="ls -l --sort=year" cwd="~/archive" />
        <h1 className={H1}>Archive</h1>
        <p className={`mt-3 ${MUTED}`}>Every project, by year.</p>
        <div className="mt-10 md:mt-14">
          <LsRows projects={projects} detail />
        </div>
      </main>
    </TerminalPage>
  );
}
