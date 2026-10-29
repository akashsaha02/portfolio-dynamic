import type { CSSProperties, ReactNode } from "react";

// Bento primitives: the card, its label, chips, icons and links. Server Components only.
// Colours come from the scheme variables in bento.css (paper by day, ink by night), so nothing
// here says "light" or "dark". Lime is a small accent: the availability dot, the primary button
// and chip text on dark; never text on a light surface.

type CardProps = {
  /** Element to render: <section> for labelled blocks, <article> for projects, <div> otherwise. */
  as?: "section" | "article" | "div" | "header" | "footer" | "aside" | "nav" | "li";
  /** A named area on the Home board (bento.css `.b-board`). */
  area?: string;
  /** Lifts under a fine pointer when its stretched link is hovered (bento.css `.b-lift`). */
  lift?: boolean;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  children: ReactNode;
};

export function Card({ as: Tag = "div", area, lift, className = "", children, ...rest }: CardProps) {
  const style: CSSProperties | undefined = area ? { gridArea: area } : undefined;
  return (
    <Tag {...rest} style={style} className={`b-card ${lift ? "b-lift" : ""} ${className}`}>
      {children}
    </Tag>
  );
}

/** Small uppercase label at the top of a card. */
export const LABEL = "text-xs font-semibold tracking-widest text-(--fg-muted) uppercase";

/** Page h1 on every page but Home. */
export const PAGE_TITLE = "text-4xl leading-tight font-semibold tracking-tight sm:text-5xl";

/** <main> of a subpage: a column of cards, two columns from md (`b-wide` spans both). */
export const PAGE_MAIN = "b-grid outline-none";

/** Text link with a trailing arrow, ≥ 44 px tall. */
export const TEXT_LINK = "b-link inline-flex min-h-11 items-center gap-1.5 font-medium";

/** The lime call to action. */
export const BUTTON = "b-btn inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold";

/** The outlined pill (email, résumé, "send another"). */
export const PILL = "b-pill inline-flex min-h-12 min-w-0 items-center justify-center rounded-full border px-6 font-medium";

/** "↗". Decorative: the link's text says where it goes. */
export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`b-arrow inline-block size-3.5 shrink-0 ${className}`}
    >
      <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
    </svg>
  );
}

/** "←" for back links. */
export function ArrowLeft() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="b-chip">{children}</span>;
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

/** The latest year in a display year: "2026" → 2026, "2024–25" → 2025. Unknown sorts last. */
export function latestYear(year: string) {
  const m = /(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/.exec(year);
  if (!m) return 0;
  if (!m[2]) return Number(m[1]);
  return Number(m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]);
}
