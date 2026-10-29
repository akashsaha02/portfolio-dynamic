import Image from "next/image";
import type { TemplateProps } from "../../types";
import { aboutRest, formatDay } from "../../index/profile";
import { EducationList } from "../sections";
import { MAIN, TerminalPage } from "../shell";
import { Block, H1, MUTED, PROSE, Prompt } from "../ui";

// Terminal About, /about: `cat about.md` with the h1, the statement and the rest of the about
// text beside the cutout portrait (under it on phone), then services, toolkit, education and
// "Now", each a Block. Blocks without content are left out. Server Component.

export default function About(props: TemplateProps) {
  const { profile, skills, education } = props.content;
  const { portrait, services, now } = profile;
  const rest = aboutRest(profile.about, profile.statement);

  return (
    <TerminalPage {...props} current="about" cwd="~/about">
      <main id="main" tabIndex={-1} className={MAIN}>
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end md:grid-cols-[minmax(0,1fr)_14rem]">
          <div>
            <Prompt cmd="cat about.md" />
            <h1 className={H1}>About</h1>
            <p className={`mt-6 text-lg ${PROSE}`}>{profile.statement}</p>
            {rest ? <p className={`mt-4 ${PROSE} ${MUTED}`}>{rest}</p> : null}
          </div>
          <Image
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            // Above the fold from sm, so not lazy; small, so no high priority either.
            loading="eager"
            sizes="(min-width: 768px) 224px, (min-width: 640px) 192px, 240px"
            className="t-frame w-60 bg-on-ink/5 sm:w-full"
          />
        </div>

        {services.length ? (
          <Block id="services" cmd="ls services/" title="Services">
            <ol className="grid gap-8">
              {services.map((s) => (
                <li key={s.number}>
                  <h3 className="leading-snug font-bold">
                    <span aria-hidden="true" className="text-lime">
                      {s.number}{" "}
                    </span>
                    {s.title}
                  </h3>
                  <p className={`mt-2 ${PROSE} ${MUTED}`}>{s.body}</p>
                </li>
              ))}
            </ol>
          </Block>
        ) : null}

        {skills.length ? (
          <Block id="toolkit" cmd="ls toolkit/*" title="Toolkit">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {skills.map((g) => (
                <div key={g.group}>
                  <h3 className="font-bold">
                    {g.group}
                    <span aria-hidden="true">/</span>
                  </h3>
                  <ul className={`mt-2 grid gap-1 ${MUTED}`}>
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
          <Block id="education" cmd="cat education.md" title="Education">
            <EducationList education={education} itemAs="h3" />
          </Block>
        ) : null}

        {now ? (
          <Block id="now" cmd="cat now.txt" title="Now">
            <p className={`text-lg ${PROSE}`}>{now.text}</p>
            <p className={`mt-3 ${MUTED}`}>
              updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
            </p>
          </Block>
        ) : null}
      </main>
    </TerminalPage>
  );
}
