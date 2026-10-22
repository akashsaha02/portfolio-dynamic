"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Focus after a client navigation (guide §5 rule 12), as Folio's shell/FocusMain does: a soft
// navigation leaves focus on <body>, so after each pathname change (never on the first load)
// focus moves to the new page's `main#main` without scrolling, and the next Tab reaches the skip
// link first, as on a full load.

let lastPath: string | null = null;

export function FocusMain() {
  const pathname = usePathname();

  useEffect(() => {
    const first = lastPath === null;
    const changed = lastPath !== pathname;
    lastPath = pathname;
    if (first || !changed) return;
    const main = document.getElementById("main");
    if (main && !main.contains(document.activeElement)) main.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
