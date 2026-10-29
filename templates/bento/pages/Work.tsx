import Link from "next/link";
import type { TemplateProps } from "../../types";
import { ProjectGrid } from "../cards";
import { BentoPage } from "../shell";
import { ArrowUpRight, Card, PAGE_TITLE, TEXT_LINK } from "../ui";

// Bento Work, /work: the title card, then every project in the Home board's work grid (the first
// is the big card), in the content's order, and the way to the archive. Case studies open in
// place, the rest go to the live site or repo. Server Component.

export default function Work(props: TemplateProps) {
  return (
    <BentoPage {...props} current="work">
      <main id="main" tabIndex={-1} className="grid gap-3 outline-none md:gap-4">
        <Card>
          <h1 className={PAGE_TITLE}>Work</h1>
        </Card>
        <ProjectGrid projects={props.content.projects} headingLevel="h2" />
        <Card className="py-2">
          <Link href="/archive" className={TEXT_LINK}>
            Project archive
            <ArrowUpRight />
          </Link>
        </Card>
      </main>
    </BentoPage>
  );
}
