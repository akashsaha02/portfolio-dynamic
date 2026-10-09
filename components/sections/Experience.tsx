import { experience } from "@/lib/content";
import { ArrowIcon } from "../ArrowIcon";

export function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className="border-t border-line px-5 py-24 md:px-10 md:py-36 lg:grid lg:grid-cols-12 lg:gap-10"
    >
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <h2 id="experience-title" className="display text-[clamp(3.25rem,7.5vw,7rem)]">
            Where I’ve worked
          </h2>
          <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-muted">
            Two product teams, one research lab and an internship, most recent first.
          </p>
        </div>
      </div>

      <ol className="mt-12 lg:col-span-8 lg:mt-0">
        {experience.map((role) => (
          <li
            key={role.company}
            className="grid gap-4 border-t border-line py-10 first:border-t-0 first:pt-0 md:grid-cols-8 md:gap-8 md:first:pt-2"
          >
            <p className="text-[0.9375rem] text-muted md:col-span-2 md:pt-2">
              {role.period}
              <br />
              {role.place}
            </p>
            <div className="md:col-span-6">
              <h3 className="headline text-[clamp(1.75rem,2.8vw,2.5rem)]">
                {role.url ? (
                  <a
                    href={role.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 -mx-1.5 rounded-lg px-1.5 transition-colors duration-200 hover:bg-lime"
                  >
                    {role.company}
                    <ArrowIcon newTab className="size-5 text-muted transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                  </a>
                ) : (
                  role.company
                )}
              </h3>
              <p className="mt-1.5 text-lg font-medium">{role.title}</p>
              <ul className="mt-5 space-y-3 text-[1.0625rem] leading-relaxed text-ink/80">
                {role.points.map((p) => (
                  <li key={p} className="relative max-w-[62ch] pl-5 before:absolute before:left-0 before:top-[0.55em] before:size-2 before:rounded-full before:bg-ink">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
