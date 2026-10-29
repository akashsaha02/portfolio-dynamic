import Link from "next/link";
import { TomatoClassifier } from "@/components/shared/lab/TomatoClassifier";
import type { TemplateProps } from "../../types";
import { MAIN, TerminalPage } from "../shell";
import { H1, LINK, MUTED, PROSE, Prompt } from "../ui";

// Terminal Lab, /lab (work plan 6.7): a short intro, the shared in-browser classifier (its own
// markup, on this page's `--fg-muted` and `--rule`) in a framed pane, and a link back to the
// research behind it. Server Component.

export default function Lab(props: TemplateProps) {
  return (
    <TerminalPage {...props} current="lab" cwd="~/lab">
      <main id="main" tabIndex={-1} className={MAIN}>
        <Prompt cmd="./lab" />
        <h1 className={H1}>Lab</h1>
        <p className={`mt-4 text-lg ${PROSE}`}>A tomato-leaf disease classifier that runs in your browser.</p>
        <p className={`mt-3 ${PROSE} ${MUTED}`}>
          It comes from my published research on deep learning for plant disease detection.
        </p>

        <TomatoClassifier className="t-frame mt-10 p-5 md:mt-14 md:p-8" />

        <Link href="/#research" className={`${LINK} mt-10`}>
          <span aria-hidden="true" className={MUTED}>
            cat&nbsp;
          </span>
          the research
        </Link>
      </main>
    </TerminalPage>
  );
}
