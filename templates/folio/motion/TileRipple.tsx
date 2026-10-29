"use client";

import { useEffect } from "react";
import { FINE_POINTER_QUERY, REDUCED_MOTION_QUERY } from "./media";

// Liquid hover on project tiles (work plan 6.9, guide §12), the first-load part: one delegated
// `pointerover` listener and nothing else. Mount it once next to a list of <Tile>s (tiles opt in
// with `data-ripple`). The first mouse entry into a tile, with a fine pointer and motion allowed,
// imports the WebGL code (tile-ripple-gl.ts) and hands it the tile; touch, pens on a touch
// screen, reduced motion and no-WebGL never load it, and the CSS hover zoom stays as it is.

type Gl = typeof import("./tile-ripple-gl");

let gl: Promise<Gl> | null = null;
let mounts = 0;

function onOver(e: PointerEvent) {
  if (e.pointerType === "touch") return;
  const tile = (e.target as Element).closest?.<HTMLElement>("[data-ripple]");
  // Only the entry into a tile, not moves between its children.
  if (!tile || tile.contains(e.relatedTarget as Node | null)) return;
  if (!matchMedia(FINE_POINTER_QUERY).matches || matchMedia(REDUCED_MOTION_QUERY).matches) return;
  const { clientX: x, clientY: y } = e;
  gl ??= import("./tile-ripple-gl");
  gl.then(
    (m) => m.enter(tile, x, y),
    () => (gl = null), // offline or a new deploy: try again on the next entry
  );
}

export function TileRipple() {
  useEffect(() => {
    if (mounts++ === 0) document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      if (--mounts > 0) return;
      document.removeEventListener("pointerover", onOver);
      gl?.then((m) => m.reset(), () => {});
    };
  }, []);
  return null;
}
