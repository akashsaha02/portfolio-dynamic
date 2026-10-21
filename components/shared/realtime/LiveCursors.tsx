"use client";

import { useEffect } from "react";

/**
 * Other visitors' cursors on Home (work plan 6.9). Decorative: an `aria-hidden`, pointer-events-none
 * overlay that ./cursors.ts adds to <body> (`div[data-live-cursors]`, one `div[data-cursor]` per
 * visitor), so this component renders nothing itself. Only with a fine pointer that can hover, and
 * never with reduced motion; it stops if either changes. Quota rules (rate, caps) live in
 * ./cursors.ts and docs/ops/free-tier.md.
 */
export function LiveCursors() {
  return Cursors ? <Cursors /> : null;
}

// Build-time flag (next.config.ts). The bundler resolves this `if` before it follows imports, so
// with "off" the lazy chunks below are never built or referenced.
let Cursors: (() => null) | null = null;
if (process.env.NEXT_PUBLIC_REALTIME === "on") {
  Cursors = function Cursors() {
    useEffect(() => {
      const fine = matchMedia("(hover: hover) and (pointer: fine)");
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      let stop: (() => void) | undefined;
      let loading = false;
      let cancelled = false;

      const update = () => {
        const allowed = fine.matches && !reduced.matches;
        if (!allowed) {
          stop?.();
          stop = undefined;
          return;
        }
        if (stop || loading) return;
        loading = true;
        import("./cursors")
          .then(({ mountCursors }) => {
            if (!cancelled && !stop && fine.matches && !reduced.matches) stop = mountCursors();
          })
          .catch(() => {})
          .finally(() => {
            loading = false;
          });
      };

      update();
      fine.addEventListener("change", update);
      reduced.addEventListener("change", update);
      return () => {
        cancelled = true;
        fine.removeEventListener("change", update);
        reduced.removeEventListener("change", update);
        stop?.();
      };
    }, []);

    return null;
  };
}
