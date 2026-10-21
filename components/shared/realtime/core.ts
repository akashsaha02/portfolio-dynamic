// The one realtime connection per tab, shared by LiveVisitors, Reactions and LiveCursors
// (guide §10 mobile rules). Loaded lazily by those components (never in first-load JS), and it
// loads the Ably SDK (./ably.ts, a separate chunk) only when ALL of these hold:
//   - at least one component wants the connection (refcount);
//   - the page has been idle once (requestIdleCallback, setTimeout fallback): the page never waits;
//   - the tab is visible: hidden closes the connection, visible opens it again (the token is reused
//     while valid, so a tab switch costs no token request);
//   - not Save-Data, and realtime didn't fail fatally (e.g. the token route answered 404).
// Components talk to this module only; Ably types stay in ./ably.ts.

import { VISITORS_CHANNEL } from "@/lib/realtime/channels";
import type { Handle, Member, Sub } from "./ably";

export type { Member };

type MembersListener = (members: readonly Member[], self: string | null) => void;

let refs = 0;
let homeRefs = 0;
let started = false;
let idle = false;
let dead = false;
let handle: Handle | null = null;
let opening = false;
let token: unknown;

let members: readonly Member[] = [];
let self: string | null = null;

const subs = new Set<Sub>();
const watchers = new Set<MembersListener>();

function wanted(): boolean {
  return idle && !dead && refs > 0 && document.visibilityState === "visible";
}

function setMembers(next: readonly Member[], id: string | null): void {
  members = next;
  self = id;
  for (const watcher of watchers) watcher(members, self);
}

function close(): void {
  if (!handle) return;
  token = handle.token();
  handle.close();
  handle = null;
  setMembers([], null);
}

function sync(): void {
  if (!wanted()) return close();
  if (handle || opening) return;
  opening = true;
  import("./ably")
    .then(({ open }) => {
      if (!wanted() || handle) return;
      handle = open({
        token,
        home: homeRefs > 0,
        visitorsChannel: VISITORS_CHANNEL,
        subs,
        onMembers: setMembers,
        onFatal: () => {
          dead = true;
          close();
        },
      });
    })
    .catch(() => {
      // Chunk failed to load (offline, deploy swapped chunks): try again on the next visibility change.
    })
    .finally(() => {
      opening = false;
    });
}

function start(): void {
  if (started) return;
  started = true;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) {
    dead = true;
    return;
  }
  document.addEventListener("visibilitychange", sync);
  const ready = () => {
    idle = true;
    sync();
  };
  if ("requestIdleCallback" in window) requestIdleCallback(ready, { timeout: 4000 });
  else setTimeout(ready, 2000);
}

/** Ask for the connection; call the returned function to release it (effect cleanup). */
export function retain(): () => void {
  refs++;
  start();
  sync();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    refs--;
    sync();
  };
}

/** Site-wide presence (one member per tab, self included). Called now and on every change. */
export function watchMembers(listener: MembersListener): () => void {
  watchers.add(listener);
  listener(members, self);
  return () => {
    watchers.delete(listener);
  };
}

/** Listen to one event on a channel while connected (re-attached automatically after reconnects). */
export function listen(channel: string, event: string, cb: Sub["cb"]): () => void {
  const sub: Sub = { channel, event, cb };
  subs.add(sub);
  handle?.add(sub);
  return () => {
    subs.delete(sub);
    handle?.remove(sub);
  };
}

/** Fire-and-forget publish; dropped while not connected. Only the cursors channel allows it. */
export function publish(channel: string, event: string, data: unknown): void {
  handle?.publish(channel, event, data);
}

/** Marks this tab as "on Home with live cursors" in presence, so peers know whom to draw for. */
export function setHome(on: boolean): void {
  homeRefs = Math.max(0, homeRefs + (on ? 1 : -1));
  handle?.setHome(homeRefs > 0);
}
