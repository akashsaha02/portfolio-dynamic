import type { ReactNode } from "react";

// Brutal primitives: icons, stickers, chips, links, buttons and the page/section headings.
// Server Components only. The project link helpers are Index's (templates/index/ui.tsx), so both
// templates read `url` / `repo` the same way.

export { hostOf, projectHref, projectLinks } from "../index/ui";

/** "↗". Decorative: the link's text says where it goes. */
export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`inline-block size-3.5 shrink-0 ${className}`}
    >
      <path d="M4 12l8-8M5 4h7v7" />
    </svg>
  );
}

/** "←" for back links. */
export function ArrowLeft() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="inline-block size-3.5 shrink-0"
    >
      <path d="M14 8H3M7 3.5L2.5 8 7 12.5" />
    </svg>
  );
}

/** Sticker label. Paper unless a background class is passed (`bg-lime`, `bg-ink text-on-ink`). */
export function Tag({ children, className = "bg-paper" }: { children: ReactNode; className?: string }) {
  return <span className={`b-tag ${className}`}>{children}</span>;
}

/** A labelled list of stickers (skills, stack). Nothing when empty. */
export function Chips({ items, label, className = "" }: { items: string[]; label: string; className?: string }) {
  if (!items.length) return null;
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <li key={item}>
          <Tag>{item}</Tag>
        </li>
      ))}
    </ul>
  );
}

/** Bordered button with a hard shadow and the press offset (brutal.css). Add a background. */
export const BTN = "b-btn b-press";

/** <main> under the header. */
export const MAIN = "pt-10 outline-none md:pt-16";

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

/** The h1 of every page but Home: a sticker above, the oversized title, a thick rule under it. */
export function PageHead({
  tag,
  title,
  id,
  children,
}: {
  tag?: ReactNode;
  title: ReactNode;
  id?: string;
  children?: ReactNode;
}) {
  return (
    <div className="b-rule pb-8 md:pb-12">
      {tag ? <Tag className="b-tilt bg-lime">{tag}</Tag> : null}
      <h1 id={id} className={`b-display b-h1 ${tag ? "mt-4" : ""}`}>
        {title}
      </h1>
      {children ? <div className="mt-6 grid max-w-[60ch] gap-3 text-lg leading-snug text-pretty">{children}</div> : null}
    </div>
  );
}

/** A section with an oversized h2 on a thick rule. */
export function Section({
  id,
  title,
  className = "mt-16 md:mt-24",
  children,
}: {
  id: string;
  title: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={className}>
      <h2 id={`${id}-title`} className="b-display b-h2 b-rule pb-4">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
