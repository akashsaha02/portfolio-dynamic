import type { ReactNode } from "react";
import { NOTES, type NoteId } from "../annotations";

// A "how this was built" note (work plan 6.6). Server-rendered everywhere it applies and hidden
// by CSS until the reader turns annotations on (folio.css .f-note: display:none, so it is out of
// the accessibility tree too). Ink on paper, paper on ink, from the surface it sits on. Texts live
// in annotations.ts. `md` limits it to md+ (for things that only exist there, like the menu
// panel's curve); `className` places it (e.g. .f-note-hero).

type NoteProps = {
  id: NoteId;
  md?: boolean;
  className?: string;
};

export function Note({ id, md = false, className }: NoteProps) {
  return (
    <p role="note" className={`f-note ${md ? "f-note-md" : ""} ${className ?? ""}`}>
      <span className="f-note-label">
        <span aria-hidden="true" className="f-dot" />
        How it&rsquo;s built
      </span>
      <span className="block">{NOTES[id]}</span>
    </p>
  );
}

/** A row of notes; takes no space while annotations are off. */
export function Notes({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`f-notes ${className ?? ""}`}>{children}</div>;
}
