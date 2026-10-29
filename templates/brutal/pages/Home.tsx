import Image from "next/image";
import Link from "next/link";
import { formatDay } from "../../index/profile";
import type { TemplateProps } from "../../types";
import { Availability, ExperienceBlocks, ProjectBlocks, PublicationBlocks } from "../blocks";
import { BrutalPage } from "../shell";
import { ArrowUpRight, BTN, ExternalLink, Section, Tag } from "../ui";

// Brutal Home: the name as a huge h1 beside the cutout portrait on a lime block, the headline on
// an ink slab, the statement, availability and the two ways on (work, contact). Then "Now",
// selected work as big bordered blocks with covers, experience, research and education. The
// footer carries the contact call to action. Static: no marquee, nothing moves on its own.
// Server Component.

export default function Home(props: TemplateProps) {
  const { profile, projects, experience, publications, education } = props.content;
  const featured = projects.filter((p) => p.featured);
  const { portrait, now } = profile;

  return (
    <BrutalPage {...props} current="home">
      <main id="main" tabIndex={-1} className="pt-8 outline-none md:pt-12">
        <section aria-labelledby="hero-name" className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="@container lg:col-span-8">
            <Tag className="b-tilt bg-lime">{profile.location}</Tag>
            <h1 id="hero-name" className="b-display b-name mt-5">
              {profile.name}
            </h1>
          </div>
          <div className="b-box bg-lime lg:col-span-4">
            <Image
              src={portrait.src}
              alt={portrait.alt}
              width={portrait.width}
              height={portrait.height}
              preload
              fetchPriority="high"
              // The block is the column minus its borders: the screen minus the page padding on
              // phone (capped at 24rem by max-w-sm), a third of the 1280 px column from lg.
              sizes="(min-width: 1280px) 400px, (min-width: 1024px) 32vw, (min-width: 384px) 384px, calc(100vw - 2.5rem)"
              className="mx-auto w-full max-w-sm lg:max-w-none"
            />
          </div>

          <div className="grid gap-6 lg:col-span-12 lg:grid-cols-12 lg:gap-8">
            <p className="b-box self-start bg-ink px-4 py-3 text-2xl leading-tight font-black text-on-ink uppercase md:text-4xl lg:col-span-7">
              {profile.headline}
            </p>
            <div className="grid content-start gap-6 lg:col-span-5">
              <p className="text-xl leading-snug font-semibold text-pretty">{profile.statement}</p>
              <Availability availability={profile.availability} className="justify-self-start" />
              <div className="flex flex-wrap gap-4">
                <Link href="/work" className={`${BTN} bg-ink text-on-ink`}>
                  See the work
                  <ArrowUpRight />
                </Link>
                <Link href="/contact" className={`${BTN} bg-lime`}>
                  Get in touch
                </Link>
                {profile.resumeUrl ? (
                  <ExternalLink href="/resume" className={`${BTN} bg-paper`}>
                    Résumé
                    <ArrowUpRight />
                  </ExternalLink>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {now ? (
          <aside aria-labelledby="now-title" className="b-box mt-16 grid gap-3 bg-paper p-4 md:mt-24 md:p-6">
            <h2 id="now-title" className="b-tag justify-self-start bg-lime">
              Now
            </h2>
            <p className="max-w-[60ch] text-xl leading-snug font-semibold text-pretty">{now.text}</p>
            <p className="text-sm text-muted">
              Updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
            </p>
          </aside>
        ) : null}

        {projects.length ? (
          <Section id="work" title="Selected work">
            <ProjectBlocks projects={featured.length ? featured : projects} />
            <p className="mt-10 flex flex-wrap gap-4">
              <Link href="/work" className={`${BTN} bg-ink text-on-ink`}>
                All work
                <ArrowUpRight />
              </Link>
              <Link href="/archive" className={`${BTN} bg-paper`}>
                Project archive
                <ArrowUpRight />
              </Link>
            </p>
          </Section>
        ) : null}

        {experience.length ? (
          <Section id="experience" title="Experience">
            <ExperienceBlocks experience={experience} />
          </Section>
        ) : null}

        {publications.length || education.length ? (
          <Section id="research" title="Research">
            {publications.length ? <PublicationBlocks publications={publications} /> : null}
            {education.length ? (
              <ul className="mt-8 grid gap-8 md:grid-cols-2">
                {education.map((e) => (
                  <li key={e.degree} className="b-box grid content-start gap-3 bg-lime p-4 md:p-6">
                    <h3 className="b-tag justify-self-start bg-paper">Education</h3>
                    <p className="text-xl leading-snug font-extrabold uppercase">{e.degree}</p>
                    <p className="font-bold">
                      {e.place}, {e.period}
                    </p>
                    <p className="leading-relaxed text-pretty">{e.detail}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/lab" className={`${BTN} mt-10 bg-paper text-left`}>
              Lab: try the tomato-leaf classifier
              <ArrowUpRight />
            </Link>
          </Section>
        ) : null}
      </main>
    </BrutalPage>
  );
}
