// Lazy GSAP loader (guide §5 rule 11: no motion library in the initial bundle).
//
// Only type imports of "gsap" are allowed outside this file; the runtime arrives through the
// dynamic import() below, as its own chunk, after first paint. The promises are cached, so every
// primitive on the page shares one download and one plugin registration.
//
// Folio motion code can't use `useGSAP` from @gsap/react: that module imports gsap statically
// and would pull it into the first load. Use `useEffect` + `gsap.context(fn, scope)` and call
// `ctx.revert()` in the cleanup instead (same cleanup guarantees).

import type { gsap as GsapInstance } from "gsap";
import type { ScrollTrigger as ScrollTriggerPlugin } from "gsap/ScrollTrigger";

export type Gsap = typeof GsapInstance;
export type ScrollTriggerType = typeof ScrollTriggerPlugin;

let gsapPromise: Promise<Gsap> | null = null;
let scrollTriggerPromise: Promise<{ gsap: Gsap; ScrollTrigger: ScrollTriggerType }> | null = null;

/** Resolves with the gsap instance. Safe to call many times. Client only. */
export function loadGsap(): Promise<Gsap> {
  gsapPromise ??= import("gsap").then((m) => m.gsap);
  return gsapPromise;
}

/** Resolves with gsap and a registered ScrollTrigger. Client only. */
export function loadScrollTrigger(): Promise<{ gsap: Gsap; ScrollTrigger: ScrollTriggerType }> {
  scrollTriggerPromise ??= Promise.all([loadGsap(), import("gsap/ScrollTrigger")]).then(
    ([gsap, m]) => {
      gsap.registerPlugin(m.ScrollTrigger);
      return { gsap, ScrollTrigger: m.ScrollTrigger };
    },
  );
  return scrollTriggerPromise;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Runs `cb` once the browser has painted and is idle (Safari has no requestIdleCallback, so it
 * falls back to a short timeout after the next frame). Returns a cancel function for cleanups.
 */
export function onIdle(cb: () => void, timeout = 2000): () => void {
  const w = window as IdleWindow;
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const frame = requestAnimationFrame(() => {
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(cb, { timeout });
    else timer = setTimeout(cb, 200);
  });

  return () => {
    cancelAnimationFrame(frame);
    if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
    if (timer !== undefined) clearTimeout(timer);
  };
}
