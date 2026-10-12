import type { ReactNode } from "react";
import type { Project } from "@/lib/content-types";
import { Action } from "../ui/Action";
import { Chip } from "../ui/Chip";
import { ArrowUpRight } from "../ui/icons";

// Case-study facts row (guide §4.4): Role · Stack · Year · Links, each a label over a hairline
// over its value (as on Dennis's case pages). Stacked on phone, four columns from md. Facts with
// no content are left out.

function isRepo(url: string) {
  return /^https:\/\/(www\.)?github\.com\//.test(url);
}

/** `url` is the live site, or the repo when there is no live site (content-types.ts). */
export function projectLinks(project: Pick<Project, "url" | "repo">) {
  const live = isRepo(project.url) || project.url === project.repo ? undefined : project.url;
  const code = project.repo ?? (isRepo(project.url) ? project.url : undefined);
  return { live, code };
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="border-b border-(--rule) pb-3 type-label md:pb-4">{label}</dt>
      <dd className="pt-3 md:pt-4">{children}</dd>
    </div>
  );
}

function FactLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Action
      href={href}
      external
      className="f-link -mx-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-lg font-medium"
    >
      {children}
      <ArrowUpRight />
    </Action>
  );
}

export function Facts({ project, role }: { project: Project; role: string }) {
  const { live, code } = projectLinks(project);

  return (
    <dl className="grid gap-y-7 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,0.5fr)_minmax(0,0.6fr)] md:gap-x-8 lg:gap-x-12">
      {role ? (
        <Fact label="Role">
          <p className="text-lg leading-snug text-pretty">{role}</p>
        </Fact>
      ) : null}
      {project.stack.length ? (
        <Fact label="Stack">
          <ul className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s}>
                <Chip>{s}</Chip>
              </li>
            ))}
          </ul>
        </Fact>
      ) : null}
      {project.year ? (
        <Fact label="Year">
          <p className="text-lg leading-snug">{project.year}</p>
        </Fact>
      ) : null}
      {live || code ? (
        <Fact label="Links">
          <ul className="-mt-2.5 flex flex-wrap gap-x-6 md:flex-col md:gap-2">
            {live ? (
              <li>
                <FactLink href={live}>
                  Live<span className="sr-only"> site</span>
                </FactLink>
              </li>
            ) : null}
            {code ? (
              <li>
                <FactLink href={code}>
                  Code<span className="sr-only"> repository</span>
                </FactLink>
              </li>
            ) : null}
          </ul>
        </Fact>
      ) : null}
    </dl>
  );
}
