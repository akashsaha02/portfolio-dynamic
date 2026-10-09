// PLACEHOLDER for the "Folio" template (guide §3–§4), written by backend in work plan 0.2 only to
// prove the template contract end to end. folio-design replaces this file (and adds pages,
// sections, ui, motion, styles) in work plan 1.1+. Nothing here is design.
//
// Contract reminders:
// - Pages receive `{ content, settings }` (TemplateProps) and never import lib/content.ts.
// - Each page renders `<main id="main" tabIndex={-1}>` for the layout's skip link.
// - Export a `TemplateModule` as default. Pages you add (Work, CaseStudy, About, Contact,
//   NotFound) are picked up by the matching routes in app/(site)/ without other changes.

import Image from "next/image";
import type { TemplateModule, TemplateProps } from "../types";

function Home({ content, settings }: TemplateProps) {
  const { profile, site, projects, experience, publications, skills, education } = content;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      {settings.announcement ? <p role="status">{settings.announcement.text}</p> : null}

      <header>
        <p>Folio template placeholder (work plan 0.2)</p>
        <ul aria-label="Greetings">
          {profile.greetings.map((g) => (
            <li key={g.lang} lang={g.lang}>
              {g.text}
            </li>
          ))}
        </ul>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="hero-title">
          <h1 id="hero-title">{profile.name}</h1>
          <p>
            {profile.role} · {profile.location}
          </p>
          <p>
            Availability ({profile.availability.status}): {profile.availability.label}
          </p>
          <Image
            src={profile.portrait.src}
            alt={profile.portrait.alt}
            width={profile.portrait.width}
            height={profile.portrait.height}
            sizes="(min-width: 768px) 24rem, 60vw"
            className="h-auto w-60"
          />
        </section>

        <section aria-labelledby="intro-title">
          <h2 id="intro-title">Intro</h2>
          <p>{profile.intro}</p>
          <p>{profile.about}</p>
        </section>

        <section aria-labelledby="services-title">
          <h2 id="services-title">Services</h2>
          <ol>
            {profile.services.map((s) => (
              <li key={s.number}>
                <h3>
                  {s.number} {s.title}
                </h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="work-title">
          <h2 id="work-title">Work ({projects.length})</h2>
          <ul>
            {projects.map((p) => (
              <li key={p.slug}>
                <h3>
                  <a href={p.url}>{p.name}</a>
                </h3>
                <p>
                  {p.kind} · {p.year} · {p.type === "ml" ? "Machine learning" : "Full-stack"}
                  {p.featured ? " · featured" : ""}
                </p>
                <p>{p.summary}</p>
                <p>Built with: {p.stack.join(", ")}</p>
                {p.repo ? <a href={p.repo}>Code</a> : null}
                {p.cover ? (
                  <Image
                    src={p.cover.src}
                    alt={p.cover.alt}
                    width={p.cover.width}
                    height={p.cover.height}
                    sizes="(min-width: 768px) 48rem, 100vw"
                    className="h-auto w-full"
                  />
                ) : null}
                {p.phoneShots.length > 0 ? <p>{p.phoneShots.length} phone screenshot(s)</p> : null}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="experience-title">
          <h2 id="experience-title">Experience</h2>
          <ol>
            {experience.map((r) => (
              <li key={`${r.company}-${r.start}`}>
                <p>
                  <time dateTime={r.start}>{r.period}</time>
                </p>
                <h3>{r.url ? <a href={r.url}>{r.company}</a> : r.company}</h3>
                <p>
                  {r.title}, {r.place}
                </p>
                <ul>
                  {r.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <p>Skills: {r.skills.join(", ")}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="research-title">
          <h2 id="research-title">Research</h2>
          <ul>
            {publications.map((pub) => (
              <li key={pub.title}>
                <p>{pub.statusLabel}</p>
                <h3>{pub.url ? <a href={pub.url}>{pub.title}</a> : pub.title}</h3>
                <p>
                  {pub.venue}, {pub.year}
                </p>
                <p>{pub.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="toolkit-title">
          <h2 id="toolkit-title">Toolkit</h2>
          <dl>
            {skills.map((g) => (
              <div key={g.group}>
                <dt>{g.group}</dt>
                <dd>{g.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="education-title">
          <h2 id="education-title">Education</h2>
          {education.map((e) => (
            <div key={e.degree}>
              <h3>{e.degree}</h3>
              <p>
                {e.place} · {e.period}
              </p>
              <p>{e.detail}</p>
            </div>
          ))}
        </section>
      </main>

      <footer>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
        <p>Contact form: {settings.contactFormEnabled ? "enabled (built in 1.6)" : "disabled"}</p>
        <ul aria-label="Social links">
          {profile.socials.map((s) => (
            <li key={s.url}>
              <a href={s.url}>{s.label}</a>
            </li>
          ))}
        </ul>
        <p>
          Version {site.versionLabel} · Local time zone {profile.timezone}
        </p>
      </footer>
    </div>
  );
}

const folio: TemplateModule = { Home };

export default folio;
