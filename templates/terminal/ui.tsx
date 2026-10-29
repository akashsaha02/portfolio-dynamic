import Link from "next/link";
import type { ReactNode } from "react";
import type { Project } from "@/lib/content-types";
import { ExternalLink, projectHref } from "../index/ui";

// Terminal primitives: the prompt line, prompt-style sections, links. Server Components only.
// The prompt text (`akash@portfolio:~$ cat about.md`) is decoration: real, selectable text on
// screen but aria-hidden, so a screen reader hears the heading under it, not the command.

/** The prompt's user@host. Decorative. */
export const HOST = "akash@portfolio";

type PromptProps = {
  /** What was "typed" after the `$`, e.g. "cat about.md". */
  cmd?: string;
  /** Working directory shown before the `$`. */
  cwd?: string;
  /** A block caret after the command; it blinks only without prefers-reduced-motion. */
  caret?: boolean;
  className?: string;
};

export function Prompt({ cmd, cwd = "~", caret, className = "" }: PromptProps) {
  return (
    <p aria-hidden="true" className={`t-prompt ${className}`}>
      <span className="text-lime">{HOST}</span>:<span className="t-cwd">{cwd}</span>$ {cmd}
      {caret ? <span className="t-caret" /> : null}
    </p>
  );
}

/** Page h1 and section h2. The leading `#`/`##` is a markdown mark drawn by terminal.css. */
export const H1 = "t-h1 mt-3 text-3xl leading-tight font-bold sm:text-4xl";
export const H2 = "t-h2 mt-3 text-xl leading-snug font-bold";

type BlockProps = {
  id: string;
  cmd: string;
  cwd?: string;
  title: ReactNode;
  className?: string;
  children?: ReactNode;
};

/** A section that opens with a prompt line and a real h2 under it. */
export function Block({ id, cmd, cwd, title, className = "", children }: BlockProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`mt-20 md:mt-24 ${className}`}>
      <Prompt cmd={cmd} cwd={cwd} />
      <h2 id={`${id}-title`} className={H2}>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Body copy width, and the muted tone (6.6:1 on ink). */
export const PROSE = "max-w-[65ch] leading-relaxed text-pretty";
export const MUTED = "text-(--fg-muted)";

/** Underlined text link, inverted on a fine-pointer hover (terminal.css). */
export const LINK = "t-a inline-flex min-h-11 min-w-11 items-center";

/** A trailing "↗" for links that leave the site. Decorative: ExternalLink says so in words. */
export function Out() {
  return (
    <span aria-hidden="true" className="ml-1">
      ↗
    </span>
  );
}

/** Internal link, or a new-tab link with "↗" when `external`. */
export function AnyLink({
  href,
  external,
  className = LINK,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return external ? (
    <ExternalLink href={href} className={className}>
      {children}
      <Out />
    </ExternalLink>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

type StackProps = {
  items: string[];
  /** The visible key, e.g. "stack" or "skills". Decorative. */
  label?: string;
  /** What a screen reader hears instead of the key. */
  srLabel?: string;
  className?: string;
};

/** `stack: React, Node.js, Stripe` as one muted line. Nothing when empty. */
export function Stack({ items, label = "stack", srLabel = "Built with ", className = "" }: StackProps) {
  if (!items.length) return null;
  return (
    <p className={`${MUTED} ${className}`}>
      <span aria-hidden="true" className="text-lime">
        {label}:{" "}
      </span>
      <span className="sr-only">{srLabel}</span>
      {items.join(", ")}
    </p>
  );
}

/** A project's main link: a case study opens in place (drawn as a directory, `name/`), anything
 * else goes to the live site or repo in a new tab. */
export function ProjectLink({ project, className }: { project: Project; className?: string }) {
  const { href, external } = projectHref(project);
  return (
    <AnyLink href={href} external={external} className={className}>
      {project.name}
      {external ? null : (
        <>
          <span aria-hidden="true">/</span>
          <span className="sr-only"> case study</span>
        </>
      )}
    </AnyLink>
  );
}
