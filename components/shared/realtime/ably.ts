// The Ably SDK side of components/shared/realtime/core.ts, in its own lazy chunk. Uses the
// tree-shakable `ably/modular` build with only what we need: WebSocket transport, fetch (to swap
// the TokenRequest for a token) and presence. JSON wire format (no MsgPack), no REST, no crypto.

import type { InboundMessage, PresenceMessage, TokenDetails, TokenParams, TokenRequest } from "ably";
import { BaseRealtime, FetchRequest, RealtimePresence, WebSocketTransport } from "ably/modular";

export type Member = { id: string; home: boolean };

export type Sub = { channel: string; event: string; cb: (data: unknown, clientId: string | undefined) => void };

export type Handle = {
  add(sub: Sub): void;
  remove(sub: Sub): void;
  publish(channel: string, event: string, data: unknown): void;
  setHome(on: boolean): void;
  /** The current token, to reuse on the next connection while it is still valid. */
  token(): unknown;
  close(): void;
};

type OpenOptions = {
  token: unknown;
  home: boolean;
  visitorsChannel: string;
  subs: Iterable<Sub>;
  onMembers: (members: Member[], self: string | null) => void;
  onFatal: () => void;
};

const TOKEN_URL = "/api/realtime/token";

const noop = () => {};

function reusable(token: unknown): TokenDetails | undefined {
  const t = token as TokenDetails | undefined;
  return t && typeof t.expires === "number" && t.expires - Date.now() > 60_000 ? t : undefined;
}

const presenceData = (home: boolean) => ({ h: home ? 1 : 0 });

export function open({ token, home, visitorsChannel, subs, onMembers, onFatal }: OpenOptions): Handle {
  let closed = false;
  const fatal = () => {
    if (!closed) onFatal();
  };

  const client = new BaseRealtime({
    plugins: { WebSocketTransport, FetchRequest, RealtimePresence },
    tokenDetails: reusable(token),
    authCallback: (
      _params: TokenParams,
      callback: (error: string | null, token: TokenRequest | TokenDetails | null) => void,
    ) => {
      fetch(TOKEN_URL, { cache: "no-store", credentials: "same-origin" })
        .then(async (response) => {
          // 404: realtime is off on the server (key removed). Stop for this page view, don't retry.
          if (response.status === 404) fatal();
          if (!response.ok) throw new Error(`token HTTP ${response.status}`);
          callback(null, (await response.json()) as TokenRequest);
        })
        .catch((error: unknown) => callback(error instanceof Error ? error.message : "token error", null));
    },
    // Our own cursor messages never come back to us: saves one delivery per publish.
    echoMessages: false,
    logLevel: 0,
  });
  client.connection.on("failed", fatal);

  // Presence: who is here (unique client ids) and which of them are on Home with live cursors.
  const visitors = client.channels.get(visitorsChannel);
  const refresh = () => {
    visitors.presence
      .get()
      .then((list: PresenceMessage[]) => {
        if (closed) return;
        const byId = new Map<string, boolean>();
        for (const p of list) {
          if (!p.clientId) continue;
          const onHome = (p.data as { h?: number } | undefined)?.h === 1;
          byId.set(p.clientId, (byId.get(p.clientId) ?? false) || onHome);
        }
        onMembers(
          [...byId].map(([id, h]) => ({ id, home: h })),
          client.auth.clientId ?? null,
        );
      })
      .catch(noop);
  };
  visitors.presence.subscribe(refresh).catch(noop);
  visitors.presence.enter(presenceData(home)).catch(noop);

  // Channel subscriptions, with a per-channel count so idle channels detach (Ably's free plan caps
  // concurrent channels at 200 account-wide).
  const listeners = new Map<Sub, (message: InboundMessage) => void>();
  const perChannel = new Map<string, number>();

  const add = (sub: Sub) => {
    if (listeners.has(sub)) return;
    const listener = (message: InboundMessage) => sub.cb(message.data, message.clientId);
    listeners.set(sub, listener);
    perChannel.set(sub.channel, (perChannel.get(sub.channel) ?? 0) + 1);
    client.channels.get(sub.channel).subscribe(sub.event, listener).catch(noop);
  };

  const remove = (sub: Sub) => {
    const listener = listeners.get(sub);
    if (!listener) return;
    listeners.delete(sub);
    const channel = client.channels.get(sub.channel);
    channel.unsubscribe(sub.event, listener);
    const left = (perChannel.get(sub.channel) ?? 1) - 1;
    perChannel.set(sub.channel, left);
    if (left === 0 && sub.channel !== visitorsChannel) channel.detach().catch(noop);
  };

  for (const sub of subs) add(sub);

  return {
    add,
    remove,
    publish: (channel, event, data) => {
      client.channels.get(channel).publish(event, data).catch(noop);
    },
    setHome: (on) => {
      visitors.presence.update(presenceData(on)).catch(noop);
    },
    // Not in Ably's public types but present at runtime (ably-js 2.x). reusable() checks its shape,
    // so if it ever disappears the next connection simply fetches a new token.
    token: () => (client.auth as unknown as { tokenDetails?: unknown }).tokenDetails,
    close: () => {
      closed = true;
      // Closing the connection makes our presence member leave at once for everyone else.
      client.close();
    },
  };
}
