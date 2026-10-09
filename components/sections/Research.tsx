import { education, publications, toolkit } from "@/lib/content";
import { ArrowIcon } from "../ArrowIcon";

export function Research() {
  return (
    <section
      id="research"
      aria-labelledby="research-title"
      className="border-t border-line px-5 py-24 md:px-10 md:py-36"
    >
      <div className="grid gap-6 md:grid-cols-12 md:gap-10">
        <h2 id="research-title" className="display text-[clamp(3.25rem,7.5vw,7rem)] md:col-span-4">
          Research
        </h2>
        <p className="max-w-[48ch] text-lg leading-relaxed text-muted md:col-span-6 md:col-start-6 md:pt-3">
          Alongside my degree I worked on computer vision for agriculture: can a phone camera and a
          small model tell a farmer what is wrong with a crop?
        </p>
      </div>

      <ul className="mt-14 md:mt-20">
        {publications.map((p) => (
          <li
            key={p.title}
            className="grid gap-3 border-t border-line py-10 md:grid-cols-12 md:gap-10"
          >
            <p className="text-[0.9375rem] text-muted md:col-span-3">
              {p.year}
              <span className="ml-3 rounded-full bg-ink/6 px-2.5 py-0.5 text-sm text-ink/75">
                {p.status}
              </span>
            </p>
            <div className="md:col-span-8 md:col-start-5">
              <h3 className="headline text-[clamp(1.5rem,2.4vw,2.1rem)] leading-[1.1]">
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group -mx-1.5 rounded-lg px-1.5 transition-colors duration-200 hover:bg-lime"
                  >
                    {p.title}
                    <ArrowIcon newTab className="ml-2 inline size-5 align-[-0.1em] text-muted transition-colors group-hover:text-ink" />
                  </a>
                ) : (
                  p.title
                )}
              </h3>
              <p className="mt-2 text-[0.9375rem] text-muted">{p.venue}</p>
              <p className="mt-4 max-w-[64ch] text-[1.0625rem] leading-relaxed text-ink/80">{p.summary}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Toolkit() {
  return (
    <section aria-labelledby="toolkit-title" className="border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <h2 id="toolkit-title" className="headline text-[clamp(2rem,3.6vw,3.25rem)]">
            What I work with
          </h2>
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {toolkit.map((g) => (
              <div key={g.group}>
                <dt className="text-[0.9375rem] text-muted">{g.group}</dt>
                <dd className="mt-3">
                  <ul className="space-y-1.5 text-[1.0625rem] font-medium">
                    {g.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <h2 className="headline text-[clamp(2rem,3.6vw,3.25rem)]">Education</h2>
          {education.map((e) => (
            <div key={e.title} className="mt-10">
              <p className="text-[0.9375rem] text-muted">{e.period}</p>
              <h3 className="mt-2 text-xl font-semibold leading-snug">{e.title}</h3>
              <p className="mt-1 text-ink/75">{e.place}</p>
              <p className="mt-4 leading-relaxed text-ink/80">{e.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
