import Image from "next/image";
import { projects, type Project } from "@/lib/content";
import { ArrowIcon } from "../ArrowIcon";

// Mobile first: one column, then two (md), then the bento (lg).
// lg, 3 columns x 3 rows, no gaps:
// [ Abroadly  Abroadly | Nook      ]
// [ Abroadly  Abroadly | SoulMatch ]
// [ CrowdHex | Cerebral  Cerebral  ]
const spans = ["md:col-span-2 lg:row-span-2", "", "", "", "lg:col-span-2"];

function Chips({ items, featured }: { items: string[]; featured: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Built with">
      {items.map((s) => (
        <li
          key={s}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            featured ? "bg-ink/10 text-ink/80" : "bg-on-ink/10 text-on-ink/80"
          }`}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

function Card({ project, span, featured }: { project: Project; span: string; featured: boolean }) {
  const soft = featured ? "text-ink/70" : "text-on-ink/75";

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-5 transition-transform duration-200 ease-out hover:-translate-y-1 sm:p-6 lg:p-8 ${
        featured ? "bg-lime text-ink" : "bg-ink-2 text-on-ink"
      } ${span}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className={`pt-2.5 text-[0.9375rem] font-medium ${soft}`}>
          {project.period ? `${project.kind}, ${project.period}` : project.kind}
        </p>
        <span
          aria-hidden
          className={`grid size-11 shrink-0 place-items-center rounded-full transition-transform duration-200 ease-out group-hover:rotate-45 ${
            featured ? "bg-ink text-lime" : "bg-lime text-ink"
          }`}
        >
          <ArrowIcon className="-rotate-45 transition-transform duration-200 group-hover:rotate-0" />
        </span>
      </div>

      {project.image && (
        <div className={`relative mt-5 ${featured ? "mb-3 pr-[12%] sm:pr-[14%] lg:min-h-0 lg:flex-1" : ""}`}>
          <Image
            src={project.image.src}
            alt={project.image.alt}
            width={1600}
            height={1000}
            sizes={featured ? "(min-width: 1024px) 55vw, 90vw" : "(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"}
            className={`w-full rounded-xl object-cover object-top shadow-[0_18px_40px_-20px_rgba(40,44,32,0.55)] outline outline-1 -outline-offset-1 ${
              featured ? "outline-black/10" : "outline-white/10"
            }`}
          />
          {project.phone && (
            <Image
              src={project.phone.src}
              alt={project.phone.alt}
              width={560}
              height={1212}
              sizes="(min-width: 1024px) 14vw, 26vw"
              className="absolute -bottom-3 right-0 w-[21%] rounded-[0.9rem] border-[3px] border-ink shadow-[0_20px_40px_-18px_rgba(40,44,32,0.7)] sm:rounded-[1.25rem] sm:border-4"
            />
          )}
        </div>
      )}

      <h3
        className={`headline pt-8 ${project.image ? "" : "mt-auto lg:pt-12"} ${
          featured ? "text-[clamp(3rem,13vw,8rem)]" : "text-[clamp(2.25rem,9vw,3.25rem)] lg:text-[clamp(2.25rem,3.4vw,3.25rem)]"
        }`}
      >
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="after:absolute after:inset-0 after:rounded-3xl after:content-['']"
        >
          {project.name}
          <span className="sr-only">: {project.linkLabel} (opens in a new tab)</span>
        </a>
      </h3>

      <div className="mt-3">
        <p
          className={`max-w-[58ch] leading-relaxed ${
            featured ? "text-[1.0625rem] text-ink/85 lg:text-lg" : "text-on-ink/75"
          }`}
        >
          {project.summary}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Chips items={project.stack} featured={featured} />
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className={`relative z-10 inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-[background-color,color,scale] duration-150 active:scale-[0.96] ${
                featured ? "bg-ink text-on-ink hover:bg-ink-2" : "bg-on-ink/10 hover:bg-lime hover:text-ink"
              }`}
            >
              Code
              <ArrowIcon newTab />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="on-ink mx-2 rounded-[1.75rem] bg-ink px-2 py-14 text-on-ink sm:mx-3 sm:rounded-[2.25rem] sm:px-3 md:mx-4 md:py-20 lg:rounded-[2.75rem] lg:px-5 lg:py-24"
    >
      <div className="flex flex-col gap-4 px-3 pb-8 md:flex-row md:items-end md:justify-between md:px-4 md:pb-12">
        <h2 id="work-title" className="display text-[clamp(3rem,13vw,8.5rem)]">
          Things I’ve <span className="text-lime">built</span>
        </h2>
        <p className="max-w-[34ch] text-[1.0625rem] leading-relaxed text-on-ink/70 md:text-lg">
          Products and side projects, each one live or on GitHub.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-flow-dense md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Card key={p.name} project={p} span={spans[i] ?? ""} featured={i === 0} />
        ))}
      </div>
    </section>
  );
}
