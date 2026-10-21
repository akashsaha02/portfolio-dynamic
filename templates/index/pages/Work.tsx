import Link from "next/link";
import type { TemplateProps } from "../../types";
import { ProjectCards } from "../sections";
import { IndexPage } from "../shell";
import { ArrowUpRight, PAGE_TITLE, PAGE_TOP, TEXT_LINK } from "../ui";

// Index Work, /work: every project as a card (cover, name, kind and year, summary, stack), in the
// content's order. Case studies open in place, the rest go to the live site or repo. The archive
// table has the same projects by year. Server Component.

export default function Work(props: TemplateProps) {
  return (
    <IndexPage {...props} current="work">
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <h1 className={PAGE_TITLE}>Work</h1>
        <div className="mt-12 md:mt-16">
          <ProjectCards projects={props.content.projects} headingLevel="h2" />
        </div>
        <Link href="/archive" className={`${TEXT_LINK} mt-12`}>
          Project archive
          <ArrowUpRight />
        </Link>
      </main>
    </IndexPage>
  );
}
