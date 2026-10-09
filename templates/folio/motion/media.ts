import { useSyncExternalStore } from "react";

// Media-query hooks for gating motion. They read matchMedia on the client and re-render when the
// query flips (a laptop with a touchscreen, an OS reduced-motion toggle). On the server, and
// during hydration, they return the conservative value: no fine pointer, reduced motion. So the
// first paint is always the static page and motion only ever arrives as an enhancement.

export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function mediaStore(query: string) {
  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  return { subscribe, getSnapshot };
}

const finePointer = mediaStore(FINE_POINTER_QUERY);
const reducedMotion = mediaStore(REDUCED_MOTION_QUERY);

/** True on devices with a mouse or trackpad. Gate cursor effects on this, never on width. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(finePointer.subscribe, finePointer.getSnapshot, () => false);
}

/** True when the user asks for reduced motion (and on the server, so SSR output is static). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(reducedMotion.subscribe, reducedMotion.getSnapshot, () => true);
}
