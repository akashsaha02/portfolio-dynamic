import Image from "next/image";
import { aboutRest, formatDay } from "../../index/profile";
import type { TemplateProps } from "../../types";
import { BrutalPage } from "../shell";
import { MAIN, PageHead, Section, Tag } from "../ui";

// Brutal About, /about: the h1, the statement and the rest of the about text beside the cutout
// portrait on a lime block (stacked on phone), then services as numbered blocks, the toolkit as
// sticker groups, education and "Now". Sections without content are left out. Server Component.

export default function About(props: TemplateProps) {
  const { profile, skills, education } = props.content;
  const { portrait, services, now } = profile;
  const rest = aboutRest(profile.about, profile.statement);

  return (
    <BrutalPage {...props} current="about">
      <main id="main" tabIndex={-1} className={MAIN}>
        <div className="grid gap-10 md:grid-cols-3 md:items-end">
          <div className="md:col-span-2">
            <PageHead tag={profile.role} title="About">
              <p className="text-xl font-bold md:text-2xl">{profile.statement}</p>
              {rest ? <p className="text-lg leading-relaxed">{rest}</p> : null}
            </PageHead>
          </div>
          <div className="b-box max-w-xs bg-lime md:max-w-none">
            <Image
              src={portrait.src}
              alt={portrait.alt}
              width={portrait.width}
              height={portrait.height}
              // Above the fold on every width, so not lazy; not preloaded (only Home's hero is).
              loading="eager"
              sizes="(min-width: 1280px) 400px, (min-width: 768px) 30vw, 320px"
              className="w-full"
            />
          </div>
        </div>

        {services.length ? (
          <Section id="services" title="Services">
            <ol className="grid gap-8 md:grid-cols-3">
              {services.map((s) => (
                <li key={s.number} className="b-box grid content-start gap-4 bg-paper p-4 md:p-6">
                  <span aria-hidden="true" className="b-display b-h2">
                    {s.number}
                  </span>
                  <h3 className="text-xl leading-snug font-extrabold uppercase">{s.title}</h3>
                  <p className="leading-relaxed text-pretty">{s.body}</p>
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        {skills.length ? (
          <Section id="toolkit" title="Toolkit">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {skills.map((g) => (
                <div key={g.group} className="b-box bg-paper p-4">
                  <h3 className="b-tag bg-ink text-on-ink">{g.group}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {g.items.map((item) => (
                      <li key={item}>
                        <Tag>{item}</Tag>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {education.length ? (
          <Section id="education" title="Education">
            <ul className="grid gap-8">
              {education.map((e) => (
                <li key={e.degree} className="b-box grid gap-3 bg-lime p-4 md:p-6">
                  <h3 className="text-xl leading-snug font-extrabold uppercase md:text-2xl">{e.degree}</h3>
                  <p className="font-bold">
                    {e.place}, {e.period}
                  </p>
                  <p className="max-w-[65ch] leading-relaxed text-pretty">{e.detail}</p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {now ? (
          <Section id="now" title="Now">
            <div className="b-box grid gap-3 bg-paper p-4 md:p-6">
              <p className="max-w-[60ch] text-xl leading-snug font-semibold text-pretty">{now.text}</p>
              <p className="text-sm text-muted">
                Updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
              </p>
            </div>
          </Section>
        ) : null}
      </main>
    </BrutalPage>
  );
}
