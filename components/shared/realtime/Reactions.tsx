"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MAX_CLAPS_PER_REQUEST, REACTION_COUNT_EVENT, reactionsChannel } from "@/lib/realtime/channels";

/**
 * 👏 on a case study (work plan 6.5). Taps go to OUR server (/api/reactions/{slug}), which checks
 * the slug, rate limits per visitor and stores the total in MongoDB, then publishes it over Ably so
 * every open copy of the page sees it rise. The count shows optimistically; quick taps are batched
 * into one request (up to MAX_CLAPS_PER_REQUEST).
 *
 * Renders nothing when realtime is off or the build had no database, and hides itself if the
 * count can't be loaded. Works without the live connection (Save-Data, hidden tab): you just don't
 * see other people's taps until the next load.
 *
 * Markup for styling: `div[data-reactions="loading|ready|limited"].{className}` > `button` (≥ 44 px,
 * accessible name) + `span[aria-live]` with the total. Rendered on the server, so it takes its
 * space from the first paint (no layout shift when the count arrives).
 */
export function Reactions({ slug, className }: Props) {
  return Clap ? <Clap slug={slug} className={className} /> : null;
}

type Props = { slug: string; className?: string };

type Status = "loading" | "ready" | "limited" | "hidden";

const BATCH_MS = 600;

const BUTTON: CSSProperties = { minWidth: 44, minHeight: 44 };
const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

type SetTotal = (update: (t: number | null) => number | null) => void;

// Totals only ever grow, so the larger value wins whichever arrives first (GET, POST or Ably).
function raiseTotal(setTotal: SetTotal, value: unknown): void {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    setTotal((t) => Math.max(t ?? 0, value));
  }
}

// Build-time flags (next.config.ts). The bundler resolves this `if` before following imports, so
// with either flag "off" this code and the lazy chunks it loads (./core, ./ably) are never built.
let Clap: ((props: Props) => ReactNode) | null = null;
if (process.env.NEXT_PUBLIC_REALTIME === "on" && process.env.NEXT_PUBLIC_REACTIONS === "on") {
  Clap = function Clap({ slug, className }: Props) {
    const [status, setStatus] = useState<Status>("loading");
    const [total, setTotal] = useState<number | null>(null);
    const [pending, setPending] = useState(0);
    const queued = useRef(0);
    const inFlight = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const url = `/api/reactions/${encodeURIComponent(slug)}`;

    useEffect(() => {
      const raise = (value: unknown) => raiseTotal(setTotal, value);
      const abort = new AbortController();
      fetch(url, { signal: abort.signal })
        .then((r) => (r.ok ? (r.json() as Promise<{ count?: unknown }>) : Promise.reject(new Error(String(r.status)))))
        .then((body) => {
          raise(body.count);
          setStatus((s) => (s === "loading" ? "ready" : s));
        })
        .catch(() => {
          if (!abort.signal.aborted) setStatus("hidden");
        });

      // Live totals from everyone else, over the shared connection (lazy chunk).
      let stop: (() => void) | undefined;
      let cancelled = false;
      import("./core")
        .then(({ retain, listen }) => {
          if (cancelled) return;
          const release = retain();
          const unlisten = listen(reactionsChannel(slug), REACTION_COUNT_EVENT, (data) =>
            raise((data as { c?: unknown })?.c),
          );
          stop = () => {
            unlisten();
            release();
          };
        })
        .catch(() => {});

      return () => {
        abort.abort();
        cancelled = true;
        stop?.();
      };
    }, [slug, url]);

    // Send what's queued; claps tapped meanwhile wait for the next request.
    function flush() {
      clearTimeout(timer.current);
      timer.current = undefined;
      if (inFlight.current || queued.current === 0) return;
      const n = Math.min(queued.current, MAX_CLAPS_PER_REQUEST);
      queued.current -= n;
      inFlight.current = true;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n }),
        // Finishes even if the visitor navigates away right after tapping.
        keepalive: true,
      })
        .then(async (r) => {
          if (r.ok) raiseTotal(setTotal, ((await r.json()) as { count?: unknown }).count);
          else if (r.status === 429) {
            queued.current = 0;
            setPending(0);
            setStatus("limited");
          }
        })
        .catch(() => {})
        .finally(() => {
          // Confirmed claps are now in the total; failed ones simply disappear (optimistic undo).
          setPending((p) => Math.max(0, p - n));
          inFlight.current = false;
          if (queued.current > 0) timer.current = setTimeout(flush, BATCH_MS);
        });
    }

    function tap() {
      if (status !== "ready") return;
      queued.current += 1;
      setPending((p) => p + 1);
      if (queued.current >= MAX_CLAPS_PER_REQUEST) flush();
      else timer.current ??= setTimeout(flush, BATCH_MS);
    }

    // Unsent claps go out when the component unmounts (client-side navigation).
    const flushRef = useRef(flush);
    useEffect(() => {
      flushRef.current = flush;
    });
    useEffect(() => () => flushRef.current(), []);

    if (status === "hidden") return null;
    const shown = total === null ? null : total + pending;

    return (
      <div className={className} data-reactions={status}>
        <button
          type="button"
          onClick={tap}
          disabled={status !== "ready"}
          aria-label="Applaud this case study"
          style={BUTTON}
        >
          <span aria-hidden="true">👏</span>
        </button>
        <span aria-live="polite" aria-atomic="true">
          {shown}
          {shown !== null ? <span style={VISUALLY_HIDDEN}> {shown === 1 ? "clap" : "claps"}</span> : null}
          {status === "limited" ? <span style={VISUALLY_HIDDEN}> Thanks, that’s plenty for now.</span> : null}
        </span>
      </div>
    );
  };
}
