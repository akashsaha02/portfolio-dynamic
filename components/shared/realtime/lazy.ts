// Loads ./core (a lazy chunk) for an effect and runs `setup` with it. Returns the effect cleanup:
// it undoes `setup`, or cancels it if the chunk hasn't arrived yet. Keeps first-load JS tiny: the
// components ship only their markup and this function; everything else arrives after hydration.

type Core = typeof import("./core");

export function withCore(setup: (core: Core) => () => void): () => void {
  let stop: (() => void) | undefined;
  let cancelled = false;
  import("./core")
    .then((core) => {
      if (!cancelled) stop = setup(core);
    })
    .catch(() => {
      // Offline or a stale deployment: realtime is decoration, the page carries on without it.
    });
  return () => {
    cancelled = true;
    stop?.();
  };
}
