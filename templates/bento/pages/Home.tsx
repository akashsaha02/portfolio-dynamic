import Image from "next/image";
import Link from "next/link";
import { LocalTime } from "@/components/shared/LocalTime";
import type { TemplateProps } from "../../types";
import { formatDay } from "../../index/profile";
import { AvailabilityLine, EmailButton, ProjectGrid, SocialList } from "../cards";
import { BentoPage } from "../shell";
import { ArrowUpRight, BUTTON, Card, Chip, Chips, ExternalLink, LABEL, PILL, TEXT_LINK } from "../ui";

// Bento Home: one board of cards (bento.css .b-board names the areas per breakpoint). Desktop:
// the intro card (name as the h1, headline, intro, calls to action) beside three small cards
// (availability, local time, socials), the selected work below it (the first project is the big
// card), then experience, "now", stack, research and the contact card. Tablet: two columns.
// Phone: one column in priority order (intro, availability, work, experience, "now", research,
// stack, contact, time, socials). Server Component; the clock and copy buttons are shared leaves.

export default function Home({ content, settings }: TemplateProps) {
  const { profile, projects, experience, publications, skills, education } = content;
  const featured = projects.filter((p) => p.featured);
  const { portrait, now } = profile;

  return (
    <BentoPage content={content} settings={settings} home>
      <main id="main" tabIndex={-1} className="b-board outline-none">
        <Card area="intro" className="flex flex-col">
          <Image
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            // The cutout as an avatar: small, above the fold, so eager but not high priority.
            loading="eager"
            sizes="96px"
            className="size-20 rounded-full bg-(--b-chip) md:size-24"
          />
          <h1 className="mt-6 text-[2.5rem] leading-none font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {profile.name}
          </h1>
          <p className="mt-3 text-lg font-medium tracking-tight sm:text-xl">{profile.headline}</p>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-pretty text-(--fg-muted)">{profile.intro}</p>
          {/* mt-auto: on desktop the card is as tall as the three beside it; the actions sit low. */}
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Link href="/contact" className={BUTTON}>
              Get in touch
            </Link>
            <Link href="/about" className={PILL}>
              About me
            </Link>
            {/* /resume redirects to the latest upload (a PDF), so it opens in a new tab. */}
            {profile.resumeUrl ? (
              <ExternalLink href="/resume" className={PILL}>
                Résumé
              </ExternalLink>
            ) : null}
          </div>
        </Card>

        <Card as="section" area="avail" aria-labelledby="avail-title">
          <h2 id="avail-title" className={LABEL}>
            Availability
          </h2>
          <AvailabilityLine availability={profile.availability} className="mt-3 text-lg leading-snug font-medium" />
        </Card>

        <Card as="section" area="time" aria-labelledby="time-title">
          <h2 id="time-title" className={LABEL}>
            Local time
          </h2>
          <p className="mt-3 text-3xl leading-none font-semibold tracking-tight">
            <LocalTime timeZone={profile.timezone} />
          </p>
          <p className="mt-2 text-sm text-(--fg-muted)">{profile.location}</p>
        </Card>

        {profile.socials.length ? (
          <Card as="section" area="social" aria-labelledby="social-title" className="py-3 md:py-4">
            <h2 id="social-title" className={`${LABEL} pt-2`}>
              Elsewhere
            </h2>
            <SocialList socials={profile.socials} />
          </Card>
        ) : null}

        {projects.length ? (
          <section id="work" aria-labelledby="work-title" style={{ gridArea: "work" }} className="b-grid md:grid-cols-1">
            <h2 id="work-title" className="sr-only">
              Selected work
            </h2>
            <ProjectGrid projects={featured.length ? featured : projects} headingLevel="h3" />
            <Card className="flex flex-wrap items-center gap-x-8 py-2">
              <Link href="/work" className={TEXT_LINK}>
                All work
                <ArrowUpRight />
              </Link>
              <Link href="/archive" className={TEXT_LINK}>
                Project archive
                <ArrowUpRight />
              </Link>
            </Card>
          </section>
        ) : null}

        {experience.length ? (
          <Card as="section" area="exp" id="experience" aria-labelledby="experience-title">
            <h2 id="experience-title" className={LABEL}>
              Experience
            </h2>
            <ol className="mt-4 grid">
              {experience.map((job) => (
                <li
                  key={`${job.company}-${job.start}`}
                  className="grid gap-1 border-t border-hairline py-4 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <h3 className="leading-snug font-medium">
                    {job.title} · {job.company}
                  </h3>
                  <p className="text-sm text-(--fg-muted)">
                    {job.period} · {job.place}
                  </p>
                </li>
              ))}
            </ol>
            <Link href="/about#experience" className={`${TEXT_LINK} mt-4`}>
              What I did there
              <ArrowUpRight />
            </Link>
          </Card>
        ) : null}

        {now ? (
          <Card as="section" area="now" aria-labelledby="now-title">
            <h2 id="now-title" className={LABEL}>
              Now
            </h2>
            <p className="mt-3 text-lg leading-snug text-pretty">{now.text}</p>
            <p className="mt-3 text-sm text-(--fg-muted)">
              Updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
            </p>
          </Card>
        ) : null}

        {skills.length ? (
          <Card as="section" area="stack" aria-labelledby="stack-title">
            <h2 id="stack-title" className={LABEL}>
              Stack
            </h2>
            <div className="mt-4 grid gap-4">
              {skills.map((g) => (
                <div key={g.group}>
                  <h3 className="text-sm font-medium">{g.group}</h3>
                  <Chips items={g.items} label={g.group} className="mt-2" />
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {publications.length || education.length ? (
          <Card as="section" area="research" id="research" aria-labelledby="research-title">
            <h2 id="research-title" className={LABEL}>
              Research
            </h2>
            <ol className="mt-4 grid">
              {publications.map((pub) => {
                const href = pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
                return (
                  <li key={pub.title} className="border-t border-hairline py-4 first:border-t-0 first:pt-0">
                    <Chip>{pub.statusLabel}</Chip>
                    <h3 className="mt-3 leading-snug font-medium text-pretty">{pub.title}</h3>
                    <p className="mt-1 text-sm text-(--fg-muted)">
                      {pub.venue}, {pub.year}
                    </p>
                    {href ? (
                      <ExternalLink
                        href={href}
                        aria-label={`${pub.doi ? "DOI" : "Paper"}: ${pub.title} (opens in a new tab)`}
                        className={`${TEXT_LINK} min-w-0 text-sm`}
                      >
                        <span className="break-all">{pub.doi ? `DOI ${pub.doi}` : "Paper"}</span>
                        <ArrowUpRight />
                      </ExternalLink>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {education.length ? (
              <ul className="grid gap-1 border-t border-hairline pt-4 text-sm">
                {education.map((e) => (
                  <li key={e.degree}>
                    <span className="font-medium">{e.short ? e.short.degree : e.degree}</span>
                    <span className="text-(--fg-muted)">
                      {" "}
                      · {e.short ? `${e.short.grade} · ${e.short.place}` : `${e.place}, ${e.period}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/lab" className={`${TEXT_LINK} mt-3`}>
              Try the classifier in the Lab
              <ArrowUpRight />
            </Link>
          </Card>
        ) : null}

        <Card as="section" area="contact" id="contact" aria-labelledby="contact-title" className="flex flex-col">
          <h2 id="contact-title" className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Let&rsquo;s work together
          </h2>
          <AvailabilityLine availability={profile.availability} className="mt-4 text-(--fg-muted)" />
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Link href="/contact" className={BUTTON}>
              Get in touch
            </Link>
            <EmailButton email={profile.email} />
          </div>
        </Card>
      </main>
    </BentoPage>
  );
}
