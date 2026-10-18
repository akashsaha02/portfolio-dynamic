import { CopyButton } from "@/components/shared/CopyButton";
import type { Education, Publication } from "@/lib/content-types";
import { RollLabel } from "../ui/Action";
import { Chip } from "../ui/Chip";
import { FillButton } from "../ui/FillButton";
import { ArrowUpRight, Check, CopyIcon } from "../ui/icons";

// Research, the credibility block (guide §4.2 row 6): one hairline entry per publication with a
// status chip, title, venue and year, a DOI link only when there is one (or a paper url), and
// "Copy BibTeX" only when real BibTeX exists. Education follows as a single line. md+: label on
// the left (3 cols), entries on the right (9).

type ResearchProps = {
  publications: Publication[];
  education: Education[];
};

function PublicationEntry({ pub }: { pub: Publication }) {
  const href = pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
  const linkLabel = pub.doi ? "DOI" : "Paper";
  // Copied verbatim (IEEE Xplore's export); a blank field means there is none yet.
  const bibtex = pub.bibtex?.trim() ? pub.bibtex : undefined;

  return (
    <li className="border-t border-(--rule) py-8 first:border-t-0 first:pt-0 md:py-10">
      <Chip variant={pub.status === "published" ? "solid" : "outline"}>{pub.statusLabel}</Chip>
      <h3 className="mt-4 max-w-[34ch] text-[clamp(1.375rem,1.1rem+1vw,2rem)] leading-tight font-medium tracking-tight">
        {pub.title}
      </h3>
      <p className="mt-2 type-label">
        {pub.venue}, {pub.year}
      </p>
      {href || bibtex ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {href ? (
            <FillButton
              href={href}
              external
              variant="outline"
              icon={<ArrowUpRight />}
              // Several entries would otherwise share the name "DOI"; the visible label leads.
              aria-label={`${linkLabel}: ${pub.title} (opens in a new tab)`}
            >
              {linkLabel}
            </FillButton>
          ) : null}
          {bibtex ? (
            <CopyButton
              value={bibtex}
              status="BibTeX copied"
              aria-label={`Copy BibTeX for ${pub.title}`}
              className="f-btn f-btn-outline f-roll-host min-h-12 px-6 text-base"
            >
              <span aria-hidden="true" className="f-copy">
                <span>
                  <RollLabel>Copy BibTeX</RollLabel>
                  <CopyIcon />
                </span>
                <span>
                  Copied
                  <Check />
                </span>
              </span>
            </CopyButton>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function Research({ publications, education }: ResearchProps) {
  return (
    <section aria-labelledby="research-title" className="f-bleed pt-[calc(var(--section-y)/2)] pb-section">
      <div className="grid gap-8 md:grid-cols-12 md:gap-x-8 lg:gap-x-12">
        <h2 id="research-title" className="type-label md:col-span-3">
          Research
        </h2>
        <ul className="md:col-span-9">
          {publications.map((pub) => (
            <PublicationEntry key={pub.title} pub={pub} />
          ))}
        </ul>
      </div>

      {education.length ? (
        <div className="mt-4 grid gap-3 border-t border-(--rule) pt-8 md:mt-6 md:grid-cols-12 md:gap-x-8 md:pt-10 lg:gap-x-12">
          <p className="type-label md:col-span-3">Education</p>
          <ul className="grid gap-4 md:col-span-9">
            {education.map((e) => (
              <li key={e.degree}>
                <p className="text-lg leading-snug font-medium tracking-tight md:text-xl">
                  {e.degree} · {e.place}
                </p>
                <p className="mt-1 type-label">
                  {e.period}. {e.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
