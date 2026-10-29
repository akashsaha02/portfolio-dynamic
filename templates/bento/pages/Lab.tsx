import Link from "next/link";
import { TomatoClassifier } from "@/components/shared/lab/TomatoClassifier";
import type { TemplateProps } from "../../types";
import { BentoPage } from "../shell";
import { ArrowUpRight, Card, PAGE_TITLE, TEXT_LINK } from "../ui";

// Bento Lab, /lab (work plan 6.7): the intro card, the shared in-browser classifier in a card of
// its own (it reads --fg-muted, --hairline and, on dark, --btn-bg/--btn-fg from bento.css), and
// the way back to the research behind it. Server Component.

export default function Lab(props: TemplateProps) {
  return (
    <BentoPage {...props} current="lab">
      <main id="main" tabIndex={-1} className="grid gap-3 outline-none md:gap-4">
        <Card>
          <h1 className={PAGE_TITLE}>Lab</h1>
          <p className="mt-4 max-w-[50ch] text-lg leading-snug text-pretty">
            A tomato-leaf disease classifier that runs in your browser.
          </p>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-pretty text-(--fg-muted)">
            It comes from my published research on deep learning for plant disease detection.
          </p>
        </Card>
        <Card>
          <TomatoClassifier />
        </Card>
        <Card className="py-2">
          <Link href="/#research" className={TEXT_LINK}>
            The research
            <ArrowUpRight />
          </Link>
        </Card>
      </main>
    </BentoPage>
  );
}
