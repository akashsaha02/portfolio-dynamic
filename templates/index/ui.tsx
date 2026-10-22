import type { ReactNode } from "react";
import type { Project } from "@/lib/content-types";

// Index primitives: icons, chips, links. Server Components only. Lime is a small accent on ink
// (chips, the active nav line, hover titles); body text is paper (`on-ink`) or its muted tone.

/** "↗". Decorative: the link's text says where it goes. */
export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`i-arrow inline-block size-3.5 shrink-0 ${className}`}
    >
      <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
    </svg>
  );
}

/** "←" for back links. */
export function ArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`inline-block size-3.5 shrink-0 ${className}`}
    >
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-lime/10 px-3 py-1 text-xs leading-5 font-medium text-lime">
      {children}
    </span>
  );
}

/** A labelled list of chips (skills, stack). Nothing when empty. */
export function Chips({ items, label, className = "" }: { items: string[]; label: string; className?: string }) {
  if (!items.length) return null;
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}

/** Small uppercase eyebrow, the template's section label style. */
export const EYEBROW = "text-xs font-semibold tracking-widest uppercase";

/** Page h1 on every page but Home. */
export const PAGE_TITLE = "text-4xl leading-tight font-semibold tracking-tight sm:text-5xl";

/** <main> under the subpage header. */
export const PAGE_TOP = "pt-14 outline-none md:pt-24";

/** A link that opens in a new tab and says so to screen readers. */
export function ExternalLink({
  href,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel}>
      {children}
      {ariaLabel ? null : <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

/** Text link with a trailing arrow: lime and nudged on a fine pointer (index.css). */
export const TEXT_LINK = "i-link inline-flex min-h-11 items-center gap-1.5 font-medium";

function isRepo(url: string) {
  return /^https:\/\/(www\.)?github\.com\//.test(url);
}

/** `url` is the live site, or the repo when there is no live site (content-types.ts). */
export function projectLinks(project: Pick<Project, "url" | "repo">) {
  const live = isRepo(project.url) || project.url === project.repo ? undefined : project.url;
  const code = project.repo ?? (isRepo(project.url) ? project.url : undefined);
  return { live, code };
}

/** Case studies open in place; everything else goes to the live site (or repo) in a new tab. */
export function projectHref(project: Project) {
  return project.caseStudy ? { href: `/work/${project.slug}`, external: false } : { href: project.url, external: true };
}

/** "https://www.example.com/path" → "example.com", for link text in tables. */
export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
