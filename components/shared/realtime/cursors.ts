// Live cursors on Home (work plan 6.9), loaded lazily by LiveCursors.tsx on fine-pointer devices
// without reduced motion. Plain DOM, no React re-renders: positions arrive up to 10×/s per peer.
//
// Quota (Ably free: 6M messages/month, 250K/hour, 50 publishes/s per channel, 50 messages/s per
// connection; docs/ops/free-tier.md): cursor traffic grows with the square of the people on Home,
// because each publish is delivered to every other peer. So each browser computes the same rate
// from presence (N = tabs on Home with cursors on, itself included):
//   rate = min(10/s, floor(50 / N²))  → N=2: 10/s, 3: 5/s, 4: 3/s, 5: 2/s, 6-7: 1/s, ≥ 8: paused
// which keeps the whole channel at ≤ 50 messages/s including fan-out. Nothing is published while
// alone, while the pointer is still or outside the window, or after 6,000 publishes in one page
// view (10 min of non-stop movement at the top rate).
//
// These publishes go from the browser straight to Ably, without a server check (the only ones:
// the token allows publish on the cursors channel only). A hostile client could ignore these rules
// up to Ably's per-connection limit (50/s); that is the accepted trade-off, see free-tier.md.

import { CURSORS_CHANNEL } from "@/lib/realtime/channels";
import { listen, publish, retain, setHome, watchMembers } from "./core";

const MOVE = "m";
const GONE = "g";

const MAX_RATE = 10;
const CHANNEL_BUDGET = 50;
const MAX_PUBLISHES = 6000;
const MAX_SHOWN = 10;
const STALE_MS = 60_000;

/** Wire format: viewport-normalised position as integers 0..1000 (`[x, y]`), to keep messages tiny. */
const SCALE = 1000;

const ARROW =
  '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 1.5 15 8l-6 1.6L6.2 16Z" fill="currentColor" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';

const clampUnit = (v: number) => Math.min(SCALE, Math.max(0, v));

function hue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export function mountCursors(): () => void {
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.liveCursors = "";
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2147483000;contain:strict";
  document.body.append(layer);

  const cursors = new Map<string, { el: HTMLElement; seen: number }>();
  let peers = new Set<string>();
  let interval = 0; // ms between our publishes; 0 = don't publish
  let sent = 0;
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let next: [number, number] | null = null;
  let inside = false;

  const drop = (id: string) => {
    cursors.get(id)?.el.remove();
    cursors.delete(id);
  };

  const release = retain();
  setHome(true);

  const unwatch = watchMembers((members, self) => {
    peers = new Set(members.filter((m) => m.home && m.id !== self).map((m) => m.id));
    const n = peers.size + 1;
    const rate = Math.min(MAX_RATE, Math.floor(CHANNEL_BUDGET / (n * n)));
    interval = peers.size > 0 && rate >= 1 ? 1000 / rate : 0;
    for (const id of [...cursors.keys()]) if (!peers.has(id)) drop(id);
  });

  const onPeerMove = (data: unknown, id: string | undefined) => {
    if (!id || !peers.has(id) || !Array.isArray(data) || data.length !== 2) return;
    const [x, y] = data as unknown[];
    if (typeof x !== "number" || typeof y !== "number") return;
    let cursor = cursors.get(id);
    if (!cursor) {
      if (cursors.size >= MAX_SHOWN) return;
      const el = document.createElement("div");
      el.dataset.cursor = "";
      // Glides between updates for as long as one update interval lasts (peers share the rate).
      el.style.cssText = `position:absolute;left:0;top:0;opacity:0;will-change:transform;color:hsl(${hue(id)} 70% 48%);transition:transform ${Math.min(interval || 100, 500)}ms linear,opacity .2s`;
      el.innerHTML = ARROW;
      layer.append(el);
      cursor = { el, seen: 0 };
      cursors.set(id, cursor);
    }
    cursor.seen = Date.now();
    cursor.el.style.transform = `translate(${(clampUnit(x) / SCALE) * innerWidth}px,${(clampUnit(y) / SCALE) * innerHeight}px)`;
    cursor.el.style.opacity = "1";
  };

  const unlisten = [
    listen(CURSORS_CHANNEL, MOVE, onPeerMove),
    listen(CURSORS_CHANNEL, GONE, (_data, id) => {
      if (id) drop(id);
    }),
  ];

  const sweep = setInterval(() => {
    const cutoff = Date.now() - STALE_MS;
    for (const [id, c] of cursors) if (c.seen < cutoff) drop(id);
  }, 10_000);

  const send = () => {
    timer = undefined;
    if (!next || !interval || sent >= MAX_PUBLISHES) return;
    publish(CURSORS_CHANNEL, MOVE, next);
    next = null;
    sent++;
    last = performance.now();
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    next = [
      Math.round(clampUnit((event.clientX / innerWidth) * SCALE)),
      Math.round(clampUnit((event.clientY / innerHeight) * SCALE)),
    ];
    inside = true;
    if (!timer && interval && sent < MAX_PUBLISHES) {
      timer = setTimeout(send, Math.max(0, last + interval - performance.now()));
    }
  };

  const onLeave = () => {
    clearTimeout(timer);
    timer = undefined;
    next = null;
    if (!inside) return;
    inside = false;
    if (interval) publish(CURSORS_CHANNEL, GONE, null);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("blur", onLeave);

  return () => {
    onLeave();
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("blur", onLeave);
    clearInterval(sweep);
    for (const off of unlisten) off();
    unwatch();
    setHome(false);
    release();
    layer.remove();
  };
}
