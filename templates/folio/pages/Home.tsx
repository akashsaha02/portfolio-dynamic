// Folio Home (work plan 1.1): a minimal content listing plus the primitives showcase. The real
// shell (1.2) and Home sections (1.3) replace the listing; the showcase is removed in 1.3.

import Link from "next/link";
import type { TemplateProps } from "../../types";
import { Showcase } from "../showcase/Showcase";
import { Chip } from "../ui/Chip";
import { CurvedEdge } from "../ui/CurvedEdge";
import { FillButton } from "../ui/FillButton";
import { ArrowDownRight, ArrowUpRight } from "../ui/icons";
import { Magnetic } from "../ui/Magnetic";
import { RoundButton } from "../ui/RoundButton";
import { Row, RowList } from "../ui/Row";
import { Tile } from "../ui/Tile";

export default function Home({ content, settings }: TemplateProps) {
  const { profile, site, projects, experience, publications, education } = content;
  const featured = projects.filter((p) => p.featured);
  const firstName = profile.name.split(" ")[0];

  return (
    <div className="tpl-folio surface-paper min-h-svh overflow-x-clip">
      {settings.announcement ? (
        <p role="status" className="surface-ink px-gutter py-3 text-center text-sm">
          {settings.announcement.text}
        </p>
      ) : null}

      <header className="flex items-center justify-between px-gutter pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="inline-flex min-h-11 items-center font-medium">
          © Code by {firstName}
        </Link>
        <p className="type-label">Work plan 1.1 preview</p>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="intro-title" className="px-gutter py-section">
          <p className="flex items-center gap-2 type-label">
            <ArrowDownRight />
            {profile.role} · {profile.location}
          </p>
          <h1 id="intro-title" className="mt-4 type-display">
            {profile.name}
          </h1>
          <div className="mt-6">
            <Chip variant="solid" dot>
              {profile.availability.label}
            </Chip>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
            <p className="max-w-[28ch] type-heading md:col-span-8">{profile.intro}</p>
            <div className="flex justify-end md:col-span-4">
              <Magnetic>
                <RoundButton href="#experience-title">About me</RoundButton>
              </Magnetic>
            </div>
          </div>
        </section>

        <section aria-labelledby="work-title" className="surface-ink px-gutter py-section">
          <h2 id="work-title" className="type-label">
            Recent work
          </h2>
          <ul className="mt-8 grid gap-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16">
            {featured.map((p) => (
              <li key={p.slug}>
                <Tile
                  href={p.url}
                  external
                  name={p.name}
                  meta={`${p.kind} · ${p.year}`}
                  image={p.cover}
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </li>
            ))}
          </ul>
          <RowList label="All projects" className="mt-section">
            {projects.map((p) => (
              <Row key={p.slug} href={p.url} external name={p.name} kind={p.kind} year={p.year} />
            ))}
          </RowList>
          <div className="mt-12 flex md:justify-center">
            <FillButton href="/work" variant="outline" className="w-full md:w-auto">
              More work ({projects.length - featured.length})
            </FillButton>
          </div>
        </section>

        <section aria-labelledby="experience-title" className="px-gutter py-section">
          <h2 id="experience-title" className="type-label">
            Experience
          </h2>
          <ol className="mt-6 border-b border-(--rule)">
            {experience.map((r) => (
              <li
                key={`${r.company}-${r.start}`}
                className="grid gap-1 border-t border-(--rule) py-6 md:grid-cols-12 md:gap-8"
              >
                <p className="type-label md:col-span-3">
                  <time dateTime={r.start}>{r.period}</time>
                </p>
                <div className="md:col-span-9">
                  <h3 className="text-2xl font-medium tracking-tight">{r.company}</h3>
                  <p className="type-label">
                    {r.title}, {r.place}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="research-title" className="px-gutter pb-section">
          <h2 id="research-title" className="type-label">
            Research
          </h2>
          <ul className="mt-6 grid gap-8">
            {publications.map((pub) => (
              <li key={pub.title} className="max-w-[60ch]">
                <Chip>{pub.statusLabel}</Chip>
                <h3 className="mt-3 text-xl font-medium tracking-tight">{pub.title}</h3>
                <p className="mt-1 type-label">
                  {pub.venue}, {pub.year}
                </p>
              </li>
            ))}
          </ul>
          {education.map((e) => (
            <p key={e.degree} className="mt-8 type-label">
              {e.degree} · {e.detail} · {e.place}
            </p>
          ))}
        </section>

        <Showcase content={content} />
      </main>

      <footer aria-labelledby="footer-title" className="relative surface-ink mt-[7svh] px-gutter pt-section md:mt-[12svh]">
        <CurvedEdge edge="top" fill="var(--ink)" />
        <h2 id="footer-title" className="max-w-[12ch] type-display">
          Let&rsquo;s work together
        </h2>
        <div className="mt-10 grid gap-3 md:flex md:flex-wrap">
          <FillButton href={`mailto:${profile.email}`} variant="outline" size="lg" block className="md:w-auto">
            {profile.email}
          </FillButton>
          {profile.phone ? (
            <FillButton href={`tel:${profile.phone}`} variant="outline" size="lg" block className="md:w-auto">
              {profile.phone}
            </FillButton>
          ) : null}
        </div>
        <div className="mt-section flex flex-col gap-6 border-t border-(--rule) py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-between">
          <p className="type-label">
            Version {site.versionLabel} · Local time zone {profile.timezone}
          </p>
          <ul aria-label="Social links" className="flex flex-wrap gap-2">
            {profile.socials.map((s) => (
              <li key={s.url}>
                <FillButton href={s.url} external variant="outline" icon={<ArrowUpRight />}>
                  {s.label}
                </FillButton>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
