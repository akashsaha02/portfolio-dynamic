import Link from "next/link";
import type { TemplateProps } from "../../types";
import { ProjectBlocks } from "../blocks";
import { BrutalPage } from "../shell";
import { ArrowUpRight, BTN, MAIN, PageHead } from "../ui";

// Brutal Work, /work: every project as a bordered block with its cover, in the content's order.
// Case studies open in place, the rest go to the live site or repo. Server Component.

export default function Work(props: TemplateProps) {
  const { projects } = props.content;
  return (
    <BrutalPage {...props} current="work">
      <main id="main" tabIndex={-1} className={MAIN}>
        <PageHead tag={`${projects.length} projects`} title="Work" />
        <div className="mt-10 md:mt-16">
          <ProjectBlocks projects={projects} headingLevel="h2" />
        </div>
        <Link href="/archive" className={`${BTN} mt-12 bg-paper`}>
          Project archive
          <ArrowUpRight />
        </Link>
      </main>
    </BrutalPage>
  );
}
