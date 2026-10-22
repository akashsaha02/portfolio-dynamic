import Image from "next/image";
import type { ReactNode } from "react";
import type { TemplateProps } from "../../types";
import { aboutRest, formatDay } from "../profile";
import { IndexPage } from "../shell";
import { EYEBROW, PAGE_TITLE, PAGE_TOP } from "../ui";

// Index About, /about: the h1, the statement and the rest of the about text beside the cutout
// portrait (stacked on phone), then services, toolkit, education and "Now", each a hairline
// block with a small lime label. Blocks without content are left out. Server Component.

function Block({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-16 border-t border-hairline-on-ink pt-8 md:mt-20">
      <h2 id={id} className={`${EYEBROW} text-lime`}>
        {label}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function About(props: TemplateProps) {
  const { profile, skills, education } = props.content;
  const { portrait, services, now } = profile;
  const rest = aboutRest(profile.about, profile.statement);

  return (
    <IndexPage {...props} current="about">
      <main id="main" tabIndex={-1} className={PAGE_TOP}>
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end md:grid-cols-[minmax(0,1fr)_14rem]">
          <div>
            <h1 className={PAGE_TITLE}>About</h1>
            <p className="mt-6 text-xl leading-snug text-pretty">{profile.statement}</p>
            {rest ? <p className="mt-4 leading-relaxed text-pretty text-(--fg-muted)">{rest}</p> : null}
          </div>
          <Image
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            // Above the fold on every width, so not lazy; small, so no high priority either.
            loading="eager"
            sizes="(min-width: 768px) 224px, (min-width: 640px) 192px, 240px"
            className="w-60 rounded-md bg-on-ink/5 sm:w-full"
          />
        </div>

        {services.length ? (
          <Block id="services-title" label="Services">
            <ol className="grid gap-8">
              {services.map((s) => (
                <li key={s.number} className="grid gap-2 sm:grid-cols-8 sm:gap-8">
                  <p aria-hidden="true" className="mt-0.5 text-sm text-(--fg-muted) tabular-nums sm:col-span-1">
                    {s.number}
                  </p>
                  <div className="sm:col-span-7">
                    <h3 className="leading-snug font-medium">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-pretty text-(--fg-muted)">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>
        ) : null}

        {skills.length ? (
          <Block id="toolkit-title" label="Toolkit">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {skills.map((g) => (
                <div key={g.group}>
                  <h3 className="font-medium">{g.group}</h3>
                  <ul className="mt-3 grid gap-1.5 text-sm text-(--fg-muted)">
                    {g.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Block>
        ) : null}

        {education.length ? (
          <Block id="education-title" label="Education">
            <ul className="grid gap-8">
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
          </Block>
        ) : null}

        {now ? (
          <Block id="now-title" label="Now">
            <p className="max-w-[60ch] text-lg leading-snug text-pretty">{now.text}</p>
            <p className="mt-3 text-sm text-(--fg-muted)">
              Updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
            </p>
          </Block>
        ) : null}
      </main>
    </IndexPage>
  );
}
