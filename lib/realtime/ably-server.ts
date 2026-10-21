// Server side of Ably (guide §10): signs short-lived TokenRequests for browsers and publishes
// reaction totals over Ably's REST API. Both need only the root key and plain HTTPS/HMAC, so the
// `ably` SDK (which pulls in `ws`, `got`, ...) stays out of the server bundle.
//
// ABLY_API_KEY ("appId.keyId:keySecret") is read here only, at request time. It never reaches the
// browser: browsers get a TokenRequest signed with it, which Ably exchanges for a token that has
// only the capabilities below and expires within an hour.

import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { CURSORS_CHANNEL, REACTIONS_NAMESPACE, VISITORS_CHANNEL } from "./channels";

/** Token lifetime. Ably renews it through our token route when it runs out (tab open > 1 h). */
export const TOKEN_TTL_MS = 60 * 60 * 1000;

/** Ably's REST host (the ably-js v2 default endpoint). */
const REST_HOST = "https://main.realtime.ably.net";

export type AblyKey = { keyName: string; keySecret: string; raw: string };

/** Parses `appId.keyId:keySecret`; null when unset or malformed. */
export function parseAblyKey(raw: string | undefined): AblyKey | null {
  const value = raw?.trim();
  if (!value) return null;
  const colon = value.indexOf(":");
  if (colon <= 0 || colon === value.length - 1) return null;
  const keyName = value.slice(0, colon);
  if (!/^[\w-]+\.[\w-]+$/.test(keyName)) return null;
  return { keyName, keySecret: value.slice(colon + 1), raw: value };
}

/** The key, or null when realtime is off (build flag) or the key is missing at runtime. */
export function serverAblyKey(): AblyKey | null {
  if (process.env.NEXT_PUBLIC_REALTIME !== "on") return null;
  return parseAblyKey(process.env.ABLY_API_KEY);
}

/**
 * The narrowest capability set (Ably capability JSON, keys sorted for a canonical string):
 * - visitors: enter presence and see who is there (no publish);
 * - cursors: publish own position, receive others' (the only browser publishes, see free-tier.md);
 * - reactions: receive totals only; every count change goes through our server.
 * Nothing else: no history, no stats, no channel metadata, no push.
 */
export function browserCapability(): string {
  const capability: Record<string, string[]> = {
    [CURSORS_CHANNEL]: ["publish", "subscribe"],
    [`${REACTIONS_NAMESPACE}:*`]: ["subscribe"],
    [VISITORS_CHANNEL]: ["presence", "subscribe"],
  };
  const sorted = Object.fromEntries(Object.entries(capability).sort(([a], [b]) => a.localeCompare(b)));
  return JSON.stringify(sorted);
}

export type TokenRequest = {
  keyName: string;
  ttl: number;
  capability: string;
  clientId: string;
  timestamp: number;
  nonce: string;
  mac: string;
};

/** A random, anonymous client id: nothing about the visitor is in it. */
export function randomClientId(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * A signed Ably TokenRequest (Ably spec RSA9: HMAC-SHA256 over the newline-joined fields with the
 * key secret, base64). The browser hands it to Ably, which returns the actual token. Signing is
 * local: no call to Ably here.
 */
export function createTokenRequest(
  key: AblyKey,
  {
    clientId,
    capability = browserCapability(),
    ttl = TOKEN_TTL_MS,
    timestamp = Date.now(),
    nonce = randomBytes(16).toString("hex"),
  }: { clientId: string; capability?: string; ttl?: number; timestamp?: number; nonce?: string },
): TokenRequest {
  const text = [key.keyName, ttl, capability, clientId, timestamp, nonce, ""].join("\n");
  const mac = createHmac("sha256", key.keySecret).update(text).digest("base64");
  return { keyName: key.keyName, ttl, capability, clientId, timestamp, nonce, mac };
}

/**
 * Publishes one message over Ably REST with the root key. Resolves false on any failure (logged
 * without the key or payload): realtime is decoration, the caller's own work already succeeded.
 */
export async function publishMessage(key: AblyKey, channel: string, name: string, data: unknown): Promise<boolean> {
  try {
    const response = await fetch(`${REST_HOST}/channels/${encodeURIComponent(channel)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(key.raw).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, data }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) console.error(`[realtime] publish failed with HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`[realtime] publish failed (${error instanceof Error ? error.name : typeof error})`);
    return false;
  }
}
