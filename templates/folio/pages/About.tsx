import Image from "next/image";
import type { ReactNode } from "react";
import type { Education, NowEntry, Service, SkillGroup } from "@/lib/content-types";
import type { TemplateProps } from "../../types";
import { FolioShell } from "../shell/FolioShell";
import { ArrowDownRight } from "../ui/icons";
import { capSizes } from "../ui/image-sizes";
import "../pages-about-contact.css";

// Folio About (guide §4.5, work plan 1.6). Phone: statement (the h1) → portrait (4:5) → the rest
// of the about text → services 01/02/03 → toolkit (2 columns) → education → "Now". md: statement
// and text on the left, portrait on the right. lg: services in 3 columns, toolkit in 4. Every
// list section is a hairline grid with its label on the left from md (as Research on Home).
// Server Component, no client JS of its own; styles in pages-about-contact.css (.f-about-*).

/** `about` opens with the statement (the h1), so only the sentences after it are shown. */
function aboutRest(about: string, statement: string) {
  return about.startsWith(statement) ? about.slice(statement.length).trim() : about;
}

/** "2026-10-10" → "10 Oct 2026", in UTC so the server and every visitor agree. */
function formatDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

/** A hairline block with its label on the left from md (3 of 12 columns), content on the right. */
function LabelledBlock({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="f-bleed f-about-section">
      <div className="f-about-block">
        <h2 id={id} className="type-label">
          {label}
        </h2>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function Services({ services }: { services: Service[] }) {
  return (
    // The intro above already ends with a section's worth of space.
    <section aria-labelledby="services-title" className="f-bleed pb-section">
      <h2 id="services-title" className="type-label">
        Services
      </h2>
      <ol className="f-about-services mt-8 md:mt-12">
        {services.map((s) => (
          <li key={s.number} className="f-about-service">
            <p aria-hidden="true" className="type-label tabular-nums">
              {s.number}
            </p>
            <h3 className="f-about-service-title">{s.title}</h3>
            <p className="max-w-[46ch] leading-relaxed text-pretty text-(--fg-muted)">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Toolkit({ skills }: { skills: SkillGroup[] }) {
  return (
    <LabelledBlock id="toolkit-title" label="Toolkit">
      <div className="f-about-toolkit">
        {skills.map((g) => (
          <div key={g.group}>
            <h3 className="font-medium">{g.group}</h3>
            <ul className="mt-3 grid gap-1.5 text-(--fg-muted)">
              {g.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </LabelledBlock>
  );
}

function EducationList({ education }: { education: Education[] }) {
  return (
    <LabelledBlock id="education-title" label="Education">
      <ul className="grid gap-10">
        {education.map((e) => (
          <li key={e.degree}>
            <h3 className="f-about-entry-title">{e.degree}</h3>
            <p className="mt-2 text-lg leading-snug">{e.place}</p>
            <p className="mt-1 type-label">{e.period}</p>
            <p className="mt-4 max-w-[60ch] leading-relaxed text-pretty text-(--fg-muted)">{e.detail}</p>
          </li>
        ))}
      </ul>
    </LabelledBlock>
  );
}

function Now({ now }: { now: NowEntry }) {
  return (
    <LabelledBlock id="now-title" label="Now">
      <p className="f-about-now">{now.text}</p>
      <p className="mt-4 type-label">
        Updated <time dateTime={now.updated}>{formatDay(now.updated)}</time>
      </p>
    </LabelledBlock>
  );
}

export default function About({ content, settings }: TemplateProps) {
  const { profile, skills, education } = content;
  const { portrait } = profile;
  const rest = aboutRest(profile.about, profile.statement);

  return (
    <FolioShell content={content} settings={settings} current="about">
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="about-title" className="f-bleed f-about-intro">
          <h1 id="about-title" className="f-about-statement">
            {profile.statement}
          </h1>

          {/* 4:5 crop of the cutout, standing on the bottom of a paper-2 panel. */}
          <div className="f-about-portrait">
            <Image
              src={portrait.src}
              alt={portrait.alt}
              fill
              // The page's LCP (Lighthouse, phone and desktop): eager at high priority, like the
              // home and case-study heroes.
              loading="eager"
              fetchPriority="high"
              // Full width minus the gutters on phone; 5 of 12 columns from md. Capped at the
              // source on dense screens (image-sizes.ts).
              sizes={capSizes(portrait.width, "(min-width: 768px) 40vw, 100vw")}
              className="object-cover object-bottom"
            />
          </div>

          {rest ? (
            <div className="f-about-text">
              <ArrowDownRight className="size-5 md:size-6" />
              <p className="mt-4 max-w-[46ch] type-lead">{rest}</p>
            </div>
          ) : null}
        </section>

        {profile.services.length ? <Services services={profile.services} /> : null}
        {skills.length ? <Toolkit skills={skills} /> : null}
        {education.length ? <EducationList education={education} /> : null}
        {profile.now ? <Now now={profile.now} /> : null}
      </main>
    </FolioShell>
  );
}
