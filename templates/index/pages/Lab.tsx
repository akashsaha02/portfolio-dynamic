import Link from "next/link";
import { TomatoClassifier } from "@/components/shared/lab/TomatoClassifier";
import type { TemplateProps } from "../../types";
import { IndexPage } from "../shell";
import { ArrowUpRight, PAGE_TITLE, PAGE_TOP, TEXT_LINK } from "../ui";

// Index Lab, /lab (work plan 6.7): a short intro, the shared in-browser classifier (another
// agent's client component, styled by its own markup) and a link back to the research behind it.
// Server Component.

export default function Lab(props: TemplateProps) {
  return (
    <IndexPage {...props} current="lab">
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <h1 className={PAGE_TITLE}>Lab</h1>
        <p className="mt-4 max-w-[50ch] text-lg leading-snug text-pretty">
          A tomato-leaf disease classifier that runs in your browser.
        </p>
        <p className="mt-3 max-w-[60ch] leading-relaxed text-pretty text-(--fg-muted)">
          It comes from my published research on deep learning for plant disease detection.
        </p>

        <TomatoClassifier className="mt-12 rounded-md border border-hairline-on-ink p-6 md:mt-16" />

        <Link href="/#research" className={`${TEXT_LINK} mt-12`}>
          The research
          <ArrowUpRight />
        </Link>
      </main>
    </IndexPage>
  );
}
