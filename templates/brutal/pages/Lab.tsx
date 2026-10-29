import Link from "next/link";
import { TomatoClassifier } from "@/components/shared/lab/TomatoClassifier";
import type { TemplateProps } from "../../types";
import { BrutalPage } from "../shell";
import { ArrowUpRight, BTN, MAIN, PageHead } from "../ui";

// Brutal Lab, /lab (work plan 6.7): a short intro, the shared in-browser classifier (its own
// markup and styles, on the paper tokens) in a bordered block, and a link to the research behind
// it on Home. Server Component.

export default function Lab(props: TemplateProps) {
  return (
    <BrutalPage {...props} current="lab">
      <main id="main" tabIndex={-1} className={MAIN}>
        <PageHead tag="Runs in your browser" title="Lab">
          <p className="font-bold">A tomato-leaf disease classifier that runs in your browser.</p>
          <p className="text-base leading-relaxed">
            It comes from my published research on deep learning for plant disease detection.
          </p>
        </PageHead>

        <TomatoClassifier className="b-box mt-10 bg-paper p-4 sm:p-6 md:mt-16 md:p-8" />

        <Link href="/#research" className={`${BTN} mt-12 bg-paper`}>
          The research
          <ArrowUpRight />
        </Link>
      </main>
    </BrutalPage>
  );
}
