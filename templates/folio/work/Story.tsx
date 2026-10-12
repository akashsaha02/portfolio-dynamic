import type { CaseStudy } from "@/lib/content-types";
import { toParagraphs } from "./paragraphs";

// The case-study story (guide §4.4): Problem → What I built → How it works → Outcome, each a
// small label and short paragraphs at most 60ch wide. lg: the label sits in the left 3 columns
// and sticks while its text (columns 5–11) scrolls past. Empty sections are left out. Metrics,
// when there are any, close the Outcome as a list of figures.

type Block = { id: string; label: string; text: string };

export function Story({ caseStudy, slug }: { caseStudy: CaseStudy; slug: string }) {
  const blocks: Block[] = [
    { id: "problem", label: "Problem", text: caseStudy.problem },
    { id: "built", label: "What I built", text: caseStudy.built },
    { id: "how", label: "How it works", text: caseStudy.how },
    { id: "outcome", label: "Outcome", text: caseStudy.outcome },
  ].filter((b) => b.text.trim());
  const metrics = caseStudy.metrics.filter((m) => m.value && m.label);

  return (
    <div className="grid gap-16 md:gap-24 lg:gap-32">
      {blocks.map((b, i) => {
        const titleId = `${slug}-${b.id}`;
        const last = i === blocks.length - 1;
        return (
          <section key={b.id} aria-labelledby={titleId} className="grid gap-4 lg:grid-cols-12 lg:gap-x-12">
            <h2 id={titleId} className="type-label lg:sticky lg:top-10 lg:col-span-3 lg:self-start lg:text-base">
              {b.label}
            </h2>
            <div className="max-w-[60ch] lg:col-span-7 lg:col-start-5">
              <div className="grid gap-5 type-lead">
                {/* Only "How it works" is long enough to need breaking up. */}
                {(b.id === "how" ? toParagraphs(b.text) : [b.text]).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
              {last && metrics.length ? (
                <ul className="mt-12 grid gap-8 border-t border-(--rule) pt-8 sm:grid-cols-3 sm:gap-6 md:mt-16">
                  {metrics.map((m) => (
                    <li key={m.label}>
                      <p className="text-[clamp(2.75rem,2rem+3vw,4rem)] leading-none font-medium tracking-tight tabular-nums">
                        {m.value}
                      </p>
                      <p className="mt-3 max-w-[24ch] type-label">{m.label}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
