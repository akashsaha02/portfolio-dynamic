"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Focus after a client navigation (guide §5 rule 12, QA F-04). A soft navigation leaves focus on
// <body>, so the next Tab would skip "Skip to content" and land on the logo. After every pathname
// change this moves focus to the new page's `main#main` (tabIndex -1, outline-none), so the next
// Tab reaches the skip link first, as on a full load. Never on the first load (the browser's own
// order is already right), never while the menu is open (the page is inert then), never on
// filter changes (?type=… keeps the pathname), and without scrolling: Next has already put the
// new page at the top.

// The pathname last seen by any Folio shell. Module scope, because each page mounts its own shell:
// a fresh shell after a navigation still knows it isn't the first load.
let lastPath: string | null = null;

export function FocusMain() {
  const pathname = usePathname();

  useEffect(() => {
    const first = lastPath === null;
    const changed = lastPath !== pathname;
    lastPath = pathname;
    if (first || !changed) return;
    const main = document.getElementById("main");
    if (!main || main.closest("[inert]") || main.contains(document.activeElement)) return;
    main.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
