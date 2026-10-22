import Link from "next/link";
import type { TemplateProps } from "../../types";
import { SectionNav, type NavItem } from "../client/SectionNav";
import { ExperienceList, HomeSection, ProjectCards, PublicationList } from "../sections";
import { Footer, IndexRoot } from "../shell";
import { aboutRest, Availability, EmailButton, formatDay, Socials } from "../profile";
import { ArrowUpRight, EYEBROW, ExternalLink, TEXT_LINK } from "../ui";

// Index Home (work plan 6.4, guide §12 "two-column, recruiter-first"): everything on one scroll.
// lg: the left column is sticky (name as the page's h1, headline, statement, availability, the
// section nav with scrollspy, socials) and the right column scrolls through About, Experience,
// selected Work, Research and a contact call to action. Phone and tablet: one column, no nav;
// each section has a sticky label bar instead. Server Component; SectionNav is the client leaf.

const NAV: NavItem[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "research", label: "Research" },
];

export default function Home({ content, settings }: TemplateProps) {
  const { profile, projects, experience, publications, education } = content;
  const featured = projects.filter((p) => p.featured);
  const rest = aboutRest(profile.about, profile.statement);

  return (
    <IndexRoot content={content} settings={settings}>
      <div className="mx-auto max-w-screen-xl px-6 md:px-12 lg:flex lg:justify-between lg:gap-12 lg:px-24">
        <header className="pt-[max(3.5rem,env(safe-area-inset-top))] md:pt-20 lg:sticky lg:top-0 lg:flex lg:max-h-svh lg:w-[44%] lg:flex-col lg:justify-between lg:py-20">
          <div>
            <h1 className="text-[2.5rem] leading-none font-semibold tracking-tight sm:text-5xl">{profile.name}</h1>
            <p className="mt-4 text-lg font-medium tracking-tight sm:text-xl">{profile.headline}</p>
            <p className="mt-4 max-w-xs leading-relaxed text-pretty text-(--fg-muted)">{profile.statement}</p>
            <Availability availability={profile.availability} className="mt-6" />
            <SectionNav items={NAV} className="mt-14 hidden lg:block" />
          </div>
          <Socials socials={profile.socials} className="mt-8 lg:mt-0" />
        </header>

        <div className="pt-16 lg:w-[52%] lg:pt-20">
          <main id="main" tabIndex={-1} className="outline-none">
            <HomeSection id="about" label="About">
              <div className="grid max-w-[60ch] gap-4 leading-relaxed text-pretty text-(--fg-muted)">
                <p>{profile.intro}</p>
                {rest ? <p>{rest}</p> : null}
              </div>
              {profile.now ? (
                <div className="mt-8 max-w-[60ch] border-l-2 border-lime pl-4">
                  <p className={`${EYEBROW} text-on-ink`}>Now</p>
                  <p className="mt-2 leading-relaxed text-pretty">{profile.now.text}</p>
                  <p className="mt-2 text-sm text-(--fg-muted)">
                    Updated <time dateTime={profile.now.updated}>{formatDay(profile.now.updated)}</time>
                  </p>
                </div>
              ) : null}
              <Link href="/about" className={`${TEXT_LINK} mt-4`}>
                More about me
                <ArrowUpRight />
              </Link>
            </HomeSection>

            <HomeSection id="experience" label="Experience">
              <ExperienceList experience={experience} />
              {/* /resume redirects to the latest upload (a PDF), so it opens in a new tab. */}
              {profile.resumeUrl ? (
                <ExternalLink href="/resume" className={`${TEXT_LINK} mt-10`}>
                  View résumé
                  <ArrowUpRight />
                </ExternalLink>
              ) : null}
            </HomeSection>

            <HomeSection id="work" label="Work">
              <ProjectCards projects={featured.length ? featured : projects} />
              <ul className="mt-10 flex flex-wrap gap-x-8">
                <li>
                  <Link href="/work" className={TEXT_LINK}>
                    All work
                    <ArrowUpRight />
                  </Link>
                </li>
                <li>
                  <Link href="/archive" className={TEXT_LINK}>
                    Project archive
                    <ArrowUpRight />
                  </Link>
                </li>
              </ul>
            </HomeSection>

            <HomeSection id="research" label="Research">
              <PublicationList publications={publications} />
              {education.length ? (
                <div className="mt-12 grid gap-2 sm:grid-cols-8 sm:gap-8">
                  <h3 className={`${EYEBROW} mt-1 text-(--fg-muted) sm:col-span-2`}>Education</h3>
                  <ul className="grid gap-6 sm:col-span-6">
                    {education.map((e) => (
                      <li key={e.degree}>
                        <p className="leading-snug font-medium">{e.degree}</p>
                        <p className="mt-1 text-sm text-(--fg-muted)">
                          {e.place}, {e.period}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-pretty text-(--fg-muted)">{e.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link href="/lab" className={`${TEXT_LINK} mt-10`}>
                Lab: a tomato-leaf disease classifier that runs in your browser
                <ArrowUpRight />
              </Link>
            </HomeSection>

            <section id="contact" aria-labelledby="contact-title" className="border-t border-hairline-on-ink pt-12">
              <h2 id="contact-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Let&rsquo;s work together
              </h2>
              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                <Link
                  href="/contact"
                  className="i-btn inline-flex min-h-12 items-center justify-center rounded-full bg-lime px-6 font-semibold text-ink"
                >
                  Get in touch
                </Link>
                <EmailButton email={profile.email} />
              </div>
            </section>
          </main>
          <Footer content={content} />
        </div>
      </div>
    </IndexRoot>
  );
}
