"use client";

import { useEffect, useState } from "react";

// The page-transition curtain (work plan 6.9, guide §12, after dennissnellenberg.com): an ink
// screen with the destination page's name that rises over the old page and lifts off the new one.
// Every Folio page renders one, but it is display:none except during a view transition, and only
// on the page that a client navigation just mounted (`data-run`), which then gets the
// `f-curtain` view-transition-name. transitions.css animates that snapshot; the element itself is
// never seen outside a transition, so the first load, reduced motion and browsers without view
// transitions never show it.
//
// `data-run` is set when the curtain mounts after the site has already booted (a client
// navigation) and dropped once the transition is long over, so the old page's curtain is never
// captured by the next navigation. Decorative: aria-hidden; FocusMain moves focus to the new page.

/** Module scope, shared by every page's curtain: false until the first page has mounted. */
let booted = false;

/** Longer than the 700 ms transition, so `data-run` outlives it. */
const RUN_FOR = 1000;

export function PageCurtain({ title }: { title: string }) {
  const [run, setRun] = useState(() => booted);

  useEffect(() => {
    booted = true;
    if (!run) return;
    const timer = setTimeout(() => setRun(false), RUN_FOR);
    return () => clearTimeout(timer);
  }, [run]);

  return (
    <div aria-hidden="true" data-run={run ? "" : undefined} className="f-curtain surface-ink">
      <p className="f-curtain-title">
        <span className="f-dot" />
        {title}
      </p>
    </div>
  );
}
