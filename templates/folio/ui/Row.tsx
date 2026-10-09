import type { ReactNode } from "react";
import { Action } from "./Action";

// Hairline list rows, the fine-pointer desktop presentation of projects (guide §4.2 lg, §4.3):
// name (large) · kind · year. Each row is one real link. On a fine pointer, hovering a row dims
// the others and nudges name and meta apart (CSS only, folio.css). The cursor image modal joins
// in work plan 1.4; the rows work without it. On narrow screens the row stacks, so it stays
// usable anywhere, but phones and touch should get <Tile>s.

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
};

export function Row({ href, name, kind, year, external }: RowProps) {
  return (
    <li>
      <Action
        href={href}
        external={external}
        className="f-row-link grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-t border-(--rule) py-6 md:py-8 lg:grid-cols-12 lg:items-center lg:px-6 lg:py-11"
      >
        <span className="f-row-name col-span-2 type-title lg:col-span-7">{name}</span>
        <span className="f-row-meta type-label lg:col-span-3 lg:text-base">{kind}</span>
        <span className="f-row-meta text-right type-label lg:col-span-2 lg:text-base">{year}</span>
      </Action>
    </li>
  );
}
