import Image from "next/image";
import type { TemplateProps } from "../../types";
import { aboutRest, formatDay } from "../../index/profile";
import { BentoPage } from "../shell";
import { Card, Chips, LABEL, PAGE_MAIN, PAGE_TITLE } from "../ui";

// Bento About, /about: the intro card (h1, statement, the rest of the about text) beside the
// cutout portrait card, then services (one small card each), experience in full (the Home card
// only lists the roles), toolkit, education and "Now". Cards without content are left out.
// Server Component.

export default function About(props: TemplateProps) {
  const { profile, skills, education, experience } = props.content;
  const { portrait, services, now } = profile;
  const rest = aboutRest(profile.about, profile.statement);

  return (
    <BentoPage {...props} current="about">
      <main id="main" tabIndex={-1} className={`${PAGE_MAIN} lg:grid-cols-3`}>
        <Card className="b-wide lg:col-span-2">
          <h1 className={PAGE_TITLE}>About</h1>
          <p className="mt-6 max-w-[40ch] text-xl leading-snug text-pretty">{profile.statement}</p>
          {rest ? <p className="mt-4 max-w-[60ch] leading-relaxed text-pretty text-(--fg-muted)">{rest}</p> : null}
        </Card>
        <Card className="flex items-end justify-center overflow-hidden pb-0">
          <Image
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            // At most 20rem wide. Near the top on every width, so eager; small, so no high priority.
            loading="eager"
            sizes="320px"
            className="w-full max-w-80"
          />
        </Card>

        {services.map((s) => (
          <Card key={s.number} as="section" aria-labelledby={`service-${s.number}`}>
            <p aria-hidden="true" className={`${LABEL} tabular-nums`}>
              {s.number}
            </p>
            <h2 id={`service-${s.number}`} className="mt-3 text-xl leading-snug font-semibold tracking-tight">
              {s.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-(--fg-muted)">{s.body}</p>
          </Card>
        ))}

        {experience.length ? (
          <Card as="section" id="experience" aria-labelledby="experience-title" className="b-wide">
            <h2 id="experience-title" className={LABEL}>
              Experience
            </h2>
            <ol className="mt-4 grid">
              {experience.map((job) => (
                <li
                  key={`${job.company}-${job.start}`}
                  className="grid gap-2 border-t border-hairline py-6 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-3 md:gap-8"
                >
                  <div>
                    <h3 className="leading-snug font-medium">
                      {job.title} · {job.company}
                    </h3>
                    <p className="mt-1 text-sm text-(--fg-muted)">
                      {job.period} · {job.place}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    {job.points.length ? (
                      <ul className="grid list-disc gap-2 pl-4 text-sm leading-relaxed text-(--fg-muted)">
                        {job.points.map((point) => (
                          <li key={point} className="text-pretty">
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <Chips items={job.skills} label={`Skills at ${job.company}`} className="mt-4" />
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}

        {skills.length ? (
          <Card as="section" aria-labelledby="toolkit-title" className="b-wide">
            <h2 id="toolkit-title" className={LABEL}>
              Toolkit
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {skills.map((g) => (
                <div key={g.group}>
                  <h3 className="text-sm font-medium">{g.group}</h3>
                  <Chips items={g.items} label={g.group} className="mt-2" />
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {education.length ? (
          <Card as="section" aria-labelledby="education-title" className={now ? "lg:col-span-2" : "b-wide"}>
            <h2 id="education-title" className={LABEL}>
              Education
            </h2>
            <ul className="mt-4 grid gap-6">
              {education.map((e) => (
                <li key={e.degree}>
                  <h3 className="leading-snug font-medium">{e.degree}</h3>
                  <p className="mt-1 text-sm text-(--fg-muted)">
                    {e.place}, {e.period}
                  </p>
                  <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-pretty text-(--fg-muted)">{e.detail}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {now ? (
          <Card as="section" aria-labelledby="now-title" className={education.length ? "" : "b-wide"}>
            <h2 id="now-title" className={LABEL}>
              Now
            </h2>
            <p className="mt-3 text-lg leading-snug text-pretty">{now.text}</p>
            <p className="mt-3 text-sm text-(--fg-muted)">
              Updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
            </p>
          </Card>
        ) : null}
      </main>
    </BentoPage>
  );
}
