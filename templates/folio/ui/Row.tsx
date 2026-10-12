import type { ReactNode } from "react";
import { Action } from "./Action";

// Hairline list rows, the fine-pointer desktop presentation of projects (guide §4.2 lg, §4.3):
// name (large) · kind · year. Each row is one real link. On a fine pointer, hovering a row dims
// the others and nudges name and meta apart (CSS only, folio.css). The cursor image modal joins
// in work plan 1.4; the rows work without it. On narrow screens the row stacks, so it stays
// usable anywhere, but phones and touch should get <Tile>s.
//
// With `stack` the row has four lg columns, Project · Kind · Stack · Year (the Work index, guide
// §4.3), on the ROW_COLUMNS_4 template so a header row can line up with it.

/** lg grid of the four-column row (name · kind · stack · year), shared with the header row. */
export const ROW_COLUMNS_4 =
  "lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,3fr)_minmax(4.5rem,auto)]";

export function RowList({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <ul aria-label={label} className={`f-rows border-b border-(--rule) ${className ?? ""}`}>
      {children}
    </ul>
  );
}

type RowProps = {
  href: string;
  name: string;
  kind: string;
  year: string;
  external?: boolean;
  /** Adds the lg Stack column, e.g. "Next.js, Prisma, Supabase". */
  stack?: string;
  /** Rendered as `data-group` on the <li>, for CSS filtering (Work index). */
  group?: string;
};

export function Row({ href, name, kind, year, external, stack, group }: RowProps) {
  const four = stack !== undefined;

  return (
    <li data-group={group}>
      <Action
        href={href}
        external={external}
        className={`f-row-link grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-t border-(--rule) py-6 md:py-8 lg:items-center lg:px-6 ${
          four ? `${ROW_COLUMNS_4} lg:py-9` : "lg:grid-cols-12 lg:py-11"
        }`}
      >
        <span
          className={`f-row-name col-span-2 type-title ${
            four ? "lg:col-span-1 lg:text-[clamp(2rem,0.75rem+2vw,3rem)]" : "lg:col-span-7"
          }`}
        >
          {name}
        </span>
        <span className={`f-row-meta type-label lg:text-base ${four ? "" : "lg:col-span-3"}`}>{kind}</span>
        {four ? <span className="f-row-meta hidden type-label lg:block lg:text-base">{stack}</span> : null}
        <span className={`f-row-meta text-right type-label whitespace-nowrap lg:text-base ${four ? "" : "lg:col-span-2"}`}>
          {year}
        </span>
      </Action>
    </li>
  );
}
