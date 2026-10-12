import type { Experience as Role } from "@/lib/content-types";
import { Action } from "../ui/Action";
import { Chip } from "../ui/Chip";
import { ArrowUpRight } from "../ui/icons";

// Experience (guide §4.2 row 5): hairline rows, period → company (a link when there is a url) →
// title. Phone keeps the list short: points and skills sit in a <details>, the first one open.
// From md it is a Brittany-style grid (period 3 cols · the rest 9) with everything visible. The
// two presentations are separate subtrees and only one is ever displayed, so nothing is read
// twice; no JS either way.

type ExperienceProps = {
  experience: Role[];
};

function Points({ role }: { role: Role }) {
  return (
    <>
      <ul className="grid max-w-[62ch] gap-2 text-pretty">
        {role.points.map((point) => (
          <li key={point} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-current opacity-40" />
            {point}
          </li>
        ))}
      </ul>
      {role.skills.length ? (
        <ul aria-label="Skills" className="mt-6 flex flex-wrap gap-2">
          {role.skills.map((skill) => (
            <li key={skill}>
              <Chip>{skill}</Chip>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function Experience({ experience }: ExperienceProps) {
  return (
    <section aria-labelledby="experience-title" className="f-bleed py-section">
      <h2 id="experience-title" className="type-label">
        Experience
      </h2>
      <ol className="mt-8 border-b border-(--rule) md:mt-12">
        {experience.map((role, i) => (
          <li
            key={`${role.company}-${role.start}`}
            className="grid gap-1 border-t border-(--rule) py-6 md:grid-cols-12 md:gap-x-8 md:py-10 lg:gap-x-12"
          >
            <p className="type-label md:col-span-3 md:pt-2">
              <time dateTime={role.start}>{role.period}</time>
            </p>
            <div className="md:col-span-9">
              <h3 className="text-2xl font-medium tracking-tight md:text-3xl">
                {role.url ? (
                  <Action
                    href={role.url}
                    external
                    className="f-link -my-1 inline-flex min-h-11 items-center gap-2 py-1"
                  >
                    {role.company}
                    <ArrowUpRight className="size-4 md:size-5" />
                  </Action>
                ) : (
                  role.company
                )}
              </h3>
              <p className="mt-1 type-label">
                {role.title}, {role.place}
              </p>

              <details open={i === 0} className="f-details mt-3 md:hidden">
                <summary className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-medium">
                  <span aria-hidden="true" className="f-details-icon" />
                  Details<span className="sr-only">: {role.company}</span>
                </summary>
                <div className="pt-3 pb-1">
                  <Points role={role} />
                </div>
              </details>

              <div className="mt-6 hidden md:block">
                <Points role={role} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
