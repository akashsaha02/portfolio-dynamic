import Link from "next/link";
import type { TemplateProps } from "../../types";
import { formatDay } from "../../index/profile";
import { Availability, ContactLinks } from "../profile";
import { EducationList, ExperienceLog, LsRows, PublicationList } from "../sections";
import { MAIN, TerminalPage } from "../shell";
import { ExternalLink } from "../../index/ui";
import { Block, LINK, MUTED, Out, PROSE, Prompt } from "../ui";

// Terminal Home: one session. `whoami` prints the name (the page's h1), headline, intro and
// status; then About, selected work as `ls -l` rows, the experience log, research and a contact
// prompt, each a Block (prompt line + h2) with an id the ⌘K menu jumps to. Server Component.

export default function Home(props: TemplateProps) {
  const { profile, projects, experience, publications, education } = props.content;
  const featured = projects.filter((p) => p.featured);
  const { now } = profile;

  return (
    <TerminalPage {...props} current="home">
      <main id="main" tabIndex={-1} className={MAIN}>
        <Prompt cmd="whoami" />
        <h1 className="mt-3 text-4xl leading-none font-bold sm:text-6xl">{profile.name}</h1>
        <p className="mt-4 text-lg font-bold text-lime">{profile.headline}</p>
        <p className={`mt-4 ${PROSE} ${MUTED}`}>{profile.intro}</p>
        <dl className="t-kv mt-8">
          <div>
            <dt className={MUTED}>status</dt>
            <dd>
              <Availability availability={profile.availability} />
            </dd>
          </div>
          <div>
            <dt className={MUTED}>location</dt>
            <dd>{profile.location}</dd>
          </div>
        </dl>

        <Block id="about" cmd="cat about.md" title="About">
          <p className={PROSE}>{profile.about}</p>
          {now ? (
            <div className="t-note mt-8">
              <p className={MUTED}>
                now <span aria-hidden="true">·</span> updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
              </p>
              <p className={`mt-1 ${PROSE}`}>{now.text}</p>
            </div>
          ) : null}
          <Link href="/about" className={`${LINK} mt-4`}>
            more about me
          </Link>
        </Block>

        {projects.length ? (
          <Block id="work" cmd="ls -l ~/work" title="Selected work">
            <LsRows projects={featured.length ? featured : projects} />
            <ul className="-ml-1 mt-6 flex flex-wrap gap-x-6">
              <li>
                <Link href="/work" className={`${LINK} px-1`}>
                  all work
                </Link>
              </li>
              <li>
                <Link href="/archive" className={`${LINK} px-1`}>
                  project archive
                </Link>
              </li>
            </ul>
          </Block>
        ) : null}

        {experience.length ? (
          <Block id="experience" cmd="cat experience.log" title="Experience">
            <ExperienceLog experience={experience} />
            {/* /resume redirects to the latest upload (a PDF), so it opens in a new tab. */}
            {profile.resumeUrl ? (
              <ExternalLink href="/resume" className={`${LINK} mt-8`}>
                résumé.pdf
                <Out />
              </ExternalLink>
            ) : null}
          </Block>
        ) : null}

        {publications.length || education.length ? (
          <Block id="research" cmd="cat research.md" title="Research">
            <PublicationList publications={publications} />
            {education.length ? (
              <div className="mt-12">
                <h3 className={`${MUTED} font-bold`}>
                  <span aria-hidden="true">## </span>Education
                </h3>
                <div className="mt-4">
                  <EducationList education={education} />
                </div>
              </div>
            ) : null}
            <Link href="/lab" className={`${LINK} mt-8`}>
              <span aria-hidden="true" className={MUTED}>
                ./lab:&nbsp;
              </span>
              a tomato-leaf disease classifier that runs in your browser
            </Link>
          </Block>
        ) : null}

        <Block id="contact" cmd="./contact" title="Let’s work together">
          <ContactLinks email={profile.email} />
        </Block>
      </main>
    </TerminalPage>
  );
}
