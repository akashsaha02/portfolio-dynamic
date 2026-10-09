// SHOWCASE ONLY: remove this folder and its <Showcase> in templates/folio/index.tsx in work plan
// 1.3, when the real Home sections land. It renders every primitive, every variant, on every
// surface (paper, ink, lime) so they can be reviewed at each width with SITE_TEMPLATE=folio.

import type { ReactNode } from "react";
import type { SiteContent } from "@/lib/content-types";
import { Chip } from "../ui/Chip";
import { CurvedEdge } from "../ui/CurvedEdge";
import { FillButton } from "../ui/FillButton";
import { ArrowDownRight, ArrowUpRight, Burger } from "../ui/icons";
import { Magnetic } from "../ui/Magnetic";
import { RoundButton } from "../ui/RoundButton";
import { Row, RowList } from "../ui/Row";
import { FilterDemo } from "./FilterDemo";

type Surface = "surface-paper" | "surface-ink" | "surface-lime";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-(--rule) pt-6">
      <h4 className="type-label">{title}</h4>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ButtonsOn({ surface, name, content }: { surface: Surface; name: string; content: SiteContent }) {
  const { profile, projects, publications } = content;
  const id = `showcase-${surface}`;
  const more = projects.length - projects.filter((p) => p.featured).length;

  return (
    <section aria-labelledby={id} className={`${surface} rounded-3xl px-5 py-8 md:px-10 md:py-12`}>
      <h3 id={id} className="type-heading">
        On {name}
      </h3>

      <div className="mt-8 grid gap-10">
        <Group title="FillButton: solid / outline, link / button, md / lg">
          <div className="flex flex-wrap items-center gap-3">
            <FillButton href="#showcase">Solid link</FillButton>
            <FillButton variant="outline">
              Outline button
            </FillButton>
            <FillButton href={projects[0].url} external size="lg" icon={<ArrowUpRight />}>
              {projects[0].linkLabel}
            </FillButton>
            <FillButton variant="outline" disabled>
              Disabled
            </FillButton>
          </div>
        </Group>

        <Group title="FillButton block (stacked footer pills on phone)">
          <div className="grid gap-3 md:grid-cols-2">
            <FillButton href={`mailto:${profile.email}`} variant="outline" size="lg" block>
              {profile.email}
            </FillButton>
            <FillButton href="/work" size="lg" block>
              More work ({more})
            </FillButton>
          </div>
        </Group>

        <Group title="RoundButton: sm / md / lg, Magnetic on fine pointer">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <Magnetic>
              <RoundButton size="sm" aria-label="Open menu">
                <Burger />
              </RoundButton>
            </Magnetic>
            <Magnetic>
              <RoundButton href="#showcase" size="md">
                About me
              </RoundButton>
            </Magnetic>
            <Magnetic>
              <RoundButton href={`mailto:${profile.email}`} size="lg">
                Get in touch
              </RoundButton>
            </Magnetic>
            <RoundButton variant="outline" size="md">
              Outline
            </RoundButton>
          </div>
        </Group>

        <Group title="Chip (static) and ChipToggle (aria-pressed)">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="solid" dot>
              {profile.availability.label}
            </Chip>
            {publications.map((p) => (
              <Chip key={p.title}>{p.statusLabel}</Chip>
            ))}
            <Chip>
              <ArrowDownRight className="size-3.5" />
              {profile.role}
            </Chip>
          </div>
          <div className="mt-5">
            <FilterDemo
              counts={{
                all: projects.length,
                fullstack: projects.filter((p) => p.type === "fullstack").length,
                ml: projects.filter((p) => p.type === "ml").length,
              }}
            />
          </div>
        </Group>
      </div>
    </section>
  );
}

export function Showcase({ content }: { content: SiteContent }) {
  const { projects, profile } = content;

  return (
    <section id="showcase" aria-labelledby="showcase-title" className="px-gutter py-section">
      <p className="type-label">Review only, removed in work plan 1.3</p>
      <h2 id="showcase-title" className="mt-2 type-heading">
        Folio primitives
      </h2>

      <div className="mt-10 grid gap-6">
        <ButtonsOn surface="surface-paper" name="paper" content={content} />
        <ButtonsOn surface="surface-ink" name="ink" content={content} />
        <ButtonsOn surface="surface-lime" name="lime" content={content} />
      </div>

      <section aria-labelledby="showcase-type" className="mt-16">
        <h3 id="showcase-type" className="type-heading">
          Type
        </h3>
        <div className="mt-8 grid gap-8">
          <Group title="type-marquee: wdth 75, uppercase, hero name only (decorative copy)">
            <div className="overflow-x-clip">
              <p aria-hidden="true" className="type-marquee whitespace-nowrap text-[28vw] md:text-[17vw]">
                {profile.name} —
              </p>
            </div>
          </Group>
          <Group title="type-display">
            <p className="type-display">Let&rsquo;s work together</p>
          </Group>
          <Group title="type-heading">
            <p className="max-w-[24ch] type-heading">{profile.intro}</p>
          </Group>
          <Group title="type-title">
            <p className="type-title">{projects[0].name}</p>
          </Group>
          <Group title="type-lead">
            <p className="max-w-[60ch] type-lead">{profile.about}</p>
          </Group>
        </div>
      </section>

      <section aria-labelledby="showcase-rows" className="mt-16">
        <h3 id="showcase-rows" className="type-heading">
          Rows on paper
        </h3>
        <RowList label="Projects as rows" className="mt-8">
          {projects.slice(0, 3).map((p) => (
            <Row key={p.slug} href={p.url} external name={p.name} kind={p.kind} year={p.year} />
          ))}
        </RowList>
      </section>

      <section aria-labelledby="showcase-curves" className="mt-16">
        <h3 id="showcase-curves" className="type-heading">
          CurvedEdge
        </h3>
        <div className="mt-8">
          <div className="relative z-[1] surface-paper px-5 pt-10 pb-6 md:px-10">
            <p className="type-label">edge=&quot;bottom&quot;, paper into ink</p>
            <CurvedEdge edge="bottom" fill="var(--paper)" />
          </div>
          <div className="surface-ink px-5 pt-[calc(7svh_+_2rem)] pb-[calc(7svh_+_2rem)] md:px-10 md:pt-[calc(12svh_+_2rem)] md:pb-[calc(12svh_+_2rem)]">
            <p className="type-label">Ink section between the curves</p>
          </div>
          <div className="relative surface-paper">
            <CurvedEdge edge="top" fill="var(--paper)" />
            <p className="px-5 py-10 type-label md:px-10">edge=&quot;top&quot;, paper rising into ink</p>
          </div>
        </div>
      </section>
    </section>
  );
}
